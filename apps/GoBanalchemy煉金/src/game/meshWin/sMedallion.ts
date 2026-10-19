/** Alchemy v2: fixed plate; independently weighted painted parts perform.
 * No rigid flip, tile jump, or impact dust. Geometry follows the repaint. */
import {
	CANVAS,
	flick,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 110, rise: 300, fall: 860, land: 1040, done: 1400 };
const C: Point = [128, 128];
const R = 123;
const radius = (p: Point) => Math.hypot(p[0] - C[0], p[1] - C[1]);

const BUNCH = polygon([[40, 104], [90, 92], [140, 70], [158, 48], [186, 52], [204, 80], [208, 120], [198, 160], [170, 184], [98, 190], [94, 176], [56, 152], [46, 138]]);
const UPPER = polygon([[40, 100], [100, 88], [150, 58], [168, 62], [160, 84], [120, 108], [60, 124], [42, 120]]);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	sprite: 'gbS',
	mode: 'panel',
	inked: (p) => BUNCH(p) === 0,
	feetY: 250,
	durationMs: T.done,
	landMs: 99999,
	hitMs: 220,
	sparkAt: [128, 110],
	rig: {
		fixedBorder: 10,
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{
				// the air round the seal: nailed down
				name: 'frame',
				pivot: [CANVAS / 2, CANVAS / 2],
				dist: (p) => Math.max(0, Math.min(14, R + 18 - radius(p))),
			},
			{
				name: 'medal',
				parent: 'frame',
				pivot: C,
				axis: [0, -1],
				dist: (p) => Math.max(0, radius(p) - R),
				// fades out in the AIR past the rim, so the turn shears nothing drawn
				keep: (p) => smoothstep((R + 17 - radius(p)) / 14),
			},
			{
				name: 'bunch',
				parent: 'medal',
				pivot: [124, 136],
				axis: [0, -1],
				priority: 2,
				dist: BUNCH,
				// held inside the inner rim
				keep: (p) => smoothstep((100 - radius(p)) / 14),
			},
			{
				name: 'upper',
				parent: 'bunch',
				// the top banana fans from where the bunch is joined at the stem
				pivot: [165, 70],
				axis: [-1, 0.35],
				priority: 4,
				dist: UPPER,
				keep: (p) => smoothstep((160 - p[0]) / 30),
			},
		],
	},
	// geometric (check_mesh_wins.mjs S --limits, 2026-10-04) — see the gate
	limits: {
		medal: { pos: 4.5, neg: 4.5 },
		bunch: { pos: 3, neg: 3 },
		upper: { pos: 3, neg: 3 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the seal rocks like a coin set down on its edge: a wobble that
		// quickens as it dies, and a knock on the landing
		const medal = b('medal');
		const wob = ramp(t, T.crouch, T.rise) * Math.exp(-Math.max(0, t - T.rise) / 520);
		const phase = (2 * Math.PI * Math.max(0, t - T.crouch)) / 300 + Math.max(0, t - T.crouch) ** 2 / 400000;
		medal.angle = 0;
		medal.along = 1;
		medal.across = 1;

		// the bunch hops inside the ring and hangs there, bobbing
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const hover = ramp(t, 260, 400) * (1 - ramp(t, T.fall - 100, T.fall));
		const bunch = b('bunch');
		bunch.dy = -HOP * air - 1.4 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 520);
		bunch.along = track(t, [[0, 1], [T.crouch, 0.95, 'out'], [220, 1.03, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.95, 'out'], [1200, 1.01], [1300, 1]]);
		bunch.across = track(t, [[0, 1], [T.crouch, 1.04, 'out'], [220, 0.98, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 1.04, 'out'], [1300, 1]]);
		bunch.angle = TILT_DEG * flick(t, 280, 1.3, 1.6) - 0.7 * TILT_DEG * flick(t, T.land, 2.4, 4);
		// the top banana fans open and closes
		b('upper').angle = FAN_DEG * Math.max(0, flick(t, 360, 1.5, 2.2)) - 0.6 * FAN_DEG * Math.max(0, flick(t, T.land, 2.6, 4));

		return pose;
	},
};

// set from the measured limits
const ROCK_DEG = 4;
const HOP = 3;
const TILT_DEG = 1.5;
const FAN_DEG = 2;
