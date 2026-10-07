/**
 * H2 — THE SEA MINE. It hangs from its shackle, so it does not hop: it jolts
 * up on the hit as if something bumped it, and SWINGS from the shackle like a
 * pendulum, dying away through the hold, with a hot red flash — a mine being
 * knocked is the tense beat, not a cheerful one — and a last tug as it settles.
 *
 * The chain stays on the steel (it is the steel's own grey, and the mine hangs
 * FROM it), so the swing pivots at the top of the ball, where it meets the
 * shackle. The ball and its horns are one rigid body on the mount: the air
 * round them follows the nearest part, so a whole-ball swing costs almost
 * nothing against the fold budget.
 */
import {
	bump,
	circle,
	flick,
	polygon,
	polyline,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { hit: 120, done: 1450 };
const HORNS: Point[][] = [
	[[104, 104], [72, 68]],
	[[154, 104], [188, 68]],
	[[60, 96], [30, 84]],
	[[196, 96], [226, 84]],
	[[60, 172], [36, 192]],
	[[196, 172], [220, 192]],
	[[98, 186], [74, 222]],
	[[158, 186], [182, 222]],
	[[128, 206], [128, 234]],
];

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	// the ball's foot, for the squash; it hangs, so the shadow barely moves
	feetY: 222,
	durationMs: T.done,
	landMs: 1150,
	hitMs: 170,
	noDust: true,
	flashTint: 0xff6a3a,
	rig: {
		grid: { x0: 20, y0: 36, x1: 236, y1: 240, cols: 48, rows: 46 },
		soft: 4,
		parts: [
			{ name: 'mount', pivot: [128, 52], axis: [0, -1], dist: polygon([[108, 38], [178, 38], [178, 58], [108, 58]]) },
			{
				name: 'ball',
				parent: 'mount',
				pivot: [128, 54],
				axis: [0, 1],
				dist: union(circle([128, 135], 82), ...HORNS.map((h) => polyline(h, 10).dist)),
				// RADIAL, round the shackle: blending by height put a seam across the
				// ball's whole width at y 58-68, and a 4° swing sheared it. Only the
				// ball's crown next to the shackle needs to hand weight to the mount.
				keep: (p) => smoothstep((Math.hypot(p[0] - 128, p[1] - 54) - 8) / 18),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs --limits, 2026-09-25, on the 512 layers):
	//   ball +7 -6 (with the radial blend; 4 with the old band across it)
	limits: {
		ball: { pos: 6.5, neg: 5.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const ball = pose.bones[rig.bones.findIndex((x) => x.name === 'ball')];
		// the knock: kicked sideways, then swinging out and back, dying away
		// BALANCED against the helmet (2026-09-26): the review measured the hanging and
		// bolted symbols moving a quarter of what the helmet did (4.5-7.9 board px
		// against 18.8), so a line of mixed symbols read as some acting and some not.
		// They cannot hop, so the size goes into the swing, inside the measured limits.
		ball.angle = 6 * flick(t, T.hit, 1.25, 1.5) + 1.8 * flick(t, 1100, 2.4, 4);
		// the chain takes the jolt: a little stretch along the hang, twice
		ball.along = 1 + 0.03 * bump(t, T.hit, T.hit + 200) + 0.015 * bump(t, 1100, 1260);
		pose.rigid = {
			sx: 1,
			sy: 1,
			rot: 0,
			// BIGGER JUMP (2026-09-27, asked for): the rigid move carries it — it moves
			// every vertex alike, so it costs nothing against the mesh's limits.
			pop: 1 + 0.09 * track(t, [[0, 0], [T.hit, 0], [260, 1, 'out'], [700, 0.3], [1100, 0]]),
			dx: 0,
			dy: -9 * track(t, [[0, 0], [T.hit, 0], [230, 1, 'back'], [520, 0.2], [900, 0]]),
		};
		pose.air = 0.35 * track(t, [[0, 0], [T.hit, 0], [230, 1, 'out'], [900, 0]]);
		pose.flash = 0.6 * track(t, [[T.hit, 0], [190, 1, 'out'], [640, 0, 'in']]) + 0.25 * bump(t, 760, 1000);
		pose.sheen = t >= 320 && t <= 900 ? (t - 320) / 580 : -1;
		pose.plateHit = 1 + 0.04 * bump(t, T.hit, 360) + 0.02 * bump(t, 1100, 1240);
		return pose;
	},
};
