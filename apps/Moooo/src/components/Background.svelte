<script lang="ts">
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	// Ocean Drive gets its own backdrop. This used to key on a SUPERSPIN bet mode
	// carried over from the sibling app — a mode Moooo does not have, so the
	// third background never once displayed. Super mode comes from milkMeterInit
	// book event, which is the only thing that distinguishes the three tiers.
	const isSuperMode = $derived(
		context.stateGame.superMode && context.stateGame.gameType === 'freegame',
	);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(
		context.stateGame.gameType === 'freegame' && !isSuperMode,
	);

	let beamPhase = $state(0);
	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still backdrop art
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

	// ── floating bokeh: dust and midges caught in the floodlights, drifting up
	// with a gentle sway. Soft textured
	// motes (fxGlow), never hard vector circles ────────────────────────────────
	// Was the jungle pollen/firefly set; 0xd9e88a is pale olive and these motes
	// are on screen on EVERY spin, not just during a feature. Swapped for pink.
	const MOTE_COLORS = [0xffe98a, 0xfff7d6, 0xffb05c, 0xffd75e];
	const NIGHT_COLORS = [0xffd75e, 0xfff2b0, 0x9fd0ff, 0xffe98a];
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

		// Keep beams very subtle and in the upper area so they don't distract from
		// reels. Were 0xfff0b8 / 0xffd43b — warm gold god-rays, described in the
		// old comment as keeping "the still jungle art" breathing. They are now
		// pink and cyan: over a synthwave sunset a warm shaft reads as daylight
		// through a canopy, which is the wrong world entirely.
		g.beginFill(0xe8542e, 0.05);
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

		g.beginFill(0xffb05c, 0.035);
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

<!--
	Letterbox fill behind every scene, seen wherever the backdrop sprite does not
	reach the canvas edge. Was 0x0d0f05 — R13 G15 B5, a near-black OLIVE, and the
	single largest surface in the game still carrying GoBananas' hue. Now the same
	deep indigo-black uiTheme uses for valueShadow.
-->
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x0a0420} zIndex={-3} />

<!-- base-game background: county fair at dusk -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="mooooBgBase" {...parallax} />
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
</FadeContainer>

<!-- free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="mooooBgFeature" {...parallax} />
	<Graphics draw={(g) => drawSoftBeams(g, 1.2)} />
</FadeContainer>

<!-- Super Free Spins background -->
<FadeContainer show={isSuperMode} duration={SECOND} zIndex={-1}>
	<Sprite key="mooooBgSuper" {...parallax} />
</FadeContainer>

<!-- ambient bokeh drifting in front of whichever scene is showing -->
<Container zIndex={-1}>
	{#each motes as mote, index (index)}
		{@const state = moteState(mote)}
		<Sprite
			key="mooooFxGlow"
			anchor={0.5}
			x={state.x}
			y={state.y}
			tint={(isSuperMode ? NIGHT_COLORS : MOTE_COLORS)[mote.colorIndex]}
			blendMode="add"
			width={mote.size}
			height={mote.size}
			alpha={state.alpha}
		/>
	{/each}
</Container>
