<script lang="ts">
	import { onMount } from 'svelte';
	import { Sprite } from 'pixi-svelte';

	/**
	 * Makes the fire in the painted scene actually burn.
	 *
	 * bg_background.png is a still painting in which the flames around the frame,
	 * the furnace mouth, the dragon's pour and the cracks in the floor are all the
	 * same pixels as the anvil and the flagstones. Nothing about the image can be
	 * moved without moving the stonework with it.
	 *
	 * So the fire is separated out offline (design/generate_lava_flow.mjs) into a
	 * twelve-frame loop: the picture's own heat, modulated by streaked noise that
	 * scrolls a little further each frame. Drawn additively over the scene, the hot
	 * pixels churn and the pour runs while the stone does not move at all.
	 *
	 * ── why the frames are baked ──
	 * The first version scrolled a noise texture through a heat MASK at runtime and
	 * rendered essentially nothing. In Pixi v8 a sprite mask is a filter
	 * (`AlphaMaskEffect extends FilterEffect`), so the masked container is drawn
	 * into an isolated render texture that starts transparent — and additive
	 * blending adds to what is already in the framebuffer, which in there was
	 * nothing. The light never reached the scene; a faint orange film did.
	 *
	 * Hence: no mask, no container, no filter. Four additive sprites straight into
	 * whatever is drawing this, so they blend against the painting itself.
	 */
	type Props = {
		/** The scene rect, top-left anchored — exactly as the scene Sprite is drawn. */
		x: number;
		y: number;
		width: number;
		height: number;
		/** Scales opacity. The free game runs the forge hotter. */
		intensity?: number;
	};

	const props: Props = $props();
	const intensity = $derived(props.intensity ?? 1);

	const FRAMES = 12;
	const FRAME_KEYS = Array.from(
		{ length: FRAMES },
		(_, i) => `efFlow${String(i).padStart(2, '0')}`,
	);

	// Seconds for one full pass. The frames step through exactly one period of the
	// noise, so this is also the loop, and it is deliberately slow: lava creeps.
	const LOOP_SECONDS = 3.6;

	/**
	 * Two passes over the same twelve frames at different speeds and colours.
	 *
	 * One alone reads as the whole picture brightening and dimming together. Two,
	 * at speeds that do not divide each other, interfere — and the interference is
	 * what stops the loop from being visible as a loop.
	 */
	const LAYERS = [
		{ rate: 1, phase: 0, tint: 0xff6a14, alpha: 0.6 },
		{ rate: 1.63, phase: 0.37, tint: 0xffc978, alpha: 0.34 },
	];

	let clock = $state(0);
	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const step = (now: number) => {
			// Clamped: coming back from a backgrounded tab hands you one enormous
			// delta, which would jump the fire a long way in a single frame.
			clock += Math.min(now - last, 100) / 1000;
			last = now;
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});

	/**
	 * Each layer resolves to a PAIR of frames and a blend between them.
	 *
	 * Cutting between twelve frames would strobe at this size. Cross-fading turns
	 * the twelve discrete phases back into continuous movement — the sum of the two
	 * alphas is always 1, so the layer's brightness holds steady while its pattern
	 * travels.
	 */
	const passes = $derived.by(() =>
		LAYERS.map((layer) => {
			const position = ((clock / LOOP_SECONDS) * layer.rate + layer.phase) * FRAMES;
			const index = Math.floor(position) % FRAMES;
			const blend = position - Math.floor(position);
			return {
				tint: layer.tint,
				from: FRAME_KEYS[((index % FRAMES) + FRAMES) % FRAMES],
				to: FRAME_KEYS[((index + 1) % FRAMES + FRAMES) % FRAMES],
				fromAlpha: layer.alpha * (1 - blend) * intensity,
				toAlpha: layer.alpha * blend * intensity,
			};
		}),
	);
</script>

{#each passes as pass, index (index)}
	<Sprite
		key={pass.from}
		x={props.x}
		y={props.y}
		width={props.width}
		height={props.height}
		blendMode="add"
		tint={pass.tint}
		alpha={pass.fromAlpha}
	/>
	<Sprite
		key={pass.to}
		x={props.x}
		y={props.y}
		width={props.width}
		height={props.height}
		blendMode="add"
		tint={pass.tint}
		alpha={pass.toAlpha}
	/>
{/each}
