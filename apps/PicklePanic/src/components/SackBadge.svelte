<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import InkNumber from './InkNumber.svelte';
	import { SYMBOL_SIZE, JAR_LABEL_W } from '../game/constants';

	// The Pickle Jar's value stamp, shared by the reel symbol and every copy of
	// the sack the collection draws (the hop and the flight). The copies used to
	// be bare sacks laid over the real one, so the value blinked out for the
	// hop and the sacks crossed the board with no number on them.
	//
	// A banana-yellow disc (yellow is reserved for the collect mechanic) with an
	// ink rim and an offset ink shadow; the big values change plate so a 10x+
	// sack is spotted before it is read.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();

	const plate = $derived(props.prize >= 100 ? 0x171c1a : props.prize >= 10 ? 0xc45240 : 0xc45240);
	const ink = $derived(props.prize >= 100 ? 0xc45240 : props.prize >= 10 ? 0xf5e6be : 0x171c1a);
	const label = $derived(`${props.prize}×`);
	const r = SYMBOL_SIZE * 0.25;
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<InkNumber text={label} role="plate" fontSize={label.length > 3 ? 34 : 42} maxWidth={SYMBOL_SIZE * JAR_LABEL_W * 0.86} fill={props.prize >= 100 ? 0xc45240 : 0x171c1a}/>

</Container>
