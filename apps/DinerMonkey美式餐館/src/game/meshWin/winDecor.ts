/**
 * THE BIG-WIN PLAQUES' DECOR (sushiV8/win_*_decor.png, one per tier) — the
 * things standing on each plaque's sides act while the amount counts up.
 *
 *   big     the burger: jelly on the slam, the top bun bounces; the speed
 *           lines on the right flare
 *   super   two service bells: rocked on the slam, their buttons ring
 *   mega    the burger and the hot dog: jelly, each on its own beat
 *   epic    the milkshake wobbles, cherry and straw last; the side stars twinkle
 *   max     the Chef and the Carhop laugh: their heads bob and nod
 *
 * Win.svelte pops the plaque in (scale) and draws the plaque itself as a
 * sprite; only its decor layer is meshed, one mesh per cluster, each over its
 * own rectangle of the decor PNG (transparent around it, so nothing ghosts).
 * Rig units are decor pixels (1000 x 560), bboxes measured 2026-10-09 from the
 * alpha. Win.svelte's clock: the plaque lands at ~550ms.
 */
import { flick, polygon, restPose, smoothstep, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rect, type Rig } from './meshRig';

export const WIN_DECOR_CANVAS: [number, number] = [1000, 560];

export type DecorEnv = { /** ms since the plaque started to pop */ t: number };
export type DecorSpec = MeshWinSpec & { drive: (rig: Rig, env: DecorEnv) => Pose };

const SLAM_MS = 550;

/** px inside the rectangle, counting only the sides inside the canvas: a side
 *  on the canvas edge is not pinned (the art runs off it; pinning it there
 *  crushed the burger's and the Carhop's outer edges) */
const depthIn = (r: Rect, p: Point) =>
	Math.max(0, Math.min(r[0] > 0 ? p[0] - r[0] : 1e9, r[2] < 1000 ? r[2] - p[0] : 1e9, r[1] > 0 ? p[1] - r[1] : 1e9, r[3] < 560 ? r[3] - p[1] : 1e9));
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const wave = (t: number, period: number, phase = 0) => Math.sin((2 * Math.PI * t) / period + phase);
const box = (r: Rect): Point[] => [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
const pad = (r: Rect, n: number): Rect => [Math.max(0, r[0] - n), Math.max(0, r[1] - n), Math.min(1000, r[2] + n), Math.min(560, r[3] + n)];

/** a thing on the plaque, by how it acts */
type Thing = {
	name: string;
	bbox: Rect;
	kind: 'jelly' | 'bell' | 'laugh' | 'twinkle' | 'whoosh';
	/** the upper share of the bbox that is its loose top (jelly / bell / laugh) */
	top?: number;
	/** +1 / -1: which way it leans (mirrored pairs) */
	side?: number;
	phase?: number;
};

const thingParts = (t: Thing): PartSpec[] => {
	const [x0, y0, x1, y1] = t.bbox;
	const cx = (x0 + x1) / 2;
	if (t.kind === 'twinkle') return [{ name: t.name, parent: 'frame', pivot: [cx, (y0 + y1) / 2], axis: [0, -1], priority: 1, dist: polygon(box(t.bbox)) }];
	if (t.kind === 'whoosh') return [{ name: t.name, parent: 'frame', pivot: [x0, (y0 + y1) / 2], axis: [1, 0], priority: 1, dist: polygon(box(t.bbox)) }];
	const ty = y0 + (y1 - y0) * (t.top ?? 0.45);
	return [
		{ name: t.name, parent: 'frame', pivot: [cx, y1], axis: [0, -1], priority: 1, dist: polygon(box(t.bbox)) },
		{
			name: `${t.name}Top`,
			parent: t.name,
			pivot: [cx, ty],
			axis: [0, -1],
			priority: 2,
			dist: polygon(box([x0, y0, x1, ty + 4])),
			keep: (p) => smoothstep((ty - p[1]) / 28),
		},
	];
};

const thingLimits = (t: Thing): MeshWinSpec['limits'] =>
	t.kind === 'twinkle' || t.kind === 'whoosh'
		? { [t.name]: { pos: 0, neg: 0 } }
		: { [t.name]: { pos: 3, neg: 3 }, [`${t.name}Top`]: { pos: 6, neg: 6 } };

const act = (rig: Rig, pose: Pose, th: Thing, t: number) => {
	const s = th.side ?? 1;
	const ph = th.phase ?? 0;
	const ramp = smoothstep((t - SLAM_MS) / 500);
	const b = bone(rig, pose, th.name);
	if (th.kind === 'twinkle') {
		const tw = Math.max(0, wave(t, 900, ph));
		b.along = b.across = 1 + 0.14 * tw * tw * ramp + 0.1 * Math.max(0, flick(t, SLAM_MS + ph * 60, 3, 4));
		return;
	}
	if (th.kind === 'whoosh') {
		b.along = 1 + 0.12 * Math.max(0, flick(t, SLAM_MS, 2.5, 3)) + 0.05 * (0.5 + 0.5 * wave(t, 700)) * ramp;
		return;
	}
	const top = bone(rig, pose, `${th.name}Top`);
	const hit = flick(t, SLAM_MS + ph * 80, 2.6, 2.6);
	if (th.kind === 'jelly') {
		b.angle = s * (1.6 * hit + 0.6 * wave(t, 1600, ph) * ramp);
		const sq = Math.max(0, flick(t, SLAM_MS + ph * 80, 4, 5));
		b.along = 1 - 0.05 * sq;
		b.across = 1 + 0.035 * sq;
		top.angle = s * (4 * flick(t, SLAM_MS + 90 + ph * 80, 2.6, 2.6) + 1.6 * wave(t - 250, 1600, ph) * ramp);
		top.dy = -4 * Math.max(0, flick(t, SLAM_MS + 60 + ph * 80, 4, 5));
	} else if (th.kind === 'bell') {
		b.angle = s * (2.2 * hit + 0.7 * wave(t, 2000, ph) * ramp);
		// the button rings on the slam and every 1.2s after
		const ring = (t0: number) => Math.max(0, flick(t, t0, 4, 5));
		const since = Math.max(0, t - SLAM_MS);
		const k = Math.floor(since / 1200);
		top.dy = 5 * ring(SLAM_MS + ph * 200) + 3 * (k > 0 ? ring(SLAM_MS + ph * 200 + k * 1200) : 0);
		top.angle = s * 2 * flick(t, SLAM_MS + 100, 6, 4);
	} else {
		// laughing: the head bobs on a fast beat, the top of it nods
		const laugh = Math.abs(wave(t, 420, ph)) * ramp;
		b.along = 1 - 0.03 * laugh + 0.03 * Math.max(0, flick(t, SLAM_MS, 3, 4));
		b.across = 1 + 0.02 * laugh;
		b.angle = s * (1.5 * hit + 1.2 * wave(t, 1700, ph) * ramp);
		top.angle = s * (3 * wave(t, 840, ph + 0.6) * ramp + 3 * flick(t, SLAM_MS + 80, 2.4, 2.6));
	}
};

const cluster = (sprite: string, name: string, things: Thing[]): DecorSpec => {
	const r = things.map((t) => pad(t.bbox, 16)).reduce<Rect>((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])], [1e9, 1e9, -1e9, -1e9]);
	const inks = things.map((t) => polygon(box(t.bbox)));
	const spec: DecorSpec = {
		symbol: `winDecor:${name}`,
		key: sprite,
		sprite,
		mode: 'panel',
		feetY: r[3],
		durationMs: 3200,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => inks.some((d) => d(p) === 0),
		rig: {
			canvas: WIN_DECOR_CANVAS,
			grid: { x0: r[0], y0: r[1], x1: r[2], y1: r[3], cols: Math.round((r[2] - r[0]) / 6), rows: Math.round((r[3] - r[1]) / 6) },
			soft: 4,
			parts: [
				{ name: 'frame', pivot: [r[0], r[1]], dist: () => 10 },
				...things.flatMap(thingParts).map((p) => ({ ...p, keep: (q: Point) => smoothstep((depthIn(r, q) - 2) / 8) * (p.keep ? p.keep(q) : 1) })),
			],
		},
		limits: Object.assign({}, ...things.map(thingLimits)),
		drive: (rig, { t }) => {
			const pose = restPose(rig);
			for (const th of things) act(rig, pose, th, t);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t }),
	};
	return spec;
};

