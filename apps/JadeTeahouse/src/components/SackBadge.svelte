<script lang="ts" module>
	// Prize tiers, as Saucer's cow tags and Swing's records (2026-10-18): the
	// value's ink says how good the cup is before the number is read. Cut at
	// the same breaks (1-3 / 5-10 / 15-30 / 40-50 / 100+; 100+ only appears in
	// free spins). Inks from the teahouse's own palette, on the cup's ivory
	// medallion: jade, celadon blue, plum, cinnabar; the top tier is gold leaf
	// edged in lacquer brown, the only gold number on the board.
	type Tier = { min: number; fill: number; stroke: number };
	const TIERS: Tier[] = [
		{ min: 100, fill: 0xe0ac38, stroke: 0x3a2410 },
		{ min: 40, fill: 0xa8321f, stroke: 0xf7f4e8 },
		{ min: 15, fill: 0x5b2a6e, stroke: 0xf7f4e8 },
		{ min: 5, fill: 0x1f4e79, stroke: 0xf7f4e8 },
		{ min: 0, fill: 0x203d36, stroke: 0xf7f4e8 },
	];
	export const prizeTier = (prize: number) => TIERS.find((t) => prize >= t.min)!;
</script>

<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// The cup has an ivory medallion reserved for its value.
	// Coordinates are relative to the centre of the 0.88-sized prize art.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number };
	const props: Props = $props();
	const label = $derived(`${props.prize}×`);
	const tier = $derived(prizeTier(props.prize));
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
			fill: tier.fill,
			stroke: { color: tier.stroke, width: tier.min >= 100 ? 3.5 : 2.5, join: 'round' },
		}}
	/>
</Container>
