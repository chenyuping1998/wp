<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Text, SpineProvider, SpineTrack, SpineSlot } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';

	import { getContext } from '../game/context';
	import { neonNumberStyle } from '../game/textStyles';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';

	type AnimationName = 'intro' | 'idle';

	const context = getContext();

	let show = $state(true);
	let animationName = $state<AnimationName>('intro');
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

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
		<!-- non-big FS totals only get presentDuration 1s — the count-up ends
		     before the player can react, so their tap always lands in the
		     "already completed" state and exits in one press. Slow the roll to
		     a real moment so tap-1 = finish count, tap-2 = leave. -->
		{@const duration = Math.max(winLevelData.presentDuration, 2600)}
		{@const isBigWin = winLevelData.type === 'big'}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount onmount={() => startCountUp()} />

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<FreeSpinAnimation>
					{#snippet children({ sizes })}
						<!-- headline: same type treatment as the WILD PARTY title -->
						<Text
							anchor={0.5}
							y={-300}
							text={context.i18nDerived.congratulations()}
							style={{
								fontFamily: 'Cinzel, Georgia, serif',
								fontSize: 96,
								fontWeight: '900',
								fill: 0xfff4cf,
								letterSpacing: 8,
								dropShadow: true,
								dropShadowColor: 0xff9edf,
								dropShadowBlur: 18,
								dropShadowDistance: 0,
								stroke: 0xffffff,
								strokeThickness: 1,
							}}
						/>
						<Text
							anchor={0.5}
							y={-165}
							text={context.i18nDerived.youWon()}
							style={{
								fontFamily: 'Cinzel, Georgia, serif',
								fontSize: 58,
								fontWeight: '900',
								fill: 0xfff4cf,
								letterSpacing: 6,
								dropShadow: true,
								dropShadowColor: 0xff9edf,
								dropShadowBlur: 14,
								dropShadowDistance: 0,
							}}
						/>

						<SpineProvider key="fsOutroNumber" width={sizes.width * 0.4}>
							<SpineTrack
								trackIndex={0}
								{animationName}
								loop={animationName === 'idle'}
								listener={{
									complete: () => (animationName = 'idle'),
								}}
							/>
							<SpineSlot slotName="slot_number">
								<!-- amount must stay inside the fsOutroNumber plate
								     (provider width is sizes.width*0.4) -->
								<ResponsiveText
									anchor={0.5}
									style={neonNumberStyle(sizes.width * 0.045)}
									text={bookEventAmountToCurrencyString(countUpAmount)}
									maxWidth={sizes.width * 0.34}
								/>
							</SpineSlot>
						</SpineProvider>

						<Text
							anchor={0.5}
							y={325}
							text={context.i18nDerived.totalWin()}
							style={{
								fontFamily: 'Cinzel, Georgia, serif',
								fontSize: 58,
								fontWeight: '900',
								fill: 0xfff4cf,
								letterSpacing: 6,
								dropShadow: true,
								dropShadowColor: 0xff9edf,
								dropShadowBlur: 14,
								dropShadowDistance: 0,
							}}
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
