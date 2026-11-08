/**
 * EACH SAUCER SYMBOL'S HIT — LIGHT ON THE PAINTING, NOT SHAPES ON TOP OF IT.
 *
 * 2026-11-06 (user: 動態跟動畫跟音效節奏要更強，不要有粗糙的光暈或亮點). The 10-31 pass printed its hits as
 * extra drawings — halftone halos, comic starbursts, dashed signal rings, radio arcs, static zig-zags, rim-light
 * dots. Each one read as a cheap effect sitting on a professional painting (memory no-sparkle-particles). All of it
 * is gone. What is left is light that falls ON the art, plus the few things the object physically does:
 *
 *   flash   the acting part (its own mesh triangles) drawn again additive, inside its own outline only
 *   rim     the whole subject drawn again additive, pulsing with the act's beats (slot-motion-recipes §1.2 layer 5:
 *           0 → peak → 0 on the hit, a smaller one on the landing)
 *   gloss   a feathered light band sweeping the glossy shape (glass, chrome), clipped to it, additive
 *   H1      the ray gun's bolt: a clean tapered beam that leaves the picture (the gun really fires)
 *   H4      the soda really fizzes: bubbles out of the neck, drops sprayed on the landing — flat, no highlights
 *   S       the saucer's tractor beam: a pale wash with inked sides and a light sweeping down it
 *
 * Deterministic in t (ms of the win at normal speed), so it can be stepped offline; 256-canvas coordinates.
 */
import type { Graphics } from 'pixi.js';
import type { Point } from './meshRig';

export const INK = 0x141a33, CREAM = 0xf6eed6, GREEN = 0x86e35b;
const TAU = Math.PI * 2;

export type At = (bone: string, p: Point) => Point;
export type SaucerFx = {
	/** the parts that flash, and how hard (0..1) at t */
	flash: { bones: string[]; at: (t: number) => number; tint: number };
	/** the whole subject's additive copy, 0..1 at t (kept low: it is a lift, not a wash) */
	rim: (t: number) => number;
	/** a feathered light band across a glossy shape: the shape (convex, canvas px) and the bone it rides */
	gloss?: { bone: string; shape: Point[]; from: number; to: number; angle: number; peak?: number };
	/** drawn under the subject */
	back?: (g: Graphics, t: number, at: At) => void;
	/** drawn over the subject */
	front?: (g: Graphics, t: number, at: At) => void;
};

// ── timing helpers ──────────────────────────────────────────────────────────
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const u = clamp(v); return u * u * (3 - 2 * u); };
const out3 = (v: number) => 1 - (1 - clamp(v)) ** 3;
/** 0 → 1 over [a, a+inMs], held, 1 → 0 over the last outMs before b */
const env = (t: number, a: number, b: number, inMs = 60, outMs = 120) => (t < a || t > b ? 0 : Math.min(out3((t - a) / inMs), ease((b - t) / outMs)));
/** a light hit: arrives fast, leaves slow (attack 15% of life) */
const hit = (t: number, a: number, life: number) => {
	const u = (t - a) / life;
	if (u <= 0 || u >= 1) return 0;
	return u < 0.15 ? out3(u / 0.15) : (1 - ease((u - 0.15) / 0.85)) ** 1.4;
};
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** convex clip (Sutherland–Hodgman), both convex, counter-clockwise or clockwise alike */
export const clip = (subject: Point[], region: Point[]): Point[] => {
	let out = subject;
	const area = region.reduce((s, p, i) => { const q = region[(i + 1) % region.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
	const side = (a: Point, b: Point, p: Point) => ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) * Math.sign(area);
	for (let i = 0; i < region.length && out.length; i++) {
		const a = region[i], b = region[(i + 1) % region.length], input = out;
		out = [];
		for (let j = 0; j < input.length; j++) {
			const p = input[j], q = input[(j + 1) % input.length], sp = side(a, b, p), sq = side(a, b, q);
			if (sp >= 0) out.push(p);
			if (sp * sq < 0) { const k = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]); }
		}
	}
	return out;
};
export const ellipse = (c: Point, rx: number, ry: number, n = 28): Point[] => Array.from({ length: n }, (_, i) => [c[0] + Math.cos((i / n) * TAU) * rx, c[1] + Math.sin((i / n) * TAU) * ry] as Point);

/**
 * The gloss band at progress u (0..1 across the shape): STRIPS thin slices whose alphas follow a bell, so the band
 * has no hard edge — it reads as light rolling over glass, not as a white bar. Each slice is clipped to the shape.
 * Returns [polygon, relative alpha 0..1] pairs in canvas px.
 */
