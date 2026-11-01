<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { Container, Text } from 'pixi-svelte';
	import type { TextStyleFontWeight } from 'pixi.js';


	// Flat ink figures: one readable face, one hard keyline, no bevel or glow.
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
		fill?: number;
		stroke?: number;
		// Opt in to Orbitron (DISPLAY_FONT). Titan One stays the default because
		// its digits are the legible ones at bet-bar size — see game/fonts.ts —
		// but a big-win amount is a display callout, not a readout, and it is
		// exactly the kind of place fonts.ts reserves for the display face.
		fontFamily?: string;
		fontWeight?: TextStyleFontWeight;
	};

	const props: Props = $props();

	let measuredWidth = $state(0);
	const fitScale = $derived(
		props.maxWidth && measuredWidth > props.maxWidth ? props.maxWidth / measuredWidth : 1,
	);
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={fitScale} alpha={props.alpha ?? 1}>
 <Text anchor={props.anchor ?? 0.5} text={String(props.text)}
  onresize={(bounds) => (measuredWidth = bounds.width)}
  style={{fontFamily: props.fontFamily ?? GAME_FONT, fontSize: props.fontSize,
    fontWeight: props.fontWeight ?? GAME_FONT_WEIGHT, letterSpacing: props.letterSpacing ?? 1,
    fill: props.fill ?? 0xffc38a, stroke: {color: props.stroke ?? 0x121212, width: Math.max(2, props.fontSize * 0.07)}}} />
</Container>
