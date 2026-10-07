<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { verticalFill } from '../game/gradientFill';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
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
	import HopTitle from './HopTitle.svelte';
	import { Container } from 'pixi-svelte';
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
	// THE TOTAL LANDS. It used to just stop counting: the last digit arrived and
	// nothing marked the one number the whole feature was for. Now it swells and
	// settles like something set down hard, with a knock and the crate-lock
	// thud — the big-win plaque's landing (Win.svelte landAmount). And the
	// rolling figure is rounded: the tween passes fractional cents.
	let landPunch = $state(1);
	let landTimer: ReturnType<typeof setInterval> | undefined;
	$effect(() => () => clearInterval(landTimer));
	const landTotal = () => {
		clearInterval(landTimer);
		const t0 = Date.now();
		context.eventEmitter.broadcast({ type: 'soundCargoLock' });
		context.eventEmitter.broadcast({ type: 'cameraShake', strength: 0.35, ms: 340 });
		landTimer = setInterval(() => {
			const p = (Date.now() - t0) / 560;
			if (p >= 1) {
				landPunch = 1;
				clearInterval(landTimer);
				return;
			}
			landPunch = 1 + 0.3 * Math.exp(-p * 5.5) * Math.cos(p * Math.PI * 2.4 - 0.9) * (p < 0.08 ? p / 0.08 : 1);
		}, 16);
	};

	const onCountUpComplete = () => {
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
		landTotal();
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

				<FreeSpinAnimation>
					{#snippet children({ sizes })}
						<!-- the title's letters hop in a wave once the sign has landed -->
						<HopTitle
							y={-sizes.height * 0.26}
							text={title}
							delay={620}
							style={{
								fontFamily: GAME_FONT,
								fontSize: Math.min(sizes.width * 0.12, (sizes.width * 1.5) / title.length),
								fontWeight: GAME_FONT_WEIGHT,
								letterSpacing: 6,
								fill: verticalFill([0xfff3bd, 0xffd75e, 0xc9821a], Math.min(sizes.width * 0.12, (sizes.width * 1.5) / title.length)),
								stroke: { color: 0x54330a, width: 6 },
								dropShadow: { color: 0x000000, blur: 10, distance: 3, alpha: 1, angle: Math.PI / 6 },
							}}
						/>
						<!-- the total LANDS when it stops counting: see landTotal -->
						<Container y={sizes.height * 0.12} scale={landPunch}>
							<GoldText
								fontSize={sizes.width * 0.15}
								text={bookEventAmountToCurrencyString(Math.round(countUpAmount))}
								maxWidth={sizes.width * 0.9}
							/>
						</Container>
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
