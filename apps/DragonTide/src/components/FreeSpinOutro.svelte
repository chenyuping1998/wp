<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT, TITLE_FONT } from '../game/fonts';
	import { Text } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	// Amounts are rounded before formatting. The count-up provider hands over a
	// float and the formatter passes the fraction straight through, so a rolling
	// amount read $9,289.1716 and only snapped to two decimals on the final
	// frame. Book amounts are integer minor units, so rounding is exact.
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
	// reference §5.3: the plaque returns to the base game on its own ~4.2 s after it came in
	// (the player can still press); never before the total has stood still for 1.2 s
	const AUTO_RETURN_MS = 4200, HOLD_AFTER_COUNT_MS = 1200;
	let shownAt = 0;
	let autoReturn: ReturnType<typeof setTimeout> | undefined;
	const onCountUpComplete = () => {
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
		clearTimeout(autoReturn);
		const finish = oncomplete;
		autoReturn = setTimeout(() => finish(), Math.max(HOLD_AFTER_COUNT_MS, AUTO_RETURN_MS - (performance.now() - shownAt)));
	};
	onDestroy(() => clearTimeout(autoReturn));

	const title = gameText('totalWin');

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			shownAt = performance.now();
			await waitForResolve((resolve) => (oncomplete = () => { clearTimeout(autoReturn); resolve(); }));
		},
	});
</script>

<FadeContainer {show} duration={show ? undefined : 0}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount onmount={() => startCountUp()} />

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<FreeSpinAnimation sign="outro">
					{#snippet children({ sizes })}
						<Text
							anchor={0.5}
							y={-sizes.height * 0.26}
							text={title}
							style={{
								// The carved face, matching the plaque tier names and the
								// loading title. Non-Latin locales fall through per character
								// exactly as they do for GAME_FONT — same stack behind it.
								fontFamily: TITLE_FONT,
								fontSize: Math.min(sizes.height * 0.26,sizes.width * 0.12, (sizes.width * 1.5) / title.length),
								fontWeight: GAME_FONT_WEIGHT,
								letterSpacing: 6,
								fill: 0xf2b632,
								stroke: { color: 0x2a1f24, width: 6 },
								dropShadow: { color: 0x000000, blur: 10, distance: 3, angle: Math.PI / 2, alpha: 1 },
							}}
						/>
						<GoldText
							y={sizes.height * 0.12}
							fontSize={Math.min(sizes.width * 0.15,sizes.height * 0.36)}
							text={bookEventAmountToCountUpString(Math.round(countUpAmount), amount)}
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
