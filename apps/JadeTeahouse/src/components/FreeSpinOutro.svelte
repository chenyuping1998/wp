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
	import FxBurst from './FxBurst.svelte';
	import SplashMaster from './SplashMaster.svelte';

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
	// THE SETTLEMENT IS NOT THE INTRO SHOWN TWICE. Same board art, a different
	// scene: it rises instead of dropping, light rays turn slowly behind it while
	// the total counts, and the payoff is saved for the END of the count — the
	// halo flares, the leaves fly off the total and the Master cheers. Then the
	// rays fade down to a still glow.
	let landed = $state(false);
	let landedAt = 0;
	let now = $state(0);
	let raf = 0;
	const tick = (time: number) => {
		now = time;
		if (!landed || time - landedAt < 1600) raf = requestAnimationFrame(tick);
	};
	$effect(() => {
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
	const sinceLanded = $derived(landed ? Math.max(0, now - landedAt) : 0);
	const halo = $derived(landed ? 0.4 + 0.6 * Math.exp(-sinceLanded / 300) : 0.3);
	const rays = $derived(landed ? 0.25 + 0.75 * Math.exp(-sinceLanded / 700) : 1);
	let burst = $state(false);

	const onCountUpComplete = () => {
		landed = true;
		landedAt = performance.now();
		burst = true;
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(tick);
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.5 });
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	};

	const title = gameText('totalWin');

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			landed = false;
			burst = false;
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

				<SplashMaster cue="cheer" cueNow={countUpCompleted} enterAt={150} />

				<FreeSpinAnimation settlement {halo} {rays}>
					{#snippet children({ sizes })}
						<!-- Transparent title lettering and the count each use the paper center. -->
						{@const ts = Math.min((sizes.width * 0.82) / 924, (sizes.height * 0.22) / 117)}
						<Sprite key="v8TitleTotal" anchor={.5} y={-sizes.height * 0.3} width={1600 * ts} height={500 * ts}/>
						{@const amountText = bookEventAmountToCountUpString(countUpAmount, amount)}
						{@const amountSize = Math.min(sizes.height * 0.42, sizes.width * 0.15, (sizes.width * 1.3) / Math.max(1, amountText.length))}
						<Container y={sizes.height * 0.2}>
							<InkNumber text={amountText} fontSize={amountSize} maxWidth={sizes.width*.85}/>
						</Container>
						{#if burst}
							<FxBurst flavour="tea" y={sizes.height * 0.2} scale={1.7} oncomplete={() => (burst = false)} />
							<FxBurst flavour="tea" y={sizes.height * 0.2} scale={2.4} delay={110} />
						{/if}
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
