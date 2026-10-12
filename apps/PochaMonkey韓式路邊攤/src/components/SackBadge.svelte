<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// The chicken basket has a white order ticket above the food.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();
	const value = $derived(String(props.prize));
	const art = SYMBOL_SIZE * 0.88;
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Container x={art * 0.23} y={-art * 0.25} rotation={0.13}>
		<Text
			text={value}
			y={-art * 0.05}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: value.length > 2 ? 18 : 26, fontWeight: '700', fill: 0x172440, stroke: { color: 0xffffff, width: 1.75, join: 'round' } }}
		/>
		<Text
			text="×"
			y={art * 0.06}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: 21, fontWeight: '700', fill: 0xbd3417, stroke: { color: 0xffffff, width: 1.25, join: 'round' } }}
		/>
	</Container>
</Container>
