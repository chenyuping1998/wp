<script lang="ts">
	/**
	 * THE CHEST BEAT, AS A CLUB LIGHT SHOW (replaces GoBoomana's CaveRockfall).
	 *
	 * When a feature triggers he beats his chest six times while the Scatters
	 * ring. In the mine the roof answered with grit and falling rocks; here the
	 * club answers: every strike is a bass drop.
	 *
	 *   back   (between the background and the board)
	 *          LASERS fan down from the two top corners and sweep, a pair per
	 *          strike in alternating pink and cyan, harder each time; and a BASS
	 *          RING pulses out from the middle of the screen on each strike,
	 *          seen round the board's edges
	 *   front  (over the board) NEON GLITTER: little diamonds of light shaken
	 *          loose on each strike, drifting down the two sides and twinkling,
	 *          a few crossing the board; and a light bar flashing along the top
	 *          edge on each strike
	 *
	 * Same clock as before (game/caveQuake.svelte.ts): the camera still jolts on
	 * each strike, which reads as the bass hitting the room.
	 */
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { caveQuake, strikeAt, QUAKE_BEATS, QUAKE_MS } from '../game/caveQuake.svelte';

	type Props = { layer: 'back' | 'front' };
	const props: Props = $props();
	const context = getContext();

	const PINK = 0xff3fd0;
	const CYAN = 0x35e9ff;
	const VIOLET = 0xb143ec;
	const NEONS = [PINK, CYAN, VIOLET, 0xffffff];

	const isBack = $derived(props.layer === 'back');

	const seeded = (seed: number) => {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return s / 2147483647;
		};
	};

	type Glitter = { at: number; x: number; size: number; drift: number; speed: number; phase: number; color: number };
	// seeded, so a light show is the same show every time
	const glitter: Glitter[] = (() => {
		const rand = seeded(9241);
		const out: Glitter[] = [];
		for (let s = 0; s < QUAKE_BEATS; s++) {
			for (let k = 0; k < 9; k++) {
				const side = rand();
				out.push({
					at: strikeAt(s) + rand() * 160,
					// mostly down the sides, one in four across the board
					x: k % 4 === 3 ? 0.3 + rand() * 0.4 : side < 0.5 ? 0.03 + rand() * 0.25 : 0.72 + rand() * 0.25,
					size: 0.006 + rand() * 0.008,
					drift: (rand() - 0.5) * 0.05,
					speed: 0.22 + rand() * 0.2,
					phase: rand() * Math.PI * 2,
					color: NEONS[Math.floor(rand() * NEONS.length) % NEONS.length],
				});
			}
		}
		return out;
	})();

	/** 0..1: how hard strike i is still ringing at time t */
	const hit = (t: number, i: number, decay = 220) => {
		const dt = t - strikeAt(i);
		return dt < 0 ? 0 : Math.exp(-dt / decay) * Math.min(1, dt / 30);
	};

	const drawBack = (g: PixiGraphics, t: number, width: number, height: number) => {
		const fadeOut = t > QUAKE_MS - 500 ? Math.max(0, (QUAKE_MS - t) / 500) : 1;
		// LASERS: from each top corner, a fan of beams sweeping across the room
		for (let i = 0; i < QUAKE_BEATS; i++) {
			const k = hit(t, i, 420) * (0.7 + 0.08 * i) * fadeOut;
			if (k < 0.02) continue;
			const color = i % 2 ? CYAN : PINK;
			const sweep = (t - strikeAt(i)) / 900;
			for (const corner of [0, 1]) {
				const ox = corner ? width : 0;
				const dir = corner ? -1 : 1;
				for (let b = 0; b < 3; b++) {
					// angle measured down from horizontal, toward the middle
					const a = 0.35 + b * 0.32 + 0.25 * Math.sin(sweep * Math.PI * 2 + b + corner);
					const len = Math.hypot(width, height);
					const ex = ox + dir * Math.cos(a) * len;
					const ey = Math.sin(a) * len;
					g.moveTo(ox, 0).lineTo(ex, ey).stroke({ width: height * 0.03, color, alpha: 0.12 * k });
					g.moveTo(ox, 0).lineTo(ex, ey).stroke({ width: height * 0.008, color, alpha: 0.5 * k });
					g.moveTo(ox, 0).lineTo(ex, ey).stroke({ width: height * 0.002, color: 0xffffff, alpha: 0.7 * k });
				}
			}
		}
		// BASS RINGS from the middle of the room
		for (let i = 0; i < QUAKE_BEATS; i++) {
			const dt = t - strikeAt(i);
			if (dt < 0 || dt > 700) continue;
			const u = dt / 700;
			const r = height * (0.25 + 0.75 * (1 - (1 - u) ** 2));
			const a = (1 - u) ** 1.6 * fadeOut;
			const color = i % 2 ? PINK : CYAN;
			g.circle(width / 2, height / 2, r).stroke({ width: height * 0.05 * (1 - u), color, alpha: 0.18 * a });
			g.circle(width / 2, height / 2, r).stroke({ width: height * 0.008, color, alpha: 0.6 * a });
		}
	};

	const drawFront = (g: PixiGraphics, t: number, width: number, height: number) => {
		// the light bar along the top edge, flashing with each strike
		let bar = 0;
		for (let i = 0; i < QUAKE_BEATS; i++) bar += hit(t, i, 160);
		if (bar > 0.02) {
			const a = Math.min(1, bar);
			g.rect(0, 0, width, height * 0.012).fill({ color: VIOLET, alpha: 0.5 * a });
			g.rect(0, 0, width, height * 0.004).fill({ color: 0xffffff, alpha: 0.8 * a });
		}
		// GLITTER: shaken loose, drifting down, twinkling
		for (const p of glitter) {
			const dt = (t - p.at) / 1000;
			if (dt < 0 || dt > 2.4) continue;
			const x = p.x * width + p.drift * width * dt + Math.sin(dt * 4 + p.phase) * width * 0.006;
			const y = -height * 0.02 + p.speed * height * dt + 0.5 * height * 0.12 * dt * dt;
			if (y > height * 1.05) continue;
			const twinkle = 0.55 + 0.45 * Math.sin(dt * 18 + p.phase);
			const a = Math.min(1, dt * 6) * (1 - dt / 2.4) * twinkle;
			const r = p.size * height;
			const spin = dt * 3 + p.phase;
			g.circle(x, y, r * 2.4).fill({ color: p.color, alpha: 0.18 * a });
			g.poly(
				[0, 1, 2, 3].flatMap((k) => {
					const ang = spin + (k * Math.PI) / 2;
					const rr = k % 2 ? r * 0.55 : r * 1.2;
					return [x + Math.cos(ang) * rr, y + Math.sin(ang) * rr];
				}),
			).fill({ color: p.color, alpha: 0.95 * a });
		}
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		const t = caveQuake.clock;
		if (t < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		if (isBack) drawBack(g, t, width, height);
		else drawFront(g, t, width, height);
	};
</script>

<Graphics {draw} />
