/**
 * THE TEAHOUSE BREATHES — the things in the backgrounds that hang or grow.
 *
 *   lanterns   the four celadon lanterns under the eaves sway on their cords,
 *              each at its own pace; their tassels trail a beat behind
 *   scrolls    the two hanging scroll paintings stir on their rods; their jade
 *              tassels swing
 *   plants     the bamboo on the wall stands, the plum branch in the near vase
 *              and the palm at the right edge rustle in a slow breeze
 *
 * A gust runs through the room on every win (BgProps.svelte): everything
 * swings a little harder for a couple of seconds.
 *
 * Each group is a mesh over ONE rectangle of its background, drawn exactly on
 * top of the unchanged plate by BgProps.svelte. The rectangle's border belongs
 * to `frame` and never moves, so there is no seam where the mesh meets the
 * plate; each prop hands its weight back to the frame within a few px of its
 * own outline, so the lattice and the walls round it stay straight.
 *
 * Both plates (bg_base / bg_feature) share one layout, so one set of rigs
 * serves both. Rig units are PLATE PIXELS (1920 x 1080), measured 2026-10-09.
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

export const BG_CANVAS: [number, number] = [1920, 1080];

/** what drives the props this frame */
export type BgEnv = {
	/** ms since the scene appeared (the idle sway) */
	t: number;
	/** ms since the last gust (a win), or < 0 */
	gustT: number;
};

export type BgPropSpec = MeshWinSpec & {
	/** the rectangle this mesh covers, plate px */
	rect: Rect;
	drive: (rig: Rig, env: BgEnv) => Pose;
};

const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

/** `frame` owns the rectangle's border and everything further than `reach` px
 *  from a prop. Over a busy plate (the rail behind a scroll's tassel) the
 *  reach is short, or the rail rides along with the tassel. */
const frame = (reach = 10): PartSpec => ({ name: 'frame', pivot: [0, 0], dist: () => reach });

/** a prop: its own shape, handed back to the frame near the rectangle's border */
const prop = (
	rect: Rect,
	name: string,
	pivot: Point,
	dist: (p: Point) => number,
	opts: { parent?: string; axis?: Point; keep?: (p: Point) => number; priority?: number } = {},
): PartSpec => ({
	name,
	parent: opts.parent ?? 'frame',
	pivot,
	axis: opts.axis ?? [0, 1],
	priority: opts.priority ?? 0,
	dist,
	keep: (p) => smoothstep((depthIn(rect, p) - 2) / 10) * (opts.keep ? opts.keep(p) : 1),
});

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const wave = (t: number, period: number, phase = 0) => Math.sin((2 * Math.PI * t) / period + phase);
/** the gust after a win: a kick that dies away */
const gust = (env: BgEnv, hz: number, decay: number) => (env.gustT < 0 ? 0 : flick(env.gustT, 0, hz, decay));

const spec = (
	name: string,
	rect: Rect,
	cells: [number, number],
	parts: PartSpec[],
	inked: (p: Point) => boolean,
	limits: MeshWinSpec['limits'],
	drive: (rig: Rig, env: BgEnv) => Pose,
	reach = 10,
): BgPropSpec => {
	const s: BgPropSpec = {
		symbol: name,
		key: 'gbBgBase',
		sprite: 'gbBgBase',
		mode: 'panel',
		feetY: rect[3],
		durationMs: 4000,
		landMs: 99999,
		hitMs: 99999,
		rect,
		inked,
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: cells[0], rows: cells[1] },
			soft: 3,
			parts: [frame(reach), ...parts],
		},
		limits,
		// The sway eases in over FADE_IN_MS: at t = 0 the mesh must sit exactly on
		// the plate, or it would jump into place the frame it appears.
		drive: (rig, env) => {
			const pose = drive(rig, env);
			const k = smoothstep(env.t / FADE_IN_MS);
			for (const b of pose.bones) {
				b.angle *= k;
				b.along = 1 + (b.along - 1) * k;
				b.across = 1 + (b.across - 1) * k;
				b.dx *= k;
				b.dy *= k;
			}
			return pose;
		},
		// the gate poses it through the idle sway with a gust at 0
		pose: (rig, t) => s.drive(rig, { t, gustT: t }),
	};
	return s;
};

// ---------------------------------------------------------------------------
// lanterns: a body hung from its cord, a tassel hung from the body

type Lantern = { name: string; cx: number; top: number; body: [number, number, number, number]; tassel: [number, number, number, number]; period: number; phase: number };

