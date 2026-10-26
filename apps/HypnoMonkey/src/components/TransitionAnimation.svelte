<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { GAZE_COLOR } from '../game/constants';

	/** Day/dusk crossfades in Background; this bounded gaze only accents it. */
	type Props = { oncomplete: () => void; oncover?: () => void };
	const props: Props = $props();
	const context = getContext();
	const TOTAL_MS = 1000;
	let t = $state(0);
	onMount(() => {
		let raf = 0;
		let complete = false;
		let midpoint = false;
		const start = performance.now();
		const finish = () => {
			if (complete) return;
			complete = true;
			if (!midpoint) props.oncover?.();
			props.oncomplete();
		};
		context.eventEmitter.broadcast({ type: 'soundTransitionBlast' });
		const tick = (now: number) => {
			t = Math.min(1, (now - start) / TOTAL_MS);
			if (!midpoint && t >= 0.5) {
				midpoint = true;
				props.oncover?.();
			}
			if (t >= 1) finish();
			else raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		const fallback = setTimeout(finish, TOTAL_MS + 100);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(fallback);
		};
	});
	const sizes = $derived(context.stateLayoutDerived.canvasSizes());
</script>

<Container>
	{#each [-1, 1] as side (side)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={sizes.width * 0.5 + side * Math.min(sizes.width * 0.045, 80)}
			y={sizes.height * 0.22}
			width={Math.min(sizes.width * 0.14, 180)}
			height={Math.min(sizes.height * 0.055, 60)}
			tint={GAZE_COLOR}
			blendMode="add"
			alpha={0.6 * Math.sin(Math.PI * t)}
		/>
	{/each}
</Container>
