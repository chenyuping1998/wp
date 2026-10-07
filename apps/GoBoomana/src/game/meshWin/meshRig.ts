/**
 * THE SHARED CORE OF THE HIGH-PAY MESH WINS.
 *
 * Each high symbol is one painted subject (cut off its plate by
 * design/make_symbol_layers.mjs) drawn through a triangle mesh with a handful
 * of bones painted onto it — the one-image-one-mesh method of Deadwood
 * Express's conductor (wp/.claude/skills/mesh-cast-rig), at symbol size.
 * Nothing is cut into parts, so there are no seams; a part bends because the
 * drawing bends.
 *
 * This file holds everything the four symbols share: building the grid and its
 * weights from a list of parts, posing and skinning it, and the animation
 * vocabulary (keyed tracks with easing, damped springs). Each symbol's file
 * (h1Scarab.ts ...) only describes its drawing and acts.
 *
 * IMPORTS NOTHING, and neither do the symbol files beyond this one:
 * design/check_mesh_wins.mjs loads them under bare node and poses the mesh with
 * this exact code. SymbolMeshWin.svelte only renders what comes out.
 *
 * Coordinates are the 256px canvas of the symbol art, y DOWN.
 */

export const CANVAS = 256;

export type Point = [number, number];

// ---------------------------------------------------------------------------
// shapes: distance in px from a point to a part (0 anywhere inside it)

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (v: number) => {
	const t = clamp01(v);
	return t * t * (3 - 2 * t);
};

/** distance to a polyline, less its half-width, and how far along it (from the
 *  first point) the nearest point lies */
export const polyline = (path: Point[], halfWidth = 0) => {
	const at = (p: Point) => {
		let best = Infinity, along = 0, walked = 0;
		for (let i = 0; i < path.length - 1; i++) {
			const [ax, ay] = path[i];
			const [bx, by] = path[i + 1];
			const dx = bx - ax, dy = by - ay;
			const len = Math.hypot(dx, dy);
			const t = clamp01(((p[0] - ax) * dx + (p[1] - ay) * dy) / (len * len));
			const d = Math.hypot(ax + t * dx - p[0], ay + t * dy - p[1]);
			if (d < best) {
				best = d;
				along = walked + t * len;
			}
			walked += len;
		}
		return { distance: Math.max(0, best - halfWidth), along };
	};
	return { dist: (p: Point) => at(p).distance, along: (p: Point) => at(p).along };
};

/** a filled polygon (any winding) */
export const polygon = (pts: Point[]) => (p: Point) => {
	let inside = false;
	let best = Infinity;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const [xi, yi] = pts[i], [xj, yj] = pts[j];
		if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
		const dx = xi - xj, dy = yi - yj;
		const t = clamp01(((p[0] - xj) * dx + (p[1] - yj) * dy) / (dx * dx + dy * dy));
		best = Math.min(best, Math.hypot(xj + t * dx - p[0], yj + t * dy - p[1]));
	}
	return inside ? 0 : best;
};

export const circle = (c: Point, r: number) => (p: Point) => Math.max(0, Math.hypot(p[0] - c[0], p[1] - c[1]) - r);

/** superellipse |dx/rx|^n + |dy/ry|^n <= 1; distance approximated along rx */
export const blob = (c: Point, rx: number, ry: number, n = 3) => (p: Point) => {
	const r = Math.pow(Math.abs((p[0] - c[0]) / rx) ** n + Math.abs((p[1] - c[1]) / ry) ** n, 1 / n);
	return Math.max(0, r - 1) * Math.min(rx, ry);
};

export const union =
	(...fns: ((p: Point) => number)[]) =>
	(p: Point) =>
		Math.min(...fns.map((f) => f(p)));

// ---------------------------------------------------------------------------
// the rig

export type PartSpec = {
	name: string;
	/** the part this one hangs from; its world pose is composed onto ours */
	parent?: string;
	pivot: Point;
	/** unit-ish vector along the part, pivot toward tip — the frame `along` and
	 *  `across` scale in. Normalised on build. */
	axis?: Point;
	/** px from a point to this part, 0 inside */
	dist: (p: Point) => number;
	/** how much of the weight this part claims at p that it KEEPS (0..1); the
	 *  rest goes to the parent. A joint blends here instead of tearing. */
	keep?: (p: Point) => number;
	/** px subtracted from this part's distance. Nested parts (a pupil inside
	 *  an eye) are both at distance 0 where they overlap and would split the
	 *  weight 50/50; the inner one takes priority instead. */
	priority?: number;
};

