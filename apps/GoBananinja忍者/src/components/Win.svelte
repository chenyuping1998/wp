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

	// brass tier plaques (design/generate_win_banners.mjs) — 1000×560, the
	// amount rolls inside the dark centre well
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

	// ── plaque FX clock: entrance overshoot, breathing glow, periodic blink,
	// rim twinkles and repeating bursts on the top tiers ──────────────────────
	let fxNow = $state(-1);
	let fxRaf = 0;
	let twinkles = $state<{ id: number; born: number; angle: number }[]>([]);
	let nextTwinkleAt = 0;
	let nextTwinkleId = 0;
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
		twinkles = [];
		nextTwinkleAt = 0;
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
				nextTwinkleAt = fxNow + (0.7 - 0.12 * mult) + Math.random() * 0.4;
			} else {
				const alive = twinkles.filter(({ born }) => fxNow - born < 0.7);
				if (alive.length !== twinkles.length) twinkles = alive;
			}
			fxRaf = requestAnimationFrame(tick);
		};
		fxRaf = requestAnimationFrame(tick);
	};
	const stopBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		fxNow = -1;
		twinkles = [];
		burstShown = false;
	};
	onDestroy(stopBannerFx);

	const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));
	const bannerPose = $derived.by(() => {
		if (fxNow < 0) return { scale: 1, glow: 0.4, blink: 0 };
		const t = fxNow;
		// entrance: overshoot slam matching the hit-stop flash
		const scale =
			t < 0.34
				? 0.42 + 0.78 * (1 - (1 - t / 0.34) ** 3)
				: 1.2 - 0.2 * Math.min(1, (t - 0.34) / 0.22);
		// THE ENTRANCE IS THE EVENT, then the plaque holds still (2026-10-16,
		// review: poor animation). It used to breathe on a sine, swell and
		// shrink, and flash its whole face every 2.3s for as long as it stayed
		// up; a plaque that never stops pulsing is the look of a template. One
		// flare on the slam, one light sweep across the face, then stillness —
		// the number counting up is the motion.
		const blink = Math.max(t < 0.3 ? 0.55 * (1 - t / 0.3) : 0, 0.32 * bump(t, 0.75, 1.35));
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
								<!-- twinkles running the riveted rim -->
								{#each twinkles as tw (tw.id)}
									{@const p = Math.min(1, (fxNow - tw.born) / 0.7)}
									<Sprite
										key="fxStar"
										anchor={0.5}
										x={Math.cos(tw.angle) * bw * 0.46}
										y={Math.sin(tw.angle) * bh * 0.44}
										rotation={p * 2}
										tint={0xffffff}
										blendMode="add"
										width={SYMBOL_SIZE * 0.5 * Math.sin(p * Math.PI)}
										height={SYMBOL_SIZE * 0.5 * Math.sin(p * Math.PI)}
										alpha={Math.sin(p * Math.PI)}
									/>
								{/each}
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
