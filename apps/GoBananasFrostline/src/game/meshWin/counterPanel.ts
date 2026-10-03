/** The snow cap of the free-spin counter flexes when the count changes.
 * The dark number well and its border stay fixed for legibility. */
import {
	bump, polygon, restPose, smoothstep,
	type MeshWinSpec, type Point, type Pose, type Rig,
} from './meshRig';

export type CounterEnv = { updateT: number; reset: boolean };
export type CounterSpec = MeshWinSpec & { drive: (rig: Rig, env: CounterEnv) => Pose };

const crown = polygon([[0, 0], [256, 0], [256, 66], [0, 66]]);
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

export const COUNTER: CounterSpec = (() => {
	const spec: CounterSpec = {
		symbol: 'fsCounter', key: 'gbFsPanel', sprite: 'gbFsPanel', mode: 'panel',
		feetY: 220, durationMs: 900, landMs: 99999, hitMs: 99999,
		inked: (p: Point) => p[1] < 66,
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 40, rows: 32 },
			soft: 4,
			parts: [
				{ name: 'frame', pivot: [128, 128], dist: () => 12 },
				{ name: 'snow', parent: 'frame', pivot: [128, 55], axis: [0, -1],
					priority: 2, dist: crown,
					keep: (p) => smoothstep((68 - p[1]) / 24) },
			],
		},
		limits: { snow: { pos: 2, neg: 2 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			if (env.updateT < 0) return pose;
			const snow = bone(rig, pose, 'snow');
			const strength = env.reset ? 1.35 : 1;
			snow.dy = strength * (-5 * bump(env.updateT, 0, 300) + 2.5 * bump(env.updateT, 300, 680));
			snow.along = 1 + strength * 0.035 * bump(env.updateT, 50, 420);
			snow.angle = strength * 0.8 * Math.sin((Math.PI * env.updateT) / 360)
				* Math.max(0, 1 - env.updateT / 720);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { updateT: t, reset: false }),
	};
	return spec;
})();
