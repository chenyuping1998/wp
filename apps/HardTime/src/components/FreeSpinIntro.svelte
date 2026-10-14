<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { GAME_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, GAME_FONT_WEIGHT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
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
	import CastFigureMesh from './CastFigureMesh.svelte';
	import { castPlacement } from '../game/castPlacement';
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


	// The character. Cast.svelte stands its own copy down while this is up
	// (stateGame.featureSplashShow) so there is only ever one of him, and this one
	// is drawn on the NEAR side of the scrim so the dimming does not touch him —
	// in the same spot the board's copy stands (game/castPlacement.ts).
	const cast = $derived(castPlacement(context));

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
	// Searchlights passes duration at .set() time.
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

	// how long a retrigger's +N plaque stays up before the feature resumes
	const RETRIGGER_HOLD_MS = 2000;

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
			// Arm the resolver BEFORE the slam starts (the oncomplete race: an
			// animation that finishes between the two statements finds the old,
			// no-op callback and the feature waits forever).
			let resolveThis: () => void = () => {};
			const done = waitForResolve((resolve) => {
				oncomplete = resolve;
				resolveThis = resolve;
			});
			// retriggers reuse this event, so the slam replays for the +N as well
			startNumberAnim();
			// A retrigger plaque is a beat inside the feature, not a stop: it holds
			// long enough to read the +N and then the feature carries on by itself
			// (it used to wait for a tap — 28s+ observed, 2026-10-12). A tap still
			// skips it. The entry card keeps waiting for the player. The timer
			// resolves THIS showing only, never a later one.
			const autoContinue = isEntry ? undefined : setTimeout(() => resolveThis(), RETRIGGER_HOLD_MS);
			await done;
			clearTimeout(autoContinue);
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

	{#if show && showPanel && tier}
		<!--
			ENTRY: the reference's arrangement — character down the left at full
			height and NOT dimmed (it is drawn here, on the near side of the scrim,
			which is the whole reason Cast.svelte stands its own copy down), the
			feature's name as the largest thing on screen, one panel under it
			carrying the spin count and the rules, and the click prompt at the foot.
		-->
		{#if cast.hasSideBand}
			<!-- The prisoner, from the same layered rig that stands beside the board
			     (it was once Hot Miami's spine woman, then this mesh in the wrong
			     box, mirrored, under the scrim). Untransformed container:
			     CastFigureMesh places itself in canvas px. No flip — the
			     crossed-arms art is drawn facing the board. -->
			<Container>
				<CastFigureMesh
					who="guy"
					inline
					x={cast.x}
					topY={cast.topY}
					height={cast.height}
					groundY={cast.groundY}
					innerEdge={cast.boardInkRight}
				/>
			</Container>
		{/if}
		<MainContainer>
			<Container x={layout.width * 0.5}>
				<!--
					THE TITLE, as drawn art.
					────────────────────────
					It was four stacked pixi Texts imitating a wordmark — black outline,
					a lit rim in the tier's colour, a dark face, a glow sprite behind.
					That was as close as Text gets and it was still typography. These
					PNGs carry letterforms that are in neither shipped face, a diagonal
					streak across each face, and a glow that falls off properly instead
					of being a rectangle of light behind the word.

					All three are 1024x360 with the ink centred, so one size fits them:
					the ink fills 97% of the width and 42% of the height, which is why
					the drawn WIDTH is divided by 0.97 to make the letters themselves
					land at the intended fraction of the screen.
				-->
				{@const titleInkWidth = Math.min(layout.width * 0.44, panelWidth * 1.25)}
				<!--
					A bed of light under it. The wordmark's own glow is drawn for a lit
					scene; ours sits on a background darkened to 0.74, where a dark-faced
					letterform is the DIMMEST thing on the card despite being the largest.
					An additive pool in the tier's colour puts it back on top without
					touching the art.
				-->
				<Sprite
					key="fxGlow"
					anchor={0.5}
					y={titleY}
					tint={tier.accent}
					blendMode="add"
					width={titleInkWidth * 1.15}
					height={titleInkWidth * 0.34}
					alpha={0.3}
				/>
				<Sprite
					key={tier.titleKey}
					anchor={0.5}
					y={titleY}
					width={titleInkWidth / 0.97}
					height={(titleInkWidth / 0.97) * (360 / 1024)}
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
		<!-- RETRIGGER: the blank plaque is reusable, so runtime owns its wording. -->
		<FreeSpinAnimation>
			{#snippet children({ sizes })}
			<Text
				anchor={0.5}
				y={-sizes.height * 0.2}
				text={title}
				style={{
					fontFamily: TITLE_FONT,
					fontSize: Math.min(sizes.width * 0.105, (sizes.width * 1.4) / title.length),
					fontWeight: TITLE_FONT_WEIGHT,
					letterSpacing: 5,
					fill: [0xD6D8D8, 0xB8AD95, 0x76513B],
					stroke: { color: 0x14100D, width: 6 },
				}}
			/>
			<!-- glow bed sits inside the scaled container so it swells with the slam -->
			<Container
				y={sizes.height * 0.08}
				scale={numberPose.scale}
				rotation={numberPose.rotation}
				alpha={numberPose.alpha}
			>
				<Sprite
					key="fxGlow"
					anchor={0.5}
					tint={0x8E9499}
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
					fontFamily: TITLE_FONT,
					fontSize: Math.min(sizes.width * 0.05, (sizes.width * 1.1) / subtitle.length),
					fontWeight: TITLE_FONT_WEIGHT,
					letterSpacing: 4,
					fill: 0xB8AD95,
					stroke: { color: 0x14100D, width: 3 },
				}}
			/>
		{/snippet}
		</FreeSpinAnimation>
	{/if}

	<PressToContinue showLabel={isEntry} onpress={() => oncomplete()} />
</FadeContainer>
