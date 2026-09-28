/**
 * H4 — THE ANKH. The one subject with nothing loose to hang secondary motion
 * on, so it gets the biggest body acting instead: a deep crouch with the arms
 * drooping, a HIGH hop with the arms flapping up and the loop stretching behind
 * (drag), a rock and two wing-beats at the top, a fall, and a hard squash on the
 * landing with the loop and arms following through on their springs.
 *
 * Stone should not bend, and mostly it does not: the size here is the rigid
 * hop and squash, which distort nothing. What bends is the least a cartoon
 * needs to read as alive — arms that lead and trail, a loop that lags.
 */
import {
	landFlick,
	boneOf,
	blob,
	bump,
	flick,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { crouch: 120, rise: 340, fall: 740, land: 980, done: 1450 };

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	feetY: 221,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 220,
	rig: {
		grid: { x0: 62, y0: 30, x1: 194, y1: 226, cols: 32, rows: 48 },
		soft: 4,
		parts: [
			// the collar and the middle of the crossbar: what everything hangs from
			{
				name: 'core',
				pivot: [128, 144],
				dist: (p) =>
					Math.min(14, union(polygon([[110, 116], [146, 116], [146, 150], [110, 150]]))(p)),
			},
			{
				name: 'loop',
				parent: 'core',
				pivot: [128, 116],
				axis: [0, -1],
				dist: blob([128, 77], 43, 42, 2.2),
				keep: (p) => smoothstep((116 - p[1]) / 10),
			},
			{
				name: 'arm_l',
				parent: 'core',
				pivot: [112, 129],
				axis: [-1, 0],
				dist: polygon([[66, 108], [112, 116], [112, 144], [66, 150]]),
				keep: (p) => smoothstep((112 - p[0]) / 12),
			},
			{
				name: 'arm_r',
				parent: 'core',
				pivot: [144, 129],
				axis: [1, 0],
				dist: polygon([[144, 116], [190, 108], [190, 150], [144, 144]]),
				keep: (p) => smoothstep((p[0] - 144) / 12),
			},
			{
				name: 'shaft',
				parent: 'core',
				pivot: [128, 150],
				axis: [0, 1],
				dist: polygon([[106, 150], [150, 150], [155, 224], [101, 224]]),
				keep: (p) => smoothstep((p[1] - 150) / 16),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs H4 --limits, 2026-09-25):
	//   loop +7.5 -7   arm_l +16 -17.5   arm_r +17.5 -15.5   shaft +18 -17
	limits: {
		loop: { pos: 5, neg: 5 },
		arm_l: { pos: 12, neg: 12 },
		arm_r: { pos: 12, neg: 12 },
		shaft: { pos: 8, neg: 8 },
	},
	// landing: the arms slap down and the loop squashes after the body
	land: (rig, t, k, pose) => {
		const slap = -5 * k * landFlick(t, 30);
		boneOf(rig, pose, 'arm_l').angle = slap;
		boneOf(rig, pose, 'arm_r').angle = -slap;
		boneOf(rig, pose, 'loop').along = 1 - 0.06 * k * landFlick(t, 45);
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall - 60, 1], [T.land, 0, 'in']]);
		const apex = ramp(t, T.rise - 40, T.rise + 60) * (1 - ramp(t, T.fall - 120, T.fall));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.08, 'out'], [220, 0.94, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 1.1, 'out'], [1130, 0.98], [1250, 1]]),
			sy: track(t, [[0, 1], [T.crouch, 0.86, 'out'], [220, 1.015, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 0.84, 'out'], [1130, 1.03], [1250, 1]]),
			// rocks at the top of the hop
			rot: 5 * apex * Math.sin((2 * Math.PI * (t - T.rise)) / 420),
			// The ankh is the tallest subject (y 34-221): a 14px hop with a 1.1
			// stretch put the loop over the plate's top frame bar at 220ms, and
			// 9px with 1.05 still had it touching the bar — every upward move
			// stacks at the hit (hop, stretch from the feet 183px below, pop, the
			// loop's drag, the overshoot). Measured, these keep the loop's top
			// under the bar (y 18); the shadow still says how high it is.
			pop: 1 + 0.02 * air,
			dx: 0,
			dy: -5 * air,
		};

		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// arm_l: + lifts its tip; arm_r: - lifts its tip (measured by the gate's
		// travel, and on the render)
		const droop = track(t, [[0, 0], [T.crouch, -4, 'out'], [200, 0]]);
		const flap = 8 * flick(t, 200, 2.2, 3.2);
		const beat = 5 * apex * Math.sin((2 * Math.PI * (t - T.rise)) / 240);
		const slap = -6 * flick(t, T.land, 3, 4.5);
		const lift = droop + flap + beat + slap;
		b('arm_l').angle = lift;
		b('arm_r').angle = -lift;

		// the loop drags behind the hop (long, then squashed) and follows through
		// on the landing
		const loop = b('loop');
		loop.along =
			track(t, [[0, 1], [T.crouch, 0.93, 'out'], [260, 1.03, 'out'], [T.rise + 60, 1]]) -
			0.1 * flick(t, T.land, 3, 5) +
			(t >= T.rise + 60 && t < T.land ? 0.03 * flick(t, T.rise + 60, 2, 3) : 0);
		loop.across = 1 + 0.05 * bump(t, 0, 200) + 0.06 * flick(t, T.land, 3, 5);
		loop.angle = -2 * apex * Math.sin((2 * Math.PI * (t - T.rise - 60)) / 420);

		// the shaft bends a touch on the landing, rubber for one beat
		b('shaft').angle = 2.5 * flick(t, T.land, 3.4, 6);

		pose.air = Math.max(0, Math.min(1, air));
		// pale turquoise: half strength washed it white
		pose.flash = 0.3 * track(t, [[T.crouch, 0], [220, 1, 'out'], [650, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 900 ? (t - 380) / 520 : -1;
		pose.plateHit = 1 + 0.04 * bump(t, T.crouch, 400) + 0.035 * bump(t, T.land, T.land + 160);
		return pose;
	},
};
