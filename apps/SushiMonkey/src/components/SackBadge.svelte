<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import InkNumber from './InkNumber.svelte';
	import { SYMBOL_SIZE } from '../game/constants';

	// The Sushi Plate's value stamp, shared by the reel symbol and every copy of
	// the plate the collection draws (the hop and the flight).
	//
	// Review 10-20: the stamp used to be a copper disc carrying the copper
	// `plate` digits — same colour on same colour, so no value could be read and
	// the disc (sat over the two maki) read as a coin. Now it is a paper chit on
	// the plate's empty rim, below the maki, with ink that always contrasts:
	// copper digits on paper for small values, charcoal digits on a copper chit
	// once the value reaches 10× (and a charcoal rim from 100×), so a big plate
	// is spotted before it is read.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();

	const PAPER = 0xefeadc;
	const COPPER = 0xb87b60;
	const INK = 0x1e1b1a;
	const chit = $derived(props.prize >= 10 ? COPPER : PAPER);
	const role = $derived(props.prize >= 10 ? ('count' as const) : ('plate' as const));
	const rim = $derived(props.prize >= 100 ? 7 : 4);
	const label = $derived(`${props.prize}×`);
	const w = SYMBOL_SIZE * 0.5;
	const h = SYMBOL_SIZE * 0.27;
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<Graphics
		draw={(g) => {
			g.clear();
			g.roundRect(-w / 2 + 4, -h / 2 + 4, w, h, h / 2).fill(INK);
			g.roundRect(-w / 2, -h / 2, w, h, h / 2).fill(chit).stroke({ width: rim, color: INK });
		}}
	/>
	<InkNumber text={label} {role} fontSize={h * 0.78} maxWidth={w - 18} y={1} />
</Container>
