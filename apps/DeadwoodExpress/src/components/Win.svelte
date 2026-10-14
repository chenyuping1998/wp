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
	import { GAME_FONT, GAME_FONT_WEIGHT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { PLATE_BODY, PLATE_INSET, PLATE_KEY } from '../game/plate';
	import { getContext } from '../game/context';

	const context = getContext();

	// One painted brass plaque for every tier (game/plate.ts). The tiers used to
	// be five flat SVG octagons with their names set in Georgia inside the file;
	// now the name is live Cinzel on the plate's dark inset, and the tier reads
	// from the name, its colour and the size of the light behind it.
	//
	// Higher tiers shift from brass light to spectral teal.
	// Title colour is ONE value: pixi 8 takes the first entry of an array fill
	// and ignores the rest, so a "gradient" here only ever drew its top stop.
	const TIER_FX: Record<string, { mult: number; glowTint: number; title: string; fill: number }> = {
		big: { mult: 1, glowTint: 0xffd75e, title: 'BIG WIN', fill: 0xe9cf95 },
		superwin: { mult: 1.15, glowTint: 0xffc14a, title: 'SUPER WIN', fill: 0xf2c865 },
		mega: { mult: 1.3, glowTint: 0xe0c48b, title: 'MEGA WIN', fill: 0xffd98a },
		epic: { mult: 1.5, glowTint: 0x86cbb7, title: 'EPIC WIN', fill: 0x9ff0d6 },
		max: { mult: 1.8, glowTint: 0x9de5d3, title: 'MAX WIN', fill: 0xc9fff0 },
	};

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
		stopShake();
		stopImpact();
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
							tint={fx.glowTint}
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
							{@const side = SYMBOL_SIZE * 5.1}
							{@const bw = side * PLATE_BODY.width}
							{@const bh = side * PLATE_BODY.height}
							{@const insetY = side * PLATE_INSET.centerY}
							{@const insetH = side * PLATE_INSET.height}
							<Container scale={bannerPose.scale}>
								<!-- breathing glow bed behind the plaque -->
								<Sprite
									key="fxGlow"
									anchor={0.5}
									tint={fx.glowTint}
									blendMode="add"
									width={bw * 1.45}
									height={bh * 2.1}
									alpha={bannerPose.glow}
								/>
								<Sprite key={PLATE_KEY} anchor={0.5} width={side} height={side} />
								<!-- additive self-copy = the whole plaque flares -->
								{#if bannerPose.blink > 0}
									<Sprite
										key={PLATE_KEY}
										anchor={0.5}
										width={side}
										height={side}
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
										x={Math.cos(tw.angle) * bw * 0.47}
										y={insetY + Math.sin(tw.angle) * bh * 0.47}
										rotation={p * 2}
										tint={0xffffff}
										blendMode="add"
										width={SYMBOL_SIZE * 0.5 * Math.sin(p * Math.PI)}
										height={SYMBOL_SIZE * 0.5 * Math.sin(p * Math.PI)}
										alpha={Math.sin(p * Math.PI)}
									/>
								{/each}
								<!-- tier name in Cinzel across the top of the inset, the Saira
								     numerals rolling under it -->
								<GoldText
									y={insetY - insetH * 0.24}
									maxWidth={side * PLATE_INSET.width * 0.84}
									text={fx.title}
									fill={fx.fill}
									letterSpacing={4}
									fontSize={insetH * 0.26}
									fontFamily={DISPLAY_FONT}
									fontWeight={DISPLAY_FONT_WEIGHT}
								/>
								<GoldText
									y={insetY + insetH * 0.17}
									maxWidth={side * PLATE_INSET.width * 0.84}
									text={bookEventAmountToCountUpString(countUpAmount, amount)}
									fontSize={insetH * 0.36}
									fontFamily={GAME_FONT}
									fontWeight={GAME_FONT_WEIGHT}
								/>
							</Container>
							{#if burstShown}
								<FxBurst scale={1.7} flavour="neon" oncomplete={() => (burstShown = false)} />
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
