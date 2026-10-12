/**
 * L1-L5 — THE CARVED LETTERS, A K Q J 10.
 *
 * Ported from GoBananubis, re-traced on Go Banalchemy's porcelain tiles
 * (2026-10-04; no flash or light sweep any more). Originally: the
 * gestures are the same idea, every coordinate below is measured on this
 * game's l{n}.png, and every limit re-measured on its mesh (2026-09-25).
 *
 * Since 2026-10-04 each letter is CUT off its porcelain tile
 * (design/make_alchemy_layers.py) and leaps off it — the tile stays still.
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
	leap,
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
	type Rig,
} from './meshRig';

const T = { crouch: 100, rise: 290, fall: 620, land: 800, done: 1200 };
const LEAP = { crouch: 100, rise: 290, fall: 620, land: 800, hop2: 1010, done: 1200 };
const GRID = { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 };
const FEET = 200;

/** the beat every letter shares: the LETTER (cut off its porcelain, 2026-10-04)
 *  squats, springs off the tile, floats with a slow bob — so the hold is not a
 *  freeze — lands with a squash and a small second hop. The tile stays put. */
const letterBeat = (rig: Rig, t: number): Pose => {
	const pose = restPose(rig);
	const { rigid, air } = leap(t, LEAP, 20);
	const hover = ramp(t, LEAP.rise - 40, LEAP.rise + 60) * (1 - ramp(t, LEAP.fall - 100, LEAP.fall));
	rigid.dy -= 2.5 * hover * Math.sin((2 * Math.PI * (t - LEAP.rise)) / 460);
	pose.rigid = rigid;
	pose.air = air;
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
	feetY: FEET,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 190,
	rig: {
		grid: GRID,
		soft: 4,
		parts: [
			// the air round the letter, and the letter itself (cut off the tile)
			{ name: 'frame', pivot: [128, FEET], dist: () => 14 },
			{ name: 'panel', parent: 'frame', pivot: [128, FEET], axis: [0, -1], dist: inked },
			...parts,
		],
	},
	// the panel is only ever turned by the Q (2deg); the rest never turn it
	limits: { panel: { pos: 2.5, neg: 2.5 }, ...limits },
	pose: (rig, t) => {
		const pose = letterBeat(rig, t);
		act(rig, pose, t);
		return pose;
	},
});

// ---- A: legs splay from the apex, twice, like a jumping jack ---------------
const A_LEFT: Point[] = [[116, 72], [78, 186]];
const A_RIGHT: Point[] = [[140, 72], [178, 186]];
export const L1 = letter(
	'L1',
	union(polygon([[88, 46], [168, 46], [170, 72], [208, 176], [208, 198], [146, 198], [140, 170], [112, 170], [106, 198], [46, 198], [46, 176], [86, 72]])),
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
	union(polygon([[56, 45], [122, 45], [122, 108], [134, 45], [200, 45], [200, 72], [154, 120], [206, 174], [206, 198], [132, 198], [118, 152], [122, 198], [50, 198], [50, 174], [72, 172], [72, 70], [56, 70]])),
	[stroke('arm', [[110, 124], [170, 62]], 13, 18), stroke('leg', [[114, 130], [170, 190]], 14, 18)],
	// geometric (this game's K): arm +5.5 -5.5, leg +5.5 -5
	{ arm: { pos: 4, neg: 4 }, leg: { pos: 3, neg: 4 } },
	(rig, pose, t) => {
		// - lifts the leg's foot up and out: the kick
		bone(rig, pose, 'leg').angle = -3.8 * Math.max(0, flick(t, 360, 2, 2.4)) + 1.5 * flick(t, T.land, 3, 5);
		bone(rig, pose, 'arm').angle = 3 * flick(t, 440, 2.2, 2.8);
	},
);

// ---- Q: the tail flicks while the body rocks on its base ---------------------
const Q_TAIL = polyline([[126, 134], [156, 168], [194, 186]], 12);
export const L3 = letter(
	'L3',
	union(polygon([[74, 45], [182, 45], [182, 170], [200, 174], [200, 196], [100, 196], [74, 174]])),
	[
		{
			name: 'tail',
			parent: 'panel',
			pivot: [126, 134],
			axis: [68, 52],
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
	union(polygon([[96, 47], [196, 47], [196, 72], [178, 72], [178, 168], [162, 192], [80, 196], [58, 174], [58, 142], [94, 142], [94, 160], [144, 162], [144, 72], [96, 72]])),
	[
		{
			name: 'hook',
			parent: 'panel',
			pivot: [161, 112],
			axis: [0, 1],
			priority: 3,
			dist: polygon([[56, 132], [182, 132], [182, 198], [56, 198]]),
			keep: (p) => smoothstep((p[1] - 124) / 18),
		},
	],
	// geometric (this game's J): hook +7 -9. Anubis's swung to 18; this J's
	// bowl sits within ~6px of the slab's edge, and the edge is what folds.
	{ hook: { pos: 5.5, neg: 7 } },
	(rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 5.4 * flick(t, 340, 1.7, 2.2) - 3 * flick(t, T.land, 2.4, 4);
		// the stem leans into the swing
		bone(rig, pose, 'panel').angle = -2 * flick(t, 360, 1.7, 2.4);
	},
);

// ---- 10: the 1 hops, then the 0 --------------------------------------------
// their tops sit at the edge of the panel's fade band: 3px on top of the
// panel's own lift, or the band folds (5px folded it to 44%)
const hop = (t: number, t0: number, h: number) => -h * Math.max(0, flick(t, t0, 2.2, 3.2));
export const L5 = letter(
	'L5',
	union(polygon([[50, 47], [116, 47], [116, 197], [50, 197]]), polygon([[120, 47], [206, 47], [206, 197], [120, 197]])),
	[
		{
			name: 'one',
			parent: 'panel',
			pivot: [83, 197],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[50, 47], [116, 47], [116, 197], [50, 197]]),
		},
		{
			name: 'zero',
			parent: 'panel',
			pivot: [163, 197],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[120, 47], [206, 47], [206, 197], [120, 197]]),
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
