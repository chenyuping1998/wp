/**
 * Squawk Radio symbol wins, acted by the OBJECTS INSIDE each symbol, on the symbol's OWN drawing (user 2026-10-31:
 * 獎圖動態要有專業 2D 美術). Ported from Purrfia (src/game/symbolActing.ts there), which met the same problem first:
 * the separately painted parts (parrotSymbols/*_disc, _hat, _eye, ...) are a different drawing from the symbol art —
 * smaller label, a second cord, a smaller eye, no flower, the straw and umbrella elsewhere — so swapping to them made
 * every win start with a visible jump. Here the full art is one dense mesh and each object is a soft-weighted region
 * of it ("bone").
 *
 * How it moves follows the Pragmatic Play teardown (wp/.claude/skills/slot-motion-recipes):
 *  - one beat inside the win window: anticipation → action → settle with overshoot → moving hold → rest
 *  - Spine's default bezier [.25,0,.75,1] (≈smoothstep) everywhere, never a free-running sine
 *  - follow-through by LAG: one curve per chain, each link later and a little larger toward the tip
 *  - hinges and parents (the hat tips about its brim, the eye rides the spyglass)
 *  - a fake 3-D look on the eye: a Gaussian share of the iris slides toward where it looks
 *  - light is an additive copy of the acting object only, on the beat
 * The low gems use the teardown's low-pay hop: crouch, jump stretched, land squashed, a small rebound.
 *
 * `u` runs 0..1 over the win window (640ms; the mic's trigger beat 820ms). Every pose ends exactly at rest at u = 1.
 * IMPORTS NOTHING, so a review script can pose it under bare node.
 */

// ---------------------------------------------------------------------------- curves

const bezier = (x1: number, y1: number, x2: number, y2: number) => (x: number) => {
	if (x <= 0) return 0;
	if (x >= 1) return 1;
	let lo = 0, hi = 1, t = x;
	for (let i = 0; i < 20; i++) {
		t = (lo + hi) / 2;
		if (3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3 < x) lo = t; else hi = t;
	}
	return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3;
};
const EASE = {
	soft: bezier(0.25, 0, 0.75, 1),
	settle: bezier(0.36, 0.64, 0.7, 1),
	snap: (t: number) => 1 - (1 - t) ** 3, // the brief's `snap`: cubic-out
	linear: (t: number) => t,
};
type EaseName = keyof typeof EASE;
type Key = [number, number, EaseName?];
/** keyed track, ease INTO each key (default soft); holds the end values outside the keys */
export const track = (u: number, keys: Key[]) => {
	if (u <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [u1, v1, e = 'soft'] = keys[i];
		if (u <= u1) {
			const [u0, v0] = keys[i - 1];
			return v0 + (v1 - v0) * EASE[e]((u - u0) / (u1 - u0 || 1));
		}
	}
	return keys[keys.length - 1][1];
};
/** one 30fps frame at the normal 513ms window ≈ 0.065: chain links follow about a frame apart */
const LAG = 0.07;
/** the same curve for chain link `n`: later by `lag` per link, larger by `gain` per link */
const link = (u: number, keys: Key[], n: number, lag = LAG, gain = 1.2) => track(u - n * lag, keys) * gain ** n;
const bump = (u: number, a: number, b: number) => (u <= a || u >= b ? 0 : Math.sin((Math.PI * (u - a)) / (b - a)));

/** beats inside the window */
export const BEAT = { anticipate: 0.13, action: 0.36, settle: 0.58, hold: 0.84 } as const;
const { anticipate: ANT, action: ACT, settle: SET, hold: HOLD } = BEAT;

// ---------------------------------------------------------------------------- regions (weights)

export type Pt = [number, number];
type Mask = (u: number, v: number) => number;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
/** soft ellipse: 1 inside, fading to 0 over `soft` (in radii) */
const ellipse = (c: Pt, rx: number, ry: number, soft = 0.25): Mask => (u, v) =>
	1 - smooth((Math.hypot((u - c[0]) / rx, (v - c[1]) / ry) - (1 - soft)) / (2 * soft));
