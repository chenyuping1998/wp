<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { onDestroy } from 'svelte';
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import InkNumber from './InkNumber.svelte';
	import WinTierArt from './WinTierArt.svelte';
	import OrderStamp from './OrderStamp.svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString, bookEventAmountToCountUpString } from 'utils-shared/amount';
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

	// screenprint tier plaques (design/build_screenprint_ui.py) — 1000×560: a
	// coloured title band (the tier NAME is runtime type, below) over a paper
	// well the amount rolls in
	const BANNER_KEY: Record<string, string> = {
		big: 'v8WinBig',
		superwin: 'v8WinSuper',
		mega: 'v8WinMega',
		epic: 'v8WinEpic',
		max: 'v8WinMax',
	};
	const BANNER_RATIO = 900 / 1600;
	// the tier names, set in the display face on the plaque's title band (never
	// baked into the art); the yellow MAX band takes ink, the others paper
	const TIER_TITLE: Record<string, string> = {
		big: 'BIG WIN',
		superwin: 'SUPER WIN',
		mega: 'MEGA WIN',
		epic: 'EPIC WIN',
		max: 'MAX WIN',
	};
	// WHERE THE WORDS GO ON EACH PLAQUE (fractions of the 1600x900 art).
	// The five plaques were laid out with one shared position (title -9.5%,
	// amount +10% of the height), which only fits the ticket-shaped ones. EPIC is
	// a brine splash whose cream band is ~15% of the art's height, so its amount
	// overflowed (user, 2026-10-21). Each tier now uses its own measured cream
	// area (design/PLAN_2026-10-21.md):
	//   big   x 249-1346 y 318-678 (amount kept clear of the UP! stamp at 77.6%)
	//   super x 296-1312 y 310-683     mega x 341-1310 y 301-670
	//   epic  diamond band, y 400-552 mid / x 415-1317 at y 420-520: the amount
	//         alone fills it and the title sits above the splash, cream on ink
	//   max   sign x 361-1240 y 223-753 (cooks' hands at the top corners)
	type TextLayout = { cx: number; titleY: number; titleSize: number; titleW: number; titleOnArt?: boolean; amountY: number; amountSize: number; amountW: number };
	const TEXT_LAYOUT: Record<string, TextLayout> = {
		big: { cx: 0.5, titleY: 0.44, titleSize: 0.11, titleW: 0.5, amountY: 0.61, amountSize: 0.16, amountW: 0.44 },
		superwin: { cx: 0.505, titleY: 0.44, titleSize: 0.11, titleW: 0.56, amountY: 0.61, amountSize: 0.16, amountW: 0.56 },
		mega: { cx: 0.512, titleY: 0.43, titleSize: 0.11, titleW: 0.54, amountY: 0.6, amountSize: 0.16, amountW: 0.54 },
		epic: { cx: 0.541, titleY: 0.2, titleSize: 0.1, titleW: 0.5, titleOnArt: true, amountY: 0.53, amountSize: 0.12, amountW: 0.48 },
		max: { cx: 0.5, titleY: 0.43, titleSize: 0.11, titleW: 0.48, amountY: 0.61, amountSize: 0.16, amountW: 0.48 },
	};

	// presentation intensity scales with the tier
	const TIER_FX: Record<string, { mult: number; glowTint: number }> = {
		big: { mult: 1, glowTint: 0xf5e6be },
		superwin: { mult: 1.15, glowTint: 0xf5e6be },
		mega: { mult: 1.3, glowTint: 0xc45240 },
		epic: { mult: 1.5, glowTint: 0xc45240 },
		max: { mult: 1.8, glowTint: 0xc45240 },
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
		const id = everyFrame(() => {
			const p = (Date.now() - start) / 120;
			if (p >= 1) {
				shake = { x: 0, y: 0 };
				id();
				return;
			}
			const amp = 6 * (1 - p) ** 2;
			shake = { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp };
		});
	};

	// hit-stop impact frame: white flash + scale punch on the slam-in
	let flash = $state(0);
	let punch = $state(1);
	const startImpact = () => {
		const start = Date.now();
		const id = everyFrame(() => {
			const p = (Date.now() - start) / 280;
			if (p >= 1) {
				flash = 0;
				punch = 1;
				id();
				return;
			}
			flash = 0;
			punch = 1 + 0.14 * (1 - p) ** 2;
		});
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
			t < 0.55
				? 0.42 + 0.78 * (1 - (1 - t / 0.55) ** 3)
				: 1.2 - 0.2 * Math.min(1, (t - 0.55) / 0.35) + 0.015 * Math.sin(t * 3.2);
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

	// small wins: the amount stamps onto the board — in from 0.4 with an
	// overshoot, a little rotation that settles, then sits still while it rolls
	let pop = $state({ scale: 1, rotation: 0 });
	const startPop = () => {
		const start = Date.now();
		const id = everyFrame(() => {
			const t = (Date.now() - start) / 1000;
			if (t >= 0.42) {
				pop = { scale: 1, rotation: 0 };
				id();
				return;
			}
			const p = t / 0.42;
			// backOut with a strong overshoot, then a damped settle
			const k = 1 + 2.4 * (p - 1) ** 3 + 1.4 * (p - 1) ** 2;
			pop = { scale: 0.4 + 0.6 * k, rotation: -0.08 * (1 - p) ** 2 };
		});
	};

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
			} else {
				startPop();
			}
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<!-- A small win's whole display is shorter than a 500ms fade: the amount used
     to peak at 63% opacity and fade out again without ever reading solid
     (review 10-17). Small wins snap in; the plaques keep the slow fade. -->
