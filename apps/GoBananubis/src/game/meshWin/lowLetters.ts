/**
 * L1-L5 — THE CARVED LETTERS, A K Q J 10.
 *
 * They are carved INTO the plate's own stone, so there is nothing to cut off:
 * they run in PANEL mode (meshRig.panelParts). The frame stays put, the stone
 * inside it is one mesh, and the plain stone round each letter soaks up the
 * stretch.
 *
 * Low pays win on most spins, so they get a lighter, shorter beat than the
 * high pays — a small hop off the stone — and each letter one gesture of its
 * own, taken from its shape: the A's legs splay like a jumping jack, the K
 * kicks, the Q flicks its tail, the J's hook swings, the 1 and the 0 hop in
 * turn. A board of five identical wobbles is what these replaced.
 */
import {
	landFlick,
	boneOf,
	bump,
	flick,
	panelParts,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [26, 26, 230, 230];
const T = { crouch: 100, rise: 300, fall: 900, land: 1060, done: 1200 };
const GRID = { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 };

/** the beat every letter shares: squat, pop off the stone, hang, land */
const letterBeat = (rig: Rig, t: number): Pose => {
	const pose = restPose(rig);
	const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
	const panel = pose.bones[rig.bones.findIndex((b) => b.name === 'panel')];
	// the panel's axis is UP, so `along` is the letter's height
	// 1.03, not 1.05: at 5% (with the lift) the A, J and 10 all but touched
	// the top frame bar at the hit, which reads as cramped, not as a pop
	panel.along = track(t, [[0, 1], [T.crouch, 0.93, 'out'], [200, 1.03, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.95, 'out'], [T.done, 1, 'out']]);
	panel.across = track(t, [[0, 1], [T.crouch, 1.04, 'out'], [200, 0.97, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 1.03, 'out'], [T.done, 1, 'out']]);
	// while it hangs off the stone it floats — a slow bob, so the hold is not
	// a freeze (the review measured the A standing dead still for 330ms)
	const hover = ramp(t, 260, 380) * (1 - ramp(t, 820, 920));
	panel.dy = -4 * air - 2 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 460);
	pose.air = Math.max(0, Math.min(1, air));
	pose.flash = 0.3 * track(t, [[T.crouch, 0], [190, 1, 'out'], [560, 0, 'in']]);
	pose.sheen = t >= 330 && t <= 860 ? (t - 330) / 530 : -1;
	pose.plateHit = 1 + 0.03 * bump(t, T.crouch, 360) + 0.02 * bump(t, T.land, T.land + 120);
	return pose;
};

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a limb of a letter: a stroke hanging from a joint, blending in over `ramp` px */
const stroke = (name: string, path: Point[], half: number, rampPx = 16): PartSpec => {
	const line = polyline(path, half);
	const [px, py] = path[0];
	const [tx, ty] = path[path.length - 1];
	return {
		name,
		parent: 'panel',
		pivot: path[0],
		axis: [tx - px, ty - py],
		priority: 3,
		dist: line.dist,
		keep: (p) => smoothstep((line.along(p) - 4) / rampPx),
	};
};

const letter = (
	symbol: string,
	inked: (p: Point) => number,
	parts: PartSpec[],
	limits: MeshWinSpec['limits'],
	act: (rig: Rig, pose: Pose, t: number) => void,
	land?: MeshWinSpec['land'],
): MeshWinSpec => ({
	land,
	symbol,
	key: `gb${symbol}`,
	sprite: `gb${symbol}`,
	mode: 'panel',
	feetY: INNER[3],
	durationMs: T.done,
	landMs: T.land,
	hitMs: 190,
	inked: (p) => inked(p) === 0,
	rig: { grid: GRID, soft: 4, parts: [...panelParts(INNER), ...parts] },
	// the panel is only ever turned by the Q (2deg); the rest never turn it
	limits: { panel: { pos: 2.5, neg: 2.5 }, ...limits },
	pose: (rig, t) => {
		const pose = letterBeat(rig, t);
		act(rig, pose, t);
		return pose;
	},
});

// ---- A: legs splay from the apex, twice, like a jumping jack ---------------
const A_LEFT: Point[] = [[122, 74], [64, 188]];
const A_RIGHT: Point[] = [[130, 74], [188, 188]];
export const L1 = letter(
	'L1',
	union(polygon([[88, 50], [168, 50], [168, 72], [208, 200], [148, 200], [140, 164], [112, 164], [104, 200], [48, 200], [90, 72]])),
	[stroke('leg_l', A_LEFT, 13, 22), stroke('leg_r', A_RIGHT, 13, 22)],
	// geometric: leg_l +4 -3.5, leg_r +3.5 -3.5
	{ leg_l: { pos: 3.2, neg: 2 }, leg_r: { pos: 2, neg: 3.2 } },
	(rig, pose, t) => {
		const air = Math.min(1, pose.air);
		// + swings the left foot out, - the right (the gate's travel confirms)
		// two jumping jacks, the second smaller — one left the A standing still
		// through the second half of the hold
		const splay = 1.2 * air + 1.8 * Math.max(0, flick(t, 420, 2.4, 2.6)) + 1.4 * Math.max(0, flick(t, 700, 2.4, 3));
		bone(rig, pose, 'leg_l').angle = splay;
		bone(rig, pose, 'leg_r').angle = -splay;
	},
	(rig, t, k, pose) => {
		const splay = 1.8 * k * Math.max(0, landFlick(t));
		boneOf(rig, pose, 'leg_l').angle = splay;
		boneOf(rig, pose, 'leg_r').angle = -splay;
	},
);

