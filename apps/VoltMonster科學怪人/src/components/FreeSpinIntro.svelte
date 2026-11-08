<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { verticalFill } from '../game/gradientFill';
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
				y={-sizes.height * 0.26}
				text={title}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.13, (sizes.width * 1.5) / title.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 6,
					// the mine's palette; see FreeSpinCounter for the note
					fill: verticalFill(
						[0xfff6e0, 0xffc45a, 0xc07a14],
						Math.min(sizes.width * 0.13, (sizes.width * 1.5) / title.length),
					),
					stroke: 0x2a2016,
					strokeThickness: 6,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowBlur: 10,
					dropShadowDistance: 3,
				}}
			/>
			<GoldText
				y={sizes.height * 0.08}
				text={freeSpinsFromEvent}
				fontSize={sizes.width * 0.24}
				fill={[0xfff6e0, 0xffc45a, 0xc07a14]}
				stroke={0x2a2016}
			/>
			<Text
				anchor={0.5}
				y={sizes.height * 0.32}
				text={subtitle}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.05, (sizes.width * 1.1) / subtitle.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 4,
					fill: 0xf3e6c8,
					stroke: 0x2a2016,
					strokeThickness: 3,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
