/**
 * L1-L5 — THE LETTER TILES, A K Q J 10.
 *
 * Each letter is recessed into a pale stone tile bolted down at its four
 * corners. They were PANEL meshes — the whole stone face inside the bolts was
 * the mesh — so on a win the stone, cracks and all, moved with the letter and
 * the TILE read as wobbling. Asked for 2026-10-03: "必須是圖案本身動起來而不是
 * 整個板子動". So the letter is CUT off its tile (design/cut_letters.py): the
 * letter is the mesh (CUT mode), and the tile — left with the socket the letter
 * was carved into — is drawn under it as a still plate (spec.plate). When a
 * letter lifts, its empty slot shows beneath it; at rest the two make the tile.
 *
 * Low pays win on most spins, so they get a lighter, shorter beat than the high
 * pays — a small float off the tile, which suits a zero-g game — and each letter
 * one gesture of its own, taken from its shape: the A's legs splay like a
 * jumping jack, the K kicks, the Q flicks its tail, the J's hook swings, the 1
 * and the 0 hop in turn. The same acting as GoBananubis' carved letters,
 * re-traced onto these tiles (their letters are larger: 44..211 against 50..200).
 */
import {
	bump,
	flick,
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

// where the letters stand: their feet are at ~211 of the 256 canvas
const FEET_Y = 212;
// Short enough to finish inside WinWays' first pass (950ms), so a letter is
// not still acting under the scrim when the next symbol's pass begins.
const T = { crouch: 90, rise: 260, fall: 640, land: 760, done: 900 };
const GRID = { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 };

/** the beat every letter shares: squat, float up out of its slot, hang, settle.
 *  The whole letter moves as one (the rigid move, so a bigger win's lift and
 *  swell apply — meshRig.WIN_LEVELS); its limbs act on top of it. */
const letterBeat = (rig: Rig, t: number): Pose => {
	const pose = restPose(rig);
	const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
	// while it floats it bobs, so the hold is not a freeze
	const hover = ramp(t, 230, 330) * (1 - ramp(t, 560, 650));
	pose.rigid = {
		sx: track(t, [[0, 1], [T.crouch, 1.05, 'out'], [180, 0.965, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 1.04, 'out'], [T.done, 1, 'out']]),
		sy: track(t, [[0, 1], [T.crouch, 0.92, 'out'], [180, 1.05, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.94, 'out'], [T.done, 1, 'out']]),
		rot: 0,
		pop: 1 + 0.02 * air,
		dx: 0,
		dy: -8 * air - 3 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 420),
	};
	pose.air = Math.max(0, Math.min(1, air));
	pose.flash = 0.3 * track(t, [[T.crouch, 0], [170, 1, 'out'], [480, 0, 'in']]);
	pose.sheen = t >= 280 && t <= 700 ? (t - 280) / 420 : -1;
	// the tiles touch their neighbours: the knock stays small or it slides under them
	pose.plateHit = 1 + 0.025 * bump(t, T.crouch, 320) + 0.015 * bump(t, T.land, T.land + 110);
	return pose;
};

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a limb of a letter: a stroke hanging from a joint, blending in over `rampPx` */
const stroke = (name: string, path: Point[], half: number, rampPx = 16): PartSpec => {
	const line = polyline(path, half);
	const [px, py] = path[0];
	const [tx, ty] = path[path.length - 1];
	return {
		name,
		parent: 'body',
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
	// the letter cut off its tile, acting over the tile it came from
	sprite: `gb${symbol}Letter`,
	art: `${symbol.toLowerCase()}_letter.png`,
	plate: `gb${symbol}Plate`,
	mode: 'cut',
	dust: true,
	feetY: FEET_Y,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 170,
	// a letter landing is a carved piece settling back into its slot: a short
	// squash, not a body landing on its feet
	landDepth: 0.07,
	landSpread: 0.05,
	landRebound: 0.03,
	rig: {
		grid: GRID,
		soft: 4,
		parts: [
			// the whole letter: the air round it reads as far, so it does not drag
			// the letter's edges
			{ name: 'body', pivot: [128, FEET_Y], dist: (p) => Math.min(14, inked(p)) },
			...parts,
		],
	},
	limits: { body: { pos: 2.5, neg: 2.5 }, ...limits },
	pose: (rig, t) => {
		const pose = letterBeat(rig, t);
		act(rig, pose, t);
		return pose;
	},
});

// ---- A: legs splay from the apex, twice, like a jumping jack ---------------
export const L1 = letter(
	'L1',
	polygon([[104, 44], [150, 44], [214, 211], [168, 211], [160, 172], [96, 172], [86, 211], [42, 211]]),
	[stroke('leg_l', [[122, 64], [62, 206]], 14, 24), stroke('leg_r', [[132, 64], [192, 206]], 14, 24)],
	{ leg_l: { pos: 3, neg: 2 }, leg_r: { pos: 2, neg: 3 } },
	(rig, pose, t) => {
		const air = Math.min(1, pose.air);
		const splay = 1.1 * air + 1.7 * Math.max(0, flick(t, 330, 2.6, 2.8)) + 1.2 * Math.max(0, flick(t, 540, 2.6, 3.2));
		bone(rig, pose, 'leg_l').angle = splay;
		bone(rig, pose, 'leg_r').angle = -splay;
	},
);

