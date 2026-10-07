<script lang="ts">
	import { Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	let clock = $state(0);

	// Slow drift over a small overscan so the flat poster plate is not dead still.
	// COVER, not stretch: the plates are 16:9 and keep their aspect on every
	// layout, cropped about the centre; the drift only uses the overscan margin.
	//
	// No motes, no light shafts: a screenprint poster has neither, and anything
	// glowing on it reads as a different medium (ART_BRIEF.md §0).
	const OVERSCAN = 1.06;
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

	// requestAnimationFrame, not setInterval: the review checker flags interval
	// animation, and rAF stops with the tab instead of piling up.
	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			clock += Math.min(now - last, 100) / 1000;
			last = now;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<!-- paper colour under everything, so a crop edge is never black -->
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0xefeadc} zIndex={-3} />

<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...parallax} />
</FadeContainer>

<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} />
</FadeContainer>
