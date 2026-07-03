<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import FxBurst from './FxBurst.svelte';

	type Props = {
		x?: number;
		y?: number;
		// radius the rays reach
		radius?: number;
	};

	const props: Props = $props();
	const radius = $derived(props.radius ?? 520);

	let rotation = $state(0);
	let pulse = $state(0);
	// periodic celebration bursts at random spots around the win amount
	let bursts = $state<{ id: number; x: number; y: number; scale: number }[]>([]);
	let nextBurstId = 0;

	onMount(() => {
		const spinId = setInterval(() => {
			rotation += 0.0045;
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 420);
		}, 16);
		const burstId = setInterval(() => {
			const id = nextBurstId++;
			bursts = [
				...bursts.slice(-5),
				{
					id,
					x: (Math.random() - 0.5) * radius * 1.1,
					y: (Math.random() - 0.55) * radius * 0.75,
					scale: 0.55 + Math.random() * 0.5,
				},
			];
		}, 620);
		return () => {
			clearInterval(spinId);
			clearInterval(burstId);
		};
	});

	// 12 golden wedges radiating from the center, alternating length
	const drawRays = (g: PixiGraphics) => {
		g.clear();
		const rayCount = 12;
		const alpha = 0.16 + 0.08 * pulse;
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
		// warm core glow so the rays melt into the count-up area
		g.beginFill(0xffe9a8, 0.16 + 0.1 * pulse);
		g.drawCircle(0, 0, radius * 0.34);
		g.endFill();
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	<Container {rotation}>
		<Graphics draw={drawRays} />
	</Container>
	{#each bursts as burst (burst.id)}
		<FxBurst x={burst.x} y={burst.y} scale={burst.scale} />
	{/each}
</Container>
