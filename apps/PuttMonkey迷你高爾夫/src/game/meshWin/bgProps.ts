/** Registered background meshes: borders stay on the plate; theme props move inside them.
 *
 * Stake review 2026-10-24: "the background is too static". Everything that
 * would move in a breeze now does, and it all answers to ONE wind
 * (`windAt`): a faint ambient stir, and every GUST_EVERY ms a gust that
 * crosses the course left to right — the left palm leans first, the flag on
 * the far right last. A win sends an extra gust (BgProps' gustT). One wind,
 * not a dozen unrelated sines, is what keeps it reading as weather rather than
 * as a screen full of wobble (motion-restraint rule: act, then settle).
 *
 * The windmill's sails and the sun's rays are NOT here: they turn whole, as
 * cut sprites (BgMotion.svelte, design/build_bg_motion.py).
 */
import { blob, restPose, smoothstep, type MeshWinSpec, type Point, type Rect, type Rig, type Pose } from './meshRig';
export const BG_CANVAS: [number, number] = [1920, 1080];
export type BgEnv = { t: number; gustT: number };
export type BgPropSpec = MeshWinSpec & { rect: Rect; drive: (rig: Rig, env: BgEnv) => Pose };

// 2026-10-25 (user: 背景動態要顯眼且流暢): a gust every 5.2s, not 9 — between
// gusts the ambient sway alone has to read, and it now carries 60% of a gust
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
	// two slow sines at unrelated periods: a sway that never quite repeats
	// and never stops
	const w1 = (env.t * Math.PI * 2) / period + phase;
	const ambient = 0.75 * Math.sin(w1) + 0.25 * Math.sin(w1 * 0.43 + phase * 2.1);
	const gust = gustAt(env.t, x);
	// it buffets while it blows — slowly: a 150ms flutter read as a jitter
	const buffet = gust * 0.12 * Math.sin(env.t / 420 + phase * 3);
	const delay = (x / BG_CANVAS[0]) * GUST_CROSS * 0.5;
	const winT = env.gustT < 0 ? -1 : env.gustT - delay;
	const win = winT < 0 ? 0 : Math.sin(winT / 170) * Math.exp(-winT / 900);
	return 0.6 * ambient + gust + buffet + 0.3 * win;
};

type Sway = {
	name: string;
	plate: string;
	rect: Rect;
	/** where the prop hangs/grows from: what it rotates about */
	pivot: Point;
	/** the moving part's extent */
	at: Point;
	radius: Point;
	/** degrees at full gust */
	amp: number;
	/** ambient stir period, ms */
	period: number;
	phase: number;
	/** px of vertical bob per degree of lean (canopies lift as they tip) */
	lift?: number;
	/** across-axis flutter at full gust (a flag's cloth) */
	flutter?: number;
	/** px carried downwind at full gust (a cloud) */
	drift?: number;
	/** rectangles inside the field that must NOT move — stonework, a crater
	 *  under a static glow. Bending them is what reads as a torn picture. */
	avoid?: Rect[];
};

const sway = (s: Sway): BgPropSpec => {
	const plant = blob(s.at, ...s.radius);
	// an avoided box pushes the prop away over a 48px apron round it, so the
	// stone stays put and the plant's pull fades out before it (a hard edge
	// squeezed the triangles on the boundary to 43%)
	const boxDist = (p: Point, r: Rect) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[1], 0, p[1] - r[3]));
	const APRON = 48;
	const field = (p: Point) => {
		const near = Math.min(Infinity, ...(s.avoid ?? []).map((r) => boxDist(p, r)));
		return plant(p) + Math.max(0, APRON - near) * 1.6;
	};
	const { rect } = s;
	const drive = (rig: Rig, env: BgEnv) => {
		const pose = restPose(rig),
			b = pose.bones[rig.bones.findIndex((x) => x.name === 'prop')];
		const fade = smoothstep(env.t / 1500);
		const w = windAt(env, s.pivot[0], s.period, s.phase) * fade;
		b.angle = w * s.amp;
		b.dy = -Math.abs(w) * s.amp * (s.lift ?? 0);
		// a cloud drifts with the wind both ways, so it never parks
		if (s.drift) b.dx = s.drift * w;
		if (s.flutter) b.across = 1 + s.flutter * Math.max(0, w) * Math.sin(env.t / 95 + s.phase);
		return pose;
	};
	return {
		symbol: s.name,
		key: s.plate,
		sprite: s.plate,
		mode: 'panel',
		rect,
		feetY: rect[3],
		durationMs: 6000,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => field(p) < 3,
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 28, rows: 20 },
			soft: 5,
			parts: [
				{ name: 'frame', pivot: [0, 0], dist: () => 14 },
				{
					name: 'prop',
					parent: 'frame',
					pivot: s.pivot,
					dist: field,
					priority: 2,
					keep: (p) =>
						smoothstep((Math.min(p[0] - rect[0], rect[2] - p[0], p[1] - rect[1], rect[3] - p[1]) - 5) / 30),
				},
			],
		},
		// a full gust plus the buffet and a win's gust on top
		limits: { prop: { pos: +(s.amp * 1.9).toFixed(2), neg: +(s.amp * 1.9).toFixed(2) } },
		drive,
		pose: (rig, t) => drive(rig, { t, gustT: -1 }),
	};
};

