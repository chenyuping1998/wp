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

// ---------------------------------------------------------------------------
// hold and spin (the vault): the coins on the shelves
//
// The vault is all chrome coin stacks on brass shelves — nothing in it hangs
// or sways, so nothing idles but a faint settle. What moves it is the GAME:
// every new coin that sticks on the board (stickyPrizesNew, fed in as
// blastT by BgProps.svelte) jolts the shelves, the coins leaning on them hop
// and rock back and the stack on the right bounces on its base.
//
// Only what stands clear of the plate's edges: the stacks running off the
// left and right of the plate would be pinned by the rectangle's border along
// their cut edge and shear, so they stay painted.
//
// Measured on bg_holdandspin.png (1920 x 1080), 2026-10-04.

const HS_L_RECT: Rect = [5, 3, 33, 108];
// leaning coins, top to bottom: each rests on the shelf at its lower right
const COIN_U = polygon([[19, 13], [22, 10.5], [26, 11], [28, 14], [27.5, 19], [25, 22], [21.5, 22], [19, 19]]);
const COIN_M = polygon([[16, 40], [19, 38.5], [23, 40], [26.5, 44], [27.5, 48], [26, 51], [22.5, 51], [18.5, 48], [16, 44]]);
const COIN_B = polygon([[10.5, 82], [13, 80], [17, 80.5], [22, 84], [26.5, 89], [28, 94], [27, 98.5], [23, 99.5], [18, 97], [13, 92], [10.5, 87]]);

const HS_R_RECT: Rect = [219, 3, 254, 56];
const COIN_R1 = polygon([[223.5, 19], [226, 15], [230, 14], [232.5, 16], [232, 21], [229, 24.5], [225.5, 25.5], [223.5, 23.5]]);
const COIN_R2 = polygon([[233.5, 14], [236.5, 10], [240, 8], [243.5, 8.5], [244, 12], [242, 16], [238, 19], [235, 19.5], [233.5, 17]]);
// the stepped stacks on the middle shelf
const STACK_R = polygon([[224, 43.5], [230.5, 43.5], [230.5, 38], [239.5, 38], [239.5, 32], [248.5, 31.5], [248.5, 47.5], [224, 51.5]]);

/** a coin's jolt: it hops off the shelf, comes down and rocks to a stop */
const jolt = (blastT: number, delay: number) => {
	if (blastT < 0) return { hop: 0, rock: 0 };
	const t = blastT - delay;
	return { hop: bump01(t, 0, 200), rock: flick(blastT, delay + 170, 3.2, 3.4) };
};
/** 0 -> 1 -> 0 over [a, b], a half sine */
const bump01 = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));

const HOP = 1.8;
const ROCK = 3;

/** a leaning coin's idle: a faint settle, out of step with its neighbours */
const coinIdle = (t: number, period: number) => 0.35 * easeIn(t) * wave(t, period);

const coin = (rect: Rect, name: string, foot: Point, shape: (p: Point) => number): PartSpec => ({
	...prop(rect, name, foot, shape),
	axis: [0, -1],
});

export const BG_HS_L: BgPropSpec = {
	symbol: 'bgHsL',
	key: 'gbBgHoldAndSpin',
	sprite: 'gbBgHoldAndSpin',
	mode: 'panel',
	feetY: 108,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: HS_L_RECT,
	inked: (p) => COIN_U(p) === 0 || COIN_M(p) === 0 || COIN_B(p) === 0,
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: HS_L_RECT[0], y0: HS_L_RECT[1], x1: HS_L_RECT[2], y1: HS_L_RECT[3], cols: 56, rows: 210 },
		soft: 2.5,
		parts: [
			frame(),
			coin(HS_L_RECT, 'coinU', [25, 22], COIN_U),
			coin(HS_L_RECT, 'coinM', [24, 51], COIN_M),
			coin(HS_L_RECT, 'coinB', [24, 99], COIN_B),
		],
	},
	limits: { coinU: { pos: 6, neg: 6 }, coinM: { pos: 6, neg: 6 }, coinB: { pos: 6, neg: 6 } },
	drive: (rig, env) => {
		const pose = restPose(rig);
		// the jolt reaches each shelf a beat apart, top down
		([['coinU', 0, 3100], ['coinM', 50, 3700], ['coinB', 100, 4300]] as const).forEach(([name, delay, period], i) => {
			const j = jolt(env.blastT, delay);
			const b = bone(rig, pose, name);
			b.dy = -HOP * j.hop;
			b.angle = coinIdle(env.t, period) + ROCK * (1 - 0.25 * i) * j.rock;
		});
		return pose;
	},
	pose: (rig, t) => BG_HS_L.drive(rig, { t, level: 1, quakeT: -1, blastT: t }),
};