/** soft polygon: 1 inside, fading to 0 over `soft` uv outside */
const poly = (pts: Pt[], soft = 0.04): Mask => (u, v) => {
	let inside = false, best = Infinity;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const [xi, yi] = pts[i], [xj, yj] = pts[j];
		if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
		const dx = xi - xj, dy = yi - yj, t = clamp01(((u - xj) * dx + (v - yj) * dy) / (dx * dx + dy * dy));
		best = Math.min(best, Math.hypot(xj + t * dx - u, yj + t * dy - v));
	}
	return inside ? 1 : 1 - smooth(best / soft);
};
const union = (...m: Mask[]): Mask => (u, v) => Math.max(...m.map((f) => f(u, v)));
/** a Gaussian falloff (the fake 3-D look): peak at c, PP's w ≈ peak·exp(−(r/R)²/0.4) */
const gauss = (c: Pt, radius: number, peak: number): Mask => (u, v) => {
	const r = Math.hypot(u - c[0], v - c[1]) / radius;
	return peak * Math.exp(-(r * r) / 0.4);
};

/** Bones per symbol, FRONT-MOST FIRST: each takes its mask's share of what the bones before it left over, and
 *  whatever is left stays put (the bowl's glass, the can's rim, the pot). Coordinates are the art's 0..1 uv. */
const RIGS: Record<string, [string, Mask][]> = {
	H1: [
		// the label is printed on the record and turns with it exactly; it is its own region only so the light
		// can cover it. Everything else is the record (transparent round it), turned rigidly.
		['label', ellipse([0.49, 0.48], 0.15, 0.15, 0.2)],
		['disc', () => 1],
	],
	H2: [
		['cupL', ellipse([0.26, 0.62], 0.1, 0.12, 0.25)],
		['cupR', ellipse([0.63, 0.6], 0.08, 0.11, 0.25)],
		// the brim stops above the cups' tops, or tipping the hat drags the headphones with it
		['hat', poly([[0.11, 0.44], [0.19, 0.26], [0.3, 0.17], [0.5, 0.14], [0.7, 0.16], [0.8, 0.28], [0.9, 0.45], [0.8, 0.5], [0.5, 0.48], [0.2, 0.49]], 0.035)],
		['cord', poly([[0.13, 0.66], [0.4, 0.7], [0.62, 0.66], [0.86, 0.64], [0.88, 0.8], [0.6, 0.86], [0.3, 0.86], [0.12, 0.78]], 0.03)],
	],
	H3: [
		['iris', gauss([0.71, 0.48], 0.13, 0.7)],
		['eye', ellipse([0.68, 0.5], 0.19, 0.21, 0.15)],
		// the brass tube and the lens rim, rigid: the eye rides it
		['scope', () => 1],
	],
	H4: [
		['flower', ellipse([0.66, 0.66], 0.15, 0.16, 0.25)],
		['umbrella', poly([[0.5, 0.24], [0.64, 0.1], [0.74, 0.11], [0.88, 0.3], [0.84, 0.36], [0.62, 0.33], [0.58, 0.47], [0.54, 0.47]], 0.03)],
		['straw', poly([[0.22, 0.34], [0.26, 0.22], [0.42, 0.13], [0.46, 0.06], [0.66, 0.08], [0.64, 0.16], [0.5, 0.17], [0.46, 0.46], [0.38, 0.46], [0.32, 0.3]], 0.03)],
		['coconut', ellipse([0.33, 0.63], 0.3, 0.25, 0.12)],
	],
	S: [
		['charm', poly([[0.53, 0.47], [0.6, 0.47], [0.69, 0.6], [0.7, 0.9], [0.6, 0.92], [0.52, 0.8], [0.52, 0.6]], 0.03)],
		['feather', poly([[0.6, 0.24], [0.68, 0.17], [0.8, 0.26], [0.83, 0.42], [0.76, 0.6], [0.7, 0.6], [0.66, 0.42], [0.6, 0.34]], 0.03)],
		['grille', ellipse([0.4, 0.33], 0.2, 0.23, 0.15)],
		['mic', () => 1],
	],
	L: [['gem', () => 1]],
};

/** Weight table for a symbol: weights[v * B + b] over a (GRID+1)² grid; rows sum to ≤ 1 (the rest stays put). */
export function rigWeights(name: string): { bones: string[]; weights: Float32Array } {
	const rig = RIGS[name] ?? (name.startsWith('L') ? RIGS.L : []);
	const B = rig.length, V = (GRID + 1) ** 2, weights = new Float32Array(V * B);
	for (let gy = 0, v = 0; gy <= GRID; gy++) for (let gx = 0; gx <= GRID; gx++, v++) {
		let left = 1;
		rig.forEach(([, mask], b) => {
			const w = clamp01(mask(gx / GRID, gy / GRID)) * left;
			weights[v * B + b] = w;
			left -= w;
		});
	}
	return { bones: rig.map(([n]) => n), weights };
}

