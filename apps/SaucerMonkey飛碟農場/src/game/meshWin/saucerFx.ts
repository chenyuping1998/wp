/**
 * EACH SAUCER SYMBOL'S HIT, DRAWN LIKE THE PRINT IT IS (user 2026-10-31: 獎圖加特效、加亮、掃光，動畫要做好).
 *
 * The family's art rule (design/ART_REQUEST §0) is screenprint: ink keylines, flat colour, coarse halftone, no
 * soft light and no white bloom. So nothing here is a glow sprite. Every effect is a hard-edged shape with an ink
 * keyline, and it leaves the way print would — dots shrink, strokes thin, a shape snaps smaller — never by fading
 * through a haze.
 *
 *   H1 ray gun   energy rings tighten on the emitter ball while it charges; on the shot a starburst at the
 *                muzzle and a green bolt that leaves the picture; three recoil strokes behind the grip
 *   H2 helmet    the antenna ball lights (a spiked burst) and radio arcs leave it, on the boing and the landing;
 *                a glass glint crosses the visor as it turns
 *   H3 foil hat  it picks up a signal: dashed rings ripple out of the bead, static zips round the tip
 *   H4 soda      fizz rises out of the neck while it is shaken; on the landing it pops — a spray of drops
 *   W  captain   the antenna ball lights and sends arcs; a glint crosses his dome as he throws his head back
 *   S  saucer    its rim lights chase round, a tractor beam drops out of it while it hovers, the dome glints
 *
 * Plus, for each: a halftone halo printed behind it on the hit, the acting part flashing (`flash`, the same mesh
 * drawn additive inside its own outline), and the glass/gloss glint (`glint`), two hard bars clipped to the glossy
 * shape. Everything is placed through `at(bone, point)`, so it rides the mesh's acting — a burst on the antenna
 * ball goes where the ball has been flung.
 *
 * Deterministic in t (ms of the win at normal speed), so it can be stepped offline; 256-canvas coordinates.
 */
import type { Graphics } from 'pixi.js';
import type { Point } from './meshRig';

export const INK = 0x141a33, CREAM = 0xf6eed6, RED = 0xe8433a, GOLD = 0xf2b632, GREEN = 0x86e35b, CYAN = 0x8fdcef;
const TAU = Math.PI * 2;

