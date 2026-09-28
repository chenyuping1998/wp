/**
 * H1 — THE RINGED PLANET. A ball has nothing loose to hang secondary motion on,
 * so two things carry it:
 *
 *   - a SPIN. The surface inside the rim slides along the bands while the rim
 *     itself stays put, so the storm and the stripes travel across the face the
 *     way a turning planet's do. The slide runs along the ring's own direction:
 *     the bands and the ring's front arc both lie in the equator, so a slide
 *     along them keeps the ring straight instead of kinking it.
 *   - a jelly BOUNCE, all rigid: a squash, a pop off the cell, a wobble at the
 *     top and a squash on the way back, with the ring's two free tips flapping
 *     after it on springs.
 */
import { circle, flick, polyline, ramp, bump, restPose, smoothstep, track, type MeshWinSpec, type Rig, type Point, boneOf, landFlick } from './meshRig';

const T = { crouch: 110, rise: 300, fall: 620, land: 800, done: 1000 };
const C: Point = [126, 128];
const R = 85;
// the slide direction: along the ring, left-low to right-high
const SLIDE: Point = [0.908, -0.42];

// from where each tip leaves the disc to its end (the disc's rim is at x 52 on
// the left and x 200 on the right at these heights)
const RING_L = polyline([[56, 168], [24, 187]], 10);
const RING_R = polyline([[200, 101], [231, 80]], 8);

// THE STORM: the spiral under the ring's front arc (the drawing's great red
// spot), an ellipse ~22x15 round (128,163). Rotating it with its weight fading
// toward its edge is a TWIST — the middle turns further than the rim — which is
// what a vortex looks like.
const STORM: Point = [128, 163];
const stormR = (p: Point) => Math.hypot((p[0] - STORM[0]) / 24, (p[1] - STORM[1]) / 16);
// THE NORTHERN BANDS (above the bright equator, y < ~112) slide further than
// the rest while it spins: a planet's latitudes turn at different speeds, and
// bands shearing past each other is the tell that it is a ball of gas.
// Its weight fades toward the rim on the SAME curve as the surface's own keep:
// a child's kept weight rides its parent's whole move, so a band that faded on
// a curve of its own tore a cliff against the rim (15% at (170,86)).
const northKeep = (p: Point) =>
	smoothstep((112 - p[1]) / 16) * smoothstep((82 - Math.hypot(p[0] - C[0], p[1] - C[1])) / 30);

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	sprite: 'gbH1',
	feetY: 214,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 220,
	rig: {
		// finer than the others: the ring's free tips are only ~30x10px each, and
		// at 4.4px a cell the left one owned 11 inked vertices (the gate wants 12)
		grid: { x0: 22, y0: 36, x1: 234, y1: 220, cols: 60, rows: 52 },
		soft: 4,
		parts: [
			{ name: 'core', pivot: C, dist: (p) => Math.min(14, circle(C, R)(p)) },
			{
				// the face inside the rim: fully free at 52px from the centre, handing
				// back to the rim by 82
				name: 'surface',
				parent: 'core',
				pivot: C,
				axis: SLIDE,
				priority: 2,
				dist: circle(C, 54),
				keep: (p) => smoothstep((82 - Math.hypot(p[0] - C[0], p[1] - C[1])) / 30),
			},
			{
				name: 'ring_l',
				parent: 'core',
				pivot: [56, 168],
				axis: [-32, 19],
				priority: 3,
				dist: RING_L.dist,
				keep: (p) => smoothstep((RING_L.along(p) - 2) / 10),
			},
			{
				name: 'ring_r',
				parent: 'core',
				pivot: [200, 101],
				axis: [31, -21],
				priority: 3,
				dist: RING_R.dist,
				keep: (p) => smoothstep((RING_R.along(p) - 2) / 10),
			},
			{
				name: 'storm',
				parent: 'surface',
				pivot: STORM,
				priority: 4,
				dist: (p) => Math.max(0, stormR(p) - 1) * 16,
				keep: (p) => smoothstep((1.05 - stormR(p)) / 0.75),
			},
			{
				name: 'north',
				parent: 'surface',
				pivot: [C[0], 90],
				axis: SLIDE,
				priority: 3,
				// it only claims where the surface does
				dist: (p) => Math.max(circle(C, 54)(p), Math.max(0, p[1] - 112)),
				keep: northKeep,
			},
		],
	},
	// geometric (check_mesh_wins.mjs H1 --limits, before the tips were lengthened):
	//   ring_l +33.5 -20.5   ring_r +16 -13
	limits: {
		surface: { pos: 0.5, neg: 0.5 },
		ring_l: { pos: 8, neg: 8 },
		ring_r: { pos: 8, neg: 8 },
		storm: { pos: 24, neg: 24 },
		north: { pos: 0.5, neg: 0.5 },
	},
	// landing: the ring's free tips flap as the planet hits
	land: (rig, t, k, pose) => {
		const f = 4 * k * landFlick(t);
		boneOf(rig, pose, 'ring_l').angle = -f;
		boneOf(rig, pose, 'ring_r').angle = f;
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const top = ramp(t, T.rise - 40, T.rise + 60) * (1 - ramp(t, T.fall - 100, T.fall));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.07, 'out'], [210, 0.95, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 1.08, 'out'], [920, 0.985], [T.done, 1]]),
			sy: track(t, [[0, 1], [T.crouch, 0.9, 'out'], [210, 1.04, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 0.9, 'out'], [920, 1.015], [T.done, 1]]),
			// a lazy wobble at the top, like something floating
			rot: 4 * top * Math.sin((2 * Math.PI * (t - T.rise)) / 380),
			pop: 1 + 0.03 * air,
			dx: 0,
			dy: -7 * air,
		};

		// the spin: out along the bands and most of the way back, on a spring
		// 4.5px: 7 folded the fade band to 41% (check_mesh_wins)
		const spin = 4.5 * ramp(t, 140, 520) - 4.5 * ramp(t, 560, 900) + 0.8 * flick(t, 520, 2.2, 4);
		const surface = b('surface');
		surface.dx = spin * SLIDE[0];
		surface.dy = spin * SLIDE[1];

		// the storm winds up as the planet spins and unwinds after — twisting the
		// same way the bands slide (- is anticlockwise on screen)
		b('storm').angle = -18 * ramp(t, 120, 560) + 18 * ramp(t, 600, 940) - 3 * flick(t, 560, 2.4, 3.4);
		// the northern bands run ahead of the rest
		// 1.6px: 3 folded the strip between them and the fixed rim to 40%
		const shear = 1.6 * ramp(t, 160, 520) - 1.6 * ramp(t, 580, 920);
		b('north').dx = shear * SLIDE[0];
		b('north').dy = shear * SLIDE[1];

		// the tips trail the bounce: down when it rises, up when it lands — and
		// the right tip a beat after the left, so the flap RUNS round the ring as a
		// wave instead of both ends flapping as one
		const flapAt = (lag: number) => 6 * flick(t, T.crouch + 40 + lag, 2.4, 3) - 5 * flick(t, T.land + lag, 3, 4.5);
		b('ring_l').angle = -flapAt(0);
		b('ring_r').angle = flapAt(130);

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.32 * track(t, [[T.crouch, 0], [220, 1, 'out'], [580, 0, 'in']]);
		pose.sheen = t >= 340 && t <= 800 ? (t - 340) / 460 : -1;
		pose.plateHit = 1 + 0.03 * bump(t, T.crouch, 380) + 0.02 * bump(t, T.land, T.land + 150);
		return pose;
	},
};
