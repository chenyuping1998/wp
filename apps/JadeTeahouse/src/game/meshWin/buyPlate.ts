/**
 * THE BUY BONUS BAMBOO PLATE (sushiUi/buybonus_plate.png and its lit copy)
 * swinging on its two ropes.
 *
 * The plate is drawn by the shared bet bar (components-ui-pixi
 * ButtonBuyBonus), which this game must not change for its own styling. So
 * the motion happens in the TEXTURE: BuyPlateMesh.svelte swaps the plate's
 * asset for a render texture of the same size and redraws it every frame
 * through this mesh. The button, its hit area and its label are untouched.
 *
 * The rope ends at the top are pinned (they are tied to something above);
 * the plate hangs from them and swings as a short pendulum, the ropes leaning
 * and bending between the pinned ends and the moving plate. A gentle sway at
 * rest, and a push on every new round.
 *
 * Rig units are the art's pixels (512 square), measured 2026-10-09: ropes from
 * y ~151 at x ~37 and ~476, plate (with its glow on the lit copy) y ~185..361.
 */
import { flick, restPose, smoothstep, type MeshWinSpec, type Pose, type Rig } from './meshRig';

export const BUY_PLATE_CANVAS: [number, number] = [512, 512];

export type BuyPlateEnv = {
	/** ms since the scene began */
	t: number;
	/** ms since the last push (a new round), or < 0 */
	pushT: number;
};
export type BuyPlateSpec = MeshWinSpec & { drive: (rig: Rig, env: BuyPlateEnv) => Pose };

const ROPE_TOP = 151;
const PLATE_TOP = 185;

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

export const BUY_PLATE = (sprite: string): BuyPlateSpec => {
	const spec: BuyPlateSpec = {
		symbol: `buyPlate:${sprite}`,
		key: sprite,
		sprite,
		mode: 'panel',
		feetY: 512,
		durationMs: 4000,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => p[1] > ROPE_TOP && p[1] < 362,
		rig: {
			canvas: BUY_PLATE_CANVAS,
			grid: { x0: 0, y0: 0, x1: 512, y1: 512, cols: 64, rows: 64 },
			soft: 8,
			parts: [
				// the pinned rope ends and the air above them
				{ name: 'hook', pivot: [256, ROPE_TOP], dist: (p) => (p[1] < ROPE_TOP + 4 ? 0 : 40) },
				{
					name: 'plate',
					parent: 'hook',
					// a pendulum hung from between the two rope tops
					pivot: [256, ROPE_TOP],
					axis: [0, 1],
					priority: 1,
					dist: (p) => (p[1] >= ROPE_TOP + 4 ? 0 : 40),
					// the ropes hand over from the pin to the plate along their length
					keep: (p) => smoothstep((p[1] - ROPE_TOP - 2) / (PLATE_TOP - ROPE_TOP)),
				},
			],
		},
		limits: { hook: { pos: 0, neg: 0 }, plate: { pos: 2.5, neg: 2.5 } },
		drive: (rig, { t, pushT }) => {
			const pose = restPose(rig);
			const fadeIn = smoothstep(t / 1500);
			const sway = SWAY_DEG * Math.sin((2 * Math.PI * t) / 3400) * fadeIn;
			const push = pushT < 0 ? 0 : PUSH_DEG * flick(pushT, 0, 1.1, 1.3);
			const plate = bone(rig, pose, 'plate');
			plate.angle = sway + push;
			// the swing lifts it a hair at each end of its arc, as a pendulum does
			plate.dy = -0.5 * Math.abs(plate.angle);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, pushT: t - 400 }),
	};
	return spec;
};

// set from the measured limits
const SWAY_DEG = 0.7;
const PUSH_DEG = 1.6;
