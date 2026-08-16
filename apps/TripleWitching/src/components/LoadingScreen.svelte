<script lang="ts">
	import { BODY_FONT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import config from '../game/config';
	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FeatureIntro from './FeatureIntro.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Sized against the main box and capped on both axes, so the mark carries the
	// same visual weight on a 1422-wide desktop layout and an 800-wide portrait
	// one. 2080x500 is the generated asset's own size; the height follows from it
	// rather than being a second number that can drift out of ratio.
	const wordmarkWidth = $derived(
		Math.min(
			context.stateLayoutDerived.mainLayout().width * 0.46,
			context.stateLayoutDerived.mainLayout().height * 0.62,
		),
	);

	let loadingType = $state<'start' | 'transition'>('start');
	let pulseTick = $state(0);

	// Board size is written ROWS x REELS - "3x5", the way players and the rest of
	// the industry say it. The maths config stores it the other way round
	// (numReels, numRows), so the two are deliberately swapped here rather than
	// interpolated in the order the config happens to list them.
	//
	// The strapline under the wordmark. Every figure is read from the maths
	// config, never typed here: the RTP moved 0.96 -> 0.94, the cap 12,000x ->
	// 10,000x and the bonus cost 200 -> 100 while this screen already existed,
	// and it is the first text a player reads - the worst possible place to keep
	// a stale number.
	const rtpPct = `${(config.rtp * 100).toFixed(0)}%`;
	const maxWinText = `${config.betModes.base.max_win.toLocaleString('en-US')}×`;
	const lineCount = Object.keys(config.paylines ?? {}).length;
	const strapline = `${config.numRows[0]}×${config.numReels}, ${lineCount} LINES — RTP ${rtpPct} — MAX WIN ${maxWinText}`;

	// Gameplay tips cycling under the progress bar, so the wait teaches the
	// features instead of just counting.
	//
	// Every line is checked against the rules modal (components/ui/ModalGameRules),
	// which reads its figures straight out of the maths config. This screen was
	// inherited wholesale from another game and was still advertising that one:
	// 15 lines, a 10,000× cap, expanding sticky wilds, a respin mode. None of it
	// is true here, and it was the very first thing a player read.
	//
	// "PAYLINE" and "PAYLINES" are both on the restricted list, so these say
	// LINES. This text is literal and shows in both modes, so there is no social
	// branch to hide behind - check_social_words.mjs enforces it.
	const TIPS = [
		'3, 4 OR 5 TRIPLE WITCHINGS AWARD 10, 12 OR 15 FREE SPINS',
		'EVERY FREE SPIN ROUND RUNS 1, 2 OR ALL 3 MODIFIERS',
		'EXPAND OPENS THE BOARD TO 5×5 — 40 LINES, OR 3,125 WAYS',
		'MULTIPLIER: CONTRACT VALUES ADD UP AND APPLY TO THAT SPIN',
		'WAYS: MATCHING SYMBOLS ON ADJACENT REELS WIN, IN ANY POSITION',
		'2 OR MORE TRIPLE WITCHINGS IN THE FEATURE AWARD MORE SPINS',
		'CONTRACT SUBSTITUTES FOR EVERYTHING EXCEPT TRIPLE WITCHING',
	];
	const TIP_MS = 3400;
	// pulseTick already advances every 32ms for the title pulse — reuse it as the
	// tip clock rather than starting a second timer
	const tipElapsed = $derived(pulseTick * 32);
	const tipIndex = $derived(Math.floor(tipElapsed / TIP_MS) % TIPS.length);
	// fade in over the first 12% of a tip's turn and out over the last 12%, so
	// lines cross-dissolve instead of snapping
	const tipAlpha = $derived.by(() => {
		const p = (tipElapsed % TIP_MS) / TIP_MS;
		if (p < 0.12) return p / 0.12;
		if (p > 0.88) return (1 - p) / 0.12;
		return 1;
	});

	// Animate progress bar smoothly
	let animatedProgress = $state(0);
	$effect(() => {
		const target = context.stateApp.loaded ? 100 : 80;
		const interval = setInterval(() => {
			if (animatedProgress < target) {
				animatedProgress = Math.min(animatedProgress + 2, target);
			} else {
				clearInterval(interval);
			}
		}, 25);
		return () => clearInterval(interval);
	});

	onMount(() => {
		const id = setInterval(() => {
			pulseTick += 1;
		}, 32);
		return () => clearInterval(id);
	});
</script>

<!-- Triple Witching branded loading screen -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<!-- the trading floor, held under a dark overlay for readability -->
		<Sprite
			key="mcBgBase"
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
			width={context.stateLayoutDerived.mainLayout().width}
			height={context.stateLayoutDerived.mainLayout().height}
		/>

		<!-- Dark overlay for readability -->
		<Graphics
			draw={(g) => {
				const w = context.stateLayoutDerived.mainLayout().width;
				const h = context.stateLayoutDerived.mainLayout().height;
				g.clear();
				g.beginFill(0x040807, 0.72);
				g.drawRect(0, 0, w, h);
				g.endFill();

				// subtle vignette / top glow so the screen looks less flat
				g.beginFill(0x4bd67f, 0.05);
				g.drawEllipse(w * 0.5, h * 0.28, w * 0.22, h * 0.11);
				g.endFill();

				g.beginFill(0x000000, 0.22);
				g.drawRect(0, h * 0.72, w, h * 0.28);
				g.endFill();
			}}
		/>

		<Graphics
			draw={(g) => {
				const w = context.stateLayoutDerived.mainLayout().width;
				const h = context.stateLayoutDerived.mainLayout().height;
				const glowX = w * 0.5 + Math.sin(pulseTick / 48) * w * 0.08;
				const glowAlpha = 0.03 + 0.015 * (0.5 + 0.5 * Math.sin(pulseTick / 22));
				g.clear();
				g.beginFill(0x4bd67f, glowAlpha);
				g.drawEllipse(glowX, h * 0.34, w * 0.26, h * 0.1);
				g.endFill();
			}}
		/>

		<!--
			The title is a generated wordmark, not live text. Titan One is a rounded
			cartoon display face and it never suited a trading terminal; the mark is
			drawn in monospace with the ticker furniture the rest of the game uses.
			See design/generate_wordmark.mjs — no new font ships for it.

			It does NOT move between the loading state and the feature card that
			replaces it: a headline sliding up while three panels fade in gives the
			eye two things to follow at once.
		-->
		<Sprite
			key="mcWordmark"
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155}
			width={wordmarkWidth}
			height={(wordmarkWidth * 500) / 2080}
		/>

	</MainContainer>
