<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { featureTimeScale } from '../game/timeScale';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { stateGame } from '../game/stateGame.svelte';
	import { tierByBonusTier } from '../game/featureTiers';
	import FeatureSplashPanel from './FeatureSplashPanel.svelte';
	import CastFigure, { CAST_NATIVE } from './CastFigure.svelte';
	import { MainContainer } from 'components-layout';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation, { SIGN_DROP_MS } from './FreeSpinAnimation.svelte';
	import FxBurst from './FxBurst.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});

	// The description panel is for the moment a feature OPENS, not for every time
	// this component is shown: retriggers reuse the same event to slam a "+N" onto
	// the plaque, and re-explaining the rules on a retrigger is noise in the middle
	// of a feature the player is already inside.
	let isEntry = $state(true);
	const tier = $derived(tierByBonusTier(stateGame.bonusTier));
	const showPanel = $derived(isEntry && tier !== null);

	// "FREE SPINS" and "AWARDED", both translated. On the entry card they compose
	// the header strip's one line — "AWARDED 10 FREE SPINS" — which is where the
	// reference puts its count; on a retrigger they stay the plaque's two labels.
	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	// ── the entry card's geometry, from the reference ─────────────────────────
	//
	// Measured off the WE SPLIT screenshot the user supplied (1421x808):
	// title at 0.136 of the height, one panel from 0.208 to 0.780 spanning
	// 0.32..0.70 of the width, character down the left edge at full height, click
	// prompt at 0.968. See FeatureSplashPanel for the rest.
	//
	// The PLAQUE does not appear on entry any more. It is the retrigger's card
	// now: the reference's entry has no plaque, and with one the announcement was
	// two objects — a wooden sign saying FREE SPINS floating above a panel saying
	// what the feature is — where the reference has one. The plaque's drop, slam
	// and burst are untouched and still play on every "+N".
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const titleY = $derived(layout.height * 0.145);
	// Centred, not top-weighted. It was at 0.24 of the height with the card hanging
	// off that point; the user's read was that it sat too high, and it did — the
	// title above it plus a top-anchored card left the whole lower half empty.
	const panelCenterY = $derived(layout.height * 0.54);
	const panelWidth = $derived(Math.min(layout.width * 0.4, 620));
	// Content-driven, with a floor. The reference's card is tall because its copy
	// runs to seven lines; ours runs to four, and forcing the same proportion left
	// a third of the card empty under the last line.
	const panelMinHeight = $derived(layout.height * 0.26);
	const titleSize = $derived(Math.max(30, Math.min(64, layout.width * 0.05)));


	// The character. Cast.svelte stands its own copy down while this is up
	// (stateGame.featureSplashShow) so there is only ever one of her, and this one
	// is drawn on the NEAR side of the scrim so the dimming does not touch her.
	const castHeight = $derived(layout.height * 1.12);
	const castWidth = $derived((castHeight * CAST_NATIVE.girl.w) / CAST_NATIVE.girl.h);
	// The RIGHT, as the board's own cast is. Standing her on the left made the two
	// screens contradict each other: she walks off the right edge of the board and
	// reappears on the left of the card announcing the feature.
	const castX = $derived(layout.width - castWidth * 0.44);
	const castTopY = $derived(layout.height * 0.04);

	// The number's slam, timed against the plaque's drop.
	//
	// The sign drops with backOut, which reaches its target well before the tween
	// ends, so the lead is shorter than SIGN_DROP_MS: the number starts falling
	// while the sign is arriving and makes contact just as it settles. Holding the
	// number invisible for the lead matters — at 3x it is wider than the sign, and
	// slamming during the drop threw a giant numeral across the whole board.
	//
	// On the entry card there is no plaque any more, but the same three constants
	// drive the header strip's arrival, so the count still lands rather than
	// appearing.
	const LEAD_S = (SIGN_DROP_MS * 0.6) / 1000;
	const SLAM_S = 0.3;
	const SETTLE_S = 0.35;

	let animT = $state(-1);
	let burstShown = $state(false);
	let raf = 0;

	// Time is accumulated frame-by-frame against timeScale() rather than divided
	// out of a fixed start stamp, so toggling turbo mid-animation changes the rate
	// from here on instead of jumping the number to a different pose. Same reason
	// NeonFrames passes duration at .set() time.
	const startNumberAnim = () => {
		cancelAnimationFrame(raf);
		animT = 0;
		burstShown = false;
		let impactFired = false;
		let last = performance.now();
		const tick = (now: number) => {
			animT += ((now - last) / 1000) * featureTimeScale();
			last = now;
			if (!impactFired && animT >= LEAD_S + SLAM_S) {
				impactFired = true;
				burstShown = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	};

	const stopNumberAnim = () => {
		cancelAnimationFrame(raf);
		animT = -1;
		burstShown = false;
	};
	onDestroy(stopNumberAnim);

	const numberPose = $derived.by(() => {
		// -1 is "never started" — hold the resting pose so a stray render before
		// freeSpinIntroUpdate never shows a 3x number.
		if (animT < 0) return { scale: 1, rotation: 0, glow: 0.45, alpha: 1 };
		// lead: sign still dropping, number withheld entirely
		if (animT < LEAD_S) return { scale: 3, rotation: 0, glow: 0, alpha: 0 };
		if (animT < LEAD_S + SLAM_S) {
			// accelerating drop from 3x: the fall, not an ease-in-out settle
			const p = (animT - LEAD_S) / SLAM_S;
			return { scale: 3 - 2 * p * p, rotation: 0, glow: 0.18, alpha: 1 };
		}
		const t = animT - LEAD_S - SLAM_S;
		const settle = t < SETTLE_S ? 1 - 0.14 * Math.sin((t / SETTLE_S) * Math.PI) : 1;
		return {
			scale: settle * (1 + 0.03 * Math.sin(t * 2.1)),
			rotation: 0.04 * Math.sin(t * 1.7),
			glow: 0.45 + 0.22 * Math.sin(t * 2.6),
			alpha: 1,
		};
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			show = true;
		},
		freeSpinIntroHide: () => {
			show = false;
			stateGame.featureSplashShow = false;
			stopNumberAnim();
		},
		freeSpinIntroUpdate: async (emitterEvent) => {
			isEntry = emitterEvent.extraSpins === undefined;
			// Only now is it known whether this showing is an entry (a card with a
			// character and a panel) or a retrigger (the plaque). `freeSpinIntroShow`
			// fires first and cannot tell them apart.
			stateGame.featureSplashShow = isEntry && tierByBonusTier(stateGame.bonusTier) !== null;
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			// retriggers reuse this event, so the slam replays for the +N as well
			startNumberAnim();
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<!--
		Darker than the 0.5 it was. The card now carries a lit character and a
		framed panel, and both were competing with a background that was still
		half-visible behind them. The reference's own card is nearly black outside
		its panel.
	-->
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={showPanel ? 0.74 : 0.5} />

	{#if showPanel && tier}
		<!--
			ENTRY: the reference's arrangement — character down the left at full
			height and NOT dimmed (it is drawn here, on the near side of the scrim,
			which is the whole reason Cast.svelte stands its own copy down), the
			feature's name as the largest thing on screen, one panel under it
			carrying the spin count and the rules, and the click prompt at the foot.
		-->
		<MainContainer>
			<CastFigure
				who="girl"
				x={castX}
				topY={castTopY}
				height={castHeight}
				groundY={layout.height}
			/>

			<Container x={layout.width * 0.5}>
				<!--
					THE TITLE, drawn four times.
					────────────────────────────
					The reference's feature titles are not coloured type — they are a
					drawn 3D wordmark: a dark extruded body offset down-right, a white
					outline around it, a bright fill on top, and a glow behind the lot.
					Ours was one flat Text with a stroke, which is what "有點單調" was
					looking at: everything else on this screen is neon and the title was
					typography.
					Four passes, because pixi Text takes one fill and one stroke:
					  glow    an additive sprite behind, in the tier's colour
					  extrude the same word in near-black, pushed down-right
					  outline the same word in white, thick stroke, no fill
					  face    the accent fill on top
					Same technique SymbolArt already uses for the symbols' shadow, edge
					and rim copies, for the same reason.
				-->
				{@const titleFont = Math.min(titleSize, (layout.width * 0.9) / tier.title.length)}
				{@const titleStyle = {
					fontFamily: DISPLAY_FONT,
					fontSize: titleFont,
					fontWeight: DISPLAY_FONT_WEIGHT,
					letterSpacing: 6,
				}}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					y={titleY}
					tint={tier.accent}
					blendMode="add"
					width={titleFont * tier.title.length * 0.95}
					height={titleFont * 3.2}
					alpha={0.4}
				/>
				<!-- black outer outline -->
				<Text
					anchor={0.5}
					y={titleY}
					text={tier.title}
					style={{
						...titleStyle,
						fill: 0x0b0710,
						stroke: 0x0b0710,
						strokeThickness: titleFont * 0.2,
					}}
				/>
				<!-- the lit tube: a rim of the tier's colour just inside the black -->
				<Text
					anchor={0.5}
					y={titleY}
					text={tier.title}
					style={{
						...titleStyle,
						fill: tier.accent,
						stroke: tier.accent,
						strokeThickness: titleFont * 0.1,
					}}
				/>
				<!-- the face: dark, so the rim reads as light around it -->
				<Text
					anchor={0.5}
					y={titleY}
					text={tier.title}
					style={{ ...titleStyle, fill: 0x241b33 }}
				/>

				<FeatureSplashPanel
					{tier}
					centerY={panelCenterY}
					width={panelWidth}
					minHeight={panelMinHeight}
					header={`${freeSpinsFromEvent} ${title} ${subtitle}`}
					headerScale={numberPose.scale}
					headerAlpha={numberPose.alpha}
				/>
			</Container>
		</MainContainer>
	{:else}
		<!-- RETRIGGER: the plaque, exactly as it always was -->
		<FreeSpinAnimation>
			{#snippet children({ sizes })}

			<Text
				anchor={0.5}
				y={-sizes.height * 0.26}
				text={title}
				style={{
					fontFamily: DISPLAY_FONT,
					fontSize: Math.min(sizes.width * 0.13, (sizes.width * 1.5) / title.length),
					fontWeight: DISPLAY_FONT_WEIGHT,
					letterSpacing: 6,
					fill: [0xffe98a, 0xffd75e, 0xff8ede],
					stroke: 0x2b0a2e,
					strokeThickness: 6,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowBlur: 10,
					dropShadowDistance: 3,
				}}
			/>
			<!-- glow bed sits inside the scaled container so it swells with the
			     slam; magenta rather than gold so the neon reads against the plaque -->
			<Container
				y={sizes.height * 0.08}
				scale={numberPose.scale}
				rotation={numberPose.rotation}
				alpha={numberPose.alpha}
			>
				<Sprite
					key="fxGlow"
					anchor={0.5}
					tint={0xff2e88}
					blendMode="add"
					width={sizes.width * 0.6}
					height={sizes.width * 0.6}
					alpha={numberPose.glow}
				/>
				<GoldText text={freeSpinsFromEvent} fontSize={sizes.width * 0.24} />
			</Container>
			{#if burstShown}
				<FxBurst
					y={sizes.height * 0.08}
					scale={1.3}
					flavour="neon"
					oncomplete={() => (burstShown = false)}
				/>
			{/if}
			<Text
				anchor={0.5}
				y={sizes.height * 0.32}
				text={subtitle}
				style={{
					fontFamily: GAME_FONT,
					fontSize: Math.min(sizes.width * 0.05, (sizes.width * 1.1) / subtitle.length),
					fontWeight: GAME_FONT_WEIGHT,
					letterSpacing: 4,
					fill: 0xffe6f7,
					stroke: 0x2b0a2e,
					strokeThickness: 3,
				}}
			/>
		{/snippet}
		</FreeSpinAnimation>
	{/if}

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
