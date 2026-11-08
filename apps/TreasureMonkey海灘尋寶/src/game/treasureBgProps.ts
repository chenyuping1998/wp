/** The beach in the wind — the background model from Putt Monkey / Saucer
 * Monkey (2026-11-01, user: 背景動態要加強, 參考高爾夫飛碟).
 *
 * Everything that moves in a breeze answers to ONE wind (`windAt`): a faint
 * ambient stir, and every GUST_EVERY ms a gust that crosses the beach left to
 * right — the left palm leans first, the umbrella on the far right last. A win
 * sends an extra gust. One wind, not a dozen unrelated sines, is what reads as
 * weather rather than a screen full of wobble (motion-restraint: act, then
 * settle).
 *
 * Each prop is a mesh over one rectangle of bg_base.jpg; its border stays on
 * the plate, so at rest it IS the plate. A vertex's share of the motion falls
 * off from the moving mass, away from its root or crown, and round `avoid`
 * boxes (rocks, the lighthouse, the lifeguard chair) that must not bend.
 *
 * Coordinates are bg_base.jpg px (1920 x 1080), y down.
 */
import { buildRig, restPose, smoothstep, type Point, type Rect, type Rig, type Pose } from './bgMeshRig.ts';
export const BG_CANVAS: [number, number] = [1920, 1080];
export type BgEnv = { t: number; gustT: number };
export type BgPropSpec = { name: string; rect: Rect; rig: Rig; drive: (rig: Rig, env: BgEnv) => Pose };

export const GUST_EVERY = 5200;
const GUST_FIRST = 500;
const GUST_LEN = 2600;
/** ms for a gust to cross the plate's width */
const GUST_CROSS = 1100;

/** 0..1 gust envelope at plate x: rises, holds a beat, lets go */
const gustAt = (t: number, x: number) => {
	const local = t - GUST_FIRST - (x / BG_CANVAS[0]) * GUST_CROSS;
	if (local < 0) return 0;
	const tau = local % GUST_EVERY;
	if (tau > GUST_LEN) return 0;
	const u = tau / GUST_LEN;
	// quick lean in, slower release: the release is what reads as weight
	return u < 0.3 ? smoothstep(u / 0.3) : 1 - smoothstep((u - 0.3) / 0.7);
};

/** the wind at plate x: ambient stir + gust (+ a win's gust), -1..~1.6 */
export const windAt = (env: BgEnv, x: number, period: number, phase: number) => {
	const w1 = (env.t * Math.PI * 2) / period + phase;
	const ambient = 0.75 * Math.sin(w1) + 0.25 * Math.sin(w1 * 0.43 + phase * 2.1);
	const gust = gustAt(env.t, x);
	// it buffets while it blows — slowly: a fast flutter reads as jitter
	const buffet = gust * 0.12 * Math.sin(env.t / 420 + phase * 3);
	const delay = (x / BG_CANVAS[0]) * GUST_CROSS * 0.5;
	const winT = env.gustT < 0 ? -1 : env.gustT - delay;
	const win = winT < 0 ? 0 : Math.sin(winT / 170) * Math.exp(-winT / 900);
	return 0.6 * ambient + gust + buffet + 0.3 * win;
};

type Sway = {
	name: string;
	rect: Rect;
	/** where the prop grows or hangs from: what it rotates about */
	pivot: Point;
	/** the moving mass */
	at: Point;
	radius: Point;
	/** degrees at full gust */
	amp: number;
	/** ambient stir period, ms */
	period: number;
	phase: number;
	/** px of vertical bob per degree of lean (a canopy lifts as it tips) */
	lift?: number;
	/** px carried downwind at full gust (a cloud), plus its own slow float */
	drift?: number;
	float?: number;
	/** boxes inside the rect that must NOT move */
	avoid?: Rect[];
};

const APRON = 48;
// the clouds' own float: one swing per 12s
const FLOAT_PERIOD = 12000;
const boxDist = (p: Point, r: Rect) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[1], 0, p[1] - r[3]));

