/**
 * THE COWS IN THE FIELD (user 2026-11-06: 讓獎圖的那隻牛在背景有幾隻牛走來走去 → 切說明圖乳牛來做).
 *
 * One mesh over static/assets/sprites/saucerNight/cow_walk.png (design/build_bg_cows.py: the middle cow of the
 * intro card, cut out of the tractor beam, re-lit for the night and levelled). In the card she is floating up the
 * beam, so her legs hang at different angles and lengths; the rig's REST pose (`STAND`) swings each leg forward
 * and stretches the short hind one so the hooves meet one ground line. Everything else is offset from there. The
 * far hind leg was a stub behind the udder that the near hind leg would have to pass over (a single mesh folds
 * there), so build_bg_cows.py paints it out — side on, the near hind leg stands where it would be.
 *
 *   walk    the near hind and near front legs step alternately (the shaded far front goes with the near front at
 *           half the swing), the leg swinging forward a touch
 *           shorter so the hoof clears the grass; the body bobs twice a stride, the head nods with it
 *   graze   the head goes down to the grass and crops twice, the tail swishes
 *   always  the tail, slow, and an ear-flick of the head now and then
 *
 * Deterministic in its env, so the gate and the offline sheets can step it. Canvas px (COW_CANVAS square).
 */
import { restPose, smoothstep, type MeshWinSpec, type Point, type Pose, type Rig } from './meshRig';

export const COW_CANVAS = 320;
/** where the hooves stand in the canvas once STAND has re-posed the legs */
export const COW_GROUND = 284;

export type CowEnv = {
	/** ms, for the idle things that run whatever she is doing */
	t: number;
	/** the stride's phase, radians — it only advances while she walks */
	phase: number;
	/** 0 standing … 1 walking */
	walk: number;
	/** 0 head up … 1 head down in the grass */
	graze: number;
	/** how far into the standing re-pose (default 1; the gate eases in from the drawing at 0) */
	stand?: number;
};
export type CowSpec = MeshWinSpec & { drive: (rig: Rig, env: CowEnv) => Pose };

/** distance to a polyline, minus a radius: a limb */
const limb = (pts: Point[], r: number) => (p: Point) => {
	let best = Infinity;
	for (let i = 0; i < pts.length - 1; i++) {
		const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
		const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
		const k = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L));
		best = Math.min(best, Math.hypot(p[0] - ax - dx * k, p[1] - ay - dy * k));
	}
	return Math.max(0, best - r);
};
const ellipseDist = (c: Point, rx: number, ry: number) => (p: Point) => Math.max(0, Math.hypot((p[0] - c[0]) / rx, (p[1] - c[1]) / ry) - 1) * Math.min(rx, ry);

// measured on design/build_bg_cows.py --grid (canvas px): hip → hoof
const LEGS = {
	nh: { hip: [76, 203] as Point, hoof: [54, 262] as Point, r: 12, rake: 12 }, // near hind: a cow's hind legs stand raked back
	nf: { hip: [146, 212] as Point, hoof: [122, 286] as Point, r: 12, rake: 4 }, // near front
	ff: { hip: [188, 208] as Point, hoof: [160, 262] as Point, r: 16, rake: 6, top: [182, 222] as Point }, // far front (in shade)
};
type LegName = keyof typeof LEGS;

/** the standing pose: each leg swung forward to its rake and stretched to reach COW_GROUND */
const STAND = (() => {
	const out = {} as Record<LegName, { angle: number; along: number }>;
	for (const [name, leg] of Object.entries(LEGS) as [LegName, (typeof LEGS)[LegName]][]) {
		const dx = leg.hoof[0] - leg.hip[0], dy = leg.hoof[1] - leg.hip[1];
		const back = (Math.atan2(-dx, dy) * 180) / Math.PI; // degrees the hoof sits behind the hip
		const angle = -(back - leg.rake); // swing forward, keep the leg's rake
		const len = Math.hypot(dx, dy);
		const reach = (COW_GROUND - leg.hip[1]) / Math.cos((leg.rake * Math.PI) / 180);
		out[name] = { angle, along: Math.max(1, Math.min(1.45, reach / len)) };
	}
	return out;
})();

