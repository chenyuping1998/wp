<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { featureTimeScale } from '../game/timeScale';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// pulse 0→1→0 at ~1.4 Hz
	let pulse = $state(0);

	// --- motion ---------------------------------------------------------------
	//
	// The old animation was a sine breathe: one scale wave at ~1.4Hz, forever.
	// It read as "this symbol is slowly inflating", not as "this symbol just
	// won", and review flagged animation quality directly. A win needs an
	// IMPACT and then life, so it is built as three separate things:
	//
	//   hit    a hard scale overshoot on arrival, easing back — the moment
	//   flash  a white copy of the symbol over itself, fading out of that moment
	//   life   a small rotation wobble and vertical bob for as long as it is lit
	//
	// Durations run through featureTimeScale(), so turbo shortens the beat
	// without flattening it. See game/timeScale.ts.
	const fs = (ms: number) => ms / featureTimeScale();

	const hit = new Tween(0.86, { duration: fs(220), easing: backOut });
	const flash = new Tween(0.85, { duration: fs(300), easing: cubicOut });
	// wobble/bob are driven off the same interval as the glow pulse, not their
	// own tween — they have to keep running for the whole hold, and a Tween that
	// finishes would just stop.
	let wobble = $state(0);

	// A short outward burst of sparks on the hit. Six is enough to read as a
	// burst at 132px without turning the cell into confetti; they are laid out on
	// a fixed ring so two adjacent winning cells do not produce the same pattern
	// twice by chance.
	const SPARKS = 6;
	const sparkAngles = Array.from(
		{ length: SPARKS },
		(_, i) => (i / SPARKS) * Math.PI * 2 + Math.random() * 0.5,
	);
	const spark = new Tween(0, { duration: fs(420), easing: cubicOut });

	// How long a winning cell stays lit before it reports done.
	//
	// This used to call oncomplete straight out of onMount, with a comment saying
	// it was to keep the state machine unblocked. The effect was that the marker
	// was destroyed about one frame after it appeared: Board.svelte sets the cell
	// to 'win', awaits oncomplete, and sets 'postWinStatic' — so resolving during
	// mount meant the next microtask tore the animation down. Nobody had ever
	// seen this animation, and thirty screenshots across a winning round caught
	// zero frames of it, which is what finally gave it away.
	//
	// Nothing hangs by holding. WinLines.svelte fires the event with `broadcast`,
	// which does not await, and the only awaiting caller is the scatter-trigger
	// celebration in bookEventHandlerMap — where the three passes were likewise
	// three instant no-ops and now actually read as three shakes. Both callers
	// already filter out padding rows, which is the case the original comment was
	// really guarding against.
	//
	// 480ms is picked against those two: it is long enough to read on a line win
	// as the runner crosses the cell, and short enough that three scatter passes
	// come to 1.4s rather than a stall.
	const WIN_HOLD_MS = 480;

	onMount(() => {
		// own phase and a slightly different rate per symbol — pulsing every
		// winning symbol in sync reads as one object breathing, not five
		const phase = Math.random() * Math.PI * 2;
		const rate = 225 * (0.9 + Math.random() * 0.2);
		const id = setInterval(() => {
			const t = Date.now();
			pulse = 0.5 + 0.5 * Math.sin(t / rate + phase);
			wobble = Math.sin(t / (rate * 1.6) + phase);
		}, 32);

		// the hit itself: overshoot, then settle a little above rest so the cell
		// stays visibly raised for as long as it is part of the win
		hit.set(1.22, { duration: fs(200), easing: backOut });
		flash.set(0, { duration: fs(320), easing: cubicOut });
		spark.set(1, { duration: fs(420), easing: cubicOut });
		const settle = setTimeout(
			() => hit.set(1.07, { duration: fs(240), easing: cubicOut }),
			fs(200),
		);

		const done = setTimeout(() => props.oncomplete?.(), WIN_HOLD_MS / featureTimeScale());

		return () => {
			clearInterval(id);
			clearTimeout(settle);
			clearTimeout(done);
			// Resolve on the way out as well. If anything else changes the cell's
			// state first this component goes away, and Board.svelte would still be
			// awaiting a callback that can no longer fire. Resolving a promise twice
			// is a no-op, so the timer path above stays correct.
			props.oncomplete?.();
		};
	});

	// The winning cell is marked with a RECTANGLE on the cell's own footprint, not
	// the round glow this inherited from the sibling game. Two reasons, and the
	// second is the whole point of this game:
	//
	//  - a circle on a square grid says "this symbol", never "this position";
	//  - Neon Frames pay by POSITION. Which cells a line runs through is the thing
	//    the player is reading, because a Frame only multiplies when the line goes
	//    through its cell. A marker shaped like the cell answers that at a glance.
	//
	// It also rhymes with the Neon Frame, which is the same rectangle — so a
	// winning cell that carries a Frame shows the two nested, which is exactly the
	// moment worth noticing. They are kept apart by colour rather than by shape:
	// the Frame is gold 0xffd166 over a magenta glow, so this is cyan-white, which
	// is also where the win-line palette lives.
	const CYAN = 0x66f6ff;
	const WHITE = 0xffffff;

	// Inset from the 118 cell pitch so two adjacent winning cells read as two
	// marks rather than one welded block.
	const HALF = SYMBOL_SIZE * 0.455;
	// Corner brackets rather than a closed box: a full outline at this weight
	// starts to look like a second Neon Frame, and the brackets keep the symbol's
	// own silhouette readable at 132px.
	const ARM = SYMBOL_SIZE * 0.2;
	const RADIUS = SYMBOL_SIZE * 0.08;

	const corners = [
		[-1, -1],
		[1, -1],
		[1, 1],
		[-1, 1],
	] as const;