// ---------------------------------------------------------------------------- poses

/** One bone's pose. Offsets in cell px; `pivot` and deformer centres in the art's 0..1 uv. */
export type BonePose = {
	tx: number; ty: number; rot: number; sx: number; sy: number; pivot: Pt;
	/** a 3-link chain bending from `root` toward `dir` over `len` (uv), each link turning by a[k] */
	bend?: { root: Pt; dir: Pt; len: number; a: [number, number, number] };
	/** vertices turn about `c` by an angle that grows with distance (whip of the bow's loops) */
	swirl?: { c: Pt; radius: number; angle: (r: number) => number };
	/** hang off a parent motion: turn about `at` (uv) by `rot`, then move by (tx, ty) px */
	parent?: { at: Pt; rot: number; tx: number; ty: number };
};
/** the whole tile: squash about its feet, a lift, a turn about the vertical axis (cards, ring), shading */
export type RootPose = { sx: number; sy: number; ty: number; turn: number; shade: number };
export type SymbolPose = {
	root: RootPose;
	bones: Record<string, BonePose>;
	/** additive copy of the acting object (`GLOW` names the bone it covers), 0..1 */
	glow: number;
	/** cut-out copies that leave the drawing (the falling leaf), by SYMBOL_EXTRAS name */
	extras: Record<string, { tx: number; ty: number; rot: number; alpha: number }>;
};

const still = (pivot: Pt = [0.5, 0.5]): BonePose => ({ tx: 0, ty: 0, rot: 0, sx: 1, sy: 1, pivot });

/** brief 3-3 「群組跳起」, kept small and volume-keeping: the tile only breathes, the objects act */
const tileBeat = (u: number, amount = 1): RootPose => {
	const squash = track(u, [[0, 0], [ANT, 1], [ACT, -0.8, 'snap'], [SET, 0.25], [HOLD, 0, 'settle']]) * amount;
	return { sx: 1 + 0.035 * squash, sy: 1 / (1 + 0.035 * squash), ty: -3 * bump(u, ANT, SET) * amount, turn: 0, shade: 1 };
};
/** the acting object's light: up on the action, a smaller second on the settle, gone before the paw */
const glowBeat = (u: number, peak = 0.4) => peak * track(u, [[0, 0], [ACT - 0.04, 1, 'snap'], [SET - 0.04, 0.2], [SET + 0.06, 0.45], [HOLD, 0]]);

/** which bone the additive light covers */
export const GLOW: Record<string, string> = { H1: 'label', H2: 'hat', H3: 'eye', H4: 'umbrella', S: 'grille', L1: 'gem', L2: 'gem', L3: 'gem', L4: 'gem' };

// ---------------------------------------------------------------------------- the acts

/** H1: the gold record winds back, spins a fast turn and a bit, and scratches back onto its mark like a DJ's hand;
 *  the bite in its rim makes the turn readable. */
function record(u: number): SymbolPose {
	const spin = track(u, [[0, 0], [ANT, -0.28], [SET - 0.04, 2 * Math.PI + 0.55, 'snap'], [SET + 0.08, 2 * Math.PI + 0.62], [HOLD, 2 * Math.PI - 0.06, 'soft'], [1, 2 * Math.PI, 'settle']]);
	const disc = still([0.48, 0.49]);
	// a whole turn is the rest pose: hand back exactly 0 at the end so the swap to the still symbol cannot jump
	disc.rot = u >= 1 ? 0 : spin;
	const sq = bump(u, 0, ANT + 0.04);
	disc.sx = 1 + 0.04 * sq;
	disc.sy = 1 - 0.05 * sq;
	const label = { ...disc };
	return { root: tileBeat(u, 0.6), bones: { label, disc }, glow: glowBeat(u, 0.45), extras: {} };
}

/** H2: the pirate hat hops off the headphones and tips to one side, lands with a squat and settles back; the ear
 *  cups pump to the beat; the cord whips, its jack a frame behind its middle. */
