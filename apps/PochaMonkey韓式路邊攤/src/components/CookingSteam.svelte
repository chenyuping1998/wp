<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { BlurFilter, type Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';

	type Plate = { x: number; y: number; width: number; height: number };
	const props: { parallax: Plate } = $props();
	const context = getContext();
	let clock = $state(0);
	let winAt = $state(-1);
	let strength = $state(0);
	const elapsed = $derived(clock - winAt);
	const pulse = $derived(winAt < 0 || elapsed < 0 || elapsed > 1900 ? 0
		: Math.sin(Math.PI * elapsed / 1900) ** 2);
	const breath = $derived(0.26 + 0.08 * Math.sin(clock / 920));
	const opacity = $derived(breath + pulse * strength * 0.34);
	const softEdge = [new BlurFilter({ strength: 11, quality: 2 })];

	context.eventEmitter.subscribeOnMount({
		backgroundWin: ({ amount }) => {
			if (amount <= 0) return;
			winAt = performance.now();
			strength = Math.min(1, 0.55 + Math.log10(1 + amount / 100) * 0.2);
		},
	});

	onMount(() => {
		let frame = 0;
		const tick = (now: number) => { clock = now; frame = requestAnimationFrame(tick); };
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});

	// Two soft, filled curls lie over the steam already painted above the stove.
	// No part of the plate is cut or deformed.
	const drawCurl = (g: PixiGraphics) => {
		g.clear();
		g.moveTo(-10, 0)
			.bezierCurveTo(-37, -34, 8, -64, -13, -112)
			.bezierCurveTo(-19, -127, -4, -133, 4, -113)
			.bezierCurveTo(21, -72, -25, -38, 10, 0)
			.closePath()
			.fill({ color: 0xffe3c7, alpha: 0.36 });
	};
</script>

<Container x={props.parallax.x} y={props.parallax.y}
	scale={{ x: props.parallax.width / 1920, y: props.parallax.height / 1080 }}>
	<Container filters={softEdge}>
		<Graphics x={127 + 4 * Math.sin(clock / 1250)} y={487 - 5 * Math.sin(clock / 950)}
			alpha={opacity * 0.72} draw={drawCurl} />
		<Graphics x={365 + 5 * Math.sin(clock / 1120 + 1.4)} y={504 - 6 * Math.sin(clock / 1020 + 0.8)}
			alpha={opacity} scale={{ x: 1.2, y: 1.15 }} draw={drawCurl} />
	</Container>
</Container>