export type At = (bone: string, p: Point) => Point;
export type SaucerFx = {
	/** the parts that flash, and how hard (0..1) at t */
	flash: { bones: string[]; at: (t: number) => number; tint: number };
	/** a hard glint across a glossy shape: the shape (convex, canvas px) and the bone it rides */
	glint?: { bone: string; shape: Point[]; from: number; to: number; angle: number };
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
/** a print "pop": snaps past full size, settles, then shrinks away */
const pop = (t: number, a: number, life: number) => {
	const u = (t - a) / life;
	if (u <= 0 || u >= 1) return 0;
	return u < 0.18 ? 1.18 * out3(u / 0.18) : u < 0.4 ? 1.18 - 0.18 * ease((u - 0.18) / 0.22) : 1 - ease((u - 0.4) / 0.6);
};
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ── print primitives (all canvas px) ───────────────────────────────────────
/** a stroke with an ink keyline under it */
const inked = (g: Graphics, draw: () => void, width: number, color: number, key = 3) => {
	draw(); g.stroke({ width: width + key * 2, color: INK, cap: 'round', join: 'round' });
	draw(); g.stroke({ width, color, cap: 'round', join: 'round' });
};
/** comic starburst: n spikes, ink keyline, an inner star of a second colour */
const burst = (g: Graphics, c: Point, r: number, n: number, rot: number, fill: number, core?: number) => {
	if (r < 1) return;
	const star = (ro: number, ri: number) => {
		const pts: number[] = [];
		for (let i = 0; i < n * 2; i++) {
			const a = rot + (i / (n * 2)) * TAU, rr = i % 2 ? ri : ro * (0.86 + 0.14 * hash(i + n));
			pts.push(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr);
		}
		return pts;
	};
	g.poly(star(r, r * 0.48)).fill(fill).stroke({ width: 3, color: INK, join: 'round' });
	if (core !== undefined) g.poly(star(r * 0.55, r * 0.27)).fill(core);
};
/** a printed halo: coarse dots on a grid, large at the centre and shrinking outward; k scales every dot */
const halftone = (g: Graphics, c: Point, r: number, color: number, k: number, pitch = 10) => {
	if (k <= 0.02) return;
	const n = Math.ceil(r / pitch);
	for (let iy = -n; iy <= n; iy++) for (let ix = -n; ix <= n; ix++) {
		const x = c[0] + (ix + (iy % 2 ? 0.5 : 0)) * pitch, y = c[1] + iy * pitch * 0.87;
		const d = Math.hypot(x - c[0], y - c[1]) / r;
		const dot = pitch * 0.46 * (1 - d) * k;
		if (dot > 0.6) g.circle(x, y, dot);
	}
	g.fill(color);
};
/** an arc of a radio wave */
const arc = (g: Graphics, c: Point, r: number, from: number, to: number, width: number, color: number) => {
	if (width < 0.5) return;
	inked(g, () => { g.moveTo(c[0] + Math.cos(from) * r, c[1] + Math.sin(from) * r); g.arc(c[0], c[1], r, from, to); }, width, color, 2);
};
/** a dashed ring */
const dashed = (g: Graphics, c: Point, r: number, width: number, color: number, dashes: number, spin: number) => {
	for (let i = 0; i < dashes; i++) {
		const a0 = spin + (i / dashes) * TAU, a1 = a0 + (TAU / dashes) * 0.58;
		arc(g, c, r, a0, a1, width, color);
	}
};
/** a little zig-zag of static */
const zap = (g: Graphics, from: Point, to: Point, seed: number, color: number) => {
	const pts: Point[] = [from];
	const dx = to[0] - from[0], dy = to[1] - from[1], nx = -dy, ny = dx, len = Math.hypot(dx, dy) || 1;
	for (let i = 1; i < 4; i++) { const k = i / 4, s = (i % 2 ? 1 : -1) * (0.18 + 0.1 * hash(seed + i)); pts.push([from[0] + dx * k + (nx / len) * s * len * 0.35, from[1] + dy * k + (ny / len) * s * len * 0.35]); }
	pts.push(to);
	inked(g, () => { g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); }, 3, color, 2);
};
/** a bubble: cream disc, ink keyline, a hard highlight tick */
const bubble = (g: Graphics, c: Point, r: number) => {
	if (r < 0.8) return;
	g.circle(c[0], c[1], r).fill(CREAM).stroke({ width: 2, color: INK });
	if (r > 3) g.circle(c[0] - r * 0.35, c[1] - r * 0.35, r * 0.22).fill(0xffffff);
};

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

/** the glint's two bars at progress u (0..1 across the shape), clipped to it; canvas px */
export const glintBars = (shape: Point[], u: number, angle: number): Point[][] => {
	const xs = shape.map((p) => p[0]), ys = shape.map((p) => p[1]);
	const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
	const reach = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 30;
	const a = (angle * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
	const along = -reach + u * reach * 2;
	return [[0, 15], [22, 6]].map(([off, w]) => {
		const s = along + off, quad: Point[] = [[-reach, s], [reach, s], [reach, s + w], [-reach, s + w]];
		return clip(quad.map(([p, q]) => [cx + ux * p + vx * q, cy + uy * p + vy * q] as Point), shape);
	}).filter((p) => p.length >= 3);
};

// ── the symbols (beats from saucerWins.ts: crouch 120, rise 350, fall 780, land 950, hop2 1160, done 1440) ─
const B = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160 };