function pirateHat(u: number): SymbolPose {
	const hat = still([0.5, 0.47]);
	hat.ty = track(u, [[0, 0], [ANT, 1.5], [ACT, -6, 'snap'], [SET - 0.04, -5], [SET + 0.05, 0.6, 'linear'], [SET + 0.13, -1], [HOLD, 0, 'settle']]);
	hat.rot = track(u, [[0, 0], [ANT, 0.04], [ACT, -0.2, 'snap'], [SET, -0.12], [SET + 0.1, 0.05], [HOLD, 0, 'settle']]);
	const squat = track(u, [[0, 0], [ANT, 1], [ACT, -0.5, 'snap'], [SET, 0], [1, 0]]) + bump(u, SET, SET + 0.12);
	hat.sx = 1 + 0.03 * squat;
	hat.sy = 1 - 0.04 * squat;
	const pump = (n: number) => {
		const p = still(n ? [0.63, 0.6] : [0.26, 0.62]);
		const k = Math.max(bump(u - n * 0.05, ACT - 0.06, ACT + 0.1), 0.6 * bump(u - n * 0.05, SET, SET + 0.14));
		p.sx = p.sy = 1 + 0.07 * k;
		return p;
	};
	const whip: Key[] = [[0, 0], [ANT, 0.1], [ACT - 0.04, -0.45, 'snap'], [ACT + 0.12, 0.4], [SET + 0.1, -0.25], [HOLD, 0.08], [1, 0, 'settle']];
	const cord = still([0.45, 0.72]);
	cord.bend = { root: [0.4, 0.72], dir: [1, 0.05], len: 0.45, a: [0.12 * link(u, whip, 1), 0.18 * link(u, whip, 2), 0.24 * link(u, whip, 3)] };
	return { root: tileBeat(u, 0.5), bones: { cupL: pump(0), cupR: pump(1), hat, cord }, glow: glowBeat(u, 0.3), extras: {} };
}

/** H3: the eye squints, then bulges out of the spyglass and its iris darts left, right and back; the spyglass
 *  kicks back on the bulge and settles. */
function spyglass(u: number): SymbolPose {
	const scope = still([0.14, 0.62]);
	scope.rot = track(u, [[0, 0], [ANT, 0.03], [ACT, -0.07, 'snap'], [SET, 0.025], [HOLD, 0, 'settle']]);
	scope.tx = track(u, [[0, 0], [ANT, 1.5], [ACT, -3, 'snap'], [SET, 1], [HOLD, 0, 'settle']]);
	const along = { at: [0.14, 0.62] as Pt, rot: scope.rot, tx: scope.tx, ty: 0 };
	const eye = still([0.68, 0.5]);
	const bulge = track(u, [[0, 0], [ANT, -1], [ACT, 1.15, 'snap'], [SET, 0.75], [HOLD, 0.15], [1, 0, 'settle']]);
	eye.sx = 1 + 0.12 * Math.max(0, bulge) + 0.03 * Math.min(0, bulge);
	eye.sy = 1 + 0.12 * Math.max(0, bulge) + 0.16 * Math.min(0, bulge);
	eye.parent = along;
	const look = track(u, [[0, 0], [ACT, 0], [ACT + 0.08, -1, 'snap'], [SET + 0.06, 1], [HOLD, 0.2], [1, 0, 'settle']]);
	const iris = still([0.71, 0.48]);
	iris.tx = 5 * look;
	iris.ty = -1 * Math.abs(look);
	iris.sx = eye.sx;
	iris.sy = eye.sy;
	iris.parent = along;
	return { root: tileBeat(u, 0.5), bones: { iris, eye, scope }, glow: glowBeat(u, 0.35), extras: {} };
}

/** H4: the coconut squats and pops; the straw wobbles from its root, its bend a frame behind; the umbrella twirls a
 *  little and rocks; the flower nods after it all. */