</script>

<!--
  Programmatic win animation: scale pulse + a cell-shaped bracket marking the
  winning position. Uses the existing symbol PNG sprites — no spine required.
-->
<Container x={props.x} y={props.y}>
	<!-- Cell wash, BEHIND the symbol: the cell lighting up, not a light on it -->
	<Graphics
		draw={(g) => {
			g.clear();
			g.roundRect(-HALF, -HALF, HALF * 2, HALF * 2, RADIUS);
			g.fill({ color: CYAN, alpha: 0.06 + 0.1 * pulse });
			g.roundRect(-HALF, -HALF, HALF * 2, HALF * 2, RADIUS);
			g.stroke({ width: 2, color: CYAN, alpha: 0.22 + 0.3 * pulse });
		}}
	/>
	<!--
		The symbol itself moves; the bracket and the wash do not. Keeping the
		marker still is what lets the motion read as the symbol reacting rather
		than the whole cell sliding around, and it keeps the bracket aligned to the
		grid while the symbol leans inside it.
	-->
	<Container
		scale={hit.current}
		rotation={wobble * 0.05}
		y={wobble * SYMBOL_SIZE * 0.022}
	>
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
		/>
		<!--
			White copy of the same sprite over itself, fading out of the hit. This is
			the impact: without it the overshoot alone reads as a zoom rather than as
			something landing.
		-->
		{#if flash.current > 0.01}
			<Sprite
				anchor={0.5}
				key={props.symbolInfo.assetKey}
				width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
				height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
				tint={0xffffff}
				alpha={flash.current}
				blendMode="add"
			/>
		{/if}
	</Container>

	<!-- outward spark burst on the hit -->
	{#if spark.current < 1}
		{#each sparkAngles as angle, i (i)}
			{@const travel = SYMBOL_SIZE * (0.34 + 0.28 * spark.current)}
			<Sprite
				anchor={0.5}
				key="fxStar"
				x={Math.cos(angle) * travel}
				y={Math.sin(angle) * travel}
				width={SYMBOL_SIZE * 0.3 * (1 - spark.current)}
				height={SYMBOL_SIZE * 0.3 * (1 - spark.current)}
				tint={CYAN}
				alpha={0.9 * (1 - spark.current)}
				blendMode="add"
			/>
		{/each}
	{/if}
	<!--
		Corner brackets, IN FRONT of the symbol.

		This is not a style choice. The bracket box is 107px across and the symbol
		sprite is drawn at up to the full 118px cell, so a marker behind the sprite
		is completely covered by it — mounted, drawn, and invisible. The round glow
		this replaced got away with sitting behind because its 127px diameter
		reached past the symbol's edge; a marker inset inside the cell cannot.
		Verified by drawing it in a sentinel colour that appears nowhere else in the
		game and counting pixels: zero behind the sprite, visible in front.
	-->
	<Graphics
		draw={(g) => {
			g.clear();
			// Pixi 8 API. `lineStyle` is the v7 call and only sets state — in v8 a
			// path is not rendered until `stroke()` is called, so the v7 form draws
			// nothing at all. That is not a style detail: it is why this marker was
			// invisible even once it was mounted, in front, and held on screen.
			const bracket = (width: number, color: number, alpha: number) => {
				for (const [sx, sy] of corners) {
					const cx = sx * HALF;
					const cy = sy * HALF;
					g.moveTo(cx - sx * ARM, cy);
					g.lineTo(cx, cy);
					g.lineTo(cx, cy - sy * ARM);
				}
				g.stroke({ width, color, alpha });
			};
			bracket(4, CYAN, 0.55 + 0.45 * pulse);
			// white core, so the bracket keeps its edge against a bright symbol
			bracket(1.5, WHITE, 0.3 + 0.5 * pulse);
		}}
	/>
</Container>
