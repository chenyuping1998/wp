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
	import BannerMesh from './BannerMesh.svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import BigWinFx from './BigWinFx.svelte';
	import { musicAt } from '../game/beatClock';
	import TextMesh from './TextMesh.svelte';
	import { AMOUNT_ACT } from '../game/meshWin/textMesh';
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
		big: { mult: 1, glowTint: 0x59e3ff },
		superwin: { mult: 1.15, glowTint: 0x9b76ff },
		mega: { mult: 1.3, glowTint: 0xff3fd0 },
		epic: { mult: 1.5, glowTint: 0xff4f8a },
		max: { mult: 1.8, glowTint: 0xff8ede },
	};

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	const onCountUpComplete = () => {
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	};
	// the amount's mesh kicks (TextMesh): it bobs while it rolls, squashes as it lands
	let rollAt = $state(-1);
	let landAt = $state(-1);

	// camera shake as the presentation slams in
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

	// ── plaque FX clock: entrance overshoot, then the plaque PLAYS WITH THE
	// TRACK (game/beatClock): a small lift on every beat, a flare on each bar's
	// downbeat (bigger on the top tiers), the glow breathing over two beats.
	// The rim twinkles and the repeating FxBurst are gone: both were little
	// stars and a hard ring (feedback 2026-10-31: no sparkle particles).
	let fxNow = $state(-1);
	let fxRaf = 0;
	let music = $state(musicAt(0));

	const startBannerFx = () => {
		cancelAnimationFrame(fxRaf);
		const start = performance.now();
		const tick = (now: number) => {
			fxNow = (now - start) / 1000;
			music = musicAt(performance.now());
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
		if (fxNow < 0) return { scale: 1, glow: 0.4, blink: 0 };
		const t = fxNow;
		// entrance: overshoot slam matching the hit-stop flash
		// the beat comes in once the slam has settled (eased over 300ms)
		const groove = Math.min(1, Math.max(0, (t - 0.56) / 0.3));
		const mult = winLevelData ? (TIER_FX[winLevelData.alias]?.mult ?? 1) : 1;
		const scale =
			t < 0.34
				? 0.42 + 0.78 * (1 - (1 - t / 0.34) ** 3)
				: 1.2 - 0.2 * Math.min(1, (t - 0.34) / 0.22) + groove * 0.022 * music.beatPulse;
		const blink = Math.max(
			t < 0.3 ? 0.55 * (1 - t / 0.3) : 0,
			groove * (0.22 + 0.12 * mult) * music.downbeat,
		);
		return {
			scale,
			glow: 0.42 + 0.24 * (0.5 + 0.5 * Math.cos(Math.PI * music.beats)) + groove * 0.18 * mult * music.downbeat,
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
			rollAt = -1;
			landAt = -1;
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
						rollAt = Date.now();
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
								<!-- the plaque as a mesh: jelly on the slam, the title bulging with
								     each flare, a squash when the count lands (meshWin/banner.ts).
								     Its additive flare copy rides the same geometry. -->
								<BannerMesh key={bannerKey} width={bw} height={bh} blink={bannerPose.blink} landed={countUpCompleted} />
								<!-- amount rolls inside the plaque's dark centre well -->
								<TextMesh
									y={bh * 0.16}
									maxWidth={bw * 0.68}
									text={bookEventAmountToCurrencyString(countUpAmount)}
									fontSize={bh * 0.24}
									fill={[0xffffff]}
									bevel
									at={{ roll: rollAt, land: landAt }}
									act={AMOUNT_ACT}
								/>
							</Container>
						{:else}
							<!-- small wins: just the rolling amount over the board -->
							<TextMesh
								maxWidth={context.stateLayoutDerived.canvasSizes().width /
									context.stateLayoutDerived.mainLayout().scale}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								fontSize={SYMBOL_SIZE}
								fill={[0xffffff]}
								bevel
								at={{ roll: rollAt, land: landAt }}
								act={AMOUNT_ACT}
							/>
						{/if}
					</Container>
				</MainContainer>

				{#if countUpCompleted}
					<OnMount onmount={() => (landAt = Date.now())} />
				{/if}

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
