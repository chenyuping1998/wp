<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { TITLE_FONT, TITLE_FONT_WEIGHT } from '../game/fonts';
	import { featureTimeScale } from '../game/timeScale';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Sprite, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import { stateGame } from '../game/stateGame.svelte';
	import { tierByBonusTier } from '../game/featureTiers';
	import TreasureFeatureCard from './TreasureFeatureCard.svelte';
	import TreasureFeatureOpening from './TreasureFeatureOpening.svelte';
	import type { OpeningSound } from '../game/featureOpening';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation, { SIGN_DROP_MS } from './FreeSpinAnimation.svelte';
	import FxBurst from './TreasureBurst.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let oncomplete = $state(() => {});
	let openingDone = $state(true), openingCovered = $state(true), openingSequence = $state(0);
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const openingSound = (cue: OpeningSound) => {
		if(cue==='wave')context.eventEmitter.broadcast({type:'soundNeonZap'});
		else if(cue==='celebrate')context.eventEmitter.broadcast({type:'soundOnce',name:'jng_intro_fs'});
		else context.eventEmitter.broadcast({type:'soundTreasureFoley',cue:cue==='scan'?'detector_lock':cue==='find'?'sand_reveal':'chest_open'});
	};
	const continueOpening = () => {
		if(!openingDone){openingCovered=true;openingDone=true;startNumberAnim();return;}
		oncomplete();
	};

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
	onDestroy(()=>{stopNumberAnim();oncomplete();});

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
			openingDone = true;
			stateGame.featureSplashShow = false;
			stopNumberAnim();
			oncomplete();
		},
		freeSpinIntroUpdate: async (emitterEvent) => {
			isEntry = emitterEvent.extraSpins === undefined;
			// Only now is it known whether this showing is an entry (a card with a
			// character and a panel) or a retrigger (the plaque). `freeSpinIntroShow`
			// fires first and cannot tell them apart.
			stateGame.featureSplashShow = isEntry && tierByBonusTier(stateGame.bonusTier) !== null;
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			openingSequence++;
			openingDone = !isEntry || !showPanel;
			openingCovered = openingDone;
			if(openingDone)startNumberAnim();
			if(isEntry&&openingDone)context.eventEmitter.broadcast({type:'soundOnce',name:'jng_intro_fs'});
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

	{#if show && showPanel && tier && openingCovered}
		<TreasureFeatureCard width={canvas.width} height={canvas.height} {tier} header={`${freeSpinsFromEvent} ${title} ${subtitle}`} sequence={openingSequence}/>
	{:else if show && !showPanel}
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
					fill: [0xfff3d2, 0xf3d397, 0xad7b47],
					stroke: {color:0x274c52,width:6},
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
					tint={0xf3d397}
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
					fill: 0xf3d397,
					stroke: {color:0x274c52,width:3},
				}}
			/>
		{/snippet}
		</FreeSpinAnimation>
	{/if}

	{#if show && showPanel && tier && !openingDone}
		{#key openingSequence}
			<TreasureFeatureOpening width={canvas.width} height={canvas.height} title={tier.title} timeScale={featureTimeScale}
				onsound={openingSound} oncover={()=>{openingCovered=true;startNumberAnim();}} oncomplete={()=>openingDone=true}/>
		{/key}
	{/if}
	{#if show}<PressToContinue onpress={continueOpening}/>{/if}
</FadeContainer>
