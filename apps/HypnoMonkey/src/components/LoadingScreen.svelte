<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { TITLE_FONT } from '../game/fonts';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FeatureIntro from './FeatureIntro.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');
	let ringAngle=$state(0);
	onMount(()=>{let raf=0,last=0;const tick=(now:number)=>{if(last&&!document.hidden)ringAngle+=(now-last)/1000*1.4;last=now;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});

	// Animate progress bar smoothly
	let animatedProgress = $state(0);
	$effect(() => {
		const target = context.stateApp.loaded ? 100 : 80;
		const interval = setInterval(() => {
			if (animatedProgress < target) {
				animatedProgress = Math.min(animatedProgress + 1.3, target);
			} else {
				clearInterval(interval);
			}
		}, 16);
		return () => clearInterval(interval);
	});

	// The title wordmark is lettering only, no board behind it (the house style of
	// the recent titles), on a 1600x600 canvas.
	const logoWidth = $derived(Math.min(context.stateLayoutDerived.mainLayout().width * 0.82, 680));
	const LOGO_Y = 0.24;

	// the 16:9 scene fills the screen at its own aspect, cropped about the centre
	const bgCover = $derived(
		Math.max(
			context.stateLayoutDerived.mainLayout().width / 1920,
			context.stateLayoutDerived.mainLayout().height / 1080,
		),
	);
</script>

<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<Sprite
			key="mgBgBase"
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
			width={1920 * bgCover}
			height={1080 * bgCover}
		/>

		<!-- a light wash keeps the busy plaza behind the lettering -->
		<Graphics
			draw={(g) => {
				const w = context.stateLayoutDerived.mainLayout().width;
				const h = context.stateLayoutDerived.mainLayout().height;
				g.clear();
				g.rect(0, 0, w, h).fill({ color: 0x1e4950, alpha: 0.28 });
				g.rect(0, h * 0.72, w, h * 0.28).fill({ color: 0x1e4950, alpha: 0.18 });
			}}
		/>

		{#if !context.stateApp.loaded}
		<Sprite
			key="mgLogo"
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * LOGO_Y}
			width={logoWidth}
			height={logoWidth * 0.375}
		/>
		{/if}
		{#if !context.stateApp.loaded}
			<Sprite key="mgLoader" anchor={0.5} x={context.stateLayoutDerived.mainLayout().width * 0.5}
				y={context.stateLayoutDerived.mainLayout().height * LOGO_Y + logoWidth * 0.48} width={90} height={90} rotation={ringAngle} />
		{/if}
	</MainContainer>
</FadeContainer>

<!--
	Loading bar, house style: one thin bar under the title in the game's accent on
	a dark track, and nothing else — no percentage, no tips carousel, no strapline.
-->
<FadeContainer show={loadingType === 'start' && !context.stateApp.loaded}>
	<MainContainer>
		<Graphics
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * LOGO_Y + logoWidth * 0.26}
			draw={(g) => {
				const barWidth = Math.min(400, context.stateLayoutDerived.mainLayout().width * 0.6);
				const barHeight = Math.max(8, barWidth / 16);
				g.clear();
				g.rect(-barWidth / 2, -barHeight / 2, barWidth, barHeight).fill({ color: 0x2a1f24, alpha: 1 });
				const fillWidth = (barWidth * animatedProgress) / 100;
				if (fillWidth > 0) {
					g.rect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight).fill({ color: 0x8ccb6e, alpha: 1 });
				}
			}}
		/>
	</MainContainer>
</FadeContainer>

<!-- feature cards take the screen (with their own copy of the wordmark) once the bar fills -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<FeatureIntro />
</FadeContainer>

<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue fontFamily={TITLE_FONT} onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!--
	Transition between the loading screen and the game. The handover fires on
	`oncover` — the frame the flash fully covers the screen — so the loading screen
	is torn down behind the flash rather than reappearing for a beat after it.
-->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncover={props.onloaded} oncomplete={props.onloaded} />
</FadeContainer>
