/** Alchemy v2: fixed plate; independently weighted painted parts perform.
 * No rigid flip, tile jump, or impact dust. Geometry follows the repaint. */
import {
	circle,
	flick,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 110, open: 260, clap: 380, open2: 560, clap2: 680, land: 900, done: 1450 };
const HINGE: Point = [143, 114];
const fromHinge = (p: Point) => Math.hypot(p[0] - HINGE[0], p[1] - HINGE[1]);

const CLAW_A = polyline([[150, 102], [168, 70], [168, 54], [184, 38], [204, 28]], 8);
const CLAW_B = polyline([[158, 110], [196, 88], [212, 72], [224, 44]], 9);
const LOOP = union(circle([68, 182], 34), polyline([[128, 130], [100, 152]], 9).dist);
const ORB = union(circle([52, 45], 25), polyline([[52, 45], [82, 76]], 11).dist);
const FOOT = circle([209, 204], 15);
const STAFF = polyline([[52, 45], [212, 207]], 13);
const ALL = union(ORB, FOOT, STAFF.dist, CLAW_A.dist, CLAW_B.dist, LOOP, polygon([[124, 104], [162, 98], [160, 134], [128, 140]]));

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	sprite: 'gbH3',
	mode: 'panel',
	inked: (p) => CLAW_A.dist(p) === 0 || CLAW_B.dist(p) === 0 || LOOP(p) === 0 || ORB(p) === 0 || FOOT(p) === 0,
	feetY: 226,
	durationMs: T.done,
	landMs: 99999,
	hitMs: T.clap,
	sparkAt: [205, 40],
	rig: {
		fixedBorder: 10,
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			// the crossing, which never comes apart: the root
			{ name: 'frame', pivot: [128, 128], dist: () => 14 },
			{ name: 'panel', parent: 'frame', pivot: [131, 125], axis: [0, -1], dist: ALL },
			{
				name: 'claw_a',
				parent: 'panel',
				pivot: HINGE,
				axis: [0.6, -1],
				priority: 3,
				dist: CLAW_A.dist,
				// the claws grow out of the hinge disc: they take over past it
				keep: (p) => smoothstep((fromHinge(p) - 14) / 16),
			},
			{
				name: 'claw_b',
				parent: 'panel',
				pivot: HINGE,
				axis: [1, -0.8],
				priority: 3,
				dist: CLAW_B.dist,
				keep: (p) => smoothstep((fromHinge(p) - 16) / 16),
			},
			{
				name: 'loop',
				parent: 'panel',
				pivot: HINGE,
				axis: [-1, 1],
				priority: 2,
				dist: LOOP,
				// nothing moves at the crossing with the staff (131,125)
				keep: (p) => smoothstep((fromHinge(p) - 44) / 22),
			},
			{
				name: 'orb',
				parent: 'panel',
				pivot: [74, 68],
				axis: [-1, -1],
				priority: 3,
				dist: ORB,
				keep: (p) => smoothstep((STAFF.along(p) < 56 ? 56 - STAFF.along(p) : 0) / 14),
			},
			{
				name: 'foot',
				parent: 'panel',
				pivot: [200, 195],
				axis: [1, 1],
				priority: 3,
				dist: FOOT,
				keep: (p) => smoothstep((STAFF.along(p) - 202) / 12),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H3 --limits, 2026-10-04) — see the gate
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		claw_a: { pos: 4, neg: 4 },
		claw_b: { pos: 4, neg: 4 },
		loop: { pos: 3, neg: 3 },
		orb: { pos: 4, neg: 4 },
		foot: { pos: 6, neg: 6 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		pose.bones[rig.bones.findIndex((x) => x.name === 'panel')].dy = track(t, [[0, 0], [260, -1.8, 'out'], [500, 0, 'out'], [680, -1.5, 'out'], [960, 0, 'out']]);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the snap: open, clap shut, open, clap, then a shiver on the landing.
		// claw_a + swings its tip toward claw_b (shut), claw_b - toward claw_a.
		const snap =
			track(t, [[0, 0], [T.crouch, 0], [T.open, -0.8, 'out'], [T.clap, CLOSE, 'in'], [T.open2, -0.65, 'out'], [T.clap2, CLOSE, 'in'], [T.clap2 + 220, 0, 'out']]) +
			0.35 * flick(t, T.clap2 + 80, 3.2, 5) + 0.4 * flick(t, T.land, 4.5, 7);
		b('claw_a').angle = CLAW_DEG * snap;
		b('claw_b').angle = -CLAW_DEG * snap;
		// the loop is the other end of the lever: it squeezes as the claws shut
		b('loop').angle = -LOOP_DEG * snap;

		// the orb charges: swells, wobbles on its collar
		const charge = track(t, [[0, 0], [T.crouch, -0.25, 'out'], [T.clap, 1, 'out'], [T.clap2, 0.55], [T.land, 0.15], [T.done - 180, 0]]);
		const live = ramp(t, T.crouch, 300) * (1 - ramp(t, T.done - 320, T.done - 180));
		const orb = b('orb');
		orb.along = 1 + 0.07 * charge;
		orb.across = 1 + 0.07 * charge;
		orb.angle = ORB_DEG * live * Math.sin((2 * Math.PI * (t - T.crouch)) / 420);
		// the foot's jewel answers a beat later
		const foot = b('foot');
		const echo = track(t, [[0, 0], [T.clap + 120, 0], [T.clap + 260, 1, 'out'], [T.clap2 + 300, 0.3], [T.done - 180, 0]]);
		foot.along = 1 + 0.14 * echo;
		foot.across = 1 + 0.14 * echo;
		foot.angle = 3.5 * flick(t, T.clap + 160, 2.6, 3.5);

		// the whole tile knocks on each clap
		b('panel').along = track(t, [[0, 1], [T.crouch, 0.985, 'out'], [T.clap, 1.008, 'out'], [T.clap + 120, 0.99], [T.clap2, 1.006, 'out'], [T.clap2 + 160, 1], [T.land - 20, 1], [T.land + 50, 0.985, 'out'], [T.done, 1, 'out']]);

		return pose;
	},
};

// set from the measured limits; CLOSE is how far past rest the clap goes
const CLAW_DEG = 2.6;
const CLOSE = 0.55;
const LOOP_DEG = 2;
const ORB_DEG = 3;
