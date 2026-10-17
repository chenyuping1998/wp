<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { everyFrame } from '../game/frameLoop';

	// THE WIN FRAME (review 10-17). A winning cell had no frame at all — only
	// the lack of the scrim marked it. ART_BRIEF §3 asks for a mustard order
	// ring in the same ink as the symbols: a fat ink outline, a mustard band,
	// and corner ticks like a cook's pencil mark. It snaps on slightly large,
	// settles onto the tile, then breathes while the cell stays lit.
	type Props = { size: number };
	const props: Props = $props();

	const INK = 0x20231d;
	const MUSTARD = 0xe9b83e;
	const PAPER = 0xfff0cf;

	let t = $state(0);
	onMount(() => {
		const start = performance.now();
		return everyFrame(() => {
			t = (performance.now() - start) / 1000;
		});
	});

	const scale = $derived(
		t < 0.16 ? 1.22 - 0.26 * (t / 0.16) : t < 0.3 ? 0.96 + 0.06 * ((t - 0.16) / 0.14) : 1.02 + 0.012 * Math.sin((t - 0.3) * 6),
	);
	const alpha = $derived(Math.min(1, t / 0.08));

	const draw = (g: PixiGraphics) => {
		g.clear();
		const s = props.size / 2;
		const r = props.size * 0.09;
		g.roundRect(-s, -s, s * 2, s * 2, r).stroke({ color: INK, width: props.size * 0.11, alignment: 0.5 });
		g.roundRect(-s, -s, s * 2, s * 2, r).stroke({ color: MUSTARD, width: props.size * 0.065, alignment: 0.5 });
		g.roundRect(-s + props.size * 0.035, -s + props.size * 0.035, s * 2 - props.size * 0.07, s * 2 - props.size * 0.07, r * 0.7).stroke({ color: PAPER, width: props.size * 0.012, alignment: 0.5, alpha: 0.9 });
		// corner ticks, slightly off-square like a hand mark
		const L = props.size * 0.2;
		const o = s + props.size * 0.055;
		for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
			g.moveTo(sx * o, sy * (o - L)).lineTo(sx * o, sy * o).lineTo(sx * (o - L), sy * o);
		}
		g.stroke({ color: INK, width: props.size * 0.05, cap: 'round', join: 'round' });
	};
</script>

<Container scale={scale} {alpha}>
	<Graphics {draw} />
</Container>
