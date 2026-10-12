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

	const startBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		const start = performance.now();
		let landed = false;
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			if (!landed && now - start >= 380) {
				landed = true;
				context.eventEmitter.broadcast({ type: 'soundBigWinBlast' });
			}
			fxRaf = requestAnimationFrame(tick);
		};
		fxRaf = requestAnimationFrame(tick);
	};
	const stopBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		fxNow = -1;
	};
	onDestroy(stopBannerFx);

	const bannerPose = $derived.by(() => {
		if (fxNow < 0) return { x: 0, y: 0, scale: 1, rotation: 0 };
		const p = Math.min(1, fxNow / 0.58);
		const tail = 1 - p;
		return {
			x: SYMBOL_SIZE * 0.22 * tail,
			y: -SYMBOL_SIZE * 0.62 * tail * tail,
			scale: 0.80 + 0.20 * p + 0.04 * Math.sin(Math.PI * p),
			rotation: -0.055 * tail,
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
							{@const alias = winLevelData.alias}
							{@const bannerKey = BANNER_KEY[alias] ?? BANNER_KEY.big}
							{@const bw = SYMBOL_SIZE * 5.2}
							{@const bh = bw * BANNER_RATIO}
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
										y={-bh * 0.18}
									text={TIER_TITLE[alias] ?? 'BIG WIN'}
									style={{
										fontFamily: GAME_FONT,
										fontSize: bh * 0.16,
										fontWeight: GAME_FONT_WEIGHT,
										letterSpacing: 4,
										fill: 0xfcf9ef,
										stroke: { color: 0x1e2a4a, width: 3, join: 'round' as const },
									}}
								/>
								<!-- amount rolls inside the plaque's paper well, in ink -->
								<Container x={bw * 0.06} y={bh * 0.19}>
									<InkNumber text={bookEventAmountToCountUpString(countUpAmount,amount)} fontSize={bh * 0.2} maxWidth={bw * 0.52}/>
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
