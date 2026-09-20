<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container, Text } from 'pixi-svelte';


	// House numerals/labels (replaces the MM template 'gold' bitmap font): warm
	// gradient face, dark stroke, soft drop shadow. Being a canvas Text it
	// renders every script (CJK/Arabic/Devanagari), unlike the old latin-only
	// bitmap font.
	//
	// The ramp is the Miami one, not GoBananas' brass. Gold itself is deliberate
	// and stays — it is the money colour, and it is what uiTheme already uses for
	// balanceLabelFill/buyBonusLabelFill and what Searchlights sets its multipliers
	// in. What was inherited and is now gone is the BROWN either side of it: the
	// bottom gradient stop 0xc9821a (bronze) and the two strokes 0x3a2205 /
	// 0x54330a (dark brown), which are jungle-commando leather, not neon. The
	// ramp now runs cream → gold → hot pink, the same three stops the modal
	// headings already ship (255,233,138 → 255,215,94 → 255,142,222), over the
	// deep-plum stroke Searchlights uses.
	//
	// No call site passes `fill` or `stroke` except Symbol.svelte's superspin
	// coin grading, so these defaults are every number a player reads.
	type Props = {
		text: string | number;
		fontSize: number;
		x?: number;
		y?: number;
		anchor?: number | { x: number; y: number };
		// scale down uniformly if the rendered width exceeds this
		maxWidth?: number;
		letterSpacing?: number;
		alpha?: number;
		// override the gold gradient — used to grade high-value superspin coins
		// into a hotter amber so they read apart from the common ones
		fill?: number | number[];
		stroke?: number;
		// Opt in to Orbitron (DISPLAY_FONT). Titan One stays the default because
		// its digits are the legible ones at bet-bar size — see game/fonts.ts —
		// but a big-win amount is a display callout, not a readout, and it is
		// exactly the kind of place fonts.ts reserves for the display face.
		fontFamily?: string;
		fontWeight?: string;
	};

	const props: Props = $props();

	let measuredWidth = $state(0);
	const fitScale = $derived(
		props.maxWidth && measuredWidth > props.maxWidth ? props.maxWidth / measuredWidth : 1,
	);
</script>

<!--
	Three stacked passes instead of one gradient-filled Text. A single gradient
	fill with a stroke is exactly the "gradient fill" look flagged in review; a
	bevel needs light and shade on opposite sides of the same glyph, which one
	Text node cannot express.

	  1. shadow pass  offset down, dark, no fill gradient — the cast shadow
	  2. body pass    the gold gradient and the outline (the readable layer)
	  3. sheen pass   offset up by a hair, clipped to the top of the glyph by a
	                  short gradient, so the letter looks lit from above

	The font is unchanged; this is purely how it is rendered.
-->
<Container x={props.x ?? 0} y={props.y ?? 0} scale={fitScale} alpha={props.alpha ?? 1}>
	{@const bevel = Math.max(1, props.fontSize * 0.05)}
	{@const base = {
		fontFamily: props.fontFamily ?? GAME_FONT,
		fontSize: props.fontSize,
		fontWeight: props.fontWeight ?? GAME_FONT_WEIGHT,
		letterSpacing: props.letterSpacing ?? 1,
	}}

	<Text
		anchor={props.anchor ?? 0.5}
		y={bevel}
		text={String(props.text)}
		style={{
			...base,
			fill: props.stroke ?? 0x14100D,
			stroke: props.stroke ?? 0x14100D,
			strokeThickness: Math.max(2, props.fontSize * 0.13),
		}}
		alpha={0.85}
	/>

	<Text
		anchor={props.anchor ?? 0.5}
		text={String(props.text)}
		onresize={(sizes) => (measuredWidth = sizes.width)}
		style={{
			...base,
			fill: props.fill ?? [0xE8D48B, 0xC9A227, 0x8A6D1F],
			stroke: props.stroke ?? 0x1a1206,
			strokeThickness: Math.max(2, props.fontSize * 0.1),
			dropShadow: true,
			dropShadowColor: 0x000000,
			dropShadowBlur: Math.max(4, props.fontSize * 0.12),
			dropShadowDistance: Math.max(1.5, props.fontSize * 0.045),
		}}
	/>

	<Text
		anchor={props.anchor ?? 0.5}
		y={-bevel * 0.55}
		text={String(props.text)}
		style={{
			...base,
			fill: [0xffffff, 0xfff3bd, 0xfff3bd],
			stroke: 0x000000,
			strokeThickness: 0,
		}}
		alpha={0.3}
	/>
</Container>
