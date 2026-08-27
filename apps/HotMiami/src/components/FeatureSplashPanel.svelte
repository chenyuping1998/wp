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
	 * What is copied is that arrangement. Their panel is a light plate with a pink
	 * neon edge; ours stays in this game's own palette, edged in the TIER'S colour
	 * so three otherwise identical cards tell themselves apart before a word is
	 * read.
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
			g.clear();
			g.roundRect(-w / 2, 0, w, h, 20);
			g.fill({ color: 0x140a30, alpha: 0.9 });
			g.stroke({ width: 4, color: props.tier.accent, alpha: 0.95 });
			// the header strip: a band across the panel's top in the tier's colour,
			// which is where their card puts the spin count
			g.roundRect(-w / 2 + 6, 6, w - 12, STRIP_HEIGHT, 14);
			g.fill({ color: props.tier.accent, alpha: 0.16 });
			g.moveTo(-w / 2 + 16, 6 + STRIP_HEIGHT);
			g.lineTo(w / 2 - 16, 6 + STRIP_HEIGHT);
			g.stroke({ width: 1.5, color: props.tier.accent, alpha: 0.55 });
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
				letterSpacing: 2,
				fill: 0xfff4ff,
				stroke: 0x1a0838,
				strokeThickness: 4,
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
			fill: 0xffe6f7,
			stroke: 0x1a0838,
			strokeThickness: 3,
		}}
	/>
</Container>