const STRIPS = 9, BAND = 34;
export const glossBand = (shape: Point[], u: number, angle: number): [Point[], number][] => {
	const xs = shape.map((p) => p[0]), ys = shape.map((p) => p[1]);
	const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
	const reach = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + BAND;
	const a = (angle * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
	const along = -reach + u * reach * 2;
	const w = BAND / STRIPS;
	const out: [Point[], number][] = [];
	for (let i = 0; i < STRIPS; i++) {
		const s = along - BAND / 2 + i * w, k = (i + 0.5) / STRIPS - 0.5;
		// a bell, slightly brighter on the leading side, like a highlight rolling round a curve
		const alpha = Math.exp(-((k + 0.06) ** 2) / 0.045);
		const quad: Point[] = [[-reach, s], [reach, s], [reach, s + w + 0.4], [-reach, s + w + 0.4]];
		const poly = clip(quad.map(([p, q]) => [cx + ux * p + vx * q, cy + uy * p + vy * q] as Point), shape);
		if (poly.length >= 3) out.push([poly, alpha]);
	}
	return out;
};

// ── the symbols (beats from saucerWins.ts) ─────────────────────────────────
const B = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160 };

/** the act's rim light: the hit, and a smaller lift on the landing */
const beatRim = (hitAt: number, peak = 0.2) => (t: number) => peak * hit(t, hitAt, 420) + peak * 0.6 * hit(t, B.land, 360);