const parts = [
	{ name: 'root', pivot: [160, COW_GROUND] as Point, dist: () => 40 },
	// the barrel, plus the udder and the brisket that hang below it — left out, they went to the nearest leg
	{ name: 'body', parent: 'root', pivot: [150, 200] as Point, dist: (p: Point) => Math.min(ellipseDist([140, 170], 110, 55)(p), ellipseDist([111, 225], 22, 22)(p), ellipseDist([200, 205], 22, 14)(p)), priority: 1 },
	// the head takes the bell and the collar's knot with it: grazing, the chin would otherwise roll over them
	{ name: 'head', parent: 'body', pivot: [205, 178] as Point, axis: [1, 0] as Point, dist: (p: Point) => Math.min(ellipseDist([250, 140], 52, 55)(p), ellipseDist([222, 202], 14, 12)(p), ellipseDist([185, 112], 26, 18)(p)), priority: 3 },
	{ name: 'tail', parent: 'body', pivot: [82, 140] as Point, axis: [-1, 1] as Point, dist: limb([[80, 142], [45, 150], [32, 175], [30, 205]], 13), priority: 3 },
	...(Object.entries(LEGS) as [LegName, (typeof LEGS)[LegName]][]).map(([name, leg], i) => ({
		name,
		parent: 'body',
		pivot: leg.hip,
		axis: [leg.hoof[0] - leg.hip[0], leg.hoof[1] - leg.hip[1]] as Point,
		// a leg's field can start below its pivot (`top`): the far front leg turns about the shoulder, but the
		// brisket beside the shoulder stays the body's
		dist: limb(['top' in leg ? leg.top : leg.hip, leg.hoof], leg.r),
		// the near legs over the far ones where they cross
		priority: name.startsWith('n') ? 6 + i : 4 + i,
		// a hip blends into the body over ~14 px, so the leg bends from the hip instead of tearing off it
		keep: (p: Point) => smoothstep((Math.hypot(p[0] - leg.hip[0], p[1] - leg.hip[1]) - 4) / 14),
	})),
];

const STRIDE_SWING = 8;
export const cowPose = (rig: Rig, env: CowEnv): Pose => {
	const pose = restPose(rig);
	const B = (name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
	const { phase, walk, graze, t } = env;
	const stand = env.stand ?? 1;
	// legs: rest-stand plus the stride
	const pairA = Math.sin(phase), pairB = Math.sin(phase + Math.PI);
	// The near legs carry the walk; the far front leg, in shade, goes along with the near front at half the swing.
	// (A true diagonal gait swings the two front legs opposite ways, and on one mesh their hooves pinch the gap
	// between them until it folds — at this size nobody reads the far leg's timing.)
	const swing: Record<LegName, number> = { nh: pairA, nf: pairB, ff: 0.5 * pairB };
	const forward: Record<LegName, number> = { nh: Math.cos(phase), nf: -Math.cos(phase), ff: -0.5 * Math.cos(phase) };
	for (const name of Object.keys(LEGS) as LegName[]) {
		const b = B(name);
		b.angle = STAND[name].angle * stand - STRIDE_SWING * swing[name] * walk;
		// the leg travelling forward lifts: a touch shorter
		b.along = (1 + (STAND[name].along - 1) * stand) * (1 - 0.07 * Math.max(0, forward[name]) * walk);
	}
	// the body bobs twice a stride and rolls a little with it
	const body = B('body');
	body.dy = -2.2 * Math.abs(Math.cos(phase)) * walk + 1.2 * walk;
	body.angle = 1.2 * Math.sin(phase) * walk;
	// the head: nods with the stride, goes down to graze and crops twice, and flicks now and then
	const head = B('head');
	const crop = graze * (Math.max(0, Math.sin(t / 260)) ** 3) * 1.6;
	const flick = Math.max(0, Math.sin(t / 900 - 1.4) - 0.94) * 40;
	// grazing she reaches forward and down, not curling in (curling folded her chin into the brisket)
	head.angle = 2.5 * Math.sin(phase * 2 + 0.6) * walk + 8 * graze + crop - 1.5 * flick;
	head.dx = 6 * graze;
	head.dy = 5 * graze + 1.5 * crop;
	// the tail: a slow swish, quicker while she grazes
	const tail = B('tail');
	tail.angle = (6 + 3 * graze) * Math.sin(t / (graze > 0.5 ? 420 : 760)) + 2 * Math.sin(phase) * walk + 3 * stand;
	return pose;
};

export const COW: CowSpec = {
	symbol: 'bg:cow',
	key: 'night_cow',
	sprite: 'night_cow',
	art: 'saucerNight/cow_walk.png',
	feetY: COW_GROUND,
	durationMs: 8000,
	landMs: 99999,
	hitMs: 99999,
	rig: { canvas: [COW_CANVAS, COW_CANVAS], grid: { x0: 0, y0: 40, x1: COW_CANVAS, y1: 300, cols: 80, rows: 65 }, soft: 1.5, parts },
	limits: {
		body: { pos: 3, neg: 3 },
		head: { pos: 28, neg: 8 },
		tail: { pos: 16, neg: 16 },
		...Object.fromEntries((Object.keys(LEGS) as LegName[]).map((n) => [n, { pos: Math.abs(STAND[n].angle) + STRIDE_SWING + 1, neg: Math.abs(STAND[n].angle) + STRIDE_SWING + 1 }])),
	},
	drive: cowPose,
	// the gate's view: from the drawing into the stand, a walk that settles into a graze and walks on
	pose: (rig, t) => {
		const stand = smoothstep(t / 500);
		const walk = smoothstep((t - 600) / 400) * (1 - smoothstep((t - 3000) / 600)) + smoothstep((t - 6000) / 600);
		const graze = smoothstep((t - 3600) / 500) * (1 - smoothstep((t - 5600) / 500));
		return cowPose(rig, { t, phase: (t / 1300) * Math.PI * 2, walk: Math.min(1, walk), graze, stand });
	},
};
