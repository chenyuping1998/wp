<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	// The banner owns the slam and sparks. Behind it, a sign-shaped rim chases
	// around the edge; the old rotating sunburst and random bokeh made every
	// win look like the same generic celebration preset.
	type Props = {
		x?: number;
		y?: number;
		radius?: number;
		// higher tiers glow hotter
		intensity?: number;
	};

	const props: Props = $props();
	const radius = $derived(props.radius ?? 520);
	const intensity = $derived(props.intensity ?? 1);

	let clock = $state(0);

	onMount(() => {
		const started = performance.now();
		const timer = setInterval(() => (clock = (performance.now() - started) / 1000), 33);
		return () => clearInterval(timer);
	});

	const drawMarquee = (g: PixiGraphics) => {
		g.clear();
		const rx = radius * 0.98;
		const ry = radius * 0.6;
		g.roundRect(-rx, -ry, rx * 2, ry * 2, radius * 0.09)
			.stroke({ width: 3, color: 0x59e3ff, alpha: 0.17 * intensity });
		const segments = 20;
		const chase = Math.floor(clock * 7) % segments;
		for (let i = 0; i < segments; i++) {
			// Six lamps across each long edge, four on each short edge.
			// Keep them on the actual sign rim rather than an ellipse inside it.
			const top = i < 6;
			const right = i >= 6 && i < 10;
			const bottom = i >= 10 && i < 16;
			const edgeIndex = top ? i : right ? i - 6 : bottom ? i - 10 : i - 16;
			const fraction = top || bottom ? (edgeIndex + 0.5) / 6 : (edgeIndex + 0.5) / 4;
			const x = top ? -rx * 0.83 + fraction * rx * 1.66 : right ? rx : bottom ? rx * 0.83 - fraction * rx * 1.66 : -rx;
			const y = top ? -ry : right ? -ry * 0.72 + fraction * ry * 1.44 : bottom ? ry : ry * 0.72 - fraction * ry * 1.44;
			const tx = top ? 1 : right ? 0 : bottom ? -1 : 0;
			const ty = top ? 0 : right ? 1 : bottom ? 0 : -1;
			const length = radius * (i % 5 === 0 ? 0.065 : 0.045);
			const distance = (i - chase + segments) % segments;
			const alpha = distance === 0 ? 0.9 : distance <= 2 ? 0.35 : 0.12;
			g.moveTo(x - tx * length, y - ty * length)
				.lineTo(x + tx * length, y + ty * length)
				.stroke({ width: distance === 0 ? 5 : 2.5, color: i % 2 ? 0xff3fd0 : 0x59e3ff, alpha: alpha * intensity, cap: 'round' });
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	<!-- vignette first: deepens the edges so the plaque reads with more depth -->
	<Sprite key="fxVignette" anchor={0.5} width={radius * 3.4} height={radius * 3.4} alpha={0.8} />
	<Sprite key="fxGlow" anchor={0.5} x={-radius * 0.72} y={-radius * 0.12} tint={0x59e3ff} blendMode="add" width={radius * 0.7} height={radius * 0.7} alpha={0.16} />
	<Sprite key="fxGlow" anchor={0.5} x={radius * 0.72} y={radius * 0.12} tint={0xff3fd0} blendMode="add" width={radius * 0.7} height={radius * 0.7} alpha={0.16} />
	<Graphics draw={drawMarquee} />
</Container>
