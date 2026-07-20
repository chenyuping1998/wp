<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { CanvasSizeRectangle } from 'components-layout';

	import { getContext } from '../game/context';

	type Props = {
		// fires when the screen is fully covered — safe to swap the scene behind
		oncovered?: () => void;
		// fires when the curtain has fallen away and the component can unmount
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// confetti-curtain wipe: pieces flood in from the edges until the screen is
	// covered, the scene swaps behind a solid flash, then everything rains away
	// tightened from 0.62/1.55 — reviewers called the transitions sluggish
	const T_COVERED = 0.5;
	const T_TOTAL = 1.25;

	const COLORS = [0xffb833, 0xff2fa0, 0xb04ef0, 0xffe066, 0x4fc3ff, 0xff8ede];

	let seed = 4242;
	const rand = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};

	type Piece = {
		// cover-grid target (fractions of the canvas)
		tx: number;
		ty: number;
		edge: number; // 0 left, 1 right, 2 top
		delay: number;
		size: number;
		color: number;
		rotSpeed: number;
		fallVx: number;
		fallDelay: number;
	};

	const PIECES: Piece[] = Array.from({ length: 110 }, (_, i) => ({
		tx: (i % 11) / 10 + (rand() - 0.5) * 0.06,
		ty: Math.floor(i / 11) / 9 + (rand() - 0.5) * 0.08,
		edge: i % 3,
		delay: rand() * 0.22,
		size: 26 + rand() * 30,
		color: COLORS[i % COLORS.length],
		rotSpeed: (rand() - 0.5) * 14,
		fallVx: (rand() - 0.5) * 160,
		fallDelay: rand() * 0.12,
	}));

	let t = $state(0);
	let coveredFired = false;

	onMount(() => {
		let raf = 0;
		let start = 0;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_anticipation_start' });
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / 1000;
			if (!coveredFired && t >= T_COVERED) {
				coveredFired = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				props.oncovered?.();
			}
			if (t >= T_TOTAL) {
				props.oncomplete();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const easeOutCubic = (p: number) => 1 - (1 - Math.min(1, Math.max(0, p))) ** 3;

	const shade = (color: number, factor: number) => {
		const r = Math.min(255, Math.round(((color >> 16) & 255) * factor));
		const g = Math.min(255, Math.round(((color >> 8) & 255) * factor));
		const b = Math.min(255, Math.round((color & 255) * factor));
		return (r << 16) | (g << 8) | b;
	};

	// solid backing so the swap moment is fully hidden even between pieces
	const coverAlpha = $derived.by(() => {
		if (t < 0.26) return 0;
		if (t < 0.46) return (t - 0.26) / 0.2;
		if (t < 0.64) return 1;
		if (t < 0.92) return 1 - (t - 0.64) / 0.28;
		return 0;
	});

	// white flash punch right at the covered/swap beat
	const flashAlpha = $derived.by(() => {
		if (t < T_COVERED - 0.06 || t > T_COVERED + 0.24) return 0;
		const p = (t - (T_COVERED - 0.06)) / 0.3;
		return p < 0.25 ? (p / 0.25) * 0.55 : 0.55 * (1 - (p - 0.25) / 0.75);
	});

	const drawPieces = (g: PixiGraphics) => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		g.clear();
		for (const piece of PIECES) {
			let x: number;
			let y: number;
			let alpha = 1;

			if (t < T_COVERED + piece.fallDelay) {
				// flying in from the edges toward the cover grid
				const p = easeOutCubic((t - piece.delay) / 0.42);
				if (p <= 0) continue;
				const startX = piece.edge === 0 ? -80 : piece.edge === 1 ? width + 80 : piece.tx * width;
				const startY = piece.edge === 2 ? -80 : piece.ty * height - 120;
				x = startX + (piece.tx * width - startX) * p;
				y = startY + (piece.ty * height - startY) * p;
			} else {
				// raining away to reveal the new scene
				const fall = t - T_COVERED - piece.fallDelay;
				x = piece.tx * width + piece.fallVx * fall;
				y = piece.ty * height + 900 * fall * fall + 140 * fall;
				alpha = Math.max(0, 1 - fall / 0.75);
				if (alpha <= 0) continue;
			}

			const rot = t * piece.rotSpeed + piece.tx * 9;
			const cos = Math.cos(rot);
			const sin = Math.sin(rot);
			const flip = Math.sin(t * 6 + piece.ty * 13);
			const w = piece.size * (0.4 + 0.6 * Math.abs(flip));
			const h = piece.size * 0.62;
			const facing = 0.55 + 0.45 * Math.abs(flip);
			g.beginFill(shade(piece.color, 0.7 + 0.7 * facing), alpha);
			g.drawPolygon([
				x + cos * w - sin * h,
				y + sin * w + cos * h,
				x - cos * w - sin * h,
				y - sin * w + cos * h,
				x - cos * w + sin * h,
				y - sin * w - cos * h,
				x + cos * w + sin * h,
				y + sin * w - cos * h,
			]);
			g.endFill();
		}
	};
</script>

{#if coverAlpha > 0}
	<CanvasSizeRectangle backgroundColor={0x1c0a22} backgroundAlpha={coverAlpha} />
{/if}
<Graphics draw={drawPieces} />
{#if flashAlpha > 0}
	<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flashAlpha} />
{/if}
