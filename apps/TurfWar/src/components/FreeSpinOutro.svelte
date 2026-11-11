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
	import { bookEventAmountToCountUpString } from 'utils-shared/amount';
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
	// Where TOTAL WIN and the amount sit, in fractions of the plank's text area
	// (FreeSpinAnimation puts this origin 0.06 of the sign's height BELOW its
	// centre). The plaque used to have FREE SPINS baked into its upper third, so
	// the pair was pushed down to 0.02 / 0.28 to clear it. The shipped plaque is
	// blank, and that offset left the block ~0.18 of the sign's height low —
	// the win read as sitting on the bottom rail (user report 2026-09-23).
	// Shifted up together so the pair's ink is centred on the plaque; the gap
	// between them is unchanged.
	const SUMMARY_TITLE_Y = -0.18;
	const SUMMARY_AMOUNT_Y = 0.08;

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
								fill: 0xd9d6ce,
								stroke: { color: 0x0e0f11, width: 6 },
								dropShadow: { color: 0x000000, blur: 12, distance: 3, angle: Math.PI / 6, alpha: 1 },
							}}
						/>
						<GoldText
							y={sizes.height * SUMMARY_AMOUNT_Y}
							fontSize={sizes.width * 0.2}
							text={bookEventAmountToCountUpString(countUpAmount, amount)}
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
