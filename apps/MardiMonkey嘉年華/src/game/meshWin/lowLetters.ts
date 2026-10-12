/**
 * L1-L5 — THE ROYALS, A K Q J 10, typeset on their coloured tea labels.
 *
 * The label stays still; the LETTER leaps off it (the same idea as the
 * paintings leaping off their cards). Low pays win on most spins, so they get
 * a shorter, lighter beat — a small hop, a slow bob while they hang, a squash
 * and a second hop — and each letter one gesture taken from its shape: the
 * A's legs splay like a jumping jack, the K kicks, the Q flicks its long tail,
 * the J's hook swings, the 1 and the 0 hop in turn.
 *
 * The letter texture is made at runtime from the very Text the label shows
 * (SymbolMeshWin.svelte), so the swap cannot jump. design/make_jade_mesh_layers.py
 * bakes the same glyphs to jadeMesh/l*_subject.png for the gate only.
 *
 * Coordinates are the 256 canvas over the 140px label, measured on Fascinate 400
 * (2026-10-10, from the baked jadeMesh/l*_subject.png):
 * A ink (91..165, 88..173): apex (127,90), a thin left side and a heavy right one, foot
 * 92..162; K stem x 96..136, a short arm up to (162,90) and a thin upright leg x 148..160;
 * Q ring (130,130) 40x42, small tail at the lower right (152,148) -> (167,177); J stem
 * x 112..156, a small hook at (96..112, 158..172); the 10 is small-cap height: 1 x 76..116,
 * 0 (150,138) 24x26.
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
	polygon([[120, 86], [134, 86], [166, 172], [90, 172]]),
	[stroke('legL', [[116, 128], [100, 168]], 8), stroke('legR', [[138, 128], [156, 168]], 13)],
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
	polygon([[94, 88], [138, 88], [138, 104], [154, 86], [168, 86], [160, 104], [146, 112], [162, 114], [162, 172], [94, 172]]),
	// Fascinate's K: the lower stroke stands upright beside the stem instead of kicking out
	[stroke('kick', [[140, 112], [154, 122], [154, 168]], 7, 14), stroke('arm', [[128, 112], [146, 100], [164, 88]], 9, 6)],
	{ kick: { pos: 10, neg: 10 }, arm: { pos: 8, neg: 8 } },
	(rig, pose, t) => {
		// the K kicks out at the top and waves on the way down
		bone(rig, pose, 'kick').angle = -KICK_DEG * (bump(t, LEAP.rise - 60, LEAP.rise + 260) + 0.5 * flick(t, LEAP.land, 3, 5));
		bone(rig, pose, 'arm').angle = ARM_DEG * Math.sin((2 * Math.PI * (t - LEAP.rise)) / 360) * live(t);
	},
);

export const L3 = letter(
	'L3',
	(p) => Math.min(blob([130, 130], 42, 44, 2)(p), polyline([[152, 148], [160, 164], [167, 177]], 7).dist(p)),
	// Fascinate's Q: a small tail tucked under the ring's lower right
	[stroke('tail', [[152, 148], [160, 164], [167, 177]], 9, 4)],
	{ tail: { pos: 9, neg: 9 } },
	(rig, pose, t) => {
		// the tail flicks like a cat's
		bone(rig, pose, 'tail').angle = TAIL_DEG * (Math.sin((2 * Math.PI * (t - LEAP.crouch)) / 380) * live(t) + flick(t, LEAP.land, 2.6, 4));
	},
);

export const L4 = letter(
	'L4',
	// Fascinate's J: a tall slab stem with a small hook ticking out at the foot
	polygon([[110, 86], [158, 86], [158, 156], [150, 170], [128, 177], [106, 174], [94, 166], [94, 156], [110, 156]]),
	[stroke('hook', [[140, 160], [118, 172], [96, 162]], 10, 4)],
	{ hook: { pos: 12, neg: 12 } },
	(rig, pose, t) => {
		// the hook swings like a pendulum
		bone(rig, pose, 'hook').angle = HOOK_DEG * (flick(t, LEAP.crouch, 2, 2.2) + 0.6 * flick(t, LEAP.land, 2.6, 4));
	},
);

export const L5 = letter(
	'L5',
	(p) => Math.min(polygon([[74, 114], [118, 114], [118, 164], [86, 164], [86, 126], [74, 126]])(p), blob([150, 139], 26, 28, 2)(p)),
	[
		{ name: 'one', parent: 'glyph', pivot: [100, 164], axis: [0, -1], priority: 3, dist: polygon([[74, 114], [118, 114], [118, 164], [86, 164], [86, 126], [74, 126]]), keep: (p) => smoothstep((126 - p[0]) / 8) },
		{ name: 'zero', parent: 'glyph', pivot: [150, 166], axis: [0, -1], priority: 3, dist: blob([150, 139], 26, 28, 2), keep: (p) => smoothstep((p[0] - 118) / 8) },
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
const HOOK_DEG = 9;
const HOP_PX = 5;
