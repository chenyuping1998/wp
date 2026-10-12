/**
 * THE FREE-SPIN BOARDS' DECOR (sushiV8/fg_intro_decor.png, fg_total_decor.png)
 * — the things sitting on the board's corners answer the board's drop.
 *
 *   intro  the two service bells on the top corners: thrown into a rock when
 *          the board lands, the button rings (down, up, a buzz) and the ding
 *          strokes beside them flare; then they keep rocking a little
 *   total  the leaning burger stack bottom left wobbles like jelly, the top
 *          burger most; the pile of plates bottom right teeters, each plate a
 *          beat behind the one under it
 *
 * FreeSpinAnimation.svelte drops the board in and swings it as a whole; the
 * board itself stays a plain sprite, and each cluster is a mesh over ONE
 * rectangle of the decor layer (the decor is a separate transparent PNG, so
 * nothing of the board can ghost through where the mesh moves away).
 *
 * Rig units are board pixels (1600 x 1000), measured 2026-10-09 from the
 * alpha: left bell base (115..355, 215..305), dome (140..335, 95..235), button
 * cap (240..300, 92..115) on its stem (255..285, 115..160), ding strokes
 * (142..195, 92..148) and (345..375, 155..215); the right bell mirrored about
 * x = 1599 / 2. Burgers (42..334, 554..849), top one (140..315, 560..700).
 * Plates, bottom to top: (1335..1510, 715..785), (1370..1525, 660..735),
 * (1390..1545, 615..680), (1415..1560, 566..635).
 */
import { blob, flick, polygon, restPose, smoothstep, type MeshWinSpec, type PartSpec, type Point, type Pose, type Rect, type Rig } from './meshRig';

export const FG_BOARD_CANVAS: [number, number] = [1600, 1000];

export type BoardEnv = { /** ms since the board started to drop */ t: number };
export type BoardSpec = MeshWinSpec & { drive: (rig: Rig, env: BoardEnv) => Pose };

// FreeSpinAnimation drops it over 700ms with svelte's backOut, which first
// reaches the resting line at 37% of the way
const LAND_MS = 259;

const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const wave = (t: number, period: number, phase = 0) => Math.sin((2 * Math.PI * t) / period + phase);

/** a decor cluster: everything else in its rectangle is still `frame` */
const cluster = (
	name: string,
	sprite: string,
	rect: Rect,
	parts: PartSpec[],
	inked: (p: Point) => boolean,
	limits: MeshWinSpec['limits'],
	drive: (rig: Rig, t: number) => Pose,
): BoardSpec => {
	const spec: BoardSpec = {
		symbol: `fgBoard:${name}`,
		key: sprite,
		sprite,
		mode: 'panel',
		feetY: rect[3],
		durationMs: 3000,
		landMs: 99999,
		hitMs: 99999,
		inked,
		rig: {
			canvas: FG_BOARD_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: Math.round((rect[2] - rect[0]) / 5), rows: Math.round((rect[3] - rect[1]) / 5) },
			soft: 4,
			parts: [
				{ name: 'frame', pivot: [rect[0], rect[1]], dist: () => 10 },
				// every part hands its weight back to the frame near the rectangle's edge
				...parts.map((p) => ({ ...p, keep: (q: Point) => smoothstep((depthIn(rect, q) - 2) / 8) * (p.keep ? p.keep(q) : 1) })),
			],
		},
		limits,
		drive: (rig, { t }) => drive(rig, t),
		pose: (rig, t) => spec.drive(rig, { t }),
	};
	return spec;
};

// ---------------------------------------------------------------------------
// intro: the bells

