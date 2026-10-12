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
	import TextMesh from './TextMesh.svelte';
	import { AMOUNT_ACT, BANNER_ACT } from '../game/meshWin/textMesh';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	// TextMesh kicks: the title lands as the screen shows, the total rolls and lands
	let shownAt = $state(-1);
	let landAt = $state(-1);
	let countStarted = $state(false);
	let displayToken = 0;

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
		freeSpinOutroHide: async () => {
			displayToken += 1;
			show = false;
		},
		freeSpinOutroCountUp: async (emitterEvent) => {
			displayToken += 1;
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			landAt = -1;
			countStarted = false;
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
							const mine = displayToken;
						shownAt = Date.now();
							// Let the sign land and light its first rail before the
							// total starts rolling. A quick press can finish the count
							// early; the token prevents a late restart after dismissal.
							setTimeout(() => {
								if (mine === displayToken && show && !countStarted && !countUpCompleted) {
									countStarted = true;
									startCountUp();
								}
							}, 480);
					}}
				/>
				{#if countUpCompleted}
					<OnMount onmount={() => (landAt = Date.now())} />
				{/if}

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<FreeSpinAnimation counting={!countUpCompleted} finishAt={landAt}>
					{#snippet children({ sizes })}
						<TextMesh
							y={-sizes.height * 0.26}
							text={title}
							fontSize={Math.min(sizes.width * 0.12, (sizes.width * 1.5) / title.length)}
							letterSpacing={6}
							fill={[0xffffff, 0xffb8ef, 0xff3fd0]}
							stroke={0x140a30}
							strokeWidth={6}
							shadow={{ blur: 10, distance: 3 }}
							at={{ land: shownAt }}
							act={BANNER_ACT}
						/>
						<TextMesh
							y={sizes.height * 0.12}
							fontSize={sizes.width * 0.15}
							text={bookEventAmountToCurrencyString(countUpAmount)}
							maxWidth={sizes.width * 0.9}
							bevel
							at={{ roll: shownAt, land: landAt }}
							act={AMOUNT_ACT}
						/>
					{/snippet}
				</FreeSpinAnimation>

				<PressToContinue
					position="betweenBoardAndBottom"
						onpress={() => {
						if (countUpCompleted) oncomplete();
						else {
							if (!countStarted) {
								countStarted = true;
								startCountUp();
							}
							finishCountUp();
						}
						}}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
