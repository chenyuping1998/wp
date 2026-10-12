<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// The cup has an ivory medallion reserved for its value.
	// Coordinates are relative to the centre of the 0.88-sized prize art.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();
	const label = $derived(`${props.prize}×`);
	const offsetY = SYMBOL_SIZE * 0.88 * 0.06;
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Text
		text={label}
		x={0}
		y={offsetY}
		anchor={0.5}
		style={{
			fontFamily: NUMBER_FONT,
			fontSize: label.length > 3 ? 23 : label.length > 2 ? 29 : 36,
			fontWeight: '700',
			fill: 0x203d36,
			stroke: { color: 0xf7f4e8, width: 2.5, join: 'round' },
		}}
	/>
</Container>
