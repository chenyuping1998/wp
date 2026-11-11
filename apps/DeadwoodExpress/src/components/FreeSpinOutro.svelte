<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
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

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			show = true;
			context.stateGame.fullscreenOverlay = true;
		},
		freeSpinOutroHide: async () => {
			show = false;
			// the transition that follows takes the flag over and clears it at the end
		},
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
						<!-- Cinzel title and Saira numerals, both in the brass bevel the
						     big-win plaque uses. The title was a yellow→gold→PINK gradient
						     on a purple stroke: Hot Miami's palette, never re-cut. -->
						<GoldText
							y={-sizes.height * 0.25}
							text={title}
							fill={0xe9cf95}
							fontSize={sizes.height * 0.2}
							maxWidth={sizes.width * 0.86}
							letterSpacing={5}
							fontFamily={DISPLAY_FONT}
							fontWeight={DISPLAY_FONT_WEIGHT}
						/>
						<!-- Precision is decided from the FINAL amount and held for every
						     frame: formatting each frame on its own printed "$48.3293"
						     part-way through a $134.00 count. -->
						<GoldText
							y={sizes.height * 0.16}
							fontSize={sizes.height * 0.36}
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
