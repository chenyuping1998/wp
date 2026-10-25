/**
 * Comic ink marks around a winning symbol's act (2026-10-24, user: 繼續強化獎圖的
 * 動態效果). The mesh acts are already at their joints' tear limits, so the
 * extra punch is drawn AROUND the symbol, in the postcard's own idiom: a few
 * pen strokes — never light (ART_BRIEF.md §0: a screenprint has none).
 *
 *   every win   take-off: short speed dashes under the feet as it springs
 *               landing:  a ring of impact ticks where it hits the card
 *   one accent per symbol, at the moment its act peaks:
 *     H1 windmill   two gust curls blow across the sails
 *     H2 dinosaur   snap strokes fly off the jaw as it bites
 *     H3 golf bag   rattle arcs over the clubs while it is shaken
 *     H4 lemonade   drops slosh out of the glass on the toast
 *     W  golfer     a four-point star pops by the cap as he tips it
 *     S  flag       wind lines stream past the cloth
 *     P  golf ball  a roll arc trails behind it
 *
 * Each mark draws on (the stroke grows from its tail), holds a beat and wipes
 * off from its tail — the way an animator inks them — then the card is still.
 * Canvas units (the 256 art); `lift` is the subject's rigid rise this frame,
 * so marks that belong to the subject ride the hop and the ground marks don't.
 */
import type { Graphics } from 'pixi.js';

export const INK = 0x1d2620;
const CREAM = 0xf7efd6;
const LEMON = 0xf2c230;

/** the leap's beats (puttWins.ts T) */
const T = { crouch: 120, rise: 350, fall: 780, land: 950, hop2: 1160 };

type Pt = [number, number];
type Rigid = { dx: number; dy: number; rot: number };

/** 0..1 how much of a mark is drawn: draws on over `inMs`, holds, wipes off */
const life = (t: number, at: number, inMs: number, holdMs: number, outMs: number) => {
	const u = t - at;
	if (u <= 0 || u >= inMs + holdMs + outMs) return null;
	const head = Math.min(1, u / inMs);
	const tail = u < inMs + holdMs ? 0 : (u - inMs - holdMs) / outMs;
	return { head: head * (2 - head), tail: tail * tail };
};

/** a stroke from a to b, only the [tail, head] stretch of it, tapering */
const stroke = (g: Graphics, a: Pt, b: Pt, l: { head: number; tail: number }, w: number, color = INK) => {
	if (l.head <= l.tail) return;
	const p = (k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
	const [x0, y0] = p(l.tail);
	const [x1, y1] = p(l.head);
	g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: w * (1 - 0.5 * l.tail), color, cap: 'round' });
};

/** a quadratic curve a -> b bowing through c, drawn as its [tail, head] part */
const curve = (g: Graphics, a: Pt, c: Pt, b: Pt, l: { head: number; tail: number }, w: number, color = INK) => {
	if (l.head <= l.tail) return;
	const at = (k: number): Pt => {
		const m = 1 - k;
		return [m * m * a[0] + 2 * m * k * c[0] + k * k * b[0], m * m * a[1] + 2 * m * k * c[1] + k * k * b[1]];
	};
	const n = 14;
	const s = at(l.tail);
	g.moveTo(s[0], s[1]);
	for (let i = 1; i <= n; i++) {
		const q = at(l.tail + ((l.head - l.tail) * i) / n);
		g.lineTo(q[0], q[1]);
	}
	g.stroke({ width: w, color, cap: 'round', join: 'round' });
};

const star = (g: Graphics, c: Pt, r: number, s: number, rot: number) => {
	if (s <= 0) return;
	const pts: number[] = [];
	for (let i = 0; i < 8; i++) {
		const a = rot + (i * Math.PI) / 4;
		const rr = (i % 2 ? r * 0.3 : r) * s;
		pts.push(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr);
	}
	g.poly(pts).fill(CREAM).stroke({ width: 5, color: INK, join: 'round' });
};

const drop = (g: Graphics, c: Pt, r: number) => {
	if (r <= 0.2) return;
	g.circle(c[0], c[1], r).fill(LEMON).stroke({ width: 4, color: INK });
};

