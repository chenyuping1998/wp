<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import FxBurst from './FxBurst.svelte';

	// Ambient bed under a big-win presentation: slowly turning sun rays, drifting
	// bokeh and celebration bursts popping around the plaque.
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

	let rotation = $state(0);
	let pulse = $state(0);
	let moteDrift = $state(0);
	let bursts = $state<{ id: number; x: number; y: number; scale: number }[]>([]);
	let nextBurstId = 0;

	// jungle-gold bokeh reusing the glow texture, tinted per mote
	const BOKEH_COLORS = [0xffd75e, 0xfff7d1, 0xd9e88a, 0xffb04a];
	const motes = Array.from({ length: 14 }, (_, i) => ({
		x: (Math.random() - 0.5) * 1200,
		y: (Math.random() - 0.6) * 880,
		size: 46 + Math.random() * 110,
		color: BOKEH_COLORS[i % BOKEH_COLORS.length],
		phase: Math.random() * Math.PI * 2,
		speed: 0.6 + Math.random() * 0.5,
	}));

	onMount(() => {
		const spinId = setInterval(() => {
			rotation += 0.0045;
			moteDrift += 0.0016;
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 420);
		}, 16);
		const burstId = setInterval(() => {
			bursts = [
				...bursts.slice(-5),
				{
					id: nextBurstId++,
					x: (Math.random() - 0.5) * radius * 1.1,
					y: (Math.random() - 0.55) * radius * 0.75,
					scale: 0.55 + Math.random() * 0.5,
				},
			];
		}, 700 / intensity);
		return () => {
			clearInterval(spinId);
			clearInterval(burstId);
		};
	});

	// 12 golden wedges radiating from the centre, alternating length
	const drawRays = (g: PixiGraphics) => {
		g.clear();
		const rayCount = 12;
		const alpha = (0.14 + 0.08 * pulse) * intensity;
		for (let i = 0; i < rayCount; i++) {
			const angle = (i / rayCount) * Math.PI * 2;
			const reach = radius * (i % 2 === 0 ? 1 : 0.78);
			const halfWidth = Math.PI / rayCount / 1.9;
			g.beginFill(i % 2 === 0 ? 0xffd75e : 0xffb64d, alpha);
			g.drawPolygon([
				0,
				0,
				Math.cos(angle - halfWidth) * reach,
				Math.sin(angle - halfWidth) * reach,
				Math.cos(angle + halfWidth) * reach,
				Math.sin(angle + halfWidth) * reach,
			]);
			g.endFill();
		}
		// warm core so the rays melt into the count-up area
		g.beginFill(0xffe9a8, (0.14 + 0.1 * pulse) * intensity);
		g.drawCircle(0, 0, radius * 0.34);
		g.endFill();
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	<!-- vignette first: deepens the edges so the plaque reads with more depth -->
	<Sprite key="fxVignette" anchor={0.5} width={radius * 3.4} height={radius * 3.4} alpha={0.85} />
	<Container rotation={moteDrift}>
		{#each motes as mote, index (index)}
			<Sprite
				key="fxGlow"
				anchor={0.5}
				x={mote.x}
				y={mote.y}
				tint={mote.color}
				blendMode="add"
				width={mote.size}
				height={mote.size}
				alpha={0.12 + 0.1 * Math.sin(pulse * 6 * mote.speed + mote.phase)}
			/>
		{/each}
	</Container>
	<Container {rotation}>
		<Graphics draw={drawRays} />
	</Container>
	{#each bursts as burst (burst.id)}
		<FxBurst x={burst.x} y={burst.y} scale={burst.scale} />
	{/each}
</Container>
