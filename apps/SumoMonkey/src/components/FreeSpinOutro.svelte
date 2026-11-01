<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCurrencyString, bookEventAmountToCountUpString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import InkNumber from './InkNumber.svelte';
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

				<FreeSpinAnimation settlement>
					{#snippet children({ sizes })}
						<!-- the intro plaque's type: a flat green title and the amount in
						     red over an ink pass. It was a gold gradient with a soft shadow
						     and a cream amount — cream on the plaque's own paper, so the
						     total the whole feature built up to was the faintest thing on it. -->
						<!-- Laid out INSIDE the paper by the title's INK box (title_total.png
						     ink 244..1353 x 99..388 of 1600x500), never by the canvas: the
						     top 40% of the paper is the title slot, the rest the amount. -->
						{@const ts = Math.min((sizes.width * 0.92) / 1109, (sizes.height * 0.4 * 0.92) / 289)}
						<Sprite key="v8TitleTotal" anchor={.5} y={-sizes.height * 0.3 + 6.5 * ts} width={1600 * ts} height={500 * ts}/>
						{@const amountText = bookEventAmountToCountUpString(countUpAmount, amount)}
						{@const amountSize = Math.min(sizes.height * 0.42, sizes.width * 0.15, (sizes.width * 1.3) / Math.max(1, amountText.length))}
						<Container y={sizes.height * 0.2}>
							<InkNumber text={amountText} fontSize={amountSize} maxWidth={sizes.width*.85}/>
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
