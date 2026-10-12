/**
 * H3 — THE SMOKE BOMB. A black-purple iron ball with a shuriken crest, a
 * capped neck with its rope fuse, and violet smoke already pouring off it in
 * three billows — round the left, over the top, down the right.
 *
 * It is a bomb about to go, so its act is a COUNTDOWN: the ball swells and
 * snaps back on three quickening beats (the fuse jerking with each), and the
 * smoke does not hop with it — it BILLOWS, each mass breathing outward on its
 * own slower curve, the way smoke lags whatever pushed it. leaps.ts gives the
 * whole thing a wobbling hop on the last beat.
 *
 * The ball is the root and only scales (a swell is cheap: every triangle in it
 * grows alike); the billows are children that rotate a little about where they
 * leave the ball and stretch along their reach.
 */
import {
	bump,
	circle,
	flick,
	polygon,
	polyline,
	restPose,
	smoothstep,
	union,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

// the leap (leaps.ts) runs 330ms late, after the countdown: launch 560, land 1230
const T = { beat1: 120, beat2: 330, beat3: 500, launch: 560, land: 1230, done: 1750 };
const BALL: Point = [132, 152];
const BALL_R = 70;
const offBall = (p: Point) => Math.hypot(p[0] - BALL[0], p[1] - BALL[1]) - BALL_R;
const FUSE = polyline([[176, 72], [196, 56], [210, 46]], 12);

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	feetY: 224,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.beat3,
	flashTint: 0xd07dff,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 244, cols: 52, rows: 50 },
		soft: 5,
		parts: [
			{ name: 'ball', pivot: [BALL[0], 224], axis: [0, -1], dist: union(circle(BALL, BALL_R), polygon([[140, 70], [180, 58], [198, 88], [170, 112], [144, 104]])) },
			{
				name: 'fuse',
				parent: 'ball',
				pivot: [178, 70],
				axis: [1, -0.6],
				priority: 2,
				dist: FUSE.dist,
				keep: (p) => smoothstep((FUSE.along(p) - 2) / 12),
			},
			{
				name: 'smoke_l',
				parent: 'ball',
				pivot: [70, 140],
				axis: [-1, 0],
				dist: polygon([[2, 60], [70, 60], [76, 210], [10, 200], [2, 140]]),
				keep: (p) => smoothstep((offBall(p) - 2) / 18),
			},
			{
				name: 'smoke_t',
				parent: 'ball',
				pivot: [110, 82],
				axis: [0, -1],
				dist: polygon([[20, 8], [220, 8], [228, 54], [184, 56], [140, 72], [90, 84], [62, 72], [20, 58]]),
				keep: (p) => smoothstep((offBall(p) - 2) / 18),
			},
			{
				name: 'smoke_r',
				parent: 'ball',
				pivot: [200, 150],
				axis: [1, 0.2],
				dist: polygon([[200, 64], [246, 70], [250, 210], [210, 214], [198, 150]]),
				keep: (p) => smoothstep((offBall(p) - 2) / 18),
			},
		],
	},
	// Geometric (--limits, 2026-10-04): fuse +14 -15, smoke_l +6.5 -5.5,
	// smoke_t +4.5 -5, smoke_r +5 -6
	limits: {
		fuse: { pos: 11, neg: 11 },
		smoke_l: { pos: 4.5, neg: 4.5 },
		smoke_t: { pos: 3.8, neg: 3.8 },
		smoke_r: { pos: 4.5, neg: 4.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// the countdown: three swells, each quicker and bigger than the last
		const beat = (t0: number, ms: number, k: number) => k * bump(t, t0, t0 + ms);
		const swell = beat(T.beat1, 170, 0.05) + beat(T.beat2, 140, 0.065) + beat(T.beat3, 110, 0.08);
		const ball = b('ball');
		ball.along = 1 + swell;
		ball.across = 1 + swell * 1.1;
		// the fuse jerks on every beat and hisses (a fast small shiver) between
		b('fuse').angle =
			-6 * (flick(t, T.beat1, 4, 6) + flick(t, T.beat2, 4.5, 6) + flick(t, T.beat3, 5, 6)) +
			1.2 * Math.sin(t / 19) * smoothstep(t / 120) * (1 - smoothstep((t - 1450) / 200));
		// the smoke billows: slow, out of phase, swelling outward
		const roll = (lag: number, hz: number) => Math.sin((2 * Math.PI * hz * (t - lag)) / 1000) * smoothstep((t - lag) / 220) * (1 - smoothstep((t - 1460) / 220));
		const heave = 0.5 * bump(t, T.beat1, 900) + 0.4 * bump(t, T.land - 60, T.land + 360);
		b('smoke_l').angle = -2.4 * roll(60, 1.6) - 1.2 * heave;
		b('smoke_l').along = 1 + 0.07 * heave + 0.02 * roll(200, 2.1);
		b('smoke_t').angle = 2.2 * roll(140, 1.4);
		b('smoke_t').along = 1 + 0.08 * heave + 0.02 * roll(260, 1.9);
		b('smoke_r').angle = 2.4 * roll(100, 1.7) + 1.2 * heave;
		b('smoke_r').along = 1 + 0.07 * heave + 0.02 * roll(320, 2.3);
		pose.flash = 0.35 * bump(t, T.beat1, T.beat1 + 170) + 0.45 * bump(t, T.beat2, T.beat2 + 140) + 0.6 * bump(t, T.beat3, T.beat3 + 160);
		pose.sheen = t >= 640 && t <= 1240 ? (t - 640) / 600 : -1;
		return pose;
	},
};
