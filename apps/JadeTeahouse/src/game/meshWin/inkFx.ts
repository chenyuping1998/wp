/**
 * Ink marks round a winning symbol's act (2026-11-01, as Putt Monkey's inkFx;
 * user: 繼續加強獎圖動態, like Putt / Diner / Strike). The mesh acts are at
 * their joints' limits, so the extra punch is drawn AROUND the symbol in the
 * game's own hand: a few brush strokes in ink, never light, never stars or
 * rings (the user's rule) — the marks a comic inker adds for motion.
 *
 *   every win   take-off: short speed strokes kicked out under the feet
 *               landing:  a low fan of impact ticks over the card
 *   one accent per symbol, at the moment its act peaks:
 *     H1 teapot     the pour: a curl of steam from the spout, then the lid's
 *                   rattle marks as it clatters home
 *     H2 gaiwan     clink ticks at the lid's rim as it drops back, twice
 *     H3 steamer    two wisps of steam rise out of the opened lid
 *     H4 tray       a clink tick over each cup as it hops, left to right
 *     W  medallion  the toss: a spin arc round the coin's edge at the top
 *     S  lantern    sway lines either side of the globe as it floats
 *
 * Each mark draws on (grows from its tail), holds a beat and wipes off from its
 * tail, then the card is still. Canvas units (the 256 art); the accents ride
 * the subject's rigid move, the ground marks stay on the card.
 */
import type { Graphics } from 'pixi.js';

export const INK = 0x1e1b1a;

/** the highs' act (act.ts ACT, 2026-11-06): wind-up, out of the frame, back
 *  on the card, the hold, the second beat */
const T = { crouch: 133, rise: 433, fall: 600, land: 667, hop2: 1167 };
const HOLD = 1000, LAND2 = 1400;
/** the royals' quicker leap (lowLetters.ts LEAP) */
const T_LOW = { crouch: 100, rise: 290, fall: 620, land: 800, hop2: 1010 };

type Pt = [number, number];
type Rigid = { dx: number; dy: number; rot: number; sx: number; sy: number; pop: number };

/** 0..1 how much of a mark is drawn: draws on over `inMs`, holds, wipes off */
const life = (t: number, at: number, inMs: number, holdMs: number, outMs: number) => {
	const u = t - at;
	if (u <= 0 || u >= inMs + holdMs + outMs) return null;
	const head = Math.min(1, u / inMs);
	const tail = u < inMs + holdMs ? 0 : (u - inMs - holdMs) / outMs;
	return { head: head * (2 - head), tail: tail * tail };
};

/** a stroke from a to b, only its [tail, head] stretch, tapering as it wipes */
const stroke = (g: Graphics, a: Pt, b: Pt, l: { head: number; tail: number }, w: number) => {
	if (l.head <= l.tail) return;
	const p = (k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
	const [x0, y0] = p(l.tail);
	const [x1, y1] = p(l.head);
	g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: w * (1 - 0.5 * l.tail), color: INK, cap: 'round' });
};

/** a quadratic a -> b bowing through c, drawn as its [tail, head] part */
const curve = (g: Graphics, a: Pt, c: Pt, b: Pt, l: { head: number; tail: number }, w: number) => {
	if (l.head <= l.tail) return;
	const at = (k: number): Pt => {
		const m = 1 - k;
		return [m * m * a[0] + 2 * m * k * c[0] + k * k * b[0], m * m * a[1] + 2 * m * k * c[1] + k * k * b[1]];
	};
	const s = at(l.tail);
	g.moveTo(s[0], s[1]);
	for (let i = 1; i <= 14; i++) {
		const q = at(l.tail + ((l.head - l.tail) * i) / 14);
		g.lineTo(q[0], q[1]);
	}
	g.stroke({ width: w * (1 - 0.4 * l.tail), color: INK, cap: 'round', join: 'round' });
};

/** a short tick fan at `c`, opening along `dir` (radians) */
const ticks = (g: Graphics, c: Pt, dir: number, l: { head: number; tail: number }, w: number, r0 = 14, r1 = 30) => {
	for (const da of [-0.55, 0, 0.55]) {
		const a = dir + da;
		stroke(g, [c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1], l, w);
	}
};

/** take-off strokes and the landing's tick fan, under the feet */
const ground = (g: Graphics, t: number, feet: number, beats = T) => {
	const off = life(t, beats.crouch + 10, 90, 60, 140);
	if (off)
		for (const s of [-1, 1]) {
			stroke(g, [128 + s * 46, feet - 6], [128 + s * 84, feet + 6], off, 6.5);
			stroke(g, [128 + s * 30, feet + 4], [128 + s * 60, feet + 16], off, 5.5);
		}
	const hit = life(t, beats.land - 10, 70, 70, 160);
	if (hit)
		for (let i = 0; i < 6; i++) {
			const a = Math.PI * (1.12 + (i * 0.76) / 5);
			const r0 = 70 + (i % 2) * 8;
			const r1 = r0 + 30 - (i % 2) * 8;
			stroke(g, [128 + Math.cos(a) * r0, feet + 8 + Math.sin(a) * r0 * 0.42], [128 + Math.cos(a) * r1, feet + 8 + Math.sin(a) * r1 * 0.42], hit, 6);
		}
};

