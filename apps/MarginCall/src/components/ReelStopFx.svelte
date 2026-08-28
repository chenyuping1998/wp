<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { SYMBOL_SIZE } from '../game/constants';

	// A reel landing, as a trading terminal would show it.
	//
	// This replaces ImpactDust, which threw a cone of SAND - literally beige
	// (0xd9c9a0, 0xe8dcb8, 0xc2ae82) puffing off the floor of the reel. That is
	// the vocabulary of a desert or a mine, inherited from the game this project
	// started from, and nothing on a trading floor kicks up dust.
	//
	// Two things happen instead, and both are line-and-light rather than
	// particles - which matters because five reels land within about a second and
	// particles from five columns smear into one cloud, whereas lines stay legible:
	//
	//   PRINT  a quote is confirmed: a bright rule snaps across the reel's width
	//          at the landing line, arriving wide and soft and contracting to a
	//          crisp line before it fades
	//   SURGE  the hardware registers it: a pulse of light runs down the milled
	//          groove on either side of the column
	type Props = {
		x?: number;
		/** the landing line - the floor of the reel */
		y?: number;
		/** full column height, for the rail surge */
		height?: number;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 340;
	const PALE = 0xeafff2;
	const BULL = 0x4bd67f;

	let t = $state(0);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = Math.min(1, (now - start) / DURATION);
			if (t >= 1) {
				props.oncomplete?.();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
	const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;

	const half = SYMBOL_SIZE * 0.5;

	const draw = (g: PixiGraphics) => {
		g.clear();
		const columnHeight = props.height ?? SYMBOL_SIZE * 3;

		// ── PRINT ────────────────────────────────────────────────────────────
		// Arrives overhanging the cell and contracts onto it: the snap inward is
		// what reads as "locked", where a line that simply faded in would read as
		// a glow.
		const p = clamp01(t / 0.55);
		const overhang = 1.5 - 0.5 * easeOut(p);
		const w = half * overhang;
		const fade = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;

		// soft bed under the rule, so it has weight without a particle in sight
		g.rect(-w, -5, w * 2, 10);
		g.fill({ color: BULL, alpha: 0.16 * fade });
		// the rule itself
		g.moveTo(-w, 0);
		g.lineTo(w, 0);
		g.stroke({ width: 2.5, color: PALE, alpha: 0.9 * fade });
		// the print mark at the centre
		const dot = (1 - easeOut(p)) * 5 + 2;
		g.circle(0, 0, dot);
		g.fill({ color: PALE, alpha: 0.85 * fade });

		// ── SURGE ────────────────────────────────────────────────────────────
		// A pulse down each groove. The grooves are drawn into the reel well art
		// (design/generate_theme.mjs, frameBg), so this lights hardware that is
		// already there rather than inventing a new element.
		const sp = clamp01((t - 0.05) / 0.7);
		if (sp > 0 && sp < 1) {
			const headY = -columnHeight + columnHeight * easeOut(sp);
			const tailY = headY - columnHeight * 0.22;
			for (const side of [-1, 1]) {
				const x = side * half;
				g.moveTo(x, Math.max(-columnHeight, tailY));
				g.lineTo(x, headY);
			}
			g.stroke({ width: 3, color: BULL, alpha: 0.55 * (1 - sp) });
			// a brighter head on the pulse
			for (const side of [-1, 1]) {
				g.circle(side * half, headY, 3.5);
			}
			g.fill({ color: PALE, alpha: 0.7 * (1 - sp) });
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if t < 1}
		<Graphics {draw} />
	{/if}
</Container>