const BELL: Point[] = [[115, 250], [140, 215], [150, 160], [190, 110], [240, 100], [300, 112], [335, 170], [340, 215], [355, 250], [345, 300], [250, 308], [130, 300]];
const BUTTON: Point[] = [[238, 90], [302, 90], [302, 116], [287, 120], [287, 160], [253, 160], [253, 120], [238, 116]];
const DING_A: Point[] = [[140, 90], [198, 90], [198, 150], [140, 150]];
const DING_B: Point[] = [[343, 152], [378, 152], [378, 218], [343, 218]];
const mirror = (pts: Point[]): Point[] => pts.map(([x, y]) => [1599 - x, y]);

const bellParts = (side: 'L' | 'R'): PartSpec[] => {
	const m = side === 'L' ? (p: Point[]) => p : mirror;
	const mx = (x: number) => (side === 'L' ? x : 1599 - x);
	return [
		{ name: `bell${side}`, parent: 'frame', pivot: [mx(235), 305], axis: [0, -1], priority: 1, dist: polygon(m(BELL)) },
		{
			name: `button${side}`,
			parent: `bell${side}`,
			pivot: [mx(270), 160],
			axis: [0, -1],
			priority: 3,
			dist: polygon(m(BUTTON)),
			// the stem's foot stays in the dome
			keep: (p) => smoothstep((156 - p[1]) / 12),
		},
		{ name: `dingA${side}`, parent: `bell${side}`, pivot: [mx(198), 150], axis: [side === 'L' ? -1 : 1, -1], priority: 2, dist: polygon(m(DING_A)) },
		{ name: `dingB${side}`, parent: `bell${side}`, pivot: [mx(343), 185], axis: [side === 'L' ? 1 : -1, 0], priority: 2, dist: polygon(m(DING_B)) },
	];
};

const bells = (sprite: string, side: 'L' | 'R') => {
	const rect: Rect = side === 'L' ? [100, 80, 392, 318] : [1599 - 392, 80, 1599 - 100, 318];
	const s = side === 'L' ? 1 : -1;
	const ink = [BELL, BUTTON, DING_A, DING_B].map((pts) => polygon(side === 'L' ? pts : mirror(pts)));
	return cluster(
		`bells${side}`,
		sprite,
		rect,
		bellParts(side),
		(p) => ink.some((d) => d(p) === 0),
		{ [`bell${side}`]: { pos: 4, neg: 4 }, [`button${side}`]: { pos: 4, neg: 4 }, [`dingA${side}`]: { pos: 0, neg: 0 }, [`dingB${side}`]: { pos: 0, neg: 0 } },
		(rig, t) => {
			const pose = restPose(rig);
			const ramp = smoothstep(t / 600);
			// rocked on the landing, then a slow rock on its base
			bone(rig, pose, `bell${side}`).angle = s * (BELL_DEG * flick(t, LAND_MS, 2.2, 2.4) + 0.5 * BELL_DEG * wave(t, 2400, side === 'L' ? 0 : 1.9) * ramp);
			const button = bone(rig, pose, `button${side}`);
			// struck: down, up, and buzzing; it rings again every few seconds
			const ring = (t0: number) => 3.5 * Math.max(0, flick(t, t0, 4, 5)) - 1.5 * Math.max(0, -flick(t, t0, 4, 5));
			button.dy = ring(LAND_MS + 60) + ring(LAND_MS + 2000 + (side === 'L' ? 0 : 500)) * 0.6;
			button.angle = s * 2 * flick(t, LAND_MS + 120, 7, 4);
			// the ding strokes flare outward with each ring
			const flare = Math.max(0, flick(t, LAND_MS + 80, 3, 4)) + 0.6 * Math.max(0, flick(t, LAND_MS + 2080 + (side === 'L' ? 0 : 500), 3, 4));
			for (const n of [`dingA${side}`, `dingB${side}`]) {
				const d = bone(rig, pose, n);
				d.along = 1 + 0.08 * flare;
				d.across = 1 + 0.03 * flare;
			}
			return pose;
		},
	);
};

// ---------------------------------------------------------------------------
// total: the burger stack and the plates