function coconut(u: number): SymbolPose {
	const nut = still([0.33, 0.86]);
	const sq = track(u, [[0, 0], [ANT, 1], [ACT, -0.7, 'snap'], [SET, 0.2], [HOLD, 0, 'settle']]);
	nut.sx = 1 + 0.04 * sq;
	nut.sy = 1 - 0.05 * sq;
	const wob = (n: number) => {
		const v = u - ANT - n * 0.05;
		return v <= 0 ? 0 : Math.sin((2 * Math.PI * 2.6 * v) / (1 - ANT)) * Math.exp(-3.4 * v) * Math.min(1, v / 0.06);
	};
	const fade = track(u, [[0, 1], [HOLD, 1], [1, 0, 'soft']]);
	const straw = still([0.42, 0.46]);
	straw.ty = -3 * bump(u, ANT, SET);
	straw.bend = { root: [0.42, 0.46], dir: [0.15, -1], len: 0.4, a: [0.1 * wob(0) * fade, 0.14 * wob(1) * fade, 0.18 * wob(2) * fade] };
	const umbrella = still([0.56, 0.46]);
	umbrella.rot = 0.22 * link(u, [[0, 0], [ANT, 0.15], [ACT, -1, 'snap'], [SET, 0.6], [HOLD, -0.15], [1, 0, 'settle']], 1);
	umbrella.swirl = { c: [0.68, 0.24], radius: 0.22, angle: (r) => 0.25 * Math.min(r, 1) * wob(1) * fade };
	const flower = still([0.62, 0.72]);
	flower.rot = 0.14 * link(u, [[0, 0], [ACT, 0], [SET, -1], [HOLD, 0.4], [1, 0, 'settle']], 2);
	flower.ty = -2 * bump(u, ACT, HOLD);
	return { root: tileBeat(u, 0.6), bones: { flower, umbrella, straw, coconut: nut }, glow: glowBeat(u, 0.3), extras: {} };
}

/** S (the trigger beat): the microphone sings — three shimmies on the beat, each a little smaller — the feather
 *  whipping after it and the parrot charm swinging on its hook like a pendulum that runs down. */
function microphone(u: number): SymbolPose {
	const sing: Key[] = [[0, 0], [0.08, 0.3], [0.2, -1, 'snap'], [0.34, 0.8], [0.48, -0.6], [0.62, 0.45], [0.78, -0.15], [1, 0, 'settle']];
	const mic = still([0.4, 0.88]);
	mic.rot = 0.09 * track(u, sing);
	const pulse = Math.max(bump(u, 0.16, 0.28), 0.8 * bump(u, 0.44, 0.56), 0.6 * bump(u, 0.7, 0.82));
	mic.sx = 1 + 0.035 * pulse;
	mic.sy = 1 + 0.05 * pulse;
	const ride = { at: [0.4, 0.88] as Pt, rot: mic.rot, tx: 0, ty: 0 };
	const grille = { ...mic };
	const feather = still([0.62, 0.3]);
	feather.rot = 0.22 * link(u, sing, 1, 0.06, 1.25);
	feather.parent = ride;
	const charm = still([0.565, 0.48]);
	charm.rot = -0.35 * link(u, sing, 2, 0.07, 1.15);
	charm.parent = ride;
	return { root: tileBeat(u, 0.4), bones: { charm, feather, grille, mic }, glow: 0.5 * pulse, extras: {} };
}

/** L1–L4 (the teardown's low-pay hop): crouch, jump stretched, land squashed, a small rebound; the gem flashes at
 *  the top of the jump. Kept to the low end's quiet. */
function gem(u: number): SymbolPose {
	const jump = track(u, [[0, 0], [0.14, 0], [0.4, 1, 'snap'], [0.62, 0, 'soft'], [0.74, 0.18], [0.86, 0, 'soft']]);
	const crouch = bump(u, 0, 0.16) + bump(u, 0.6, 0.72) * 0.9 + bump(u, 0.84, 0.94) * 0.35;
	const stretch = bump(u, 0.12, 0.5);
	const g = still([0.5, 0.88]);
	return {
		root: { sx: 1 + 0.08 * crouch - 0.08 * stretch, sy: 1 - 0.1 * crouch + 0.07 * stretch, ty: -9 * jump, turn: 0, shade: 1 },
		bones: { gem: g },
		glow: 0.35 * bump(u, 0.3, 0.55),
		extras: {},
	};
}

/** anything else: the tile beat only */
const plain = (u: number): SymbolPose => ({ root: tileBeat(u, 1), bones: {}, glow: 0, extras: {} });

export const symbolAct = (name: string, u: number): SymbolPose => {
	const t = Math.max(0, Math.min(1, u));
	if (name === 'H1') return record(t);
	if (name === 'H2') return pirateHat(t);
	if (name === 'H3') return spyglass(t);
	if (name === 'H4') return coconut(t);
	if (name === 'S') return microphone(t);
	if (name.startsWith('L')) return gem(t);
	return plain(t);
};

/** Cut-out copies of a piece of the art that leave it: name → uv rect (u0, v0, u1, v1) of the symbol's own art. */
export const SYMBOL_EXTRAS: Record<string, Record<string, [number, number, number, number]>> = {};

// ---------------------------------------------------------------------------- skinning

export const GRID = 24;

