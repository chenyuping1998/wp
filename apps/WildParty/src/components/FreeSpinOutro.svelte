<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite, SpineProvider, SpineTrack, SpineSlot } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';
	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { WIN_TIER_INTENSITY, WIN_TIER_MARQUEE, WIN_TIER_LINGER_MS } from '../game/winPresentationTiers';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';
	import WinAnimation from './WinAnimation.svelte';
	import BigWinFx from './BigWinFx.svelte';
	import BannerMarquee from './BannerMarquee.svelte';

	type AnimationName = 'intro' | 'idle';

	const context = getContext();

	let show = $state(true);
	let animationName = $state<AnimationName>('intro');
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});
	let onHideComplete = $state(() => {});

	// same big-win shake/flash treatment as Win.svelte, so the free-spins
	// round total reads as the same tier of celebration as an in-spin win
	let shake = $state({ x: 0, y: 0 });
	const startShake = (intensity: number) => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 700;
			if (p >= 1) {
				shake = { x: 0, y: 0 };
				clearInterval(id);
				return;
			}
			const amp = 11 * intensity * (1 - p) ** 2;
			shake = { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp };
		}, 16);
	};

	let flash = $state(0);
	let punch = $state(1);
	const startImpact = (intensity: number, echo: boolean) => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 280;
			if (p >= 1) {
				flash = 0;
				punch = 1;
				clearInterval(id);
				if (echo) setTimeout(() => startEchoFlash(intensity), 90);
				return;
			}
			flash = Math.max(0, 0.8 * intensity * (1 - p * 1.4));
			punch = 1 + 0.14 * intensity * (1 - p) ** 2;
		}, 16);
	};

	const startEchoFlash = (intensity: number) => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 180;
			if (p >= 1) {
				flash = 0;
				clearInterval(id);
				return;
			}
			flash = Math.max(0, 0.5 * intensity * (1 - p * 1.6));
		}, 16);
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		// wait for the fade-out to actually finish before resolving — freeSpinEnd's
		// handler awaits this via broadcastAsync so a following presentation can't
		// start while this one is still visibly on screen fading out
		freeSpinOutroHide: () =>
			waitForResolve((resolve) => {
				onHideComplete = resolve;
				show = false;
			}),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			if (emitterEvent.winLevelData.type === 'big') {
				const alias = emitterEvent.winLevelData.alias;
				const intensity = WIN_TIER_INTENSITY[alias] ?? 1;
				startShake(intensity);
				startImpact(intensity, alias === 'epic' || alias === 'max');
			}
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show} oncomplete={() => !show && onHideComplete()}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		{@const isBigWin = winLevelData.type === 'big'}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount
					onmount={async () => {
						if (isBigWin) await waitForTimeout(90);
						await startCountUp();
						await waitForTimeout(isBigWin ? (WIN_TIER_LINGER_MS[winLevelData.alias] ?? 1300) : 300);
						oncomplete();
					}}
				/>

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				{#if isBigWin}
					<!-- same gem-banner/BigWinFx/tier-escalation treatment as Win.svelte,
					     so the free-spins-round total feels like the same celebration as
					     an in-spin win, not a lesser copy -->
					{@const intensity = WIN_TIER_INTENSITY[winLevelData.alias] ?? 1}
					{@const marquee = WIN_TIER_MARQUEE[winLevelData.alias]}
					<MainContainer>
						<BigWinFx
							x={context.stateGameDerived.boardLayout().x + shake.x * 0.4}
							y={context.stateGameDerived.boardLayout().y + shake.y * 0.4}
							{intensity}
						/>
					</MainContainer>

					{#snippet bannerFxSnippet()}
						{#if marquee}
							<BannerMarquee dotCount={marquee.count} speed={marquee.speed} />
						{/if}
					{/snippet}

					<MainContainer>
						<Container
							x={context.stateGameDerived.boardLayout().x + shake.x}
							y={context.stateGameDerived.boardLayout().y + shake.y}
							scale={punch}
						>
							{#if winLevelData.animation}
								<WinAnimation
									animationMap={winLevelData.animation}
									bannerFx={marquee ? bannerFxSnippet : undefined}
								>
									<Sprite key="countPlaque" anchor={0.5} width={SYMBOL_SIZE * 9.4} height={SYMBOL_SIZE * 2.4} />
									<ResponsiveBitmapText
										anchor={0.5}
										maxWidth={SYMBOL_SIZE * 8.4}
										text={bookEventAmountToCurrencyString(countUpAmount)}
										style={{
											fontFamily: 'gold',
											fontSize: SYMBOL_SIZE * 1.6,
											align: 'center',
											fontWeight: 'bold',
											letterSpacing: 0,
										}}
									/>
								</WinAnimation>
							{/if}
						</Container>
					</MainContainer>
				{:else}
					<FreeSpinAnimation>
						{#snippet children({ sizes })}
							<Sprite
								anchor={{ x: 0.5, y: 1.2 }}
								width={500 * 4.5}
								height={80 * 4.5}
								key="winsmall_{stateUrlDerived.lang()}.png"
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
									<ResponsiveBitmapText
										anchor={0.5}
										style={{
											fontFamily: 'gold',
											fontSize: sizes.width * 0.08,
										}}
										text={bookEventAmountToCurrencyString(countUpAmount)}
										maxWidth={sizes.width}
									/>
								</SpineSlot>
							</SpineProvider>

							<Sprite anchor={{ x: 0.5, y: -2 }} width={177 * 3} height={42 * 3} key="totalwin.png" />
						{/snippet}
					</FreeSpinAnimation>
				{/if}

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				{#if flash > 0}
					<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flash} />
				{/if}

				<PressToContinue
					position="betweenBoardAndBottom"
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
