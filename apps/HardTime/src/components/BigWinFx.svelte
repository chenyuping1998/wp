<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import FxBurst from './FxBurst.svelte';

	// Ambient bed under a big-win presentation: slowly turning shafts of light,
	// drifting bokeh and celebration bursts popping around the plaque.
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

	// Ambient bokeh reusing the glow texture, tinted per mote. Was the
	// "jungle-gold" set, whose 0xd9e88a is pale olive — the last survivor of the
	// GoBananas FX carry-over (trap #6). It was missed when FxBurst, the big-tier
	// glow bed and the two flavour="jungle" call sites were recoloured, and was
	// caught on screen: 8 olive motes drifting behind a magenta SUPER WIN plaque.
	// Keeps gold and cream for warmth, swaps the olive and the amber for the
	// Miami neons WildParty's equivalent uses (BigWinFx.svelte:26).
	const BOKEH_COLORS = [0xffd75e, 0xfff7d1, 0xa8323c, 0x9aa0a6];
	const motes = Array.from({ length: 14 }, (_, i) => ({
		x: (Math.random() - 0.5) * 1200,
		y: (Math.random() - 0.6) * 880,
		size: 46 + Math.random() * 110,
		color: BOKEH_COLORS[i % BOKEH_COLORS.length],
		phase: Math.random() * Math.PI * 2,
		speed: 0.6 + Math.random() * 0.5,
	}));

	// Twelve shafts, alternating long and short. They were flat-filled polygons
	// with hard edges — at 0.14 alpha over a darkened board they read as cut
	// paper (2026-09-29 audit, "low quality assets"). fx_ray.png is a soft shaft
	// that widens and fades toward its tip, added over the scene.
	const RAYS = Array.from({ length: 12 }, (_, i) => ({
		angle: (i / 12) * Math.PI * 2,
		long: i % 2 === 0,
	}));

	onMount(() => {
		// One frame clock for the drift and the pulse (was a 16 ms interval, out
		// of step with the display, so the slow turn stuttered).
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			rotation += 0.28 * dt;
			moteDrift += 0.1 * dt;
			pulse = 0.5 + 0.5 * Math.sin(now / 420);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
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
			cancelAnimationFrame(raf);
			clearInterval(burstId);
		};
	});

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
		{#each RAYS as ray, index (index)}
			<Sprite
				key="fxRay"
				anchor={{ x: 0, y: 0.5 }}
				rotation={ray.angle}
				width={radius * (ray.long ? 1.25 : 0.95)}
				height={radius * (ray.long ? 0.42 : 0.3)}
				tint={ray.long ? 0xffd75e : 0xffb64d}
				blendMode="add"
				alpha={Math.min(0.7, (0.24 + 0.1 * pulse) * intensity)}
			/>
		{/each}
	</Container>
	<!-- warm core so the shafts melt into the count-up area -->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		width={radius * 1.1}
		height={radius * 1.1}
		tint={0xffe9a8}
		blendMode="add"
		alpha={Math.min(0.55, (0.2 + 0.1 * pulse) * intensity)}
	/>
	{#each bursts as burst (burst.id)}
		<FxBurst x={burst.x} y={burst.y} scale={burst.scale} />
	{/each}
</Container>
