<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// The multiplier is printed on the blank order slip.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();
	const value = $derived(String(props.prize));
	const art = SYMBOL_SIZE * 0.88;
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Container x={0} y={-art * 0.08} rotation={-0.16}>
		<Text
			text={value}
			y={-art * 0.08}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: value.length > 2 ? 24 : 32, fontWeight: '700', fill: 0x1b1b1b, stroke: { color: 0xfff7e7, width: 2, join: 'round' } }}
		/>
		<Text
			text="×"
			y={art * 0.09}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: 23, fontWeight: '700', fill: 0xc7251d, stroke: { color: 0xfff7e7, width: 1.5, join: 'round' } }}
		/>
	</Container>
</Container>
