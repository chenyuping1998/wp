/**
 * L1-L5 — THE ROYALS, A K Q J 10, typeset on their coloured tea labels.
 *
 * The label stays still; the LETTER leaps off it (the same idea as the
 * paintings leaping off their cards). Low pays win on most spins, so they get
 * a shorter, lighter beat — a small hop, a slow bob while they hang, a squash
 * and a second hop — and each letter one gesture taken from its shape: the
 * A's legs splay like a jumping jack, the K kicks, the Q flicks its short tail,
 * the J rocks as one ink stroke, and the 1 and the 0 hop in turn.
 *
 * The letter texture is made at runtime from the very Text the label shows
 * (SymbolMeshWin.svelte), so the swap cannot jump. design/make_jade_mesh_layers.py
 * bakes the same glyphs to jadeMesh/l*_subject.png for the gate only.
 *
 * Coordinates are the 256 canvas over the 140px label (measured on Cinzel 400,
 * 2026-10-09; Diner Monkey switched to Bangers and re-fitted only the Q tail, the
 * other parts still pass the gate's ownership check):
 * A apex (128,80), feet (96,160) (162,160); K stem x 104..120, arms from
 * (120,121) to (160,84) and (164,160); Q ring (128,122) r40, tail (132,162) ->
 * (200,188) -> (230,172); J stem x 124..136, hook (132,160) -> (114,184);
 * 1 x 90..110, 0 (144,122) 22x34.
 */
