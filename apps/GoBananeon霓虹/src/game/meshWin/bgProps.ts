/**
 * THE THINGS THAT MOVE IN THE BACKGROUNDS (Go Bananeon's neon plates).
 *
 * Base game (the night street): the two red paper lanterns under the eave
 * swing on their hooks, out of step, and the blossom branch above them sways
 * in the breeze. Every strike of the feature trigger's chest beat (the bass
 * drop, game/caveQuake) kicks the lanterns into a real swing.
 *
 * Free game (the rooftop at sunset): the vines hanging off the pergola and the
 * big fern frond on the left sway, and the palm crown on the right tosses -
 * more on every rung of the Overdrive ladder, and every Pulse Bomb kicks them.
 *
 * Only the two SIDE STRIPS are worth animating: in landscape the reel housing
 * covers x ~56..200 of the 256-wide plate (GoBoomana's lesson: its lantern
 * sat behind the housing and was only ever seen in portrait).
 *
 * Each is a mesh over ONE small rectangle of its background (not the whole
 * 1920px plate), drawn exactly on top of the unchanged sprite by
 * BgProps.svelte. The rectangle's border belongs to `frame` and never moves, so
 * there is no seam where the mesh meets the sprite; the props hand their
 * weight back to it within a few units of the border.
 *
 * Rig units are a 256 x 144 canvas over the 1920 x 1080 plate (7.5px each).
 * Measured on Go Bananeon's bg_base.png / bg_feature.png, 2026-10-03
 * (GoBoomana's lantern, rope coil, ropes and planks were replaced).
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
/** the idle sway eases in over the first 0.8s, so a scene appears AS the plate
 *  whatever the phases (a phase-shifted sine is not at rest at 0ms) */
const easeIn = (t: number) => smoothstep(t / 800);

// ---------------------------------------------------------------------------
// base game: the two paper lanterns and the blossom branch

const BASE_RECT: Rect = [0, 0, 62, 62];
const LANTERN_A = polygon([[14, 38], [20, 38], [21, 44], [20, 51], [17.5, 53], [14, 51], [13, 44]]);
const LANTERN_B = polygon([[30, 44], [35, 44], [35.5, 50], [35, 56], [32.5, 58], [30, 56], [29.5, 50]]);
const BLOSSOM = polygon([[18, 0], [32, 0], [42, 11], [50, 21], [56, 31], [53, 40], [46, 40], [37, 34], [28, 26], [20, 18], [16, 8]]);

export const BG_BASE: BgPropSpec = {
	symbol: 'bgBase',
	key: 'gbBgBase',
	sprite: 'gbBgBase',
	mode: 'panel',
	feetY: 62,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: BASE_RECT,
	inked: (p) => LANTERN_A(p) === 0 || LANTERN_B(p) === 0 || BLOSSOM(p) === 0,
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: BASE_RECT[0], y0: BASE_RECT[1], x1: BASE_RECT[2], y1: BASE_RECT[3], cols: 62, rows: 62 },
		soft: 1.2,
		parts: [
			frame(),
			// on their hooks: the cord above each cap stays on the beam
			prop(BASE_RECT, 'lanternA', [17, 37.5], LANTERN_A, (p) => smoothstep((p[1] - 37.5) / 2.5)),
			prop(BASE_RECT, 'lanternB', [32.5, 43.5], LANTERN_B, (p) => smoothstep((p[1] - 43.5) / 2.5)),
			// the branch bends from where it leaves the trunk, its tips most
			prop(BASE_RECT, 'blossom', [16, 6], BLOSSOM, (p) => smoothstep((p[0] - 18) / 10)),
		],
	},
	// geometric (bg:base --limits, 2026-10-03): lanternA +-13, lanternB +15 -14.5, blossom +5 -4
	limits: { lanternA: { pos: 12, neg: 12 }, lanternB: { pos: 12, neg: 12 }, blossom: { pos: 4, neg: 3.5 } },
	drive: (rig, env) => {
		const pose = restPose(rig);
		const kick = quakeKick(env.quakeT, 0.9, 0.9);
		const e = easeIn(env.t);
		bone(rig, pose, 'lanternA').angle = 3.5 * e * wave(env.t, 3300) + LANTERN_KICK * kick;
		bone(rig, pose, 'lanternB').angle =
			5 * e * wave(env.t + 900, 2900) - 1.15 * LANTERN_KICK * quakeKick(env.quakeT, 1.1, 1.1);
		// the breeze: a slow sway with a quicker flutter on top
		bone(rig, pose, 'blossom').angle = e * (1.5 * wave(env.t, 4200) + 0.45 * wave(env.t, 1300)) + 0.7 * kick;
		return pose;
	},
	pose: (rig, t) => BG_BASE.drive(rig, { t, level: 1, quakeT: t, blastT: -1 }),
};

