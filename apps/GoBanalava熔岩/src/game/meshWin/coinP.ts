/**
 * P — THE HOLD-AND-SPIN COIN, HELD ON THE BOARD, as a mesh (StickyPrizes.svelte).
 *
 * The coin is what the whole hold-and-spin is about, and a held one was a flat
 * sprite that popped in with a scale bounce and then sat there. Now it has a
 * body:
 *
 *   · STICK   when it lands and sticks, the coin is pressed into its plate —
 *             squashed, the face domed up, and it springs back
 *   · HOP     every time a new coin lands (the respins reset), the coins
 *             already held hop on their plates, in a wave from the new one
 *   · BIG     a high-value coin never quite sits still: its face breathes,
 *             domed a little and settling, so the big ones read as alive
 *
 * The face (inside the rope rim) is its own part and swells MORE than the rim,
 * which is what makes it read as a domed coin rather than a flat disc scaled.
 *
 * PANEL mode: the riveted plate is the frame and never moves. Coordinates are
 * the 256 canvas of p.png (2026-09-28): coin centre (128,128), outer edge r 94,
 * rope rim r 70..94, face r < 68.
 */
import {
	bump,
	circle,
	flick,
	panelParts,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [12, 12, 244, 244];
const C: Point = [128, 128];

export type CoinEnv = {
	/** ms on a shared clock (the big coins' breath) */
	t: number;
	/** ms since this coin stuck, or < 0 */
	stickT: number;
	/** ms since the held coins were told to hop, or < 0 */
	hopT: number;
	/** a high-value coin */
	big: boolean;
};

export type CoinSpec = MeshWinSpec & { drive: (rig: Rig, env: CoinEnv) => Pose };

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const dist = (p: Point) => Math.hypot(p[0] - C[0], p[1] - C[1]);

/** how much the face swells this frame — the prize text on top takes it too */
export const coinFaceSwell = (env: CoinEnv) =>
	(env.stickT >= 0 ? 0.1 * Math.max(0, flick(env.stickT, 40, 3.2, 6)) : 0) +
	(env.hopT >= 0 ? 0.05 * bump(env.hopT, 0, 260) : 0) +
	(env.big ? 0.025 * 0.5 * (1 - Math.cos(env.t / 480)) : 0);

/** how far the coin lifts off its plate this frame, rig units (up) */
export const coinLift = (env: CoinEnv) => (env.hopT >= 0 ? 5 * bump(env.hopT, 0, 260) : 0);

export const COIN: CoinSpec = (() => {
	const spec: CoinSpec = {
		symbol: 'coinP',
		key: 'gbP',
		sprite: 'gbP',
		mode: 'panel',
		feetY: 222,
		durationMs: 1400,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => dist(p) < 94,
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
			soft: 3,
			parts: [
				...panelParts(INNER),
				{
					name: 'coin',
					parent: 'panel',
					pivot: C,
					axis: [0, -1],
					priority: 1,
					dist: circle(C, 94),
				},
				{
					name: 'face',
					parent: 'coin',
					pivot: C,
					axis: [0, -1],
					priority: 2,
					dist: circle(C, 68),
					// the dome: full at the centre, handed back to the rim toward the rope
					keep: (p) => smoothstep((72 - dist(p)) / 26),
				},
			],
		},
		limits: { panel: { pos: 0.5, neg: 0.5 }, coin: { pos: 1, neg: 1 }, face: { pos: 1, neg: 1 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const coin = bone(rig, pose, 'coin');
			// pressed in when it sticks: flat, then springing back up
			const press = env.stickT >= 0 ? flick(env.stickT, 0, 3.2, 6) : 0;
			coin.along = 1 - 0.06 * Math.max(0, press) + 0.03 * Math.max(0, -press);
			coin.across = 1 + 0.04 * Math.max(0, press);
			coin.dy = -coinLift(env);
			const face = bone(rig, pose, 'face');
			const swell = coinFaceSwell(env);
			face.along = 1 + swell;
			face.across = 1 + swell;
			return pose;
		},
		// for the gate: sticks at 0, hops at 700, and it is a big one
		pose: (rig, t) => spec.drive(rig, { t, stickT: t, hopT: t >= 700 ? t - 700 : -1, big: true }),
	};
	return spec;
})();
