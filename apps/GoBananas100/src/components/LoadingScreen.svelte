<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');
	let pulseTick = $state(0);

	// Gameplay tips cycling under the progress bar, so the wait teaches the
	// features instead of just counting. Every line is checked against the rules
	// modal (components/ui/ModalGameRules) — note in particular that it takes 4 or
	// 5 Scatters here, not 3, and that multipliers ADD rather than multiply.
	const TIPS = [
		'4 OR 5 SCATTERS AWARD 12 OR 15 FREE SPINS',
		'IN FREE SPINS EVERY WILD EXPANDS TO FILL ITS REEL',
		'EXPANDED WILDS STICK FOR THE REST OF THE FEATURE',
		'EACH EXPANDED WILD CARRIES A 2×–50× MULTIPLIER',
		'MULTIPLIERS ON A WINNING LINE ARE ADDED TOGETHER',
		'SUPER SPIN: EVERY COIN RESETS THE RESPINS TO 3',
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

<!-- Go Bananas jungle-commando branded loading screen -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<!-- Background image (山水 theme) -->
		<Sprite
			key="gbBgBase"
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
				g.beginFill(0x1a0505, 0.68);
				g.drawRect(0, 0, w, h);
				g.endFill();

				// subtle vignette / top glow so the screen looks less flat
				g.beginFill(0xffd43b, 0.04);
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
				g.beginFill(0xffd67c, glowAlpha);
				g.drawEllipse(glowX, h * 0.34, w * 0.26, h * 0.1);
				g.endFill();
			}}
		/>

		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.36}
		>
			<!-- Game title -->
			<Text
				anchor={0.5}
				text="GO BANANAS"
				style={{
					fontFamily: GAME_FONT,
					fontSize: 52,
					fontWeight: GAME_FONT_WEIGHT,
					fill: 0xffd43b,
					letterSpacing: 6,
					dropShadow: true,
					dropShadowColor: 0xe03131,
					dropShadowBlur: 18,
					dropShadowDistance: 0,
					stroke: 0xfff4cf,
					strokeThickness: 1,
				}}
			/>

			<!--
				Subtitle and the loading line below both sit at 12–15px, which is where
				Titan One stops working: it is a heavy rounded display face, and at that
				size its counters close up and "10,000X" turns to mush. They use the body
				stack instead — the same split the rules and paytable modals already make
				(see game/fonts.ts). The 52px title above keeps the display face, which is
				what it is for.
			-->
			<Text
				anchor={0.5}
				y={65}
				text="5X5, 15 LINES — MAX WIN 25,000X"
				style={{
					fontFamily: BODY_FONT,
					fontSize: 15,
					fontWeight: '600',
					fill: 0xf7ead6,
					letterSpacing: 2.5,
				}}
			/>
		</Container>

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
					g.beginFill(0x38221c, 0.82);
					g.drawRoundedRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 2);
					g.endFill();
					// Progress fill
					const fillWidth = (barWidth * animatedProgress) / 100;
					if (fillWidth > 0) {
						g.beginFill(0xffd43b, 0.94);
						g.drawRoundedRect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight, 2);
						g.endFill();
					}
				}}
			/>

			<!--
				Progress readout — percentage only. It used to switch to "TAP TO
				CONTINUE" once loading finished, which put two versions of the same
				instruction on screen at once: this one and the far larger "PRESS
				ANYWHERE TO CONTINUE" across the foot (PressToContinue.svelte). The big
				one wins, so this line simply retires and the tip moves up into the space
				it leaves — the swap happens on the single frame the bar fills and the
				bottom prompt appears, so nothing visibly jumps.
			-->
			{#if !context.stateApp.loaded}
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
						fill: 0xe8d3b6,
						letterSpacing: 2,
					}}
				/>
			{/if}

			<!-- rotating gameplay tip -->
			<Text
				anchor={0.5}
				y={context.stateApp.loaded ? 20 : 48}
				alpha={tipAlpha}
				text={TIPS[tipIndex]}
				style={{
					fontFamily: BODY_FONT,
					fontSize: 13,
					fontWeight: '600',
					fill: 0xffd75e,
					letterSpacing: 2,
				}}
			/>
		</Container>
	</MainContainer>
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!-- transition between the loading screen and the game -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
