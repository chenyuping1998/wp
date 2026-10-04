/** H2 — suit thruster. The metal housing kicks forward while the exhaust
 * stretches, flutters and catches up. The luminous plume supplies the feature
 * pulse; its mesh owns only the lower-left flame, leaving the hardware solid. */
import { blob, bump, flick, polygon, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Rig, boneOf, landFlick } from './meshRig';

const T = { wind: 120, fire: 280, coast: 620, done: 1000 };
const NOZZLE: Point = [126, 151];
const AXIS: Point = [-0.71, 0.71];
const plume = polygon([[0, 256], [0, 218], [38, 158], [96, 133], [144, 146], [128, 190], [75, 240], [36, 256]]);
const along = (p: Point) => (p[0] - NOZZLE[0]) * AXIS[0] + (p[1] - NOZZLE[1]) * AXIS[1];

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	sprite: 'gbH2',
	feetY: 244,
	durationMs: T.done,
	landMs: T.coast,
	hitMs: T.fire,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 56, rows: 56 },
		soft: 5,
		parts: [
			{ name: 'housing', pivot: [170, 90], dist: (p) => Math.min(14, blob([170, 90], 80, 73, 2.5)(p)) },
			{
				name: 'plume',
				parent: 'housing',
				pivot: NOZZLE,
				axis: AXIS,
				priority: 2,
				dist: plume,
				keep: (p) => smoothstep((along(p) - 8) / 28),
			},
		],
	},
	feature: {
		test: (r, g, b) => b > 170 && g > 135 && b > r * 1.25,
		inside: (p) => p[0] < 147 && p[1] > 135,
		tint: 0xa7f5ff,
	},
	limits: { plume: { pos: 7, neg: 7 } },
	land: (rig, t, k, pose) => {
		const b = boneOf(rig, pose, 'plume');
		b.along = 1 + 0.05 * k * Math.max(0, track(t, [[0, 0], [70, 1, 'out'], [170, 0, 'out']]));
		b.angle = 2.5 * k * landFlick(t, 35);
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const fire = track(t, [[0, 0], [T.wind, -0.2, 'out'], [T.fire, 1, 'back'], [T.coast, 0.75], [880, 0, 'inOut']]);
		pose.rigid = {
			sx: 1 + 0.03 * bump(t, T.wind, T.fire + 80),
			sy: 1 - 0.025 * bump(t, T.wind, T.fire + 80),
			rot: -3 * fire + flick(t, T.coast, 2, 4),
			pop: 1 + 0.03 * Math.max(0, fire),
			dx: 5 * fire,
			dy: -4 * fire,
		};
		const b = boneOf(rig, pose, 'plume');
		b.along = 1 + 0.09 * Math.max(0, fire) * (1 - ramp(t, T.coast - 80, T.coast + 130));
		b.angle = 2.5 * flick(t, T.coast - 50, 2.2, 3.2) + 1.2 * Math.sin(t / 42) * ramp(t, T.fire - 50, T.fire + 50) * (1 - ramp(t, T.coast - 70, T.coast));
		pose.feature = 0.75 * ramp(t, 135, T.fire) * (1 - ramp(t, 700, 900));
		pose.air = 0.55 * Math.max(0, fire);
		pose.flash = 0.3 * track(t, [[T.wind, 0], [T.fire, 1, 'out'], [T.coast, 0, 'in']]);
		pose.sheen = t >= 320 && t <= 800 ? (t - 320) / 480 : -1;
		pose.plateHit = 1 + 0.03 * bump(t, T.wind, 420);
		return pose;
	},
};
