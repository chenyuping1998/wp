<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import config from '../game/config';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FeatureIntro from './FeatureIntro.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Read from config, never typed into the string. This line is the first thing
	// a player reads about the game, and gen-2 shipped it saying "5X5, 15 LINES —
	// MAX WIN 25,000X" long after none of those three numbers were true.
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 4;
	const waysCount = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1);
	const maxWin = config.betModes?.base?.max_win ?? 10000;

	let loadingType = $state<'start' | 'transition'>('start');
	let pulseTick = $state(0);

	// Gameplay tips cycling under the progress bar, so the wait teaches the
	// features instead of just counting. Every line is checked against the rules
	// modal (components/ui/ModalGameRules) — note in particular that it takes 4 or
	// 3 Scatters here, not 4, and that ways MULTIPLY across reels rather than
	// adding — a player arriving from gen-2 will assume both the other way round.
	//
	// Three of the seven slots go to the Machete, because it is the only rule in
	// this game a player of other ways games will not already know.
	//
	// 'X' not '×' throughout: these are set in Titan One, whose subset does not
	// carry U+00D7, and one glyph arriving from a fallback face in the middle of a
	// line is more obvious than the plain letter.
	const TIPS = [
		'3, 4 OR 5 SCATTERS AWARD 8, 10 OR 12 FREE SPINS',
		'THE NINJA SLASH REVEALS TWO MOTIFS IN EACH CUT CELL',
		'ONE SPLIT REEL DOUBLES THE WAYS OF EVERY WIN THROUGH IT',
		'IN FREE SPINS A SPLIT REEL STAYS SPLIT TO THE END',
		'THE LAST FREE SPIN IS PLAYED WITH ALL FIVE REELS SPLIT',
		'SYMBOLS COUNT ANYWHERE ON A REEL — THERE ARE NO LINES',
		'HOLD AND SPIN: EVERY COIN RESETS THE RESPINS TO 3',
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

	// The two halves of the wordmark. Gen-2's accent was "100", the number its
	// mechanic was named after; Delta's is the generation name itself.
	const TITLE_MAIN = 'GO';
	const TITLE_ACCENT = 'BANANINJA';

	// ── title layout ──────────────────────────────────────────────────────────
	// Measure the two words as one centred headline, even while the font loads.
	//
	// Measurement is re-derived off pulseTick, not taken once. Titan One is a
	// self-hosted face that finishes loading *after* this screen is already up;
	// measuring once would bake in the fallback stack's metrics and leave the two
	// halves permanently mis-spaced. Re-deriving costs two measureText calls per
	// 32ms tick on a screen that exists for a few seconds, and it self-corrects
	// the moment the real face lands.
	const TITLE_SIZE = 54;
	const ACCENT_SIZE = TITLE_SIZE;
	const TITLE_GAP = 20;

	// Hard outline and one fill colour keep the title crisp over the background.
	// One ink-and-parchment wordmark, as in Boat: no coloured halo and no
	// differently coloured second word.
	const TITLE_FILL = 0xf2dcc0;
	const OUTLINE = 0x101622;

	// v8 TextStyle shapes. The old `stroke: colour` + `strokeThickness: n` pair is
	// deprecated and was logging a warning on every Text built here; it also capped
	// out thin, which is exactly the outline weight this needed more of.
	const titleStyle = {
		fontFamily: GAME_FONT,
		fontSize: TITLE_SIZE,
		fontWeight: GAME_FONT_WEIGHT,
		letterSpacing: 6,
		fill: TITLE_FILL,
		stroke: { color: OUTLINE, width: 6, join: 'round' as const },
	};
	const accentStyle = {
		...titleStyle,
		fontSize: ACCENT_SIZE,
	};

	const titleMetrics = $derived.by(() => {
		pulseTick; // re-measure once the display face has loaded
		const name = CanvasTextMetrics.measureText(TITLE_MAIN, new TextStyle(titleStyle)).width;
		const accent = CanvasTextMetrics.measureText(TITLE_ACCENT, new TextStyle(accentStyle)).width;
		return { name, accent, total: name + TITLE_GAP + accent };
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
				g.beginFill(0x0b1525, 0.72);
				g.drawRect(0, 0, w, h);
				g.endFill();

				g.beginFill(0x000000, 0.22);
				g.drawRect(0, h * 0.72, w, h * 0.28);
				g.endFill();
			}}
		/>

		<!-- Single-colour wordmark stays fixed while the cards enter below it. -->
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155}
		>
			<Text
				anchor={{ x: 0, y: 0.5 }}
				x={-titleMetrics.total / 2}
				style={titleStyle}
				text={TITLE_MAIN}
			/>

			<Text
				anchor={{ x: 0, y: 0.5 }}
				x={-titleMetrics.total / 2 + titleMetrics.name + TITLE_GAP}
				style={accentStyle}
				text={TITLE_ACCENT}
			/>
		</Container>
	</MainContainer>
</FadeContainer>

<!--
	Loading column. Retires the moment the assets are in, and the feature card
	takes the screen in its place.

	The strapline moved down here off the title, because the card says the same
	two things in more detail — and at the title's position it now collides with
	the plaque.
-->
<FadeContainer show={loadingType === 'start' && !context.stateApp.loaded}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.6}
		>
			<!--
				12–15px is where Titan One stops working: it is a heavy rounded display
				face, and at that size its counters close up and "10,000X" turns to
				mush. Everything in this column uses the body stack — the same split the
				rules and paytable modals make (see game/fonts.ts). The title above
				keeps the display face, which is what it is for.
			-->
			<Text
				anchor={0.5}
				y={-34}
				text={`${rowCount}X${reelCount}, ${waysCount.toLocaleString()} WAYS — MAX WIN ${maxWin.toLocaleString()}X`}
				style={{
					fontFamily: BODY_FONT,
					fontSize: 15,
					fontWeight: '600',
					fill: 0xf7ead6,
					letterSpacing: 2.5,
				}}
			/>

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
				Progress readout. The whole column is now gated on `!loaded`, so this
				no longer needs its own guard and the tip no longer has to move up into
				the space it leaves — the feature card takes the screen the moment
				loading finishes.
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
					fill: 0xe8d3b6,
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
					fill: 0xffd75e,
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

	The handover fires on `oncover` as well as `oncomplete`: `oncover` is the
	frame the blast has gone fully white, so the loading screen is torn down and
	the game put up behind a screen showing nothing but flash. Handing over only
	on `oncomplete` meant the flash cleared to reveal the loading screen for a
	beat before the game appeared.

	`onloaded` unmounts this whole component, which takes the animation with it,
	so in practice `oncomplete` never fires — the flash vanishes along with the
	loading screen and the game is already behind it. It stays wired as a safety
	net for the day the handover stops unmounting.
-->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncover={props.onloaded} oncomplete={props.onloaded} />
</FadeContainer>
