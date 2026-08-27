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

	// The plaque is centred on the board and, at full size, fills the whole height
	// between the board's top edge and the bet strip on its own — measured, not
	// guessed: a 485-tall sign centred at y 324 on a 767 canvas spans 81..567, and
	// the strip starts at 649. So a panel underneath needs the plaque to give up
	// room, and lifting alone is not enough (at -0.34 its top went off the top of
	// the screen). It shrinks as well as lifts.
	//
	// A retrigger gets neither — scale 1, no lift, exactly what shipped.
	const PLAQUE_SCALE = 0.74;
	const PLAQUE_LIFT = -0.3;

	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	// The number used to be a bare <GoldText> that only inherited FadeContainer's
	// alpha fade — the plaque dropped in with backOut and swung, and the figure it
	// was announcing just materialised. It now slams in from 3x, lands on an
	// FxBurst + sfx on the exact contact frame, squash-settles and then breathes.
	// The sign drops with backOut, which reaches its target well before the tween
	// ends, so the lead is shorter than SIGN_DROP_MS: the number starts falling
	// while the sign is arriving and makes contact just as it settles. Holding the
	// number invisible for the lead matters — at 3x it is wider than the sign, and
	// slamming during the drop threw a giant numeral across the whole board.
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
		freeSpinIntroShow: () => (show = true),
		freeSpinIntroHide: () => {
			show = false;
			stopNumberAnim();
		},
		freeSpinIntroUpdate: async (emitterEvent) => {
			isEntry = emitterEvent.extraSpins === undefined;
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			// retriggers reuse this event, so the slam replays for the +N as well
			startNumberAnim();
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation
		offsetY={showPanel ? PLAQUE_LIFT : 0}
		scale={showPanel ? PLAQUE_SCALE : 1}
	>
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

	{#if showPanel && tier}
		<FeatureSplashPanel
			{tier}
			y={context.stateLayoutDerived.mainLayout().height * 0.55}
			width={context.stateLayoutDerived.mainLayout().width * 0.42}
		/>
	{/if}

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
