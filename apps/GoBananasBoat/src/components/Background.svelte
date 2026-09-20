<script lang="ts">
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';

	const context = getContext();
	const isHoldAndSpin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame' && !isHoldAndSpin);
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame' && !isHoldAndSpin);

	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still jungle art
	// breathes instead of sitting dead behind the reels ────────────────────────
	// OVERSCAN AND THE DRIFT SHARE THIS SLACK, and the split matters now that the
	// scene can be shaken (CameraShake). The ken-burns drift used to swing across
	// the FULL slack, so at the ends of its travel the plate's edge sat exactly on
	// the canvas edge with nothing behind it — fine while nothing moved the scene,
	// and a visible bar of empty canvas the moment something did.
	//
	// 1.14 overscan with the drift limited to 0.3 of the slack leaves ~0.2 of it
	// (about 36px on a 1280-wide canvas) spare on every side at the worst point of
	// the drift, which covers the 17px peak shake with room over.
	const OVERSCAN = 1.14;
	const DRIFT_SHARE = 0.3;
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const w = width * OVERSCAN;
		const h = height * OVERSCAN;
		const slackX = w - width;
		const slackY = h - height;
		return {
			width: w,
			height: h,
			x: -slackX * 0.5 + Math.sin(clock * 0.06) * slackX * DRIFT_SHARE,
			y: -slackY * 0.5 + Math.sin(clock * 0.041 + 1.1) * slackY * DRIFT_SHARE,
		};
	});

	// ── harbour air: motes drifting up through the dock lamps, with a gentle
	// sway. Soft textured motes (fxGlow), never hard vector circles ─────────────
	//
	// These were "jungle bokeh — pollen and fireflies", with a pale lime among
	// the colours, drifting over a painted dock at dusk. Same motion, harbour
	// light: most of them warm, the colour of the sodium lamps on the posts, and
	// one in four the cool pale blue of salt spray catching the light off the
	// water — which is the colour this game's water is drawn in.
	const MOTE_COLORS = [0xffe98a, 0xfff7d6, 0xcfe8f0, 0xffd75e];
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
</FadeContainer>

<!-- 烈日突擊 free-game background -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} />
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
