<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
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
					// The TITLE goes ice: it names the feature, which is a label. The
					// spin COUNT below it stays gold (it is a quantity the player is
					// being given), so the two do not compete and the number is what
					// the eye lands on — see palette.ts rule 2.
					fill: [0xffffff, 0xa8e4ff, 0x2f86c4],
					stroke: 0x0a2438,
					strokeThickness: 6,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowBlur: 10,
					dropShadowDistance: 3,
				}}
			/>
			<GoldText y={sizes.height * 0.08} text={freeSpinsFromEvent} fontSize={sizes.width * 0.24} />
			<Text
				anchor={0.5}
				y={sizes.height * 0.32}
				text={subtitle}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.05, (sizes.width * 1.1) / subtitle.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 4,
					fill: 0xdfeaf5,
					stroke: 0x0a2438,
					strokeThickness: 3,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
