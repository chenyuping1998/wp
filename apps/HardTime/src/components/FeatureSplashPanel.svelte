<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import PlateSlice from './PlateSlice.svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { BODY_FONT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import type { FeatureTier } from '../game/featureTiers';

	/**
	 * The panel that says WHAT feature just opened.
	 *
	 * Laid out against Hacksaw's Miami Mayhem feature splash, measured off the
	 * screenshot the user supplied (1421x808, the WE SPLIT card):
	 *
	 *   title            centred, y 0.136 of the height, and the largest thing
	 *   panel            x 0.32..0.70, y 0.208..0.780 — one tall panel, centred
	 *   header strip     inside the panel's top edge: "YOU WON 10 FREE SPINS"
	 *   body             centred, uppercase, wrapped, filling the panel
	 *   character        left edge, full height, NOT dimmed
	 *   click prompt     y 0.968
	 *
	 * The plate is light, as theirs is — a near-white card with a neon edge, dark
	 * type on it. It went that way after the dark-indigo version, and the reason is
	 * legibility as much as likeness: this is the one screen in the game carrying a
	 * paragraph a player is expected to actually READ, and it sits on a background
	 * darkened to 0.74. Dark text on a light card is the arrangement that has been
	 * winning that argument since print.
	 *
	 * The EDGE is the tier's own colour, not theirs, so three otherwise identical
	 * cards tell themselves apart before a word is read.
	 *
	 * The header strip is the piece that was missing before. Their card puts the
	 * spin count INSIDE the panel as its first line, not on a separate plaque
	 * floating above it — so the whole announcement is one object, and the title
	 * above it is free to be the feature's name rather than the words "free
	 * spins".
	 */
	type Props = {
		tier: FeatureTier;
		/** the panel's own centre line — it places itself around this */
		centerY: number;
		width: number;
		/** minimum height, so a short description still fills the card */
		minHeight: number;
		/** the header strip's text, already composed */
		header: string;
		/** applied to the header strip only — the count's slam rides on this */
		headerScale?: number;
		headerAlpha?: number;
	};

	const props: Props = $props();

	// the painted frame is ~60px of the plate's 512 — keep the copy inside the well
	const PAD = $derived(Math.max(props.width * 0.075, 104));
	const textWidth = $derived(props.width - PAD * 2);
	const bodySize = $derived(Math.max(14, Math.min(21, props.width * 0.038)));
	const headerSize = $derived(Math.max(16, Math.min(25, props.width * 0.041)));

	// Height is not measured from the rendered text: a Text's own height is only
	// known after it lays out, and reading it back to size the box behind it makes
	// the box arrive a frame late and pop. Four lines is what the longest `splash`
	// string wraps to at this width, and the panel is drawn for one more so a
	// longer one cannot overflow it.
	// A DARK plate with warm ink, not the light one.
	//
	// This was sampled off a reference game's plate art — a cool lavender-grey
	// with navy body copy — and the shape of that art (a card whose foot dissolves
	// instead of closing with an edge) is still worth having, which is why the
	// banding below is untouched. The COLOUR was not portable. Dropped into this
	// game it put the single brightest, coolest object on screen directly under a
	// gold Cinzel title, over a black-and-gold board, bordered in the Don tier's
	// signal red: the composite read as a browser error dialog rather than as the
	// game's own card. Everything else the player sees here — the title plaque,
	// the frames, the buy cards, the panels — is warm ink on near-black.
	const PLATE = 0x14100d;
	const INK = 0xf2e3bb;

	const LINE_HEIGHT = $derived(bodySize * 1.5);
	// measured off the wrapped body text, so the plate always holds the copy
	let bodyHeight = $state(0);
	const bodyLines = $derived(Math.max(4, Math.round(bodyHeight / LINE_HEIGHT)));
	const STRIP_HEIGHT = $derived(headerSize * 2.2);
	// the strip sits inside the plate's top rail (inner edge ~60px), not on it
	const STRIP_Y = $derived(58 + STRIP_HEIGHT * 0.65);
	const bodyY = $derived(STRIP_Y + STRIP_HEIGHT * 0.65 + 24);

	// The panel has TWO regions and the split matters.
	//
	//   solid   header strip and the paragraph. Nothing here fades, because the
	//           first version faded the plate from 55% of its height and the last
	//           line of body copy went with it — the text was legible for three
	//           lines and then dissolved.
	//   tail    below the last line, where plate and border melt into the scene.
	//           That dissolve is the thing worth copying from the reference; it
	//           just has to happen under the words rather than through them.
	const contentHeight = $derived(
		Math.max(props.minHeight, bodyY + LINE_HEIGHT * bodyLines + 78),
	);
	const TAIL = 0; // the painted plate has its own edge; no faded tail
	const panelHeight = $derived(contentHeight * (1 + TAIL));
