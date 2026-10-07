<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container, Text } from 'pixi-svelte';


	// Brass numerals with a charcoal outline and restrained ivory highlight.
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
		// Optional display-family override for callouts.
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
			fill: props.stroke ?? 0x091713,
			stroke: props.stroke ?? 0x091713,
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
			fill: props.fill ?? [0xf7e9c6, 0xddbc77, 0xa58145],
			stroke: props.stroke ?? 0x14201d,
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
