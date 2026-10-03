/** The held Super Spin coin: the frosted frame stays still while the gold
 * centre presses in, springs back and hops when another coin arrives. */
import {
	bump, circle, panelParts, restPose, smoothstep,
	type MeshWinSpec, type Point, type Pose, type Rig,
} from './meshRig';

const C: Point = [128, 128];
const distance = (p: Point) => Math.hypot(p[0] - C[0], p[1] - C[1]);
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const oscillation = (t: number, period: number) => Math.sin((2 * Math.PI * t) / period);

export type CoinEnv = {
	t: number;
	stickT: number;
	hopT: number;
	celebrateT: number;
	big: boolean;
};
export type CoinSpec = MeshWinSpec & { drive: (rig: Rig, env: CoinEnv) => Pose };

export const coinLift = (env: CoinEnv) =>
	env.hopT >= 0 ? 8 * bump(env.hopT, 0, 300) : 0;

export const coinFaceSwell = (env: CoinEnv) => {
	const stick = env.stickT >= 0 ? 0.09 * bump(env.stickT, 80, 360) : 0;
	const hop = env.hopT >= 0 ? 0.06 * bump(env.hopT, 0, 300) : 0;
	const tally = env.celebrateT >= 0 ? 0.13 * bump(env.celebrateT, 0, 420) : 0;
	const breath = env.big ? 0.02 * (0.5 - 0.5 * Math.cos(env.t / 420)) : 0;
	return stick + hop + tally + breath;
};

export const COIN: CoinSpec = (() => {
	const spec: CoinSpec = {
		symbol: 'coinP', key: 'gbP', sprite: 'gbP', mode: 'panel',
		feetY: 224, durationMs: 1400, landMs: 99999, hitMs: 99999,
		inked: (p) => distance(p) < 105,
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 32, rows: 32 },
			soft: 3,
			parts: [
				...panelParts([12, 12, 244, 244]),
				{ name: 'coin', parent: 'panel', pivot: C, axis: [0, -1],
					priority: 1, dist: circle(C, 105) },
				{ name: 'face', parent: 'coin', pivot: C, axis: [0, -1],
					priority: 2, dist: circle(C, 76),
					keep: (p) => smoothstep((82 - distance(p)) / 28) },
			],
		},
		limits: { panel: { pos: 1, neg: 1 }, coin: { pos: 1.5, neg: 1.5 }, face: { pos: 1, neg: 1 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const coin = bone(rig, pose, 'coin');
			const press = env.stickT >= 0 ? bump(env.stickT, 0, 230) : 0;
			const rebound = env.stickT >= 0 ? bump(env.stickT, 230, 470) : 0;
			coin.along = 1 - 0.065 * press + 0.025 * rebound;
			coin.across = 1 + 0.045 * press - 0.015 * rebound;
			coin.dy = -coinLift(env);
			coin.angle = env.hopT >= 0 && env.hopT < 300 ? 1.2 * oscillation(env.hopT, 300) : 0;
			const face = bone(rig, pose, 'face');
			face.along = 1 + coinFaceSwell(env);
			face.across = face.along;
			return pose;
		},
		// Gate samples a hop and tally pulse overlapping, the hardest deformation.
		pose: (rig, t) => spec.drive(rig, {
			t, stickT: t, hopT: t >= 680 ? t - 680 : -1,
			celebrateT: t >= 850 ? t - 850 : -1, big: false,
		}),
	};
	return spec;
})();