<FadeContainer {show} duration={winLevelData?.type === 'big' ? 500 : 140}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<CanvasSizeRectangle backgroundColor={0x252735} backgroundAlpha={0.55} />
				{/if}

				<OnMount
					onmount={async () => {
						// impact hold: freeze a few frames under the white flash before
						// the numbers start rolling
						if (isBigWin) await waitForTimeout(90);
						await startCountUp();
						await waitForTimeout(isBigWin ? 1300 : 650);
						oncomplete();
					}}
				/>

				<!-- behind the plaque: falling in front of it, the bananas buried the
				     tier name and the amount the whole presentation is there to show -->
				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

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
							<WinTierArt tier={alias} width={bw} height={bh} closing={!show}>
								{@const L = TEXT_LAYOUT[alias] ?? TEXT_LAYOUT.big}
								{@const title = TIER_TITLE[alias] ?? 'BIG WIN'}
								{@const titleSize = L.titleSize * bh}
								<Text
									anchor={0.5}
									x={(L.cx - 0.5) * bw}
									y={(L.titleY - 0.5) * bh}
									text={title}
									style={{
										fontFamily: GAME_FONT,
										fontSize: Math.min(titleSize, (L.titleW * bw) / (title.length * 0.85)),
										fontWeight: GAME_FONT_WEIGHT,
										letterSpacing: 4,
										fill: L.titleOnArt ? 0xfff0cf : 0x171c1a,
										...(L.titleOnArt ? { stroke: { color: 0x171c1a, width: titleSize * 0.16, join: 'round' as const } } : {}),
									}}
								/>
								<!-- amount rolls inside the plaque's paper well, in ink, fitted to
								     that plaque's own measured cream area (TEXT_LAYOUT) -->
								<Container x={(L.cx - 0.5) * bw} y={(L.amountY - 0.5) * bh}>
									<InkNumber text={bookEventAmountToCountUpString(countUpAmount,amount)} fontSize={L.amountSize * bh} maxWidth={L.amountW * bw}/>
								</Container>
								{#if alias === 'big'}
									<!-- on the plaque's seal (measured: 77.6% / 68.4% of the art) -->
									<OrderStamp x={bw * 0.276} y={bh * 0.184} size={bw * 0.105} />
								{/if}
							</WinTierArt>
							{#if burstShown}
								
							{/if}
						{:else}
							<!-- small wins: the rolling amount stamped over the board, cream
							     on a heavy ink outline so it reads over the dimmed tiles -->
							<Container scale={pop.scale} rotation={pop.rotation}>
								<GoldText
									maxWidth={SYMBOL_SIZE * 4.4}
									text={bookEventAmountToCountUpString(countUpAmount, amount)}
									fontSize={SYMBOL_SIZE * 0.82}
									fill={0xfff0cf}
									stroke={0x171c1a}
								/>
							</Container>
						{/if}
					</Container>
				</MainContainer>

				{#if flash > 0}
					<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flash} />
				{/if}

				<!-- a small win rolls and moves on by itself: the press still skips
				     it, but the prompt only shows on the plaques that wait -->
				<PressToContinue
					position="betweenBoardAndBottom"
					showLabel={isBigWin}
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
