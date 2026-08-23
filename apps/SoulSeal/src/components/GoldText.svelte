<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container, Text } from 'pixi-svelte';

	// House gold numerals/labels (replaces the MM template 'gold' bitmap font):
	// warm gradient face, dark bronze stroke, soft drop shadow. Being a canvas
	// Text it renders every script (CJK/Arabic/Devanagari), unlike the old
	// latin-only bitmap font.
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
		// override the gold gradient — used to grade a high multiplier value into a
		// hotter tint so it reads apart from the common ones
		fill?: number | number[];
		stroke?: number;
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
		fontFamily: GAME_FONT,
		fontSize: props.fontSize,
		fontWeight: GAME_FONT_WEIGHT,
		letterSpacing: props.letterSpacing ?? 1,
	}}

	<Text
		anchor={props.anchor ?? 0.5}
		y={bevel}
		text={String(props.text)}
		style={{
			...base,
			fill: props.stroke ?? 0x3a2205,
			stroke: { color: props.stroke ?? 0x3a2205, width: Math.max(2, props.fontSize * 0.13) },
		}}
		alpha={0.85}
	/>

	<Text
		anchor={props.anchor ?? 0.5}
		text={String(props.text)}
		onresize={(sizes) => (measuredWidth = sizes.width)}
		style={{
			...base,
			fill: props.fill ?? [0xfff3bd, 0xffd75e, 0xc9821a],
			stroke: { color: props.stroke ?? 0x54330a, width: Math.max(2, props.fontSize * 0.1) },
			// Pixi v8 takes the shadow as an OBJECT. Written the v7 way -
			// `dropShadow: true` with three sibling dropShadow* keys - it is not an
			// error, it is silently nothing: the flag is read, the settings are not,
			// and the text ships with no shadow at all. Same shape of fault as the
			// stroke above and as the uncommitted Graphics paths elsewhere in this
			// project: an API that accepts the old spelling and draws none of it.
			dropShadow: {
				color: 0x000000,
				blur: Math.max(4, props.fontSize * 0.12),
				distance: Math.max(1.5, props.fontSize * 0.045),
				angle: Math.PI / 2,
				alpha: 0.75,
			},
		}}
	/>

	<Text
		anchor={props.anchor ?? 0.5}
		y={-bevel * 0.55}
		text={String(props.text)}
		style={{
			...base,
			fill: [0xffffff, 0xfff3bd, 0xfff3bd],
			stroke: { color: 0x000000, width: 0 },
		}}
		alpha={0.3}
	/>
</Container>