/** the props both plates share: same course, same trees, sunset or noon */
const course = (plate: string, tag: string): BgPropSpec[] => [
	// palms: the crowns lean with the wind about the top of the trunk
	sway({ name: `bg:palmL${tag}`, plate, rect: [0, 135, 140, 270], pivot: [57, 205], at: [57, 195], radius: [62, 54], amp: 7, period: 5600, phase: 0.0 }),
	sway({ name: `bg:palmM${tag}`, plate, rect: [338, 214, 468, 330], pivot: [390, 275], at: [395, 265], radius: [58, 42], amp: 8, period: 4900, phase: 1.3 }),
	sway({ name: `bg:palmR1${tag}`, plate, rect: [1335, 195, 1485, 315], pivot: [1407, 255], at: [1408, 250], radius: [66, 46], amp: 8, period: 5300, phase: 2.1 }),
	sway({ name: `bg:palmR2${tag}`, plate, rect: [1440, 95, 1650, 280], pivot: [1550, 182], at: [1545, 180], radius: [95, 75], amp: 5.2, period: 6100, phase: 0.7 }),
	// umbrellas: the canopy tips on its pole and lifts a touch as it does.
	// The field takes the WHOLE scalloped valance (to y ~385): with it at the
	// field's edge the canopy tipped over a valance that half stayed, and the
	// seam between them stepped (offline render, 2026-10-24).
	sway({ name: `bg:umbL${tag}`, plate, rect: [0, 280, 162, 400], pivot: [50, 368], at: [65, 334], radius: [84, 46], amp: 3.2, period: 4300, phase: 0.4, lift: 0.5 }),
	sway({ name: `bg:umbM${tag}`, plate, rect: [416, 296, 614, 404], pivot: [511, 374], at: [513, 348], radius: [94, 44], amp: 3.2, period: 4700, phase: 1.9, lift: 0.5 }),
	sway({ name: `bg:umbR${tag}`, plate, rect: [1766, 280, 1920, 400], pivot: [1855, 368], at: [1850, 334], radius: [80, 45], amp: 3.2, period: 4500, phase: 2.6, lift: 0.5 }),
	// the foreground hibiscus clumps in the corners: they toss from the root
	sway({ name: `bg:bushL${tag}`, plate, rect: [0, 650, 330, 1080], pivot: [110, 1080], at: [110, 880], radius: [130, 135], amp: 1.7, period: 4200, phase: 1.1, avoid: [[185, 872, 335, 938], [0, 640, 335, 762]] }),
	sway({ name: `bg:bushR${tag}`, plate, rect: [1660, 850, 1920, 1080], pivot: [1820, 1080], at: [1815, 960], radius: [115, 100], amp: 2, period: 3900, phase: 2.2, avoid: [[1636, 866, 1762, 1000]] }),
	// the golden flag: it streams out and its cloth ripples in a gust
	sway({ name: `bg:flag${tag}`, plate, rect: [1795, 578, 1920, 718], pivot: [1806, 648], at: [1856, 648], radius: [55, 52], amp: 3, period: 3800, phase: 0.9, flutter: 0.05 }),
];

export const BG_BASE_PROPS: BgPropSpec[] = [
	...course('gbBgBase', 'Base'),
	sway({ name: 'bg:cloudBase', plate: 'gbBgBase', rect: [520, 35, 1130, 285], pivot: [825, 155], at: [825, 155], radius: [220, 60], amp: 0.45, period: 7000, phase: 0.2, drift: 12 }),
];
export const BG_FEATURE_PROPS: BgPropSpec[] = [
	...course('gbBgFeature', 'Feature'),
	// the plume rolls; its molten core throbs separately (BgMotion's lava glow).
	// The crater and cone are AVOIDED: the glow over them is a still sprite,
	// and a crater that moved under it showed twice.
	sway({ name: 'bg:volcano', plate: 'gbBgFeature', rect: [1600, 6, 1915, 170], pivot: [1792, 112], at: [1765, 52], radius: [125, 46], amp: 2.2, period: 3600, phase: 0.5, lift: 0.8, avoid: [[1690, 98, 1900, 175]] }),
];
export const BG_PROPS: BgPropSpec[] = [...BG_BASE_PROPS, ...BG_FEATURE_PROPS];
