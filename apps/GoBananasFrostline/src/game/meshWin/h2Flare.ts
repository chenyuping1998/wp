/**
 * H2 — THE GRENADE. A straight cylinder with a lever and a PULL RING at the
 * top right. The ring is the only loose thing on it, and it is small, so this
 * symbol cannot act the way the hat does: the body has to carry the gesture.
 *
 * The acting: it rocks like a skittle — tipped off its base, caught, tipped
 * back the other way, settling — with the ring swinging on its own slower
 * clock and still going after the body has stopped. A cylinder tipping about
 * its base rim is a RIGID rotation, so all of that size is free: nothing bends
 * except the ring's own pivot.
 *
 * Geometry measured off h2_subject.png's alpha: the whole subject is only
 * x 91..173 wide against y 36..219 tall — by far the narrowest of the four —
 * with the body a plain column from y ~72 down, and the cap, lever and ring
 * above it.
 */
import {
	bump,
	circle,
	flick,
	hinge,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { wind: 140, tipA: 380, tipB: 700, settle: 980, done: 1450 };

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	feetY: 217,
	durationMs: T.done,
	landMs: T.tipB,
	hitMs: 380,
	rig: {
		grid: { x0: 78, y0: 28, x1: 186, y1: 228, cols: 24, rows: 40 },
		soft: 4,
		parts: [
			// the body: the cylinder and its base
			{
				name: 'body',
				pivot: [132, 200],
				axis: [0, -1],
				dist: (p) => Math.min(14, polygon([
					[94, 66],
					[170, 66],
					[170, 218],
					[94, 218],
				])(p)),
			},
			// the cap and lever ride the body's top; they take the wobble a beat
			// after it, which is what stops the whole thing reading as one rigid
			// picture being turned
			{
				name: 'cap',
				parent: 'body',
				pivot: [128, 74],
				axis: [0, -1],
				dist: polygon([
					[108, 36],
					[152, 36],
					[152, 76],
					[108, 76],
				]),
				keep: hinge([128, 74], 8, 16),
			},
			// THE RING. Hinged where it meets the lever, and the one part with a
			// life of its own.
			{
				name: 'ring',
				parent: 'cap',
				pivot: [150, 66],
				axis: [0.5, -0.87],
				dist: union(circle([160, 54], 15), polygon([
					[142, 60],
					[160, 44],
					[168, 52],
					[150, 70],
				])),
				priority: 3,
				keep: hinge([150, 66], 7, 14),
			},
		],
	},
	// Geometric limits from --limits; the ring ships well under its own because
	// a thin steel loop shears long before its triangles lose area.
	// Geometric (--limits): cap +12.5 -15.5, ring +21 -16.5.
	limits: {
		cap: { pos: 8, neg: 8 },
		ring: { pos: 12, neg: 12 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// THE ROCK, as a rigid rotation about the base — free of the fold budget,
		// which is why this symbol can afford to be the biggest mover of the four.
		// Wind up against the direction it is about to go, then over, back, and
		// settle in decreasing swings.
		const rock =
			track(t, [
				[0, 0],
				[T.wind, 3.5, 'out'],
				[T.tipA, -11, 'back'],
				[T.tipB, 7, 'inOut'],
				[T.settle, -2.4, 'inOut'],
				[1180, 0.8, 'inOut'],
				[1320, 0],
			]) +
			1.1 * flick(t, T.tipA, 2.6, 4);

		pose.rigid = {
			// it leans on the hit rather than hopping: a grenade stood on end does
			// not leave the ground, and a hop would read as a bounce
			sx: track(t, [
				[0, 1],
				[T.wind, 1.05, 'out'],
				[260, 0.97, 'out'],
				[T.tipA, 1],
				[T.tipB, 1.04, 'out'],
				[T.settle, 1],
			]),
			sy: track(t, [
				[0, 1],
				[T.wind, 0.93, 'out'],
				[260, 1.03, 'out'],
				[T.tipA, 1],
				[T.tipB, 0.96, 'out'],
				[T.settle, 1],
			]),
			rot: rock,
			pop: 1 + 0.025 * bump(t, T.wind, 520),
			dx: 0,
			dy: 0,
		};

		// the cap lags the body: the same curve, later and smaller
		b('cap').angle = -0.35 * rock + 1.2 * flick(t, T.tipA + 40, 3, 5);

		// THE RING swings on its hinge, opposing the body on the way over (it is
		// being left behind) and carrying on after the body has settled. It is
		// the last thing in the symbol still moving, which is what makes the end
		// of the beat read as coming to rest rather than being switched off.
		b('ring').angle =
			track(t, [
				[0, 0],
				[T.wind, -3, 'out'],
				[T.tipA + 60, 10, 'out'],
				[T.tipB + 60, -6.5, 'inOut'],
				[T.settle + 80, 3.2, 'inOut'],
			]) + 5.5 * flick(t, T.settle, 2.1, 2.6);
		// a steel loop does not stretch; it swings
		b('ring').along = 1 - 0.03 * bump(t, T.tipA, T.tipA + 200);

		pose.air = 0;
		pose.flash = 0.36 * track(t, [
			[T.wind, 0],
			[T.tipA - 40, 1, 'out'],
			[760, 0, 'in'],
		]);
		pose.sheen = t >= 420 && t <= 940 ? (t - 420) / 520 : -1;
		pose.plateHit = 1 + 0.045 * bump(t, T.wind, 420) + 0.03 * bump(t, T.tipB, T.tipB + 180);
		return pose;
	},
};