export type RigSpec = {
	grid: { x0: number; y0: number; x1: number; y1: number; cols: number; rows: number };
	parts: PartSpec[];
	/** px width of the soft blend between neighbouring parts. Wider buys joint
	 *  range and drags the neighbour's edge — see the skill. */
	soft: number;
	/** the texture's canvas in rig units, when it is not the 256 square: a
	 *  background is 256 x 144. UVs are x / w and y / h. */
	canvas?: [number, number];
};

export type Bone = { name: string; x: number; y: number; axis: Point; parent: number };

export type Rig = {
	bones: Bone[];
	rest: Float32Array;
	uvs: Float32Array;
	indices: Uint32Array;
	/** vertex-major: weights[v * bones.length + b]; each vertex sums to 1 */
	weights: Float32Array;
};

export const buildRig = (spec: RigSpec): Rig => {
	const { x0, y0, x1, y1, cols, rows } = spec.grid;
	const [cw, ch] = spec.canvas ?? [CANVAS, CANVAS];
	const V = (cols + 1) * (rows + 1);
	const rest = new Float32Array(V * 2);
	const uvs = new Float32Array(V * 2);
	for (let r = 0; r <= rows; r++)
		for (let c = 0; c <= cols; c++) {
			const v = r * (cols + 1) + c;
			const x = x0 + ((x1 - x0) * c) / cols;
			const y = y0 + ((y1 - y0) * r) / rows;
			rest[v * 2] = x;
			rest[v * 2 + 1] = y;
			uvs[v * 2] = x / cw;
			uvs[v * 2 + 1] = y / ch;
		}
	const indices = new Uint32Array(cols * rows * 6);
	for (let r = 0, k = 0; r < rows; r++)
		for (let c = 0; c < cols; c++, k += 6) {
			const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
			indices.set([a, b, e, a, e, d], k);
		}

	const index = new Map(spec.parts.map((p, i) => [p.name, i]));
	const bones: Bone[] = spec.parts.map((p) => {
		const [ax, ay] = p.axis ?? [0, -1];
		const len = Math.hypot(ax, ay) || 1;
		const parent = p.parent === undefined ? -1 : (index.get(p.parent) ?? -1);
		if (p.parent !== undefined && parent < 0) throw new Error(`part ${p.name}: no parent ${p.parent}`);
		return { name: p.name, x: p.pivot[0], y: p.pivot[1], axis: [ax / len, ay / len], parent };
	});

	// Every vertex, inked or in the air round the subject, belongs to the part
	// it is NEAREST, softly (a soft-min over distance). A weight that fades to
	// zero off a limb instead pins the air beside it and tears the limb's edge.
	const B = bones.length;
	const weights = new Float32Array(V * B);
	const dist = new Float64Array(B);
	for (let v = 0; v < V; v++) {
		const p: Point = [rest[v * 2], rest[v * 2 + 1]];
		let nearest = Infinity;
		spec.parts.forEach((part, b) => {
			dist[b] = part.dist(p) - (part.priority ?? 0);
			nearest = Math.min(nearest, dist[b]);
		});
		const row = new Float64Array(B);
		let total = 0;
		for (let b = 0; b < B; b++) {
			row[b] = Math.exp(-(dist[b] - nearest) / spec.soft);
			total += row[b];
		}
		for (let b = 0; b < B; b++) row[b] /= total;
		// joints: hand the unkept share up the chain, children before parents
		for (let b = B - 1; b >= 0; b--) {
			const keepFn = spec.parts[b].keep;
			const parent = bones[b].parent;
			if (!keepFn || parent < 0) continue;
			const keep = clamp01(keepFn(p));
			row[parent] += row[b] * (1 - keep);
			row[b] *= keep;
		}
		for (let b = 0; b < B; b++) weights[v * B + b] = row[b];
	}
	return { bones, rest, uvs, indices, weights };
};

// ---------------------------------------------------------------------------
// the pose

export type BonePose = {
	/** degrees, positive = clockwise on screen (y is down) */
	angle: number;
	/** scale along the bone's axis and across it, about the pivot */
	along: number;
	across: number;
	/** translation, px, applied after rotation and scale */
	dx: number;
	dy: number;
};

