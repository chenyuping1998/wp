/**
 * THE THINGS THAT HANG IN THE BACKGROUNDS.
 *
 * Base game: the lantern on the timber sways on its hook, and the coiled rope
 * on its nail below it. The cave quake on a feature trigger (game/caveQuake)
 * kicks the lantern into a real swing on each chest-beat strike.
 *
 * Free game: the ropes and the broken plank hanging from the shattered roof
 * sway, more on every rung of the blast ladder, and every detonation kicks
 * them — the mine coming apart overhead, the same idea as MineAir's debris.
 *
 * Each is a mesh over ONE small rectangle of its background (not the whole
 * 1920px plate), drawn exactly on top of the unchanged sprite by
 * BgProps.svelte. The rectangle's border belongs to `frame` and never moves, so
 * there is no seam where the mesh meets the sprite; the props hand their
 * weight back to it within a few units of the border.
 *
 * Rig units are a 256 x 144 canvas over the 1920 x 1080 plate (7.5px each).
 * Coordinates measured on bg_base.png / bg_feature.png, 2026-09-25.
 */
import {
	flick,
	polygon,
	polyline,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

// The quake's strikes, COPIED from game/caveQuake.svelte.ts (which mirrors
// Mascot.svelte and design/generate_monkey_spine.mjs). Not imported: these
// modules must load under bare node for design/check_mesh_wins.mjs, and that
// file is a .svelte.ts with runes in it. Change all of them together.
const QUAKE_BEATS = 6;
const strikeAt = (i: number) => 480 + i * 300;

export const BG_CANVAS: [number, number] = [256, 144];

/** what drives the props this frame */
export type BgEnv = {
	/** ms since the scene appeared (the idle sway) */
	t: number;
	/** blast ladder rung, 1..5 */
	level: number;
	/** ms since the cave quake started, or < 0 */
	quakeT: number;
	/** ms since the last detonation, or < 0 */
	blastT: number;
};

export type BgPropSpec = MeshWinSpec & {
	/** the rectangle this mesh covers, rig units */
	rect: Rect;
	drive: (rig: Rig, env: BgEnv) => Pose;
};

const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

/** `frame` owns the rectangle's border and everything not near a prop */
const frame = (): PartSpec => ({ name: 'frame', pivot: [0, 0], dist: () => 5 });

/** a prop hanging from `pivot`: its own shape, handed back to the frame near
 *  the rectangle's border so the border never moves */
const prop = (rect: Rect, name: string, pivot: Point, dist: (p: Point) => number, keepExtra?: (p: Point) => number): PartSpec => ({
	name,
	parent: 'frame',
	pivot,
	axis: [0, 1],
	dist,
	keep: (p) => smoothstep((depthIn(rect, p) - 1) / 4) * (keepExtra ? keepExtra(p) : 1),
});

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a kick that swings and dies away, from each strike of the quake */
const quakeKick = (quakeT: number, hz: number, decay: number) => {
	if (quakeT < 0) return 0;
	let v = 0;
	for (let i = 0; i < QUAKE_BEATS; i++) v += flick(quakeT, strikeAt(i), hz, decay) * (0.5 + 0.1 * i);
	return v;
};

const wave = (t: number, period: number) => Math.sin((2 * Math.PI * t) / period);

// ---------------------------------------------------------------------------
// base game: the lantern and the coiled rope

const BASE_RECT: Rect = [62, 0, 100, 100];
const LANTERN = polygon([[75, 11], [85, 11], [89, 20], [89, 48], [72, 48], [72, 20]]);
const COIL = polygon([[79, 57], [89, 57], [90, 96], [79, 96]]);

export const BG_BASE: BgPropSpec = {
	symbol: 'bgBase',
	key: 'gbBgBase',
	sprite: 'gbBgBase',
	mode: 'panel',
	feetY: 100,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: BASE_RECT,
	inked: (p) => LANTERN(p) === 0 || COIL(p) === 0,
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: BASE_RECT[0], y0: BASE_RECT[1], x1: BASE_RECT[2], y1: BASE_RECT[3], cols: 38, rows: 100 },
		soft: 1.2,
		parts: [
			frame(),
			// on its hook: the hook itself (above y 12) stays on the beam
			prop(BASE_RECT, 'lantern', [80, 11], LANTERN, (p) => smoothstep((p[1] - 11) / 4)),
			prop(BASE_RECT, 'coil', [84, 58], COIL, (p) => smoothstep((p[1] - 57) / 5)),
		],
	},
	// geometric (check_mesh_wins.mjs bg:base --limits, 2026-09-25):
	//   lantern +12 -13.5   coil +9.5 -12
	limits: { lantern: { pos: 9, neg: 9 }, coil: { pos: 7, neg: 7 } },
	drive: (rig, env) => {
		const pose = restPose(rig);
		bone(rig, pose, 'lantern').angle = 2.5 * wave(env.t, 3300) + LANTERN_KICK * quakeKick(env.quakeT, 0.9, 0.9);
		bone(rig, pose, 'coil').angle = 1.6 * wave(env.t, 4100) + 0.6 * LANTERN_KICK * quakeKick(env.quakeT, 1.2, 1.4);
		return pose;
	},
	pose: (rig, t) => BG_BASE.drive(rig, { t, level: 1, quakeT: t, blastT: -1 }),
};

