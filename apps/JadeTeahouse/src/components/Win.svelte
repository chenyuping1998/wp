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
	import BigWinFx from './BigWinFx.svelte';
	import FxBurst from './FxBurst.svelte';
	import GoldText from './GoldText.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import LightRays from './LightRays.svelte';
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
	const BANNER_RATIO = 560 / 1000;
	// Carved-jade tier titles (design/build_wordmarks.py, 1024x300) - they were a
	// line of pixi Text on the plaque's dark panel.
	const WORDMARK_KEY: Record<string, string> = {
		big: 'v8WordmarkBig',
		superwin: 'v8WordmarkSuperwin',
		mega: 'v8WordmarkMega',
		epic: 'v8WordmarkEpic',
		max: 'v8WordmarkMax',
	};
	// ray colours per tier, the same families as the hue-shifted plaques
	const TIER_RAYS: Record<string, [number, number]> = {
		big: [0xe6c27a, 0x6fae8f],
		superwin: [0xe6c27a, 0x6aa6d6],
		mega: [0xf0b070, 0xd9584a],
		epic: [0xe6c27a, 0xa47ad8],
		max: [0xffe08a, 0xe6c27a],
	};
	// the tier names, set in the display face on the plaque's title band (never
	// baked into the art); the yellow MAX band takes ink, the others paper
	const TIER_TITLE: Record<string, string> = {
		big: 'BIG WIN',
		superwin: 'SUPER WIN',
		mega: 'MEGA WIN',
		epic: 'EPIC WIN',
		max: 'MAX WIN',
	};
	// presentation intensity scales with the tier
	const TIER_FX: Record<string, { mult: number; glowTint: number }> = {
		big: { mult: 1, glowTint: 0xefeadc },
		superwin: { mult: 1.15, glowTint: 0xefeadc },
		mega: { mult: 1.3, glowTint: 0xb87b60 },
		epic: { mult: 1.5, glowTint: 0xb87b60 },
		max: { mult: 1.8, glowTint: 0xb87b60 },
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
			const p = (Date.now() - start) / 700;
			if (p >= 1) {
				shake = { x: 0, y: 0 };
				id();
				return;
			}
			const amp = 11 * (1 - p) ** 2;
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

	// Plaque entrance overshoot and gentle hold motion.
	let fxNow = $state(-1);
	let fxRaf = 0;

	const startBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		const start = performance.now();
		let landed = false;
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			if (!landed && now - start >= 380) { landed = true; context.eventEmitter.broadcast({ type: 'soundBigWinBlast' }); }
			fxRaf = requestAnimationFrame(tick);
		};
		fxRaf = requestAnimationFrame(tick);
	};
	const stopBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		fxNow = -1;
	};
	onDestroy(stopBannerFx);

	// The title slams onto the plaque just after the plaque lands (380ms), with
	// leaves thrown off it; the payoff - flare and a second burst - is held for
	// the moment the amount stops counting.
	let landBurst = $state(false);
	let landFired = false;
	let doneBurst = $state(false);
	let doneAt = $state(-1);
	const wordmarkScale = $derived.by(() => {
		if (fxNow < 0) return 1;
		const k = (fxNow - 0.34) / 0.26;
		if (k <= 0) return 0;
		if (k >= 1) return 1;
		return 1.7 - 0.7 * (1 - (1 - k) ** 3);
	});
	$effect(() => {
		if (fxNow >= 0.42 && !landFired) {
			landFired = true;
			landBurst = true;
		}
	});
	const halo = $derived.by(() => {
		if (fxNow < 0) return 0;
		const base = Math.min(0.45, (fxNow / 0.5) * 0.45);
		if (doneAt < 0) return base;
		return 0.45 + 0.55 * Math.exp(-(fxNow - doneAt) / 0.3);
	});
	const rays = $derived.by(() => {
		if (fxNow < 0) return 0;
		const rise = Math.min(1, fxNow / 0.6);
		if (doneAt < 0) return rise * 0.85;
		return 0.35 + 0.5 * Math.exp(-(fxNow - doneAt) / 0.8);
	});

	const bannerPose = $derived.by(() => {
		if (fxNow < 0) return { x: 0, y: 0, scale: 1, rotation: 0 };
		const p = Math.min(1, fxNow / .58);
		const eased = 1 - (1 - p) ** 3;
		return {
			x: -SYMBOL_SIZE * .4 * (1 - eased),
			y: -SYMBOL_SIZE * .23 * (1 - eased),
			scale: .72 + .28 * eased + .045 * Math.sin(Math.PI * p),
			rotation: -.09 * (1 - eased),
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
			landBurst = false;
			landFired = false;
			doneBurst = false;
			doneAt = -1;
			if (emitterEvent.winLevelData.type === 'big') {
				startShake();
				startImpact();
				startBannerFx();
			}
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show} duration={500}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => {
			if (winLevelData?.type === 'big' && doneAt < 0) {
				doneAt = Math.max(0, fxNow);
				doneBurst = true;
			}
			onCountUpComplete();
		}}>
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

				{#if isBigWin}
					{@const bwFx = SYMBOL_SIZE * 5.2}
					{@const rayColors = TIER_RAYS[winLevelData?.alias ?? 'big'] ?? TIER_RAYS.big}
					<MainContainer>
						<!-- behind the plaque, over the scrim: never under a mask or filter -->
						<Container x={context.stateGameDerived.boardLayout().x} y={context.stateGameDerived.boardLayout().y}>
							<LightRays radius={bwFx * 0.95} alpha={rays} colors={rayColors} />
							<Sprite key="fxSoftGlow" anchor={0.5} blendMode="add" tint={rayColors[0]}
								width={bwFx * 1.5} height={bwFx * BANNER_RATIO * 1.8} alpha={halo * 0.4} />
						</Container>
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
							<Container x={bannerPose.x} y={bannerPose.y} scale={bannerPose.scale} rotation={bannerPose.rotation}>
								<Sprite key={bannerKey} anchor={.5} width={bw} height={bh}/>
								<!-- tier ornaments (design/build_splash_parts.py): a 1000x800 canvas, the
								     plaque centred in it, so the crown and pendants can overhang -->
								<Sprite key={`${bannerKey}Decor`} anchor={.5} width={bw} height={bw * 0.8} />
								{@const wmW = bw * 0.72}
								<Container y={-bh * 0.19} scale={wordmarkScale}>
									<Sprite key={WORDMARK_KEY[alias] ?? WORDMARK_KEY.big} anchor={0.5} width={wmW} height={wmW * (300 / 1024)} />
								</Container>
								{#if landBurst}
									<FxBurst flavour="tea" y={-bh * 0.19} scale={1.8} oncomplete={() => (landBurst = false)} />
								{/if}
								<!-- amount rolls inside the plaque's paper well, in ink -->
								<Container y={bh * 0.19}>
									<InkNumber text={bookEventAmountToCountUpString(countUpAmount,amount)} fontSize={bh * 0.2} maxWidth={bw * 0.64}/>
								</Container>
								{#if doneBurst}
									<FxBurst flavour="tea" y={bh * 0.19} scale={2} oncomplete={() => (doneBurst = false)} />
									<FxBurst flavour="tea" y={bh * 0.19} scale={2.6} delay={110} />
								{/if}
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
