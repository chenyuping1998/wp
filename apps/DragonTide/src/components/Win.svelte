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
	import { FadeContainer } from 'components-pixi';
	import { waitForTimeout } from 'utils-shared/wait';
	// Amounts are rounded before formatting. The count-up provider hands over a
	// float and the formatter passes the fraction straight through, so a rolling
	// amount read $9,289.1716 and only snapped to two decimals on the final
	// frame. Book amounts are integer minor units, so rounding is exact.
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';

	import WinCoins from './WinCoins.svelte';
	import BigWinFx from './BigWinFx.svelte';
	import FxBurst from './FxBurst.svelte';
	import GoldText from './GoldText.svelte';
	import { TITLE_FONT } from '../game/fonts';
	import PressToContinue from './PressToContinue.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import {symbolIdleClock} from '../game/symbolIdleClock.svelte';
	import artGeometry from '../game/artGeometry.json';
	import { winLevelMap, type WinLevel } from '../game/winLevelMap';
	import { plaqueThreshold } from '../game/winTiers';

	const context = getContext();

	// Tier plaques (gen-order-1109: wave crest, waterspout, coral palace, rising dragon, golden
	// dragon). The tier name is drawn by the program, so the art stays language-neutral.
	const BANNER_KEY: Record<string, string> = {
		big: 'mgWinBannerBig',
		superwin: 'mgWinBannerSuperwin',
		mega: 'mgWinBannerMega',
		epic: 'mgWinBannerEpic',
		max: 'mgWinBannerMax',
	};
	// These are title BARS, not plates: one well, filled by the tier name, and no
	// second line. So the amount is no longer inside the plaque — it sits below it,
	// which is also why it can now be half again the size it was.
	//
	// Each tier has its own aspect ratio, because the art gets taller as the
	// ornament grows (97px at BIG, 160px at MAX). Sizing them all by WIDTH keeps
	// the bars a consistent length on screen and lets the ornate ones stand taller,
	// which is the point of them.
	const BANNER_SOURCE: Record<string, { width:number; height:number; textY:number; textHeight:number; textWidth:number }> = artGeometry.banners;
	// presentation intensity scales with the tier
	const TIER_FX: Record<string, { mult: number; glowTint: number }> = {
		big: { mult: 1, glowTint: 0x5fd3c4 },
		superwin: { mult: 1.15, glowTint: 0xffd75e },
		mega: { mult: 1.3, glowTint: 0xff9a6a },
		epic: { mult: 1.5, glowTint: 0xff6a5a },
		max: { mult: 1.8, glowTint: 0xfff0b0 },
	};
	let show = $state(false);
	$effect(()=>{symbolIdleClock.bannerPaused=show;});
	onDestroy(()=>{symbolIdleClock.bannerPaused=false;});

	// 天使奧丁 §6: the plaque climbs tier by tier while the amount counts up from 0 without a
	// break. BIG, SUPER... each last 3.0 s and the count crosses into the next tier as each ends;
	// the last tier counts to the top (BIG / SUPER ~1.7 s in, MEGA and up ~2.5 s) and holds,
	// 3.0 s in all (MEGA and up 5.0 s): BIG alone ~3.1 s, to SUPER ~6.3 s, to MEGA ~11.4 s.
	// Crossing into a tier flares at the amount; its name and plaque take over 0.25 s later.
	// The count starts as the plaque lands (0.3 s).
	type Step = { level: number; from: number; to: number; start: number; countEnd: number; end: number };
	const STEP_S = 3, SWAP_S = 0.25, COUNT_START_S = 0.3, SKIP_HOLD_S = 1;
	const lastStepS = (level: number) => (level >= 8 ? 5 : 3);
	const lastCountS = (level: number) => (level >= 8 ? 2.5 : 1.7);
	const planSteps = (finalLevel: number, total: number): Step[] => {
		const levels = [6, 7, 8, 9, 10].filter((level) => level <= finalLevel);
		return levels.map((level, i) => {
			const start = i * STEP_S;
			const last = i === levels.length - 1;
			return {
				level,
				from: i === 0 ? 0 : plaqueThreshold(level),
				to: last ? total : plaqueThreshold(levels[i + 1]),
				start,
				countEnd: last ? start + lastCountS(level) : start + STEP_S,
				end: last ? start + lastStepS(level) : start + STEP_S,
			};
		});
	};

	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let steps = $state.raw<Step[]>([]);
	let elapsed = $state(0);
	let finish = () => {};
	let skipTo = -1;
	const isBigWin = $derived(winLevelData?.type === 'big');
	const stepIndex = $derived.by(() => {
		let index = 0;
		for (let i = 1; i < steps.length; i++) if (elapsed >= steps[i].start) index = i;
		return index;
	});
	// the tier on show lags the crossing by SWAP_S
	const shownIndex = $derived(stepIndex > 0 && elapsed < steps[stepIndex].start + SWAP_S ? stepIndex - 1 : stepIndex);
	const shownData = $derived(isBigWin && steps.length ? winLevelMap[steps[shownIndex].level as WinLevel] : winLevelData);
	const countUpAmount = $derived.by(() => {
		const step = steps[stepIndex];
		if (!step) return amount;
		const from = stepIndex === 0 ? Math.max(step.start, COUNT_START_S) : step.start;
		const t = Math.max(0, Math.min(1, (elapsed - from) / Math.max(0.01, step.countEnd - from)));
		// steady through the tiers it passes, easing only into the final figure
		const k = stepIndex === steps.length - 1 ? 1 - (1 - t) ** 2 : t;
		return step.from + (step.to - step.from) * k;
	});
	const countUpCompleted = $derived(steps.length > 0 && elapsed >= steps[steps.length - 1].countEnd);

	// Only the plaque's bounded entrance moves. No screen flash or camera shake.
	// Plaque entrance on each tier, steady light, rim twinkles and top-tier stone bursts.
	let fxNow = $state(-1);
	let poseFrom = $state(0);
	let fxRaf = 0;
	let twinkles = $state<{ id: number; born: number; angle: number }[]>([]);
	let nextTwinkleAt = 0;
	let nextTwinkleId = 0;
	let burstShown = $state(false);
	let nextBurstAt = 0;
	// the tier-up flare at the amount: a ball of the new tier's light and a burst of paper
	let flareKey = $state(0);
	let flareAt = $state(-10);
	let flareTint = $state(0xffffff);
	const flare = $derived(fxNow < 0 ? 1 : Math.min(1, (fxNow - flareAt) / 0.45));

	const startBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		twinkles = [];
		nextTwinkleAt = 0;
		nextBurstAt = 0;
		burstShown = true;
		poseFrom = 0;
		const start = performance.now();
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			const mult = shownData ? (TIER_FX[shownData.alias]?.mult ?? 1) : 1;
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
		const t = fxNow - poseFrom;
		// 0.9s entrance: a quick pose, a clear hold, then settle once.
		const scale =
			t < 0.34
				? 0.42 + 0.68 * (1 - (1 - t / 0.34) ** 3)
				: t < 0.59
					? 1.1
					: 1.1 - 0.1 * Math.min(1, (t - 0.59) / 0.31);
		return { scale, glow: 0.42, blink: 0 };
	});

	// each new tier: the flare at the amount, then (SWAP_S later) its plaque comes in
	let lastShown = -1;
	$effect(() => {
		const index = shownIndex;
		if (!isBigWin || index === lastShown) return;
		const first = lastShown < 0;
		lastShown = index;
		if (first) return;
		poseFrom = Math.max(0, fxNow);
		context.eventEmitter.broadcast({ type: 'soundBigWinBlast', tier: Math.min(5, Math.max(1, steps[index].level - 5)) as 1 | 2 | 3 | 4 | 5 });
	});
	let lastStep = -1;
	$effect(() => {
		const index = stepIndex;
		if (!isBigWin || index === lastStep) return;
		const first = lastStep < 0;
		lastStep = index;
		if (first) return;
		const alias = winLevelMap[steps[index].level as WinLevel]?.alias ?? 'big';
		flareTint = TIER_FX[alias]?.glowTint ?? 0xffffff;
		flareAt = Math.max(0, fxNow);
		flareKey++;
	});

	const play = (total: number, data: WinLevelData) =>
		new Promise<void>((resolve) => {
			amount = total;
			winLevelData = data;
			lastShown = -1;
			lastStep = -1;
			skipTo = -1;
			elapsed = 0;
			steps =
				data.type === 'big'
					? planSteps(data.level, total)
					: [{ level: data.level, from: 0, to: total, start: 0, countEnd: data.presentDuration / 1000, end: data.presentDuration / 1000 + 0.2 }];
			if (data.type === 'big') startBannerFx();
			let raf = 0, last = performance.now(), done = false;
			const end = () => {
				if (done) return;
				done = true;
				cancelAnimationFrame(raf);
				document.removeEventListener('visibilitychange', onVisibility);
				elapsed = steps[steps.length - 1].end;
				finish = () => {};
				resolve();
			};
			// a hidden tab gets no frames: settle on the final figure instead of hanging
			const onVisibility = () => {
				last = performance.now();
				if (document.hidden) end();
			};
			document.addEventListener('visibilitychange', onVisibility);
			finish = end;
			const tick = (now: number) => {
				const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
				last = now;
				elapsed = skipTo >= 0 && elapsed < skipTo ? skipTo : elapsed + dt;
				if (elapsed >= steps[steps.length - 1].end) end();
				else raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
		});

	// a press while counting jumps to the final tier and figure and holds it a moment; a press
	// after that closes the plaque
	const press = () => {
		const final = steps[steps.length - 1];
		if (!final) return;
		if (!countUpCompleted) skipTo = Math.max(final.countEnd, final.end - SKIP_HOLD_S);
		else finish();
	};

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: async () => {
			show = false;
			await waitForTimeout(500);
			stopBannerFx();
		},
		winUpdate: async (emitterEvent) => {
			await play(emitterEvent.amount, emitterEvent.winLevelData);
		},
	});
