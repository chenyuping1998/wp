<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { displayFontFor, displayWeightFor } from '../game/fonts';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation>
		{#snippet children({ sizes })}
			<Text
				anchor={0.5}
				y={-sizes.height * 0.31}
				text={title}
				style={{
					fontFamily: displayFontFor(title),
					fontSize: Math.min(sizes.width * 0.11, (sizes.width * 1.5) / title.length),
					fontWeight: displayWeightFor(title),
					letterSpacing: 6,
					fill: [0xfff3bd, 0xffd75e, 0xc9821a],
					stroke: 0x54330a,
					strokeThickness: 6,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowBlur: 10,
					dropShadowDistance: 3,
				}}
			/>
			<!--
				The count is sized off the interior's HEIGHT, not its width. The supplied
				plaque is wide and shallow, so a width-derived size put a 112px numeral in
				a 232px box that also has to hold a title above and a caption below — the
				numeral's descender box ran straight through AWARDED.
			-->
			<GoldText
				y={sizes.height * 0.02}
				text={freeSpinsFromEvent}
				fontSize={Math.min(sizes.width * 0.2, sizes.height * 0.34)}
			/>
			<Text
				anchor={0.5}
				y={sizes.height * 0.34}
				text={subtitle}
				style={{
					fontFamily: displayFontFor(subtitle),
					fontSize: Math.min(sizes.width * 0.045, (sizes.width * 1.1) / subtitle.length),
					fontWeight: displayWeightFor(subtitle),
					letterSpacing: 4,
					fill: 0xf5e3c3,
					stroke: 0x2c1c08,
					strokeThickness: 3,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
