<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import config from '../game/config';
	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FeatureIntro from './FeatureIntro.svelte';
	import TombTitle from './TombTitle.svelte';
	import BackgroundWarp from './BackgroundWarp.svelte';
	import { WARPS } from '../game/meshWin/bgWarp';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');
	let pulseTick = $state(0);

	// Gameplay tips cycling under the progress bar, so the wait teaches the
	// features instead of just counting.
	//
	// EVERY LINE HERE IS CHECKED AGAINST THE MATHS, NOT AGAINST THE RULES MODAL.
	// This set was inherited wholesale from Go Bananas 100 and described a game
	// that no longer exists — expanding wilds that stick and a wild multiplier
	// climbing to 100X, all three of which were removed when the sealed tablet
	// became the feature. Two of the seven slots went to a mechanic that had been
	// deleted, which is worse than having no tips: the loading screen was teaching
	// the player something the game would then refuse to do.
	//
	// The trigger line is BUILT from the maths, not typed out. Every place this
	// game states the award used to state it by hand, and all of them were wrong
	// together: "4 or 5 Scatters award 12 or 15" while the distributions forced
	// five. config.scatterSpins is game_config.py's freespin_triggers, scraped by
	// design/sync_math_config.mjs.
	//
	// 'X' not '×' throughout: these are set in Titan One, whose subset does not
	// carry U+00D7, and one glyph arriving from a fallback face in the middle of a
	// line is more obvious than the plain letter.
	const spinsFor = (config.scatterSpins ?? {}) as Record<string, number>;
	const scatterCounts = Object.keys(spinsFor)
		.map(Number)
		.sort((a, b) => a - b);
	const asList = (values: (string | number)[]) =>
		values.length > 1 ? `${values.slice(0, -1).join(', ')} OR ${values[values.length - 1]}` : `${values[0]}`;

	const TIPS = [
		`${asList(scatterCounts)} SCATTERS AWARD ${asList(scatterCounts.map((n) => spinsFor[n]))} FREE SPINS`,
		'EVERY SEALED TABLET ON A BOARD OPENS TO THE SAME SYMBOL',
		'IN FREE SPINS ONE SEAL HOLDS FOR THE WHOLE ROUND',
		'AN OPENED TABLET STAYS ON THE BOARD TO THE LAST SPIN',
		'EVERY OPENED TABLET CARRIES 2X TO 50X, REDRAWN EACH SPIN',
		'MULTIPLIERS ON A WINNING LINE ARE ADDED TOGETHER',
		'SUPER SPIN: EVERY COIN RESETS THE RESPINS TO 3',
	];
	const TIP_MS = 3400;
	// pulseTick already advances every 32ms for the drifting scene glow — reuse it as the
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
	// "GO" and "BANANUBIS" are two Texts because only the second is orange, but
	// they have to read as one centred headline — so the pair is measured and
	// laid out from its combined width rather than each being centred on its own.
	//
	// Inherited from gen-2, where the split was "GO BANANAS" + "100" and the
	// second half was the MECHANIC, deliberately a third larger so it stopped
	// reading as the title's last word. Here the second half is the NAME, so that
	// reasoning inverts: it is set at the same size as "GO" and earns its
	// emphasis from colour alone. Enlarging it would make the game look like it is
	// called "GO" with a badge on it.
	//
	// The sizes, styles and measurements below were still called `hundred`, which
	// is the one thing the second half is no longer. They are named for what they
	// hold now.
	//
	// Measurement is re-derived off pulseTick, not taken once. Titan One is a
	// self-hosted face that finishes loading *after* this screen is already up;
	// measuring once would bake in the fallback stack's metrics and leave the two
	// halves permanently mis-spaced. Re-deriving costs two measureText calls per
	// 32ms tick on a screen that exists for a few seconds, and it self-corrects
	// the moment the real face lands.
	const TITLE_SIZE = 46;
	const NAME_SIZE = TITLE_SIZE;
	const TITLE_GAP = 20;

	// Colours, and NO GLOW.
	//
	// Both halves used to be warm-on-warm — light gold over hot orange — with a
	// breathing orange bloom behind the name and a second orange blur baked into
	// its drop shadow. That was tuned against the old jungle sunset backdrop,
	// which was brown and bright. The backdrop is now the dusk hall: cool,
	// blue-violet and dark. Warm type on a cool dark ground already separates
	// completely, so the glow had nothing left to do except soften the edges it
	// was drawn behind, and a soft headline on a sharp background reads as a
	// mistake rather than as emphasis.
	//
	// The two halves are told apart by MATERIAL instead, and both materials are
	// ones the game is actually made of:
	//
	//   GO BAN      struck gold, the series' own yellow
	//   ANUBIS      white
	//
	// THE SPLIT IS INSIDE THE WORD, and that is the whole point of it. The name
	// is a portmanteau — BANANAS wearing ANUBIS — and colouring "GO BAN" against
	// "ANUBIS" is what shows the join. It does mean the break falls mid-word, so
	// the two halves have to be laid out from the width of the UNBROKEN word
	// rather than from their own; TombTitle sets them as one run of letters.
	//
	// Gold reads as the series (every game in it wears this yellow) and white
	// reads as the god, which is the same trade the art makes: gilded inlay on
	// pale stone. White is the most legible thing available on a backdrop that is
	// entirely cool and desaturated, so the second half needs no glow to carry.
	//
	// Legibility comes from a hard DARK outline, which is the one part of the old
	// treatment that was doing real work. Deepened a little: it was picked to sit
	// on a brown ground and the ground is darker now.
	const TITLE_FILL = 0xf2c33d; // struck gold — "GO BAN"
	const NAME_FILL = 0xffffff; // white — "ANUBIS"
	const OUTLINE = 0x1c1206;

	// v8 TextStyle shapes. The old `stroke: colour` + `strokeThickness: n` pair is
	// deprecated and was logging a warning on every Text built here; it also capped
	// out thin, which is exactly the outline weight this needed more of.
	const titleStyle = {
		fontFamily: GAME_FONT,
		fontSize: TITLE_SIZE,
		fontWeight: GAME_FONT_WEIGHT,
		letterSpacing: 6,
		fill: TITLE_FILL,
		stroke: { color: OUTLINE, width: 7, join: 'round' as const },
		dropShadow: { color: 0x000000, alpha: 0.5, blur: 5, angle: Math.PI / 2, distance: 4 },
	};
	const nameStyle = {
		...titleStyle,
		fontSize: NAME_SIZE,
		fill: NAME_FILL,
		// Nothing else differs. The two halves used to carry different outline
		// weights, which was fine when they were different materials sitting apart;
		// now that the break runs mid-word, a heavier outline on one side of it
		// would show up as the letters changing thickness inside "BANANUBIS".
		// The dropShadow is inherited from titleStyle — a plain black offset, the
		// thing that keeps type readable over an image.
	};

	// THE TITLE RISES OUT OF THE SAND (TombTitle): Go Bananas Boat's letters
	// hop; this name is carved and gilded, so each letter is raised out of the
	// floor and settles with a stone's weight, and light crosses the gilding
	// every few seconds after. The split inside the word survives — the three
	// parts keep their own styles — and "ANUBIS" butts straight onto "BAN" (no
	// gap), which is the seam the old titleMetrics measured for.
	//
	// TombTitle measures its letters once, so it is laid out again when the
	// display face has actually loaded; before that it would keep the fallback
	// face's spacing.
	const fontReady = $derived.by(() => {
		pulseTick;
		return typeof document !== 'undefined' && document.fonts.check(`${TITLE_SIZE}px ${GAME_FONT}`);
	});
