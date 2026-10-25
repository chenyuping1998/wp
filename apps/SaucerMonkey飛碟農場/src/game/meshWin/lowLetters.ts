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
 * Coordinates are the 256 canvas over the 140px label, measured on Bowlby One 400
 * (2026-10-10, from the baked jadeMesh/l*_subject.png):
 * A ink (78..179, 79..170): flat top 108..148, legs at the foot 80..116 and 140..176;
 * K stem x 88..124, arms from (124,116) to (172,82) and (124,124) to (174,164); Q ring
 * (128,122) r44, short tail at the lower right (148,140) -> (177,166); J stem x 128..164, hook
 * (88..120, 136..166) curling left from the stem's foot; 1 x 68..112 with its flag on the
 * left, 0 (166,126) 34x38.
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
		// 6, down from 22 (2026-10-17): the letters now sit smaller inside the
		// TV screen (constants.ts LOW_LETTER_SCALE) and must not hit its bezel at
		// the top of the hop
		const { rigid, air } = leap(t, LEAP, 6);
		// a slow bob while it hangs, so the hold is not a freeze
		const hover = ramp(t, LEAP.rise - 40, LEAP.rise + 60) * (1 - ramp(t, LEAP.fall - 100, LEAP.fall));
		rigid.dy -= 2 * hover * Math.sin((2 * Math.PI * (t - LEAP.rise)) / 460);
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
	polygon([[106, 78], [150, 78], [180, 168], [78, 168]]),
	[stroke('legL', [[110, 124], [96, 162]], 16), stroke('legR', [[146, 124], [160, 162]], 16)],
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
	polygon([[86, 78], [182, 78], [154, 120], [182, 168], [140, 168], [126, 144], [126, 168], [86, 168]]),
	[stroke('kick', [[128, 128], [168, 162]], 14, 14), stroke('arm', [[128, 114], [168, 84]], 12, 14)],
	{ kick: { pos: 10, neg: 10 }, arm: { pos: 8, neg: 8 } },
	(rig, pose, t) => {
		// the K kicks out at the top and waves on the way down
		bone(rig, pose, 'kick').angle = -KICK_DEG * (bump(t, LEAP.rise - 60, LEAP.rise + 260) + 0.5 * flick(t, LEAP.land, 3, 5));
		bone(rig, pose, 'arm').angle = ARM_DEG * Math.sin((2 * Math.PI * (t - LEAP.rise)) / 360) * live(t);
	},
);

export const L3 = letter(
	'L3',
	(p) => Math.min(blob([128, 124], 48, 48, 2)(p), polyline([[148, 140], [164, 152], [177, 166]], 10).dist(p)),
	// Bowlby One's Q: a short heavy wedge low on the right of the ring
	[stroke('tail', [[148, 140], [164, 152], [177, 166]], 11, 8)],
	{ tail: { pos: 9, neg: 9 } },
	(rig, pose, t) => {
		// the tail flicks like a cat's
		bone(rig, pose, 'tail').angle = TAIL_DEG * (Math.sin((2 * Math.PI * (t - LEAP.crouch)) / 380) * live(t) + flick(t, LEAP.land, 2.6, 4));
	},
);

export const L4 = letter(
	'L4',
	// Bowlby One's J: a straight slab stem with a heavy hook curling out to the left
	polygon([[126, 78], [166, 78], [166, 150], [156, 162], [140, 169], [106, 169], [92, 162], [85, 150], [85, 134], [122, 134], [122, 144], [126, 144]]),
	[stroke('hook', [[140, 152], [114, 160], [98, 142]], 13, 10)],
	{ hook: { pos: 12, neg: 12 } },
	(rig, pose, t) => {
		// the hook swings like a pendulum
		bone(rig, pose, 'hook').angle = HOOK_DEG * (flick(t, LEAP.crouch, 2, 2.2) + 0.6 * flick(t, LEAP.land, 2.6, 4));
	},
);

export const L5 = letter(
	'L5',
	(p) => Math.min(polygon([[64, 98], [90, 86], [114, 86], [114, 160], [82, 160], [82, 124], [64, 124]])(p), blob([166, 126], 35, 40, 2)(p)),
	[
		{ name: 'one', parent: 'glyph', pivot: [98, 160], axis: [0, -1], priority: 3, dist: polygon([[64, 98], [90, 86], [114, 86], [114, 160], [82, 160], [82, 124], [64, 124]]), keep: (p) => smoothstep((126 - p[0]) / 10) },
		{ name: 'zero', parent: 'glyph', pivot: [166, 160], axis: [0, -1], priority: 3, dist: blob([166, 126], 35, 40, 2), keep: (p) => smoothstep((p[0] - 120) / 10) },
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
