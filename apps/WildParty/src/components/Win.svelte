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
	import { FadeContainer, WinCountUpProvider, ResponsiveText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import BigWinFx from './BigWinFx.svelte';
	import FxBurst from './FxBurst.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { neonNumberStyle } from '../game/textStyles';
	import winBanners from '../game/winBanners.json';
	import { CHROME_LIGHT, GOLD_ACCENT, LIME, MAGENTA } from '../game/palette';

	const context = getContext();

	// AI-painted plaques (design/process_win_banners.mjs); amount rolls inside
	// each plaque's velvet center — vertical center offset tuned per artwork
	const BANNER_KEY: Record<string, string> = {
		big: 'winBannerBig',
		superwin: 'winBannerSuperwin',
		mega: 'winBannerMega',
		epic: 'winBannerEpic',
		max: 'winBannerMax',
	};
	const AMOUNT_Y_FRAC: Record<string, number> = {
		big: 0.1,
		superwin: 0.1,
		mega: 0.16,
		epic: 0.12,
		max: 0.3,
	};
	// presentation intensity scales with the tier
	// The intensity ladder was already here; only the colours were off-palette
	// (gold, pink, purple, orange-red, cyan — five hues from no particular
	// system). They now climb the same ladder the printed banners do, so the
	// light around the plaque and the plaque itself agree about which tier this
	// is: chrome for the first two steps, then the accents, then gold.
	//
	// Gold arriving only at epic/max is the point — palette.ts reserves gold for
	// money, so the tiers where it appears are the ones that feel like money.
	const TIER_FX: Record<string, { mult: number; glowTint: number }> = {
		big: { mult: 1, glowTint: CHROME_LIGHT },
		superwin: { mult: 1.15, glowTint: MAGENTA },
		mega: { mult: 1.3, glowTint: LIME },
		epic: { mult: 1.5, glowTint: GOLD_ACCENT },
		max: { mult: 1.8, glowTint: 0xfff3cf },
	};

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	// camera shake as the big-win presentation slams in
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

	// ── banner FX clock: entrance overshoot, glow breathing, periodic blink
	// flash, gem twinkles, repeating bursts on the top tiers ─────────────────
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
			const mult = winLevelData ? TIER_FX[winLevelData.alias]?.mult ?? 1 : 1;
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
		// entrance: overshoot slam matching the existing hit-stop flash
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
			// Resolver armed before the animations start — the same race that froze
			// the free-spin trigger (Board.svelte) and the room transition
			// (Transition.svelte): a completion arriving between the start and the
			// assignment calls the previous no-op and this never resolves.
			const settled = waitForResolve<void>((resolve) => {
				oncomplete = resolve;
			});
			if (emitterEvent.winLevelData.type === 'big') {
				startShake();
				startImpact();
				startBannerFx();
			}
			await settled;
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
						// Big-win presentations linger an extra second after the count-up
						await waitForTimeout(isBigWin ? 1300 : 300);
						oncomplete();
					}}
				/>

				{#if isBigWin}
					<MainContainer>
						<BigWinFx
							x={context.stateGameDerived.boardLayout().x + shake.x * 0.4}
							y={context.stateGameDerived.boardLayout().y + shake.y * 0.4}
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
							{@const dims = winBanners[alias as keyof typeof winBanners]}
							{@const fx = TIER_FX[alias]}
							{@const bw = SYMBOL_SIZE * 4.65}
							{@const bh = (bw * dims.height) / dims.width}
							<Container scale={bannerPose.scale}>
								<!-- breathing glow bed behind the plaque -->
								<Sprite
									key="fxGlow"
									anchor={0.5}
									tint={fx.glowTint}
									blendMode="add"
									width={bw * 1.45}
									height={bh * 1.5}
									alpha={bannerPose.glow}
								/>
								<Sprite key={BANNER_KEY[alias]} anchor={0.5} width={bw} height={bh} />
								<!-- additive self-copy = the whole plaque blinks/flares -->
								{#if bannerPose.blink > 0}
									<Sprite
										key={BANNER_KEY[alias]}
										anchor={0.5}
										width={bw}
										height={bh}
										blendMode="add"
										alpha={bannerPose.blink}
									/>
								{/if}
								<!-- gem twinkles on the jeweled border -->
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
								<!-- amount rolls inside the plaque's velvet center -->
								<ResponsiveText
									anchor={0.5}
									y={bh * (AMOUNT_Y_FRAC[alias] ?? 0.12)}
									maxWidth={bw * 0.5}
									text={bookEventAmountToCurrencyString(countUpAmount)}
									style={neonNumberStyle(bh * 0.17)}
								/>
							</Container>
							{#if burstShown}
								<FxBurst scale={1.7} oncomplete={() => (burstShown = false)} />
							{/if}
						{:else}
							<!-- FG-total readout over the outro panel — sized to sit inside
							     the ornate plate, not dominate the screen -->
							<ResponsiveText
								anchor={0.5}
								maxWidth={SYMBOL_SIZE * 2.6}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								style={neonNumberStyle(SYMBOL_SIZE * 0.52)}
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
