/**
 * THE BACKGROUND, MOVING — small mesh patches laid over the three 1920x1080
 * plates (Background.svelte), each making one painted thing move:
 *
 *   base game     the crane's hook swings slowly on its cable over the dusk sky,
 *                 and the ship's mooring line sways between hull and bollard
 *   free spins    the tarps on the container stacks flap in the storm — the two
 *                 big ones up top, and two more on the right-hand stacks
 *   hold & spin   the caged lamp over the stairs sways on its cable
 *
 * A patch is a rectangle of the plate itself, drawn through a mesh on top of
 * the plate at exactly the same place. Its border is owned by `frame` and
 * never moves (the gate checks it), so at rest and at its edges it IS the
 * plate — there is no seam to see. Inside, only the thing that moves has a
 * bone; what surrounds it is sky, glass-smooth cloth or dark steel, which is
 * what absorbs the stretch.
 *
 * Rigged in the plate's own pixels (`uv`). Every motion is built from whole
 * cycles of its loop, so it loops without a seam — the gate checks that too.
 */
import {
	polygon,
	polyline,
	smoothstep,
	restPose,
	type BonePose,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Rect,
	type Rig,
} from './meshRig';

const PLATE: [number, number] = [1920, 1080];

/** px inside a rect (0 on and outside it) */
const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

/** the patch's fixed border, as the panel symbols' frame: owns the edge band.
 *  `hug`, when given, is the moving thing's outline: the frame also claims
 *  everything more than ~7px outside it. Without it the moving part's weight
 *  spilled ~14px past its edge — for the tarps, onto the container's ribs
 *  under the hem, which bent into waves as the cloth swung. */
const frame = (rect: Rect, hug?: (p: Point) => number): PartSpec => ({
	name: 'frame',
	pivot: [(rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2],
	dist: (p) => Math.min(14, depthIn(rect, p), hug ? Math.max(0, 14 - 1.4 * hug(p)) : 14),
});

/** a moving part may never reach the patch's border: its weight fades out
 *  over the last `fade` px, whatever else its own blend says */
const inside = (rect: Rect, fade: number, keep: (p: Point) => number) => (p: Point) =>
	keep(p) * smoothstep((depthIn(rect, p) - 4) / fade);

const patch = (
	id: string,
	key: string,
	rect: Rect,
	loopMs: number,
	parts: PartSpec[],
	inked: (p: Point) => boolean,
	limits: MeshWinSpec['limits'],
	act: (rig: Rig, b: (name: string) => BonePose, t: number) => void,
	cell = 6,
	hug?: (p: Point) => number,
): MeshWinSpec => ({
	symbol: id,
	key,
	sprite: key,
	mode: 'panel',
	loops: true,
	feetY: rect[3],
	durationMs: loopMs,
	landMs: 0,
	hitMs: 0,
	noDust: true,
	inked,
	rig: {
		grid: {
			x0: rect[0],
			y0: rect[1],
			x1: rect[2],
			y1: rect[3],
			cols: Math.round((rect[2] - rect[0]) / cell),
			rows: Math.round((rect[3] - rect[1]) / cell),
		},
		soft: 4,
		uv: PLATE,
		parts: [frame(rect, hug), ...parts],
	},
	limits,
	pose: (rig, t) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		act(rig, b, t);
		return pose;
	},
});

const TAU = Math.PI * 2;
/** a sine completing `n` whole cycles per loop, so the loop has no seam */
const cyc = (t: number, loop: number, n: number, phase = 0) => Math.sin((TAU * n * t) / loop + phase);

// ---- base game: the crane hook -------------------------------------------------
// The cable hangs from the top of the plate at x 756 (two strokes, 748-762) and
// the block and hook end at y 385, all over smooth dusk sky.
const HOOK_RECT: Rect = [686, 0, 826, 404];
const HOOK = polyline([[756, 0], [756, 386]], 16);
const HOOK_LOOP = 7200;

