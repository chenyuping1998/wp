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
		// 'gold' celebration vs 'tomb' (inlay chips and a spray of sand) for blasts
		flavour?: 'gold' | 'tomb';
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 850;
	const GOLD = [0xffd75e, 0xfff7d1, 0xffb04a, 0xffe98a];
	// THE TOMB BLAST. It was 'jungle': every third spark a green leaf, left over
	// from Go Bananas 100 and the one green thing in a gold-and-lapis game. What a
	// blast throws in a tomb is gilt and inlay — so every third spark is a chip of
	// lapis, carnelian or turquoise (the Buy Bonus scarab's and the win plaques'
	// stones), and a fan of sand grains falls under it.
	const TOMB = [0xffd75e, 0xfff7d1, 0xffe98a, 0xffb04a];
	const INLAY = [0x3f74de, 0xe8643c, 0x3fd0bd];
	const SAND = [0xe8c98a, 0xd9b877, 0xf2dcae];

	type Spark = {
		angle: number;
		speed: number;
		size: number;
		life: number;
		color: number;
		spin: number;
		chip: boolean;
		// per-spark stagger breaks the mechanical all-at-once look
		delay: number;
	};

	const sparks: Spark[] = Array.from({ length: 12 }, (_, i) => ({
		angle: (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
		speed: 150 + Math.random() * 130,
		size: 26 + Math.random() * 26,
		life: 0.55 + Math.random() * 0.3,
		color:
			props.flavour === 'tomb' && i % 3 === 0 ? INLAY[(i / 3) % 3] : (props.flavour === 'tomb' ? TOMB : GOLD)[i % 4],
		spin: (Math.random() - 0.5) * 6,
		chip: props.flavour === 'tomb' && i % 3 === 0,
		delay: Math.random() * 0.09,
	}));

	// sand: many small grains, thrown up and out and falling faster than the
	// sparks, so the blast settles like dust rather than like fireworks
	const grains = Array.from({ length: props.flavour === 'tomb' ? 26 : 0 }, () => ({
		angle: -Math.PI / 2 + (Math.random() - 0.5) * 2.6,
		speed: 90 + Math.random() * 170,
		size: 2 + Math.random() * 3,
		color: SAND[Math.floor(Math.random() * 3)],
		delay: Math.random() * 0.06,
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
			g.lineStyle(width * s * (1 - p), 0xffe08a, (1 - p) * 0.7);
			g.drawCircle(0, 0, (18 + 68 * easeOut(p)) * s);
		}
		g.lineStyle(0);
	};
</script>

<!-- sand and chips, drawn as vector: flat stones are not light, so they are
     solid and normal-blended where the sparks are additive -->
{#snippet stones()}
	<Graphics
		draw={(g) => {
			g.clear();
			if (t < 0 || t >= 1) return;
			const s = props.scale ?? 1;
			const seconds = (t * DURATION) / 1000;
			for (const grain of grains) {
				const sec = seconds - grain.delay;
				if (sec <= 0) continue;
				const x = Math.cos(grain.angle) * grain.speed * sec * s;
				const y = (Math.sin(grain.angle) * grain.speed * sec + 420 * sec * sec) * s;
				g.circle(x, y, grain.size * s).fill({ color: grain.color, alpha: 1 - t });
			}
			for (const spark of sparks) {
				if (!spark.chip) continue;
				const st = sparkState(spark, t);
				if (!st) continue;
				// a faceted chip: a rhombus with a lit upper face
				const r = st.size * 0.28;
				const c = Math.cos(st.rot);
				const sn = Math.sin(st.rot);
				const pt = (px: number, py: number) => [st.x + px * c - py * sn, st.y + px * sn + py * c];
				const pts = [pt(0, -r), pt(r * 0.8, 0), pt(0, r), pt(-r * 0.8, 0)].flat();
				g.poly(pts).fill({ color: spark.color, alpha: st.alpha });
				g.poly(pts).stroke({ width: Math.max(1, r * 0.22), color: 0xffd75e, alpha: st.alpha });
				g.poly([pt(0, -r), pt(r * 0.8, 0), pt(0, 0)].flat()).fill({ color: 0xffffff, alpha: st.alpha * 0.35 });
			}
		}}
	/>
{/snippet}

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if t >= 0 && t < 1}
		<!-- soft central flash -->
		<Sprite
			key="fxGlow"
			anchor={0.5}
			tint={0xffe9a8}
			blendMode="add"
			width={150 * (props.scale ?? 1) * easeOut(Math.min(1, t * 3))}
			height={150 * (props.scale ?? 1) * easeOut(Math.min(1, t * 3))}
			alpha={(1 - t) ** 1.6}
		/>
		<Graphics draw={drawRings} />
		{@render stones()}
		{#each sparks as spark, index (index)}
			{@const state = sparkState(spark, t)}
			{#if state && !spark.chip}
				<Sprite
					key="fxStar"
					anchor={0.5}
					x={state.x}
					y={state.y}
					rotation={state.rot}
					tint={spark.color}
					blendMode="add"
					width={state.size}
					height={state.size}
					alpha={state.alpha}
				/>
			{/if}
		{/each}
	{/if}
</Container>
