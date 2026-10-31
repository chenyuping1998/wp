/**
 * Purrfia symbol wins, acted by the OBJECTS INSIDE each symbol (user 2026-10-30: 「獎圖裡面的物件動起來，而不是
 * 整張伸縮」) — on the symbol's OWN drawing. The separately painted parts (symbols/parts/*) are a different
 * drawing from the symbol art (different fish size, lid, bow, gem, leaves), so swapping to them on a win made
 * every win start with a visible jump. Here the full art is one dense mesh and each object is a soft-weighted
 * region of it ("bone"): the fish, the lid, the tail, the bow, the leaves, the gem, the ring's white hair.
 *
 * What each object does is the brief's 3-8; how it moves follows the Pragmatic Play teardown
 * (wp/.claude/skills/slot-motion-recipes):
 *  - one beat inside the win window: anticipation → action → settle with overshoot → moving hold → rest
 *  - Spine's default bezier [.25,0,.75,1] (≈smoothstep) everywhere, never a free-running sine
 *  - follow-through by LAG: one curve per chain, each link later and a little larger toward the tip
 *  - hinges and parents (the lid turns about its hinge, the bow rides the rolling ball)
 *  - a fake 3-D look on the goldfish: a Gaussian share of the face slides toward where it looks
 *  - light is an additive copy of the acting object only, on the beat
 * The tile itself only gets a small, volume-keeping squash (brief 3-3 「群組跳起」).
 *
 * `u` runs 0..1 over the win window (tumbleTiming().markMs: 513ms normal, shorter in turbo and long chains; the
 * ring's trigger beat is 820ms). Every pose ends exactly at rest at u = 1. IMPORTS NOTHING, so
 * design/render_symbol_acting.mjs poses it under bare node.
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
		// fins stop short of the glass, or flapping them drags the bowl's edge with them
		['finL', poly([[0.2, 0.42], [0.3, 0.46], [0.3, 0.62], [0.22, 0.66], [0.19, 0.55]], 0.025)],
		['finR', poly([[0.62, 0.44], [0.74, 0.42], [0.77, 0.55], [0.7, 0.64], [0.62, 0.6]], 0.025)],
		['face', gauss([0.47, 0.47], 0.2, 0.6)],
		['fish', ellipse([0.47, 0.53], 0.26, 0.25, 0.2)],
		// the water line sits under the rim; the rim and the glass stay put
		['water', poly([[0.22, 0.25], [0.78, 0.25], [0.8, 0.31], [0.2, 0.31]], 0.025)],
	],
	H2: [
		['tail', poly([[0.6, 0.3], [0.72, 0.24], [0.92, 0.2], [0.94, 0.3], [0.88, 0.47], [0.72, 0.44], [0.6, 0.4]], 0.035)],
		['lid', poly([[0.36, 0.38], [0.38, 0.22], [0.45, 0.14], [0.57, 0.12], [0.62, 0.2], [0.6, 0.33], [0.53, 0.42], [0.42, 0.42]], 0.035)],
		['can', poly([[0.1, 0.35], [0.94, 0.35], [0.94, 0.86], [0.1, 0.86]], 0.02)],
	],
	H3: [
		// the knot, the right loop and the two tails; the left loop lies ON the ball and turns with it
		['bow', union(ellipse([0.63, 0.53], 0.08, 0.08, 0.3), poly([[0.66, 0.46], [0.8, 0.28], [0.92, 0.3], [0.88, 0.45], [0.7, 0.56]], 0.035),
			poly([[0.66, 0.56], [0.74, 0.6], [0.86, 0.82], [0.76, 0.86], [0.66, 0.66]], 0.035))],
		// everything else is the ball and what lies on it, turned rigidly: a soft edge round a turning region
		// tears the yarn where it meets the part that stays (the art is transparent round the ball anyway)
		['ball', () => 1],
	],
	H4: [
		['sprigL', poly([[0.11, 0.66], [0.3, 0.64], [0.4, 0.82], [0.28, 0.9], [0.1, 0.84]], 0.035)],
		['sprigR', poly([[0.68, 0.64], [0.8, 0.62], [0.9, 0.8], [0.76, 0.86], [0.68, 0.74]], 0.035)],
		// the foliage only: on the right it stops above the broken rim, or the shard rises with the plant
		['leaves', poly([[0.14, 0.42], [0.22, 0.2], [0.42, 0.08], [0.66, 0.1], [0.84, 0.26], [0.74, 0.37], [0.6, 0.41], [0.3, 0.48]], 0.04)],
		['pot', poly([[0.18, 0.45], [0.8, 0.45], [0.74, 0.88], [0.24, 0.88]], 0.03)],
	],
	S: [
		['hair', poly([[0.6, 0.5], [0.7, 0.52], [0.74, 0.7], [0.72, 0.9], [0.56, 0.96], [0.56, 0.86], [0.62, 0.72]], 0.035)],
		['gem', ellipse([0.53, 0.33], 0.19, 0.17, 0.15)],
	],
};

/** Weight table for a symbol: weights[v * B + b] over a (GRID+1)² grid; rows sum to ≤ 1 (the rest stays put). */
export function rigWeights(name: string): { bones: string[]; weights: Float32Array } {
	const rig = RIGS[name] ?? [];
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
export const GLOW: Record<string, string> = { H1: 'fish', H2: 'lid', H3: 'ball', H4: 'leaves', S: 'gem' };

// ---------------------------------------------------------------------------- the acts (brief 3-8)

/** H1: pressed to the glass, the goldfish springs back into the bowl (smaller = further away), glances left and
 *  right with its whole face, then darts forward and bumps the glass; fins flap a frame apart; the water rocks. */
function goldfish(u: number): SymbolPose {
	const back = track(u, [[0, 0], [ANT, -0.25], [ACT, 1, 'snap'], [SET + 0.08, 0.85], [HOLD - 0.04, -0.15, 'soft'], [1, 0, 'settle']]);
	const fish = still([0.47, 0.6]);
	fish.sx = fish.sy = 1 - 0.17 * back;
	fish.ty = -6 * back;
	const glance = track(u, [[0, 0], [ANT + 0.06, 0], [ACT, -1], [SET, 1], [HOLD - 0.06, 0.4], [1, 0, 'settle']]);
	const face = still();
	face.tx = 12 * glance;
	face.ty = -2 * Math.abs(glance);
	const flap: Key[] = [[0, 0], [ANT, 0.2], [ACT - 0.05, -1, 'snap'], [ACT + 0.1, 0.8], [SET + 0.06, -0.6], [HOLD, 0.25], [1, 0, 'settle']];
	const finL = still([0.3, 0.52]);
	finL.rot = -0.45 * link(u, flap, 1);
	const finR = still([0.63, 0.5]);
	finR.rot = 0.45 * link(u, flap, 2);
	const water = still([0.5, 0.22]);
	water.ty = 2.5 * link(u, [[0, 0], [ACT, 0], [SET, -1], [HOLD, 0.5], [1, 0, 'settle']], 1);
	water.rot = 0.05 * link(u, [[0, 0], [ACT, 0.4], [SET, -1], [HOLD, 0.6], [1, 0, 'settle']], 1);
	return { root: tileBeat(u, 0.6), bones: { fish, face, finL, finR, water }, glow: glowBeat(u), extras: {} };
}

/** H2: the lid springs up off its hinge and slaps back down (the can squats on the landing); the fish tail slaps
 *  twice, its tip a frame behind its root. */
function tunaCan(u: number): SymbolPose {
	const lid = still([0.45, 0.41]);
	lid.rot = track(u, [[0, 0], [ANT, 0.05], [ACT, -0.32, 'snap'], [SET - 0.06, -0.24], [SET + 0.03, 0.04, 'linear'], [SET + 0.11, -0.05], [HOLD, 0, 'settle']]);
	lid.ty = track(u, [[0, 0], [ANT, 1], [ACT, -5, 'snap'], [SET - 0.06, -4], [SET + 0.03, 0, 'linear'], [SET + 0.11, -1], [HOLD, 0, 'settle']]);
	const slap: Key[] = [[0, 0], [ANT, 0.15], [ACT - 0.06, -0.5, 'snap'], [ACT + 0.1, 0.42], [SET + 0.08, -0.4, 'snap'], [HOLD - 0.04, 0.12], [1, 0, 'settle']];
	const tail = still([0.64, 0.38]);
	tail.rot = 0.32 * link(u, slap, 0);
	tail.bend = { root: [0.66, 0.37], dir: [1, -0.4], len: 0.3, a: [0.2 * link(u, slap, 1), 0.25 * link(u, slap, 2), 0.3 * link(u, slap, 3)] };
	const can = still([0.5, 0.86]);
	const crouch = track(u, [[0, 0], [ANT, 1], [ACT, -0.4, 'snap'], [SET, 0], [1, 0]]) + bump(u, SET, SET + 0.14);
	can.sx = 1 + 0.025 * crouch;
	can.sy = 1 - 0.03 * crouch;
	return { root: tileBeat(u, 0.5), bones: { tail, lid, can }, glow: glowBeat(u, 0.3), extras: {} };
}

/** H3: the ball rolls forward and rocks back (its yarn turning inside its own outline); the bow rides it a frame
 *  late and its loops whip when the ball stops. */
function yarn(u: number): SymbolPose {
	const roll: Key[] = [[0, 0], [ANT, -0.1], [ACT + 0.08, 0.42], [SET + 0.06, 0.3], [HOLD, -0.05, 'soft'], [1, 0, 'settle']];
	const ball = still([0.43, 0.44]);
	ball.rot = track(u, roll);
	ball.tx = 7 * ball.rot;
	const sq = bump(u, 0, ANT + 0.05);
	ball.sx = 1 + 0.04 * sq;
	ball.sy = 1 - 0.05 * sq;
	// the bow is tied to the ball: it turns with it exactly (any lag here shears the knot off the yarn); the
	// follow-through is the loops' whip
	const bow = still([0.63, 0.53]);
	bow.parent = { at: [0.43, 0.44], rot: ball.rot, tx: ball.tx, ty: 0 };
	const whip: Key[] = [[0, 0], [ACT, 0], [ACT + 0.1, 0.5], [SET + 0.06, -0.42], [HOLD - 0.04, 0.16], [1, 0, 'settle']];
	bow.swirl = { c: [0.63, 0.53], radius: 0.3, angle: (r) => 0.45 * Math.min(r, 1) * track(u - 0.08 * r, whip) };
	return { root: tileBeat(u, 0.5), bones: { bow, ball }, glow: glowBeat(u, 0.32), extras: {} };
}

/** H4: the plant shoots up out of the pot and shakes, its tips a frame behind the stem; the sprigs on the floor
 *  flutter after it; one leaf lets go and drifts down past the pot. */
function catnip(u: number): SymbolPose {
	const shake = (n: number) => {
		const v = u - ANT - n * 0.05;
		return v <= 0 ? 0 : Math.sin((2 * Math.PI * 3.2 * v) / (1 - ANT)) * Math.exp(-3.2 * v) * Math.min(1, v / 0.06);
	};
	const fade = track(u, [[0, 1], [HOLD, 1], [1, 0, 'soft']]);
	const leaves = still([0.45, 0.5]);
	leaves.ty = 4 * track(u, [[0, 0], [ANT, 0.4], [ACT, -1, 'snap'], [SET, -0.25], [HOLD, 0, 'settle']]);
	leaves.sy = 1 + 0.06 * bump(u, ANT, SET);
	leaves.bend = { root: [0.45, 0.52], dir: [0, -1], len: 0.42, a: [0.12 * shake(0) * fade, 0.16 * shake(1) * fade, 0.2 * shake(2) * fade] };
	const sprigL = still([0.3, 0.84]);
	sprigL.rot = -0.18 * shake(2) * fade;
	const sprigR = still([0.72, 0.8]);
	sprigR.rot = 0.18 * shake(3) * fade;
	const pot = still([0.48, 0.88]);
	const sq = track(u, [[0, 0], [ANT, 1], [ACT, -0.5, 'snap'], [SET, 0], [1, 0]]);
	pot.sx = 1 + 0.03 * sq;
	pot.sy = 1 - 0.035 * sq;
	const fall = Math.max(0, u - ACT);
	const leaf = {
		tx: -8 * fall + 3.5 * Math.sin(fall * 14),
		ty: leaves.ty + 60 * fall * fall + 10 * fall,
		rot: -2.2 * fall + 0.25 * Math.sin(fall * 14),
		alpha: fall <= 0 ? 0 : track(u, [[ACT, 1], [0.72, 1], [0.95, 0, 'soft']]),
	};
	return { root: tileBeat(u, 0.5), bones: { sprigL, sprigR, leaves, pot }, glow: glowBeat(u, 0.3), extras: { h4_leaf: leaf } };
}

/** S (the trigger beat): the ring spins one turn about its vertical axis, the white hair whipping behind it, then
 *  the gem flashes three times. */
function ring(u: number): SymbolPose {
	const turn = track(u, [[0, 0], [0.08, -0.15], [0.6, 2 * Math.PI, 'soft'], [0.66, 2 * Math.PI]]);
	const root = tileBeat(u, 0.5);
	root.turn = turn;
	root.ty += -5 * bump(u, 0.05, 0.62);
	root.shade = 1 - 0.3 * Math.abs(Math.sin(turn));
	const swing: Key[] = [[0, 0], [0.1, 0.3], [0.35, -0.8], [0.6, 0.7], [0.75, -0.3], [0.9, 0.1], [1, 0, 'settle']];
	const hair = still([0.63, 0.52]);
	hair.rot = 0.15 * link(u, swing, 0);
	hair.bend = { root: [0.63, 0.52], dir: [0.1, 1], len: 0.42, a: [0.25 * link(u, swing, 1), 0.3 * link(u, swing, 2), 0.35 * link(u, swing, 3)] };
	const gem = still([0.53, 0.33]);
	gem.sx = gem.sy = 1 + 0.08 * bump(u, 0.62, 0.95);
	const glow = 0.75 * Math.max(bump(u, 0.62, 0.72), bump(u, 0.72, 0.82), bump(u, 0.82, 0.94));
	return { root, bones: { hair, gem }, glow, extras: {} };
}

/** L1–L4 (brief: cards only flip, keep the low end quiet): one full turn about the vertical axis with a lift. */
function card(u: number): SymbolPose {
	const turn = track(u, [[0, 0], [0.06, -0.12], [0.46, 2 * Math.PI, 'soft'], [0.56, 2 * Math.PI + 0.1], [0.7, 2 * Math.PI, 'settle']]);
	return { root: { sx: 1, sy: 1, ty: -4 * bump(u, 0.04, 0.6), turn, shade: 1 - 0.35 * Math.abs(Math.sin(turn)) }, bones: {}, glow: 0, extras: {} };
}

/** anything else (the wild coin, the mystery box): the tile beat only */
const plain = (u: number): SymbolPose => ({ root: tileBeat(u, 1), bones: {}, glow: 0, extras: {} });

export const symbolAct = (name: string, u: number): SymbolPose => {
	const t = Math.max(0, Math.min(1, u));
	if (name === 'H1') return goldfish(t);
	if (name === 'H2') return tunaCan(t);
	if (name === 'H3') return yarn(t);
	if (name === 'H4') return catnip(t);
	if (name === 'S') return ring(t);
	if (name.startsWith('L')) return card(t);
	return plain(t);
};

/** Cut-out copies of a piece of the art that leave it: name → uv rect (u0, v0, u1, v1) of the symbol's own art. */
export const SYMBOL_EXTRAS: Record<string, Record<string, [number, number, number, number]>> = {
	H4: { h4_leaf: [0.14, 0.32, 0.31, 0.47] },
};

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