</script>

<FadeContainer {show} duration={500}>
	{#if winLevelData}
				{#if isBigWin}
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />
				{/if}

				{#if isBigWin}
					{@const fx = TIER_FX[shownData?.alias ?? 'big'] ?? TIER_FX.big}
					<MainContainer>
						<BigWinFx
							x={context.stateGameDerived.boardLayout().x}
							y={context.stateGameDerived.boardLayout().y}
							intensity={fx.mult}
						/>
					</MainContainer>
				{/if}

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x}
						y={context.stateGameDerived.boardLayout().y}
					>
						{#if isBigWin}
							{@const alias = shownData?.alias ?? 'big'}
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
								<!-- steady, local glow behind the plaque -->
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
								<GoldText text={shownData?.text ?? 'BIG WIN'} fontFamily={TITLE_FONT} y={bh * src.textY}
									fontSize={Math.min(SYMBOL_SIZE * 0.84,bh * src.textHeight * 0.62)} maxWidth={bw * src.textWidth * 0.82} />
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
								{#if flare < 1}
									<Sprite
										key="fxGlow"
										anchor={0.5}
										y={bh * 0.5 + amountSize * 0.72}
										tint={flareTint}
										blendMode="add"
										width={amountSize * (1.2 + 3.2 * flare)}
										height={amountSize * (1.2 + 3.2 * flare)}
										alpha={1 - flare}
									/>
								{/if}
							</Container>
							{#if burstShown}
								<FxBurst scale={1.7} flavour="paper" oncomplete={() => (burstShown = false)} />
							{/if}
							{#key flareKey}
								{#if flareKey > 0}
									<FxBurst y={(bh * 0.5 + amountSize * 0.72) * bannerPose.scale} scale={1.1} flavour="paper" />
								{/if}
							{/key}
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

				<WinCoins emit={!countUpCompleted} levelAlias={shownData?.alias} />

				<PressToContinue position="betweenBoardAndBottom" onpress={press} />
	{/if}
</FadeContainer>
