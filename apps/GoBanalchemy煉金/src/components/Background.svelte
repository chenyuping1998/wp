<script lang="ts">
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import {
		BG_BASE,
		BG_CLOTH,
		BG_CRYSTALS_FLOOR,
		BG_CRYSTALS_CORNER,
		BG_CRYSTALS_RIGHT,
		BG_COINS,
	} from '../game/meshWin';
	import { BG_POTIONS } from '../game/meshWin/potionBoil';
	import BgBubbles from './BgBubbles.svelte';
	import { crispPlate } from '../game/crispPlate';
	import type { Texture } from 'pixi.js';
	import BgProps from './BgProps.svelte';

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
	// 4%, not 8%: the overscan is a GPU enlargement of the whole plate, and the
	// user wants the scene crisp (2026-10-16). Half the drift, half the stretch.
	const OVERSCAN = 1.04;
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
	// Small and few (2026-10-16): 22 soft blobs up to 58px floated in front of
	// the plate and read as haze over it. Specks of dust now, the scene clear.
	const motes = Array.from({ length: 14 }, (_, i) => ({
		seedX: Math.random(),
		seedY: Math.random(),
		size: 5 + Math.random() * 9,
		colorIndex: i % 4,
		phase: Math.random() * Math.PI * 2,
		riseSpeed: 0.012 + Math.random() * 0.022,
		swayAmp: 18 + Math.random() * 46,
		alpha: 0.25 + Math.random() * 0.3,
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
			// mip chains for the plates, once each is loaded (game/crispPlate.ts)
			for (const key of ['gbBgBase', 'gbBgFeature', 'gbBgHoldAndSpin'])
				crispPlate(context.stateApp.loadedAssets?.[key] as Texture | undefined);
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x0b0a08} zIndex={-3} />

<!-- 金色日出叢林 base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...parallax} />
	<!-- the two lanterns swaying on their chains (meshWin/bgProps.ts) -->
	<BgProps spec={BG_BASE} {...parallax} />
	<!-- the cloth over the left table stirs -->
	<BgProps spec={BG_CLOTH} {...parallax} />
	<!-- the flasks on the shelves and table simmer (meshWin/potionBoil.ts) -->
	<BgBubbles potions={BG_POTIONS.base} {...parallax} />
</FadeContainer>

<!-- 烈日突擊 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} />
	<!-- the crystals standing clear of the brass slowly swell (meshWin/bgProps.ts) -->
	<BgProps spec={BG_CRYSTALS_FLOOR} {...parallax} />
	<BgProps spec={BG_CRYSTALS_CORNER} {...parallax} />
	<BgProps spec={BG_CRYSTALS_RIGHT} {...parallax} />
	<!-- the crystal vault's glowing tubes bubble -->
	<BgBubbles potions={BG_POTIONS.feature} {...parallax} />
</FadeContainer>

<!-- 地底金庫 hold-and-spin background -->
<FadeContainer show={isHoldAndSpin} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgHoldAndSpin" {...parallax} />
	<!-- the treasure vault's caged lanterns sway; its flasks simmer -->
	<!-- the coin pile shudders when new coins land on the board -->
	<BgProps spec={BG_COINS} {...parallax} />
	<BgBubbles potions={BG_POTIONS.vault} {...parallax} />
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