export const restBone = (): BonePose => ({ angle: 0, along: 1, across: 1, dx: 0, dy: 0 });

/** The whole subject, moved RIGIDLY: one affine for every vertex, so none of it
 *  can fold a triangle. This is where most of a win's size comes from. */
export type RigidPose = {
	/** squash and stretch about the feet line */
	sx: number;
	sy: number;
	/** degrees, about the feet */
	rot: number;
	/** uniform scale about the canvas centre */
	pop: number;
	dx: number;
	dy: number;
};

export const restRigid = (): RigidPose => ({ sx: 1, sy: 1, rot: 0, pop: 1, dx: 0, dy: 0 });

export type Pose = {
	bones: BonePose[];
	rigid: RigidPose;
	/** additive gold copy of the subject, 0..1 */
	flash: number;
	/** progress of the light sweep 0..1, or <0 when no sweep is on */
	sheen: number;
	/** how far the subject is off the stone, 0..1: drives the drop shadow */
	air: number;
	/** the plate's own knock, a scale on the whole symbol */
	plateHit: number;
};

/** a pose with every bone at rest — build a symbol's pose on top of this */
export const restPose = (rig: Rig): Pose => ({
	bones: rig.bones.map(restBone),
	rigid: restRigid(),
	flash: 0,
	sheen: -1,
	air: 0,
	plateHit: 1,
});

/** the area every triangle is scaled by from the rigid move alone — divided
 *  out by the gate, since it distorts nothing */
export const rigidAreaFactor = (r: RigidPose) => r.sx * r.sy * r.pop * r.pop;

// ---------------------------------------------------------------------------
// skinning — linear blend of per-bone affines through the parent chain, then
// the rigid move

type Affine = Float64Array; // [a, b, c, d, tx, ty]: x' = a x + c y + tx, y' = b x + d y + ty

const localAffine = (bone: Bone, pose: BonePose, out: Affine) => {
	const th = (pose.angle * Math.PI) / 180;
	const cos = Math.cos(th), sin = Math.sin(th);
	const [ux, uy] = bone.axis;
	const nx = -uy, ny = ux;
	const s00 = pose.along * ux * ux + pose.across * nx * nx;
	const s01 = pose.along * ux * uy + pose.across * nx * ny;
	const s11 = pose.along * uy * uy + pose.across * ny * ny;
	const a = cos * s00 - sin * s01;
	const b = sin * s00 + cos * s01;
	const c = cos * s01 - sin * s11;
	const d = sin * s01 + cos * s11;
	out[0] = a;
	out[1] = b;
	out[2] = c;
	out[3] = d;
	out[4] = bone.x - (a * bone.x + c * bone.y) + pose.dx;
	out[5] = bone.y - (b * bone.x + d * bone.y) + pose.dy;
};

const compose = (p: Affine, l: Affine, out: Affine) => {
	// out = p ∘ l
	const a = p[0] * l[0] + p[2] * l[1];
	const b = p[1] * l[0] + p[3] * l[1];
	const c = p[0] * l[2] + p[2] * l[3];
	const d = p[1] * l[2] + p[3] * l[3];
	const tx = p[0] * l[4] + p[2] * l[5] + p[4];
	const ty = p[1] * l[4] + p[3] * l[5] + p[5];
	out[0] = a;
	out[1] = b;
	out[2] = c;
	out[3] = d;
	out[4] = tx;
	out[5] = ty;
};

const scratchLocal: Affine[] = [];
const scratchWorld: Affine[] = [];

