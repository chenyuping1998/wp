<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	type Props = { x?: number; y?: number; radius?: number; intensity?: number };
	const props: Props = $props();
	const radius = $derived(props.radius ?? 520);
	const INK = 0x283a34;
	const PAPER = 0xefeadc;
	const ROSE = 0xbd9393;
	const LEAF = 0x6c9581;
	let t = $state(0);
	const pieces = Array.from({ length: 8 }, (_, i) => ({ side: i % 2 ? 1 : -1, phase: i * .137, lane: i % 3 }));

	onMount(() => {
		let raf = 0;
		const start = performance.now();
		const tick = (now: number) => { t = (now - start) / 1000; raf = requestAnimationFrame(tick); };
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const fan = (g: PixiGraphics, side: number) => {
		g.clear();
		const p = Math.min(1, t / .46);
		const alpha = Math.max(0, 1 - Math.max(0, t - .58) / .36) * .68;
		if (alpha <= 0) return;
		const cx = side * radius * .27;
		for (let i = 0; i < 3; i++) {
			const y = radius * (-.3 + i * .22);
			const x = side * radius * (.47 + i * .06) * p;
			g.poly([cx, 0, x, y - radius * .07, x + side * radius * .035, y + radius * .06])
				.fill({ color: i === 1 ? ROSE : PAPER, alpha }).stroke({ color: INK, width: 2, alpha });
		}
	};
	const leaf = (g: PixiGraphics, size: number) => {
		g.clear();
		g.ellipse(0, 0, size * .47, size * .23).fill(LEAF).stroke({ color: INK, width: 2 });
		g.moveTo(-size * .36, 0).lineTo(size * .34, 0).stroke({ color: INK, width: 1.2 });
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	<Graphics draw={(g) => fan(g, -1)} />
	<Graphics draw={(g) => fan(g, 1)} />
	{#each pieces as piece, i (i)}
		{@const p = (t / (2.5 + piece.lane * .3) + piece.phase) % 1}
		{@const fade = Math.min(1, p * 7, (1 - p) * 7)}
		<Container x={piece.side * radius * (.72 + .04 * piece.lane) + 17 * Math.sin(p * 6 + i)}
			y={radius * (.46 - p * .95)} rotation={piece.side * (p * 1.6 + i * .2)} alpha={fade * .56}>
			<Graphics draw={(g) => leaf(g, 16 + piece.lane * 3)} />
		</Container>
	{/each}
</Container>