export const BG_HS_R: BgPropSpec = {
	symbol: 'bgHsR',
	key: 'gbBgHoldAndSpin',
	sprite: 'gbBgHoldAndSpin',
	mode: 'panel',
	feetY: 56,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: HS_R_RECT,
	inked: (p) => COIN_R1(p) === 0 || COIN_R2(p) === 0 || STACK_R(p) === 0,
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: HS_R_RECT[0], y0: HS_R_RECT[1], x1: HS_R_RECT[2], y1: HS_R_RECT[3], cols: 70, rows: 106 },
		soft: 2.5,
		parts: [
			frame(),
			coin(HS_R_RECT, 'coinR1', [226, 25], COIN_R1),
			coin(HS_R_RECT, 'coinR2', [236, 19.2], COIN_R2),
			coin(HS_R_RECT, 'stackR', [236, 50], STACK_R),
		],
	},
	limits: { coinR1: { pos: 6, neg: 6 }, coinR2: { pos: 6, neg: 6 }, stackR: { pos: 1, neg: 1 } },
	drive: (rig, env) => {
		const pose = restPose(rig);
		for (const [name, delay, period, sign] of [['coinR1', 30, 3400, 1], ['coinR2', 0, 2900, -1]] as const) {
			const j = jolt(env.blastT, delay);
			const b = bone(rig, pose, name);
			b.dy = -HOP * j.hop;
			b.angle = coinIdle(env.t, period) + sign * ROCK * j.rock;
		}
		// the stack is heavy: a short hop and a squash on its base as it lands
		const j = jolt(env.blastT, 80);
		const s = bone(rig, pose, 'stackR');
		s.dy = -HOP * j.hop;
		s.along = 1 - 0.035 * (env.blastT < 0 ? 0 : flick(env.blastT, 280, 4, 5));
		return pose;
	},
	pose: (rig, t) => BG_HS_R.drive(rig, { t, level: 1, quakeT: -1, blastT: t }),
};

// The shelf over the vault's arch, across the TOP of the plate: the one part
// of this scene a PORTRAIT screen shows (it keeps only the middle third of
// the plate, so the side strips above are cropped away). The same jolt, run
// left to right along the shelf as a wave. The tall stack at the right end
// and the two tall ones that come within 4 units of the plate's top edge stay
// painted: the edge is pinned, and a hop folded their tops against it.
const HS_TOP_RECT: Rect = [78, 0, 182, 21];
const TOP_PROPS: [string, (p: Point) => number, Point][] = [
	['coinT', polygon([[83.5, 10], [85, 8], [88, 7.5], [91.5, 8], [93, 10], [92.5, 12.5], [90, 14], [86, 14], [84, 12.5]]), [88, 14]],
	['stackT2', polygon([[104, 8.5], [109.5, 8.5], [110, 16], [104, 16]]), [107, 16]],
	['stackT3', polygon([[110.5, 12], [120, 12], [123, 14.5], [122, 16.5], [110.5, 16.5]]), [115, 16.5]],
	['stackT4', polygon([[134, 10], [143, 10], [143, 16.5], [134, 16.5]]), [138, 16.5]],
	['stackT5', polygon([[143.5, 11], [151.5, 11], [151.5, 16], [143.5, 16]]), [147, 16]],
	['stackT7', polygon([[162.5, 8], [170, 8], [170, 14.5], [162.5, 14.5]]), [166, 14.5]],
];

export const BG_HS_TOP: BgPropSpec = {
	symbol: 'bgHsTop',
	key: 'gbBgHoldAndSpin',
	sprite: 'gbBgHoldAndSpin',
	mode: 'panel',
	feetY: 21,
	durationMs: 2600,
	landMs: 99999,
	hitMs: 99999,
	rect: HS_TOP_RECT,
	inked: (p) => TOP_PROPS.some(([, shape]) => shape(p) === 0),
	rig: {
		canvas: BG_CANVAS,
		grid: { x0: HS_TOP_RECT[0], y0: HS_TOP_RECT[1], x1: HS_TOP_RECT[2], y1: HS_TOP_RECT[3], cols: 208, rows: 42 },
		soft: 2.5,
		parts: [frame(), ...TOP_PROPS.map(([name, shape, foot]) => coin(HS_TOP_RECT, name, foot, shape))],
	},
	limits: Object.fromEntries(TOP_PROPS.map(([name]) => [name, { pos: 4, neg: 4 }])),
	drive: (rig, env) => {
		const pose = restPose(rig);
		TOP_PROPS.forEach(([name, , foot], i) => {
			// the wave crosses the shelf in ~250ms
			const j = jolt(env.blastT, ((foot[0] - 80) / 90) * 250);
			const b = bone(rig, pose, name);
			b.dy = -HOP * j.hop;
			// the coin rocks; the stacks only settle, squashing on their base
			if (name === 'coinT') b.angle = coinIdle(env.t, 3300) + ROCK * j.rock;
			else b.along = 1 - 0.035 * (env.blastT < 0 ? 0 : flick(env.blastT, ((foot[0] - 80) / 90) * 250 + 200, 4, 5)) * (i % 2 ? 1 : 0.8);
		});
		return pose;
	},
	pose: (rig, t) => BG_HS_TOP.drive(rig, { t, level: 1, quakeT: -1, blastT: t }),
};