export const SAUCER_FX: Record<string, SaucerFx> = {
	H1: {
		flash: { bones: ['coil'], tint: 0xd8ffc0, at: (t) => 0.35 * env(t, B.crouch, B.rise + 40, 200, 30) + 0.75 * hit(t, B.rise + 40, 320) },
		rim: beatRim(B.rise + 40, 0.22),
		gloss: { bone: 'body', shape: [[128, 76], [204, 74], [222, 94], [204, 120], [132, 120]], from: B.land - 20, to: B.land + 380, angle: -58 },
		front: (g, t, at) => {
			// the bolt: shoots out of the muzzle and leaves the picture, its tail chasing it, tapering as it goes
			const fire = B.rise + 40, ball = at('coil', [36, 68]), back = at('coil', [96, 86]);
			const dir = Math.atan2(ball[1] - back[1], ball[0] - back[0]);
			const head = clamp((t - fire) / 70) * 190 + Math.max(0, t - fire - 70) * 0.9, tail = Math.max(0, (t - fire - 80) * 1.5);
			if (t <= fire || tail >= head || tail >= 260) return;
			const p = (d: number): Point => [ball[0] + Math.cos(dir) * d, ball[1] + Math.sin(dir) * d];
			const w = 1 - clamp((t - fire - 100) / 170);
			const [a, b] = [p(tail), p(Math.min(head, 260))];
			g.moveTo(...a).lineTo(...b).stroke({ width: 11 * w + 3, color: INK, cap: 'round' });
			g.moveTo(...a).lineTo(...b).stroke({ width: 7 * w + 1.2, color: GREEN, cap: 'round' });
		},
	},
	H2: {
		flash: { bones: ['antenna'], tint: 0xfff0d0, at: (t) => 0.6 * hit(t, B.rise - 60, 360) + 0.5 * hit(t, B.land, 340) },
		rim: beatRim(B.rise - 60),
		gloss: { bone: 'body', shape: ellipse([124, 118], 80, 74), from: B.rise - 20, to: B.fall + 40, angle: -55, peak: 0.42 },
	},
	H3: {
		flash: { bones: ['tip'], tint: 0xf0f6ff, at: (t) => 0.55 * hit(t, B.rise - 40, 320) + 0.45 * hit(t, B.fall, 320) },
		rim: beatRim(B.rise - 40),
		// the foil catches the light as it tunes in
		gloss: { bone: 'body', shape: [[132, 44], [222, 192], [36, 192]], from: B.fall - 120, to: B.land + 300, angle: -62, peak: 0.4 },
	},
	H4: {
		flash: { bones: ['straw'], tint: 0xfff0d0, at: (t) => 0.6 * hit(t, B.land - 20, 340) },
		rim: beatRim(B.land - 20, 0.18),
		gloss: { bone: 'body', shape: [[106, 92], [158, 92], [162, 222], [102, 222]], from: B.crouch + 60, to: B.fall - 40, angle: -64 },
		front: (g, t, at) => {
			const mouth = at('body', [134, 60]);
			// fizz climbing out of the neck while it is shaken (inside the card: no more than ~45 px above the neck)
			for (let i = 0; i < 11; i++) {
				const born = 190 + i * 60, u = (t - born) / 560;
				if (u <= 0 || u >= 1) continue;
				const r = (3 + 3.5 * hash(i)) * (u < 0.8 ? out3(u / 0.15) : 1 - (u - 0.8) / 0.2);
				if (r < 0.8) continue;
				const side = (hash(i + 3) - 0.5) * 30;
				g.circle(mouth[0] + side * out3(u) + Math.sin(u * 8 + i) * 4, mouth[1] - 4 - out3(u) * (26 + 20 * hash(i + 5)), r).fill(CREAM).stroke({ width: 2, color: INK });
			}
			// the pop on the landing: drops sprayed out of the neck, falling back
			const pop0 = B.land - 20;
			for (let i = 0; i < 9; i++) {
				const age = (t - pop0 - hash(i + 20) * 40) / 1000;
				if (age <= 0 || age > 0.55) continue;
				const a = -Math.PI / 2 + (hash(i) - 0.5) * 1.9, v = 190 + 120 * hash(i + 7);
				const x = mouth[0] + Math.cos(a) * v * age, y = mouth[1] + Math.sin(a) * v * age + 0.5 * 700 * age * age;
				const vy = Math.sin(a) * v + 700 * age, vx = Math.cos(a) * v, len = Math.hypot(vx, vy) || 1;
				const k = 1 - age / 0.55, size = (4.5 + 3 * hash(i + 11)) * k;
				const from: Point = [x - (vx / len) * size * 2.2, y - (vy / len) * size * 2.2];
				g.moveTo(...from).lineTo(x, y).stroke({ width: size * 1.6 + 3, color: INK, cap: 'round' });
				g.moveTo(...from).lineTo(x, y).stroke({ width: size * 1.6, color: i % 3 ? GREEN : CREAM, cap: 'round' });
			}
		},
	},
	W: {
		flash: { bones: ['antenna'], tint: 0xfff0d0, at: (t) => 0.6 * hit(t, B.rise - 20, 360) + 0.45 * hit(t, B.land, 340) },
		rim: beatRim(B.rise - 20, 0.2),
		gloss: { bone: 'body', shape: ellipse([136, 118], 74, 76), from: B.fall - 60, to: B.land + 300, angle: -52, peak: 0.45 },
	},
	S: {
		flash: { bones: ['dome'], tint: 0xe8fbff, at: (t) => 0.5 * hit(t, B.rise, 380) + 0.3 * hit(t, B.fall, 340) },
		rim: beatRim(B.rise, 0.18),
		gloss: { bone: 'dome', shape: ellipse([130, 92], 44, 25, 20), from: B.rise + 20, to: B.fall - 20, angle: -40, peak: 0.5 },
		back: (g, t, at) => {
			// the tractor beam, out of the belly while it hovers: a pale wash, inked sides only (it has no bottom
			// edge), and one band of light running down it
			const k = env(t, B.rise - 20, B.fall + 120, 110, 160);
			if (k <= 0) return;
			const top = at('body', [128, 184]), len = 70 * k, wTop = 24, wBot = 24 + 40 * k;
			const half = (v: number) => wTop + (wBot - wTop) * v;
			const bot = top[1] + len;
			// the wash thins toward the ground in three steps, so there is no hard bottom
			for (const [v0, v1, al] of [[0, 0.45, 0.34], [0.45, 0.75, 0.24], [0.75, 1, 0.13]] as const) {
				const y0 = top[1] + len * v0, y1 = top[1] + len * v1;
				g.poly([top[0] - half(v0), y0, top[0] + half(v0), y0, top[0] + half(v1), y1, top[0] - half(v1), y1]).fill({ color: GREEN, alpha: al * k });
			}
			for (const side of [-1, 1]) g.moveTo(top[0] + side * wTop, top[1]).lineTo(top[0] + side * half(0.8), top[1] + len * 0.8).stroke({ width: 2.5, color: INK, alpha: k });
			const v = (t / 520) % 1, y = top[1] + v * len;
			g.moveTo(top[0] - half(v) + 4, y).lineTo(top[0] + half(v) - 4, y).stroke({ width: 3, color: CREAM, alpha: 0.55 * (1 - v) * k });
		},
	},
};
