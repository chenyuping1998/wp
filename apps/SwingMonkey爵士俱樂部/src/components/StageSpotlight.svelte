<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { BlurFilter } from 'pixi.js';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';

	type Plate = { x: number; y: number; width: number; height: number };
	const props: { parallax: Plate } = $props();
	const context = getContext();
	let clock = $state(0);
	let winAt = $state(-1);
	let strength = $state(0);
	const elapsed = $derived(clock - winAt);
	const pulse = $derived(winAt < 0 || elapsed < 0 || elapsed > 1800 ? 0
		: Math.sin(Math.PI * elapsed / 1800) ** 2);
	const opacity = $derived(pulse * strength * (0.13 + 0.02 * Math.sin(clock / 190)));
	const softEdge = [new BlurFilter({ strength: 42, quality: 2 })];

	context.eventEmitter.subscribeOnMount({
		backgroundWin: ({ amount }) => {
			if (amount <= 0) return;
			winAt = performance.now();
			strength = Math.min(1, 0.6 + Math.log10(1 + amount / 100) * 0.18);
		},
	});

	onMount(() => {
		let frame = 0;
		const tick = (now: number) => { clock = now; frame = requestAnimationFrame(tick); };
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<!-- The printed stage already has one warm spotlight: only its intensity breathes on a win. -->
<Container x={props.parallax.x} y={props.parallax.y}
	scale={{ x: props.parallax.width / 1920, y: props.parallax.height / 1080 }}>
	<Graphics alpha={opacity} filters={softEdge} draw={(g) => {
		g.clear();
		g.ellipse(610, 407, 315, 305).fill({ color: 0xffd8a2, alpha: 0.56 });
	}} />
</Container>