// ---------------------------------------------------------------------------
// free game: the ropes and the planks hanging from the broken roof

const FEATURE_RECT: Rect = [66, 0, 190, 60];
const ROPE_L = polyline([[80, 14], [80, 51]], 1.8);
const ROPE_R = polyline([[174, 0], [174, 48]], 1.8);
const PLANK = polygon([[136, 0], [147, 0], [148, 22], [140, 25], [135, 14]]);
const PLANK_R = polygon([[151, 22], [175, 5], [182, 11], [160, 31]]);

export const BG_FEATURE: BgPropSpec = {
	symbol: 'bgFeature',
	key: 'gbBgFeature',
	sprite: 'gbBgFeature',
	mode: 'panel',
	feetY: 60,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: FEATURE_RECT,
	// the wedged plank too: the rope passes behind it, and it must not smear
	inked: (p) => ROPE_L.dist(p) === 0 || ROPE_R.dist(p) === 0 || PLANK(p) === 0 || PLANK_R(p) === 0,
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: FEATURE_RECT[0], y0: FEATURE_RECT[1], x1: FEATURE_RECT[2], y1: FEATURE_RECT[3], cols: 83, rows: 40 },
		soft: 1.2,
		parts: [
			frame(),
			prop(FEATURE_RECT, 'rope_l', [80, 14], ROPE_L.dist, (p) => smoothstep((p[1] - 14) / 6)),
			// This rope passes behind the diagonal plank at (171,21), and two
			// props that touch tear when they move apart: swung from the top it
			// sheared there at 3.5 degrees. So it hangs from where it drapes
			// over the plank, and the length above stays put.
			prop(FEATURE_RECT, 'rope_r', [174, 30], ROPE_R.dist, (p) => smoothstep((p[1] - 30) / 6)),
			prop(FEATURE_RECT, 'plank', [141, 0], PLANK),
			// The diagonal plank (PLANK_R) is wedged in the rock and stays put: a
			// creak within its measured limit (+6 -5) moved it about one unit,
			// which the gate rightly called invisible, and a wedged plank should
			// not swing. The right rope hangs below it instead.
		],
	},
	// geometric (check_mesh_wins.mjs bg:feature --limits, 2026-09-25):
	//   rope_l +50 -27   plank +13.5 -13   plank_r +6 -5
	//   rope_r +48.5 -37.5, measured again after it was re-hung below the plank
	limits: {
		rope_l: { pos: 12, neg: 12 },
		rope_r: { pos: 12, neg: 12 },
		plank: { pos: 9, neg: 9 },
	},
	drive: (rig, env) => {
		const pose = restPose(rig);
		// more sway on every rung: the roof is getting worse
		const amp = 1.6 + 0.75 * (Math.max(1, env.level) - 1);
		const kick = env.blastT >= 0 ? flick(env.blastT, 0, 1.1, 1.3) : 0;
		bone(rig, pose, 'rope_l').angle = amp * wave(env.t, 2600) + ROPE_KICK * kick;
		bone(rig, pose, 'rope_r').angle = amp * wave(env.t, 3100) - ROPE_KICK * 0.8 * kick;
		bone(rig, pose, 'plank').angle = 0.8 * amp * wave(env.t, 3700) + 0.8 * ROPE_KICK * kick;
		return pose;
	},
	pose: (rig, t) => BG_FEATURE.drive(rig, { t, level: 5, quakeT: -1, blastT: t }),
};

// set from the measured limits
const LANTERN_KICK = 3.5;
const ROPE_KICK = 4;