export const BG_HOOK = patch(
	'BG_HOOK',
	'gbBgBase',
	HOOK_RECT,
	HOOK_LOOP,
	[
		{
			name: 'hook',
			parent: 'frame',
			pivot: [756, 0],
			axis: [0, 1],
			dist: HOOK.dist,
			// the pivot is ON the patch's top edge, where the cable leaves the
			// plate: it must not fade there, or the cable would kink at the top
			keep: inside([HOOK_RECT[0], -40, HOOK_RECT[2], HOOK_RECT[3]], 18, () => 1),
		},
	],
	(p) => HOOK.dist(p) === 0,
	{ hook: { pos: 1.6, neg: 1.6 } },
	(rig, b, t) => {
		// a slow pendulum, with a smaller second swing through it so it never
		// reads as a metronome
		b('hook').angle = 1.2 * cyc(t, HOOK_LOOP, 2) + 0.25 * cyc(t, HOOK_LOOP, 5, 1.1);
	},
);

// ---- free spins: the two tarps ---------------------------------------------------
// Each is draped over a container's top edge (`edge`, from its tied end to its
// far end); the cloth below the edge flaps, the hem a beat behind the body,
// in gusts. The top edge is tied down and never moves.
const TARP_LOOP = 4800;

const tarp = (
	id: string,
	rect: Rect,
	cloth: Point[],
	edge: [Point, Point],
	side: 1 | -1,
	phase: number,
	chain: Point[],
	/** how far below the tied edge the hem starts, px — less on a short tarp */
	hemDepth = 40,
) => {
	// THE CHAIN LASHED OVER THE TARP IS PINNED. It is drawn in front of the
	// cloth and runs on past the hem onto the container, so while the cloth
	// carried it and the container did not, it broke into a kink at the hem.
	// The cloth billows round it instead — plain cloth takes that shear unseen.
	const lash = polyline(chain, 5);
	const unlashed = (p: Point) => smoothstep((lash.dist(p) - 2) / 14);
	const shape = polygon(cloth);
	const [a, e] = edge;
	const dx = e[0] - a[0], dy = e[1] - a[1];
	const len = Math.hypot(dx, dy);
	// the downward normal to the tied edge: how far below the edge a point hangs
	const nx = -dy / len, ny = dx / len;
	const down = ny >= 0 ? [nx, ny] : [-nx, -ny];
	const below = (p: Point) => (p[0] - a[0]) * down[0] + (p[1] - a[1]) * down[1];
	const mid: Point = [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2];
	const hemPivot: Point = [mid[0] + down[0] * (hemDepth + 5), mid[1] + down[1] * (hemDepth + 5)];
	return patch(
		id,
		'gbBgFeature',
		rect,
		TARP_LOOP,
		[
			{
				name: 'cloth',
				parent: 'frame',
				pivot: mid,
				// STRAIGHT DOWN, not along the drape: the drape's direction is the
				// normal to the tied edge, which leans, and a stretch along a leaning
				// axis moves every point sideways too — the shear that bent the ribs
				axis: [0, 1],
				dist: shape,
				keep: inside(rect, 16, (p) => smoothstep((below(p) - 4) / 34) * unlashed(p)),
			},
			{
				name: 'hem',
				parent: 'cloth',
				pivot: hemPivot,
				// STRAIGHT DOWN, not along the drape: the drape's direction is the
				// normal to the tied edge, which leans, and a stretch along a leaning
				// axis moves every point sideways too — the shear that bent the ribs
				axis: [0, 1],
				priority: 2,
				dist: shape,
				keep: inside(rect, 16, (p) => smoothstep((below(p) - hemDepth) / (hemDepth * 0.75)) * unlashed(p)),
			},
		],
		(p) => shape(p) === 0,
		{ cloth: { pos: 3, neg: 3 }, hem: { pos: 4, neg: 4 } },
		(rig, b, t) => {
			// gusts: the wind rises and falls twice a loop, and the cloth flutters
			// harder inside each gust
			const gust = 0.55 + 0.45 * cyc(t, TARP_LOOP, 2, phase);
			const flutter = (lag: number) =>
				gust * (0.65 * cyc(t, TARP_LOOP, 9, phase - lag) + 0.35 * cyc(t, TARP_LOOP, 16, phase * 1.7 - lag * 1.8));
			// BILLOW, NOT SWING. The ribs under each tarp are vertical, and any
			// sideways shear bends them into waves (the first pass rotated the
			// cloth and the hem a couple of degrees, and the ribs, the chain and
			// the lit container edge all bent with them). A stretch ALONG the drape
			// — the wind filling the cloth and letting it go — moves the hem up and
			// down, and a vertical stretch on vertical lines cannot be seen. What
			// is left of the swing is a quarter of a degree of life.
			b('cloth').angle = side * 0.35 * flutter(0);
			b('cloth').along = 1 + 0.038 * gust * (0.5 + 0.5 * cyc(t, TARP_LOOP, 9, phase));
			b('cloth').across = 1 + 0.012 * gust * cyc(t, TARP_LOOP, 16, phase);
			b('hem').angle = side * 0.45 * flutter(0.9);
			b('hem').along = 1 + 0.042 * gust * (0.5 + 0.5 * cyc(t, TARP_LOOP, 9, phase - 0.9));
		},
		6,
		shape,
	);
};

