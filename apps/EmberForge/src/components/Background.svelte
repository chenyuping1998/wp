<script lang="ts">
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	let beamPhase = $state(0);
	let clock = $state(0);

	// ── the backdrop is the painted scene again ────────────────────────────────
	//
	// BoardFrame draws bg_background.png anchored to the BOARD, so its opening
	// lands on the playfield. That copy covers the canvas at ordinary aspect
	// ratios but cannot on a very tall phone, and whatever fills the remainder
	// has to match it — a different picture behind the same art reads as a seam.
	// So the filler is the same file, cover-fitted to the canvas and pushed well
	// down in brightness. Where it shows it reads as a dark continuation of the
	// room, not as a second reel frame sitting behind the real one.
	const SCENE = { width: 1536, height: 1024 };
	const BACKDROP_ALPHA = 0.55;

	// Slow ken-burns drift over a small overscan, so the still art breathes
	// instead of sitting dead behind the reels. Cover-fit, never stretched to the
	// canvas aspect: this image now shares its geometry with the board-anchored
	// copy, and distorting one of the two would be visible where they overlap.
	const OVERSCAN = 1.08;
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const scale =
			Math.max(width / SCENE.width, height / SCENE.height) * OVERSCAN;
		const w = SCENE.width * scale;
		const h = SCENE.height * scale;
		const slackX = w - width;
		const slackY = h - height;
		return {
			width: w,
			height: h,
			x: -slackX * 0.5 + Math.sin(clock * 0.06) * slackX * 0.5,
			y: -slackY * 0.5 + Math.sin(clock * 0.041 + 1.1) * slackY * 0.5,
		};
	});

	// ── floating embers drifting up off the furnace with a gentle sway.
	// Soft textured motes (fxGlow), never hard vector circles ──────────────────
	const MOTE_COLORS = [0xffe98a, 0xfff7d6, 0xd9e88a, 0xffd75e];
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

<!-- the forge room, dimmed, filling whatever the board-anchored copy cannot reach -->
<Container zIndex={-2}>
	<Sprite key="efScene" {...parallax} alpha={BACKDROP_ALPHA} />
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
</Container>

<!--
	The free game does not swap pictures any more — there is only one painting.
	It brings the room up instead: a warm additive pass over the same art, so the
	whole screen reads as the forge running hot rather than as a different place.
-->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="efScene" {...parallax} blendMode="add" tint={0xff8a3a} alpha={0.16} />
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
