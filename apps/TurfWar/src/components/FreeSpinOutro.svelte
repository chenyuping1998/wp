<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, DISPLAY_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { Text } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});

	// Silence the coin loop the moment the total stops counting.
	//
	// winLevelSoundsStop() — which is what normally stops it — only runs after
	// freeSpinOutroCountUp resolves, and that resolves on the player's PRESS, not
	// when the count-up finishes. A player who leaves this screen up (reading the
	// total, taking a screenshot) therefore heard the 2.4s coin shimmer loop over
	// and over with nothing else going on. The loop belongs to the count-up, so it
	// ends with the count-up.
	const onCountUpComplete = () => {
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	};

	const title = gameText('totalWin');
	// The plaque still has FREE SPINS baked into its upper third. Keep every
	// dynamic summary label below that artwork instead of trying to cover it:
	// at the old -0.26 position TOTAL WIN crossed the bottom of the gold letters.
	// These shared ratios also keep long translated labels and the amount as one
	// vertically balanced summary block on every viewport.
	const SUMMARY_TITLE_Y = 0.02;
	const SUMMARY_AMOUNT_Y = 0.28;

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount onmount={() => startCountUp()} />

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<FreeSpinAnimation>
					{#snippet children({ sizes })}
						<!--
							TOTAL WIN, typeset. The plaque is blank art, so this screen
							and the intro each state their own words on the same frame —
							which is exactly why the blank version was asked for.
						-->
						<Text
							anchor={0.5}
							y={sizes.height * SUMMARY_TITLE_Y}
							text={title}
							style={{
								fontFamily: TITLE_FONT,
								fontSize: Math.min(sizes.width * 0.12, (sizes.width * 1.5) / title.length),
								fontWeight: TITLE_FONT_WEIGHT,
								letterSpacing: 6,
								fill: [0xd9d6ce, 0xf5893d, 0x465562],
								stroke: 0x0e0f11,
								strokeThickness: 6,
								dropShadow: true,
								dropShadowColor: 0x000000,
								dropShadowBlur: 12,
								dropShadowDistance: 3,
							}}
						/>
						<GoldText
							y={sizes.height * SUMMARY_AMOUNT_Y}
							fontSize={sizes.width * 0.15}
							text={bookEventAmountToCurrencyString(countUpAmount)}
							maxWidth={sizes.width * 0.9}
						/>
					{/snippet}
				</FreeSpinAnimation>

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<PressToContinue
					position="betweenBoardAndBottom"
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
