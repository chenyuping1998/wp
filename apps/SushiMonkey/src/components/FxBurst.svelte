<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	// One-shot celebration burst: central flash, two shock rings and a spray of
	// additive sparks. Every element is a soft texture, so it reads as light
	// rather than as vector shapes.
	type Props = {
		x?: number;
		y?: number;
		// overall size multiplier — 1 fits one symbol cell
		scale?: number;
		delay?: number;
		// 'gold' celebration vs 'jungle' (leaf shards mixed in) for blasts
		flavour?: 'gold' | 'jungle';
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 850;
	const GOLD = [0xefeadc, 0xb87b60, 0x4a4846, 0xefeadc];
	const JUNGLE = [0x4a4846, 0xefeadc, 0xb87b60, 0x4a4846];

	type Spark = {
		angle: number;
		speed: number;
		size: number;
		life: number;
		color: number;
		spin: number;
		leaf: boolean;
		// per-spark stagger breaks the mechanical all-at-once look
		delay: number;
	};

	const sparks: Spark[] = Array.from({ length: 12 }, (_, i) => ({
		angle: (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
		speed: 150 + Math.random() * 130,
		size: 26 + Math.random() * 26,
		life: 0.55 + Math.random() * 0.3,
		color: (props.flavour === 'jungle' ? JUNGLE : GOLD)[i % 4],
		spin: (Math.random() - 0.5) * 6,
		leaf: props.flavour === 'jungle' && i % 3 === 0,
		delay: Math.random() * 0.09,
	}));

	let t = $state(-1); // -1 = waiting out the delay

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now + (props.delay ?? 0);
			const elapsed = now - start;
			t = elapsed < 0 ? -1 : Math.min(1, elapsed / DURATION);
			if (t >= 1) {
				props.oncomplete?.();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeOut = (p: number) => 1 - (1 - p) ** 3;

	const sparkState = (spark: Spark, time: number) => {
		const s = props.scale ?? 1;
		const seconds = Math.max(0, (time * DURATION) / 1000 - spark.delay);
		const p = seconds / spark.life;
		if (p <= 0 || p >= 1) return null;
		const dist = spark.speed * seconds * s;
		return {
			x: Math.cos(spark.angle) * dist,
			// gravity pulls the spray back down
			y: Math.sin(spark.angle) * dist + 130 * seconds * seconds * s,
			size: spark.size * s * (1 - p * 0.6),
			rot: spark.angle + spark.spin * seconds,
			alpha: p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88,
		};
	};

	// thin expanding rings stay vector — hairline strokes read fine
	const drawRings = (g: PixiGraphics) => {
		g.clear();
		if (t < 0 || t >= 1) return;
		const s = props.scale ?? 1;
		for (const [delayP, width] of [
			[0, 5],
			[0.14, 3.5],
		] as const) {
			const p = (t - delayP) / (1 - delayP);
			if (p <= 0 || p >= 1) continue;
			g.lineStyle(width * s * (1 - p), 0xb87b60, (1 - p) * 0.7);
			g.drawCircle(0, 0, (18 + 68 * easeOut(p)) * s);
		}
		g.lineStyle(0);
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if t >= 0 && t < 1}
		<!-- soft central flash -->
		<Sprite
			key="fxGlow"
			anchor={0.5}
			tint={0xefeadc}
			blendMode="normal"
			width={150 * (props.scale ?? 1) * easeOut(Math.min(1, t * 3))}
			height={150 * (props.scale ?? 1) * easeOut(Math.min(1, t * 3))}
			alpha={(1 - t) ** 1.6}
		/>
		<Graphics draw={drawRings} />
		{#each sparks as spark, index (index)}
			{@const state = sparkState(spark, t)}
			{#if state}
				<Sprite
					key={spark.leaf ? 'fxLeaf' : 'fxStar'}
					anchor={0.5}
					x={state.x}
					y={state.y}
					rotation={state.rot}
					tint={spark.color}
					blendMode="normal"
					width={state.size}
					height={state.size}
					alpha={state.alpha}
				/>
			{/if}
		{/each}
	{/if}
</Container>
