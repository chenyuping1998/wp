<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	// One-shot hit burst for a Scatter landing and the board's entry reveal,
	// drawn in the game's printed medium: a hard comic impact star in paper
	// with an ink rim, short ink speed slashes, and two broken radio arcs. It
	// used to be a soft additive glow, gold stars and (from Go Banandit's
	// jungle) leaf shards — the light-and-sparkle look that reads as generic
	// generated slot art (game-reskin art-direction tell 4). Same API and the
	// same 850 ms, so nothing that waits on it is retimed.
	type Props = {
		x?: number;
		y?: number;
		// overall size multiplier — 1 fits one symbol cell
		scale?: number;
		delay?: number;
		// 'paper' for a landing, 'signal' (green arcs, more slashes) for the reveal
		flavour?: 'paper' | 'signal';
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 850;
	const INK = 0x15191f;
	const PAPER = 0xe5e2d6;
	const AMBER = 0xe7aa53;
	const SIGNAL = 0xb8d080;

	// fixed per burst, so a burst never shimmers frame to frame
	const seed = Math.random() * 1000;
	const jag = (i: number) => 0.62 + 0.38 * Math.abs(Math.sin(seed + i * 2.399));
	const POINTS = 14;
	const slashes = Array.from({ length: props.flavour === 'signal' ? 14 : 10 }, (_, i) => ({
		angle: (i / (props.flavour === 'signal' ? 14 : 10)) * Math.PI * 2 + Math.sin(seed + i) * 0.18,
		len: 0.7 + 0.3 * Math.abs(Math.sin(seed * 1.7 + i)),
		delay: Math.abs(Math.sin(seed * 0.7 + i)) * 0.08,
	}));

	let t = $state(-1); // -1 = waiting out the delay

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

	const easeOut = (p: number) => 1 - (1 - p) ** 3;

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (t < 0 || t >= 1) return;
		const s = props.scale ?? 1;
		const ms = t * DURATION;

		// impact star: pops past size in 110 ms, holds, then shrinks out by 420 ms
		if (ms < 420) {
			const pop = ms < 110 ? easeOut(ms / 110) * 1.12 : ms < 180 ? 1.12 - 0.12 * ((ms - 110) / 70) : 1 - 0.55 * ((ms - 180) / 240);
			const R = 62 * s * pop;
			const pts: number[] = [];
			for (let i = 0; i < POINTS * 2; i++) {
				const a = (i / (POINTS * 2)) * Math.PI * 2 + seed;
				const r = i % 2 ? R * 0.52 : R * jag(i);
				pts.push(Math.cos(a) * r, Math.sin(a) * r);
			}
			const alpha = ms < 300 ? 1 : 1 - (ms - 300) / 120;
			g.poly(pts).fill({ color: PAPER, alpha: 0.92 * alpha }).stroke({ width: 4 * s, color: INK, alpha, join: 'miter' });
			// one inner tone, not a gradient
			const inner = pts.map((v) => v * 0.58);
			g.poly(inner).fill({ color: props.flavour === 'signal' ? SIGNAL : AMBER, alpha: 0.85 * alpha });
		}

		// ink speed slashes: thin wedges thrown outward, each with a hard ink edge
		for (const sl of slashes) {
			const p = (t - sl.delay) / 0.62;
			if (p <= 0 || p >= 1) continue;
			const r0 = (40 + 70 * easeOut(p)) * s;
			const r1 = r0 + 34 * sl.len * s * (1 - p * 0.6);
			const w = 0.05 * (1 - p);
			const a = sl.angle;
			const tri = [
				Math.cos(a - w) * r0, Math.sin(a - w) * r0,
				Math.cos(a) * r1, Math.sin(a) * r1,
				Math.cos(a + w) * r0, Math.sin(a + w) * r0,
			];
			g.poly(tri).fill({ color: PAPER, alpha: 1 - p }).stroke({ width: 1.5 * s, color: INK, alpha: 1 - p });
		}

		// two broken radio arcs going out on each side
		for (const [delayP, width] of [[0.05, 4], [0.22, 2.5]] as const) {
			const p = (t - delayP) / (1 - delayP);
			if (p <= 0 || p >= 1) continue;
			const r = (34 + 92 * easeOut(p)) * s;
			const color = props.flavour === 'signal' ? SIGNAL : PAPER;
			for (const side of [0, Math.PI]) {
				g.moveTo(Math.cos(side - 0.42) * r, Math.sin(side - 0.42) * r);
				g.arc(0, 0, r, side - 0.42, side + 0.42).stroke({ width: width * s * (1 - p * 0.5), color, alpha: (1 - p) * 0.8 });
			}
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0}>
	<Graphics {draw} />
</Container>
