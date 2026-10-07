/**
 * B — THE DYNAMITE, LANDING. Everything the game does is set off by this
 * symbol, and it used to land like any other tile. Now the bundle hits the
 * reel and squashes, the fuse whips on the impact with the spark flaring and
 * throwing sparks, and the bundle keeps twitching while the fuse fizzes — so
 * the board is visibly waiting for it to go off before the CHARGE even starts.
 *
 * Its win state is unreachable (the dynamite is consumed by its own blast), so
 * this runs on the LAND state instead: Symbol.svelte routes it through
 * SymbolMeshWin with no pay frame.
 *
 * PANEL mode: the spark lights the slate round it, the same wall the cut hit
 * on the fuse in design/cut_from_plate.py. The fuse and the spark move as one
 * part; the smoke wisps and the lit stone stay with the panel.
 *
 * Coordinates are the 256 canvas of Go Bananeon's b.png (the neon PULSE
 * BOMB, re-measured 2026-10-03): the steel ball (20..205, 58..242) with its
 * cap, the ribbed hose from the cap (142,46) arching over (170,12) to the
 * spark (226,72). The names still say bundle/fuse (GoBoomana's dynamite).
 */
import {
	bump,
	circle,
	flick,
	panelParts,
	polygon,
	polyline,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [12, 12, 244, 244];
const T = { hit: 50, done: 900 };

const BUNDLE = union(circle([112, 150], 90), polygon([[100, 52], [150, 40], [165, 75], [120, 86]]));
const FUSE_LINE = polyline([[142, 46], [136, 30], [148, 16], [170, 12], [192, 20], [204, 40], [214, 60]], 7);
const SPARK = circle([226, 72], 16);

export const B_LAND: MeshWinSpec = {
	symbol: 'B',
	key: 'gbB',
	sprite: 'gbB',
	mode: 'panel',
	feetY: 222,
	durationMs: T.done,
	landMs: 30,
	hitMs: T.hit,
	sparkAt: [226, 72],
	flashTint: 0xc070ff,
	inked: (p) => BUNDLE(p) === 0 || FUSE_LINE.dist(p) === 0,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'bundle',
				parent: 'panel',
				// Squashed about its MIDDLE. About its feet, a 10% squash carried
				// the knot — and the whole fuse hanging off it — 12px down, and
				// the stone above the arch folded to 0.9%.
				pivot: [112, 150],
				axis: [0, -1],
				priority: 1,
				dist: BUNDLE,
			},
			{
				name: 'fuse',
				parent: 'bundle',
				pivot: [142, 46],
				axis: [0, -1],
				priority: 4,
				dist: union(FUSE_LINE.dist, SPARK),
				// rooted in the knot, free along the rest of its length
				keep: (p) => smoothstep((FUSE_LINE.along(p) - 4) / 20),
			},
		],
	},
	// geometric (check_mesh_wins.mjs B:land --limits, 2026-09-25):
	//   bundle +3 -2.5   fuse +9.5 -8.5 (where it passes (144,27), near the frame)
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		bundle: { pos: 2, neg: 1.8 },
		fuse: { pos: 7, neg: 6.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the hit: squashed flat, rebound, settle
		const bundle = b('bundle');
		bundle.along = track(t, [[0, 1], [T.hit, 0.94, 'out'], [150, 1.025, 'out'], [260, 0.995], [360, 1]]);
		bundle.across = track(t, [[0, 1], [T.hit, 1.045, 'out'], [150, 0.99, 'out'], [260, 1.003], [360, 1]]);
		// and then it twitches, fizzing, dying down toward the blast
		const fizz = smoothstep((t - 300) / 100) * (1 - smoothstep((t - 700) / 180));
		// t is in ms: 16-40Hz, a fizz, not a hum
		bundle.dx = 0.9 * fizz * (Math.sin(t * 0.1) + 0.5 * Math.sin(t * 0.25 + 1.1));
		bundle.angle = 0.6 * fizz * Math.sin(t * 0.07 + 0.4);

		// the fuse whips on the impact and keeps quivering
		b('fuse').angle = FUSE_DEG * flick(t, T.hit - 20, 2.6, 3.4) + 1.6 * fizz * Math.sin(t * 0.09);
		// The fuse holds its height while the bundle squashes under it: carried
		// down with the knot (and shrunk as well, in the first pass) the arch
		// stretched the stone above it to 168%. A rope does not squash; it is the
		// bundle hitting the reel that does. (The knot sits 58px above the
		// bundle's pivot; the local dy is taken in the bundle's scaled frame.)
		b('fuse').dy = -((1 - bundle.along) * KNOT_ABOVE) / bundle.along;

		pose.air = 0;
		pose.flash = 0.35 * track(t, [[0, 0], [T.hit + 20, 1, 'out'], [360, 0, 'in']]);
		pose.sheen = -1;
		pose.plateHit = 1 + 0.04 * bump(t, 0, 180);
		return pose;
	},
};

// set from the measured limit
const FUSE_DEG = 5;
// the hose's root on the cap sits this far above the ball's pivot
const KNOT_ABOVE = 104;
