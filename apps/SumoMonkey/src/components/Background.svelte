<script lang="ts">
	import { Graphics, Rectangle, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import SumoArenaLife from './SumoArenaLife.svelte';

	const context = getContext();
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
	const showFeatureBackground = $derived(context.stateGame.gameType === 'freegame');

	let clock = $state(0);

	// Slow drift over a small overscan so the flat poster plate is not dead still.
	// COVER, not stretch: the plates are 16:9 and keep their aspect on every
	// layout, cropped about the centre; the drift only uses the overscan margin.
	//
	// No motes, no light shafts: a screenprint poster has neither, and anything
	// glowing on it reads as a different medium (ART_BRIEF.md §0).
	const OVERSCAN = 1.06;
	const PLATE = [1920, 1080];
	const parallax = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const cover = Math.max(width / PLATE[0], height / PLATE[1]);
		const w = PLATE[0] * cover * OVERSCAN;
		const h = PLATE[1] * cover * OVERSCAN;
		const driftX = (width * (OVERSCAN - 1)) / 2;
		const driftY = (height * (OVERSCAN - 1)) / 2;
		return {
			width: w,
			height: h,
			x: (width - w) / 2 + Math.sin(clock * 0.06) * driftX,
			y: (height - h) / 2 + Math.sin(clock * 0.041 + 1.1) * driftY,
		};
	});

	// PLATE LIFE, drawn in the plate's own 1920×1080 pixels and carried by the
	// same cover + drift as the plate, so nothing slides across the painting.
	// Review 2026-11-03 (5.3): the arena read as a still print. The painted
	// balcony lanterns now breathe with candle light, and the left stand's crowd
	// waves uchiwa fans over the rail in turn. The right stand stays still: the
	// rikishi stands in front of it (cast-reads-off-background).
	const LANTERNS: [number, number, number][] = [
		[22, 315, 30], [100, 360, 28], [168, 395, 26], [222, 425, 24], [268, 450, 22], [312, 470, 20],
		[1895, 305, 30], [1818, 360, 28], [1750, 395, 26], [1698, 425, 24], [1650, 450, 22], [1606, 470, 20],
	];
	const FANS: [number, number][] = [[48, 640], [122, 655], [196, 648], [262, 668], [318, 662], [86, 690], [230, 700]];
	const FAN_CYCLE = 5.6;
	const drawLife = (g: PixiGraphics) => {
		g.clear();
		const t = clock;
		for (const [i, [x, y, r]] of LANTERNS.entries()) {
			const flicker = 0.5 + 0.3 * Math.sin(t * 2.3 + i * 1.9) + 0.2 * Math.sin(t * 7.1 + i * 3.3);
			g.ellipse(x, y + r * 0.15, r * 1.9, r * 2.2).fill({ color: 0xf0a07a, alpha: 0.1 + 0.16 * flicker });
			g.ellipse(x, y + r * 0.15, r * 0.95, r * 1.25).fill({ color: 0xffd9b8, alpha: 0.1 + 0.22 * flicker });
		}
		for (const [i, [x, y]] of FANS.entries()) {
			// each fan rises over the rail for 1.8s of its 5.6s turn, staggered
			const p = (((t + i * (FAN_CYCLE / FANS.length) * 2.3) % FAN_CYCLE) + FAN_CYCLE) % FAN_CYCLE;
			if (p > 1.8) continue;
			const u = p / 1.8;
			const up = Math.sin(Math.PI * u);
			const lift = 60 * Math.min(1, up * 1.6);
			const a = Math.sin(u * Math.PI * 5) * 0.45 * up + (i % 2 ? 0.15 : -0.15);
			const bx = x, by = y - lift;
			const hx = bx + Math.sin(a) * 46, hy = by - Math.cos(a) * 46;
			g.moveTo(bx, by + 30).lineTo(hx, hy).stroke({ width: 8, color: 0x282828, alpha: Math.min(1, up * 2) });
			g.ellipse(hx + Math.sin(a) * 26, hy - Math.cos(a) * 26, 32, 28)
				.fill({ color: 0xefeadc, alpha: Math.min(1, up * 2) })
				.stroke({ width: 5, color: 0x282828, alpha: Math.min(1, up * 2) });
			g.circle(hx + Math.sin(a) * 26, hy - Math.cos(a) * 26, 11).fill({ color: 0xc47d60, alpha: Math.min(1, up * 2) });
		}
	};

	// requestAnimationFrame, not setInterval: the review checker flags interval
	// animation, and rAF stops with the tab instead of piling up.
	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			clock += Math.min(now - last, 100) / 1000;
			last = now;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<!-- paper colour under everything, so a crop edge is never black -->
<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0xefeadc} zIndex={-3} />

<FadeContainer show={showBaseBackground} duration={SECOND} zIndex={-2}>
	<Sprite key="gbBgBase" {...parallax} alpha={.84} />
</FadeContainer>

<FadeContainer show={showFeatureBackground} duration={SECOND} zIndex={-1}>
	<Sprite key="gbBgFeature" {...parallax} alpha={.84} />
</FadeContainer>

<Graphics
	x={parallax.x}
	y={parallax.y}
	scale={parallax.width / PLATE[0]}
	zIndex={-0.75}
	alpha={.84}
	draw={drawLife}
	eventMode="none"
/>

<SumoArenaLife />
