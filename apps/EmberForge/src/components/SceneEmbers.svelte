<script lang="ts">
	import { onMount } from 'svelte';
	import { Sprite } from 'pixi-svelte';

	import { HEAT_POINTS } from '../game/heatPoints';

	/**
	 * Sparks lifting off the fire in the painted scene.
	 *
	 * The sources are not chosen by hand and are not random: HEAT_POINTS is
	 * sampled straight out of the painting's own heat mask by
	 * design/generate_lava_flow.mjs, weighted by how hot each pixel is. So the
	 * furnace mouth, the cauldron and the dragon's pour throw the most sparks, the
	 * thin tongues around the frame throw a few, and the flagstones throw none —
	 * without any of those regions being written down anywhere.
	 *
	 * Drawn OVER the scene sprite. Background has its own canvas-wide motes, but
	 * they sit behind the board-anchored copy of the painting, which is opaque:
	 * anything seeded on the fire and drawn back there would be invisible.
	 */
	type Props = {
		/** The scene rect, top-left anchored — the same one the scene Sprite uses. */
		x: number;
		y: number;
		width: number;
		height: number;
		intensity?: number;
	};

	const props: Props = $props();
	const intensity = $derived(props.intensity ?? 1);

	const COLORS = [0xffe98a, 0xfff7d6, 0xffb347, 0xffd75e];

	// Derived from the index rather than Math.random(): the look does not need
	// true randomness, and a seeded spread means two players see the same forge.
	const embers = HEAT_POINTS.map((point, i) => ({
		source: point,
		color: COLORS[i % COLORS.length],
		// Hotter sources throw bigger, faster sparks.
		size: 0.006 + point.heat * 0.012 + (i % 7) * 0.0012,
		rise: 0.14 + point.heat * 0.16,
		speed: 0.09 + point.heat * 0.06 + (i % 5) * 0.011,
		sway: 0.004 + (i % 6) * 0.0035,
		phase: (i * 2.399) % (Math.PI * 2),
		alpha: 0.3 + point.heat * 0.45,
		// Golden-ratio stagger, so the forty-four sparks never leave their sources
		// on the same frame and never fall into a visible rhythm either.
		offset: (i * 0.6180339887) % 1,
	}));

	let clock = $state(0);
	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const step = (now: number) => {
			clock += Math.min(now - last, 100) / 1000;
			last = now;
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});

	// Everything above is in scene fractions, so it survives any layout; this is
	// the one place it becomes pixels.
	const placed = $derived.by(() =>
		embers.map((ember) => {
			const progress = (ember.offset + clock * ember.speed) % 1;
			const size = props.width * ember.size * (1 - progress * 0.45);
			return {
				x:
					props.x +
					(ember.source.x + Math.sin(clock * 0.7 + ember.phase) * ember.sway * progress) *
						props.width,
				y: props.y + (ember.source.y - ember.rise * progress) * props.height,
				size,
				// Fade in off the source and out as it cools, so nothing pops at either
				// end of the run.
				alpha: ember.alpha * intensity * Math.sin(progress * Math.PI) ** 0.7,
				color: ember.color,
			};
		}),
	);
</script>

{#each placed as ember, index (index)}
	<Sprite
		key="fxGlow"
		anchor={0.5}
		x={ember.x}
		y={ember.y}
		width={ember.size}
		height={ember.size}
		tint={ember.color}
		blendMode="add"
		alpha={ember.alpha}
	/>
{/each}
