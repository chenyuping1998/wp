/**
 * S — THE GOLDEN BANANAS. Three bananas tied at the stems with a red cord bow.
 *
 * The bunch hops off the slate and FANS: the three bananas spread from the knot
 * like a hand opening — the left one out to the left, the right one out to the
 * right, the middle one dipping — then gather again on the landing, while the
 * bow's loops and the cord ends flap after the hop.
 *
 * The bananas TOUCH along their length, so they cannot each take a big turn
 * (Bubis's lesson: separate hops tore the banana lying between two bunches).
 * The group bone `bunch` carries the move; each banana adds only a couple of
 * degrees round the knot, and the spread is mostly LENGTH — a banana reaching
 * out along itself.
 */
import {
	bump,
	circle,
	flick,
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 120, launch: 230, top: 470, land: 880, done: 1400 };
const KNOT: Point = [150, 64];
const fromKnot = (p: Point) => Math.hypot(p[0] - KNOT[0], p[1] - KNOT[1]);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	feetY: 228,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.launch,
	flashTint: 0xffe066,
	rig: {
		grid: { x0: 0, y0: 0, x1: 252, y1: 244, cols: 50, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'knot', pivot: KNOT, axis: [0, -1], dist: circle(KNOT, 20) },
			{
				name: 'bow',
				parent: 'knot',
				pivot: KNOT,
				axis: [-1, 0.6],
				priority: 2,
				dist: polygon([[84, 76], [116, 52], [146, 48], [146, 80], [130, 100], [92, 98]]),
				keep: (p) => smoothstep((fromKnot(p) - 14) / 16),
			},
			{
				name: 'ends',
				parent: 'knot',
				pivot: KNOT,
				axis: [0.5, 1],
				priority: 2,
				dist: polygon([[154, 50], [184, 50], [188, 80], [188, 108], [124, 108], [128, 84]]),
				keep: (p) => smoothstep((fromKnot(p) - 16) / 16),
			},
			{
				name: 'banana_l',
				parent: 'knot',
				pivot: KNOT,
				axis: [-1, 0.5],
				dist: polygon([[4, 108], [60, 98], [118, 86], [124, 120], [100, 150], [56, 168], [12, 160]]),
				keep: (p) => smoothstep((fromKnot(p) - 26) / 30),
			},
			{
				name: 'banana_m',
				parent: 'knot',
				pivot: KNOT,
				axis: [-0.45, 1],
				dist: polygon([[128, 96], [174, 92], [176, 150], [150, 196], [104, 216], [44, 214], [40, 186], [96, 170], [118, 140]]),
				keep: (p) => smoothstep((fromKnot(p) - 26) / 30),
			},
			{
				name: 'banana_r',
				parent: 'knot',
				pivot: KNOT,
				axis: [0.4, 1],
				dist: polygon([[176, 64], [212, 88], [240, 140], [238, 200], [222, 230], [160, 228], [190, 190], [190, 130], [176, 100]]),
				keep: (p) => smoothstep((fromKnot(p) - 26) / 30),
			},
		],
	},
	// Geometric (--limits, 2026-10-04): bow +9 -7.5, ends +13.5 -14, and the
	// bananas only +-2 each: they touch along their length, as expected
	limits: {
		bow: { pos: 7, neg: 7 },
		ends: { pos: 11, neg: 11 },
		banana_l: { pos: 1.8, neg: 1.8 },
		banana_m: { pos: 1.8, neg: 1.8 },
		banana_r: { pos: 1.8, neg: 1.8 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const spread = bump(t, T.crouch, T.land - 80) + 0.4 * flick(t, T.land, 3, 4);
		// + is clockwise: the left banana's tip goes OUT (down-left) for -, the right's for -
		b('banana_l').angle = -1.2 * spread;
		b('banana_l').along = 1 + 0.02 * Math.max(0, spread);
		b('banana_m').angle = 0.6 * spread;
		b('banana_m').along = 1 + 0.015 * Math.max(0, spread);
		b('banana_r').angle = -0.95 * spread;
		b('banana_r').along = 1 + 0.02 * Math.max(0, spread);
		// the bow's loops and the cord ends flap after the hop
		b('bow').angle = 6 * flick(t, T.launch, 2.6, 2.6) - 4 * flick(t, T.land, 3, 3.4);
		b('ends').angle = -7 * flick(t, T.launch + 50, 2.4, 2.4) + 3.5 * flick(t, T.land + 40, 2.8, 3.2);
		pose.flash = 0.5 * bump(t, T.crouch, 520) + 0.3 * bump(t, T.land, T.land + 220);
		pose.sheen = t >= 360 && t <= 980 ? (t - 360) / 620 : -1;
		return pose;
	},
};
