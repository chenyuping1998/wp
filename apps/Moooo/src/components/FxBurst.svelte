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
		// 'gold' celebration vs 'neon' (cyan/magenta shards mixed in) for blasts
		flavour?: 'gold' | 'bunting';
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 850;
	const GOLD = [0xffd75e, 0xfff7d1, 0xffb04a, 0xffe98a];
	// The second flavour, thrown on the entry reveal, the free-spin intro and
	// every big win.
	//
	// It has now been wrong twice in the same place. It was JUNGLE (gold, cream,
	// olive 0x8fbf4a, amber) spraying green leaf sprites over GoBananas art; then
	// NEON = [0xff2e88, 0x00e5ff, 0xfff7d1, 0x8a3ffc] — Hot Miami's magenta,
	// cyan, cream and violet — because retheme_ui.py recoloured the sprite ART
	// and uiTheme.ts took the vector colours while this FX layer was missed both
	// times.
	//
	// It is now BUNTING: the five flag colours already strung across the top of
	// every background (design/build_scene_3d.py's BUNTING list, minus the cream
	// which GOLD already covers). A burst at a county fair should look like the
	// fair coming apart, and those five colours are literally hanging over the
	// board while it happens.
	const BUNTING = [0xd63a3a, 0x3a9c4a, 0x2c60c4, 0xe8a83c];

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
		color: (props.flavour === 'bunting' ? BUNTING : GOLD)[i % 4],
		spin: (Math.random() - 0.5) * 6,
		leaf: props.flavour === 'bunting' && i % 3 === 0,
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
			g.circle(0, 0, (18 + 68 * easeOut(p)) * s);
			g.stroke({ width: width * s * (1 - p), color: 0xffe08a, alpha: (1 - p) * 0.7 });
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if t >= 0 && t < 1}
		<!-- soft central flash -->
		<Sprite
			key="mooooFxGlow"
			anchor={0.5}
			tint={0xffe9a8}
			blendMode="add"
			width={150 * (props.scale ?? 1) * easeOut(Math.min(1, t * 3))}
			height={150 * (props.scale ?? 1) * easeOut(Math.min(1, t * 3))}
			alpha={(1 - t) ** 1.6}
		/>
		<Graphics draw={drawRings} />
		{#each sparks as spark, index (index)}
			{@const state = sparkState(spark, t)}
			{#if state}
				<!-- shard sprite follows the flavour: gold throws leaf shards, neon
				     throws streaks. fxLeaf on the neon path was the visible half of
				     the jungle carry-over - green leaves over Miami plaque art. -->
				<Sprite
					key={spark.leaf ? (props.flavour === 'bunting' ? 'mooooFxStreak' : 'mooooFxLeaf') : 'mooooFxStar'}
					anchor={0.5}
					x={state.x}
					y={state.y}
					rotation={state.rot}
					tint={spark.color}
					blendMode={spark.leaf && props.flavour !== 'bunting' ? 'normal' : 'add'}
					width={state.size}
					height={state.size}
					alpha={state.alpha}
				/>
			{/if}
		{/each}
	{/if}
</Container>
