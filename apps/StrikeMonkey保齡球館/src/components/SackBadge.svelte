<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// The pin's cream belly label is below the sprite centre. Keep both lines
	// inside that label so the pin silhouette and red neck remain readable.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();
	const value = $derived(String(props.prize));
	const labelY = SYMBOL_SIZE * 0.88 * (335 - 256) / 512;
	const valueSize = $derived(value.length > 2 ? 16 : 20);
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Container y={labelY}>
		<Text
			text={`${value}x`}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: valueSize, fontWeight: '400', fill: 0x8f2b16 }}
		/>
	</Container>
</Container>
