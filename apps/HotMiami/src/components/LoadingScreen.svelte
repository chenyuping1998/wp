<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import config from '../game/config';
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
	// modal (components/ui/ModalGameRules) — note in particular that Frame values
	// ADD rather than multiply, and that all three tiers award the same number of
	// free spins (the Scatter count picks the tier, not the length).
	const TIPS = [
		'NEON FRAMES LAND ON THE GRID AND REVEAL A 2×–100× MULTIPLIER',
		'FRAMES SHARING A WINNING LINE ARE ADDED TOGETHER',
		'THE COLLECTOR SWEEPS EVERY FRAME ON THE GRID, WIN OR NOT',
		'3, 4 OR 5 SCATTERS OPEN NEON NIGHTS, SUNSET HITS OR OCEAN DRIVE',
		'IN FREE SPINS EVERY FRAME IS STICKY UNTIL THE FEATURE ENDS',
		'SUNSET HITS: A FRAME THAT WINS DOUBLES BEFORE THE NEXT SPIN',
		'OCEAN DRIVE STARTS WITH A FRAME ON EVERY POSITION',
	];
	// Read the grid and the cap out of the maths config rather than writing them
	// into the string. This line shipped as GoBananas' "5X5, 15 LINES — MAX WIN
	// 10,000X" for the whole build; taking it from config means it cannot state a
	// game other than the one being played.
	const subtitle = [
		`${config.numReels}X${config.numRows?.[0] ?? 4}`,
		`${Object.keys(config.paylines).length} LINES`,
		`MAX WIN ${(config.betModes?.base?.max_win ?? 20000).toLocaleString('en-US')}X`,
	].join(', ').replace(/, MAX/, ' — MAX');

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

<!-- Hot Miami neon-sunset branded loading screen -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<!-- Background image (Miami sunset theme) -->
		<Sprite
			key="hmBgBase"
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
				text="HOT MIAMI"
				style={{
					fontFamily: DISPLAY_FONT,
					fontSize: 52,
					fontWeight: DISPLAY_FONT_WEIGHT,
					fill: 0xff2e88,
					letterSpacing: 6,
					dropShadow: true,
					dropShadowColor: 0x00e5ff,
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
				text={subtitle}
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
