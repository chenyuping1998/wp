<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

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

	let pulse = $state(0);
	let moteDrift = $state(0);
	let bursts = $state<{ id: number; x: number; y: number; scale: number }[]>([]);
	let nextBurstId = 0;

	// bokeh reusing the glow texture, tinted per mote
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

	// NO SUNBURST.
	//
	// Twelve golden wedges used to turn slowly behind the plaque, with a warm core
	// disc under them so they melted into the count-up. It is the stock big-win
	// bed - every slot has it - and on this game it does two specific harms.
	//
	// It washes the courtyard. The board, the rail and the counter are all still
	// on screen behind the plaque, painted at night, and twelve overlapping wedges
	// at 22% alpha turn the whole of it the same flat gold.
	//
	// And it competes with the plaque it is supposed to serve. The tier art is
	// already a carved frame with dragons and fire painted on it; putting a second,
	// cruder radial figure behind it means two things are drawing rays at once.
	//
	// The vignette stays: darkening the edges is what makes the plaque sit forward,
	// and it does that by taking light away rather than adding it.
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
	{#each bursts as burst (burst.id)}
		<FxBurst x={burst.x} y={burst.y} scale={burst.scale} />
	{/each}
</Container>
