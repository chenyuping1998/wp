<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';


	// Ambient bed under a big-win presentation: soft, slowly turning rays.
	type Props = {
		x?: number;
		y?: number;
		radius?: number;
		// higher tiers burst more often and glow hotter
		intensity?: number;
	};

	const props: Props = $props();
	const radius = $derived(props.radius ?? 520);
	const intensity = $derived(props.intensity ?? 1);

	// 2026-10-16 (review: poor animation): calmer. This drew 12 hard-edged
	// opaque wedges spinning and pulsing, 14 big bokeh blobs and a burst every
	// 0.7s for as long as the plaque was up — the busiest, cheapest-looking
	// layer in the game. Now: soft rays (each one three nested wedges, so it
	// has a bright core and feathered edges), additive and faint, turning
	// slowly, with no pulse; no blobs; bursts only on the entrance (Win.svelte).
	let rotation = $state(0);
	onMount(() => {
		const spinId = setInterval(() => (rotation += 0.0016), 16);
		return () => clearInterval(spinId);
	});

	const RAYS = 14;
	const drawRays = (g: PixiGraphics) => {
		g.clear();
		for (let i = 0; i < RAYS; i++) {
			const angle = (i / RAYS) * Math.PI * 2;
			const reach = radius * (i % 2 === 0 ? 1.05 : 0.8);
			for (const [spread, alpha] of [[1, 0.035], [0.6, 0.045], [0.28, 0.06]] as [number, number][]) {
				const half = (Math.PI / RAYS) * 0.55 * spread;
				g.poly([
					0, 0,
					Math.cos(angle - half) * reach, Math.sin(angle - half) * reach,
					Math.cos(angle + half) * reach, Math.sin(angle + half) * reach,
				]).fill({ color: 0xffe2a0, alpha: alpha * Math.min(1.4, intensity) });
			}
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	<!-- vignette first: deepens the edges so the plaque reads with more depth -->
	<Sprite key="fxVignette" anchor={0.5} width={radius * 3.4} height={radius * 3.4} alpha={0.85} />
	<Container {rotation}>
		<Graphics draw={drawRays} blendMode="add" />
	</Container>
	<!-- a soft core so the rays melt into the plaque instead of meeting at a point -->
	<Sprite key="fxGlow" anchor={0.5} width={radius * 1.3} height={radius * 1.3} tint={0xffd890} alpha={0.22} blendMode="add" />
</Container>
