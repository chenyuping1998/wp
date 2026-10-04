/** H1 — golden astronaut helmet. The visor highlight slides under the rigid
 * protective rim, the side fittings wobble on landing, and the whole helmet
 * bounces with a soft squash. The legacy bone names are retained for the mesh
 * animation data, but their regions now belong to helmet details. */
import { circle, flick, polyline, ramp, bump, restPose, smoothstep, track, type MeshWinSpec, type Rig, type Point, boneOf, landFlick } from './meshRig';

const T = { crouch: 110, rise: 300, fall: 620, land: 800, done: 1000 };
const C: Point = [126, 128];
const R = 85;
// Diagonal visor reflection, inside the protective rim.
const SLIDE: Point = [0.908, -0.42];

// Side fittings at either end of the helmet rim.
const RING_L = polyline([[56, 168], [24, 187]], 10);
const RING_R = polyline([[200, 101], [231, 80]], 8);

// A small reflected patch low on the visor twists under the larger sheen.
const STORM: Point = [128, 163];
const stormR = (p: Point) => Math.hypot((p[0] - STORM[0]) / 24, (p[1] - STORM[1]) / 16);
// Upper visor highlight travels a little ahead of the main reflection.
const northKeep = (p: Point) =>
	smoothstep((112 - p[1]) / 16) * smoothstep((82 - Math.hypot(p[0] - C[0], p[1] - C[1])) / 30);

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	sprite: 'gbH1',
	feetY: 240,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 220,
	rig: {
		// Full canvas keeps the oversized helmet and both side fittings visible.
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 64, rows: 64 },
		soft: 4,
		parts: [
			{ name: 'core', pivot: C, dist: (p) => Math.min(14, circle(C, R)(p)) },
			{
				// Visor reflection moves inside the fixed metal rim.
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
	// Side fittings wobble as the helmet lands.
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

		// A restrained slide of the visor reflection, then spring back.
		// 4.5px: 7 folded the fade band to 41% (check_mesh_wins)
		const spin = 4.5 * ramp(t, 140, 520) - 4.5 * ramp(t, 560, 900) + 0.8 * flick(t, 520, 2.2, 4);
		const surface = b('surface');
		surface.dx = spin * SLIDE[0];
		surface.dy = spin * SLIDE[1];

		// The lower reflected patch twists and unwinds.
		b('storm').angle = -18 * ramp(t, 120, 560) + 18 * ramp(t, 600, 940) - 3 * flick(t, 560, 2.4, 3.4);
		// The upper visor highlight runs ahead of the rest.
		// 1.6px: 3 folded the strip between them and the fixed rim to 40%
		const shear = 1.6 * ramp(t, 160, 520) - 1.6 * ramp(t, 580, 920);
		b('north').dx = shear * SLIDE[0];
		b('north').dy = shear * SLIDE[1];

		// The side fittings settle a beat apart.
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
