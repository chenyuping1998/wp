<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
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
	import TreasureFall from './TreasureFall.svelte';
	import { MainContainer } from 'components-layout';
	import GoldText from './GoldText.svelte';
	import FxBurst from './FxBurst.svelte';
	import { Container } from 'pixi-svelte';

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
		landTotal();
	};

	// THE TOTAL LANDS. The round's whole result used to just stop counting. Now
	// the figure is set down like a tablet: it swells and settles, a burst of
	// gilt, inlay and sand goes off behind it, and a stone thud sits under it —
	// the same landing the big-win plaque gives its amount (Win.svelte), so the
	// two ends of a winning feature speak the same way. A zero total gets none of
	// it: there is nothing to land.
	let landPunch = $state(1);
	let landBurst = $state(0);
	// when it landed (performance.now), for the sign's second ripple
	let landAt = $state(-1);
	const landTotal = () => {
		if (amount <= 0) return;
		landBurst++;
		landAt = performance.now();
		context.eventEmitter.broadcast({ type: 'soundStoneCrack', step: 0 });
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 520;
			if (p >= 1) {
				landPunch = 1;
				clearInterval(id);
				return;
			}
			landPunch =
				1 +
				0.3 * Math.exp(-p * 5.5) * Math.cos(p * Math.PI * 2.4 - 0.9) * (p < 0.08 ? p / 0.08 : 1);
		}, 16);
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

				<!-- the run's treasure, pouring behind the total (see TreasureFall) -->
				<MainContainer>
					<TreasureFall emit={!countUpCompleted} levelAlias={winLevelData?.alias} burst={landBurst} />
				</MainContainer>

				<FreeSpinAnimation {landAt}>
					{#snippet children({ sizes })}
						<Text
							anchor={0.5}
							y={-sizes.height * 0.26}
							text={title}
							style={{
								fontFamily: GAME_FONT,
								fontSize: Math.min(sizes.width * 0.12, (sizes.width * 1.5) / title.length),
								fontWeight: GAME_FONT_WEIGHT,
								letterSpacing: 6,
								fill: [0xfff3bd, 0xffd75e, 0xc9821a],
								stroke: 0x54330a,
								strokeThickness: 6,
								dropShadow: true,
								dropShadowColor: 0x000000,
								dropShadowBlur: 10,
								dropShadowDistance: 3,
							}}
						/>
						{#key landBurst}
							{#if landBurst > 0}
								<FxBurst y={sizes.height * 0.12} scale={2} flavour="tomb" />
							{/if}
						{/key}
						<Container y={sizes.height * 0.12} scale={landPunch}>
							<GoldText
								fontSize={sizes.width * 0.15}
								text={bookEventAmountToCurrencyString(Math.round(countUpAmount))}
								maxWidth={sizes.width * 0.9}
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
