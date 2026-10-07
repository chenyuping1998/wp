<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FeatureIntro from './FeatureIntro.svelte';
	import FrostTitle from './FrostTitle.svelte';

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
	//
	// The multiplier lines are gen-2 copy. They used to read "CARRIES A 2×–50×
	// MULTIPLIER", which described the first game: a value re-rolled every spin.
	// It now only ever climbs, to 100X, and that is the single thing this game is
	// named after — so it gets two of the six slots.
	//
	// 'X' not '×' throughout: these are set in Titan One, whose subset does not
	// carry U+00D7, and one glyph arriving from a fallback face in the middle of a
	// line is more obvious than the plain letter.
	const TIPS = [
		'4 OR 5 SCATTERS AWARD 12 OR 15 FREE SPINS',
		'IN FREE SPINS EVERY WILD EXPANDS TO FILL ITS REEL',
		'EXPANDED WILDS STICK FOR THE REST OF THE FEATURE',
		'WILD MULTIPLIERS NEVER RESET — THEY ONLY CLIMB',
		'A SINGLE WILD CAN REACH 100X ON ITS OWN',
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

	// ── title layout ──────────────────────────────────────────────────────────
	// "GO BANANAS" and "FROSTLINE" are two Texts because only the second is tinted,
	// but they have to read as one centred headline — so the pair is measured and
	// laid out from its combined width rather than each being centred on its own.
	//
	// Measurement is re-derived off pulseTick, not taken once. Titan One is a
	// self-hosted face that finishes loading *after* this screen is already up;
	// measuring once would bake in the fallback stack's metrics and leave the two
	// halves permanently mis-spaced. Re-deriving costs two measureText calls per
	// 32ms tick on a screen that exists for a few seconds, and it self-corrects
	// the moment the real face lands.
	const TITLE_SIZE = 46;
	// FROSTLINE is the headline and runs 1.75x the name — but the two are STACKED,
	// and the stack is what makes that possible.
	//
	// The history matters because two different guesses were made here and both
	// were wrong in opposite directions. First: "nine glyphs at 1.3x measure wider
	// than the portrait layout", so the subtitle was shrunk to 0.72x. Then that
	// was "corrected" against widths rendered with @resvg — which, it turns out,
	// ignores font-family entirely and had silently substituted a narrow fallback
	// face, making everything look 35% narrower than it is.
	//
	// These numbers are read straight out of TitanOne.ttf's own tables (cmap ->
	// glyph ids, hmtx -> advances, unitsPerEm 1000) at letterSpacing 6, which is
	// the only measurement here that is not somebody's impression:
	//
	//     GO BANANAS  @46          368px
	//     FROSTLINE   @33 (0.72x)  239px   one line: 627px
	//     FROSTLINE   @60 (1.30x)  391px   one line: 779px
	//     FROSTLINE   @81 (1.75x)  503px   stacked:  503px
	//
	// The narrowest layout is portrait at 800px. On ONE line, 1.3x leaves 10px a
	// side before the 7px outline is counted — it overflows. Stacked, 1.75x leaves
	// ~148px a side and the name above it is the narrower of the two lines.
	//
	// So the lockup is two lines, not one. Note this is NOT the "stacked brass
	// plaque" that was tried and rejected on Go Bananas 100 — that was a badge
	// bolted under the name. This is one wordmark on two lines, which is how the
	// rest of the family would set a long sequel title if any of them had one.
	const SUBTITLE_SIZE = Math.round(TITLE_SIZE * 1.75);
	/** vertical gap between the two lines of the lockup */
	const TITLE_GAP = Math.round(TITLE_SIZE * 0.18);

	// ── colours ────────────────────────────────────────────────────────────────
	//
	// Both halves are cold now. The name was light gold (0xffe27a), chosen to
	// clear a brown jungle backdrop; a gold name in front of an iced FROSTLINE
	// read as two games' worth of title stuck together.
	//
	// Legibility comes from a hard DARK outline, and from nothing else — there is
	// no glow on this title any more. The first pass on this screen put a red blur
	// under gold lettering and the whole headline went soft, which is the general
	// case: a coloured glow behind type has nothing to separate it from unless the
	// two are far apart in value.
	//
	// NOTE: the rest of this screen is still Go Bananas 100's jungle art, so this
	// cold headline currently sits on a warm brown backdrop. Expected until the
	// Frostline background lands; see HANDOFF.md.
	//
	// Arrays are vertical gradients (pixi reads a colour array as gradient stops),
	// top stop first. Ice is lit from above and darkens into its own body, which
	// is the whole reason a flat blue does not read as ice.
	const TITLE_FILL = [0xf2fbff, 0xb9e2ff, 0x6fa9d6];
	const SUBTITLE_FILL = [0xffffff, 0xa8e4ff, 0x2f86c4];
	/** near-white top pass, for the lit edge along the top of each glyph */
	const SHEEN_FILL = [0xffffff, 0xffffff, 0xd6f1ff];
	/** the deep water under the ice — the under-pass that gives the word body */
	const SUBTITLE_UNDER = 0x0d3a5c;
	const OUTLINE = 0x0a2438;

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
		dropShadow: { color: 0x000000, alpha: 0.5, blur: 5, angle: Math.PI / 2, distance: 4 },
	};
	// FROSTLINE is drawn in THREE passes, not one, and the reason is the same as
	// GoldText's: a single gradient fill with a stroke is flat, because a bevel
	// needs light and shade on OPPOSITE sides of the same glyph and one Text node
	// cannot express that.
	//
	//   1. under   deep water blue, pushed down — the body of the ice, so the word
	//              has a thickness rather than being a decal
	//   2. body    the gradient plus the dark outline — the readable layer
	//   3. sheen   near-white, lifted a hair, low alpha — the lit top edge
	const subtitleUnderStyle = {
		...titleStyle,
		fontSize: SUBTITLE_SIZE,
		fill: SUBTITLE_UNDER,
		stroke: { color: SUBTITLE_UNDER, width: 9, join: 'round' as const },
		dropShadow: { color: 0x000000, alpha: 0.45, blur: 6, angle: Math.PI / 2, distance: 5 },
	};
	const subtitleStyle = {
		...titleStyle,
		fontSize: SUBTITLE_SIZE,
		fill: SUBTITLE_FILL,
		stroke: { color: OUTLINE, width: 7, join: 'round' as const },
		// A cast shadow, NOT a glow. This was `{ color: 0x1e6fa8, blur: 16, angle: 0,
		// distance: 0 }` — a blurred coloured shadow at zero offset, which is a halo
		// by another name, and it went when the glow did. Dropping it outright was
		// wrong though: it was the only thing lifting the word off the backdrop, so
		// it becomes the same offset black shadow the name above already uses.
		dropShadow: { color: 0x000000, alpha: 0.5, blur: 6, angle: Math.PI / 2, distance: 5 },
	};
	const subtitleSheenStyle = {
		...titleStyle,
		fontSize: SUBTITLE_SIZE,
		fill: SHEEN_FILL,
		stroke: { color: OUTLINE, width: 0, join: 'round' as const },
		dropShadow: undefined,
	};
	/** how far the under-pass sits below, and the sheen above, the body pass */
	const ICE_BEVEL = Math.max(2, Math.round(SUBTITLE_SIZE * 0.07));

	// ── icicles ────────────────────────────────────────────────────────────────
	//
	// Hung from the underside of FROSTLINE: FrostTitle draws them, each one
	// belonging to the letter it hangs from (same hashed, stable pattern as
	// before — the same every load).
	const ICICLE_COUNT = 9;

	// ── frost sparkles ─────────────────────────────────────────────────────────
	//
	// Four-point stars that twinkle around the word. Each has its own phase so
	// they do not blink together, which is the difference between frost catching
	// the light and a string of fairy lights.
	const SPARKLES = [
		{ x: -0.52, y: -0.42, r: 0.16, phase: 0 },
		{ x: 0.44, y: -0.5, r: 0.12, phase: 2.1 },
		{ x: 0.58, y: 0.3, r: 0.1, phase: 4.2 },
		{ x: -0.38, y: 0.46, r: 0.09, phase: 1.2 },
		{ x: 0.08, y: -0.58, r: 0.08, phase: 3.4 },
	];

	// Each line is centred on its own, so the only measurement the layout needs is
	// the subtitle's width — the icicles and sparkles are positioned across it.
	//
	// Re-derived off pulseTick rather than taken once: Titan One is a self-hosted
	// face that finishes loading AFTER this screen is already up, so measuring
	// once would bake in the fallback stack's metrics and leave the decorations
	// spread across the wrong width. It self-corrects the moment the real face
	// lands, and two measureText calls per 32ms tick on a screen that exists for a
	// few seconds is not a cost worth avoiding.
	const titleMetrics = $derived.by(() => {
		pulseTick;
		return {
			name: CanvasTextMetrics.measureText('GO BANANAS', new TextStyle(titleStyle)).width,
			subtitle: CanvasTextMetrics.measureText('FROSTLINE', new TextStyle(subtitleStyle)).width,
		};
	});
	/** y of each line, measured from the lockup's centre */
	const LINE_Y = {
		name: -(SUBTITLE_SIZE * 0.5 + TITLE_GAP),
		subtitle: TITLE_SIZE * 0.35,
	};