const ACCENTS: Record<string, (g: Graphics, t: number) => void> = {
	H1: (g, t) => {
		// the pour, sitting tipped on its card: the tea's stream falls from the
		// spout in two strokes, then a curl of steam rises off it
		const pour = life(t, T.land + 90, 150, 170, 160);
		if (pour) curve(g, [16, 100], [8, 122], [-4, 156], pour, 6);
		const pour2 = life(t, T.land + 150, 150, 120, 160);
		if (pour2) curve(g, [26, 104], [18, 128], [8, 160], pour2, 4.2);
		const steam = life(t, T.land + 200, 220, 100, 220);
		if (steam) curve(g, [30, 90], [8, 60], [30, 34], steam, 5);
		// the lid clatters home after the second beat: rattle ticks over the knob
		const clat = life(t, LAND2 - 10, 60, 50, 110);
		if (clat) ticks(g, [122, 30], -Math.PI / 2, clat, 5.5);
	},
	H2: (g, t) => {
		// 刮茶: a short scrape tick at the rim each time the lid is drawn across
		for (const [at, x, dir] of [[790, 214, -0.1], [880, 34, 1.1], [965, 214, -0.1]] as const) {
			const l = life(t, at, 50, 40, 100);
			if (l) ticks(g, [x, 92], Math.PI * dir, l, 4.2, 8, 20);
		}
		// the lid clinks back onto the rim: on the landing and when it is set down
		for (const [at, s] of [[T.land, 0.8], [HOLD + 110, 1]] as const) {
			const l = life(t, at, 55, 50, 130);
			if (!l) continue;
			ticks(g, [30, 96], Math.PI * 1.1, l, 5.5 * s, 10, 10 + 22 * s);
			ticks(g, [218, 96], -Math.PI * 0.1, l, 5.5 * s, 10, 10 + 22 * s);
		}
	},
	H3: (g, t) => {
		// steam escapes the opened lid in two rising wisps
		const a = life(t, T.land + 40, 260, 140, 260);
		const b = life(t, T.land + 150, 260, 100, 260);
		// both left of the propped lid: a line across the painting reads as a
		// scribble on it
		if (a) curve(g, [90, 94], [68, 56], [90, 14], a, 6);
		if (b) curve(g, [60, 104], [38, 70], [58, 34], b, 5);
	},
	H4: (g, t) => {
		// each cup's clink as it hops on the tray, left to right
		const cups: Pt[] = [[76, 108], [136, 89], [190, 108]];
		cups.forEach((c, i) => {
			const l = life(t, T.land + i * 67, 55, 50, 120);
			if (l) ticks(g, [c[0], c[1] - 26], -Math.PI / 2, l, 5, 6, 22);
		});
	},
	W: (g, t) => {
		// the coin toss: a spin arc sweeping round the medallion's rim
		const l = life(t, T.crouch + 40, 240, 110, 220);
		if (l) {
			curve(g, [30, 150], [10, 60], [96, 18], l, 6.5);
			curve(g, [226, 106], [246, 196], [160, 238], l, 6.5);
		}
	},
	S: (g, t) => {
		// sway lines either side of the globe while it floats
		// on the swing's two big turns (act.ts: out at 433, back at 800)
		for (const [at, s] of [[T.rise - 60, 1], [740, -1]] as const) {
			const l = life(t, at, 170, 80, 200);
			if (l) {
				const x = 143 + s * 70;
				curve(g, [x, 58], [x + s * 18, 88], [x, 118], l, 5.5);
				curve(g, [x + s * 16, 70], [x + s * 30, 92], [x + s * 16, 112], l, 4);
			}
		}
	},
};

/** draw this frame's marks for `symbol` at act time `t` (ms) */
export const drawInkFx = (g: Graphics, symbol: string, t: number, feet: number, rigid: Rigid) => {
	g.clear();
	// a hanging lantern never leaves the ground, so it kicks up nothing
	if (symbol !== 'S') ground(g, t, feet, symbol.startsWith('L') ? T_LOW : T);
	// follow the subject's whole-body transform, as skin() places it
	const angle = (rigid.rot * Math.PI) / 180;
	const a = Math.cos(angle) * rigid.sx * rigid.pop;
	const b = Math.sin(angle) * rigid.sx * rigid.pop;
	const c = -Math.sin(angle) * rigid.sy * rigid.pop;
	const d = Math.cos(angle) * rigid.sy * rigid.pop;
	g.save();
	g.setTransform(a, b, c, d, 128 + rigid.dx - a * 128 - c * feet, 128 + rigid.pop * (feet - 128) + rigid.dy - b * 128 - d * feet);
	ACCENTS[symbol]?.(g, t);
	g.restore();
};

/** the high symbols, W and S get accents; the royals get the ground marks only */
export const HAS_INK_FX = new Set([...Object.keys(ACCENTS), 'L1', 'L2', 'L3', 'L4', 'L5']);
