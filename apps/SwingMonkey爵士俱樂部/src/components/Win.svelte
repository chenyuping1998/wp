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
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import InkNumber from './InkNumber.svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString, bookEventAmountToCountUpString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import FxBurst from './FxBurst.svelte';
	import GoldText from './GoldText.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { winLevelMap, type WinLevel } from '../game/winLevelMap';
	import { beatMs, msToNextGrid, musicLive, secondsSinceBeat } from '../game/musicClock';

	const context = getContext();

	// gig-ticket tier plaques (design/build_swing_win_plaques.py, 2026-10-18) —
	// 1000×560: a window onto the club over the ticket's paper, the tiers
	// climbing by the view and the printed border (cream → red → ink → gold
	// with marquee bulbs). The tier NAME sits on the seam between window and
	// paper, the amount on the paper.
	const BANNER_KEY: Record<string, string> = {
		big: 'v8WinBig',
		superwin: 'v8WinSuper',
		mega: 'v8WinMega',
		epic: 'v8WinEpic',
		max: 'v8WinMax',
	};
	const BANNER_RATIO = 560 / 1000;
	// the window's bottom rule, printed by build_swing_win_plaques.py
	const SEAM_Y = -0.025;
	// the top two tiers letter in gold, the rest in the logo's red
	const TITLE_FILL: Record<string, number> = { epic: 0xf0c25e, max: 0xf0c25e };
	// the tier names, set in the display face on the plaque (never
	// baked into the art), lettered on the seam between window and paper
	const TIER_TITLE: Record<string, string> = {
		big: 'BIG WIN',
		superwin: 'SUPER WIN',
		mega: 'MEGA WIN',
		epic: 'EPIC WIN',
		max: 'MAX WIN',
	};

	// ── the tier ladder, on the band's beat (2026-11-06, user: 動畫跟音效節奏要更強) ──
	// A big win no longer opens on its final plaque. The count climbs BIG →
	// SUPER → MEGA → EPIC → MAX, one slice of the count-up per tier, and each tier
	// LANDS: the plaque slams again, its art and title change, the board shakes
	// and that tier's horn fanfare takes over (Saucer's ladder). Here each slice
	// is a whole number of the band's beats and the count starts on a beat, so
	// every tier lands on one. Inside a slice the number runs between the
	// maths' own thresholds (math-sdk "standard" win levels, × bet), so the
	// plaque never names a tier the number has not reached.
	const LADDER_X: Partial<Record<number, number>> = { 6: 15, 7: 30, 8: 50, 9: 100 };
	const tierSteps = (finalLevel: number) => {
		const out: number[] = [];
		for (let l = 6; l <= finalLevel; l++) out.push(l);
		return out.length ? out : [finalLevel];
	};
	/** the amount shown at linear count-up progress p, and which step of the ladder it is on */
	const climb = (p: number, finalAmount: number, ladder: number[]) => {
		const n = ladder.length;
		if (n <= 1 || p >= 1) return { shown: finalAmount * Math.min(1, Math.max(0, p)), step: p >= 1 ? Math.max(0, n - 1) : 0 };
		const seg = Math.min(n - 1, Math.floor(Math.max(0, p) * n));
		const local = Math.max(0, p) * n - seg;
		const thr = (level: number) => Math.min(finalAmount, (LADDER_X[level] ?? Infinity) * BOOK_AMOUNT_MULTIPLIER);
		const from = seg === 0 ? 0 : thr(ladder[seg]);
		const to = seg === n - 1 ? finalAmount : Math.max(from, thr(ladder[seg + 1]));
		return { shown: from + (to - from) * local, step: seg };
	};
	/** the count's length: each tier's slice rounded to whole beats (at least two) */
	const countDuration = (presentMs: number, tiers: number) => {
		if (!musicLive() || tiers < 1 || presentMs <= 0) return presentMs;
		const beat = beatMs();
		const per = Math.max(2, Math.round(presentMs / tiers / beat));
		return per * tiers * beat;
	};

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let steps = $state<number[]>([]);
	let countMs = $state(0);
	let landedStep = -1;
	let oncomplete = $state(() => {});

	// ─── the count-up on the band ───
	// A rolling amount gets the drummer's ride-cymbal bed started in phase with
	// the band (Sound.svelte soundCountUp), ending on a horn button when it lands;
	// the number itself kicks on every beat the listener hears (1 → 1.06, back
	// in a quarter second) — the amount only, the plaque does not move with it.
	const COUNT_BED_FROM_MS = 1000;
	const PULSE_AMP = 0.06;
	let counting = false;
	let pulse = $state(1);
	let stopPulseLoop: (() => void) | null = null;
	const startPulse = () => {
		stopPulseLoop?.();
		stopPulseLoop = everyFrame(() => {
			const since = secondsSinceBeat();
			pulse = since < 0 ? 1 : 1 + PULSE_AMP * Math.exp(-since * 10);
		});
	};
	const stopPulse = () => {
		stopPulseLoop?.();
		stopPulseLoop = null;
		pulse = 1;
	};
	const beginCount = (durationMs: number, big: boolean) => {
		if (durationMs < COUNT_BED_FROM_MS) return;
		counting = true;
		context.eventEmitter.broadcast({ type: 'soundCountUp', on: true, big });
		startPulse();
	};
	const endCount = (done: boolean) => {
		stopPulse();
		if (!counting) return;
		counting = false;
		context.eventEmitter.broadcast({ type: 'soundCountUp', on: false, done });
	};
	onDestroy(() => endCount(false));

	// camera shake as the presentation slams in
	let shake = $state({ x: 0, y: 0 });
	const startShake = (gain = 1) => {
		const start = Date.now();
		const id = everyFrame(() => {
			const p = (Date.now() - start) / 700;
			if (p >= 1) {
				shake = { x: 0, y: 0 };
				id();
				return;
			}
			const amp = 11 * gain * (1 - p) ** 2;
			shake = { x: Math.sin(p * Math.PI * 8) * amp * 0.35, y: Math.sin(p * Math.PI * 6) * amp * 0.2 };
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

	// Plaque entrance overshoot and gentle hold motion.
	let fxNow = $state(-1);
	let fxRaf = 0;

	// 'enter' swings the ticket in; 'upgrade' is the re-slam on each tier it climbs
	let fxKind = $state<'enter' | 'upgrade'>('enter');
	const startBannerFx = (kind: 'enter' | 'upgrade' = 'enter') => {
		cancelAnimationFrame(fxRaf);
		fxKind = kind;
		const start = performance.now();
		let landed = false;
		const blastAt = kind === 'enter' ? 380 : 30;
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			if (!landed && now - start >= blastAt) { landed = true; context.eventEmitter.broadcast({ type: 'soundBigWinBlast' }); }
			fxRaf = requestAnimationFrame(tick);
		};
		fxRaf = requestAnimationFrame(tick);
	};
	// one tier of the ladder lands
	const landTier = (stepIndex: number, kind: 'enter' | 'upgrade') => {
		landedStep = stepIndex;
		const data = winLevelMap[steps[stepIndex] as WinLevel];
		if (!data) return;
		startShake(kind === 'enter' ? 1 : 0.75);
		startImpact();
		startBannerFx(kind);
		context.eventEmitter.broadcast({ type: 'soundWinTier', tier: data.alias });
	};
	const stopBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		fxNow = -1;
	};
	onDestroy(stopBannerFx);

	const bannerPose = $derived.by(() => {
		if (fxNow < 0) return { x: 0, y: 0, scale: 1, rotation: 0 };
		if (fxKind === 'upgrade') {
			// pulled back a touch (the wind-up), then slammed forward past full size and settled (0.42s)
			const p = Math.min(1, fxNow / 0.42);
			const q = p - 0.16;
			const scale = p < 0.16 ? 1 - 0.07 * Math.sin((Math.PI / 2) * (p / 0.16)) : 1 + 0.17 * Math.exp(-7 * q) * Math.cos(10 * q);
			return { x: 0, y: 0, scale, rotation: p < 0.16 ? 0.01 : -0.035 * Math.exp(-8 * q) };
		}
		const p = Math.min(1, fxNow / 0.58);
		const tail = 1 - p;
		return {
			x: -SYMBOL_SIZE * 0.30 * tail + SYMBOL_SIZE * 0.05 * Math.sin(3 * Math.PI * p) * tail,
			y: -SYMBOL_SIZE * 0.16 * tail,
			scale: 0.85 + 0.15 * p + 0.045 * Math.sin(2 * Math.PI * p),
			rotation: 0.08 * tail * Math.sin(2 * Math.PI * p),
		};
	});

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => {
			show = false;
			endCount(false);
			stopBannerFx();
		},
		winUpdate: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			const big = emitterEvent.winLevelData.type === 'big';
			steps = big ? tierSteps(emitterEvent.winLevelData.level) : [];
			countMs = countDuration(emitterEvent.winLevelData.presentDuration, big ? steps.length : 0);
			if (big) landTier(0, 'enter');
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show} duration={500}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = countMs}
		<WinCountUpProvider {amount} {duration} oncomplete={() => endCount(true)}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />
				{/if}

				<OnMount
					onmount={async () => {
						// impact hold: freeze a few frames under the white flash before
						// the numbers start rolling
						if (isBigWin) await waitForTimeout(90);
						// the count starts on the band's next beat, so each tier lands on one
						if (isBigWin) {
							const toBeat = msToNextGrid(1, 20);
							if (toBeat > 0) await waitForTimeout(toBeat);
						}
						beginCount(duration, isBigWin);
						await startCountUp();
						await waitForTimeout(isBigWin ? 1300 : 300);
						oncomplete();
					}}
				/>

				<!-- behind the plaque: falling in front of it, the bananas buried the
				     tier name and the amount the whole presentation is there to show -->
				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x + shake.x}
						y={context.stateGameDerived.boardLayout().y + shake.y}
						scale={punch}
					>
						{#if isBigWin}
							{@const at = climb(amount > 0 ? countUpAmount / amount : 1, amount, steps)}
							{@const alias = winLevelMap[(steps[at.step] ?? winLevelData?.level ?? 6) as WinLevel]?.alias ?? winLevelData?.alias ?? 'big'}
							{@const bannerKey = BANNER_KEY[alias] ?? BANNER_KEY.big}
							{@const bw = SYMBOL_SIZE * 5.2}
							{@const bh = bw * BANNER_RATIO}
							{#key at.step}
								<OnMount onmount={() => { if (at.step > landedStep) landTier(at.step, 'upgrade'); }} />
							{/key}
							<Container x={bannerPose.x} y={bannerPose.y} scale={bannerPose.scale} rotation={bannerPose.rotation}>
								<Sprite key={bannerKey} anchor={.5} width={bw} height={bh}/>
								<Text
									anchor={0.5}
									y={bh * SEAM_Y}
									text={TIER_TITLE[alias] ?? 'BIG WIN'}
									style={{
										fontFamily: GAME_FONT,
										fontSize: bh * 0.15,
										fontWeight: GAME_FONT_WEIGHT,
										letterSpacing: 4,
										fill: TITLE_FILL[alias] ?? 0xaa2b38,
										stroke: { color: 0x241d1c, width: bh * 0.028, join: 'round' as const },
									}}
								/>
								<!-- amount rolls inside the plaque's paper well, in ink -->
								<Container y={bh * 0.24} scale={pulse}>
									<InkNumber text={bookEventAmountToCountUpString(at.shown,amount)} fontSize={bh * 0.2} maxWidth={bw * 0.7}/>
								</Container>
							</Container>
						{:else}
							<!-- small wins: just the rolling amount over the board -->
							<Container scale={pulse}>
								<GoldText
									maxWidth={context.stateLayoutDerived.canvasSizes().width /
										context.stateLayoutDerived.mainLayout().scale}
									text={bookEventAmountToCountUpString(countUpAmount, amount)}
									fontSize={SYMBOL_SIZE}
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
