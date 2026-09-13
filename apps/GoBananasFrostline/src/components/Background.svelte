<script lang="ts">
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame' && !isSuperspin);
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame' && !isSuperspin);

	let beamPhase = $state(0);
	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still jungle art
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

	// ── drifting snow: soft textured motes (fxGlow), never hard vector circles ──
	//
	// These were jungle bokeh — pollen and fireflies rising with a gentle sway, in
	// warm yellows. Turning them into snow is not just a recolour: pollen RISES
	// and snow FALLS, and a white mote drifting upward reads as an ember, which is
	// the opposite of the intended reading. So the direction is flipped below too.
	//
	// Four tones rather than one white: flat white motes read as dust on the lens.
	// The coolest of them is nearly blue, which is what gives depth against the
	// bright ones in front.
	const MOTE_COLORS = [0xffffff, 0xe8f6ff, 0xbcdcf0, 0x9fc8e4];
	// Superspin runs colder and quieter — same snow, pushed toward moonlight.
	const NIGHT_COLORS = [0xe8f6ff, 0xffffff, 0x9fd0ff, 0xc8e2f4];
	const motes = Array.from({ length: 22 }, (_, i) => ({
		seedX: Math.random(),
		seedY: Math.random(),
		// A wider spread than the bokeh had (it was 12-58). Snow at one size reads
		// as a texture laid over the screen; a mix of near and far flakes reads as
		// weather with depth in it.
		size: 8 + Math.random() * 52,
		colorIndex: i % 4,
		phase: Math.random() * Math.PI * 2,
		fallSpeed: 0.012 + Math.random() * 0.022,
		swayAmp: 18 + Math.random() * 46,
		alpha: 0.1 + Math.random() * 0.22,
	}));

	const moteState = (mote: (typeof motes)[number]) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// wrap DOWNWARD: y walks from above the canvas to below it, then repeats.
		// The bokeh this replaces walked the other way (`1.05 - progress * 1.15`).
		const progress = (mote.seedY + clock * mote.fallSpeed) % 1;
		return {
			x: mote.seedX * width + Math.sin(clock * 0.7 + mote.phase) * mote.swayAmp,
			y: height * (-0.1 + progress * 1.15),
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
		g.beginFill(0xdff0ff, 0.05);
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

		g.beginFill(0x9fd0ff, 0.035);
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

<!-- backdrop behind the art. Was 0x0d0f05, an olive black. -->
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x080e16} zIndex={-3} />

<!-- 金色日出叢林 base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...parallax} />
	<Graphics draw={(g) => drawSoftBeams(g, 0)} />
</FadeContainer>

<!-- 烈日突擊 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} />
	<Graphics draw={(g) => drawSoftBeams(g, 1.2)} />
</FadeContainer>

<!-- 夜襲 superspin background -->
<FadeContainer show={isSuperspin} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgSuperspin" {...parallax} />
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
			tint={(isSuperspin ? NIGHT_COLORS : MOTE_COLORS)[mote.colorIndex]}
			blendMode="add"
			width={mote.size}
			height={mote.size}
			alpha={state.alpha}
		/>
	{/each}
</Container>
