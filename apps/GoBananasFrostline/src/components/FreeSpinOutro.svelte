<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
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
	import TextMesh from './TextMesh.svelte';
	import { FROST_AMOUNT_ACT, FROST_BANNER_ACT } from '../game/meshWin/textMesh';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	// TextMesh kicks: the title lands as the plate comes up, the total rolls
	// while it counts and squashes as it lands
	let shownAt = $state(-1);
	let rollAt = $state(-1);
	let landAt = $state(-1);

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
			shownAt = Date.now();
			rollAt = -1;
			landAt = -1;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount
					onmount={() => {
						rollAt = Date.now();
						startCountUp();
					}}
				/>
				{#if countUpCompleted}
					<OnMount onmount={() => (landAt = Date.now())} />
				{/if}

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<FreeSpinAnimation>
					{#snippet children({ sizes })}
						<TextMesh
							y={-sizes.height * 0.26}
							text={title}
							fontSize={Math.min(sizes.width * 0.12, (sizes.width * 1.5) / title.length)}
							letterSpacing={6}
							strokeWidth={6}
							shadow={{ blur: 10, distance: 3 }}
							at={{ land: shownAt }}
							act={FROST_BANNER_ACT}
						/>
						<TextMesh
							y={sizes.height * 0.12}
							fontSize={sizes.width * 0.15}
							text={bookEventAmountToCurrencyString(countUpAmount)}
							maxWidth={sizes.width * 0.9}
							bevel
							at={{ roll: rollAt, land: landAt }}
							act={FROST_AMOUNT_ACT}
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