// ---------------------------------------------------------------------------
// free game: the vines and the fern frond on the left, the palm on the right

const FEATURE_RECT: Rect = [0, 0, 60, 64];
const VINE_A = polyline([[21, 6], [19, 14], [17, 22], [16, 33]], 3);
const VINE_B = polyline([[36, 4], [38, 10], [38, 15]], 2.5);
const FROND = polygon([[12, 50], [22, 48], [34, 51], [30, 55], [18, 58], [10, 58]]);

/** more sway on every rung of the Overdrive ladder */
const ladderAmp = (level: number) => 1 + 0.35 * (Math.max(1, level) - 1);
const bombKick = (blastT: number, hz: number, decay: number) => (blastT >= 0 ? flick(blastT, 0, hz, decay) : 0);

export const BG_FEATURE: BgPropSpec = {
	symbol: 'bgFeature',
	key: 'gbBgFeature',
	sprite: 'gbBgFeature',
	mode: 'panel',
	feetY: 64,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: FEATURE_RECT,
	inked: (p) => VINE_A.dist(p) === 0 || VINE_B.dist(p) === 0 || FROND(p) === 0,
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: FEATURE_RECT[0], y0: FEATURE_RECT[1], x1: FEATURE_RECT[2], y1: FEATURE_RECT[3], cols: 60, rows: 64 },
		soft: 1.2,
		parts: [
			frame(),
			prop(FEATURE_RECT, 'vineA', [21, 6], VINE_A.dist, (p) => smoothstep((p[1] - 6) / 5)),
			prop(FEATURE_RECT, 'vineB', [36, 4], VINE_B.dist, (p) => smoothstep((p[1] - 4) / 4)),
			// the frond springs from the planter at its left end
			prop(FEATURE_RECT, 'frond', [10, 56], FROND, (p) => smoothstep((p[0] - 10) / 6)),
		],
	},
	// geometric (bg:feature --limits, 2026-10-03): vineA +23.5 -26, vineB +29 -19.5, frond +21 -16.5
	limits: { vineA: { pos: 8, neg: 8 }, vineB: { pos: 10, neg: 10 }, frond: { pos: 8, neg: 8 } },
	drive: (rig, env) => {
		const pose = restPose(rig);
		const amp = ladderAmp(env.level);
		const kick = bombKick(env.blastT, 1.1, 1.3);
		const e = easeIn(env.t);
		bone(rig, pose, 'vineA').angle = 2.2 * e * amp * wave(env.t, 2700) + VINE_KICK * kick;
		bone(rig, pose, 'vineB').angle = 2.6 * e * amp * wave(env.t + 600, 2300) - VINE_KICK * 0.8 * kick;
		bone(rig, pose, 'frond').angle = e * (1.6 * amp * wave(env.t, 3600) + 0.4 * wave(env.t, 1100)) + 2 * kick;
		return pose;
	},
	pose: (rig, t) => BG_FEATURE.drive(rig, { t, level: 5, quakeT: -1, blastT: t }),
};

const FEATURE_R_RECT: Rect = [218, 16, 256, 70];
// the palm's crown, fronds fanning out from about (246, 42)
// stops short of the plate's right edge, which is pinned: the fronds there stay
const PALM = polygon([[228, 37], [238, 31], [246, 30], [248, 40], [248, 58], [244, 60], [236, 56], [229, 49]]);

export const BG_FEATURE_R: BgPropSpec = {
	symbol: 'bgFeatureR',
	key: 'gbBgFeature',
	sprite: 'gbBgFeature',
	mode: 'panel',
	feetY: 70,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: FEATURE_R_RECT,
	inked: (p) => PALM(p) === 0,
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: FEATURE_R_RECT[0], y0: FEATURE_R_RECT[1], x1: FEATURE_R_RECT[2], y1: FEATURE_R_RECT[3], cols: 38, rows: 54 },
		soft: 1.2,
		parts: [
			frame(),
			// the crown rocks about the top of its (unseen) trunk
			prop(FEATURE_R_RECT, 'palm', [247, 60], PALM),
		],
	},
	// geometric (check_mesh_wins.mjs bg:featureR --limits, 2026-10-03): palm +39 -51
	limits: { palm: { pos: 8, neg: 8 } },
	drive: (rig, env) => {
		const pose = restPose(rig);
		const amp = ladderAmp(env.level);
		bone(rig, pose, 'palm').angle =
			easeIn(env.t) * (1.5 * amp * wave(env.t + 400, 3900) + 0.4 * wave(env.t, 1500)) - 2 * bombKick(env.blastT, 0.9, 1.2);
		return pose;
	},
	pose: (rig, t) => BG_FEATURE_R.drive(rig, { t, level: 5, quakeT: -1, blastT: t }),
};

// set from the measured limits
const LANTERN_KICK = 5;
const VINE_KICK = 3.5;
