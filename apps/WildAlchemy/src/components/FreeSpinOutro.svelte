<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { DISPLAY_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCountUpString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { stateUi } from 'state-shared';
	import { canvasLine, gameText } from '../game/i18nText';
	import { REF_TIMING } from '../game/refTiming';
	import { featureTimeScale } from '../game/timeScale';
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
	// The reference's end panel does not wait for a tap: CONGRATULATIONS /
	// YOU HAVE WON … / BACK plays In 1.52 s, loops 1.52 s and goes out by
	// itself (SPEC §2.6). The count-up stands in for the In; once it has
	// finished the panel holds one loop and then continues. A tap still skips.
	let autoContinue: ReturnType<typeof setTimeout> | undefined;
	const onCountUpComplete = () => {
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
		clearTimeout(autoContinue);
		autoContinue = setTimeout(() => oncomplete(), (REF_TIMING.fgPanel.loop * 1000) / featureTimeScale());
	};

	// SPEC §3.3: CONGRATULATIONS / YOU HAVE WON / <amount> / IN N FREE SPINS, hint BACK
	const title = canvasLine(gameText('congratulations'));
	const lead = canvasLine(gameText('youHaveWon'));
	const inSpins = $derived(canvasLine(gameText('inFreeSpins', { n: stateUi.freeSpinCounterTotal })));
	// The amount's line on the card's cream field, as a fraction of its height
	// (FreeSpinAnimation centres the children on that field).
	const SUMMARY_AMOUNT_Y = 0.07;

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => {
			clearTimeout(autoContinue);
			show = false;
		},
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
			clearTimeout(autoContinue);
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
						<!-- sepia on the parchment card: CONGRATULATIONS / YOU HAVE WON /
						     amount / IN N FREE SPINS. The amount keeps the FINAL amount's
						     precision every frame (two decimals while it counts). -->
						<GoldText
							variant="ink"
							y={-sizes.height * 0.34}
							text={title}
							fontSize={Math.min(sizes.height * 0.14, (sizes.width * 1.4) / title.length)}
							maxWidth={sizes.width * 0.94}
							letterSpacing={4}
							fill={0xa53e2b}
							fontFamily={TITLE_FONT}
							fontWeight={TITLE_FONT_WEIGHT}
						/>
						<GoldText
							variant="ink"
							y={-sizes.height * 0.15}
							text={lead}
							fontSize={Math.min(sizes.height * 0.075, (sizes.width * 1.1) / lead.length)}
							maxWidth={sizes.width * 0.9}
							letterSpacing={3}
							fontFamily={TITLE_FONT}
							fontWeight={TITLE_FONT_WEIGHT}
						/>
						<GoldText
							variant="ink"
							y={sizes.height * SUMMARY_AMOUNT_Y}
							fontSize={sizes.height * 0.22}
							text={bookEventAmountToCountUpString(countUpAmount, amount)}
							maxWidth={sizes.width * 0.9}
							fontFamily={DISPLAY_FONT}
							fontWeight={DISPLAY_FONT_WEIGHT}
						/>
						<GoldText
							variant="ink"
							y={sizes.height * 0.3}
							text={inSpins}
							fontSize={Math.min(sizes.height * 0.075, (sizes.width * 1.1) / inSpins.length)}
							maxWidth={sizes.width * 0.9}
							letterSpacing={3}
							fontFamily={TITLE_FONT}
							fontWeight={TITLE_FONT_WEIGHT}
						/>
					{/snippet}
				</FreeSpinAnimation>

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<PressToContinue
					tone="light"
					label={gameText('back')}
					position="betweenBoardAndBottom"
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
