<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';

	import { BODY_FONT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { featureTimeScale } from '../game/timeScale';
	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { tierByBonusTier } from '../game/featureTiers';
	import CastFigureMesh from './CastFigureMesh.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import FxBurst from './FxBurst.svelte';
	import GoldText from './GoldText.svelte';
	import PressToContinue from './PressToContinue.svelte';

	/**
	 * The moment the free game opens.
	 *
	 * This was a 96%-black rectangle with three lines of Georgia on it — no art,
	 * no motion, no character — on the one screen every feature passes through.
	 * Now it DEALS the feature's card: the tier's painted card (the same art the
	 * rules modal shows) rises and turns into place, the spin count slams onto
	 * the card's night sky with a burst, and the veiled passenger — the free
	 * game's own figure — stands beside it, drawn in front of the scrim so the
	 * dimming does not touch her. Title in Cinzel, copy in Saira; nothing here is
	 * set in a system font.
	 *
	 * A retrigger keeps the brass plaque: "+N" slammed onto the plate, because
	 * re-dealing the card mid-feature would re-explain rules the player is
	 * already playing under.
	 */
	const context = getContext();

	let show = $state(false);
	let spins = $state(0);
	let isEntry = $state(true);
	let oncomplete = $state(() => {});

	const tier = $derived(tierByBonusTier(context.stateGame.bonusTier));
	const cardKey = $derived(tier?.key === 'bonus_hits' ? 'dwCardPremium' : 'dwCardStandard');
	const accent = $derived(tier?.accent ?? 0xe7be77);
	const freeSpinsLabel = gameText('freeSpins');

	// ── layout, in main-layout units ─────────────────────────────────────────
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const isPortrait = $derived(layout.height > layout.width);
	const W = $derived(layout.width);
	const H = $derived(layout.height);
	const titleY = $derived(H * (isPortrait ? 0.1 : 0.105));
	const titleSize = $derived(isPortrait ? W * 0.068 : Math.min(W * 0.052, H * 0.075));
	const CARD_RATIO = 1024 / 1536;
	const cardH = $derived(isPortrait ? Math.min(H * 0.56, (W * 0.72) / CARD_RATIO) : H * 0.64);
	const cardW = $derived(cardH * CARD_RATIO);
	const cardCY = $derived(H * (isPortrait ? 0.47 : 0.5));
	const descY = $derived(cardCY + cardH / 2 + H * 0.03);
	const descSize = $derived(isPortrait ? 28 : Math.max(17, W * 0.0128));
	// The board's own cast only stands on screens wider than 1.25 (Cast.svelte);
	// the splash follows the same rule so she is never squeezed onto a portrait.
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const showFigure = $derived(canvas.width / canvas.height > 1.25);
	const std = $derived(context.stateLayoutDerived.mainLayoutStandard());

	// ── the clock ────────────────────────────────────────────────────────────
	// Accumulated per frame against the feature time scale, so turbo speeds the
	// deal up and toggling it mid-way changes the rate rather than the pose.
	// The entry card is shown at FULL BLACK (Transition resolves there) and the
	// black holds ~0.33s then fades over 0.65s. Started at once, the deal played
	// out under the black and the player only saw a card already sitting there;
	// T0 holds it until the black is lifting. A retrigger has no transition.
	const T0 = $derived(isEntry ? 0.55 : 0);
	const tt = $derived(t < 0 ? -1 : t - T0);
	const CARD_IN = 0.12;
	const CARD_DUR = 0.7;
	const LEAD = 0.8; // number starts falling as the card settles
	const SLAM = 0.28;
	const SETTLE = 0.35;

	let t = $state(-1);
	let burst = $state(false);
	let raf = 0;
	const start = () => {
		cancelAnimationFrame(raf);
		t = 0;
		burst = false;
		let impact = false;
		let last = performance.now();
		const tick = (now: number) => {
			t += (Math.min(0.05, (now - last) / 1000)) * featureTimeScale();
			last = now;
			if (!impact && t - T0 >= LEAD + SLAM) {
				impact = true;
				burst = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	};
	const stop = () => {
		cancelAnimationFrame(raf);
		t = -1;
		burst = false;
	};
	onDestroy(stop);

	const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
	const cubicOut = (p: number) => 1 - (1 - p) ** 3;
	const backOut = (p: number) => {
		const s = 1.70158;
		return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2;
	};

	const titlePose = $derived.by(() => {
		const p = cubicOut(clamp01(tt / 0.45));
		return { alpha: p, dy: -26 * (1 - p), scale: 1.08 - 0.08 * p };
	});

	const cardPose = $derived.by(() => {
		const p = clamp01((tt - CARD_IN) / CARD_DUR);
		const e = cubicOut(p);
		const idle = Math.max(0, tt - CARD_IN - CARD_DUR);
		return {
			alpha: clamp01(p * 3),
			scale: 0.6 + 0.4 * backOut(p),
			rotation: -0.14 * (1 - e) + 0.006 * Math.sin(idle * 1.1),
			dy: 70 * (1 - e) + 5 * Math.sin(idle * 1.3),
			// the card catching the light as it lands
			flash: tt < CARD_IN + CARD_DUR * 0.7 ? 0 : 0.45 * clamp01(1 - (tt - CARD_IN - CARD_DUR * 0.7) / 0.5),
			glow: 0.3 * e + 0.08 * Math.sin(idle * 2.2),
		};
	});

	// Held back until the card is under it, then dropped from 3x: an
	// accelerating fall rather than an ease, then a small settle and a breathe.
	const numberPose = $derived.by(() => {
		if (tt < LEAD) return { scale: 3, alpha: 0, glow: 0 };
		if (tt < LEAD + SLAM) {
			const p = (tt - LEAD) / SLAM;
			return { scale: 3 - 2 * p * p, alpha: 1, glow: 0.15 };
		}
		const s = tt - LEAD - SLAM;
		const settle = s < SETTLE ? 1 - 0.14 * Math.sin((s / SETTLE) * Math.PI) : 1;
		return { scale: settle * (1 + 0.025 * Math.sin(s * 2.1)), alpha: 1, glow: 0.4 + 0.18 * Math.sin(s * 2.6) };
	});

	const labelAlpha = $derived(cubicOut(clamp01((tt - 1.02) / 0.3)));
	const descPose = $derived.by(() => {
		const p = cubicOut(clamp01((tt - 1.18) / 0.4));
		return { alpha: p, dy: 14 * (1 - p) };
	});
	const figureAlpha = $derived(cubicOut(clamp01((tt - 0.25) / 0.6)));

	// A slow light sweep across the card once it is dealt, every 3.4s.
	const shineX = $derived.by(() => {
		const s = tt - CARD_IN - CARD_DUR - 0.5;
		if (s < 0) return null;
		const phase = (s % 3.4) / 1.1;
		return phase <= 1 ? -cardW * 0.9 + phase * cardW * 1.8 : null;
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			// clear the last showing's frozen pose before the scrim comes up
			stop();
			show = true;
		},
		freeSpinIntroHide: () => {
			show = false;
			context.stateGame.featureSplashShow = false;
			// Freeze rather than reset: the card holds its pose while the
			// FadeContainer fades it out, instead of vanishing on the press.
			cancelAnimationFrame(raf);
		},
		freeSpinIntroUpdate: async (emitterEvent) => {
			isEntry = emitterEvent.extraSpins === undefined;
			// Only the entry card stands the board's cast down (it draws her itself);
			// a retrigger's plaque leaves her where she is.
			context.stateGame.featureSplashShow = isEntry;
			spins = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			start();
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x020807} backgroundAlpha={isEntry ? 0.86 : 0.5} />

	{#if isEntry && t >= 0}
		{#if showFigure}
			<!-- In front of the scrim, untransformed: CastFigureMesh places itself in
			     canvas px, exactly where the board's copy stands. -->
			<Container alpha={figureAlpha}>
				<CastFigureMesh
					who="girl"
					inline
					x={std.width * 0.94}
					topY={std.height * 0.15}
					height={std.height * 1.02}
					groundY={std.height}
				/>
			</Container>
		{/if}

		<MainContainer>
			<Container x={W * 0.5}>
				<!-- the feature's name -->
				<Container y={titleY + titlePose.dy} scale={titlePose.scale} alpha={titlePose.alpha}>
					<Sprite
						key="fxGlow"
						anchor={0.5}
						tint={accent}
						blendMode="add"
						width={W * 0.62}
						height={titleSize * 2.4}
						alpha={0.28}
					/>
					<GoldText
						text={tier?.title ?? freeSpinsLabel}
						fill={0xe9cf95}
						fontSize={titleSize}
						maxWidth={W * 0.88}
						letterSpacing={6}
						fontFamily={DISPLAY_FONT}
						fontWeight={DISPLAY_FONT_WEIGHT}
					/>
				</Container>

				<!-- the card, dealt -->
				<Container y={cardCY + cardPose.dy} alpha={cardPose.alpha}>
					<Sprite
						key="fxGlow"
						anchor={0.5}
						tint={accent}
						blendMode="add"
						width={cardW * 2.3}
						height={cardH * 1.45}
						alpha={cardPose.glow}
					/>
					<Container scale={cardPose.scale} rotation={cardPose.rotation}>
						<!-- contact shadow, so the card sits over the scene rather than on it -->
						<Sprite
							key="fxGlow"
							anchor={0.5}
							y={cardH * 0.04}
							tint={0x000000}
							width={cardW * 1.35}
							height={cardH * 1.18}
							alpha={0.7}
						/>
						<Container>
							<Graphics
								isMask
								draw={(g) => {
									g.clear();
									g.rect(-cardW / 2, -cardH / 2, cardW, cardH);
									g.fill({ color: 0xffffff });
								}}
							/>
							<Sprite key={cardKey} anchor={0.5} width={cardW} height={cardH} />
							{#if cardPose.flash > 0.01}
								<Sprite
									key={cardKey}
									anchor={0.5}
									width={cardW}
									height={cardH}
									blendMode="add"
									alpha={cardPose.flash}
								/>
							{/if}
							{#if shineX !== null}
								<Sprite
									key="fxStreak"
									anchor={0.5}
									x={shineX}
									rotation={-1.05}
									width={cardH * 1.3}
									height={cardW * 0.5}
									tint={0xfff3cf}
									blendMode="add"
									alpha={0.32}
								/>
							{/if}
						</Container>

						<!-- the count, on the card's night sky -->
						<Container y={-cardH * 0.29} scale={numberPose.scale} alpha={numberPose.alpha}>
							<Sprite
								key="fxGlow"
								anchor={0.5}
								tint={accent}
								blendMode="add"
								width={cardW * 1.1}
								height={cardW * 0.8}
								alpha={numberPose.glow}
							/>
							<GoldText text={spins} fontSize={cardH * 0.2} />
						</Container>
						{#if burst}
							<FxBurst y={-cardH * 0.29} scale={1.2} oncomplete={() => (burst = false)} />
						{/if}
						<GoldText
							y={-cardH * 0.155}
							text={freeSpinsLabel}
							fill={0xe9cf95}
							alpha={labelAlpha}
							fontSize={cardH * 0.06}
							maxWidth={cardW * 0.86}
							letterSpacing={4}
							fontFamily={DISPLAY_FONT}
							fontWeight={DISPLAY_FONT_WEIGHT}
						/>
					</Container>
				</Container>

				<!-- what the feature does, under the card -->
				{#if tier}
					<Text
						anchor={{ x: 0.5, y: 0 }}
						y={descY + descPose.dy}
						alpha={descPose.alpha}
						text={tier.splash}
						style={{
							fontFamily: BODY_FONT,
							fontWeight: '600',
							fontSize: descSize,
							letterSpacing: 1.2,
							lineHeight: descSize * 1.45,
							align: 'center',
							wordWrap: true,
							wordWrapWidth: isPortrait ? W * 0.88 : Math.min(W * 0.6, 780),
							fill: 0xe3ddc9,
							stroke: 0x020807,
							strokeThickness: 3,
						}}
					/>
				{/if}
			</Container>
		</MainContainer>
	{:else if !isEntry && t >= 0}
		<!-- RETRIGGER: "+N" slammed onto the brass plate -->
		<FreeSpinAnimation>
			{#snippet children({ sizes })}
				<GoldText
					y={-sizes.height * 0.3}
					text={freeSpinsLabel}
					fill={0xe9cf95}
					fontSize={sizes.height * 0.16}
					maxWidth={sizes.width * 0.86}
					letterSpacing={5}
					fontFamily={DISPLAY_FONT}
					fontWeight={DISPLAY_FONT_WEIGHT}
				/>
				<Container y={sizes.height * 0.05} scale={numberPose.scale} alpha={numberPose.alpha}>
					<Sprite
						key="fxGlow"
						anchor={0.5}
						tint={0x5fd6c4}
						blendMode="add"
						width={sizes.width * 0.6}
						height={sizes.width * 0.5}
						alpha={numberPose.glow}
					/>
					<GoldText text={`+${spins}`} fontSize={sizes.height * 0.36} />
				</Container>
				{#if burst}
					<FxBurst y={sizes.height * 0.05} scale={1.2} oncomplete={() => (burst = false)} />
				{/if}
				<Text
					anchor={0.5}
					y={sizes.height * 0.36}
					text="YOUR STEAM PRESSURE IS PRESERVED"
					style={{
						fontFamily: BODY_FONT,
						fontWeight: '600',
						fontSize: sizes.height * 0.085,
						letterSpacing: 2,
						fill: 0xcfe9df,
						stroke: 0x020807,
						strokeThickness: 3,
					}}
				/>
			{/snippet}
		</FreeSpinAnimation>
	{/if}

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