import {
	blob,
	bump,
	flick,
	leap,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';

const LEAP = { crouch: 100, rise: 290, fall: 620, land: 800, hop2: 1010, done: 1200 };
const GRID = { x0: 40, y0: 40, x1: 248, y1: 216, cols: 52, rows: 44 };
const FEET = 162;

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a limb of a letter: a stroke hanging from a joint, blending in over `rampPx` */
const stroke = (name: string, path: Point[], half: number, rampPx = 16): PartSpec => {
	const line = polyline(path, half);
	const [px, py] = path[0];
	const [tx, ty] = path[path.length - 1];
	return {
		name,
		parent: 'glyph',
		pivot: path[0],
		axis: [tx - px, ty - py],
		priority: 3,
		dist: line.dist,
		keep: (p) => smoothstep((line.along(p) - 4) / rampPx),
	};
};

const letter = (
	symbol: string,
	shape: (p: Point) => number,
	parts: PartSpec[],
	limits: MeshWinSpec['limits'],
	act: (rig: Rig, pose: Pose, t: number) => void,
): MeshWinSpec => ({
	symbol,
	key: `gb${symbol}`,
	art: `jadeMesh/${symbol.toLowerCase()}_subject.png`,
	feetY: FEET,
	durationMs: LEAP.done,
	landMs: LEAP.land,
	hitMs: LEAP.rise,
	rig: {
		grid: GRID,
		soft: 3,
		parts: [
			{ name: 'root', pivot: [128, FEET], dist: () => 12 },
			{ name: 'glyph', parent: 'root', pivot: [128, FEET], axis: [0, -1], priority: 1, dist: shape },
			...parts,
		],
	},
	limits: { glyph: { pos: 0, neg: 0 }, ...limits },
	pose: (rig, t) => {
		const pose = restPose(rig);
		const { rigid, air } = leap(t, LEAP, 22);
		// a slow bob while it hangs, so the hold is not a freeze
		const hover = ramp(t, LEAP.rise - 40, LEAP.rise + 60) * (1 - ramp(t, LEAP.fall - 100, LEAP.fall));
		rigid.dy -= 2.5 * hover * Math.sin((2 * Math.PI * (t - LEAP.rise)) / 460);
		pose.rigid = rigid;
		pose.air = air;
		// the letter itself squashes into its own landings
		const glyph = bone(rig, pose, 'glyph');
		const squash = bump(t, LEAP.land - 40, LEAP.land + 160) + 0.5 * bump(t, LEAP.hop2 - 30, LEAP.hop2 + 120) - 0.6 * bump(t, LEAP.crouch, LEAP.rise);
		glyph.along = 1 - 0.07 * squash;
		glyph.across = 1 + 0.06 * squash;
		act(rig, pose, t);
		return pose;
	},
});

const live = (t: number) => ramp(t, LEAP.crouch, LEAP.rise) * (1 - ramp(t, LEAP.land + 100, LEAP.done - 200));

export const L1 = letter(
	'L1',
	polygon([[120, 78], [136, 78], [170, 160], [148, 164], [108, 164], [86, 160]]),
	[stroke('legL', [[118, 112], [96, 160]], 7), stroke('legR', [[138, 112], [162, 160]], 8)],
	{ legL: { pos: 9, neg: 9 }, legR: { pos: 9, neg: 9 } },
	(rig, pose, t) => {
		// a jumping jack: legs out at the top, together on the landing
		const jack = Math.sin((2 * Math.PI * (t - LEAP.rise)) / 300) * live(t) + 0.6 * flick(t, LEAP.land, 3, 5);
		bone(rig, pose, 'legL').angle = LEG_DEG * jack;
		bone(rig, pose, 'legR').angle = -LEG_DEG * jack;
	},
);

export const L2 = letter(
	'L2',
	polygon([[98, 80], [124, 80], [124, 120], [160, 82], [170, 84], [130, 122], [168, 162], [98, 162]]),
	[stroke('kick', [[122, 124], [164, 160]], 8, 14), stroke('arm', [[122, 118], [160, 84]], 6, 14)],
	{ kick: { pos: 10, neg: 10 }, arm: { pos: 8, neg: 8 } },
	(rig, pose, t) => {
		// the K kicks out at the top and waves on the way down
		bone(rig, pose, 'kick').angle = -KICK_DEG * (bump(t, LEAP.rise - 60, LEAP.rise + 260) + 0.5 * flick(t, LEAP.land, 3, 5));
		bone(rig, pose, 'arm').angle = ARM_DEG * Math.sin((2 * Math.PI * (t - LEAP.rise)) / 360) * live(t);
	},
);

export const L3 = letter(
	'L3',
	(p) => Math.min(blob([128, 122], 44, 44, 2)(p), polyline([[146, 150], [158, 158], [150, 171]], 7).dist(p)),
	// Bangers' Q: a short wedge tail at the ring's lower right, not Cinzel's long sweep
	[stroke('tail', [[144, 148], [158, 157], [150, 172]], 10, 8)],
	{ tail: { pos: 9, neg: 9 } },
	(rig, pose, t) => {
		// the long tail flicks like a cat's
		bone(rig, pose, 'tail').angle = TAIL_DEG * (Math.sin((2 * Math.PI * (t - LEAP.crouch)) / 380) * live(t) + flick(t, LEAP.land, 2.6, 4));
	},
);

export const L4 = letter(
	'L4',
	polygon([[116, 80], [146, 80], [138, 160], [128, 182], [112, 188], [110, 178], [124, 160], [124, 82]]),
	[],
	{},
	(_rig, pose, t) => {
		// Bangers' J has one continuous curved stroke. Move the whole glyph
		// gently; bending a separately weighted hook shears its ink at the join.
		pose.rigid.rot += 2.5 * flick(t, LEAP.crouch, 2, 2.2);
	},
);

export const L5 = letter(
	'L5',
	(p) => Math.min(polygon([[88, 88], [112, 86], [112, 158], [88, 158]])(p), blob([144, 122], 24, 36, 2)(p)),
	[
		{ name: 'one', parent: 'glyph', pivot: [100, 158], axis: [0, -1], priority: 3, dist: polygon([[88, 86], [112, 86], [112, 158], [88, 158]]), keep: (p) => smoothstep((124 - p[0]) / 10) },
		{ name: 'zero', parent: 'glyph', pivot: [144, 158], axis: [0, -1], priority: 3, dist: blob([144, 122], 24, 36, 2), keep: (p) => smoothstep((p[0] - 112) / 10) },
	],
	{ one: { pos: 6, neg: 6 }, zero: { pos: 6, neg: 6 } },
	(rig, pose, t) => {
		// the 1 and the 0 hop in turn
		const one = bone(rig, pose, 'one');
		const zero = bone(rig, pose, 'zero');
		one.dy = -HOP_PX * bump(t, LEAP.rise - 40, LEAP.rise + 180);
		zero.dy = -HOP_PX * bump(t, LEAP.rise + 140, LEAP.rise + 360);
		one.angle = -3 * flick(t, LEAP.land, 3, 5);
		zero.angle = 3 * flick(t, LEAP.land + 40, 3, 5);
	},
);

// set from the measured limits
const LEG_DEG = 6;
const KICK_DEG = 8;
const ARM_DEG = 5;
const TAIL_DEG = 5.5;
const HOP_PX = 5;
