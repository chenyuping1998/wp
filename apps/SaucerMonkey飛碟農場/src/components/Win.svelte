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
	import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { winLevelMap, type WinLevel } from '../game/winLevelMap';
	import { WIN_DECOR } from '../game/meshWin';
	import PropMesh from './PropMesh.svelte';
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
	const BANNER_RATIO = 560 / 1000;
	// the tier names, set in the display face on the plaque's title band (never
	// baked into the art); the yellow MAX band takes ink, the others paper
	const TIER_TITLE: Record<string, string> = {
		big: 'BIG WIN',
		superwin: 'SUPER WIN',
		mega: 'MEGA WIN',
		epic: 'EPIC WIN',
		max: 'MAX WIN',
	};

	// ── the tier ladder (2026-11-06, user: 動畫跟音效節奏要更強) ──────────────
	// A big win no longer opens on its final plaque. The count climbs BIG →
	// SUPER → MEGA → EPIC → MAX, one equal slice of the count-up per tier, and
	// each tier LANDS: the plaque slams again, its title and art change, the
	// board shakes and that tier's fanfare takes over. Inside each slice the
	// number runs between the maths' own thresholds (math-sdk get_win_level
	// "standard", × bet), so the plaque never names a tier the number has not
	// reached. Skipping jumps straight to the final tier with one slam.
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
		const seg = Math.min(n - 1, Math.floor(Math.max(0, p) * n)), local = Math.max(0, p) * n - seg;
		const thr = (level: number) => Math.min(finalAmount, (LADDER_X[level] ?? Infinity) * BOOK_AMOUNT_MULTIPLIER);
		const from = seg === 0 ? 0 : thr(ladder[seg]);
		const to = seg === n - 1 ? finalAmount : Math.max(from, thr(ladder[seg + 1]));
		return { shown: from + (to - from) * local, step: seg };
	};

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let steps = $state<number[]>([]);
	let landedStep = -1;
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

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

	// 'enter' drops the plaque in from above; 'upgrade' is the re-slam on each tier it climbs
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
			const p = Math.min(1, fxNow / 0.42), q = p - 0.16;
			const scale = p < 0.16 ? 1 - 0.07 * Math.sin((Math.PI / 2) * (p / 0.16)) : 1 + 0.17 * Math.exp(-7 * q) * Math.cos(10 * q);
			return { x: 0, y: 0, scale, rotation: p < 0.16 ? 0.01 : -0.035 * Math.exp(-8 * q) };
		}
		const p = Math.min(1, fxNow / 0.58);
		const tail = 1 - p;
		return {
			x: 0,
			y: -SYMBOL_SIZE * 0.95 * tail * tail,
			scale: 0.87 + 0.13 * p + 0.06 * Math.sin(Math.PI * p),
			rotation: 0.035 * tail,
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
				steps = tierSteps(emitterEvent.winLevelData.level);
				landTier(0, 'enter');
			}
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show} duration={500}>
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

				<!-- Themed pins or parade beads travel at the sides, behind the plaque;
				     the title and amount remain unobscured. -->
				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x + shake.x}
						y={context.stateGameDerived.boardLayout().y + shake.y}
						scale={punch}
					>
						{#if isBigWin}
							{@const at = climb(amount > 0 ? countUpAmount / amount : 1, amount, steps)}
							{@const alias = winLevelMap[(steps[at.step] ?? winLevelData.level) as WinLevel]?.alias ?? winLevelData.alias}
							{@const bannerKey = BANNER_KEY[alias] ?? BANNER_KEY.big}
							{@const bw = SYMBOL_SIZE * 5.2}
							{@const bh = bw * BANNER_RATIO}
							{#key at.step}
								<OnMount onmount={() => { if (at.step > landedStep) landTier(at.step, 'upgrade'); }} />
							{/key}
							<Container x={bannerPose.x} y={bannerPose.y} scale={bannerPose.scale} rotation={bannerPose.rotation}>
								<Sprite key={bannerKey} anchor={.5} width={bw} height={bh}/>
								<!-- the things on the plaque are meshes over its decor layer (meshWin/decorMeshes.ts) -->
								<Container>
									{#each WIN_DECOR[bannerKey] ?? [] as spec (spec.symbol)}
										<PropMesh {spec} env={{ t: Math.max(0, fxNow) * 1000 }} width={bw} height={bh} anchor={0.5} />
									{/each}
								</Container>
								<Text
									anchor={0.5}
										y={-bh * 0.04}
									text={TIER_TITLE[alias] ?? 'BIG WIN'}
									style={{
										fontFamily: GAME_FONT,
										fontSize: bh * 0.14,
										fontWeight: GAME_FONT_WEIGHT,
										letterSpacing: 4,
										fill: 0x141a33,
										stroke: { color: 0xfcf9ef, width: 3, join: 'round' as const },
									}}
								/>
								<!-- amount rolls inside the plaque's paper well, in ink -->
								<Container y={bh * 0.19}>
									<InkNumber text={bookEventAmountToCountUpString(at.shown, amount)} fontSize={bh * 0.2} maxWidth={bw * 0.46}/>
								</Container>
							</Container>
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