export const BG_TARP_L = tarp(
	'BG_TARP_L',
	// the bottom well below the hanging corner (y 372): at 398 the corner was
	// squeezed against the fixed border and the ribs between them zigzagged
	[282, 176, 534, 430],
	[[305, 200], [340, 195], [400, 215], [470, 250], [505, 285], [505, 370], [470, 372], [430, 350], [380, 320], [340, 290], [305, 260]],
	[[318, 202], [488, 276]],
	1,
	0,
	[[368, 266], [410, 420]],
);
export const BG_TARP_R = tarp(
	'BG_TARP_R',
	[1412, 176, 1694, 410],
	[[1435, 280], [1520, 240], [1600, 212], [1655, 200], [1665, 240], [1640, 300], [1600, 345], [1540, 358], [1470, 352], [1440, 330]],
	[[1442, 286], [1652, 204]],
	-1,
	1.9,
	[[1580, 250], [1524, 380]],
);

// Two more on the right-hand stacks (2026-09-27): a small one draped over the
// corner of the near stack, and the big one torn half off the far stack at the
// plate's right edge, pinned at its low corner by a lashing chain. The left
// stack's small tarp is not done: it sits against the board's edge, under
// where the captain stands.
export const BG_TARP_R2 = tarp(
	'BG_TARP_R2',
	[1316, 490, 1462, 594],
	[[1332, 508], [1370, 503], [1410, 505], [1436, 512], [1446, 528], [1444, 548], [1430, 562], [1400, 570], [1370, 562], [1345, 552], [1332, 535]],
	[[1336, 508], [1432, 512]],
	-1,
	0.8,
	// no chain over this one: a stub far from the cloth
	[[1318, 492], [1320, 494]],
	// it hangs only ~55px: the hem starts halfway down
	24,
);
export const BG_TARP_R3 = tarp(
	'BG_TARP_R3',
	[1792, 530, 1920, 680],
	[[1828, 545], [1880, 550], [1918, 560], [1918, 662], [1880, 652], [1850, 650], [1822, 646], [1812, 620], [1820, 590]],
	[[1832, 548], [1916, 562]],
	-1,
	3.1,
	// the lashing chain that pins its low corner
	[[1824, 638], [1796, 680]],
);

// ---- base game: the mooring line ---------------------------------------------
// The ship's hawser runs from the hawse hole at (1838, 282) down across the
// hull to its knot at the bollard (1722, 598). Both ends are fast; the slack
// between them SWAYS, most at the middle, with the ship's slow roll — so the
// weight along the line is a half sine, 0 at each end. The hull under it is
// riveted and rust-streaked, so the frame hugs the rope (`hug`) and the sway
// stays a few px: a heavy wet line moving, not a skipping rope.
const ROPE_PATH: Point[] = [[1838, 284], [1826, 330], [1812, 390], [1798, 450], [1782, 500], [1764, 545], [1742, 578], [1722, 598]];
const ROPE_RECT: Rect = [1682, 262, 1872, 640];
const ROPE = polyline(ROPE_PATH, 9);
const ROPE_LEN = ROPE_PATH.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - ROPE_PATH[i][0], q[1] - ROPE_PATH[i][1]), 0);
const ROPE_LOOP = 8000;

