<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	type Props = {
		x?: number;
		y?: number;
		scale?: number;
		delay?: number;
		oncomplete?: () => void;
	};
	const props: Props = $props();

	// Flat ink objects rather than the template glow, rings and star particles.
	// Keep this burst small enough to frame a symbol without hiding its drawing.
	const THEME: string = 'swing';
	const INK = 0x161412;
	const PAPER = 0xf3e9d2;
	const ACCENT = 0xd9342b;
	const SECOND = 0x4a4038;
	const DURATION = 760;
	const pieces = Array.from({ length: 9 }, (_, i) => ({
		angle: (i * Math.PI * 2) / 9 + ((i * 7) % 5 - 2) * 0.06,
		delay: (i % 3) * 34,
		life: 530 + (i % 3) * 55,
	}));
	let t = $state(-1);

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

	const pose = (piece: (typeof pieces)[number], index: number) => {
		const age = t * DURATION - piece.delay;
		const p = age / piece.life;
		if (p <= 0 || p >= 1) return null;
		const s = props.scale ?? 1;
		const distance = (14 + 62 * p) * s;
		return {
			x: Math.cos(piece.angle) * distance * .7 + Math.sin(p * 7 + index) * 8 * p * s,
			y: Math.sin(piece.angle) * 20 * s - 86 * p * s,
			size: (13 + (index % 3) * 4) * s * (1 - 0.18 * p),
			rotation: Math.sin(p * 5 + index) * .24,
			alpha: Math.min(1, p / 0.13) * (1 - p) ** 1.15,
		};
	};

	const drawPiece = (g: PixiGraphics, index: number, size: number) => {
		g.clear();
		const color = index % 3 === 0 ? ACCENT : index % 3 === 1 ? SECOND : PAPER;
		if (THEME === 'strike') {
			// Little bowling pins, not light rays.
			g.circle(0, -size * 0.34, size * 0.13).fill(PAPER).stroke({ color: INK, width: 1.8 });
			g.poly([-size * 0.12, -size * 0.22, size * 0.12, -size * 0.22, size * 0.22, size * 0.3,
				-size * 0.22, size * 0.3]).fill(PAPER).stroke({ color: INK, width: 1.8 });
			g.rect(-size * 0.12, -size * 0.13, size * 0.24, size * 0.055).fill(ACCENT);
		} else if (THEME === 'mardi') {
			// Parade beads and a few folded paper streamers.
			if (index % 3 === 0) {
				g.poly([-size * 0.5, -size * 0.16, size * 0.3, -size * 0.16, size * 0.5, size * 0.16,
					-size * 0.3, size * 0.16]).fill(color).stroke({ color: INK, width: 1.6 });
			} else {
				g.circle(0, 0, size * 0.27).fill(color).stroke({ color: INK, width: 1.7 });
			}
		} else if (THEME === 'diner') {
			// Order tickets and small counter checks.
			g.roundRect(-size * 0.32, -size * 0.35, size * 0.64, size * 0.7, 2)
				.fill(PAPER).stroke({ color: INK, width: 1.8 });
			g.rect(-size * 0.22, -size * 0.19, size * 0.44, size * 0.12).fill(color);
		} else if (THEME === 'pocha') {
			// Tiny bowls and chopstick marks.
			g.ellipse(0, size * 0.08, size * 0.36, size * 0.2).fill(PAPER).stroke({ color: INK, width: 1.8 });
			g.moveTo(-size * 0.28, -size * 0.25).lineTo(size * 0.14, -size * 0.05)
				.stroke({ color, width: 2.2 });
			g.moveTo(-size * 0.17, -size * 0.31).lineTo(size * 0.23, -size * 0.1)
				.stroke({ color: INK, width: 1.6 });
		} else {
			// Flat music notes, with no glow or sparkle layer.
			g.ellipse(-size * 0.12, size * 0.19, size * 0.24, size * 0.15).fill(color);
			g.rect(size * 0.06, -size * 0.38, size * 0.075, size * 0.53).fill(INK);
			g.poly([size * 0.13, -size * 0.38, size * 0.4, -size * 0.2, size * 0.13, -size * 0.12])
				.fill(color);
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
