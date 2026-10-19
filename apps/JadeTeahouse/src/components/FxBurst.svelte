<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	// flavour 'tea' (splashes, big wins): the drawn particle art from
	// design/build_splash_parts.py — tea leaves, gold cloud scrolls, petals, one
	// jade cup and a puff of steam. Anything else keeps the original flat ink
	// leaves and paper slips (scatter landings, the entry reveal).
	type Props = { x?: number; y?: number; scale?: number; delay?: number; flavour?: 'gold' | 'jungle' | 'tea'; oncomplete?: () => void };
	const props: Props = $props();
	const tea = props.flavour === 'tea';
	const INK = 0x283a34;
	const PAPER = 0xefeadc;
	const LEAF = 0x6c9581;
	const ROSE = 0xbd9393;
	const DURATION = tea ? 900 : 720;
	const COUNT = tea ? 13 : 8;
	// which art each tea piece is: mostly leaves, a few clouds and petals, one cup
	const TEA_KEYS = ['fxTeaLeaf0', 'fxCloud0', 'fxTeaLeaf1', 'jtPetal', 'fxTeaLeaf2', 'fxCloud1', 'fxTeaLeaf3', 'gbP', 'fxTeaLeaf0', 'jtPetal', 'fxCloud2', 'fxTeaLeaf1', 'fxTeaLeaf2'];
	const TEA_SIZE: Record<string, number> = { fxCloud0: 30, fxCloud1: 28, fxCloud2: 30, jtPetal: 13, gbP: 26 };
	const pieces = Array.from({ length: COUNT }, (_, i) => ({
		angle: -Math.PI * 0.86 + (i * Math.PI * 1.72) / (COUNT - 1),
		delay: (i % 3) * 28,
		life: (tea ? 620 : 500) + (i % 3) * 65,
		reach: tea ? 0.8 + ((i * 37) % 7) / 14 : 1,
		spin: (i % 2 ? -1 : 1) * (tea ? 2.4 + (i % 3) * 0.6 : 0.9),
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
		const distance = (12 + 72 * piece.reach * (1 - (1 - p) ** 2)) * s;
		return {
			x: Math.cos(piece.angle) * distance + Math.sin(p * 5 + index) * 5 * p * s,
			y: Math.sin(piece.angle) * distance + 54 * p * p * s,
			rotation: piece.angle + piece.spin * p,
			size: (13 + index % 3 * 3) * s,
			alpha: Math.min(1, p * 8) * (1 - p) ** .75,
		};
	};

	// a puff of steam off the impact: rises, widens, thins
	const steam = $derived.by(() => {
		if (!tea || t < 0) return null;
		const k = Math.min(1, t / 0.9);
		const s = props.scale ?? 1;
		return { y: -30 * k * s, size: (60 + 60 * k) * s, alpha: 0.55 * Math.sin(Math.PI * Math.min(1, k * 1.1)) };
	});

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
		{#if steam}
			<Sprite key="fxSteam" anchor={{ x: 0.5, y: 0.85 }} y={steam.y} width={steam.size} height={steam.size} alpha={steam.alpha} />
		{/if}
		{#each pieces as piece, index (index)}
			{@const p = pose(piece, index)}
			{#if p}
				<Container x={p.x} y={p.y} rotation={p.rotation} alpha={p.alpha}>
					{#if tea}
						{@const key = TEA_KEYS[index % TEA_KEYS.length]}
						{@const w = (TEA_SIZE[key] ?? 24) * (props.scale ?? 1) * (0.85 + (index % 3) * 0.12)}
						<Sprite {key} anchor={0.5} width={w} height={key === 'gbP' || key === 'jtPetal' ? w : w * 0.42} />
					{:else}
						<Graphics draw={(g) => drawPiece(g, index, p.size)} />
					{/if}
				</Container>
			{/if}
		{/each}
	{/if}
</Container>
