<script lang="ts">
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
	};

	const props: Props = $props();

	let measuredWidth = $state(0);
	const fitScale = $derived(
		props.maxWidth && measuredWidth > props.maxWidth ? props.maxWidth / measuredWidth : 1,
	);
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={fitScale} alpha={props.alpha ?? 1}>
	<Text
		anchor={props.anchor ?? 0.5}
		text={String(props.text)}
		onresize={(sizes) => (measuredWidth = sizes.width)}
		style={{
			fontFamily: 'proxima-nova, Arial, sans-serif',
			fontSize: props.fontSize,
			fontWeight: '900',
			letterSpacing: props.letterSpacing ?? 1,
			fill: [0xfff3bd, 0xffd75e, 0xc9821a],
			stroke: 0x54330a,
			strokeThickness: Math.max(2, props.fontSize * 0.1),
			dropShadow: true,
			dropShadowColor: 0x000000,
			dropShadowBlur: Math.max(4, props.fontSize * 0.12),
			dropShadowDistance: Math.max(1.5, props.fontSize * 0.045),
		}}
	/>
</Container>
