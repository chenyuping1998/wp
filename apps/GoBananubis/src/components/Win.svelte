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
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import BigWinFx from './BigWinFx.svelte';
	import FxBurst from './FxBurst.svelte';
	import GoldText from './GoldText.svelte';
	import PlaqueMesh from './PlaqueMesh.svelte';
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
		// each plaque glows in its own stone (design/generate_win_banners.mjs):
		// lapis, turquoise, carnelian, then gold for obsidian and for the gold MAX.
		// Big was jungle green, and the pink under MAX belonged to the old set.
		big: { mult: 1, glowTint: 0x6c98ee },
		superwin: { mult: 1.15, glowTint: 0x3fd0bd },
		mega: { mult: 1.3, glowTint: 0xff7a4a },
		epic: { mult: 1.5, glowTint: 0xffd75e },
		max: { mult: 1.8, glowTint: 0xfff3c4 },
	};

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	// camera shake as the presentation slams in
	let shake = $state({ x: 0, y: 0 });
	const startShake = (ms = 700, peak = 11) => {
		const start = Date.now();
		const id = setInterval(() => {
			const p = (Date.now() - start) / ms;
			if (p >= 1) {
				shake = { x: 0, y: 0 };
				clearInterval(id);
				return;
			}
			const amp = peak * (1 - p) ** 2;
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

	// ── THE AMOUNT LANDS ──────────────────────────────────────────────────────
	//
	// The count-up used to simply stop: the last digit arrived and nothing marked
	// it, so the one number the whole presentation exists to show had no moment of
	// its own. Now when it finishes (by itself or on a press) the figure swells
	// and settles back like something set down hard, the plaque flares, the camera
	// takes a short knock and a burst of gilt and inlay goes off behind the digits,
	// with a stone thud under it — a tablet being set in place.
	//
	// Big wins only; a small win's rolling figure over the board stays quiet.
	// Timer-driven like the rest of this file's shakes, so a backgrounded tab
	// cannot leave the figure stuck swollen.
	let landPunch = $state(1);
	let landFlare = $state(0);
	let landBurst = $state(0);
	// when the amount landed, on the plaque's FX clock: the plaque mesh sends a
	// second ripple out from the number well (PlaqueMesh / meshWin/plaque.ts)
	let landAtFx = $state(-1);
	const landAmount = () => {
		if (winLevelData?.type !== 'big') return;
		landAtFx = fxNow;
		const start = Date.now();
		landBurst++;
		startShake(320, 6);
		context.eventEmitter.broadcast({ type: 'soundStoneCrack', step: 0 });
		const id = setInterval(() => {
			const p = (Date.now() - start) / 520;
			if (p >= 1) {
				landPunch = 1;
				landFlare = 0;
				clearInterval(id);
				return;
			}
			// up fast, then a damped settle: overshoot, a small dip, rest
			landPunch = 1 + 0.32 * Math.exp(-p * 5.5) * Math.cos(p * Math.PI * 2.4 - 0.9) * (p < 0.08 ? p / 0.08 : 1);
			landFlare = 0.6 * (1 - p) ** 2;
		}, 16);
	};
	onCountUpComplete = landAmount;

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
		landAtFx = -1;
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
			blink: Math.max(blink, landFlare),
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
								<!-- the plaque itself, through a mesh: an impact ripple and a crest
								     jolt on the slam, another ripple when the amount lands, a hung
								     sign's sway while it holds; its additive self-copy is the flare -->
								{#key bannerKey}
									<PlaqueMesh
										textureKey={bannerKey}
										width={bw}
										height={bh}
										t={Math.max(0, fxNow)}
										landAge={landAtFx < 0 ? -1 : fxNow - landAtFx}
										mult={fx.mult}
										blink={bannerPose.blink}
									/>
								{/key}
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
								<!-- rounded: the tween passes fractional cents, which the formatter
								     printed as $7,806.6667 while the figure rolled -->
								<Container y={bh * 0.16} scale={landPunch}>
									<GoldText
										maxWidth={bw * 0.68}
										text={bookEventAmountToCurrencyString(Math.round(countUpAmount))}
										fontSize={bh * 0.24}
									/>
								</Container>
							</Container>
							{#key landBurst}
								{#if landBurst > 0}
									<FxBurst y={bh * 0.16} scale={1.3} flavour="tomb" />
								{/if}
							{/key}
							{#if burstShown}
								<FxBurst scale={1.7} flavour="tomb" oncomplete={() => (burstShown = false)} />
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
