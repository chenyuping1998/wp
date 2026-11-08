<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import { BackgroundClock, type StageMusic } from '../game/backgroundStage';
	import { musicAt } from '../game/beatClock';
	import { BG_BASE, BG_FEATURE, BG_FEATURE_R, BG_HS_L, BG_HS_R, BG_HS_TOP } from '../game/meshWin';
	import BgProps from './BgProps.svelte';
	import ClubStage from './ClubStage.svelte';

	const context = getContext();
	const isHoldAndSpin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY || context.stateGame.gameType === 'holdandspin');
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame' && !isHoldAndSpin);
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame' && !isHoldAndSpin);
	let timeMs = $state(0);
	// The drums the player hears, sampled each frame from the BGM's anchor.
	// Undefined while no music is anchored: the stage falls back to its own clock.
	let music = $state<StageMusic | undefined>(undefined);
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// The same cover box carries the plate, its meshes and the lighting anchors.
	const OVERSCAN = 1.08;
	const parallax = $derived.by(() => {
		const { width, height } = canvas;
		const cover = Math.max(width / 1920, height / 1080);
		const w = 1920 * cover * OVERSCAN, h = 1080 * cover * OVERSCAN;
		const seconds = timeMs / 1000;
		return { width: w, height: h,
			x: (width - w) / 2 + Math.sin(seconds * 0.06) * width * (OVERSCAN - 1) / 2,
			y: (height - h) / 2 + Math.sin(seconds * 0.041 + 1.1) * height * (OVERSCAN - 1) / 2,
		};
	});

	onMount(() => {
		const clock = new BackgroundClock();
		let raf = 0;
		const tick = (now: number) => {
			timeMs = clock.frame(now);
			const m = musicAt(performance.now(), showFeatureBackground || isHoldAndSpin ? 'freespin' : 'base');
			music = m.live ? { kick: m.kick, downbeat: m.downbeat, bars: m.beats / 4 } : undefined;
			raf = requestAnimationFrame(tick);
		};
		const visibility = () => {
			cancelAnimationFrame(raf);
			clock.pause();
			if (!document.hidden) raf = requestAnimationFrame(tick);
		};
		document.addEventListener('visibilitychange', visibility);
		visibility();
		return () => {
			cancelAnimationFrame(raf);
			document.removeEventListener('visibilitychange', visibility);
		};
	});
</script>

<Rectangle {...canvas} backgroundColor={0x080b20} zIndex={-3} />

<!-- Wet street: signs, lamp beams and flowing pavement reflections. -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...parallax} />
	<BgProps spec={BG_BASE} {...parallax} {timeMs} />
	<ClubStage mode="base" {...parallax} {timeMs} {music} canvasWidth={canvas.width} canvasHeight={canvas.height} />
</FadeContainer>

<!-- Rooftop: 128 BPM accents across the terrace and skyline. -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} />
	<BgProps spec={BG_FEATURE} {...parallax} {timeMs} />
	<BgProps spec={BG_FEATURE_R} {...parallax} {timeMs} />
	<ClubStage mode="feature" {...parallax} {timeMs} {music} canvasWidth={canvas.width} canvasHeight={canvas.height} />
</FadeContainer>

<!-- Vault: restrained pillar/shelf chases answer each new held coin. -->
<FadeContainer show={isHoldAndSpin} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgHoldAndSpin" {...parallax} />
	<BgProps spec={BG_HS_L} {...parallax} {timeMs} />
	<BgProps spec={BG_HS_R} {...parallax} {timeMs} />
	<BgProps spec={BG_HS_TOP} {...parallax} {timeMs} />
	<ClubStage mode="hold" {...parallax} {timeMs} {music} canvasWidth={canvas.width} canvasHeight={canvas.height} />
</FadeContainer>
