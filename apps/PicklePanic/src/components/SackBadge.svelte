<script lang="ts">
	import { Container } from 'pixi-svelte';
	import InkNumber from './InkNumber.svelte';
	import { JAR_LABEL_W, SYMBOL_SIZE } from '../game/constants';

	// The Pickle Jar's value stamp, shared by the reel symbol and every copy of
	// the sack the collection draws (the hop and the flight). The copies used to
	// be bare sacks laid over the real one, so the value blinked out for the
	// hop and the sacks crossed the board with no number on them.
	//
	// Heavy type on the jar's paper label: ink outline + offset ink shadow, so
	// it reads bold, and the fill steps through colours with the value so a big
	// jar is spotted before it is read (user 10-24: 「FG 倍數有點不明顯，粗體…
	// 倍數可以分階段顏色不同」). Every tier stays dark enough for the cream label.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();

	// [from (bet multiples), fill] — highest first
	const TIERS: [number, number][] = [
		[100, 0xc8342a], // red
		[25, 0x7b3c9c], // purple
		[10, 0x2364a8], // blue
		[5, 0x3d7a2a], // pickle green
		[0, 0x171c1a], // ink
	];
	const fill = $derived(TIERS.find(([from]) => props.prize >= from)?.[1] ?? 0x171c1a);
	const label = $derived(`${props.prize}×`);
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	<InkNumber text={label} role="plate" fontSize={label.length > 3 ? 36 : 44} maxWidth={SYMBOL_SIZE * JAR_LABEL_W * 0.92} {fill} outline />
</Container>
