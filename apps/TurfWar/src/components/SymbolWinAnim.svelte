<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { backOut, cubicOut } from 'svelte/easing';
	import { featureTimeScale } from '../game/timeScale';

	import { SYMBOL_SIZE, BIG_WIN_UNITS } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';
	import { getSymbolInfo } from '../game/utils';
	import { getSymbolWinMotion, HOLD_MS } from '../game/symbolWinMotion';
	import SymbolArt from './SymbolArt.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/**
		 * Which symbol this is. The cell furniture below (wash, brackets, sparks)
		 * is deliberately identical for every symbol — it marks a POSITION, and
		 * Neon Frames pay by position. What must not be identical is how the
		 * symbol itself reacts, and that is looked up from this name.
		 */
		symbolName: string;
		/** cell position — forwarded to SymbolArt, which uses it for the blink */
		cell?: { reel: number; row: number };
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// pulse 0→1→0, driving the cell furniture only
	let pulse = $state(0);
	// milliseconds since this win started, driving the per-symbol motion
	let elapsed = $state(0);

	const motion = $derived(getSymbolWinMotion(props.symbolName));

	/**
	 * Is this a big win? The rarer faces (he pushes his sunglasses down, she winks)
	 * are held back for these, so they stay worth seeing — a wink on every third
	 * spin is wallpaper.
	 *
	 * Read from the round's own total rather than from this cell, because the tier
	 * is a property of the round: every winning cell in a big round shows the big
	 * face, which is what makes the board feel like it is reacting together.
	 */
	const isBigWin = $derived(stateGame.currentWinTotal >= BIG_WIN_UNITS);
	const frame = $derived(motion.frame(elapsed));

	// --- motion ---------------------------------------------------------------
	//
	// The old animation was a sine breathe: one scale wave at ~1.4Hz, forever.
	// It read as "this symbol is slowly inflating", not as "this symbol just
	// won", and review flagged animation quality directly. A win needs an
	// IMPACT and then life, so it is built as three separate things:
	//
	//   hit    a hard scale overshoot on arrival, easing back — the moment
	//   flash  a white copy of the symbol over itself, fading out of that moment
	//   life   what the symbol does for as long as it is lit
	//
	// `life` used to be one shared sine wobble, and THAT is what three reviewers
	// rejected the game for. It is not that nothing moved — it is that all twelve
	// symbols moved identically, so a winning flamingo and a winning letter J
	// were the same animation with different art inside. `life` now comes from
	// game/symbolWinMotion.ts, one function per symbol, and
	// design/check_symbol_motion.mjs fails the build if any two are too alike.
	//
	// `hit` and `flash` stay shared on purpose: every win should punch, and the
	// punch is what says "this paid". Only its amplitude varies, by
	// `motion.hitScale`, so Wild and Scatter land harder than a card royal.
	//
	// Durations run through featureTimeScale(), so turbo shortens the beat
	// without flattening it. See game/timeScale.ts.
	const fs = (ms: number) => ms / featureTimeScale();

	const hit = new Tween(0.86, { duration: fs(220), easing: backOut });
	const flash = new Tween(0.85, { duration: fs(300), easing: cubicOut });

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
	// Imported rather than restated: the motion table sizes its beats against
	// HOLD_MS (a beat that does not fit inside it is a beat no player ever sees),
	// and two copies of the number are two chances for the table to be tuned
	// against a window the component no longer uses.
	//
	// 2026-08-23: 480 -> 620 with the amplitude gain. A motion three times the
	// size needs longer to read as a gesture rather than as a jolt, and the beats
	// that fit in 480 still fit here.
	const WIN_HOLD_MS = HOLD_MS;


	onMount(() => {
		// own phase for the cell wash — pulsing every winning cell in sync reads
		// as one object breathing, not five
		const phase = Math.random() * Math.PI * 2;
		const rate = 225 * (0.9 + Math.random() * 0.2);

		// requestAnimationFrame, not the 32ms interval this used to run on. The
		// whole animation is 480ms, so 32ms steps gave it fifteen frames — enough
		// for a slow breathe, not enough for a struck beat like the boombox's or
		// the car's idle vibration, which alias into a stutter at 31fps.
		//
		// `elapsed` is measured from a mount timestamp rather than accumulated per
		// frame, so a dropped frame shifts nothing: every symbol's beat stays
		// aligned to when its win actually started.
		const started = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			elapsed = (now - started) * featureTimeScale();
			pulse = 0.5 + 0.5 * Math.sin(now / rate + phase);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		// the hit itself: overshoot, then settle a little above rest so the cell
		// stays visibly raised for as long as it is part of the win. Amplitude is
		// scaled per symbol so the specials land heavier.
		// 2026-08-23: 1.22/1.07 -> 1.45/1.18. The pop was the other half of the
		// "動圖不明顯" report: at 1.22 peaking for 200ms and settling to 1.07, a
		// winning symbol grew by 8px and then sat 4px proud of its neighbours,
		// which on a board where the royals already draw at 0.92 and the specials
		// at 1.08 of the cell is inside the size differences the art already has.
		// At 1.45/1.18 it is unmistakably the symbol that just paid. Nothing masks
		// the board, so overflowing the cell is safe — and overflowing is the
		// point: it lifts the winning cell out of the grid.
		const overshoot = 1 + (1.45 - 1) * motion.hitScale;
		const settled = 1 + (1.18 - 1) * motion.hitScale;
		hit.set(overshoot, { duration: fs(200), easing: backOut });
		flash.set(0, { duration: fs(320), easing: cubicOut });
		spark.set(1, { duration: fs(420), easing: cubicOut });
		const settle = setTimeout(
			() => hit.set(settled, { duration: fs(240), easing: cubicOut }),
			fs(200),
		);

		const done = setTimeout(() => props.oncomplete?.(), WIN_HOLD_MS / featureTimeScale());

		return () => {
			cancelAnimationFrame(raf);
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
	// the Frame is a heavy gold plate, so this is a pale gold keyline — brighter
	// and thinner than the Frame, which is what keeps the two apart now that the
	// game has one hue family. It was cyan-white against the old magenta glow.
	const MARK = 0xd9d6ce;
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
  Programmatic win animation. Two layers with different jobs:

    the CELL   wash, corner brackets, spark burst — identical for every symbol,
               because it marks a position and Neon Frames pay by position
    the SYMBOL its own motion from game/symbolWinMotion.ts — different for all
               twelve, because that is what got the game rejected

  Uses the existing symbol PNGs and the existing fx sprites. No new art, no
  Spine skeletons.
-->
<Container x={props.x} y={props.y}>
	<!-- Cell wash, BEHIND the symbol: the cell lighting up, not a light on it -->
	<Graphics
		draw={(g) => {
			g.clear();
			g.roundRect(-HALF, -HALF, HALF * 2, HALF * 2, RADIUS);
			g.fill({ color: MARK, alpha: 0.06 + 0.1 * pulse });
			g.roundRect(-HALF, -HALF, HALF * 2, HALF * 2, RADIUS);
			g.stroke({ width: 2, color: MARK, alpha: 0.22 + 0.3 * pulse });
		}}
	/>
	<!--
		The symbol itself moves; the bracket and the wash do not. Keeping the
		marker still is what lets the motion read as the symbol reacting rather
		than the whole cell sliding around, and it keeps the bracket aligned to the
		grid while the symbol leans inside it.
	-->
	{#each frame.overlays.filter((o) => o.behind) as overlay, i (i)}
		<Sprite
			anchor={0.5}
			key={overlay.key}
			x={overlay.x * SYMBOL_SIZE}
			y={overlay.y * SYMBOL_SIZE}
			width={overlay.width * SYMBOL_SIZE}
			height={overlay.height * SYMBOL_SIZE}
			rotation={overlay.rotation}
			alpha={overlay.alpha}
			tint={overlay.tint}
			blendMode="add"
		/>
	{/each}

	<Container
		scale={{ x: hit.current * frame.scaleX, y: hit.current * frame.scaleY }}
		rotation={frame.rotation}
		x={frame.dx * SYMBOL_SIZE}
		y={frame.dy * SYMBOL_SIZE}
	>
		<!--
			The art itself. SymbolArt draws the flat sprite for most symbols and the
			rigged part stack for the ones whose art has been cut into layers, so a
			boombox's speakers can pump on the beat the body is already thumping to.
			`t` is the same clock the per-symbol motion runs on, so the parts and the
			body stay locked together.
		-->
		<SymbolArt
			symbolInfo={props.symbolInfo}
			symbolName={props.symbolName}
			mode="win"
			t={elapsed}
			cell={props.cell}
			big={isBigWin}
		/>
		<!--
			Neon-tube bloom: an additive copy of the symbol's own art in the letter's
			own colour. The four card royals ARE neon letters, so the honest way to
			animate them is to light them rather than to move them, and each one
			gets its own switch-on rhythm. Zero for every other symbol, so this
			costs nothing where it is not wanted.
		-->
		{#if frame.bloomAlpha > 0.01}
			<SymbolArt
				symbolInfo={props.symbolInfo}
				symbolName={props.symbolName}
				mode="win"
				t={elapsed}
				overlayTint={frame.bloomTint}
				overlayAlpha={frame.bloomAlpha}
			/>
		{/if}
		<!--
			White copy of the same sprite over itself, fading out of the hit. This is
			the impact: without it the overshoot alone reads as a zoom rather than as
			something landing.
		-->
		{#if flash.current > 0.01}
			<!-- the impact flash follows the PARTS, not a ghost of the flat pose -->
			<SymbolArt
				symbolInfo={props.symbolInfo}
				symbolName={props.symbolName}
				mode="win"
				t={elapsed}
				overlayTint={0xffffff}
				overlayAlpha={flash.current}
			/>
		{/if}
	</Container>

	{#each frame.overlays.filter((o) => !o.behind) as overlay, i (i)}
		<Sprite
			anchor={0.5}
			key={overlay.key}
			x={overlay.x * SYMBOL_SIZE}
			y={overlay.y * SYMBOL_SIZE}
			width={overlay.width * SYMBOL_SIZE}
			height={overlay.height * SYMBOL_SIZE}
			rotation={overlay.rotation}
			alpha={overlay.alpha}
			tint={overlay.tint}
			blendMode="add"
		/>
	{/each}

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
				tint={MARK}
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
			bracket(4, MARK, 0.55 + 0.45 * pulse);
			// white core, so the bracket keeps its edge against a bright symbol
			bracket(1.5, WHITE, 0.3 + 0.5 * pulse);
		}}
	/>
</Container>
