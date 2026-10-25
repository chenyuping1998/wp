<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCountUpString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import BigWinFx from './BigWinFx.svelte';
	import FxBurst from './FxBurst.svelte';
	import GoldText from './GoldText.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';

	const context = getContext();

	// flat-print tier plaques (design/generate_win_banners.mjs) — 1000×560,
	// the amount rolls inside the dark centre well
	const BANNER_KEY: Record<string, string> = {
		big: 'gbWinBannerBig',
		superwin: 'gbWinBannerSuperwin',
		mega: 'gbWinBannerMega',
		epic: 'gbWinBannerEpic',
		max: 'gbWinBannerMax',
	};
	const BANNER_RATIO = 560 / 1000;
	// presentation intensity scales with the tier
	const TIER_FX: Record<string, { mult: number; glowTint: number }> = {
		big: { mult: 1, glowTint: 0xe8c478 },
		superwin: { mult: 1.15, glowTint: 0xffd75e },
		mega: { mult: 1.3, glowTint: 0xffa347 },
		epic: { mult: 1.5, glowTint: 0xff7a4a },
		max: { mult: 1.8, glowTint: 0xff8ede },
	};

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	// ── plaque FX clock: the entrance slam, its flash and shake ──────────────
	let fxNow = $state(-1);
	let fxRaf = 0;
	let burstShown = $state(false);
	// One cancellable clock drives the entire entrance. A skipped count-up or
	// new tier cannot leave old shake/flash intervals running over the next one.
	const shake = $derived.by(() => {
		if (fxNow < 0 || fxNow >= 0.5) return { x: 0, y: 0 };
		const amplitude = 8 * (1 - fxNow / 0.5) ** 2;
		return { x: Math.sin(fxNow * 91) * amplitude, y: Math.sin(fxNow * 117) * amplitude * 0.65 };
	});
	const flash = $derived(fxNow >= 0 ? Math.max(0, 0.45 * (1 - fxNow / 0.16)) : 0);
	const punch = $derived(fxNow >= 0 ? 1 + 0.1 * Math.max(0, 1 - fxNow / 0.28) ** 2 : 1);

	const startBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		fxNow = 0;
		burstShown = true;
		const start = performance.now();
		// the clock only has work while the entrance plays; after that the
		// plaque is still and the count-up is the motion
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			if (fxNow < 1.2) fxRaf = requestAnimationFrame(tick);
		};
		fxRaf = requestAnimationFrame(tick);
	};
	const stopBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		fxNow = -1;
		burstShown = false;
	};
	onDestroy(stopBannerFx);

	const bannerPose = $derived.by(() => {
		if (fxNow < 0) return { scale: 1, glow: 0.4, blink: 0 };
		const t = fxNow;
		// entrance (2026-10-23, spine-generator's strike/spring): slams in from
		// 0.42 on an ease-in, overshoots, and rings out on a damped spring
		// (4.5Hz, damping 0.42) instead of the old straight-line settle, whose
		// corner at 0.34s read as a stop
		const SLAM = 0.16;
		const scale =
			t < SLAM
				? 0.42 + 0.58 * (t / SLAM) ** 2
				: 1 + 0.2 * Math.exp(-0.42 * 2 * Math.PI * 4.5 * (t - SLAM)) * Math.sin(2 * Math.PI * 4.5 * Math.sqrt(1 - 0.42 ** 2) * (t - SLAM)) / 0.62;
		// THE ENTRANCE IS THE EVENT, then the plaque holds still (2026-10-16,
		// review: poor animation). It used to breathe on a sine, swell and
		// shrink, and flash its whole face every 2.3s for as long as it stayed
		// up; a plaque that never stops pulsing is the look of a template. One
		// flare on the slam, then stillness — the number counting up is the
		// motion. (The light sweep across the face went with the brass plate:
		// a flat-print panel has no sheen to catch it.)
		const blink = t < 0.3 ? 0.4 * (1 - t / 0.3) : 0;
		return { scale, glow: 0.5, blink };
	});

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => {
			show = false;
			stopBannerFx();
		},
		winUpdate: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			if (emitterEvent.winLevelData.type === 'big') {
				startBannerFx();
			} else stopBannerFx();
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />
				{/if}

				<OnMount
					onmount={async () => {
						// impact hold: freeze a few frames under the white flash before
						// the numbers start rolling
						if (isBigWin) await waitForTimeout(90);
						await startCountUp();
						await waitForTimeout(isBigWin ? 1300 : 300);
						oncomplete();
					}}
				/>

				{#if isBigWin}
					{@const fx = TIER_FX[winLevelData.alias] ?? TIER_FX.big}
					<MainContainer>
						<BigWinFx
							x={context.stateGameDerived.boardLayout().x + shake.x * 0.4}
							y={context.stateGameDerived.boardLayout().y + shake.y * 0.4}
							intensity={fx.mult}
						/>
					</MainContainer>
				{/if}

				<!-- the bananas fly BEHIND the plaque: in front of it they covered the
				     amount the whole presentation is about -->
				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x + shake.x}
						y={context.stateGameDerived.boardLayout().y + shake.y}
						scale={punch}
					>
						{#if isBigWin}
							{@const alias = winLevelData.alias}
							{@const fx = TIER_FX[alias] ?? TIER_FX.big}
							{@const bannerKey = BANNER_KEY[alias] ?? BANNER_KEY.big}
							{@const bw = SYMBOL_SIZE * 5.2}
							{@const bh = bw * BANNER_RATIO}
							<Container scale={bannerPose.scale}>
								<!-- breathing glow bed behind the plaque -->
								<Sprite
									key="fxGlow"
									anchor={0.5}
									tint={fx.glowTint}
									blendMode="add"
									width={bw * 1.45}
									height={bh * 1.8}
									alpha={bannerPose.glow}
								/>
								<Sprite key={bannerKey} anchor={0.5} width={bw} height={bh} />
								<!-- additive self-copy = the whole plaque flares -->
								{#if bannerPose.blink > 0}
									<Sprite
										key={bannerKey}
										anchor={0.5}
										width={bw}
										height={bh}
										blendMode="add"
										alpha={bannerPose.blink}
									/>
								{/if}
								<!-- amount rolls inside the plaque's dark centre well -->
								<GoldText
									y={bh * 0.16}
									maxWidth={bw * 0.68}
									text={bookEventAmountToCountUpString(countUpAmount, amount)}
									fontSize={bh * 0.24}
								/>
							</Container>
							{#if burstShown}
								<FxBurst scale={1.7} flavour="gold" oncomplete={() => (burstShown = false)} />
							{/if}
						{:else}
							<!-- small wins: just the rolling amount over the board -->
							<GoldText
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToCountUpString(countUpAmount, amount)}
								fontSize={SYMBOL_SIZE}
							/>
						{/if}
					</Container>
				</MainContainer>

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
