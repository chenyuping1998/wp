/**
 * H3 — THE SHIP'S LANTERN. It is bolted to the wall, so it does not leave it:
 * a gust catches it, it rocks on its bracket and settles, and inside the glass
 * the flame flares up tall, gutters, and steadies. The flash is the lantern's
 * own green — the glass lighting up, not a gold wash over a lamp.
 *
 * The flame is small (about 14x30 canvas px) and sits inside smooth glass, so
 * it can stretch a long way: the plain green round it absorbs it.
 */
import {
	bump,
	flick,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { gust: 120, done: 1400 };

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	feetY: 222,
	durationMs: T.done,
	landMs: 1080,
	hitMs: 180,
	noDust: true,
	flashTint: 0x9dffc8,
	rig: {
		grid: { x0: 40, y0: 24, x1: 216, y1: 232, cols: 40, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'bracket', pivot: [114, 222], axis: [0, -1], dist: polygon([[88, 190], [140, 190], [140, 230], [88, 230]]) },
			{
				name: 'body',
				parent: 'bracket',
				pivot: [114, 194],
				axis: [0, -1],
				dist: polygon([[52, 52], [76, 30], [182, 30], [206, 52], [206, 182], [192, 202], [66, 202], [52, 182]]),
				// radial round the bracket's top, not a band across the lantern's width
				keep: (p) => smoothstep((Math.hypot(p[0] - 114, p[1] - 196) - 6) / 20),
			},
			{
				name: 'flame',
				parent: 'body',
				pivot: [128, 142],
				axis: [0, -1],
				priority: 6,
				// reaching up into the plain glass ABOVE the flame, fading to the
				// body by y 78: the flare stretches the flame up, and with the part
				// ending at the flame's tip that stretch ran into triangles the body
				// owned and turned 91 of them inside out
				dist: polygon([[117, 78], [139, 78], [139, 142], [117, 142]]),
				keep: (p) => smoothstep((p[1] - 76) / 30),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs --limits, 2026-09-25, on the 512 layers):
	//   body +9.5 -12 (radial round the bracket; 1.5 with a band)   flame +13 -12.5
	// The body is held well under its limit on purpose: a lantern bolted to a
	// wall that rocks 9 degrees reads as coming off the wall.
	limits: {
		body: { pos: 5.5, neg: 5.5 },
		flame: { pos: 8, neg: 8 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// the gust: rocks on the bracket, out and back, dying away — and a second,
		// smaller gust late in the hold. The review measured the lantern still
		// for its last 315ms and the least-moving of the high pays; one gust was
		// spent by the half-way point.
		// BALANCED against the helmet (2026-09-26): the review measured the hanging and
		// bolted symbols moving a quarter of what the helmet did (4.5-7.9 board px
		// against 18.8), so a line of mixed symbols read as some acting and some not.
		// They cannot hop, so the size goes into the swing, inside the measured limits.
		b('body').angle = 4.8 * flick(t, T.gust, 1.6, 2.2) + 2.2 * flick(t, 820, 2, 3);
		// the flame flares tall and narrow, gutters, and steadies, leaning
		// against the rock
		const flare = track(t, [[0, 0], [T.gust, 0], [240, 1, 'out'], [520, 0.35], [900, 0.15], [1200, 0]]);
		const gutter = ramp(t, 200, 320) * (1 - ramp(t, 1150, 1250));
		// 18%, not more: the flame's tip pushes into the glass above it, and at
		// 45% (then 32%) the plain glass there was crushed to 8% of its area. The
		// flare reads from the flash — the glass lighting up — as much as from
		// the flame's height.
		b('flame').along = 1 + 0.18 * flare + 0.06 * gutter * Math.sin((2 * Math.PI * t) / 90);
		b('flame').across = 1 - 0.12 * flare + 0.05 * gutter * Math.sin((2 * Math.PI * t) / 130);
		b('flame').angle = -3.5 * flick(t, T.gust + 40, 1.6, 2.2) - 1.6 * flick(t, 860, 2, 3) + 1.2 * gutter * Math.sin((2 * Math.PI * t) / 170);
		pose.rigid = {
			sx: 1,
			sy: 1,
			rot: 0,
			// BIGGER JUMP (2026-09-27, asked for): the rigid move carries it — it moves
			// every vertex alike, so it costs nothing against the mesh's limits.
			pop: 1 + 0.085 * track(t, [[0, 0], [T.gust, 0], [260, 1, 'out'], [700, 0.25], [1100, 0]]),
			dx: 0,
			dy: 0,
		};
		pose.flash = 0.7 * track(t, [[T.gust, 0], [220, 1, 'out'], [700, 0, 'in']]) + 0.2 * gutter * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 110));
		pose.sheen = t >= 360 && t <= 940 ? (t - 360) / 580 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.gust, 360) + 0.015 * bump(t, 1040, 1180);
		return pose;
	},
};