const sway = (s: Sway): BgPropSpec => {
	const { rect } = s;
	const n = (p: Point) => Math.hypot((p[0] - s.at[0]) / s.radius[0], (p[1] - s.at[1]) / s.radius[1]);
	const rigid = !!s.drift;
	// how far the mass reaches from its pivot: leaves near the root or crown
	// barely move, the tips carry the lean (plants grow up, fronds hang down)
	const reach = Math.max(1, Math.hypot(s.at[0] - s.pivot[0], s.at[1] - s.pivot[1]) + Math.max(...s.radius));
	const share = (p: Point) => {
		const r = n(p);
		const body = rigid ? 1 - smoothstep((r - 0.35) / 0.9) : 1 - smoothstep((r - 0.5) / 0.9);
		const out = rigid ? 1 : Math.pow(Math.min(1, Math.hypot(p[0] - s.pivot[0], p[1] - s.pivot[1]) / reach), 1.3);
		const near = Math.min(Infinity, ...(s.avoid ?? []).map((a) => boxDist(p, a)));
		const clear = s.avoid?.length ? smoothstep(near / APRON) : 1;
		const edge = smoothstep((Math.min(p[0] - rect[0], rect[2] - p[0], p[1] - rect[1], rect[3] - p[1]) - 5) / 40);
		return body * out * clear * edge;
	};
	const rig = buildRig({
		canvas: BG_CANVAS,
		grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 28, rows: 20 },
		soft: 5,
		parts: [
			{ name: 'frame', pivot: [0, 0], dist: () => 1000 },
			{ name: 'prop', parent: 'frame', pivot: s.pivot, dist: () => 0, keep: share },
		],
	});
	const drive = (r: Rig, env: BgEnv) => {
		const pose = restPose(r),
			b = pose.bones[r.bones.findIndex((x) => x.name === 'prop')];
		const fade = smoothstep(env.t / 1500);
		const w = windAt(env, s.pivot[0], s.period, s.phase) * fade;
		b.angle = w * s.amp;
		b.dy = -Math.abs(w) * s.amp * (s.lift ?? 0);
		if (s.drift) b.dx = s.drift * w + (s.float ?? 0) * fade * Math.sin((env.t * Math.PI * 2) / FLOAT_PERIOD + s.phase);
		return pose;
	};
	return { name: s.name, rect, rig, drive };
};

// keep clear of: the lifeguard chair
const CHAIR: Rect = [1755, 235, 1905, 455];

export const BEACH_PROPS: BgPropSpec[] = [
	// palms: the crowns hang from the top corners and swing from the trunk top
	sway({ name: 'palmTL', rect: [0, 0, 280, 200], pivot: [22, 18], at: [125, 70], radius: [125, 75], amp: 3.2, period: 5600, phase: 0.0, avoid: [[0, 60, 28, 200]] }),
	sway({ name: 'palmL', rect: [0, 165, 95, 320], pivot: [22, 218], at: [38, 245], radius: [48, 60], amp: 8, period: 4900, phase: 1.3 }),
	sway({ name: 'palmTR', rect: [1590, 0, 1920, 175], pivot: [1905, 15], at: [1760, 70], radius: [165, 85], amp: 4.4, period: 5300, phase: 2.1, avoid: [[1755, 118, 1920, 175]] }),
	// the umbrella's canopy tips on its pole and lifts a touch as it does
	sway({ name: 'umbrella', rect: [1745, 105, 1920, 232], pivot: [1866, 200], at: [1850, 165], radius: [92, 45], amp: 3.4, period: 4500, phase: 2.6, lift: 0.45, avoid: [CHAIR] }),
	// beach plants toss from the root; rocks stay put
	sway({ name: 'bushL', rect: [0, 345, 215, 505], pivot: [70, 500], at: [80, 420], radius: [95, 70], amp: 4, period: 4200, phase: 1.1, avoid: [[0, 445, 95, 545], [138, 468, 212, 515]] }),
	sway({ name: 'bushL2', rect: [0, 555, 140, 705], pivot: [30, 705], at: [62, 620], radius: [72, 62], amp: 3.8, period: 3900, phase: 0.5 }),
	sway({ name: 'tuftL', rect: [130, 668, 290, 782], pivot: [205, 778], at: [210, 715], radius: [72, 48], amp: 5, period: 3600, phase: 2.9, avoid: [[80, 680, 168, 735]] }),
	sway({ name: 'bushL3', rect: [0, 735, 165, 892], pivot: [25, 890], at: [75, 810], radius: [82, 62], amp: 3.8, period: 4400, phase: 1.8 }),
	sway({ name: 'tuftBL', rect: [190, 945, 372, 1080], pivot: [272, 1078], at: [272, 1010], radius: [82, 58], amp: 4.4, period: 3700, phase: 0.2, avoid: [[140, 985, 248, 1080]] }),
	sway({ name: 'bushR', rect: [1800, 688, 1920, 800], pivot: [1885, 795], at: [1880, 735], radius: [62, 48], amp: 5, period: 4100, phase: 1.4 }),
	sway({ name: 'bushR2', rect: [1680, 790, 1920, 1000], pivot: [1860, 1000], at: [1825, 870], radius: [118, 72], amp: 2.9, period: 4600, phase: 2.3, avoid: [[1735, 925, 1920, 1080]] }),
	sway({ name: 'tuftStar', rect: [1468, 948, 1592, 1062], pivot: [1530, 1058], at: [1532, 998], radius: [56, 46], amp: 5, period: 3500, phase: 0.8, avoid: [[1562, 972, 1680, 1080]] }),
	// The clouds are not meshes any more: they drift as a cut layer
	// (treasureClouds.ts, design/build_bg_clouds.py). A mesh here would paint
	// the plate's sky over them.
];