/** apply one bone's pose to a point in cell px (art centred on 0,0, size w×h) */
function boneMove(b: BonePose, x: number, y: number, w: number, h: number): [number, number] {
	if (b.bend) {
		const { root: r, dir, len, a } = b.bend;
		const dl = Math.hypot(dir[0] * w, dir[1] * h), dx = (dir[0] * w) / dl, dy = (dir[1] * h) / dl;
		const rx = (r[0] - 0.5) * w, ry = (r[1] - 0.5) * h, span = len * Math.max(w, h);
		const s = ((x - rx) * dx + (y - ry) * dy) / span;
		if (s > 0) {
			let off = 0;
			for (let k = 0; k < 3; k++) off += a[k] * Math.max(0, Math.min(s, 1.4) - k / 3);
			x += -dy * off * span;
			y += dx * off * span;
		}
	}
	if (b.swirl) {
		const cx = (b.swirl.c[0] - 0.5) * w, cy = (b.swirl.c[1] - 0.5) * h;
		const r = Math.hypot(x - cx, y - cy) / (b.swirl.radius * Math.max(w, h));
		const an = b.swirl.angle(r), c = Math.cos(an), s = Math.sin(an), ox = x - cx, oy = y - cy;
		x = cx + ox * c - oy * s;
		y = cy + ox * s + oy * c;
	}
	const px = (b.pivot[0] - 0.5) * w, py = (b.pivot[1] - 0.5) * h, c = Math.cos(b.rot), s = Math.sin(b.rot);
	const ox = (x - px) * b.sx, oy = (y - py) * b.sy;
	x = px + ox * c - oy * s + b.tx;
	y = py + ox * s + oy * c + b.ty;
	if (b.parent) {
		const ax = (b.parent.at[0] - 0.5) * w, ay = (b.parent.at[1] - 0.5) * h, pc = Math.cos(b.parent.rot), ps = Math.sin(b.parent.rot);
		const qx = x - ax, qy = y - ay;
		x = ax + qx * pc - qy * ps + b.parent.tx;
		y = ay + qx * ps + qy * pc + b.parent.ty;
	}
	return [x, y];
}

/** the tile: a turn about the vertical axis with a little perspective, then squash about the cell's feet */
function tileMove(root: RootPose, x: number, y: number, cell: number): [number, number] {
	const feet = cell / 2;
	if (root.turn) {
		y *= 1 + 0.14 * Math.sin(root.turn) * (x / feet);
		x *= Math.cos(root.turn);
	}
	return [x * root.sx, (y - feet) * root.sy + feet + root.ty];
}

/** Pose the symbol's art grid into `out` ((GRID+1)² xy pairs, cell px; the art is w×h centred in the cell). */
export function skinSymbol(pose: SymbolPose, rig: { bones: string[]; weights: Float32Array }, w: number, h: number, cell: number, out: Float32Array) {
	const B = rig.bones.length;
	const poses = rig.bones.map((n) => pose.bones[n]);
	for (let gy = 0, v = 0; gy <= GRID; gy++) for (let gx = 0; gx <= GRID; gx++, v++) {
		const x0 = (gx / GRID - 0.5) * w, y0 = (gy / GRID - 0.5) * h;
		let x = x0, y = y0;
		for (let b = 0; b < B; b++) {
			const wt = rig.weights[v * B + b], bp = poses[b];
			if (wt <= 0 || !bp) continue;
			const [mx, my] = boneMove(bp, x0, y0, w, h);
			x += wt * (mx - x0);
			y += wt * (my - y0);
		}
		[out[v * 2], out[v * 2 + 1]] = tileMove(pose.root, x, y, cell);
	}
}

/** Pose a cut-out copy (a rectangle of the art, uv rect `r`) into `out` (4 corners, cell px). */
export function skinExtra(e: { tx: number; ty: number; rot: number }, r: [number, number, number, number], w: number, h: number, root: RootPose, cell: number, out: Float32Array) {
	const cx = ((r[0] + r[2]) / 2 - 0.5) * w, cy = ((r[1] + r[3]) / 2 - 0.5) * h, c = Math.cos(e.rot), s = Math.sin(e.rot);
	const corners: Pt[] = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
	corners.forEach(([u, v], i) => {
		const ox = (u - 0.5) * w - cx, oy = (v - 0.5) * h - cy;
		[out[i * 2], out[i * 2 + 1]] = tileMove(root, cx + ox * c - oy * s + e.tx, cy + ox * s + oy * c + e.ty, cell);
	});
}
