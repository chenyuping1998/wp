<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import type { TextStyleFontWeight } from 'pixi.js';
	import { Container, Text } from 'pixi-svelte';
	import { trackingFor } from '../game/i18nText';

	// The game's numerals and short labels, in two finishes:
	//
	//   'gold' (default)  for dark grounds — the bet-strip brown, the dark plate
	//                     fields, the board. Bone → ochre ramp (ART_REQUEST §0:
	//                     #f1ead8 bone, #c8973a ochre), sepia ink edge. Gold LEAF
	//                     (#f4c542) stays reserved for WILD / success / fireball.
	//   'ink'             for the parchment fields (title plate, FG card, Buy
	//                     plate): sepia ink #3b2a1a with at most a thin bone edge
	//                     (house rule E2 — never ink letters under a thick ink
	//                     stroke, the counters fill in).
	//
	// Canvas Text, so every script renders (CJK/Arabic/Devanagari).
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
		variant?: 'gold' | 'ink';
		// override the face colour (a flat colour or a vertical ramp)
		fill?: number | number[];
		stroke?: number;
		fontFamily?: string;
		fontWeight?: TextStyleFontWeight;
	};

	const props: Props = $props();

	let measuredWidth = $state(0);
	const fitScale = $derived(
		props.maxWidth && measuredWidth > props.maxWidth ? props.maxWidth / measuredWidth : 1,
	);
	const ink = $derived(props.variant === 'ink');
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={fitScale} alpha={props.alpha ?? 1}>
	{@const base = {
		fontFamily: props.fontFamily ?? GAME_FONT,
		fontSize: props.fontSize,
		fontWeight: props.fontWeight ?? GAME_FONT_WEIGHT,
		// letter-spacing makes canvas draw glyph by glyph: Arabic reverses and
		// unjoins, Devanagari loses its joins, CJK just gaps — off for those.
		letterSpacing: trackingFor(props.letterSpacing ?? 1),
	}}
	{#if ink}
		<!-- sepia on parchment: flat ink, a thin bone edge, a hard 1-step offset
		     in ochre for weight (no blur — blur on paper reads as a smudge) -->
		<Text
			anchor={props.anchor ?? 0.5}
			x={Math.max(1, props.fontSize * 0.04)}
			y={Math.max(1, props.fontSize * 0.05)}
			text={String(props.text)}
			style={{ ...base, fill: props.stroke ?? 0xc8973a }}
			alpha={0.55}
		/>
		<Text
			anchor={props.anchor ?? 0.5}
			text={String(props.text)}
			onresize={(sizes) => (measuredWidth = sizes.width)}
			style={{
				...base,
				fill: props.fill ?? 0x3b2a1a,
				stroke: { color: 0xf1ead8, width: Math.max(1, props.fontSize * 0.06) },
			}}
		/>
	{:else}
		{@const bevel = Math.max(1, props.fontSize * 0.05)}
		<!-- 1. cast shadow, 2. the ramp with its ink edge, 3. a sheen clipped high -->
		<Text
			anchor={props.anchor ?? 0.5}
			y={bevel}
			text={String(props.text)}
			style={{
				...base,
				fill: props.stroke ?? 0x2a1d12,
				stroke: { color: props.stroke ?? 0x2a1d12, width: Math.max(2, props.fontSize * 0.12) },
			}}
			alpha={0.85}
		/>
		<Text
			anchor={props.anchor ?? 0.5}
			text={String(props.text)}
			onresize={(sizes) => (measuredWidth = sizes.width)}
			style={{
				...base,
				fill: props.fill ?? [0xf6ecd2, 0xe2b866, 0xc8973a],
				stroke: { color: props.stroke ?? 0x3b2a1a, width: Math.max(2, props.fontSize * 0.09) },
				dropShadow: { color: 0x1a120a, blur: Math.max(3, props.fontSize * 0.1), distance: Math.max(1.5, props.fontSize * 0.04), angle: Math.PI / 6, alpha: 0.9 },
			}}
		/>
		<Text
			anchor={props.anchor ?? 0.5}
			y={-bevel * 0.55}
			text={String(props.text)}
			style={{ ...base, fill: [0xffffff, 0xfff6dc, 0xfff6dc], stroke: { color: 0x000000, width: 0 } }}
			alpha={0.25}
		/>
	{/if}
</Container>
