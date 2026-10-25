/** Saucer Monkey's background meshes — the wind model ported from Putt Monkey
 * (2026-10-25, user: 飛碟也做一樣的處理, 背景太靜態). Night on the farm: the
 * corn and the trees take the wind, the clouds drift, the saucer and the
 * mothership HOVER (their own bob, not the wind's). The light — stars, windows,
 * the ship's ports and beam — is BgNight.svelte.
 *
 * Original note: Registered background meshes: borders stay on the plate; theme props move inside them.
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
	/** [px, deg, period ms]: a craft's own hover — a bob and a tilt that do
	 *  not answer the wind */
	hover?: [number, number, number];
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
	// 2026-10-25 (user: 飄動的時候整個網格圖在動): the blob used to win every
	// vertex inside it outright, so a whole rounded patch of the plate — the
	// field behind the corn, the stalks' feet — turned as one rigid card. Now
	// the prop's share is set directly and nowhere is it all-or-nothing: a
	// plant bends (still at the root, most at the tips) and its pull thins out
	// over a wide margin round the ellipse; a cloud or a craft fades from its
	// centre. The deformation spreads instead of piling up on one seam.
	const n = (p: Point) => Math.hypot((p[0] - s.at[0]) / s.radius[0], (p[1] - s.at[1]) / s.radius[1]);
	const rigid = !!(s.drift || s.hover);
	const top = s.at[1] - s.radius[1];
	const share = (p: Point) => {
		const r = n(p);
		const body = rigid ? 1 - smoothstep((r - 0.35) / 0.9) : 1 - smoothstep((r - 0.5) / 0.9);
		const rise = rigid ? 1 : Math.pow(Math.min(1, Math.max(0, (s.pivot[1] - p[1]) / Math.max(1, s.pivot[1] - top))), 1.4);
		const near = Math.min(Infinity, ...(s.avoid ?? []).map((a) => boxDist(p, a)));
		const clear = (s.avoid?.length ?? 0) ? smoothstep(near / APRON) : 1;
		const edge = smoothstep((Math.min(p[0] - rect[0], rect[2] - p[0], p[1] - rect[1], rect[3] - p[1]) - 5) / 40);
		return body * rise * clear * edge;
	};
	const drive = (rig: Rig, env: BgEnv) => {
		const pose = restPose(rig),
			b = pose.bones[rig.bones.findIndex((x) => x.name === 'prop')];
		const fade = smoothstep(env.t / 1500);
		const w = windAt(env, s.pivot[0], s.period, s.phase) * fade;
		b.angle = w * s.amp;
		b.dy = -Math.abs(w) * s.amp * (s.lift ?? 0);
		// a cloud drifts with the wind both ways, so it never parks
		if (s.drift) b.dx = s.drift * w;
		if (s.hover) {
			const [px, deg, per] = s.hover;
			const ph = (env.t * Math.PI * 2) / per + s.phase;
			b.dy = px * Math.sin(ph) * fade;
			b.angle = deg * Math.sin(ph * 0.5 + 1.1) * fade;
		}
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
				// the prop takes every vertex by distance; `keep` then hands all
				// but its `share` back to the still frame, so the share is exact
				{ name: 'frame', pivot: [0, 0], dist: () => 1000 },
				{ name: 'prop', parent: 'frame', pivot: s.pivot, dist: () => 0, keep: share },
			],
		},
		// a full gust plus the buffet and a win's gust on top
		limits: { prop: { pos: +Math.max(s.amp * 1.9, s.hover?.[1] ?? 0).toFixed(2), neg: +Math.max(s.amp * 1.9, s.hover?.[1] ?? 0).toFixed(2) } },
		drive,
		pose: (rig, t) => drive(rig, { t, gustT: -1 }),
	};
};

/** the props both plates share: the same farm, the same night */
const farm = (plate: string, tag: string): BgPropSpec[] => [
	// the tall corn in the foreground corners: tossed from the root, the
	// tassels swinging furthest. The left clump stops above the fence rail.
	sway({ name: `bg:cornL${tag}`, plate, rect: [0, 560, 360, 850], pivot: [180, 850], at: [185, 705], radius: [130, 110], amp: 2.3, period: 4300, phase: 0.3 }),
	sway({ name: `bg:cornR${tag}`, plate, rect: [1500, 540, 1920, 1080], pivot: [1760, 1080], at: [1755, 830], radius: [160, 210], amp: 2.4, period: 4700, phase: 1.6 }),
	// the corn row behind the barn: far off, a ripple more than a sway
	sway({ name: `bg:cornRow${tag}`, plate, rect: [320, 360, 880, 480], pivot: [600, 470], at: [600, 415], radius: [250, 32], amp: 1.4, period: 3900, phase: 2.4 }),
	// the two big trees: the crowns lean, the trunks hold
	sway({ name: `bg:treeL${tag}`, plate, rect: [0, 0, 260, 300], pivot: [100, 300], at: [100, 120], radius: [120, 110], amp: 2.2, period: 5600, phase: 0.9 }),
	sway({ name: `bg:treeR${tag}`, plate, rect: [1700, 120, 1920, 480], pivot: [1830, 480], at: [1830, 250], radius: [110, 130], amp: 2.2, period: 5900, phase: 2.0 }),
	// the clouds drift with the wind, both ways
	sway({ name: `bg:cloudL${tag}`, plate, rect: [260, 180, 1020, 360], pivot: [640, 270], at: [640, 270], radius: [330, 70], amp: 0.3, period: 7800, phase: 0.4, drift: 14 }),
	sway({ name: `bg:cloudR${tag}`, plate, rect: [1080, 200, 1680, 360], pivot: [1380, 290], at: [1380, 290], radius: [270, 55], amp: 0.3, period: 8300, phase: 1.7, drift: 14 }),
];

/** the mothership's hover, for the lights BgNight lays over it: they must
 *  ride the same bob or they show twice (t in ms since the scene appeared) */
export const MOTHERSHIP_HOVER = { px: 6, period: 4600, phase: 0 };
export const mothershipDy = (t: number) =>
	MOTHERSHIP_HOVER.px * Math.sin((t * Math.PI * 2) / MOTHERSHIP_HOVER.period + MOTHERSHIP_HOVER.phase) * smoothstep(t / 1500);

export const BG_BASE_PROPS: BgPropSpec[] = [
	...farm('gbBgBase', 'Base'),
	// the little saucer zips about where it hangs: a quick bob and a wobble
	sway({ name: 'bg:saucer', plate: 'gbBgBase', rect: [360, 20, 580, 150], pivot: [465, 82], at: [465, 80], radius: [70, 34], amp: 0, period: 4000, phase: 0, hover: [6, 2.5, 1900] }),
];
export const BG_FEATURE_PROPS: BgPropSpec[] = [
	...farm('gbBgFeature', 'Feature'),
	// the mothership: a slow, heavy hover
	sway({ name: 'bg:mothership', plate: 'gbBgFeature', rect: [500, 0, 1440, 260], pivot: [970, 130], at: [970, 120], radius: [430, 105], amp: 0, period: 4000, phase: 0, hover: [6, 0, 4600] }),
];
export const BG_PROPS: BgPropSpec[] = [...BG_BASE_PROPS, ...BG_FEATURE_PROPS];
