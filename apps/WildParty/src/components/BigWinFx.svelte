<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import FxBurst from './FxBurst.svelte';

	type Props = {
		x?: number;
		y?: number;
		// radius the rays reach
		radius?: number;
		// tier escalation multiplier (1 = big, up to ~1.7 = max) — scales ray
		// reach/brightness, bokeh density and burst frequency together so higher
		// tiers read as "more" rather than just "different color"
		intensity?: number;
	};

	const props: Props = $props();
	const intensity = $derived(props.intensity ?? 1);
	const radius = $derived((props.radius ?? 520) * (1 + (intensity - 1) * 0.18));

	let rotation = $state(0);
	let pulse = $state(0);
	let moteDrift = $state(0);
	// periodic celebration bursts at random spots around the win amount
	let bursts = $state<{ id: number; x: number; y: number; scale: number }[]>([]);
	let nextBurstId = 0;

	// ambient bokeh dust — soft, slow-drifting color motes for background depth,
	// reuses the existing fxGlow texture (no new asset needed) tinted per-mote.
	// Count scales gently with intensity so higher tiers feel busier, not just
	// bigger.
	const BOKEH_COLORS = [0xffd75e, 0xff8ede, 0xc59bff, 0x9ef3ff];
	const moteCount = Math.round(14 * (1 + (intensity - 1) * 0.35));
	const motes = Array.from({ length: moteCount }, (_, i) => ({
		x: (Math.random() - 0.5) * radius * 2.3,
		y: (Math.random() - 0.6) * radius * 1.7,
		size: 46 + Math.random() * 110,
		color: BOKEH_COLORS[i % BOKEH_COLORS.length],
		phase: Math.random() * Math.PI * 2,
		speed: 0.6 + Math.random() * 0.5,
	}));

	// charge-then-burst flash: builds quietly for ~0.14s (matching the banner's
	// held "charge" pose in generate_presentation.mjs), then flares brightly as
	// the banner bursts outward, then settles — reinforces the same beat as the
	// spine animation without needing frame-exact sync between the two.
	let chargeAge = $state(0);
	const chargeFlash = $derived.by(() => {
		const t = chargeAge / 1000;
		if (t < 0.14) return { alpha: 0.5 * (t / 0.14), size: 80 + 60 * (t / 0.14) };
		if (t < 0.32) {
			const p = (t - 0.14) / 0.18;
			return { alpha: 0.9 * (1 - p) + 0.1, size: 140 + 520 * p };
		}
		if (t < 0.5) return { alpha: 0.15 * (1 - (t - 0.32) / 0.18), size: 660 };
		return { alpha: 0, size: 660 };
	});

	onMount(() => {
		const chargeStart = Date.now();
		const chargeId = setInterval(() => {
			chargeAge = Date.now() - chargeStart;
			if (chargeAge > 520) clearInterval(chargeId);
		}, 16);
		const spinId = setInterval(() => {
			rotation += 0.0045;
			moteDrift += 0.0016;
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / 420);
		}, 16);
		const burstId = setInterval(
			() => {
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
			},
			620 / (1 + (intensity - 1) * 0.6),
		);
		return () => {
			clearInterval(chargeId);
			clearInterval(spinId);
			clearInterval(burstId);
		};
	});

	// 12 golden wedges radiating from the center, alternating length
	const drawRays = (g: PixiGraphics) => {
		g.clear();
		const rayCount = 12;
		const alpha = (0.16 + 0.08 * pulse) * (1 + (intensity - 1) * 0.5);
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
	<!-- vignette first: deepens the edges so the rays/count-up read with more depth -->
	<Sprite key="fxVignette" anchor={0.5} width={radius * 3.4} height={radius * 3.4} alpha={0.85} />
	<!-- ambient bokeh dust, drifting slowly behind the rays -->
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
				alpha={0.14 + 0.1 * Math.sin(pulse * 6 * mote.speed + mote.phase)}
			/>
		{/each}
	</Container>
	<Container {rotation}>
		<Graphics draw={drawRays} />
	</Container>
	{#each bursts as burst (burst.id)}
		<FxBurst x={burst.x} y={burst.y} scale={burst.scale} />
	{/each}
	{#if chargeFlash.alpha > 0.01}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			tint={0xfff3c4}
			blendMode="add"
			width={chargeFlash.size}
			height={chargeFlash.size}
			alpha={chargeFlash.alpha}
		/>
	{/if}
</Container>
