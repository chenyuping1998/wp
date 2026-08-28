<script lang="ts">
	import { Container, Rectangle, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import frameGeometry from '../game/frameGeometry';

	const context = getContext();
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	let clock = $state(0);

	// ── slow ken-burns drift over a small overscan, so the still backdrop
	// breathes instead of sitting dead behind the reels ────────────────────────
	const OVERSCAN = 1.08;
	// The backdrop's own proportions. It is COVER-fitted to the canvas rather than
	// stretched to it.
	//
	// It used to be stretched - width and height set straight from the canvas -
	// and that was invisible for as long as the art happened to match: the supplied
	// scenes are 1376x768, which is 1.79:1, and a desktop canvas is about 1.78:1.
	// Cropping the painted side columns off changed the art's proportions, and a
	// stretch would then have pulled the courtyard wide - the moon an ellipse, the
	// bricks rectangles.
	//
	// MEASURED, not written down. This was `1060 / 768` as a literal, and the very
	// next change to the crop made it wrong: the columns' gilt brackets survived
	// the first cut, the crop widened to take them, and the art became 950 wide
	// while this still said 1060. design/import_scene.mjs writes the number into
	// frameGeometry now, from the file it just wrote.
	const BACKDROP_ASPECT = frameGeometry.backdropAspect;
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// cover: whichever axis needs more scaling decides, the other overflows
		const scale = Math.max(width / BACKDROP_ASPECT / height, 1) * OVERSCAN;
		const h = height * scale;
		const w = h * BACKDROP_ASPECT;
		// Drift over whatever slack the cover left, plus the overscan's own. A
		// wide canvas has horizontal slack to spare and almost none vertically,
		// so the drift is measured per axis rather than assumed symmetric.
		const slackX = Math.max(0, w - width);
		const slackY = Math.max(0, h - height);
		return {
			width: w,
			height: h,
			x: -slackX * 0.5 + Math.sin(clock * 0.06) * slackX * 0.5,
			y: -slackY * 0.5 + Math.sin(clock * 0.041 + 1.1) * slackY * 0.5,
		};
	});

	// ── floating bokeh: screen dust drifting up with a gentle sway.
	// Soft textured motes (fxGlow), never hard vector circles ──────────────────
	// Embers and incense ash lifting off the altar, warm against the night.
	//
	// These were terminal phosphor - two greens and a teal - and they survived
	// this long because the backdrop was blurred and they were nearly invisible.
	// With the blur gone they are 22 drifting lights the player can actually see,
	// so they have to be the game's own: candle, brass, and the pale gold the
	// frame's fittings catch.
	const MOTE_COLORS = [0xffcb6b, 0xd9a85c, 0xfff0c4, 0xa8763e];
	const motes = Array.from({ length: 22 }, (_, i) => ({
		seedX: Math.random(),
		seedY: Math.random(),
		size: 12 + Math.random() * 46,
		colorIndex: i % 4,
		phase: Math.random() * Math.PI * 2,
		riseSpeed: 0.012 + Math.random() * 0.022,
		swayAmp: 18 + Math.random() * 46,
		alpha: 0.1 + Math.random() * 0.22,
	}));

	const moteState = (mote: (typeof motes)[number]) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		// wrap upward: y walks from below the canvas to above it, then repeats
		const progress = (mote.seedY + clock * mote.riseSpeed) % 1;
		return {
			x: mote.seedX * width + Math.sin(clock * 0.7 + mote.phase) * mote.swayAmp,
			y: height * (1.05 - progress * 1.15),
			// fade in and out at the ends of the run so nothing pops
			alpha: mote.alpha * Math.sin(progress * Math.PI) ** 0.6,
		};
	};

	// No light beams over the top of the scene.
	//
	// drawSoftBeams drew two wide translucent wedges sweeping down from the top
	// edge - a god-ray, added when the backdrop was a flat generated gradient and
	// needed something happening in it. The backdrop is a painted night scene now,
	// with its own moon and its own sky, and a pale wedge laid over that reads as a
	// smear on the lens. The scene is already lit; it does not need lighting again.

	onMount(() => {
		const id = setInterval(() => {
				clock += 0.016;
		}, 16);
		return () => clearInterval(id);
	});
</script>

<!--
	Layering, and it matters: this container has sortableChildren, so zIndex is
	respected and the backdrop sprites are OPAQUE and cover the whole canvas.
	Anything given a lower zIndex than them is not dimmed, it is invisible.

	The ticker is NOT in here. Everything in this component is drawn through a
	blur filter (removed - see Game.svelte) so the reels read as the subject, and
	the ticker is meant to be legible - it renders as its own layer above the
	vignette instead.
-->
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x060b09} zIndex={-4} />

<!-- the still room, base game -->
<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-3}>
	<Sprite key="mcBgBase" {...parallax} />
</FadeContainer>

<!-- the still room, feature game -->
<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-3}>
	<Sprite key="mcBgFeature" {...parallax} />
</FadeContainer>

<!-- ambient bokeh drifting in front of whichever scene is showing -->
<Container zIndex={-1}>
	{#each motes as mote, index (index)}
		{@const state = moteState(mote)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={state.x}
			y={state.y}
			tint={MOTE_COLORS[mote.colorIndex]}
			blendMode="add"
			width={mote.size}
			height={mote.size}
			alpha={state.alpha}
		/>
	{/each}
</Container>
