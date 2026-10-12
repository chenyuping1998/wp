<script lang="ts">
	import { Container, Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import { BG_BASE, BG_FEATURE, BG_FEATURE_R, BG_HS_L, BG_HS_R, BG_HS_TOP } from '../game/meshWin';
	import BgProps from './BgProps.svelte';

	const context = getContext();
	const isHoldAndSpin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame' && !isHoldAndSpin);
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame' && !isHoldAndSpin);

	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the neon backdrop
	// breathes instead of sitting dead behind the reels ────────────────────────
	//
	// COVER, NOT STRETCH. The plates are 16:9; they used to be sized straight to
	// the canvas, which on a portrait phone squeezed them to a third of their
	// width. Now they keep their aspect and fill the canvas, cropped about the
	// centre. The drift only
	// uses the OVERSCAN margin, not the crop, so in portrait it does not slide the
	// plate sideways across half its width.
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

	// Scene-specific air. Rain belongs to the wet street, distant electrical
	// motes to the rooftop; the enclosed vault has neither. The old 22-colour
	// bokeh overlay followed the player into every scene and looked like a
	// generic particle preset rather than something in the pictured place.
	const MOTE_COLORS = [0x42eaff, 0xff46d3, 0x915cff];
	const motes = Array.from({ length: 9 }, (_, i) => ({
		seedX: Math.random(),
		seedY: Math.random(),
		size: 8 + Math.random() * 20,
		colorIndex: i % MOTE_COLORS.length,
		phase: Math.random() * Math.PI * 2,
		riseSpeed: 0.008 + Math.random() * 0.012,
		swayAmp: 8 + Math.random() * 20,
		alpha: 0.08 + Math.random() * 0.12,
	}));
	const rain = Array.from({ length: 24 }, (_, i) => ({
		x: (i * 0.61803398875) % 1,
		y: (i * 0.41421356237) % 1,
		speed: 0.5 + (i % 5) * 0.09,
		length: 10 + (i % 4) * 5,
	}));
	const drawRain = (g: PixiGraphics) => {
		g.clear();
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		for (const drop of rain) {
			const y = ((drop.y + clock * drop.speed) % 1.12) * height - height * 0.06;
			const x = ((drop.x * width - clock * 5) % (width + 20) + width + 20) % (width + 20) - 10;
			g.moveTo(x, y).lineTo(x - 3, y + drop.length)
				.stroke({ width: 1.2, color: 0x9ceeff, alpha: 0.1 });
		}
	};

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

	onMount(() => {
		const id = setInterval(() => {
			clock += 0.016;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x080b20} zIndex={-3} />

<!-- 金色日出叢林 base-game background -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...parallax} />
	<!-- the paper lanterns and the blossom branch (meshWin/bgProps.ts), handed
	     the same rect so they stay pinned to the art as it drifts -->
	<BgProps spec={BG_BASE} {...parallax} />
	<Graphics draw={drawRain} />
</FadeContainer>

<!-- 烈日突擊 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} />
	<!-- the vines and fern on the left, the palm on the right -->
	<BgProps spec={BG_FEATURE} {...parallax} />
	<BgProps spec={BG_FEATURE_R} {...parallax} />
</FadeContainer>

<!-- 地底金庫 hold-and-spin background -->
<FadeContainer show={isHoldAndSpin} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgHoldAndSpin" {...parallax} />
	<!-- the leaning coins and the stack on the shelves: they jump every time a
	     new coin sticks on the board -->
	<BgProps spec={BG_HS_L} {...parallax} />
	<BgProps spec={BG_HS_R} {...parallax} />
	<!-- the shelf over the arch: the part a portrait screen sees -->
	<BgProps spec={BG_HS_TOP} {...parallax} />
</FadeContainer>

<!-- a few distant electrical motes above the rooftop -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Container>
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
</FadeContainer>
