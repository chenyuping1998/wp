<script lang="ts">
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { BG_BASE, BG_FEATURE } from '../game/meshWin';
	import BgProps from './BgProps.svelte';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	const context = getContext();
	const isHoldAndSpin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame' && !isHoldAndSpin);
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame' && !isHoldAndSpin);

	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still jungle art
	// breathes instead of sitting dead behind the reels ────────────────────────
	//
	// COVER, NOT STRETCH. The plates are 16:9; they used to be sized straight to
	// the canvas, which on a portrait phone squeezed them to a third of their
	// width. Now they keep their aspect and fill the canvas, cropped about the
	// centre — the tunnel's vanishing point in all three plates. The drift only
	// uses the OVERSCAN margin, not the crop, so in portrait it does not slide the
	// plate sideways across half its width. BgProps is handed the same rect, so
	// the lantern and ropes stay pinned to the art.
	const OVERSCAN = 1.08;
	const PLATE = [1920, 1080];
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const cover = Math.max(width / PLATE[0], height / PLATE[1]);
		const w = PLATE[0] * cover * OVERSCAN;
		const h = PLATE[1] * cover * OVERSCAN;
		const driftX = (width * (OVERSCAN - 1)) / 2;
		const driftY = (height * (OVERSCAN - 1)) / 2;
		return {
			width: w,
			height: h,
			x: (width - w) / 2 + Math.sin(clock * 0.06) * driftX,
			y: (height - h) / 2 + Math.sin(clock * 0.041 + 1.1) * driftY,
		};
	});

	// ── floating jungle bokeh: pollen/fireflies drifting up with a gentle sway.
	// Soft textured motes (fxGlow), never hard vector circles ──────────────────
	const MOTE_COLORS = [0xffe98a, 0xfff7d6, 0xd9e88a, 0xffd75e];
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

	// THE SUN SHAFTS ARE GONE, DELIBERATELY.
	//
	// They were two pale polygons sweeping down from the top of the screen —
	// sunlight through a rainforest canopy, which is what the previous three
	// generations were set in. There is no sky in a mine, so on these plates they
	// read as a rendering fault rather than as light.
	//
	// Every background now carries its own source, painted in: the lantern on the
	// timber in the base game, the glowing seam in the feature, the caged lamp in
	// the strongroom. A second animated light on top would fight all three — the
	// same reason design/BACKGROUND_PROMPTS.md puts "lantern" and "torch" in the
	// negative prompt for the cover plate.
	//
	// The drifting motes stay. Dust hanging in lamplight is right for a mine, and
	// they are the only thing keeping the plate from sitting perfectly still.

	onMount(() => {
		const id = setInterval(() => {
			clock += 0.016;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x0b0a08} zIndex={-3} />

<!-- 金色日出叢林 base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...parallax} />
	<!-- the lantern on its hook, and the rope coil (meshWin/bgProps.ts) -->
	<BgProps spec={BG_BASE} {...parallax} />
</FadeContainer>

<!-- 烈日突擊 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} />
	<!-- the ropes and the plank hanging from the broken roof -->
	<BgProps spec={BG_FEATURE} {...parallax} />
</FadeContainer>

<!-- 地底金庫 hold-and-spin background -->
<FadeContainer show={isHoldAndSpin} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgHoldAndSpin" {...parallax} />
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
			tint={(isHoldAndSpin ? NIGHT_COLORS : MOTE_COLORS)[mote.colorIndex]}
			blendMode="add"
			width={mote.size}
			height={mote.size}
			alpha={state.alpha}
		/>
	{/each}
</Container>