export const skin = (rig: Rig, pose: Pose, feetY: number, out: Float32Array) => {
	const B = rig.bones.length;
	while (scratchLocal.length < B) {
		scratchLocal.push(new Float64Array(6));
		scratchWorld.push(new Float64Array(6));
	}
	// parents are always listed before their children
	for (let b = 0; b < B; b++) {
		localAffine(rig.bones[b], pose.bones[b], scratchLocal[b]);
		const parent = rig.bones[b].parent;
		if (parent < 0) scratchWorld[b].set(scratchLocal[b]);
		else compose(scratchWorld[parent], scratchLocal[b], scratchWorld[b]);
	}
	const r = pose.rigid;
	const th = (r.rot * Math.PI) / 180;
	const cos = Math.cos(th), sin = Math.sin(th);
	const cx = CANVAS / 2, cy = CANVAS / 2;
	const V = rig.rest.length / 2;
	for (let v = 0; v < V; v++) {
		const x = rig.rest[v * 2], y = rig.rest[v * 2 + 1];
		let px = 0, py = 0;
		for (let b = 0; b < B; b++) {
			const w = rig.weights[v * B + b];
			if (w === 0) continue;
			const m = scratchWorld[b];
			px += w * (m[0] * x + m[2] * y + m[4]);
			py += w * (m[1] * x + m[3] * y + m[5]);
		}
		// squash on the feet line, turn about the feet, pop about the centre, move
		let qx = cx + (px - cx) * r.sx;
		let qy = feetY + (py - feetY) * r.sy;
		const rx = qx - cx, ry = qy - feetY;
		qx = cx + rx * cos - ry * sin;
		qy = feetY + rx * sin + ry * cos;
		out[v * 2] = cx + (qx - cx) * r.pop + r.dx;
		out[v * 2 + 1] = cy + (qy - cy) * r.pop + r.dy;
	}
};

// ---------------------------------------------------------------------------
// animation vocabulary

export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'back' | 'hold';

const EASES: Record<Ease, (t: number) => number> = {
	linear: (t) => t,
	in: (t) => t * t * t,
	out: (t) => 1 - (1 - t) ** 3,
	inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
	back: (t) => {
		const s = 1.70158, u = t - 1;
		return 1 + u * u * ((s + 1) * u + s);
	},
	hold: () => 0,
};

/** A keyed track: [ms, value, ease INTO this key]. Before the first key it
 *  holds the first value, after the last it holds the last. */
export type Key = [number, number, Ease?];

export const track = (t: number, keys: Key[]): number => {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [t1, v1, ease = 'inOut'] = keys[i];
		if (t <= t1) {
			const [t0, v0] = keys[i - 1];
			const u = (t - t0) / (t1 - t0 || 1);
			return v0 + (v1 - v0) * EASES[ease](u);
		}
	}
	return keys[keys.length - 1][1];
};

/** A damped spring's answer to a kick at t0: 0 before, then an oscillation of
 *  frequency `hz` decaying by `decay` per second, starting at +1 going down.
 *  This is follow-through: a part that keeps moving after what drove it stops. */
export const spring = (t: number, t0: number, hz: number, decay: number) => {
	if (t < t0) return 0;
	const s = (t - t0) / 1000;
	return Math.exp(-decay * s) * Math.cos(2 * Math.PI * hz * s);
};

/** the same, starting from 0 going up — a part that is flicked */
export const flick = (t: number, t0: number, hz: number, decay: number) => {
	if (t < t0) return 0;
	const s = (t - t0) / 1000;
	return Math.exp(-decay * s) * Math.sin(2 * Math.PI * hz * s);
};

/** 0 -> 1 -> 0 over [from, to], smooth */
export const bump = (t: number, from: number, to: number) =>
	t <= from || t >= to ? 0 : Math.sin((Math.PI * (t - from)) / (to - from));

/** 0 -> 1 over [from, to], smooth */
export const ramp = (t: number, from: number, to: number) => smoothstep((t - from) / (to - from));

// ---------------------------------------------------------------------------
// PANEL mode: the frame stays nailed down and everything inside it is one
// mesh on the original art. For symbols whose subject cannot be cut off its
// plate — letters carved INTO the stone, a head painted onto a dark panel —
// the plain stone (or parchment) round the subject is what absorbs the stretch,
// which on a uniform texture nobody can see.

export type Rect = [number, number, number, number];

/** px inside the inner rect (0 on and outside it) */
const depthIn = (r: Rect, p: Point) =>
	Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

/** The two parts every panel starts with: `frame`, the root, which owns the
 *  border band and never moves; and `panel`, everything inside, which carries
 *  the subject's whole-body moves (the pop, the hop, the lean) and hands its
 *  weight back to the frame over `fade` px of plain panel. */
export const panelParts = (inner: Rect, fade = 16): PartSpec[] => [
	{
		name: 'frame',
		pivot: [CANVAS / 2, CANVAS / 2],
		dist: (p) => Math.min(14, depthIn(inner, p)),
	},
	{
		name: 'panel',
		parent: 'frame',
		pivot: [(inner[0] + inner[2]) / 2, inner[3]],
		axis: [0, -1],
		dist: (p) => (depthIn(inner, p) > 0 ? 0 : 14),
		keep: (p) => smoothstep((depthIn(inner, p) - 2) / fade),
	},
];

