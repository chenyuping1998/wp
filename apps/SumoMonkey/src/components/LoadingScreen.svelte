<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FeatureIntro from './FeatureIntro.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');

	// Animate progress bar smoothly
	let animatedProgress = $state(0);
	$effect(() => {
		const target = context.stateApp.loaded ? 100 : 80;
		const interval = everyFrame(() => {
			if (animatedProgress < target) {
				animatedProgress = Math.min(animatedProgress + 1.3, target);
			} else {
				interval();
			}
		});
		return () => interval();
	});

	// the 16:9 plate fills the screen at its own aspect, cropped about the centre
	// (see Background.svelte) — sized straight to the layout it was squeezed in
	// portrait
	const bgCover = $derived(
		Math.max(context.stateLayoutDerived.mainLayout().width / 1920, context.stateLayoutDerived.mainLayout().height / 1080),
	);
</script>

<FadeContainer show={loadingType === 'start'}>
	<MainContainer>

		<Sprite
			key="gbBgBase"
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
			width={1920 * bgCover}
			height={1080 * bgCover}
		/>

		<Graphics
			draw={(g) => {
				const w = context.stateLayoutDerived.mainLayout().width;
				const h = context.stateLayoutDerived.mainLayout().height;
				g.clear();
				g.beginFill(0x282828, 0.58);
				g.drawRect(0, 0, w, h);
				g.endFill();

				g.beginFill(0x282828, 0.22);
				g.drawRect(0, h * 0.72, w, h * 0.28);
				g.endFill();
			}}
		/>



		<Container visible={!context.stateApp.loaded}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155}
		>
			<Sprite key="sumoLogoMain" anchor={0.5}
				width={Math.min(680, context.stateLayoutDerived.mainLayout().width * .8)}
				height={Math.min(680, context.stateLayoutDerived.mainLayout().width * .8) * .375} />
		</Container>
	</MainContainer>
</FadeContainer>

<FadeContainer show={loadingType === 'start' && !context.stateApp.loaded}>
	<MainContainer>
		<Graphics
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155 + Math.min(context.stateLayoutDerived.mainLayout().height * 0.134, 120)}
			draw={(g) => {
				const barWidth = Math.min(400, context.stateLayoutDerived.mainLayout().width * 0.6);
				const barHeight = Math.max(8, barWidth / 16);
				g.clear();
				g.rect(-barWidth / 2, -barHeight / 2, barWidth, barHeight);
				g.fill({ color: 0x000000, alpha: 1 });
				const fillWidth = (barWidth * animatedProgress) / 100;
				if (fillWidth > 0) {
					g.rect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight);
					g.fill({ color: 0xc47d60, alpha: 1 });
				}
			}}
		/>
	</MainContainer>
</FadeContainer>

<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<FeatureIntro />
</FadeContainer>

<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncover={props.onloaded} oncomplete={props.onloaded} />
</FadeContainer>