</script>

<!-- Go Bananas Frostline loading screen (art still inherited from Go Bananas 100) -->
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
				// was 0x1a0505, a warm red-black over the jungle art.
				// v8 API: through the beginFill shim the second fill's colour bled
				// into the first, the full-screen wash (see the pixi v8 notes).
				g.rect(0, 0, w, h);
				g.fill({ color: 0x0a1018, alpha: 0.68 });

				// NO HALO UNDER THE TITLE. There were two ice-blue ellipses below the
				// wordmark — a static one here at h*0.28 and a drifting, pulsing one
				// at h*0.34 — and with the title sitting at h*0.155 both of them read
				// as a glow hanging off the bottom of the name.
				//
				// This is the third time a halo has been removed from this screen: the
				// wordmark lost a breathing one behind it and a zero-offset blurred
				// drop shadow (see the title comment below). Same answer each time —
				// the type separates from the plate with an outline and an OFFSET cast
				// shadow, and anything centred and blurred behind it is just fog.

				g.rect(0, h * 0.72, w, h * 0.28);
				g.fill({ color: 0x000000, alpha: 0.22 });
			}}
		/>

		<!--
			Title. Sits near the top rather than at 0.36 because the feature card
			that replaces the progress column needs the middle of the screen, and a
			headline that slides up as three panels fade in gives the eye two things
			to follow at once. It does not move between the two states.

			"FROSTLINE" sits on the same line in the same face, a little smaller, in
			ice blue. On Go Bananas 100 this half was hot orange and matched the
			feature card's hero panel, so the colour already meant "the number that
			grows" by the time the player reached the card. That link does not carry
			over: the subtitle here names the front, not the mechanic. If the feature
			card is later re-themed to the cold palette the pairing is worth
			re-establishing deliberately rather than by accident.

			One earlier attempt is worth not repeating: a stacked brass PLAQUE, which
			read as a badge bolted under the name rather than part of it. This stack
			is not that — it is one wordmark on two lines.

			What makes the subtitle the thing being announced is SIZE and the ice
			treatment, and that is now the whole of it. An earlier version leaned on
			a breathing halo behind the word and a blue zero-offset drop shadow on
			the glyphs; both were removed (the halo was the louder of the two, and a
			zero-offset blurred shadow is a halo by another name). Separation comes
			from the dark outline and an offset black cast shadow instead, which is
			what the name above has always used.
		-->
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155}
		>
			<!--
				THE WORDMARK FALLS INTO PLACE (FrostTitle; Go Bananas Boat's hopping
				title, in ice): each letter drops in stiffly and lands with a clink,
				GO BANANAS first and FROSTLINE after it, the icicles grow once their
				letter is down, and every few seconds a shiver runs along the word
				with a glint across its lit edge.

				line 1: the family name, centred on its own
			-->
			<FrostTitle text="GO BANANAS" style={titleStyle} layers={[{ style: titleStyle }]} y={LINE_Y.name} delay={300} />

			<!--
				line 2: FROSTLINE, iced. The same three passes as ever (see
				subtitleUnderStyle), per letter, with the icicles drawn BETWEEN the
				under-pass and the body pass — so they grow out of the word's
				underside rather than hanging in front of it.
			-->
			<FrostTitle
				text="FROSTLINE"
				style={subtitleStyle}
				layers={[
					{ style: subtitleUnderStyle, dy: ICE_BEVEL },
					{ style: subtitleStyle },
					{ style: subtitleSheenStyle, dy: -ICE_BEVEL * 0.55, alpha: 0.38, sheen: true },
				]}
				iciclesAfter={0}
				icicles={{
					count: ICICLE_COUNT,
					top: SUBTITLE_SIZE * 0.3,
					color: SUBTITLE_UNDER,
					litColor: 0x9fdcff,
					size: SUBTITLE_SIZE,
				}}
				y={LINE_Y.subtitle}
				delay={760}
			/>

			<!--
				Frost sparkles. Four-point stars rather than circles: a round dot reads
				as a bubble, and the long thin cross is what the eye files as a glint.
				Drawn last so they sit over the lettering.
			-->
			<Graphics
				draw={(g) => {
					g.clear();
					for (const sp of SPARKLES) {
						// each on its own phase, and they spend most of the cycle dark —
						// `** 3` keeps the peak brief so it reads as a catch of light
						const tw = Math.max(0, Math.sin(pulseTick / 14 + sp.phase)) ** 3;
						if (tw < 0.02) continue;
						const r = SUBTITLE_SIZE * sp.r * (0.6 + 0.4 * tw);
						const x = titleMetrics.subtitle * sp.x;
						const y = LINE_Y.subtitle + SUBTITLE_SIZE * sp.y;
						const w = r * 0.16;
						g.moveTo(x, y - r);
						g.lineTo(x + w, y);
						g.lineTo(x, y + r);
						g.lineTo(x - w, y);
						g.closePath();
						g.moveTo(x - r, y);
						g.lineTo(x, y - w);
						g.lineTo(x + r, y);
						g.lineTo(x, y + w);
						g.closePath();
						g.fill({ color: 0xffffff, alpha: 0.9 * tw });
					}
				}}
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
				face, and at that size its counters close up and "25,000X" turns to
				mush. Everything in this column uses the body stack — the same split the
				rules and paytable modals make (see game/fonts.ts). The title above
				keeps the display face, which is what it is for.
			-->
			<Text
				anchor={0.5}
				y={-34}
				text="5X5, 15 LINES — MAX WIN 25,000X"
				style={{
					fontFamily: BODY_FONT,
					fontSize: 15,
					fontWeight: '600',
					fill: 0xdfeaf5,
					letterSpacing: 2.5,
				}}
			/>

			<!-- Progress bar -->
			<Graphics
				draw={(g) => {
					const barWidth = 240;
					const barHeight = 4;
					g.clear();
					// Background track. Was 0x38221c, a warm brown; the bar sits under an
					// iced title and a cold strapline, and it was the last warm object in
					// the column.
					g.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, 2);
					g.fill({ color: 0x1c2734, alpha: 0.82 });
					// Progress fill
					const fillWidth = (barWidth * animatedProgress) / 100;
					if (fillWidth > 0) {
						// The fill is ICE_BRIGHT rather than the deeper ICE_EDGE: this is a
						// 4px bar and the only thing it has to do is be obviously fuller
						// than the track behind it.
						g.roundRect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight, 2);
						g.fill({ color: 0x8fd9ff, alpha: 0.94 });
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
					fill: 0xc2d4e4,
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
					fill: 0x8fd9ff,
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
