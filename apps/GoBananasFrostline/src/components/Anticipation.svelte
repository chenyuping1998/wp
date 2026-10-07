<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { tierIntensity, pulseRateMs, beamAt } from '../game/anticipationFocus';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { ICE_WASH, ICE_BRIGHT, ICE_EDGE, ICE_HIGHLIGHT, ICE_DEEP } from '../game/palette';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let pulse = $state(0);
	let beamT = $state(0);
	let finished = $state(false);

	// How many scatters are already down on this spin. See stateGame.anticipation:
	// the reel's own flag is a boolean, so this is the only place the 1-vs-2
	// distinction survives.
	const magnitude = $derived(context.stateGame.anticipation[props.reel.reelIndex]);
	const intensity = $derived(tierIntensity(magnitude));

	// Drawn entirely here rather than through the old `anticipation` spine: that
	// asset is template art from a mining game (rocks, dust, sparks) whose
	// artwork sat off-centre — it was the bright block that showed up at the top
	// left — and it was only ~1.6 cells tall, so it never framed the reel.
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);

	onMount(() => {
		// offset per reel: when several reels tease at once, a shared phase makes
		// them strobe as one block instead of shimmering along the board
		const phase = props.reel.reelIndex * 0.9;
		// Driven by a timer rather than rAF on purpose: a background tab parks rAF,
		// and a tease whose clock stops while the reels keep turning comes back
		// frozen. Same reason the rest of this game's show timing uses timers.
		const started = Date.now();
		const id = setInterval(() => {
			const rate = pulseRateMs(props.reel.reelIndex, magnitude);
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
			beamT = Date.now() - started;
		}, 24);

		return () => clearInterval(id);
	});

	$effect(() => {
		// Stop immediately when reel stops to avoid the heavy "falling/landing" outro feel.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});

	// Kept in the script rather than inline in the template: design/
	// check_undefined_refs.mjs parses template expressions looking for undeclared
	// identifiers and cannot read a TypeScript annotation, so an inline
	// `(inset: number) => ...` reads to it as a reference to something called
	// `number`. Every other component in this game draws from a named function
	// too (see Anticipations.drawDim).
	const drawTease = (g: PixiGraphics) => {
		const h = BOARD_SIZES.height;
		g.clear();

		// Pixi 8: every outline below is path-then-`.stroke()`.
		//
		// What was here was `lineStyle(...)` followed by drawRoundedRect /
		// moveTo / lineTo and nothing else. In v8 `lineStyle` survives only as a
		// deprecation shim that assigns `context.strokeStyle`
		// (scene/graphics/shared/Graphics.mjs:298) — it emits no geometry, and
		// unlike `endFill` it does not stroke the path afterwards. So the three
		// nested frame strokes, the cell ticks and both chevrons drew NOTHING:
		// the whole tease was the translucent amber wash and the two rail
		// glows. Inherited from Go Bananas 100, where it is still live.
		g.roundRect(LEFT + 3, 3, SYMBOL_SIZE - 6, h - 6, 12);
		g.fill({ color: ICE_WASH, alpha: (0.1 + 0.12 * pulse) * intensity });

		// travelling shaft: the column reads as lit from somewhere rather than
		// as a static wash, and it runs faster on the higher tier
		const beam = beamAt(beamT, magnitude);
		if (beam.alpha > 0.01) {
			const beamH = beam.height * h;
			g.roundRect(LEFT + 5, beam.y * h - beamH / 2, SYMBOL_SIZE - 10, beamH, 10);
			g.fill({ color: ICE_HIGHLIGHT, alpha: beam.alpha * 0.35 * intensity });
		}

		// full-height frame: three nested strokes so the edge reads as lit metal
		const frame = (
			inset: number,
			radius: number,
			width: number,
			color: number,
			alpha: number,
		) => {
			g.roundRect(LEFT + inset, inset, SYMBOL_SIZE - inset * 2, h - inset * 2, radius);
			g.stroke({ width, color, alpha: alpha * intensity });
	};
		frame(2, 13, 7, ICE_EDGE, 0.3 + 0.34 * pulse);
		frame(6, 10, 3, ICE_BRIGHT, 0.45 + 0.4 * pulse);
		frame(10, 8, 1.4, 0xffffff, 0.25 + 0.4 * pulse);

	// cell ticks down the column so the frame reads as five slots, not a tube
		for (let row = 1; row < BOARD_SIZES.height / SYMBOL_SIZE; row++) {
			const y = row * SYMBOL_SIZE;
			g.moveTo(LEFT + 14, y);
			g.lineTo(LEFT + SYMBOL_SIZE - 14, y);
		}
		g.stroke({ width: 1.5, color: ICE_BRIGHT, alpha: (0.16 + 0.2 * pulse) * intensity });

	// chevrons converging on the column from above and below
		const chev = 14 + 6 * pulse;
		g.moveTo(x - SYMBOL_SIZE * 0.12, -chev - 10);
		g.lineTo(x, -chev);
		g.lineTo(x + SYMBOL_SIZE * 0.12, -chev - 10);
		g.moveTo(x - SYMBOL_SIZE * 0.12, h + chev + 10);
		g.lineTo(x, h + chev);
		g.lineTo(x + SYMBOL_SIZE * 0.12, h + chev + 10);
		g.stroke({ width: 4, color: ICE_EDGE, alpha: (0.5 + 0.4 * pulse) * intensity });
	};

</script>
<BoardContainer>
	<!--
		Ice wash over the whole teasing column, brightest at the rails.

		Cold rather than the inherited amber, and that is the rule rather than the
		theme talking (palette.ts rule 2): the tease marks WHERE something is about
		to happen, not what was won. Keeping it gold would have put it in the same
		register as the win rings and the scatter, which are the things it is
		supposed to be building up to.
	-->
	<Graphics draw={drawTease} />

	<!-- additive glow hugging each rail, so the tease has depth over the art -->
	{#each [0, BOARD_SIZES.height] as railY (railY)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			{x}
			y={railY}
			width={SYMBOL_SIZE * 1.35}
			height={SYMBOL_SIZE * 0.7}
			tint={ICE_DEEP}
			blendMode="add"
			alpha={(0.22 + 0.3 * pulse) * intensity}
		/>
	{/each}
</BoardContainer>
