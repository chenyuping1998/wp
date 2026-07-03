<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	type Props = {
		x?: number;
		y?: number;
		// overall size multiplier — 1 fits a 120px symbol cell
		scale?: number;
		// delay before the burst fires (ms)
		delay?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 850;
	const PARTY_COLORS = [0xffd75e, 0xfff7d1, 0xff8ede, 0x9ef3ff];

	type Spark = {
		angle: number;
		speed: number;
		size: number;
		life: number;
		color: number;
		spin: number;
	};

	// one-shot spark field, randomized per mount
	const sparks: Spark[] = Array.from({ length: 12 }, (_, i) => ({
		angle: (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
		speed: 150 + Math.random() * 130,
		size: 4.5 + Math.random() * 4.5,
		life: 0.6 + Math.random() * 0.25,
		color: PARTY_COLORS[i % PARTY_COLORS.length],
		spin: (Math.random() - 0.5) * 8,
	}));

	let t = $state(-1); // -1 = not started yet

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

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (t < 0 || t >= 1) return;
		const s = props.scale ?? 1;
		const seconds = (t * DURATION) / 1000;

		// central flash
		const flashAlpha = (1 - t) ** 1.6 * 0.5;
		if (flashAlpha > 0.02) {
			g.beginFill(0xfff2c0, flashAlpha);
			g.drawCircle(0, 0, 58 * s * easeOut(Math.min(1, t * 3)));
			g.endFill();
		}

		// two expanding rings, the second slightly delayed
		for (const [delayP, width] of [
			[0, 6],
			[0.14, 4],
		] as const) {
			const p = (t - delayP) / (1 - delayP);
			if (p <= 0 || p >= 1) continue;
			g.lineStyle(width * s * (1 - p), 0xffe08a, (1 - p) * 0.85);
			g.drawCircle(0, 0, (18 + 68 * easeOut(p)) * s);
		}
		g.lineStyle(0);

		// diamond sparks flying outward with a little gravity
		for (const spark of sparks) {
			const p = seconds / spark.life;
			if (p >= 1) continue;
			const dist = spark.speed * seconds * s;
			const px = Math.cos(spark.angle) * dist;
			const py = Math.sin(spark.angle) * dist + 130 * seconds * seconds * s;
			const size = spark.size * s * (1 - p * 0.75);
			const rot = spark.angle + spark.spin * seconds;
			const cos = Math.cos(rot);
			const sin = Math.sin(rot);
			const long = size * 1.6;
			const short = size * 0.55;
			g.beginFill(spark.color, (1 - p) * 0.95);
			g.drawPolygon([
				px + cos * long,
				py + sin * long,
				px - sin * short,
				py + cos * short,
				px - cos * long,
				py - sin * long,
				px + sin * short,
				py - cos * short,
			]);
			g.endFill();
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	<Graphics {draw} />
</Container>