const STARS_L: Rect[] = [[71, 93, 120, 178], [71, 191, 120, 276]];
const STARS_R: Rect[] = [[876, 93, 925, 178], [876, 191, 925, 276], [876, 289, 925, 374], [876, 387, 925, 472]];

/** each tier's decor meshes, by the banner's asset key (Win.svelte BANNER_KEY) */
export const WIN_DECOR: Record<string, DecorSpec[]> = {
	v8WinBig: [
		cluster('v8WinBigDecor', 'bigBurger', [{ name: 'burger', bbox: [31, 253, 231, 451], kind: 'jelly', top: 0.42 }]),
	],
	v8WinSuper: [
		cluster('v8WinSuperDecor', 'superBellL', [{ name: 'bellL', bbox: [5, 252, 215, 451], kind: 'bell', top: 0.3, side: 1 }]),
		cluster('v8WinSuperDecor', 'superBellR', [{ name: 'bellR', bbox: [785, 250, 998, 446], kind: 'bell', top: 0.3, side: -1, phase: 1 }]),
	],
	v8WinMega: [
		cluster('v8WinMegaDecor', 'megaBurger', [{ name: 'burger', bbox: [0, 226, 232, 466], kind: 'jelly', top: 0.42 }]),
		cluster('v8WinMegaDecor', 'megaHotdog', [{ name: 'hotdog', bbox: [780, 236, 984, 415], kind: 'jelly', top: 0.5, side: -1, phase: 1.5 }]),
	],
	v8WinEpic: [
		cluster('v8WinEpicDecor', 'epicLeft', [
			{ name: 'shake', bbox: [36, 278, 197, 478], kind: 'jelly', top: 0.4 },
			// only the upper star: the lower one sits on the cherry, and twinkling
			// beside the swaying straw it folded the paper between them
			{ name: 'starL0', bbox: STARS_L[0], kind: 'twinkle', phase: 0 },
		]),
		cluster('v8WinEpicDecor', 'epicRight', STARS_R.map((b, i): Thing => ({ name: `starR${i}`, bbox: b, kind: 'twinkle', phase: 0.8 + i * 1.3 }))),
	],
	v8WinMax: [
		cluster('v8WinMaxDecor', 'maxChef', [{ name: 'chef', bbox: [37, 212, 222, 431], kind: 'laugh', top: 0.5, side: 1 }]),
		cluster('v8WinMaxDecor', 'maxCarhop', [{ name: 'carhop', bbox: [738, 208, 998, 435], kind: 'laugh', top: 0.5, side: -1, phase: 1.1 }]),
	],
};

/** all of them, for the gate */
export const WIN_DECOR_ALL: DecorSpec[] = Object.values(WIN_DECOR).flat();
