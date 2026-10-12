<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	type Props = { x?: number; y?: number; scale?: number; delay?: number; flavour?: 'gold' | 'jungle'; oncomplete?: () => void };
	const props: Props = $props();
	const INK = 0x283a34;
	const PAPER = 0xefeadc;
	const LEAF = 0x6c9581;
	const ROSE = 0xbd9393;
	const DURATION = 720;
	const pieces = Array.from({ length: 8 }, (_, i) => ({
		angle: -Math.PI * .86 + i * Math.PI * 1.72 / 7,
		delay: (i % 3) * 28,
		life: 500 + (i % 3) * 65,
	}));
	let t = $state(-1);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now + (props.delay ?? 0);
			t = now < start ? -1 : Math.min(1, (now - start) / DURATION);
			if (t >= 1) { props.oncomplete?.(); return; }
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const pose = (piece: (typeof pieces)[number], index: number) => {
		const age = t * DURATION - piece.delay;
		const p = age / piece.life;
		if (p <= 0 || p >= 1) return null;
		const s = props.scale ?? 1;
		const distance = (12 + 72 * (1 - (1 - p) ** 2)) * s;
		return {
			x: Math.cos(piece.angle) * distance + Math.sin(p * 5 + index) * 5 * p * s,
			y: Math.sin(piece.angle) * distance + 54 * p * p * s,
			rotation: piece.angle + (index % 2 ? -.9 : .9) * p,
			size: (13 + index % 3 * 3) * s,
			alpha: Math.min(1, p * 8) * (1 - p) ** .75,
		};
	};

	const drawPiece = (g: PixiGraphics, index: number, size: number) => {
		g.clear();
		if (index % 3 === 0) {
			// Folded paper slips carry the graphic style of the tea-house signs.
			g.poly([-size * .4, -size * .17, size * .3, -size * .22, size * .42, size * .16, -size * .29, size * .22])
				.fill(PAPER).stroke({ color: INK, width: 1.8 });
			g.moveTo(-size * .24, 0).lineTo(size * .24, 0).stroke({ color: ROSE, width: 1.5 });
		} else {
			// Flat tea leaves, with one hand-drawn vein and no light layer.
			g.ellipse(0, 0, size * .42, size * .22).fill(LEAF).stroke({ color: INK, width: 1.8 });
			g.moveTo(-size * .34, 0).lineTo(size * .31, 0).stroke({ color: INK, width: 1.2 });
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if t >= 0 && t < 1}
		{#each pieces as piece, index (index)}
			{@const p = pose(piece, index)}
			{#if p}
				<Container x={p.x} y={p.y} rotation={p.rotation} alpha={p.alpha}>
					<Graphics draw={(g) => drawPiece(g, index, p.size)} />
				</Container>
			{/if}
		{/each}
	{/if}
</Container>