</FadeContainer>

<!-- loading column: retires the moment the assets are in -->
<FadeContainer show={loadingType === 'start' && !context.stateApp.loaded}>
	<MainContainer>
		<!--
			Strapline. Lives with the progress bar rather than with the title,
			because the feature card that replaces this column says the same two
			things in more detail and in the player's own language — and at the
			title's position it collided with the card's volatility badge.

			12-15px is where Titan One stops working: it is a heavy rounded display
			face and at that size its counters close up. Body stack here; the 52px
			title above keeps the display face, which is what it is for.
		-->
		<Text
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155 + (wordmarkWidth * 500) / 2080 / 2 + 22}
			text={strapline}
			style={{
				fontFamily: BODY_FONT,
				fontSize: 15,
				fontWeight: '600',
				fill: 0xcfe9da,
				letterSpacing: 2.5,
			}}
		/>

		<!-- Progress bar area -->
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.6}
		>
			<!-- Progress bar -->
			<Graphics
				draw={(g) => {
					const barWidth = 240;
					const barHeight = 4;
					g.clear();
					// Background track
					g.beginFill(0x11201a, 0.9);
					g.drawRoundedRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 2);
					g.endFill();
					// Progress fill
					const fillWidth = (barWidth * animatedProgress) / 100;
					if (fillWidth > 0) {
						g.beginFill(0x4bd67f, 0.94);
						g.drawRoundedRect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight, 2);
						g.endFill();
					}
				}}
			/>

			<!--
				Progress readout. The whole column is gated on `!loaded` now, so this no
				longer needs its own guard, and the tip no longer has to move up into
				the space the readout leaves — the feature card takes the screen the
				moment loading finishes.
			-->
			<Text
				anchor={0.5}
				y={20}
				text={`LOADING ${Math.round(animatedProgress)}%`}
				style={{
					fontFamily: BODY_FONT,
					fontSize: 13,
					fontWeight: '600',
					// lifted off the previous muted tan, which was dim at 13px against
					// the dark vignette
					fill: 0xa9c7b6,
					letterSpacing: 2,
				}}
			/>

			<!-- rotating gameplay tip -->
			<Text
				anchor={0.5}
				y={48}
				alpha={tipAlpha}
				text={TIPS[tipIndex]}
				style={{
					fontFamily: BODY_FONT,
					fontSize: 13,
					fontWeight: '600',
					fill: 0x7fe3a4,
					letterSpacing: 2,
				}}
			/>
		</Container>
	</MainContainer>
</FadeContainer>

<!-- feature card: takes the screen once the bar fills -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<FeatureIntro />
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!--
	Transition between the loading screen and the game.

	The handover is on `oncover`, not `oncomplete`: that is the frame the
	circuit-breaker shutters are shut, so the loading screen is torn down and the
	game put up behind a screen that is showing nothing. Handing over on
	`oncomplete` instead would play the shutters retracting to reveal... the
	loading screen again, and only then cut to the game.

	Unmounting here takes the animation with it, so the retract is never seen on
	this one - the game simply appears from black. That is the intended shape:
	in-game transitions get the full open because the scene behind them is ready,
	and this one is a handover between two different trees.
-->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncover={props.onloaded} oncomplete={props.onloaded} />
</FadeContainer>
