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

	const layout = $derived(context.stateLayoutDerived.mainLayout());
	// What the background has to cover, expressed in the game box's own units: the
	// canvas can be wider or taller than the box, and MainContainer scales the box
	// to fit, so dividing the canvas by that scale gives the box-space size that
	// reaches the real edges.
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const coverW = $derived(canvas.width / layout.scale);
	const coverH = $derived(canvas.height / layout.scale);

	// logo.png's own proportions, so the mark is never stretched
	const LOGO_W = 1024;
	const LOGO_H = 512;
	const logoWidth = $derived(Math.min(layout.width * 0.36, layout.height * 0.62));
	const barWidth = $derived(Math.min(layout.width * 0.42, 460));

	// The cast, at the screen's own edges, at FULL opacity and untinted.
	//
	// Two attempts at holding them back failed the same way. At 0.55 alpha the
	// city lights showed straight through them; a dark tint at 0.94 dimmed them
	// until, against a lit background, they read as translucent anyway. The
	// problem was never the figures — it was that they were competing with the
	// background art behind them. So the SCRIM does the holding back instead: the
	// photograph goes down to 0.74 black and the people stay as they are.
	const castHeight = $derived(layout.height * 0.9);
	const castWidth = $derived((castHeight * 441) / 1100);

	// Their sway runs off the same clock as everywhere else, which is what keeps
	// the two of them out of step with each other (6500ms and 4000ms) rather than
	// nodding in unison.

	// Gameplay tips cycling under the progress bar, so the wait teaches the
	// features instead of just counting. Every line is checked against the rules
	// modal (components/ui/ModalGameRules) — note in particular that Frame values
	// ADD rather than multiply, and that all three tiers award the same number of
	// free spins (the Scatter count picks the tier, not the length).
	// 2026-09-04: this whole array was still Hot Miami's — the Collector,
	// "Neon Frames", and the Neon Nights/Sunset Hits/Ocean Drive tier names, none
	// of which exist in this game. It went unnoticed because IntroFeatures
	// covers this screen in NORMAL play, but replay dismisses itself without
	// clearing `showLoadingScreen` (see the note on `close()` above), so in
	// replay — one of Stake's own checkpoints — this was the actual, visible,
	// only screen, reciting a mechanic (the Collector) the maths file records
	// as removed. Rewritten against ModalGameRules' own wording directly rather
	// than paraphrased, so the two cannot drift apart again the same way.
	const TIPS = [
		'A SEARCHLIGHT LIGHTS ITS REEL FROM WHERE IT LANDS DOWN TO THE BOTTOM',
		'LIT POSITIONS TURN WILD AND CARRY A 1×–100× MULTIPLIER',
		'MULTIPLIERS ABOVE 1× ON ONE WINNING LINE ARE ADDED TOGETHER',
		'A SECOND BEAM ON THE SAME REEL DOUBLES WHERE THEY OVERLAP',
		'3, 4 OR 5 SCATTERS OPEN LOCKDOWN, RIOT OR BREAKOUT',
		'EVERY TIER AWARDS 8 SPINS AND BEAMS STAY LIT THROUGHOUT',
		'BREAKOUT LANDS MORE SEARCHLIGHTS THAN ANY OTHER TIER',
	];
	// Read the grid and the cap out of the maths config rather than writing them
	// into the string. This line shipped as GoBananas' "5X5, 15 LINES — MAX WIN
	// 10,000X" for the whole build; taking it from config means it cannot state a
	// game other than the one being played.
	const subtitle = [
		`${config.numReels}X${config.numRows?.[0] ?? 4}`,
		`${Object.keys(config.paylines).length} LINES`,
		`MAX WIN ${(config.betModes?.base?.max_win ?? 12000).toLocaleString('en-US')}X`,
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

<!--
	The loading screen.
	═══════════════════
	Rebuilt 2026-08-27. What it was: a typed "HOT MIAMI" in Titan One with a fake
	neon drop-shadow, a 4px progress rule and two lines of 13px text on a dimmed
	photograph. Three things were wrong with that, and the first is the one that
	matters:

	  · THE BRAND MARK WAS NOT ON IT. The game ships a drawn logo (hmLogo) and the
	    intro card two seconds later uses it. The first frame a player ever sees
	    was a typographic imitation of the logo standing in for the logo.
	  · The cast walked on at the intro card and not before, so the two screens
	    read as belonging to different games.
	  · 4px of rule and 13px of type is a template's loading screen. Nothing on it
	    said which game was loading except the words.

	It is now the intro card's screen one beat earlier: same background, same two
	figures, the real logo, and the progress bar in the game's own neon rather than
	a grey rule. The tips stay — they were the one good idea in the old one.
-->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<!--
			Background and scrim at CANVAS size, not at the game box's.

			They were drawn at mainLayout() — the letterboxed 16:9 box the board
			lives in — while the canvas can be much wider. On a wide screen that
			left a black bar down each edge, and the two figures stand exactly
			there, so the bar read as a dark slab travelling with them
			(「後面有一片黑一起晃」). It never moved; they did, in front of it.

			Background.svelte has always used canvasSizes() for the same reason.
		-->
		<Sprite
			key="hmBgBase"
			anchor={0.5}
			x={layout.width * 0.5}
			y={layout.height * 0.5}
			width={coverW}
			height={coverH}
		/>

		<!--
			ONE figure, on the right.

			This drew two — the boss on the left and hmCastGirlMesh on the right,
			which is Hot Miami's woman. Capo Nostra has a single character (see
			ART_BRIEF §1: the two-figure cast was deliberately reduced to one), so
			the second was another game's art standing on this game's first screen.

			He is on the RIGHT rather than where the boss used to be, because that
			is the side he occupies during play (Cast.svelte). The loading screen
			now previews the layout the player is about to see instead of a
			symmetry that no longer exists.
		-->
		<Container
			x={layout.width - castWidth * 0.72}
			y={layout.height}
		>
			<Sprite
				key="hmCastGuyMesh"
				anchor={{ x: 0.5, y: 1 }}
				width={castWidth}
				height={castHeight}
			/>
		</Container>

		<!-- The real logo, not a typeset stand-in for it -->
		<Sprite
			key="hmLogo"
			anchor={0.5}
			x={layout.width * 0.5}
			y={layout.height * 0.3}
			width={logoWidth}
			height={logoWidth * (LOGO_H / LOGO_W)}
		/>

		<Text
			anchor={0.5}
			x={layout.width * 0.5}
			y={layout.height * 0.3 + logoWidth * (LOGO_H / LOGO_W) * 0.62}
			text={subtitle}
			style={{
				fontFamily: BODY_FONT,
				fontSize: Math.max(13, Math.min(19, layout.width * 0.014)),
				fontWeight: '600',
				fill: 0xffd75e,
				letterSpacing: 3,
			}}
		/>

		<Container x={layout.width * 0.5} y={layout.height * 0.66}>
			<!--
				The bar in the game's own neon: an indigo channel with a magenta-to-cyan
				fill and a lit head, at 10px rather than 4. Drawn rather than tinted
				from art so it is correct at any width.
			-->
			<Graphics
				draw={(g) => {
					const w = barWidth;
					const h = 10;
					g.clear();
					g.roundRect(-w / 2, -h / 2, w, h, h / 2);
					g.fill({ color: 0x1b0f3a, alpha: 0.95 });
					g.stroke({ width: 2, color: 0x5C2126, alpha: 0.65 });
					const fill = (w - 6) * (animatedProgress / 100);
					if (fill > 2) {
						g.roundRect(-w / 2 + 3, -h / 2 + 3, fill, h - 6, (h - 6) / 2);
						g.fill({ color: 0xC9A227, alpha: 0.95 });
						// the leading 40% cools toward cyan, so the bar has a direction
						const head = Math.min(fill, fill * 0.4);
						g.roundRect(-w / 2 + 3 + fill - head, -h / 2 + 3, head, h - 6, (h - 6) / 2);
						g.fill({ color: 0xE8D48B, alpha: 0.85 });
					}
				}}
			/>

			{#if !context.stateApp.loaded}
				<Text
					anchor={0.5}
					y={30}
					text={`LOADING ${Math.round(animatedProgress)}%`}
					style={{
						fontFamily: BODY_FONT,
						fontSize: 14,
						fontWeight: '600',
						fill: 0xe8d3b6,
						letterSpacing: 2,
					}}
				/>
			{/if}

			<Text
				anchor={0.5}
				y={context.stateApp.loaded ? 30 : 62}
				alpha={tipAlpha}
				text={TIPS[tipIndex]}
				style={{
					fontFamily: BODY_FONT,
					fontSize: Math.max(13, Math.min(17, layout.width * 0.0125)),
					fontWeight: '600',
					fill: 0xffd75e,
					letterSpacing: 2,
					align: 'center',
					wordWrap: true,
					wordWrapWidth: layout.width * 0.62,
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