</script>

<Container y={props.centerY - panelHeight / 2}>
	<!--
		2026-10-03: the card is the game's painted Buy Bonus plate (rusted steel
		rim, riveted), nine-sliced to this box, with the ticker plate as its header strip. It was pixi Graphics —
		a flat fill, forty alpha bands faking a fade and stacked strokes faking a
		neon tube — which is "gradient fills" from review's Low quality assets tag
		word for word. The tier still tells itself apart before a word is read: a
		bloom in its accent behind the plate, and the strip's rule in its accent.
	-->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		x={0}
		y={contentHeight / 2}
		tint={props.tier.accent}
		blendMode="add"
		width={props.width * 1.5}
		height={contentHeight * 1.5}
		alpha={0.32}
	/>
	<PlateSlice key="hmUiBuyBonus" border={104} x={-props.width / 2} y={0} width={props.width} height={contentHeight} />
	<PlateSlice
		key="hmUiTicker"
		border={60}
		centered
		x={0}
		y={STRIP_Y}
		width={props.width * 0.9}
		height={STRIP_HEIGHT * 1.3}
	/>
	<Graphics
		draw={(g: PixiGraphics) => {
			g.clear();
			const half = props.width * 0.3;
			g.moveTo(-half, STRIP_Y + STRIP_HEIGHT * 0.62);
			g.lineTo(half, STRIP_Y + STRIP_HEIGHT * 0.62);
			g.stroke({ width: 3, color: props.tier.accent, alpha: 0.9 });
		}}
	/>

	<Container y={STRIP_Y} scale={props.headerScale ?? 1} alpha={props.headerAlpha ?? 1}>
		<Text
			anchor={0.5}
			text={props.header}
			style={{
				fontFamily: DISPLAY_FONT,
				fontWeight: DISPLAY_FONT_WEIGHT,
				fontSize: headerSize,
				letterSpacing: 2.5,
				fill: 0xf0d6b0,
				stroke: { color: 0x14100d, width: 5 },
				dropShadow: { color: 0x000000, blur: 4, distance: 2, angle: Math.PI / 6, alpha: 1 },
			}}
		/>
	</Container>

	<!--
		Body copy in the BODY face, not the display face. Titan One is a heavy
		rounded display type and this is a real paragraph — the same split the rules
		and paytable modals already make, and the same one the reference makes by
		dropping from its 50px feature title to a 30px feature body.
	-->
	<Text
		anchor={{ x: 0.5, y: 0 }}
		y={bodyY}
		text={props.tier.splash}
		onresize={(sizes) => (bodyHeight = sizes.height)}
		style={{
			fontFamily: BODY_FONT,
			fontWeight: '600',
			fontSize: bodySize,
			letterSpacing: 1.2,
			lineHeight: LINE_HEIGHT,
			align: 'center',
			wordWrap: true,
			wordWrapWidth: textWidth,
			fill: INK,
		}}
	/>
</Container>
