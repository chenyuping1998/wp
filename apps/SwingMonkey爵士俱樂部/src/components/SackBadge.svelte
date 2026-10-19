<script lang="ts" module>
	// Prize tiers follow the math weights (as Saucer Monkey's cow tags,
	// 2026-10-18): 1–3 are ~90% of records, 5–10 most of the rest, 15+ are
	// rare and 100+ only appear in free spins. The tier paints the record's
	// centre label; the number stays cream with a stroke in the tier's dark.
	type Tier = { min: number; face: number; shine: number; ink: number };
	const TIERS: Tier[] = [
		{ min: 100, face: 0xf2b630, shine: 0xfff0a0, ink: 0x7a1d05 }, // gold
		{ min: 40, face: 0xd2452b, shine: 0xff9a78, ink: 0x4f0f08 }, // red
		{ min: 15, face: 0x8a3fd1, shine: 0xc69bff, ink: 0x2e0b5c }, // purple
		{ min: 5, face: 0x2b62c9, shine: 0x8cb8ff, ink: 0x0b2a66 }, // blue
		{ min: 0, face: 0x2f8a52, shine: 0x8fdc9c, ink: 0x0f3a1d }, // green
	];
	export const prizeTier = (prize: number) => TIERS.find((t) => prize >= t.min)!;
</script>

<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	// Print the value on the record's centre label, the label painted in the
	// value's tier colour. The label, measured on sushiSymbols/p.png (512 art,
	// 2026-10-18): an ellipse about (274.4, 235.2), semi-axes 90 × 66, major
	// axis turned 40° clockwise; the spindle hole at (272, 232).
	type Props = {
		prize: number;
		x?: number;
		y?: number;
		scale?: number;
		alpha?: number;
		/**
		 * radians: the record is PLAYING (BanditCollect, 2026-10-18). Two groove
		 * glints and two printed arcs on the label turn about the spindle in the
		 * disc's own (tilted) plane, so it reads as a record on a turntable. The
		 * art itself is not turned: its disc is drawn ~23px off the label's
		 * centre, and turning it would wobble.
		 */
		spin?: number;
		/** 0..1, the spin marks' opacity (eased in and out by the caller) */
		spinAlpha?: number;
	};
	const props: Props = $props();
	const value = $derived(String(props.prize));
	const tier = $derived(prizeTier(props.prize));
	const art = SYMBOL_SIZE * 0.88;
	const U = art / 512;
	const LABEL = { x: (274.4 - 256) * U, y: (235.2 - 256) * U, rx: 90 * 0.93 * U, ry: 66 * 0.93 * U, rot: (40 * Math.PI) / 180 };
	const HOLE = { x: (272 - 256) * U, y: (232 - 256) * U };
	// the black disc, measured the same way: about (260, 252.8), semi-axes
	// 230.9 × 170.3, major axis 40.9° clockwise
	const DISC = { x: (260 - 256) * U, y: (252.8 - 256) * U, r: 230.9 * U, k: 170.3 / 230.9, rot: (40.9 * Math.PI) / 180 };
	const spinning = $derived(props.spin !== undefined && (props.spinAlpha ?? 1) > 0.01);
	const arc = (g: import('pixi.js').Graphics, r: number, a0: number, span: number) => {
		const n = 10;
		for (let i = 0; i <= n; i++) {
			const a = a0 + (span * i) / n;
			if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
			else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} scale={props.scale ?? 1} alpha={props.alpha ?? 1}>
	{#if spinning}
		<!-- groove glints on the vinyl, turning with it (in the disc's plane) -->
		<Container x={DISC.x} y={DISC.y} rotation={DISC.rot} alpha={props.spinAlpha ?? 1}>
			<Container scale={{ x: 1, y: DISC.k }}>
				<Graphics
					draw={(g) => {
						g.clear();
						for (const k of [0, Math.PI]) {
							const a = (props.spin ?? 0) + k;
							arc(g, DISC.r * 0.82, a, 0.42);
							g.stroke({ color: 0xfff2d8, width: 4, alpha: 0.7 });
							arc(g, DISC.r * 0.68, a + 0.1, 0.3);
							g.stroke({ color: 0xfff2d8, width: 3, alpha: 0.5 });
							arc(g, DISC.r * 0.55, a + 0.18, 0.22);
							g.stroke({ color: 0xfff2d8, width: 2.2, alpha: 0.4 });
						}
					}}
				/>
			</Container>
		</Container>
	{/if}
	<Container x={LABEL.x} y={LABEL.y} rotation={LABEL.rot}>
		{#key tier}
			<Graphics
				draw={(g) => {
					g.clear();
					g.ellipse(0, 0, LABEL.rx, LABEL.ry).fill(tier.face);
					// a pressed ring inside the label, as printed labels have
					g.ellipse(0, 0, LABEL.rx * 0.8, LABEL.ry * 0.8).stroke({ color: tier.shine, width: 1.5, alpha: 0.55 });
					g.ellipse(-LABEL.rx * 0.28, -LABEL.ry * 0.36, LABEL.rx * 0.42, LABEL.ry * 0.22).fill({ color: tier.shine, alpha: 0.32 });
				}}
			/>
		{/key}
		{#if spinning}
			<!-- the label's print turning about the spindle -->
			<Container scale={{ x: 1, y: LABEL.ry / LABEL.rx }} alpha={props.spinAlpha ?? 1}>
				<Graphics
					draw={(g) => {
						g.clear();
						for (const k of [0, Math.PI]) {
							arc(g, LABEL.rx * 0.88, (props.spin ?? 0) + k, 0.9);
							g.stroke({ color: tier.shine, width: 3, alpha: 0.9 });
						}
						const a = (props.spin ?? 0) + Math.PI / 2;
						g.circle(Math.cos(a) * LABEL.rx * 0.62, Math.sin(a) * LABEL.rx * 0.62, 2.6).fill({ color: tier.shine, alpha: 0.9 });
					}}
				/>
			</Container>
		{/if}
	</Container>
	<Graphics
		draw={(g) => {
			g.clear();
			g.circle(HOLE.x, HOLE.y, 5.5 * U * 1.6).fill(0x161412);
		}}
	/>
	<Container x={art * 0.045} y={art * 0.035}>
		<Text
			text={value}
			y={-art * 0.095}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: value.length > 2 ? 22 : 30, fontWeight: '700', fill: 0xfff8e6, stroke: { color: tier.ink, width: 3.5, join: 'round' } }}
		/>
		<Text
			text="×"
			y={art * 0.035}
			anchor={0.5}
			style={{ fontFamily: NUMBER_FONT, fontSize: 19, fontWeight: '700', fill: 0xfff8e6, stroke: { color: tier.ink, width: 3, join: 'round' } }}
		/>
	</Container>
</Container>
