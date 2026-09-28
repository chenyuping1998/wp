/**
 * L1-L5 — THE CARVED LETTERS, A K Q J 10.
 *
 * Ported from GoBananubis with this game's letters traced over again: the
 * gestures are the same idea, every coordinate below is measured on this
 * game's l{n}.png, and every limit re-measured on its mesh (2026-09-25).
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

const INNER: Rect = [24, 22, 232, 232];
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
): MeshWinSpec => ({
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
const A_LEFT: Point[] = [[118, 78], [80, 188]];
const A_RIGHT: Point[] = [[140, 78], [176, 188]];
export const L1 = letter(
	'L1',
	union(polygon([[88, 54], [168, 54], [168, 80], [204, 198], [144, 198], [138, 166], [106, 166], [100, 198], [52, 198], [92, 80]])),
	[stroke('leg_l', A_LEFT, 13, 22), stroke('leg_r', A_RIGHT, 13, 22)],
	// geometric (this game's A): leg_l +4 -4, leg_r +4 -4
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
);

// ---- K: the leg kicks out, the arm waves after it ----------------------------
export const L2 = letter(
	'L2',
	union(polygon([[60, 54], [118, 54], [118, 110], [138, 54], [202, 54], [202, 72], [150, 122], [206, 182], [206, 198], [140, 198], [118, 150], [118, 198], [60, 198]])),
	[stroke('arm', [[112, 128], [182, 62]], 13, 18), stroke('leg', [[114, 132], [188, 190]], 14, 18)],
	// geometric (this game's K): arm +5.5 -5.5, leg +5.5 -5
	{ arm: { pos: 4, neg: 4 }, leg: { pos: 3, neg: 4 } },
	(rig, pose, t) => {
		// - lifts the leg's foot up and out: the kick
		bone(rig, pose, 'leg').angle = -3.8 * Math.max(0, flick(t, 360, 2, 2.4)) + 1.5 * flick(t, T.land, 3, 5);
		bone(rig, pose, 'arm').angle = 3 * flick(t, 440, 2.2, 2.8);
	},
);

// ---- Q: the tail flicks while the body rocks on its base ---------------------
const Q_TAIL = polyline([[124, 146], [152, 176], [192, 192]], 12);
export const L3 = letter(
	'L3',
	union(polygon([[72, 56], [196, 56], [196, 198], [72, 198]])),
	[
		{
			name: 'tail',
			parent: 'panel',
			pivot: [124, 146],
			axis: [68, 46],
			priority: 3,
			dist: Q_TAIL.dist,
			keep: (p) => smoothstep((Q_TAIL.along(p) - 4) / 18),
		},
	],
	// geometric (this game's Q): tail +7 -6
	{ tail: { pos: 5.5, neg: 4.5 } },
	(rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 5.4 * flick(t, 360, 2.6, 2.6) - 3 * flick(t, T.land, 3, 5);
		// the body rocks on its base
		bone(rig, pose, 'panel').angle = 2 * Math.sin((2 * Math.PI * (t - T.rise)) / 520) * ramp(t, 250, 380) * (1 - ramp(t, 800, 1000));
	},
);

// ---- J: the hook swings like a pendulum from the stem ------------------------
export const L4 = letter(
	'L4',
	union(polygon([[102, 58], [198, 58], [198, 164], [176, 188], [96, 188], [72, 170], [72, 138], [110, 138], [110, 158], [150, 160], [150, 80], [102, 80]])),
	[
		{
			name: 'hook',
			parent: 'panel',
			pivot: [173, 116],
			axis: [0, 1],
			priority: 3,
			dist: polygon([[66, 132], [202, 132], [202, 194], [66, 194]]),
			keep: (p) => smoothstep((p[1] - 122) / 18),
		},
	],
	// geometric (this game's J): hook +7 -9. Anubis's swung to 18; this J's
	// bowl sits within ~6px of the slab's edge, and the edge is what folds.
	{ hook: { pos: 5.5, neg: 7 } },
	(rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 5.4 * flick(t, 340, 1.7, 2.2) - 3 * flick(t, T.land, 2.4, 4);
	},
);

// ---- 10: the 1 hops, then the 0 --------------------------------------------
// their tops sit at the edge of the panel's fade band: 3px on top of the
// panel's own lift, or the band folds (5px folded it to 44%)
const hop = (t: number, t0: number, h: number) => -h * Math.max(0, flick(t, t0, 2.2, 3.2));
export const L5 = letter(
	'L5',
	union(polygon([[54, 56], [118, 56], [118, 188], [54, 188]]), polygon([[128, 56], [206, 56], [206, 198], [128, 198]])),
	[
		{
			name: 'one',
			parent: 'panel',
			pivot: [86, 188],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[54, 56], [118, 56], [118, 188], [54, 188]]),
		},
		{
			name: 'zero',
			parent: 'panel',
			pivot: [167, 198],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[128, 56], [206, 56], [206, 198], [128, 198]]),
		},
	],
	// geometric (this game's 10): one +3 -4, zero +3 -2.5 (never turned: they hop)
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
);
