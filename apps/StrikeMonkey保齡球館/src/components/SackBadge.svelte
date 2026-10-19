<script lang="ts" module>
	// Prize tiers, as Saucer Monkey's tags (user, 2026-10-18): the pin's round
	// belly label is painted by the value's range, so a big one reads before
	// the number does. Ranges follow the math weights — 1–4 are most of the
	// pins, 5–10 most of the rest, 15+ are rare and 100+ only appear in free
	// spins. Colours from this game's own inks: lane teal, blue, purple, the
	// cherry red-orange, gold.
	type Tier = { min: number; face: number; shine: number; ink: number };
	const TIERS: Tier[] = [
		{ min: 100, face: 0xffc21a, shine: 0xfff0a0, ink: 0x8c1300 }, // gold
		{ min: 40, face: 0xe8502e, shine: 0xff9a7a, ink: 0x5c1200 }, // red-orange
		{ min: 15, face: 0x8e3fe0, shine: 0xc69bff, ink: 0x2e0b5c }, // purple
		{ min: 5, face: 0x2a7de1, shine: 0x8cc4ff, ink: 0x0b2f66 }, // blue
		{ min: 0, face: 0x3fc4a8, shine: 0xa6eedc, ink: 0x0e4a3e }, // lane teal
	];
	export const prizeTier = (prize: number) => TIERS.find((t) => prize >= t.min)!;
</script>

<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// The pin's belly label (p.png, 512 art drawn at 0.88 of the cell): ring
	// centred at (254, 335.5), ink r 79.5..83.5. The tier face fills the ring's
	// inside so the drawn ink ring stays as its rim.
	type Props = { prize: number; x?: number; y?: number; scale?: number; alpha?: number; rotation?: number };
	const props: Props = $props();
	const K = (SYMBOL_SIZE * 0.88) / 512;
	const CX = (254 - 256) * K;
	const CY = (335.5 - 256) * K;
	const R = 80.5 * K;
	const value = $derived(`${props.prize}x`);
	const tier = $derived(prizeTier(props.prize));
	// Anton: 0.88em tall, digits ~0.49em and "x" ~0.47em wide; fit inside the face
	const valueSize = $derived(Math.min((R * 1.15) / 0.88, (R * 1.55) / ((value.length - 1) * 0.49 + 0.47)));
</script>

<!-- rotation turns it with a tumbling pin, about the pin's centre -->
<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1} rotation={props.rotation ?? 0}>
	<Container x={CX} y={CY}>
		{#key tier}
			<Graphics
				draw={(g) => {
					g.clear();
					g.circle(0, 0, R).fill(tier.face);
					g.ellipse(-R * 0.22, -R * 0.34, R * 0.52, R * 0.3).fill({ color: tier.shine, alpha: 0.45 });
				}}
			/>
		{/key}
		<Text
			text={value}
			anchor={0.5}
			y={R * 0.04}
			style={{
				fontFamily: NUMBER_FONT,
				fontSize: valueSize,
				fontWeight: '400',
				fill: 0xfff8e6,
				stroke: { color: tier.ink, width: Math.max(3, valueSize * 0.16), join: 'round' },
			}}
		/>
	</Container>
</Container>
