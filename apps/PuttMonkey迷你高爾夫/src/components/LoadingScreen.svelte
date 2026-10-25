<script lang="ts">
	import BgMotion from './BgMotion.svelte';
	import { everyFrame } from '../game/frameLoop';
	import { Graphics, Sprite } from 'pixi-svelte';
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

	// The same bilingual painted sign stays on both loading and feature pages.
	const logoWidth = $derived(Math.min(context.stateLayoutDerived.mainLayout().width * 0.82, 680));

	// the 16:9 plate fills the screen at its own aspect, cropped about the centre
	// (see Background.svelte) — sized straight to the layout it was squeezed in
	// portrait
	const bgCover = $derived(
		Math.max(context.stateLayoutDerived.mainLayout().width / 1920, context.stateLayoutDerived.mainLayout().height / 1080),
	);
</script>

<!-- Go Bananas jungle-commando branded loading screen -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<!-- Background image (山水 theme) -->
		<Sprite
			key="gbBgBase"
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
			width={1920 * bgCover}
			height={1080 * bgCover}
		/>
		<!-- the plate's sails and rays are cut out of it now: put them back, turning -->
		<BgMotion
			kind="base"
			x={context.stateLayoutDerived.mainLayout().width * 0.5 - 960 * bgCover}
			y={context.stateLayoutDerived.mainLayout().height * 0.5 - 540 * bgCover}
			width={1920 * bgCover}
			height={1080 * bgCover}
		/>

		<!-- Pale wash preserves the light comic palette behind the sign. -->
		<Graphics
			draw={(g) => {
				const w = context.stateLayoutDerived.mainLayout().width;
				const h = context.stateLayoutDerived.mainLayout().height;
				g.clear();
				g.beginFill(0xfaf6e9, 0.24);
				g.drawRect(0, 0, w, h);
				g.endFill();

				g.beginFill(0xfaf6e9, 0.16);
				g.drawRect(0, h * 0.72, w, h * 0.28);
				g.endFill();
			}}
		/>

		{#if !context.stateApp.loaded}
		<Sprite key="v8LogoBoard" anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.16}
			width={logoWidth} height={logoWidth * 0.375} />
		{/if}
	</MainContainer>
</FadeContainer>

<!--
	Loading bar, house style (Hacksaw transcription §1, 2026-10-06): one thin
	bar under the title in the game's one accent on a black track, and nothing
	else — no percentage, no tips carousel, no strapline. The backdrop above is
	the base plate darkened, which is the same art as the cover.
	Hacksaw: 400x25 at 1920 wide, about 145px under the logo at 1080 high.
-->
<FadeContainer show={loadingType === 'start' && !context.stateApp.loaded}>
	<MainContainer>
		<Graphics
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.16 + logoWidth * 0.24}
			draw={(g) => {
				const barWidth = Math.min(400, context.stateLayoutDerived.mainLayout().width * 0.6);
				const barHeight = Math.max(8, barWidth / 16);
				g.clear();
				g.rect(-barWidth / 2, -barHeight / 2, barWidth, barHeight);
				g.fill({ color: 0x2c5c4d, alpha: 1 });
				const fillWidth = (barWidth * animatedProgress) / 100;
				if (fillWidth > 0) {
					g.rect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight);
					g.fill({ color: 0xc5994b, alpha: 1 });
				}
			}}
		/>
	</MainContainer>
</FadeContainer>

<!-- feature card: takes the screen once the bar fills -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<FeatureIntro />
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!--
	Transition between the loading screen and the game.

	The handover fires on `oncover` as well as `oncomplete`: `oncover` is the
	frame the blast has gone fully white, so the loading screen is torn down and
	the game put up behind a screen showing nothing but flash. Handing over only
	on `oncomplete` meant the flash cleared to reveal the loading screen for a
	beat before the game appeared.

	`onloaded` unmounts this whole component, which takes the animation with it,
	so in practice `oncomplete` never fires — the flash vanishes along with the
	loading screen and the game is already behind it. It stays wired as a safety
	net for the day the handover stops unmounting.
-->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncover={props.onloaded} oncomplete={props.onloaded} />
</FadeContainer>
