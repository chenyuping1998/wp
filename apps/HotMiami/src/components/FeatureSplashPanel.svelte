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
		/** panel top */
		y: number;
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
	// Near-white rather than pure white: at 0.95 over a 0.74-black background a
	// pure white plate is the brightest thing on screen by a distance and pulls the
	// eye off the title above it.
	const PLATE = 0xf4eef8;
	const INK = 0x1c0b3a;

	const LINE_HEIGHT = $derived(bodySize * 1.5);
	const STRIP_HEIGHT = $derived(headerSize * 2.2);
	const bodyY = $derived(STRIP_HEIGHT + PAD * 0.9);
	const panelHeight = $derived(
		Math.max(props.minHeight, bodyY + LINE_HEIGHT * 4 + PAD),
	);
</script>

<Container y={props.y}>
	<Graphics
		draw={(g: PixiGraphics) => {
			const w = props.width;
			const h = panelHeight;
			const a = props.tier.accent;
			g.clear();

			// ── the edge, drawn as a TUBE rather than as a line ──────────────────
			//
			// The reference's card is bordered by a neon tube: a bright core with
			// light bleeding outward from it, not a 5px stroke. A stroke is what we
			// had, and it is the single biggest reason the card read as flat — the
			// rest of this game is neon and the one panel with a paragraph on it was
			// drawn like a dialog box.
			//
			// Four passes, widest and faintest first, so the falloff is drawn rather
			// than blurred. Cheaper than a filter and it survives any panel size.
			for (const [width, alpha] of [
				[26, 0.1],
				[16, 0.16],
				[9, 0.3],
			] as const) {
				g.roundRect(-w / 2, 0, w, h, 22);
				g.stroke({ width, color: a, alpha });
			}

			// the plate
			g.roundRect(-w / 2, 0, w, h, 22);
			g.fill({ color: PLATE, alpha: 0.96 });

			// A cooler wash across the lower half. Their plate is not one flat tone —
			// it is brightest at the top, under the header, and cools toward the
			// bottom. Two stacked rects at low alpha do it without a gradient fill.
			g.roundRect(-w / 2 + 2, h * 0.42, w - 4, h * 0.58 - 2, 20);
			g.fill({ color: 0xcbd0e8, alpha: 0.28 });
			g.roundRect(-w / 2 + 2, h * 0.7, w - 4, h * 0.3 - 2, 20);
			g.fill({ color: 0xb9bede, alpha: 0.22 });

			// the core of the tube, over the plate's own edge
			g.roundRect(-w / 2, 0, w, h, 22);
			g.stroke({ width: 4.5, color: a, alpha: 1 });
			// a white hairline just inside it: what makes a neon tube read as glass
			g.roundRect(-w / 2 + 4, 4, w - 8, h - 8, 18);
			g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.75 });

			// ── the header strip ─────────────────────────────────────────────────
			g.roundRect(-w / 2 + 7, 7, w - 14, STRIP_HEIGHT, 16);
			g.fill({ color: a, alpha: 0.3 });
			g.roundRect(-w / 2 + 7, 7, w - 14, STRIP_HEIGHT * 0.55, 16);
			g.fill({ color: 0xffffff, alpha: 0.28 });
			g.moveTo(-w / 2 + 18, 7 + STRIP_HEIGHT);
			g.lineTo(w / 2 - 18, 7 + STRIP_HEIGHT);
			g.stroke({ width: 2.5, color: a, alpha: 0.9 });
			g.moveTo(-w / 2 + 18, 9.5 + STRIP_HEIGHT);
			g.lineTo(w / 2 - 18, 9.5 + STRIP_HEIGHT);
			g.stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
		}}
	/>

	<Container y={6 + STRIP_HEIGHT * 0.5} scale={props.headerScale ?? 1} alpha={props.headerAlpha ?? 1}>
		<Text
			anchor={0.5}
			text={props.header}
			style={{
				fontFamily: DISPLAY_FONT,
				fontWeight: DISPLAY_FONT_WEIGHT,
				fontSize: headerSize,
				letterSpacing: 2.5,
				// White with a hard dark outline, as the reference's header line is —
				// the strip is tinted, so dark-on-light stops working there even though
				// it is right for the paragraph below.
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