// ---------------------------------------------------------------------------
// what a symbol provides

export type MeshWinSpec = {
	/** the symbol id in the maths */
	symbol: string;
	/** asset key prefix: `${key}Plate`, `${key}Subject`, `${key}Shadow`,
	 *  `${key}Sheen` (cut mode); `${key}Glow`, `${key}Sheen` (panel mode) */
	key: string;
	/** 'cut' (default): the subject is cut off its plate and acts ON it, with a
	 *  drop shadow. 'panel': the whole inside of the frame is the mesh (see
	 *  panelParts); the rigid move must stay at rest, since it would move the
	 *  frame too. */
	mode?: 'cut' | 'panel';
	/** panel mode: the art's own sprite key, drawn through the mesh */
	sprite?: string;
	/** panel mode: where the drawing matters — the gate checks fold and stretch
	 *  here, and the glow and light sweep are masked to it */
	inked?: (p: Point) => boolean;
	/** panel mode: a colour test narrowing the glow and light-sweep masks to
	 *  the subject's own pixels inside `inked`. The scatter needs it — its
	 *  outline takes in parchment between the bananas, and a flash lighting a
	 *  straight-edged patch of parchment is plainly visible. */
	inkColor?: (r: number, g: number, b: number) => boolean;
	rig: RigSpec;
	/** where the subject stands — the squash and the drop shadow pivot here */
	feetY: number;
	/** when the win reports complete, ms at normal speed */
	durationMs: number;
	/** the landing, ms: the dust puff fires here */
	landMs: number;
	/** the peak of the hit, ms: the sparkle burst fires here */
	hitMs: number;
	/** where the sparks fly from, canvas px (default: the middle). The picks'
	 *  sparks belong where their blade tips clash, at the top. */
	sparkAt?: Point;
	/** the additive flash's colour (default gold). The crystal is lit cyan: a
	 *  gold flash on it read as the crystal turning yellow. */
	flashTint?: number;
	/** rotation limits per bone, degrees, by sign — measured, see the gate */
	limits: Record<string, { pos: number; neg: number }>;
	/** bones allowed to collapse (a blink): the fold floor does not apply to
	 *  the triangles they own, but they may still never invert */
	collapsible?: string[];
	pose: (rig: Rig, ms: number) => Pose;
};

// ---------------------------------------------------------------------------
// the last beat: every win ends EXACTLY at rest

/** How long the pose takes to blend home at the end of the beat. */
export const SETTLE_MS = 180;

const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Wrap a spec so its last SETTLE_MS blend the pose to rest, and stay there.
 *
 * When the win reports complete, the board swaps the mesh for the static
 * sprite. Springs decay but never reach zero, so every symbol was still up to
 * ~1px (board) off the drawing at that moment — a small visible jump on every
 * win. Blending home over the last 180ms removes it without touching the
 * acting before that; check_mesh_wins.mjs fails any win that does not end at
 * rest.
 */
export const settled = (spec: MeshWinSpec): MeshWinSpec => ({
	...spec,
	pose: (rig, t) => {
		const pose = spec.pose(rig, t);
		const k = smoothstep((t - (spec.durationMs - SETTLE_MS)) / SETTLE_MS);
		if (k <= 0) return pose;
		for (const b of pose.bones) {
			b.angle = mix(b.angle, 0, k);
			b.along = mix(b.along, 1, k);
			b.across = mix(b.across, 1, k);
			b.dx = mix(b.dx, 0, k);
			b.dy = mix(b.dy, 0, k);
		}
		const r = pose.rigid;
		r.sx = mix(r.sx, 1, k);
		r.sy = mix(r.sy, 1, k);
		r.rot = mix(r.rot, 0, k);
		r.pop = mix(r.pop, 1, k);
		r.dx = mix(r.dx, 0, k);
		r.dy = mix(r.dy, 0, k);
		pose.flash = mix(pose.flash, 0, k);
		pose.air = mix(pose.air, 0, k);
		pose.plateHit = mix(pose.plateHit, 1, k);
		if (k >= 1) pose.sheen = -1;
		return pose;
	},
});
