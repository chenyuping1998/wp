<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';

	// Kept under its old component name while the game is reskinned. The actual
	// type is now one flat screenprint ink, with no gold, bevel or soft shadow.
	type Props = {
		text: string | number;
		fontSize: number;
		x?: number;
		y?: number;
		anchor?: number | { x: number; y: number };
		maxWidth?: number;
		letterSpacing?: number;
		alpha?: number;
		fill?: number | number[];
		stroke?: number;
	};
	const props: Props = $props();
	let measuredWidth = $state(0);
	const fitScale = $derived(props.maxWidth && measuredWidth > props.maxWidth ? props.maxWidth / measuredWidth : 1);
</script>

<!--
	Paper type on a hard ink keyline, over a red plate printed a step down-right
	(the poster's off-register second pass). The keyline used to be 7% of the
	size, which over the board's paper cells left cream type on cream: a small
	win read as a ghost. The heavier rim and the red plate carry it on any
	ground — paper cells, green housing, red symbols.
-->
<Container x={props.x ?? 0} y={props.y ?? 0} scale={fitScale} alpha={props.alpha ?? 1}>
	<Text
		anchor={props.anchor ?? 0.5}
		x={props.fontSize * 0.06}
		y={props.fontSize * 0.06}
		text={String(props.text)}
		style={{
			fontFamily: NUMBER_FONT,
			fontSize: props.fontSize,
			fontWeight: '400',
			letterSpacing: props.letterSpacing ?? 1,
			fill: 0xd24a2c,
			stroke: 0x1e1b1a,
			strokeThickness: Math.max(2, props.fontSize * 0.14),
		}}
	/>
	<Text
		anchor={props.anchor ?? 0.5}
		text={String(props.text)}
		onresize={(sizes) => (measuredWidth = sizes.width)}
		style={{
			fontFamily: NUMBER_FONT,
			fontSize: props.fontSize,
			fontWeight: '400',
			letterSpacing: props.letterSpacing ?? 1,
			fill: 0xf2e8d0,
			stroke: 0x1e1b1a,
			strokeThickness: Math.max(2, props.fontSize * 0.14),
		}}
	/>
</Container>
