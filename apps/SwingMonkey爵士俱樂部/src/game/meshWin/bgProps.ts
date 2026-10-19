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
// Mostly still (user, 2026-10-16: constant wobble reads as generated motion).
// One swing, eased in and out, then a hold of two periods; each thing on its
// own timetable through its phase, so the room never sways in unison.
// The first swing, as the scene appears, is everyone's (settling in); after
// that each takes its turn.
const wave = (t: number, period: number, phase = 0) => {
	const first = t < period ? 1 : t < 1.5 * period ? Math.cos((Math.PI * (t - period)) / period) ** 2 : 0;
	const cycle = period * 3;
	const u = ((((t - period + phase * period * 0.47) % cycle) + cycle) % cycle) / period;
	const later = u < 1 ? Math.sin(Math.PI * u) ** 2 * smoothstep((t - period) / period) : 0;
	return Math.sin((2 * Math.PI * t) / period + phase) * (first + later);
};
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

const lanternPair = (name: string, rect: Rect, ls: [Lantern, Lantern]) =>
	spec(
		name,
		rect,
		[60, 68],
		ls.flatMap((l) => lanternParts(rect, l)),
		(p) => ls.some((l) => lanternInk(l)(p)),
		Object.fromEntries(ls.flatMap((l) => [[l.name, { pos: 4, neg: 4 }], [`${l.name}Tassel`, { pos: 10, neg: 10 }]])),
		(rig, env) => {
			const pose = restPose(rig);
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

export const BG_LANTERNS_L = lanternPair('bgLanternsL', [410, 0, 652, 272], [
	{ name: 'bigL', cx: 478, top: 0, body: [426, 8, 530, 120], tassel: [464, 140, 494, 224], period: 4300, phase: 0 },
	{ name: 'smallL', cx: 586, top: 44, body: [541, 95, 632, 178], tassel: [574, 182, 598, 258], period: 3500, phase: 1.3 },
]);
export const BG_LANTERNS_R = lanternPair('bgLanternsR', [1272, 0, 1510, 272], [
	{ name: 'smallR', cx: 1335, top: 40, body: [1290, 96, 1381, 180], tassel: [1320, 182, 1348, 258], period: 3700, phase: 2.1 },
	{ name: 'bigR', cx: 1440, top: 0, body: [1386, 2, 1496, 114], tassel: [1430, 118, 1458, 224], period: 4500, phase: 0.6 },
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

/** every background prop, drawn over both plates */
// The lantern/scroll/bamboo coordinates above belong to the older teahouse plate.
// On this plate they cut across the drum kit and stage curtains, so keep them idle.

// ---------------------------------------------------------------------------
// THIS GAME'S OWN PROPS (2026-10-10), measured on its plates (both share one
// layout). The teahouse rigs above are kept only as the helpers' history.

const oct = (x0: number, y0: number, x1: number, y1: number): Point[] => {
	const cx = (x1 - x0) * 0.22, cy = (y1 - y0) * 0.22;
	return [[x0 + cx, y0], [x1 - cx, y0], [x1, y0 + cy], [x1, y1 - cy], [x1 - cx, y1], [x0 + cx, y1], [x0, y1 - cy], [x0, y0 + cy]];
};
const cellsOf = (r: Rect): [number, number] => [Math.max(8, Math.round((r[2] - r[0]) / 5)), Math.max(8, Math.round((r[3] - r[1]) / 5))];

/** a thing that hangs from `pivot` (hang), stands on it (stand) or turns about it (spin) */
const sway = (name: string, rect: Rect, pivot: Point, shape: Point[], kind: 'hang' | 'stand' | 'spin', period: number, phase: number, deg: number) => {
	const body = polygon(shape);
	const keep =
		kind === 'hang' ? (p: Point) => smoothstep((p[1] - pivot[1] - 4) / 24) :
		kind === 'stand' ? (p: Point) => smoothstep((pivot[1] - 6 - p[1]) / 30) :
		() => 1;
	return spec(
		name,
		rect,
		cellsOf(rect),
		[prop(rect, name, pivot, body, { axis: kind === 'hang' ? [0, 1] : [0, -1], keep, priority: 1 })],
		(p) => body(p) === 0,
		{ [name]: { pos: deg * 2.6, neg: deg * 2.6 } },
		(rig, env) => {
			const pose = restPose(rig);
			bone(rig, pose, name).angle = deg * (wave(env.t, period, phase) + 0.3 * wave(env.t, period * 0.37, phase + 2) + 1.2 * gust(env, 0.6, 0.8));
			return pose;
		},
	);
};

/** a drape or valance pinned at both ends: its middle breathes up and down */
const drape = (name: string, rect: Rect, shape: Point[], period: number, phase: number, amp: number) => {
	const body = polygon(shape);
	return spec(
		name,
		rect,
		cellsOf(rect),
		[prop(rect, name, [(rect[0] + rect[2]) / 2, rect[1]], body, {
			keep: (p) => smoothstep((Math.min(p[0] - rect[0], rect[2] - p[0]) - 10) / 70) * smoothstep((p[1] - rect[1] - 4) / 30),
			priority: 1,
		})],
		(p) => body(p) === 0,
		{ [name]: { pos: 0.5, neg: 0.5 } },
		(rig, env) => {
			const pose = restPose(rig);
			const b = bone(rig, pose, name);
			b.dy = amp * (wave(env.t, period, phase) + 1.2 * gust(env, 0.6, 0.9));
			b.across = 1 + 0.003 * wave(env.t, period * 0.6, phase + 1);
			return pose;
		},
	);
};

/** the club: the curtain's tassel, the cymbal, the palm and the valances */
const BG_TASSEL = sway('tassel', [1100, 338, 1216, 572], [1158, 342], oct(1116, 356, 1200, 553), 'hang', 4100, 0.4, 2);
const BG_CYMBAL = sway('cymbal', [222, 398, 426, 482], [323, 442], oct(234, 412, 412, 470), 'spin', 2600, 1.1, 1.6);
const BG_CLUB_PALM = sway('clubPalm', [1745, 228, 1920, 558], [1850, 545], oct(1763, 244, 1920, 544), 'stand', 4700, 2.3, 0.7);
const BG_VALANCEL = drape('valanceL', [195, 0, 482, 116], oct(206, 0, 469, 103), 5200, 0.8, 2.6);
const BG_VALANCEC = drape('valanceC', [810, 0, 1142, 126], oct(825, 0, 1125, 113), 5600, 2.4, 2.6);
export const BG_PROPS: BgPropSpec[] = [BG_TASSEL, BG_CYMBAL, BG_CLUB_PALM, BG_VALANCEL, BG_VALANCEC];

// set from the measured limits
const SWAY_DEG = 1.6;
const FADE_IN_MS = 1500;
const GUST_DEG = 2.4;