/** take-off dashes and the landing's impact ring, under the feet */
const ground = (g: Graphics, t: number, feet: number) => {
	const off = life(t, T.crouch + 10, 90, 60, 140);
	if (off)
		for (const s of [-1, 1]) {
			// two dashes each side, kicked out and down from the feet
			stroke(g, [128 + s * 46, feet - 6], [128 + s * 86, feet + 6], off, 7);
			stroke(g, [128 + s * 30, feet + 4], [128 + s * 62, feet + 18], off, 6);
		}
	const hit = life(t, T.land - 10, 70, 70, 160);
	if (hit)
		for (let i = 0; i < 6; i++) {
			// a fan of ticks over the card, opening upward from the contact
			const a = Math.PI * (1.12 + (i * 0.76) / 5);
			const r0 = 70 + (i % 2) * 8;
			const r1 = r0 + 32 - (i % 2) * 8;
			stroke(g, [128 + Math.cos(a) * r0, feet + 8 + Math.sin(a) * r0 * 0.42], [128 + Math.cos(a) * r1, feet + 8 + Math.sin(a) * r1 * 0.42], hit, 6.5);
		}
};

const ACCENTS: Record<string, (g: Graphics, t: number, lift: number) => void> = {
	H1: (g, t, lift) => {
		// two gust curls blow in from the left, up to the sails' edge (not across
		// them: a line over the painting reads as a scribble on it)
		const a = life(t, T.rise - 60, 220, 90, 220);
		const b = life(t, T.rise + 30, 220, 90, 220);
		if (a) curve(g, [6, 92 + lift], [34, 52 + lift], [84, 66 + lift], a, 7);
		if (b) curve(g, [10, 150 + lift], [36, 118 + lift], [74, 128 + lift], b, 6);
	},
	H2: (g, t, lift) => {
		// the bite: three strokes fly off the jaw tip as it snaps shut
		const l = life(t, T.rise + 100, 70, 90, 150);
		if (!l) return;
		const tip: Pt = [214, 106 + lift];
		for (const a of [-1.2, -0.6, 0]) stroke(g, [tip[0] + Math.cos(a) * 14, tip[1] + Math.sin(a) * 14], [tip[0] + Math.cos(a) * 40, tip[1] + Math.sin(a) * 40], l, 7);
	},
	H3: (g, t, lift) => {
		// rattle arcs over the clubs, two beats apart, while it is shaken
		for (const [at, s] of [[T.rise - 80, -1], [T.rise + 70, 1]] as const) {
			const l = life(t, at, 90, 80, 150);
			if (l) curve(g, [128 + s * 30, 34 + lift], [128 + s * 54, 8 + lift], [128 + s * 80, 32 + lift], l, 6.5);
		}
	},
	H4: (g, t, lift) => {
		// the toast sloshes three drops out of the mouth of the jar (clear of
		// the lemon wheel: yellow on yellow is lost); they arc and fall
		const u = (t - T.rise + 20) / 520;
		if (u <= 0 || u >= 1) return;
		for (const [k, vx, vy, r] of [[0, -30, -84, 15], [1, 24, -96, 12], [2, -62, -60, 11]] as const) {
			const s = u - k * 0.06;
			if (s <= 0) continue;
			const x = 140 + vx * s * 1.8;
			const y = 72 + lift * (1 - s) + vy * s * 1.8 + 230 * s * s;
			drop(g, [x, y], r * (1 - s * 0.7));
		}
	},
	W: (g, t, lift) => {
		// a star pops by the cap brim as he tips it, and twinkles out
		const u = (t - (T.rise + 140)) / 420;
		if (u <= 0 || u >= 1) return;
		const s = u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75;
		star(g, [212, 60 + lift], 32, s * (2 - s), u * 1.4);
	},
	S: (g, t, lift) => {
		// wind lines stream past the cloth toward its point
		for (const [at, y, x0] of [[T.crouch + 40, 70, 40], [T.crouch + 140, 112, 54], [T.crouch + 240, 150, 46]] as const) {
			const l = life(t, at, 170, 60, 200);
			if (l) curve(g, [x0, y + lift], [x0 + 80, y - 12 + lift], [x0 + 176, y + 4 + lift], l, 6);
		}
	},
	P: (g, t, lift) => {
		// a roll arc trails the ball's turn
		const l = life(t, T.crouch + 60, 260, 120, 260);
		if (l) curve(g, [50, 160 + lift], [34, 98 + lift], [84, 50 + lift], l, 7);
	},
};

/** draw this frame's marks for `symbol` at act time `t` (ms) */
export const drawInkFx = (g: Graphics, symbol: string, t: number, feet: number, rigid: Rigid) => {
	g.clear();
	const lift = rigid.dy;
	ground(g, t, feet);
	ACCENTS[symbol]?.(g, t, lift);
};

export const HAS_INK_FX = new Set(Object.keys(ACCENTS));