// ---- K: the leg kicks out, the arm waves after it ----------------------------
export const L2 = letter(
	'L2',
	union(polygon([[50, 50], [118, 50], [118, 110], [140, 52], [204, 52], [204, 72], [150, 125], [208, 184], [208, 200], [142, 200], [118, 150], [118, 184], [118, 200], [50, 200]])),
	[stroke('arm', [[112, 126], [190, 62]], 13, 18), stroke('leg', [[112, 130], [200, 192]], 14, 18)],
	// geometric: arm +5 -5, leg +4.5 -5.5
	{ arm: { pos: 4, neg: 4 }, leg: { pos: 3, neg: 5 } },
	(rig, pose, t) => {
		// - lifts the leg's foot up and out: the kick
		bone(rig, pose, 'leg').angle = -5 * Math.max(0, flick(t, 360, 2, 2.4)) + 1.5 * flick(t, T.land, 3, 5);
		bone(rig, pose, 'arm').angle = 3 * flick(t, 440, 2.2, 2.8);
	},
	(rig, t, k, pose) => {
		boneOf(rig, pose, 'leg').angle = -2.5 * k * Math.max(0, landFlick(t));
	},
);

// ---- Q: the tail flicks while the body rocks on its base ---------------------
const Q_TAIL = polyline([[140, 150], [172, 178], [206, 194]], 12);
export const L3 = letter(
	'L3',
	union(polygon([[52, 50], [188, 50], [188, 176], [212, 184], [212, 202], [52, 202]])),
	[
		{
			name: 'tail',
			parent: 'panel',
			pivot: [140, 150],
			axis: [66, 44],
			priority: 3,
			dist: Q_TAIL.dist,
			keep: (p) => smoothstep((Q_TAIL.along(p) - 4) / 18),
		},
	],
	// geometric: tail +8 -9
	{ tail: { pos: 7, neg: 7 } },
	(rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 7 * flick(t, 360, 2.6, 2.6) - 3 * flick(t, T.land, 3, 5);
		// the body rocks on its base
		bone(rig, pose, 'panel').angle = 2 * Math.sin((2 * Math.PI * (t - T.rise)) / 520) * ramp(t, 250, 380) * (1 - ramp(t, 800, 1000));
	},
	(rig, t, k, pose) => {
		boneOf(rig, pose, 'tail').angle = 4 * k * landFlick(t, 40);
	},
);

// ---- J: the hook swings like a pendulum from the stem ------------------------
export const L4 = letter(
	'L4',
	union(polygon([[132, 48], [204, 48], [204, 72], [196, 72], [196, 172], [170, 200], [100, 200], [66, 180], [66, 142], [104, 142], [104, 172], [150, 176], [150, 72], [132, 72]])),
	[
		{
			name: 'hook',
			parent: 'panel',
			pivot: [173, 118],
			axis: [0, 1],
			priority: 3,
			dist: polygon([[62, 136], [200, 136], [200, 206], [62, 206]]),
			keep: (p) => smoothstep((p[1] - 124) / 18),
		},
	],
	// geometric: hook +18.5 -17 — the stone round it is wide open, so it swings big
	{ hook: { pos: 9, neg: 9 } },
	(rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 8 * flick(t, 340, 1.7, 2.2) - 3 * flick(t, T.land, 2.4, 4);
	},
	(rig, t, k, pose) => {
		boneOf(rig, pose, 'hook').angle = 4 * k * landFlick(t, 40);
	},
);

// ---- 10: the 1 hops, then the 0 --------------------------------------------
// their tops sit at the edge of the panel's fade band: 3px on top of the
// panel's own lift, or the band folds (5px folded it to 44%)
const hop = (t: number, t0: number, h: number) => -h * Math.max(0, flick(t, t0, 2.2, 3.2));
export const L5 = letter(
	'L5',
	union(polygon([[42, 50], [114, 50], [114, 202], [52, 202]]), polygon([[118, 48], [214, 48], [214, 204], [118, 204]])),
	[
		{
			name: 'one',
			parent: 'panel',
			pivot: [80, 202],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[42, 50], [114, 50], [114, 202], [52, 202]]),
		},
		{
			name: 'zero',
			parent: 'panel',
			pivot: [166, 204],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[120, 48], [214, 48], [214, 204], [120, 204]]),
		},
	],
	// geometric: one +3 -3, zero +3 -3.5 (never turned: they hop)
	{ one: { pos: 0.5, neg: 0.5 }, zero: { pos: 0.5, neg: 0.5 } },
	(rig, pose, t) => {
		const one = bone(rig, pose, 'one');
		one.dy = hop(t, 330, 3);
		one.along = 1 + 0.05 * Math.max(0, flick(t, 330, 2.2, 3.2));
		const zero = bone(rig, pose, 'zero');
		zero.dy = hop(t, 470, 3);
		zero.along = 1 + 0.05 * Math.max(0, flick(t, 470, 2.2, 3.2)) - 0.04 * bump(t, T.land, T.land + 140);
		zero.across = 1 + 0.04 * bump(t, T.land, T.land + 140);
	},
	(rig, t, k, pose) => {
		// the 0 is heavier: it squats a beat after the 1
		boneOf(rig, pose, 'one').along = 1 - 0.05 * k * Math.max(0, landFlick(t, 20));
		boneOf(rig, pose, 'zero').along = 1 - 0.06 * k * Math.max(0, landFlick(t, 60));
	}
);