</script>

<!-- Go Bananubis branded loading screen -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<!-- Background image -->
		<Sprite
			key="gbBgBase"
			anchor={0.5}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
			width={context.stateLayoutDerived.mainLayout().width}
			height={context.stateLayoutDerived.mainLayout().height}
		/>
		<!-- the sun dust drifting, as on the base game behind it (meshWin/bgWarp) -->
		{#if context.stateApp.loadedAssets?.gbBgBase}
			{#each WARPS.gbBgBase as warp (warp.id)}
				<BackgroundWarp
					{warp}
					plate="gbBgBase"
					x={0}
					y={0}
					width={context.stateLayoutDerived.mainLayout().width}
					height={context.stateLayoutDerived.mainLayout().height}
				/>
			{/each}
		{/if}

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

		<!-- NO BREATHING GLOW. A warm pool drifted and pulsed behind the title on a
		     sine wave; the plate brings its own light, and the title's letters
		     (TombTitle) are what moves here now. Something breathing on a timer
		     with no cause is the most machine-made thing a screen can do. -->

		<!--
			Title. Sits near the top rather than at 0.36 because the feature card
			that replaces the progress column needs the middle of the screen, and a
			headline that slides up as three panels fade in gives the eye two things
			to follow at once. It does not move between the two states.

			ONE LINE, ONE FACE, ONE SIZE, THREE TEXTS: "GO" and "BAN" in the series'
			gold, "ANUBIS" in white. The break falls inside the word on purpose —
			the name is BANANAS wearing ANUBIS, and this is what shows the join —
			which is also why "ANUBIS" is positioned from the width of the whole
			word, set as one run of letters (TombTitle).

			The colour used to borrow the feature card's hero orange, on the
			argument that it would already mean "the tablet" by the time the player
			reached the card — but the card tells its three panels apart by colour
			and the middle one cannot give its accent away.

			Two earlier attempts are worth not repeating: a stacked brass plaque,
			which read as a badge bolted under the name rather than part of it; and
			matching its size to the name, which turned it into the title's last
			word. Size, a warmer hue and a glow of its own are what make it the
			thing being announced.
		-->
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155}
		>
			{#key fontReady}
				<TombTitle
					parts={[
						{ text: 'GO', style: titleStyle },
						{ text: 'BAN', style: titleStyle, gapBefore: TITLE_GAP },
						{ text: 'ANUBIS', style: nameStyle },
					]}
					y={0}
					delay={300}
				/>
			{/key}
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
				face, and at that size its counters close up and a five-figure max-win
				figure turns to mush. Everything in this column uses the body stack — the same split the
				rules and paytable modals make (see game/fonts.ts). The title above
				keeps the display face, which is what it is for.
			-->
			<Text
				anchor={0.5}
				y={-34}
				text={`${config.numReels}X${config.numRows?.[0] ?? 5}, ${
					Object.keys(config.paylines).length
				} LINES — MAX WIN ${(config.betModes?.base?.max_win ?? 0).toLocaleString()}X`}
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
