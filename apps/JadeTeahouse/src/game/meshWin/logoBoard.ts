/**
 * THE INTRO'S SIGNBOARD (sushiV8/logo_board.png): the little lantern painted
 * in its right-hand panel swings on its hook, its red tassel a beat behind.
 *
 * It is the only thing on the board that hangs — the cup sits, the knobs under
 * the posts are the posts' own finials — so it is the only thing that moves.
 * The panel's plain paper round it takes the stretch; the board as a whole
 * still sways in FeatureIntro as before.
 *
 * Rig units are the art's pixels (1600 x 600), traced 2026-10-09: hook
 * (1248, 348), body x 1209..1285 y 357..422, tassel x 1235..1262 to y ~465.
 */
import { flick, polygon, restPose, smoothstep, type MeshWinSpec, type Pose, type Rig } from './meshRig';

export const LOGO_CANVAS: [number, number] = [1600, 600];

export type LogoEnv = { /** ms since the intro appeared */ t: number };
export type LogoSpec = MeshWinSpec & { drive: (rig: Rig, env: LogoEnv) => Pose };

const HOOK: [number, number] = [1248, 346];
const LANTERN = polygon([[1240, 344], [1256, 344], [1262, 356], [1286, 372], [1290, 404], [1270, 424], [1258, 426], [1264, 452], [1262, 468], [1234, 468], [1232, 452], [1238, 426], [1226, 424], [1206, 404], [1210, 372], [1234, 356]]);
const TASSEL = polygon([[1238, 424], [1258, 424], [1266, 452], [1264, 470], [1232, 470], [1230, 452]]);

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

export const LOGO_BOARD: LogoSpec = {
	symbol: 'logoBoard',
	key: 'v8LogoBoard',
	sprite: 'v8LogoBoard',
	mode: 'panel',
	feetY: 600,
	durationMs: 4000,
	landMs: 99999,
	hitMs: 99999,
	inked: (p) => LANTERN(p) === 0,
	rig: {
		canvas: LOGO_CANVAS,
		grid: { x0: 0, y0: 0, x1: 1600, y1: 600, cols: 320, rows: 120 },
		soft: 4,
		parts: [
			{ name: 'board', pivot: [800, 300], dist: () => 12 },
			{
				name: 'lantern',
				parent: 'board',
				pivot: HOOK,
				axis: [0, 1],
				priority: 1,
				dist: LANTERN,
				// the hook stays on the board
				keep: (p) => smoothstep((p[1] - HOOK[1] - 2) / 10),
			},
			{
				name: 'tassel',
				parent: 'lantern',
				pivot: [1248, 424],
				axis: [0, 1],
				priority: 2,
				dist: TASSEL,
				keep: (p) => smoothstep((p[1] - 426) / 8),
			},
		],
	},
	limits: { board: { pos: 0, neg: 0 }, lantern: { pos: 9, neg: 9 }, tassel: { pos: 16, neg: 16 } },
	drive: (rig, { t }) => {
		const pose = restPose(rig);
		const fadeIn = smoothstep(t / 900);
		// nudged as the intro appears, then a slow swing that never quite stops
		const swing = SWING_DEG * (0.8 * flick(t, 200, 0.9, 1.1) + 0.45 * Math.sin((2 * Math.PI * t) / 2600) * fadeIn);
		bone(rig, pose, 'lantern').angle = swing;
		bone(rig, pose, 'tassel').angle = -TASSEL_DEG * (0.8 * flick(t, 380, 0.9, 1.1) + 0.45 * Math.sin((2 * Math.PI * (t - 450)) / 2600) * fadeIn);
		return pose;
	},
	pose: (rig, t) => LOGO_BOARD.drive(rig, { t }),
};

// set from the measured limits
const SWING_DEG = 7;
const TASSEL_DEG = 12;