/** the antenna ball lighting up: a spiked burst on the ball, then radio arcs walking out of it */
const antennaCall = (g: Graphics, t: number, at: At, bone: string, ball: Point, t0: number, dir: number) => {
	const c = at(bone, ball), s = pop(t, t0, 300);
	if (s > 0) burst(g, c, 15 * s, 8, t0 * 0.01 + t * 0.002, CREAM, RED);
	for (let i = 0; i < 3; i++) {
		const u = (t - t0 - 40 - i * 80) / 360;
		if (u <= 0 || u >= 1) continue;
		const r = 14 + out3(u) * 38;
		arc(g, c, r, dir - 0.62, dir + 0.62, 4.5 * (1 - u) + 0.5, CREAM);
	}
};

export const SAUCER_FX: Record<string, SaucerFx> = {
	H1: {
		flash: { bones: ['coil'], tint: 0xd8ffc0, at: (t) => 0.4 * env(t, B.crouch, B.rise + 40, 200, 30) + 0.75 * pop(t, B.rise + 40, 260) },
		glint: { bone: 'body', shape: [[128, 76], [204, 74], [222, 94], [204, 120], [132, 120]], from: B.land, to: B.land + 300, angle: -58 },
		back: (g, t, at) => halftone(g, at('coil', [52, 74]), 74, GREEN, pop(t, B.rise + 40, 560) * 0.9),
		front: (g, t, at) => {
			const fire = B.rise + 40, ball = at('coil', [36, 68]), back = at('coil', [96, 86]);
			const dir = Math.atan2(ball[1] - back[1], ball[0] - back[0]);
			// charging: rings tightening on the ball
			for (let i = 0; i < 2; i++) {
				const u = (t - B.crouch - i * 110) / 200;
				if (u > 0 && u < 1 && t < fire) dashed(g, ball, 26 - 18 * ease(u), 2.5, GREEN, 6, t * 0.01 + i);
			}
			// the bolt: shoots out of the muzzle and leaves the picture, its tail chasing it
			const head = clamp((t - fire) / 70) * 190 + Math.max(0, t - fire - 70) * 0.9, tail = Math.max(0, (t - fire - 90) * 1.4);
			if (t > fire && tail < head && tail < 260) {
				const p = (d: number): Point => [ball[0] + Math.cos(dir) * d, ball[1] + Math.sin(dir) * d];
				const w = 1 - clamp((t - fire - 120) / 160);
				const [a, b] = [p(tail), p(Math.min(head, 260))];
				g.moveTo(...a).lineTo(...b).stroke({ width: 14 * w + 4, color: INK, cap: 'round' });
				g.moveTo(...a).lineTo(...b).stroke({ width: 9 * w + 1.5, color: GREEN, cap: 'round' });
				g.moveTo(...a).lineTo(...b).stroke({ width: 3 * w + 0.5, color: CREAM, cap: 'round' });
			}
			// the muzzle flash
			const s = pop(t, fire, 280);
			if (s > 0) burst(g, ball, 30 * s, 10, -0.2, CREAM, GREEN);
			// recoil strokes behind the grip
			const k = env(t, fire, fire + 260, 30, 140);
			if (k > 0) for (let i = 0; i < 3; i++) {
				const o = at('body', [226 + i * 3, 86 + i * 14]);
				inked(g, () => g.moveTo(o[0], o[1]).lineTo(o[0] + 22 * k, o[1] + 6 * k), 3, CREAM, 2);
			}
		},
	},
	H2: {
		flash: { bones: ['antenna'], tint: 0xfff0d0, at: (t) => 0.7 * pop(t, B.rise - 60, 300) + 0.6 * pop(t, B.land, 300) },
		glint: { bone: 'body', shape: ellipse([124, 118], 80, 74), from: B.rise, to: B.fall, angle: -55 },
		back: (g, t, at) => halftone(g, at('body', [126, 116]), 120, CYAN, pop(t, B.rise - 40, 900) * 0.75, 11),
		front: (g, t, at) => {
			antennaCall(g, t, at, 'antenna', [216, 35], B.rise - 60, -0.9);
			antennaCall(g, t, at, 'antenna', [216, 35], B.land, -0.9);
		},
	},
	H3: {
		flash: { bones: ['tip'], tint: 0xf0f6ff, at: (t) => 0.6 * pop(t, B.rise - 40, 260) + 0.5 * pop(t, B.fall, 260) },
		glint: { bone: 'body', shape: [[132, 44], [222, 192], [36, 192]], from: B.land - 40, to: B.land + 320, angle: -62 },
		front: (g, t, at) => {
			const bead = at('tip', [136, 39]);
			// the signal: dashed rings rippling out of the bead, twice
			for (const t0 of [B.rise - 40, B.fall]) for (let i = 0; i < 3; i++) {
				const u = (t - t0 - i * 90) / 430;
				if (u <= 0 || u >= 1) continue;
				dashed(g, bead, 9 + out3(u) * 62, 4.5 * (1 - u) + 0.6, i === 1 ? GREEN : CREAM, 9, t0 * 0.003 + u * 0.6);
			}
			// static round the tip
			for (const t0 of [B.rise - 20, B.fall + 20]) {
				if (t < t0 || t > t0 + 170) continue;
				for (let i = 0; i < 3; i++) {
					const a = -Math.PI / 2 + (i - 1) * 1.1 + hash(t0 + i) * 0.4, r0 = 12, r1 = 30 + 8 * hash(t0 + i + 9);
					zap(g, [bead[0] + Math.cos(a) * r0, bead[1] + Math.sin(a) * r0], [bead[0] + Math.cos(a) * r1, bead[1] + Math.sin(a) * r1], t0 + i, CREAM);
				}
			}
		},
	},
	H4: {
		flash: { bones: ['straw'], tint: 0xfff0d0, at: (t) => 0.7 * pop(t, B.land - 20, 300) },
		glint: { bone: 'body', shape: [[106, 92], [158, 92], [162, 222], [102, 222]], from: B.crouch + 60, to: B.fall - 60, angle: -64 },
		front: (g, t, at) => {
			const mouth = at('body', [134, 60]);
			// fizz climbing out of the neck while it is shaken
			// (they stay inside the card: no more than ~45 px above the neck)
			for (let i = 0; i < 11; i++) {
				const born = 190 + i * 60, u = (t - born) / 560;
				if (u <= 0 || u >= 1) continue;
				const r = (3.5 + 4 * hash(i)) * (u < 0.8 ? out3(u / 0.15) : 1 - (u - 0.8) / 0.2);
				const side = (hash(i + 3) - 0.5) * 30;
				bubble(g, [mouth[0] + side * out3(u) + Math.sin(u * 8 + i) * 4, mouth[1] - 4 - out3(u) * (26 + 20 * hash(i + 5))], r);
			}
			// the pop on the landing: a spray out of the neck, drops falling back
			const pop0 = B.land - 20;
			const s = pop(t, pop0, 240);
			if (s > 0) burst(g, mouth, 20 * s, 9, 0.3, CREAM, GREEN);
			for (let i = 0; i < 9; i++) {
				const age = (t - pop0 - hash(i + 20) * 40) / 1000;
				if (age <= 0 || age > 0.55) continue;
				const a = -Math.PI / 2 + (hash(i) - 0.5) * 1.9, v = 190 + 120 * hash(i + 7);
				const x = mouth[0] + Math.cos(a) * v * age, y = mouth[1] + Math.sin(a) * v * age + 0.5 * 700 * age * age;
				const vy = Math.sin(a) * v + 700 * age, vx = Math.cos(a) * v, len = Math.hypot(vx, vy) || 1;
				const k = 1 - age / 0.55, size = (5 + 3.5 * hash(i + 11)) * k;
				g.moveTo(x - (vx / len) * size * 2.2, y - (vy / len) * size * 2.2).lineTo(x, y).stroke({ width: size * 1.6 + 3, color: INK, cap: 'round' });
				g.moveTo(x - (vx / len) * size * 2.2, y - (vy / len) * size * 2.2).lineTo(x, y).stroke({ width: size * 1.6, color: i % 3 ? GREEN : CREAM, cap: 'round' });
			}
		},
	},
	W: {
		flash: { bones: ['antenna'], tint: 0xfff0d0, at: (t) => 0.7 * pop(t, B.rise - 20, 300) + 0.5 * pop(t, B.land, 300) },
		glint: { bone: 'body', shape: ellipse([136, 118], 74, 76), from: B.fall - 40, to: B.land + 240, angle: -52 },
		back: (g, t, at) => halftone(g, at('body', [136, 124]), 128, GOLD, pop(t, B.rise - 20, 1000) * 0.8, 12),
		front: (g, t, at) => {
			antennaCall(g, t, at, 'antenna', [163, 31], B.rise - 20, -1.25);
			antennaCall(g, t, at, 'antenna', [163, 31], B.land, -1.25);
		},
	},
	S: {
		flash: { bones: ['dome'], tint: 0xe8fbff, at: (t) => 0.55 * pop(t, B.rise, 320) + 0.35 * pop(t, B.fall, 300) },
		glint: { bone: 'dome', shape: ellipse([130, 92], 44, 25, 20), from: B.rise + 40, to: B.fall - 40, angle: -40 },
		back: (g, t, at) => {
			// the tractor beam, out of the belly while it hovers: a pale green wash printed over with halftone that
			// thins toward the ground, inked sides only (it has no bottom edge), scan lines running down, and the
			// spot it lights on the card
			const k = env(t, B.rise - 20, B.fall + 120, 110, 140);
			if (k <= 0) return;
			const top = at('body', [128, 184]), len = 70 * k, wTop = 24, wBot = 24 + 40 * k;
			const half = (v: number) => wTop + (wBot - wTop) * v;
			const ground: Point = [top[0], top[1] + len];
			g.ellipse(ground[0], ground[1], wBot * 1.05, 9 * k).fill({ color: GREEN, alpha: 0.5 }).stroke({ width: 2, color: INK });
			const pts: Point[] = [[top[0] - wTop, top[1]], [top[0] + wTop, top[1]], [top[0] + wBot, ground[1]], [top[0] - wBot, ground[1]]];
			g.poly(pts.flat()).fill({ color: GREEN, alpha: 0.3 });
			for (let row = 0, y = top[1] + 4; y < ground[1] - 2; row++, y += 7) {
				const v = (y - top[1]) / Math.max(len, 1), w = half(v) - 4, dot = 2.4 * (1 - v * 0.85);
				for (let x = -w + (row % 2) * 3.5; x <= w; x += 7) g.circle(top[0] + x, y, dot);
			}
			g.fill({ color: GREEN, alpha: 0.9 });
			for (const side of [-1, 1]) g.moveTo(top[0] + side * wTop, top[1]).lineTo(top[0] + side * wBot, ground[1]).stroke({ width: 2.5, color: INK });
			for (let i = 0; i < 3; i++) {
				const v = (t / 300 + i / 3) % 1, y = top[1] + v * len;
				g.moveTo(top[0] - half(v) + 3, y).lineTo(top[0] + half(v) - 3, y).stroke({ width: 2.5, color: CREAM, alpha: 1 - v * 0.6 });
			}
		},
		front: (g, t, at) => {
			// rim lights chasing round the belly
			const lights: Point[] = [[58, 164], [90, 177], [128, 182], [166, 177], [197, 164]];
			const on = env(t, B.crouch, B.land + 200, 60, 160);
			if (on <= 0) return;
			lights.forEach((p, i) => {
				const lit = ((t / 85 - i) % lights.length + lights.length) % lights.length < 1.2;
				const c = at('body', p);
				g.circle(c[0], c[1], (lit ? 7 : 4.5) * on).fill(lit ? CREAM : GREEN).stroke({ width: 2, color: INK });
			});
		},
	},
};