const lanternParts = (rect: Rect, l: Lantern): PartSpec[] => {
	const [bx0, by0, bx1, by1] = l.body;
	const [tx0, ty0, tx1, ty1] = l.tassel;
	const cord = polyline([[l.cx, l.top], [l.cx, by0 + 4]], 4);
	const body = polygon([[bx0 + 14, by0], [bx1 - 14, by0], [bx1, (by0 + by1) / 2 - 10], [bx1, (by0 + by1) / 2 + 10], [bx1 - 14, by1], [bx0 + 14, by1], [bx0, (by0 + by1) / 2 + 10], [bx0, (by0 + by1) / 2 - 10]]);
	const tassel = polygon([[l.cx - 4, by1], [l.cx + 4, by1], [tx1, ty0], [tx1, ty1], [tx0, ty1], [tx0, ty0]]);
	return [
		prop(rect, l.name, [l.cx, l.top], (p) => Math.min(body(p), cord.dist(p)), {
			// the hook it hangs from stays on the beam
			keep: (p) => smoothstep((p[1] - l.top - 6) / 14),
			priority: 1,
		}),
		prop(rect, `${l.name}Tassel`, [l.cx, by1 + 2], tassel, {
			parent: l.name,
			keep: (p) => smoothstep((p[1] - by1 - 2) / 10),
			priority: 2,
		}),
	];
};

const lanternInk = (l: Lantern) => (p: Point) =>
	(p[0] >= l.body[0] && p[0] <= l.body[2] && p[1] >= l.body[1] && p[1] <= l.body[3]) ||
	(p[0] >= l.tassel[0] && p[0] <= l.tassel[2] && p[1] >= l.tassel[1] && p[1] <= l.tassel[3]);

// ---------------------------------------------------------------------------
// the free-game plate's golden ribbons: each is tied off at one end and flutters
// along its length. They cross the lanterns' rectangles, so on that plate they
// are parts of the lantern meshes — two meshes over one patch of plate would
// each draw the other's moving part frozen.

type Ribbon = { name: string; path: Point[]; half: number; period: number; phase: number };

const ribbonParts = (rect: Rect, r: Ribbon): PartSpec[] => {
	const line = polyline(r.path, r.half);
	const len = r.path.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - r.path[i][0], q[1] - r.path[i][1]), 0);
	const [x0, y0] = r.path[0];
	const [x1, y1] = r.path[r.path.length - 1];
	return [
		prop(rect, r.name, r.path[0], line.dist, {
			axis: [x1 - x0, y1 - y0],
			// tied at its first point, free toward the last
			keep: (p) => smoothstep(line.along(p) / (len * 0.7)),
			priority: 3,
		}),
	];
};

const lanternPair = (name: string, rect: Rect, ls: [Lantern, Lantern], ribbons: Ribbon[] = []) =>
	spec(
		name,
		rect,
		[Math.round((rect[2] - rect[0]) / 4), Math.round((rect[3] - rect[1]) / 4)],
		[...ls.flatMap((l) => lanternParts(rect, l)), ...ribbons.flatMap((r) => ribbonParts(rect, r))],
		(p) => ls.some((l) => lanternInk(l)(p)) || ribbons.some((r) => polyline(r.path, r.half).dist(p) === 0),
		Object.fromEntries([
			...ls.flatMap((l) => [[l.name, { pos: 4, neg: 4 }], [`${l.name}Tassel`, { pos: 10, neg: 10 }]]),
			...ribbons.map((r) => [r.name, { pos: 4, neg: 4 }]),
		]),
		(rig, env) => {
			const pose = restPose(rig);
			for (const r of ribbons)
				bone(rig, pose, r.name).angle = RIBBON_DEG * (wave(env.t, r.period, r.phase) + 0.4 * wave(env.t, r.period * 0.43, r.phase + 1.3)) + 1.2 * RIBBON_DEG * gust(env, 0.9, 1);
			for (const l of ls) {
				const sway = SWAY_DEG * wave(env.t, l.period, l.phase) + GUST_DEG * gust(env, 0.7 + l.phase * 0.05, 0.8);
				bone(rig, pose, l.name).angle = sway;
				// the tassel trails the body, a quarter of a swing late and further
				bone(rig, pose, `${l.name}Tassel`).angle =
					-1.6 * SWAY_DEG * wave(env.t - l.period / 4, l.period, l.phase) - 1.4 * GUST_DEG * gust({ ...env, gustT: env.gustT - 180 }, 0.9, 0.9);
			}
			return pose;
		},
	);