// ---- K: the leg kicks out, the arm waves after it ----------------------------
export const L2 = letter(
	'L2',
	polygon([[60, 44], [99, 44], [99, 108], [160, 44], [204, 44], [146, 108], [210, 210], [166, 210], [122, 140], [99, 164], [99, 210], [60, 210]]),
	[stroke('arm', [[104, 124], [188, 50]], 14, 18), stroke('leg', [[110, 130], [192, 204]], 15, 18)],
	{ arm: { pos: 4, neg: 4 }, leg: { pos: 3, neg: 5 } },
	(rig, pose, t) => {
		// - lifts the leg's foot up and out: the kick
		bone(rig, pose, 'leg').angle = -4.5 * Math.max(0, flick(t, 300, 2.2, 2.6)) + 1.4 * flick(t, T.land, 3, 5);
		bone(rig, pose, 'arm').angle = 2.8 * flick(t, 370, 2.4, 3);
	},
);

// ---- Q: the tail flicks while the body rocks on its base ---------------------
const Q_TAIL = polyline([[128, 150], [168, 180], [206, 202]], 13);
// The Q reaches within 22px of the tile's top edge, so the default landing
// squash (10% of its height) stretched the strip of stone above it to 176%
// (check_mesh_wins landing rule). It lands shallower.
export const L3: MeshWinSpec = {
	...letter(
		'L3',
		polygon([[50, 34], [198, 34], [198, 176], [214, 196], [198, 212], [170, 204], [50, 204]]),
		[
			{
				name: 'tail',
				parent: 'body',
				pivot: [128, 150],
				axis: [78, 52],
				priority: 3,
				dist: Q_TAIL.dist,
				keep: (p) => smoothstep((Q_TAIL.along(p) - 4) / 18),
			},
		],
		{ tail: { pos: 6, neg: 6 } },
		(rig, pose, t) => {
			bone(rig, pose, 'tail').angle = 6 * flick(t, 300, 2.8, 2.8) - 2.5 * flick(t, T.land, 3, 5);
			bone(rig, pose, 'body').angle = 1.8 * Math.sin((2 * Math.PI * (t - T.rise)) / 460) * ramp(t, 220, 320) * (1 - ramp(t, 560, 700));
		},
	),
};

// ---- J: the hook swings like a pendulum from the stem ------------------------
export const L4 = letter(
	'L4',
	polygon([[112, 44], [197, 44], [197, 176], [170, 211], [100, 211], [64, 188], [64, 142], [108, 142], [108, 170], [150, 172], [156, 70], [112, 70]]),
	[
		{
			name: 'hook',
			parent: 'body',
			pivot: [176, 112],
			axis: [0, 1],
			priority: 3,
			dist: polygon([[60, 136], [202, 136], [202, 216], [60, 216]]),
			keep: (p) => smoothstep((p[1] - 120) / 18),
		},
	],
	{ hook: { pos: 8, neg: 8 } },
	(rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 7 * flick(t, 290, 1.9, 2.4) - 2.5 * flick(t, T.land, 2.6, 4);
	},
);

// ---- 10: the 1 hops, then the 0 --------------------------------------------
const hop = (t: number, t0: number, h: number) => -h * Math.max(0, flick(t, t0, 2.4, 3.4));
export const L5 = letter(
	'L5',
	union(polygon([[44, 44], [118, 44], [118, 210], [44, 210]]), polygon([[120, 44], [210, 44], [210, 212], [120, 212]])),
	[
		{
			name: 'one',
			parent: 'body',
			pivot: [80, 208],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[44, 44], [116, 44], [116, 208], [48, 208]]),
		},
		{
			name: 'zero',
			parent: 'body',
			pivot: [164, 210],
			axis: [0, -1],
			priority: 3,
			dist: polygon([[122, 44], [210, 44], [210, 210], [122, 210]]),
		},
	],
	{ one: { pos: 0.5, neg: 0.5 }, zero: { pos: 0.5, neg: 0.5 } },
	(rig, pose, t) => {
		const one = bone(rig, pose, 'one');
		one.dy = hop(t, 280, 3);
		one.along = 1 + 0.045 * Math.max(0, flick(t, 280, 2.4, 3.4));
		const zero = bone(rig, pose, 'zero');
		zero.dy = hop(t, 400, 3);
		zero.along = 1 + 0.045 * Math.max(0, flick(t, 400, 2.4, 3.4)) - 0.035 * bump(t, T.land, T.land + 120);
		zero.across = 1 + 0.035 * bump(t, T.land, T.land + 120);
	},
);
