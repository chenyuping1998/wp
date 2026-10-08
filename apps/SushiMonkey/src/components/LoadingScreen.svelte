<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import FeatureIntro from './FeatureIntro.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');
	// A 32ms tick. It was named for a title pulse that no longer exists — the
	// glows it drove are gone — but the title still needs it, to re-measure
	// once the display face has loaded.
	let pulseTick = $state(0);

	// Animate progress bar smoothly
	let animatedProgress = $state(0);
	$effect(() => {
		const target = context.stateApp.loaded ? 100 : 80;
		const interval = everyFrame(() => {
			if (animatedProgress < target) {
				animatedProgress = Math.min(animatedProgress + 1.3, target);
			} else {
				interval();
			}
		});
		return () => interval();
	});

	onMount(() => {
		// one tick per 32ms of real time, as the interval it replaced
		const start = performance.now();
		const id = everyFrame(() => {
			pulseTick = Math.floor((performance.now() - start) / 32);
		});
		return () => id();
	});

	// The two halves of the wordmark. Gen-2's accent was "100", the number its
	// mechanic was named after; Delta's is the generation name itself.
	const TITLE_MAIN = 'SUSHI';
	const TITLE_ACCENT = 'MONKEY';

	// ── title layout ──────────────────────────────────────────────────────────
	// "GO BANANAS" and "DELTA" are two Texts because only the second is orange, but
	// they have to read as one centred headline — so the pair is measured and
	// laid out from its combined width rather than each being centred on its own.
	//
	// Measurement is re-derived off pulseTick, not taken once. Titan One is a
	// self-hosted face that finishes loading *after* this screen is already up;
	// measuring once would bake in the fallback stack's metrics and leave the two
	// halves permanently mis-spaced. Re-deriving costs two measureText calls per
	// 32ms tick on a screen that exists for a few seconds, and it self-corrects
	// the moment the real face lands.
	// ONE SIZE FOR THE WHOLE TITLE.
	//
	// The accent word used to run a third larger, which was right when the title
	// was "GO BANANAS" plus a generation mark that had to be told apart from the
	// name. Here the name IS "GO BOOMANA" — two words of one thing — and setting
	// them at different sizes made "GO" read as a prefix stuck on the front.
	//
	// Raised from 46 rather than shrinking BOOMANA to match: the headline should
	// not get smaller just because the two halves agree.
	const TITLE_SIZE = 58;
	const ACCENT_SIZE = TITLE_SIZE;
	const TITLE_GAP = 20;

	// Colours. The first pass put a red blur under gold lettering, which is what
	// made the whole headline look soft: a coloured glow behind warm type on a warm
	// background has nothing to separate it from, so the edges just smear. Legibility
	// here comes from a hard DARK outline instead, and the glow is kept for the
	// accent word alone — where it is doing a job, because that is what has to jump.
	// ONE COLOUR FOR THE WHOLE TITLE.
	//
	// "GO" was light gold and "BOOMANA" hot orange, which read as two words from
	// two different logos rather than one name. The size step and the dark outline
	// already separate them; colour was doing a third job nobody asked for.
	//
	// The orange is the one the feature card's hero panel uses, so the title and
	// the card the player sees straight after it agree.
	const TITLE_FILL = 0xefeadc;
	const ACCENT_FILL = 0xefeadc;
	const OUTLINE = 0x1e1b1a;

	// The accent glow is GREEN, and the word it sits behind stays orange.
	//
	// It was orange on orange, which is the same mistake the red-under-gold first
	// pass made one step further along: a warm glow behind warm type on a warm
	// backdrop has nothing to separate it from, so it thickens the letters instead
	// of lighting them. Green is the one hue on this screen that is not already in
	// the backdrop, so it reads as light coming off the word rather than as more
	// word — and it is the game's own green, the beret and the visor.
	// NO COLOURED GLOW BEHIND THE ACCENT WORD.
	//
	// There were two passes at one: a red blur under gold lettering, then a green
	// halo. Both had the same problem — a coloured wash behind warm type on a warm
	// backdrop has nothing to separate it from, so it thickens the letters instead
	// of lighting them.
	//
	// What actually makes this word read is the hard dark outline and the size
	// step against the name beside it, and neither needs help. The drop shadow
	// below is plain black for depth, not colour.

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
		dropShadow: { color: 0xb87b60, alpha: 1, blur: 0, angle: Math.PI / 2, distance: 3 },
	};
	const accentStyle = {
		...titleStyle,
		fontSize: ACCENT_SIZE,
		fill: ACCENT_FILL,
		stroke: { color: OUTLINE, width: 7, join: 'round' as const },
		dropShadow: { color: 0xb87b60, alpha: 1, blur: 0, angle: Math.PI / 2, distance: 3 },
	};

	const titleMetrics = $derived.by(() => {
		pulseTick; // re-measure once the display face has loaded
		const name = CanvasTextMetrics.measureText(TITLE_MAIN, new TextStyle(titleStyle)).width;
		const accent = CanvasTextMetrics.measureText(TITLE_ACCENT, new TextStyle(accentStyle)).width;
		return { name, accent, total: name + TITLE_GAP + accent };
	});

	// the 16:9 plate fills the screen at its own aspect, cropped about the centre
	// (see Background.svelte) — sized straight to the layout it was squeezed in
	// portrait
	const bgCover = $derived(
		Math.max(context.stateLayoutDerived.mainLayout().width / 1920, context.stateLayoutDerived.mainLayout().height / 1080),
	);
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
			width={1920 * bgCover}
			height={1080 * bgCover}
		/>

		<!-- Dark overlay for readability -->
		<Graphics
			draw={(g) => {
				const w = context.stateLayoutDerived.mainLayout().width;
				const h = context.stateLayoutDerived.mainLayout().height;
				g.clear();
				g.beginFill(0x1e1b1a, 0.58);
				g.drawRect(0, 0, w, h);
				g.endFill();

				g.beginFill(0x1e1b1a, 0.22);
				g.drawRect(0, h * 0.72, w, h * 0.28);
				g.endFill();
			}}
		/>

		<!--
			NO WARM GLOW UNDER THE TITLE.
			
			There were two: a static ellipse at 0.28h and a breathing one at 0.34h
			that drifted sideways. Both were added when the backdrop was a flat
			brown rectangle and needed something to stop it reading as dead space.
			
			The backdrop is now the mine, and the mine brings its own light — the
			lantern hanging on the timber, warm and already off-centre. Two more
			warm pools laid over it fight it, exactly the way the jungle sun shafts
			fought the painted plates in Background.svelte, and exactly the way the
			coloured halo behind the accent word fought the letters it was meant to
			light. Same mistake, third place it turned up.
		-->

		<!--
			Title. Sits near the top rather than at 0.36 because the feature card
			that replaces the progress column needs the middle of the screen, and a
			headline that slides up as three panels fade in gives the eye two things
			to follow at once. It does not move between the two states.

			"100" sits on the same line in the same face, a third larger, in the hot
			orange the feature card's hero panel uses. Same colour in both places is
			the point — by the time the player reaches the card, that orange already
			means "the number that grows".

			Two earlier attempts are worth not repeating: a stacked brass plaque,
			which read as a badge bolted under the name rather than part of it; and
			matching its size to the name, which turned it into the title's last
			word. Size, a warmer hue and a glow of its own are what make it the
			thing being announced.
		-->
		<Container visible={!context.stateApp.loaded}
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
	Loading bar, house style (Hacksaw transcription §1, 2026-10-06): one thin
	bar under the title in the game's one accent on a black track, and nothing
	else — no percentage, no tips carousel, no strapline. The backdrop above is
	the base plate darkened, which is the same art as the cover.
	Hacksaw: 400x25 at 1920 wide, about 145px under the logo at 1080 high.
-->
<FadeContainer show={loadingType === 'start' && !context.stateApp.loaded}>
	<MainContainer>
		<Graphics
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.155 + Math.min(context.stateLayoutDerived.mainLayout().height * 0.134, 120)}
			draw={(g) => {
				const barWidth = Math.min(400, context.stateLayoutDerived.mainLayout().width * 0.6);
				const barHeight = Math.max(8, barWidth / 16);
				g.clear();
				g.rect(-barWidth / 2, -barHeight / 2, barWidth, barHeight);
				g.fill({ color: 0x000000, alpha: 1 });
				const fillWidth = (barWidth * animatedProgress) / 100;
				if (fillWidth > 0) {
					g.rect(-barWidth / 2, -barHeight / 2, fillWidth, barHeight);
					g.fill({ color: 0xb87b60, alpha: 1 });
				}
			}}
		/>
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
