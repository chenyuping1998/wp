<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// Print the value in the record's cream centre label.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();
	const value = $derived(String(props.prize));
	const art = SYMBOL_SIZE * 0.88;
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Container x={art * 0.045} y={art * 0.035}>
		<Text
			text={value}
			y={-art * 0.095}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: value.length > 2 ? 22 : 30, fontWeight: '700', fill: 0x8f171c, stroke: { color: 0xfff2d8, width: 1.75, join: 'round' } }}
		/>
		<Text
			text="×"
			y={art * 0.035}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: 19, fontWeight: '700', fill: 0x8f171c, stroke: { color: 0xfff2d8, width: 1.25, join: 'round' } }}
		/>
	</Container>
</Container>
