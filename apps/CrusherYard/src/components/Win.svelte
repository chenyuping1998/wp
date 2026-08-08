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
	// Amounts are rounded before formatting. The count-up provider hands over a
	// float and the formatter passes the fraction straight through, so a rolling
	// amount read $9,289.1716 and only snapped to two decimals on the final
	// frame. Book amounts are integer minor units, so rounding is exact.
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
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

	// Supplied tier plaques (design/source/winBanners, lettered by
	// design/generate_win_banners.mjs).
	const BANNER_KEY: Record<string, string> = {
		big: 'cyWinBannerBig',
		superwin: 'cyWinBannerSuperwin',
		mega: 'cyWinBannerMega',
		epic: 'cyWinBannerEpic',
		max: 'cyWinBannerMax',
	};
	// These are title BARS, not plates: one well, filled by the tier name, and no
	// second line. So the amount is no longer inside the plaque — it sits below it,
	// which is also why it can now be half again the size it was.
	//
	// Each tier has its own aspect ratio, because the art gets taller as the
	// ornament grows (97px at BIG, 160px at MAX). Sizing them all by WIDTH keeps
	// the bars a consistent length on screen and lets the ornate ones stand taller,
	// which is the point of them.
	const BANNER_SOURCE: Record<string, { width: number; height: number }> = {
		big: { width: 676, height: 97 },
		superwin: { width: 672, height: 97 },
		mega: { width: 685, height: 107 },
		epic: { width: 686, height: 122 },
		max: { width: 717, height: 160 },
	};
	// presentation intensity scales with the tier
	const TIER_FX: Record<string, { mult: number; glowTint: number }> = {
		big: { mult: 1, glowTint: 0x9ec44a },
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

	// camera shake as the presentation slams in
	let shake = $state({ x: 0, y: 0 });
	const startShake = () => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 700;
			if (p >= 1) {
				shake = { x: 0, y: 0 };
				clearInterval(id);
				return;
			}
			const amp = 11 * (1 - p) ** 2;
			shake = { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp };
		}, 16);
	};

	// hit-stop impact frame: white flash + scale punch on the slam-in
	let flash = $state(0);
	let punch = $state(1);
	const startImpact = () => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / 280;
			if (p >= 1) {
				flash = 0;
				punch = 1;
				clearInterval(id);
				return;
			}
			flash = Math.max(0, 0.8 * (1 - p * 1.4));
			punch = 1 + 0.14 * (1 - p) ** 2;
		}, 16);
	};

	// ── plaque FX clock: entrance overshoot, breathing glow, periodic blink,
	// rim twinkles and repeating bursts on the top tiers ──────────────────────
	let fxNow = $state(-1);
	let fxRaf = 0;
	let twinkles = $state<{ id: number; born: number; angle: number }[]>([]);
	let nextTwinkleAt = 0;
	let nextTwinkleId = 0;
	let burstShown = $state(false);
	let nextBurstAt = 0;

	const startBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		twinkles = [];
		nextTwinkleAt = 0;
		nextBurstAt = 0;
		burstShown = true;
		const start = performance.now();
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			const mult = winLevelData ? (TIER_FX[winLevelData.alias]?.mult ?? 1) : 1;
			if (fxNow >= nextTwinkleAt) {
				twinkles = [
					...twinkles.filter(({ born }) => fxNow - born < 0.7),
					{ id: nextTwinkleId++, born: fxNow, angle: Math.random() * Math.PI * 2 },
				];
				nextTwinkleAt = fxNow + (0.34 - 0.1 * mult) + Math.random() * 0.2;
			} else {
				const alive = twinkles.filter(({ born }) => fxNow - born < 0.7);
				if (alive.length !== twinkles.length) twinkles = alive;
			}
			// epic/max keep erupting while the presentation holds
			if (mult >= 1.5 && fxNow >= nextBurstAt) {
				burstShown = true;
				nextBurstAt = fxNow + 1.6;
			}
			fxRaf = requestAnimationFrame(tick);
		};
		fxRaf = requestAnimationFrame(tick);
	};
	const stopBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		fxNow = -1;
		twinkles = [];
	};
	onDestroy(stopBannerFx);

	const bannerPose = $derived.by(() => {
		if (fxNow < 0) return { scale: 1, glow: 0.4, blink: 0 };
		const t = fxNow;
		// entrance: overshoot slam matching the hit-stop flash
		const scale =
			t < 0.34
				? 0.42 + 0.78 * (1 - (1 - t / 0.34) ** 3)
				: 1.2 - 0.2 * Math.min(1, (t - 0.34) / 0.22) + 0.015 * Math.sin(t * 3.2);
		// periodic blink: a bright additive pulse every ~2.3s + entrance flare
		const phase = (t + 1.9) % 2.3;
		const blink = Math.max(
			t < 0.3 ? 0.55 * (1 - t / 0.3) : 0,
			phase < 0.32 ? 0.34 * (1 - phase / 0.32) : 0,
		);
		return {
			scale,
			glow: 0.42 + 0.24 * (0.5 + 0.5 * Math.sin(t * 2.6)),
			blink,
		};
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
				startShake();
				startImpact();
				startBannerFx();
			}
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
						// Hold on the final figure, then release. This was 1300ms, which is
						// a round's-end pause; the plaque fires once per SPIN here, so it
						// was being paid ten to eighteen times inside one feature on top of
						// the count-up itself. See winLevelMap for the measurement.
						await waitForTimeout(isBigWin ? 400 : 200);
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
							{@const src = BANNER_SOURCE[alias] ?? BANNER_SOURCE.big}
							<!--
								The bar is deliberately wider than the board (756 against 588).
								These frames are thin by construction — BIG is 676x97 — so the only
								way to give the plaque vertical mass without stretching the art is
								to scale the whole thing up, and overhanging the board is the price.
								It reads fine on a celebration overlay, which already dims
								everything behind it.
							-->
							{@const bw = SYMBOL_SIZE * 9}
							{@const bh = bw * (src.height / src.width)}
							{@const amountSize = SYMBOL_SIZE}
							<Container scale={bannerPose.scale}>
								<!-- breathing glow bed behind the plaque -->
								<Sprite
									key="fxGlow"
									anchor={0.5}
									tint={fx.glowTint}
									blendMode="add"
									width={bw * 1.3}
									height={bh * 3.4}
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
								<!-- twinkles running the riveted rim -->
								{#each twinkles as tw (tw.id)}
									{@const p = Math.min(1, (fxNow - tw.born) / 0.7)}
									<Sprite
										key="fxStar"
										anchor={0.5}
										x={Math.cos(tw.angle) * bw * 0.46}
										y={Math.sin(tw.angle) * bh * 0.46}
										rotation={p * 2}
										tint={0xffffff}
										blendMode="add"
										width={SYMBOL_SIZE * 0.5 * Math.sin(p * Math.PI)}
										height={SYMBOL_SIZE * 0.5 * Math.sin(p * Math.PI)}
										alpha={Math.sin(p * Math.PI)}
									/>
								{/each}
								<!--
									Amount below the bar, not inside it: the well carries the tier
									name now. Offset from the bar's own half-height so the gap stays
									constant as the plaques change height between tiers.
								-->
								<GoldText
									y={bh * 0.5 + amountSize * 0.72}
									maxWidth={bw * 0.86}
									text={bookEventAmountToCurrencyString(Math.round(countUpAmount))}
									fontSize={amountSize}
								/>
							</Container>
							{#if burstShown}
								<FxBurst scale={1.7} flavour="slag" oncomplete={() => (burstShown = false)} />
							{/if}
						{:else}
							<!-- small wins: just the rolling amount over the board -->
							<GoldText
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToCurrencyString(Math.round(countUpAmount))}
								fontSize={SYMBOL_SIZE}
							/>
						{/if}
					</Container>
				</MainContainer>

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
