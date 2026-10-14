<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import { NUMBER_FONT } from '../game/fonts';
	type Props = {
		text: string | number; fontSize: number;
		role?: 'count' | 'fs' | 'plate' | 'receipt';
		x?: number; y?: number; maxWidth?: number;
		anchor?: number | { x: number; y: number };
		fill?: number;
		onresize?: (sizes: { width: number; height: number }) => void;
	};
	const props: Props = $props();
	const style = $derived(new TextStyle({ fontFamily: NUMBER_FONT, fontSize: props.fontSize, fill: props.fill ?? 0x171c1a }));
	const measured = $derived(CanvasTextMetrics.measureText(String(props.text), style));
	const fit = $derived(Math.min(1, (props.maxWidth ?? Infinity) / Math.max(1, measured.width)));
	$effect(() => { props.onresize?.({ width: measured.width, height: measured.height }); });
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={fit}>
	<Text text={String(props.text)} anchor={props.anchor ?? 0.5} {style} />
</Container>