export const BG_ROPE = patch(
	'BG_ROPE',
	'gbBgBase',
	ROPE_RECT,
	ROPE_LOOP,
	[
		{
			name: 'rope',
			parent: 'frame',
			pivot: [1790, 440],
			axis: [0, 1],
			dist: ROPE.dist,
			keep: inside(ROPE_RECT, 16, (p) => Math.sin(Math.PI * Math.max(0, Math.min(1, ROPE.along(p) / ROPE_LEN)))),
		},
	],
	(p) => ROPE.dist(p) === 0,
	{ rope: { pos: 0.5, neg: 0.5 } },
	(rig, b, t) => {
		// the roll: out and back once a loop, a smaller sway through it, and the
		// sag breathing as the line takes and gives up the strain
		b('rope').dx = 3.4 * cyc(t, ROPE_LOOP, 1) + 0.8 * cyc(t, ROPE_LOOP, 3, 0.7);
		b('rope').dy = 1.4 * cyc(t, ROPE_LOOP, 2, 1.3);
	},
	6,
	ROPE.dist,
);

// ---- hold & spin: the caged lamp -------------------------------------------------
// It hangs on a short cable from the beam at the top of the plate; the cage
// runs y 90-225 over a lit steel wall. The wall has straight lines, so the
// sway is small.
const LAMP_RECT: Rect = [440, 0, 628, 262];
const LAMP = polygon([[520, 0], [540, 0], [542, 80], [590, 110], [590, 230], [555, 238], [505, 238], [470, 225], [470, 110], [518, 80]]);
const LAMP_LOOP = 6000;

export const BG_LAMP = patch(
	'BG_LAMP',
	'gbBgHoldAndSpin',
	LAMP_RECT,
	LAMP_LOOP,
	[
		{
			name: 'lamp',
			parent: 'frame',
			pivot: [530, 0],
			axis: [0, 1],
			dist: LAMP,
			keep: inside([LAMP_RECT[0], -40, LAMP_RECT[2], LAMP_RECT[3]], 18, () => 1),
		},
	],
	(p) => LAMP(p) === 0,
	{ lamp: { pos: 1.2, neg: 1.2 } },
	(rig, b, t) => {
		b('lamp').angle = 0.8 * cyc(t, LAMP_LOOP, 2) + 0.15 * cyc(t, LAMP_LOOP, 7, 0.6);
	},
);

/** by plate key: the patches drawn over each background */
export const BG_PATCHES: Record<string, MeshWinSpec[]> = {
	gbBgBase: [BG_HOOK, BG_ROPE],
	gbBgFeature: [BG_TARP_L, BG_TARP_R, BG_TARP_R2, BG_TARP_R3],
	gbBgHoldAndSpin: [BG_LAMP],
};

// ---- hold & spin: the hold ROLLS ------------------------------------------------
// (2026-10-03) The whole hold leans with the sea: a slow roll and a little
// heave, with DEPTH — the far end of the hold (its vanishing point, at the
// back of the gangway behind the board) barely moves and the near walls,
// crates and pipes at the plate's edges move most, so it reads as a room
// rocking round the viewer rather than a picture being turned. The plate is
// drawn through a mesh for it (BgRollPlate) and every patch on it (the lamp)
// is warped by the same function at the same instant, so nothing on it
// slides against it. Plate px in, plate px out; the plate's overscan (1.14,
// Background.svelte) covers the ~12px the corners travel.
export const HOLD_ROLL_LOOP = 7600;
const HOLD_VANISH: Point = [960, 470];
export const holdRoll = (x: number, y: number, t: number): Point => {
	const p = (TAU * t) / HOLD_ROLL_LOOP;
	const deg = 0.55 * Math.sin(p) + 0.12 * Math.sin(3 * p + 1);
	const dx = x - HOLD_VANISH[0], dy = y - HOLD_VANISH[1];
	const depth = Math.min(1, Math.hypot(dx, dy) / 950) ** 1.2;
	const a = (deg * Math.PI) / 180 * depth;
	const c = Math.cos(a), s = Math.sin(a);
	return [HOLD_VANISH[0] + dx * c - dy * s, HOLD_VANISH[1] + dx * s + dy * c + 4 * depth * Math.sin(p + 0.6)];
};
