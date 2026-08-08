<script lang="ts">
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	let beamPhase = $state(0);
	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still backdrop
	// breathes instead of sitting dead behind the reels ────────────────────────
	const OVERSCAN = 1.08;
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const w = width * OVERSCAN;
		const h = height * OVERSCAN;
		const slackX = w - width;
		const slackY = h - height;
		return {
			width: w,
			height: h,
			x: -slackX * 0.5 + Math.sin(clock * 0.06) * slackX * 0.5,
			y: -slackY * 0.5 + Math.sin(clock * 0.041 + 1.1) * slackY * 0.5,
		};
	});

	// ── floating bokeh: screen dust drifting up with a gentle sway.
	// Soft textured motes (fxGlow), never hard vector circles ──────────────────
	// terminal phosphor: greens with a couple of cooler ticks, so the drifting
	// motes read as screen glow rather than as drifting particles
	const MOTE_COLORS = [0x4bd67f, 0xa8f0c4, 0x3fd0d4, 0xd6ffe4];
	const motes = Array.from({ length: 22 }, (_, i) => ({
		seedX: Math.random(),
		seedY: Math.random(),
		size: 12 + Math.random() * 46,
		colorIndex: i % 4,
		phase: Math.random() * Math.PI * 2,
		riseSpeed: 0.012 + Math.random() * 0.022,
		swayAmp: 18 + Math.random() * 46,
		alpha: 0.1 + Math.random() * 0.22,
	}));

	const moteState = (mote: (typeof motes)[number]) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// wrap upward: y walks from below the canvas to above it, then repeats
		const progress = (mote.seedY + clock * mote.riseSpeed) % 1;
		return {
			x: mote.seedX * width + Math.sin(clock * 0.7 + mote.phase) * mote.swayAmp,
			y: height * (1.05 - progress * 1.15),
			// fade in and out at the ends of the run so nothing pops
			alpha: mote.alpha * Math.sin(progress * Math.PI) ** 0.6,
		};
	};

	const drawSoftBeams = (g: PixiGraphics, phaseShift = 0) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const beamReachY = Math.min(height * 0.42, 340);
		const centerX = width * 0.5 + Math.sin(beamPhase + phaseShift) * width * 0.15;

		g.clear();

		// Keep beams very subtle and in the upper area so they don't distract from reels.
		g.beginFill(0xfff0b8, 0.05);
		g.drawPolygon([
			centerX - width * 0.018,
			0,
			centerX + width * 0.018,
			0,
			centerX + width * 0.22,
			beamReachY,
			centerX - width * 0.22,
			beamReachY,
		]);
		g.endFill();

		g.beginFill(0xffd43b, 0.035);
		g.drawPolygon([
			centerX + width * 0.11,
			0,
			centerX + width * 0.135,
			0,
			centerX + width * 0.32,
			beamReachY * 0.9,
			centerX + width * 0.26,
			beamReachY * 0.9,
		]);
		g.endFill();
	};

	onMount(() => {
		const id = setInterval(() => {
			beamPhase += 0.004;
			clock += 0.016;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x0d0f05} zIndex={-3} />

<!-- 金色日出叢林 base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="mcBgBase" {...parallax} />
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
</FadeContainer>

<!-- 烈日突擊 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="mcBgFeature" {...parallax} />
	<Graphics draw={(g) => drawSoftBeams(g, 1.2)} />
</FadeContainer>

<!-- ambient bokeh drifting in front of whichever scene is showing -->
<Container zIndex={-1}>
	{#each motes as mote, index (index)}
		{@const state = moteState(mote)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={state.x}
			y={state.y}
			tint={MOTE_COLORS[mote.colorIndex]}
			blendMode="add"
			width={mote.size}
			height={mote.size}
			alpha={state.alpha}
		/>
	{/each}
</Container>