const LANTERNS_L: [Lantern, Lantern] = [
	{ name: 'bigL', cx: 478, top: 0, body: [426, 8, 530, 120], tassel: [464, 140, 494, 224], period: 4300, phase: 0 },
	{ name: 'smallL', cx: 586, top: 44, body: [541, 95, 632, 178], tassel: [574, 182, 598, 258], period: 3500, phase: 1.3 },
];
const LANTERNS_R: [Lantern, Lantern] = [
	{ name: 'smallR', cx: 1335, top: 40, body: [1290, 96, 1381, 180], tassel: [1320, 182, 1348, 258], period: 3700, phase: 2.1 },
	{ name: 'bigR', cx: 1440, top: 0, body: [1386, 2, 1496, 114], tassel: [1430, 118, 1458, 224], period: 4500, phase: 0.6 },
];
export const BG_LANTERNS_L = lanternPair('bgLanternsL', [410, 0, 652, 272], LANTERNS_L);
export const BG_LANTERNS_R = lanternPair('bgLanternsR', [1272, 0, 1510, 272], LANTERNS_R);

// bg_feature.png's ribbons, traced 2026-10-09 (plate px), tied end first. Two
// more are left still: one runs under the big left lantern's tassel, one starts
// right below the big right one's — swinging past each other they folded.
export const BG_FEATURE_LANTERNS_L = lanternPair('bgFeatureLanternsL', [250, 0, 652, 272], LANTERNS_L, [
	{ name: 'ribbonA', path: [[420, 80], [400, 98], [370, 116], [330, 140], [290, 152]], half: 11, period: 3100, phase: 0.2 },
]);
export const BG_FEATURE_LANTERNS_R = lanternPair('bgFeatureLanternsR', [1272, 0, 1800, 336], LANTERNS_R, [
	{ name: 'ribbonC', path: [[1565, 2], [1590, 40], [1625, 95], [1665, 135], [1710, 152], [1755, 146]], half: 12, period: 3600, phase: 0.7 },
	{ name: 'ribbonD', path: [[1478, 108], [1500, 150], [1535, 185], [1580, 195], [1628, 190]], half: 11, period: 3000, phase: 2.6 },
]);

// ---------------------------------------------------------------------------
// the hanging scrolls: the painting stirs on its rod, its tassel swings

const scroll = (name: string, rect: Rect, x0: number, x1: number, tasselX: number, period: number, phase: number) => {
	const cx = (x0 + x1) / 2;
	const paper = polygon([[x0, 102], [x1, 102], [x1, 518], [x0, 518]]);
	const tassel = polygon([[tasselX - 6, 518], [tasselX + 6, 518], [tasselX + 16, 548], [tasselX + 18, 600], [tasselX - 18, 600], [tasselX - 16, 548]]);
	return spec(
		name,
		rect,
		[24, 100],
		[
			prop(rect, `${name}Paper`, [cx, 102], paper, {
				// the rod stays up; the paper comes free over its first 60px
				keep: (p) => smoothstep((p[1] - 108) / 60) * smoothstep((Math.min(p[0] - x0, x1 - p[0]) + 6) / 8),
				priority: 1,
			}),
			prop(rect, `${name}Tassel`, [tasselX, 520], tassel, {
				parent: `${name}Paper`,
				keep: (p) => smoothstep((p[1] - 522) / 10),
				priority: 2,
			}),
		],
		(p) => paper(p) === 0 || tassel(p) === 0,
		{ [`${name}Paper`]: { pos: 0.8, neg: 0.8 }, [`${name}Tassel`]: { pos: 8, neg: 8 } },
		(rig, env) => {
			const pose = restPose(rig);
			const paper = bone(rig, pose, `${name}Paper`);
			paper.angle = 0.35 * wave(env.t, period, phase) + 0.45 * gust(env, 0.6, 1);
			// a breath through the paper: it bellies out and back
			paper.across = 1 + 0.004 * wave(env.t, period * 0.7, phase + 1);
			bone(rig, pose, `${name}Tassel`).angle = -3 * wave(env.t - period / 5, period, phase) - 3.5 * gust({ ...env, gustT: env.gustT - 220 }, 0.8, 0.9);
			return pose;
		},
		4,
	);
};

