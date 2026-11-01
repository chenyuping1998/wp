<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// The Signal Pack's value stamp, shared by the reel symbol and every copy of
	// the sack the collection draws (the hop and the flight). The copies used to
	// be bare sacks laid over the real one, so the value blinked out for the
	// hop and the sacks crossed the board with no number on them.
	//
	// A banana-yellow disc (yellow is reserved for the collect mechanic) with an
	// ink rim and an offset ink shadow; the big values change plate so a 10x+
	// sack is spotted before it is read.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();

	const plate = $derived(props.prize >= 100 ? 0x15191f : props.prize >= 10 ? 0xe7aa53 : 0xf4c21b);
	// 10x-50x used cream ink on the orange plate: 1.6:1, faint at reel size
	// (self-check 2026-10-22). Ink on orange is 8.7:1; the plate colour alone
	// still marks the tier.
	const ink = $derived(props.prize >= 100 ? 0xf4c21b : 0x15191f);
	const label = $derived(`${props.prize}×`);
	const r = SYMBOL_SIZE * 0.25;
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Graphics
		draw={(g) => {
			g.clear();
			g.circle(4, 4, r).fill(0x15191f);
			g.circle(0, 0, r).fill(plate).stroke({ width: 4, color: 0x15191f });
			g.circle(0, 0, r - 7).stroke({ width: 2, color: ink, alpha: 0.6 });
		}}
	/>
	<Text
		anchor={0.5}
		y={2}
		text={label}
		style={{
			fontFamily: NUMBER_FONT,
			fontSize: label.length > 3 ? 30 : label.length > 2 ? 38 : 46,
			fill: ink,
			fontWeight: '400',
		}}
	/>
</Container>
