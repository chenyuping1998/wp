<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
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

	const PAD = $derived(props.width * 0.075);
	const textWidth = $derived(props.width - PAD * 2);
	const bodySize = $derived(Math.max(14, Math.min(21, props.width * 0.038)));
	const headerSize = $derived(Math.max(17, Math.min(27, props.width * 0.048)));

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
	const STRIP_HEIGHT = $derived(headerSize * 2.2);
	const bodyY = $derived(STRIP_HEIGHT + PAD * 0.9);

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
		Math.max(props.minHeight, bodyY + LINE_HEIGHT * 4 + PAD * 0.8),
	);
	const TAIL = 0.42; // the fade zone, as a fraction of the solid part
	const panelHeight = $derived(contentHeight * (1 + TAIL));
</script>

<Container y={props.centerY - panelHeight / 2}>
	<Graphics
		draw={(g: PixiGraphics) => {
			const w = props.width;
			const h = panelHeight;
			const a = props.tier.accent;
			g.clear();

			// ── the plate: solid where the words are, dissolving below them ──────
			//
			// The reference's plate art is not a closed box. Its top corners are
			// rounded and its edge is a neon tube, but the bottom third dissolves —
			// plate and border both — so the card melts into the scene instead of
			// sitting on it in a rectangle. That, not the colour, is why theirs
			// "suits the background" and a hard-edged rounded rect does not.
			//
			// The solid part is ONE rect, not bands. Banding the whole plate left
			// visible horizontal seams straight across the paragraph: 48 slices at
			// 48 slightly different alphas, overlapping by a pixel, is 48 darker
			// lines. Only the tail needs banding, and there are no words in it.
			const solid = contentHeight;
			g.roundRect(-w / 2, 0, w, solid, 20);
			g.fill({ color: PLATE, alpha: 0.94 });
			// square off the solid part's own bottom corners — roundRect rounds all
			// four, and the two at the foot showed as a pair of little arcs sitting
			// in the middle of the plate where the tail takes over
			g.rect(-w / 2, solid - 26, w, 27);
			g.fill({ color: PLATE, alpha: 0.94 });

			const BANDS = 40;
			const bandH = (h - solid) / BANDS;
			for (let i = 0; i < BANDS; i += 1) {
				const fade = 1 - (i + 1) / BANDS;
				const alpha = 0.94 * fade * fade;
				if (alpha < 0.008) continue;
				g.rect(-w / 2, solid + i * bandH, w, bandH + 0.75);
				g.fill({ color: PLATE, alpha });
			}

			// ── the neon tube: top, left and right, fading with the plate ─────────
			//
			// Four passes per segment, widest and faintest first, so the falloff is
			// drawn rather than blurred — the same trick the board frame uses.
			const TUBE = [
				[24, 0.1],
				[14, 0.17],
				[8, 0.32],
				[4, 1],
			] as const;
			for (const [width, alpha] of TUBE) {
				// the top, with its two corners
				g.moveTo(-w / 2, 40);
				g.arcTo(-w / 2, 0, -w / 2 + 40, 0, 20);
				g.lineTo(w / 2 - 40, 0);
				g.arcTo(w / 2, 0, w / 2, 40, 20);
				g.stroke({ width, color: a, alpha });
			}
			// the two verticals, in segments that fade out over the tail
			const SEGS = 30;
			for (let i = 0; i < SEGS; i += 1) {
				const y0 = 30 + (h - 30) * (i / SEGS);
				const y1 = 30 + (h - 30) * ((i + 1) / SEGS);
				const fade = y1 <= solid ? 1 : Math.max(0, 1 - (y1 - solid) / (h - solid));
				if (fade < 0.02) continue;
				for (const [width, alpha] of TUBE) {
					g.moveTo(-w / 2, y0);
					g.lineTo(-w / 2, y1);
					g.moveTo(w / 2, y0);
					g.lineTo(w / 2, y1);
					g.stroke({ width, color: a, alpha: alpha * fade * fade });
				}
			}

			// ── the header strip ─────────────────────────────────────────────────
			// Theirs is a slightly DARKER band than the plate with a hard dark rule
			// under it — the opposite of the tinted, glossy band this had, which was
			// invented rather than looked at.
			g.roundRect(-w / 2 + 5, 5, w - 10, STRIP_HEIGHT, 16);
			g.fill({ color: 0x241d14, alpha: 0.96 });
			g.moveTo(-w / 2 + 5, 5 + STRIP_HEIGHT);
			g.lineTo(w / 2 - 5, 5 + STRIP_HEIGHT);
			g.stroke({ width: 3, color: 0x8a6d1f, alpha: 0.85 });
		}}
	/>

	<Container y={5 + STRIP_HEIGHT * 0.5} scale={props.headerScale ?? 1} alpha={props.headerAlpha ?? 1}>
		<Text
			anchor={0.5}
			text={props.header}
			style={{
				fontFamily: DISPLAY_FONT,
				fontWeight: DISPLAY_FONT_WEIGHT,
				fontSize: headerSize,
				letterSpacing: 2.5,
				fill: 0xffffff,
				stroke: INK,
				strokeThickness: 5,
				dropShadow: true,
				dropShadowColor: 0x000000,
				dropShadowBlur: 4,
				dropShadowDistance: 2,
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
