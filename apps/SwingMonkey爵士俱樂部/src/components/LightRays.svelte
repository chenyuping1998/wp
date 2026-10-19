<script lang="ts">
	/**
	 * Slowly turning light rays behind a board (the FG intro and settlement).
 * Ported from Jade Teahouse 2026-10-18.
	 *
	 * ADDITIVE, so it must stay a plain sibling of what it lights — never inside
	 * a masked or filtered container, where additive light has nothing to add to
	 * (stake-engine-slot skill). It sits over the dark scrim, never on paper.
	 */
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	type Props = {
		x?: number;
		y?: number;
		radius: number;
		alpha: number;
		colors?: [number, number];
		count?: number;
	};
	const props: Props = $props();

	let turn = $state(0);
	onMount(() => {
		let raf = 0;
		const start = performance.now();
		// one turn every ~2.7 minutes: alive, never busy
		const tick = (now: number) => {
			turn = (now - start) / 26000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if props.alpha > 0.001}
	<Graphics
		x={props.x ?? 0}
		y={props.y ?? 0}
		blendMode="add"
		rotation={turn}
		alpha={props.alpha}
		draw={(g: PixiGraphics) => {
			g.clear();
			const r = props.radius;
			const n = props.count ?? 14;
			// (Swing: the stage's two lights)
			const [a, b] = props.colors ?? [0xffd27a, 0xd8424e]; // spotlight gold and curtain red
			for (let i = 0; i < n; i++) {
				const angle = (i / n) * Math.PI * 2;
				const w = (Math.PI / n) * 0.42;
				g.poly([0, 0, Math.cos(angle - w) * r, Math.sin(angle - w) * r, Math.cos(angle + w) * r, Math.sin(angle + w) * r]);
				g.fill({ color: i % 2 ? b : a, alpha: 0.08 });
			}
		}}
	/>
{/if}
