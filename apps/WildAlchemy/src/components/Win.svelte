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
	import { DISPLAY_FONT, DISPLAY_FONT_WEIGHT, TITLE_FONT, TITLE_FONT_WEIGHT } from '../game/fonts';
	import { HUD_ART } from '../game/assetsHud';
	import { canvasLine, gameText } from '../game/i18nText';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	// Tier words, set at runtime on the blank title plate (no lettering in art).
	const TIER_TEXT: Record<string, Parameters<typeof gameText>[0]> = {
		big: 'winBig',
		superwin: 'winSuper',
		mega: 'winMega',
		epic: 'winEpic',
		max: 'winMax',
	};
	// Presentation intensity per tier: more motes, a bigger slam.
	const TIER_FX: Record<string, { mult: number }> = {
		big: { mult: 1 },
		superwin: { mult: 1.15 },
		mega: { mult: 1.3 },
		epic: { mult: 1.5 },
		max: { mult: 1.8 },
	};

	// The text block over the scene, in canvas px: the title plate, and under
	// it the amount on its own dark plaque (ui-fs-counter-b). The plaque is not
	// decoration: the halls are drawn with props inside the art's nominal
	// text-safe zone (MEGA's flask on its pedestal sits right where the amount
	// falls), so the number gets a ground of its own on every tier (house rule
	// E1). Sized from that zone (layout/win.json: 960 of 1920 wide), never wider
	// than the canvas allows in portrait.
	const textBlock = $derived.by(() => {
		const canvas = context.stateLayoutDerived.canvasSizes();
		const sc = Math.max(canvas.width / 1920, canvas.height / 1080);
		const textW = Math.min(960 * sc * 0.92, canvas.width * 0.9);
		const plateW = textW * 0.82;
		const plateH = (plateW * HUD_ART.titlePlate.h) / HUD_ART.titlePlate.w;
		const plaqueW = textW * 0.74;
		const plaqueH = (plaqueW * HUD_ART.fsCounter.h) / HUD_ART.fsCounter.w;
		const gap = plateH * 0.04;
		const total = plateH + gap + plaqueH;
		return {
			x: canvas.width / 2,
			y: canvas.height / 2,
			textW,
			plateW,
			plateH,
			plaqueW,
			plaqueH,
			amountFont: plaqueH * HUD_ART.fsCounter.fieldH * 0.66,
			plateY: -total / 2 + plateH / 2,
			amountY: -total / 2 + plateH + gap + plaqueH / 2,
			halfHeight: total / 2 + 8,
		};
	});

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	// camera shake as the presentation slams in
	// Both run on the display's own frame clock. They were setInterval(16), which
	// drifts against the refresh — on a 120 Hz screen every other frame repeated
	// the last offset and the shake stuttered instead of decaying.
	const onFrames = (ms: number, step: (p: number) => void) => {
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			const p = Math.min(1, (now - start) / ms);
			step(p);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	};

	let shake = $state({ x: 0, y: 0 });
	let stopShake = () => {};
	const startShake = () => {
		stopShake();
		stopShake = onFrames(700, (p) => {
			const amp = 11 * (1 - p) ** 2;
			shake =
				p >= 1
					? { x: 0, y: 0 }
					: { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp };
		});
	};

	// hit-stop impact frame: white flash + scale punch on the slam-in
	let flash = $state(0);
	let punch = $state(1);
	let stopImpact = () => {};
	const startImpact = () => {
		stopImpact();
		stopImpact = onFrames(280, (p) => {
			flash = p >= 1 ? 0 : Math.max(0, 0.8 * (1 - p * 1.4));
			punch = p >= 1 ? 1 : 1 + 0.14 * (1 - p) ** 2;
		});
	};

	// 10x rung (winLevelMap withTenXRung): there is no banner to slam in, so the
	// count itself has to land. A small scale pop as the number stops, without
	// the big-win flash and shake.
	const startLandPop = () => {
		stopImpact();
		stopImpact = onFrames(260, (p) => {
			punch = p >= 1 ? 1 : 1 + 0.12 * Math.sin(Math.PI * p);
		});
	};


	// ── scene clock: drives the hall's fade / FG slide / motes (BigWinFx), the
	// title plate's entrance overshoot, and repeating bursts on the top tiers ──
	let fxNow = $state(-1);
	let fxRaf = 0;
	let burstShown = $state(false);
	let nextBurstAt = 0;

	const startBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		nextBurstAt = 0;
		burstShown = true;
		const start = performance.now();
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			const mult = winLevelData ? (TIER_FX[winLevelData?.alias ?? 'big']?.mult ?? 1) : 1;
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
		stopShake();
		stopImpact();
		// a pop or slam cut short must not leave the next win scaled or flashed
		shake = { x: 0, y: 0 };
		punch = 1;
		flash = 0;
		fxNow = -1;
	};
	onDestroy(stopBannerFx);

	// the title plate drops in a beat after the hall: hidden for 0.12 s, then an
	// overshoot slam that settles to 1 with a faint breath
	const bannerPose = $derived.by(() => {
		if (fxNow < 0) return { scale: 1 };
		const t = fxNow - 0.12;
		if (t < 0) return { scale: 0 };
		const scale =
			t < 0.34
				? 0.42 + 0.78 * (1 - (1 - t / 0.34) ** 3)
				: 1.2 - 0.2 * Math.min(1, (t - 0.34) / 0.22) + 0.015 * Math.sin(t * 3.2);
		return { scale };
	});

	context.eventEmitter.subscribeOnMount({
		winShow: () => {
			show = true;
			// Tell the board a full-screen celebration is up, so its win-volley
			// dim stands down for the duration — see stateGame.winCelebrationShow.
			stateGame.winCelebrationShow = true;
		},
		winHide: () => {
			show = false;
			stateGame.winCelebrationShow = false;
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
				<OnMount
					onmount={async () => {
						// impact hold: freeze a few frames under the white flash before
						// the numbers start rolling
						if (isBigWin) await waitForTimeout(90);
						await startCountUp();
						// the 10x rung counts (duration > 0) and lands on a pop
						const isCountUp = !isBigWin && duration > 0;
						if (isCountUp) startLandPop();
						await waitForTimeout(isBigWin ? 1300 : isCountUp ? 500 : 300);
						oncomplete();
					}}
				/>

				{#if isBigWin}
					{@const alias = winLevelData?.alias ?? 'big'}
					{@const fx = TIER_FX[alias] ?? TIER_FX.big}
					{@const tb = textBlock}
					<!-- the hall: BG plate, sliding FG pieces, rising motes -->
					<BigWinFx {alias} t={fxNow} intensity={fx.mult} textHalfHeight={tb.halfHeight} />
					<Container x={tb.x + shake.x} y={tb.y + shake.y} scale={punch}>
						<Container y={tb.plateY} scale={bannerPose.scale}>
							<Sprite key="waWinTitlePlate" anchor={0.5} width={tb.plateW} height={tb.plateH} />
							<GoldText
								variant="ink"
								text={canvasLine(gameText(TIER_TEXT[alias] ?? 'winBig'))}
								fontSize={tb.plateH * 0.3}
								maxWidth={tb.plateW * HUD_ART.titlePlate.fieldW * 0.94}
								letterSpacing={3}
								fill={0xa53e2b}
								fontFamily={TITLE_FONT}
								fontWeight={TITLE_FONT_WEIGHT}
							/>
						</Container>
						<!-- the amount on its plaque's dark field; precision from the FINAL
						     amount, held every frame (two decimals while it counts) -->
						<Container y={tb.amountY} scale={bannerPose.scale}>
							<Sprite key="waFsCounter" anchor={0.5} width={tb.plaqueW} height={tb.plaqueH} />
							<GoldText
								y={tb.plaqueH * (HUD_ART.fsCounter.fieldCy - 0.5)}
								maxWidth={tb.plaqueW * HUD_ART.fsCounter.fieldW * 0.94}
								text={bookEventAmountToCountUpString(countUpAmount, amount)}
								fontSize={tb.amountFont}
								fontFamily={DISPLAY_FONT}
								fontWeight={DISPLAY_FONT_WEIGHT}
							/>
						</Container>
					</Container>
					{#if burstShown}
						<FxBurst x={tb.x} y={tb.y + tb.plateY} scale={1.7} oncomplete={() => (burstShown = false)} />
					{/if}
				{:else}
					<!-- small wins (not reached by this game's handlers, which only
					     raise the banner tiers): the amount on the plate over the board -->
					<MainContainer>
						<Container
							x={context.stateGameDerived.boardLayout().x}
							y={context.stateGameDerived.boardLayout().y}
							scale={punch}
						>
							<Sprite key="waWinTitlePlate" anchor={0.5} width={SYMBOL_SIZE * 4} height={(SYMBOL_SIZE * 4 * HUD_ART.titlePlate.h) / HUD_ART.titlePlate.w} />
							<GoldText
								variant="ink"
								maxWidth={SYMBOL_SIZE * 4 * HUD_ART.titlePlate.fieldW}
								text={bookEventAmountToCountUpString(countUpAmount, amount)}
								fontSize={SYMBOL_SIZE * 0.6}
								fontFamily={DISPLAY_FONT}
								fontWeight={DISPLAY_FONT_WEIGHT}
							/>
						</Container>
					</MainContainer>
				{/if}

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				{#if flash > 0}
					<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flash} />
				{/if}

				<PressToContinue
					showLabel={false}
					position="betweenBoardAndBottom"
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