const STACK: Point[] = [[42, 780], [60, 700], [100, 640], [140, 600], [200, 560], [300, 568], [334, 640], [300, 720], [200, 800], [120, 849], [50, 849]];
const TOP_BURGER: Point[] = [[140, 610], [190, 562], [260, 558], [316, 586], [318, 650], [300, 700], [180, 704], [140, 680]];

const burgers = (sprite: string) => {
	const rect: Rect = [30, 540, 346, 860];
	const stack = polygon(STACK), top = polygon(TOP_BURGER);
	return cluster(
		'burgers',
		sprite,
		rect,
		[
			{ name: 'stack', parent: 'frame', pivot: [90, 845], axis: [1, -1.2], priority: 1, dist: stack },
			{ name: 'topBurger', parent: 'stack', pivot: [200, 700], axis: [0.3, -1], priority: 2, dist: top, keep: (p) => smoothstep((704 - p[1]) / 24) },
		],
		(p) => stack(p) === 0 || top(p) === 0,
		{ stack: { pos: 2, neg: 2 }, topBurger: { pos: 5, neg: 5 } },
		(rig, t) => {
			const pose = restPose(rig);
			const ramp = smoothstep(t / 600);
			const s = bone(rig, pose, 'stack');
			const jelly = flick(t, LAND_MS, 2.6, 2.6);
			s.angle = 1.2 * jelly + 0.4 * wave(t, 2200) * ramp;
			s.along = 1 - 0.03 * Math.max(0, flick(t, LAND_MS, 4, 5));
			s.across = 1 + 0.02 * Math.max(0, flick(t, LAND_MS, 4, 5));
			bone(rig, pose, 'topBurger').angle = 3 * flick(t, LAND_MS + 90, 2.6, 2.6) + 1.1 * wave(t - 300, 2200) * ramp;
			return pose;
		},
	);
};

const PLATES: [Point, number, number][] = [
	[[1422, 750], 88, 36],
	[[1447, 697], 78, 38],
	[[1467, 647], 78, 34],
	[[1487, 600], 74, 36],
];

const plates = (sprite: string) => {
	const rect: Rect = [1322, 552, 1576, 800];
	const dists = PLATES.map(([c, rx, ry]) => blob(c, rx, ry, 2));
	const names = PLATES.map((_, i) => `plate${i}`);
	return cluster(
		'plates',
		sprite,
		rect,
		PLATES.map(([c, , ry], i) => ({
			name: names[i],
			parent: i === 0 ? 'frame' : names[i - 1],
			pivot: [c[0], c[1] + ry * 0.8] as Point,
			axis: [0, -1] as Point,
			// the upper plate sits on the one under it: it takes the overlap
			priority: 1 + i,
			dist: dists[i],
		})),
		(p) => dists.some((d) => d(p) === 0),
		Object.fromEntries(names.map((n, i) => [n, { pos: 1.8 + i * 0.4, neg: 1.8 + i * 0.4 }])),
		(rig, t) => {
			const pose = restPose(rig);
			const ramp = smoothstep(t / 600);
			names.forEach((n, i) => {
				// each plate a beat behind the one under it, the top one teetering most
				bone(rig, pose, n).angle =
					(i % 2 ? -1 : 1) * (1.4 + 0.2 * i) * flick(t, LAND_MS + 70 * i, 2.4, 2.4) + 0.35 * wave(t - 240 * i, 2600) * ramp;
			});
			return pose;
		},
	);
};

/** the decor meshes for the intro board (bells) or the total board */
export const FG_BOARD_DECOR = (settlement: boolean): BoardSpec[] =>
	settlement
		? [burgers('v8FgTotalDecor'), plates('v8FgTotalDecor')]
		: [bells('v8FgIntroDecor', 'L'), bells('v8FgIntroDecor', 'R')];

/** the same, for the gate */
export const FG_BOARD_ALL: BoardSpec[] = [...FG_BOARD_DECOR(false), ...FG_BOARD_DECOR(true)];

// set from the measured limits
const BELL_DEG = 2.4;