export const BG_SCROLL_L = scroll('bgScrollL', [664, 92, 812, 606], 682, 790, 731, 5200, 0.4);
export const BG_SCROLL_R = scroll('bgScrollR', [1122, 92, 1270, 606], 1140, 1250, 1191, 5600, 2.2);

// ---------------------------------------------------------------------------
// the plants: foliage rustles about the pot; the tips move most

const plant = (name: string, rect: Rect, cells: [number, number], root: Point, leaves: Point[], tips: Point[], period: number, phase: number, deg: number) => {
	const crown = polygon(leaves);
	const top = polygon(tips);
	const below = (p: Point) => smoothstep((root[1] - 6 - p[1]) / 30);
	return spec(
		name,
		rect,
		cells,
		[
			prop(rect, `${name}Leaves`, root, crown, { axis: [0, -1], keep: below, priority: 1 }),
			prop(rect, `${name}Tips`, [(tips[0][0] + tips[tips.length - 1][0]) / 2, Math.max(...tips.map((q) => q[1]))], top, {
				parent: `${name}Leaves`,
				axis: [0, -1],
				keep: (p) => smoothstep(-top(p) / 20 + 1),
				priority: 2,
			}),
		],
		(p) => crown(p) === 0,
		{ [`${name}Leaves`]: { pos: deg * 2.6, neg: deg * 2.6 }, [`${name}Tips`]: { pos: deg * 3.2, neg: deg * 3.2 } },
		(rig, env) => {
			const pose = restPose(rig);
			const breeze = wave(env.t, period, phase) + 0.35 * wave(env.t, period * 0.37, phase + 2) + 1.2 * gust(env, 0.55, 0.7);
			bone(rig, pose, `${name}Leaves`).angle = deg * breeze;
			bone(rig, pose, `${name}Tips`).angle = deg * 1.2 * (wave(env.t - period / 6, period, phase) + 0.5 * wave(env.t, period * 0.29, phase + 1) + gust({ ...env, gustT: env.gustT - 160 }, 0.8, 0.9));
			return pose;
		},
	);
};

// the bamboo on the stands either side of the wall
export const BG_BAMBOO_L = plant('bgBambooL', [380, 330, 572, 516], [48, 46], [466, 506],
	[[396, 360], [470, 344], [556, 372], [560, 430], [520, 500], [420, 500], [392, 440]],
	[[400, 352], [470, 336], [552, 366], [540, 410], [410, 410]], 4100, 0.3, 0.9);
export const BG_BAMBOO_R = plant('bgBambooR', [1352, 330, 1544, 516], [48, 46], [1466, 506],
	[[1372, 372], [1452, 344], [1530, 360], [1536, 440], [1500, 500], [1400, 500], [1370, 440]],
	[[1376, 366], [1452, 336], [1526, 352], [1520, 410], [1390, 410]], 4600, 1.7, 0.9);
// the plum branch and leaves over the near vase, bottom left
export const BG_PLUM = plant('bgPlum', [0, 540, 310, 800], [62, 52], [96, 778],
	[[0, 560], [130, 560], [200, 640], [286, 700], [286, 790], [200, 790], [110, 776], [0, 776]],
	[[150, 640], [286, 690], [286, 790], [190, 790]], 5000, 0.9, 0.5);
// the palm at the right edge, over its pot
export const BG_PALM = plant('bgPalm', [1720, 620, 1920, 900], [40, 56], [1846, 864],
	[[1740, 700], [1830, 630], [1920, 630], [1920, 860], [1760, 860], [1730, 790]],
	[[1800, 636], [1920, 636], [1920, 720], [1790, 700]], 4400, 2.4, 0.6);

/** the props over each plate: the same room, plus the ribbons in the free game */
export const BG_PROPS: BgPropSpec[] = [BG_LANTERNS_L, BG_LANTERNS_R, BG_SCROLL_L, BG_SCROLL_R, BG_BAMBOO_L, BG_BAMBOO_R, BG_PLUM, BG_PALM];
export const BG_PROPS_FEATURE: BgPropSpec[] = [BG_FEATURE_LANTERNS_L, BG_FEATURE_LANTERNS_R, BG_SCROLL_L, BG_SCROLL_R, BG_BAMBOO_L, BG_BAMBOO_R, BG_PLUM, BG_PALM];

// set from the measured limits
const SWAY_DEG = 1.6;
const FADE_IN_MS = 1500;
const RIBBON_DEG = 1.4;
const GUST_DEG = 2.4;

