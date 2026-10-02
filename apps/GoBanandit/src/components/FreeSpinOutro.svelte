<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { Container, Text } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCurrencyString, bookEventAmountToCountUpString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';

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

				<!-- behind the plaque, so the bananas never bury the total -->
				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<FreeSpinAnimation>
					{#snippet children({ sizes })}
						<!-- the intro plaque's type: a flat green title and the amount in
						     red over an ink pass. It was a gold gradient with a soft shadow
						     and a cream amount — cream on the plaque's own paper, so the
						     total the whole feature built up to was the faintest thing on it. -->
						<Text
							anchor={0.5}
							y={-sizes.height * 0.26}
							text={title}
							style={{
								fontFamily: GAME_FONT,
								fontSize: Math.min(sizes.width * 0.12, (sizes.width * 1.5) / title.length),
								fontWeight: GAME_FONT_WEIGHT,
								letterSpacing: 6,
								fill: 0x1f5c4a,
							}}
						/>
						{@const amountText = bookEventAmountToCountUpString(countUpAmount, amount)}
						{@const amountSize = Math.min(sizes.width * 0.15, (sizes.width * 1.3) / Math.max(1, amountText.length))}
						<Container y={sizes.height * 0.1}>
							<Text
								anchor={0.5}
								x={6}
								y={6}
								text={amountText}
								style={{ fontFamily: NUMBER_FONT, fontSize: amountSize, fontWeight: '400', fill: 0x1e1b1a }}
							/>
							<Text
								anchor={0.5}
								text={amountText}
								style={{ fontFamily: NUMBER_FONT, fontSize: amountSize, fontWeight: '400', fill: 0xd24a2c }}
							/>
						</Container>
					{/snippet}
				</FreeSpinAnimation>

				<PressToContinue
					position="betweenBoardAndBottom"
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
