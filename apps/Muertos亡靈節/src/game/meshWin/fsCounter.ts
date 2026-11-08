/**
 * THE FREE-SPIN COUNTER PANEL (gbFsPanel), as a mesh.
 *
 * It used to be a still plate with numbers changing on it. Now it answers
 * the game:
 *
 *   · every spin used up: a small knock — the plate gives a little, and the
 *     dynamite icon at its top hops and rocks
 *   · a RETRIGGER (the total goes up): the plate bulges out like something
 *     went off behind it, wobbles back, and the icon jumps
 *   · a rung up the blast ladder: the icon shudders, fuse and all
 *
 * The title, the count and the ladder are drawn on top (FreeSpinCounter.svelte),
 * not through the mesh, so they are kept on the plate by the same scale the
 * plate takes about its centre (`counterPlateScale`). The icon is the only
 * thing that moves on its own.
 *
 * Rig units are a 256 x 193.2 canvas over the 1280 x 966 art. Measured on
 * fs_counter_panel.png, 2026-09-26.
 */
import {
	bump,
	flick,
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

export const COUNTER_CANVAS: [number, number] = [256, 966 * (256 / 1280)];

export type CounterEnv = {
	/** ms since a spin was used up, or < 0 */
	spinT: number;
	/** ms since a retrigger, or < 0 */
	retrigT: number;
	/** ms since the blast ladder went up a rung, or < 0 */
	levelT: number;
};

export type CounterSpec = MeshWinSpec & { drive: (rig: Rig, env: CounterEnv) => Pose };

const PLATE: Rect = [8, 16, 248, 178];
export const PLATE_CENTRE: Point = [128, 97];
// the little bundle of dynamite printed at the top of the plate, with its fuse
// and spark; its influence reaches out round it so a hop has room to push into —
// but NOT up into the plate's white rim (y 18..25), which a hop dented
const ICON: Rect = [108, 31, 147, 51];
const ICON_OUT: Rect = [88, 27, 168, 68];
const rect = (r: Rect) => polygon([[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]);
const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const kick = (t: number, hz: number, decay: number) => (t >= 0 ? flick(t, 0, hz, decay) : 0);

export const COUNTER: CounterSpec = (() => {
	const spec: CounterSpec = {
		symbol: 'fsCounter',
		key: 'gbFsPanel',
		sprite: 'gbFsPanel',
		mode: 'panel',
		feetY: PLATE[3],
		durationMs: 2400,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => depthIn(PLATE, p) > 0,
		rig: {
			canvas: COUNTER_CANVAS,
			grid: { x0: 0, y0: 0, x1: 256, y1: COUNTER_CANVAS[1], cols: 64, rows: 48 },
			soft: 2.5,
			parts: [
				{ name: 'frame', pivot: [128, 97], dist: () => 10 },
				{ name: 'plate', parent: 'frame', pivot: PLATE_CENTRE, axis: [0, -1], dist: rect(PLATE) },
				{
					name: 'icon',
					parent: 'plate',
					// pivoted at its TOP: the swell and the rock then push down into
					// the plate, where there is room, not up into the rim
					pivot: [127, 32],
					axis: [0, -1],
					priority: 3,
					dist: rect(ICON),
					keep: (p) => smoothstep(depthIn(ICON_OUT, p) / 6),
				},
			],
		},
		// geometric (check_mesh_wins.mjs fsCounter --limits, 2026-09-26)
		limits: { plate: { pos: 1, neg: 1 }, icon: { pos: 9, neg: 9 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			const plate = bone(rig, pose, 'plate');
			const spin = kick(env.spinT, 5, 9);
			const re = kick(env.retrigT, 3.4, 4.5);
			const reBulge = env.retrigT >= 0 ? bump(env.retrigT, 0, 220) : 0;
			const s = plateScale(env);
			plate.along = s[1];
			plate.across = s[0];
			plate.angle = 0.6 * re;

			const icon = bone(rig, pose, 'icon');
			const lvl = kick(env.levelT, 9, 6);
			icon.dy = -1 * (env.spinT >= 0 ? bump(env.spinT, 0, 200) : 0) - 1.2 * reBulge;
			icon.angle = 6 * spin + 7 * lvl + 4 * re;
			const pop = 0.1 * reBulge + 0.06 * (env.levelT >= 0 ? bump(env.levelT, 0, 160) : 0);
			icon.along = 1 + pop;
			icon.across = 1 + pop;
			return pose;
		},
		// for the gate: a spin at 0, a retrigger at 700, a rung at 1500
		pose: (rig, t) => spec.drive(rig, { spinT: t, retrigT: t - 700 >= 0 ? t - 700 : -1, levelT: t - 1500 >= 0 ? t - 1500 : -1 }),
	};
	return spec;
})();

/** the plate's scale about PLATE_CENTRE, [x, y] — the counter's text and
 *  ladder take the same, so they stay on the plate */
export const plateScale = (env: CounterEnv): [number, number] => {
	const spin = kick(env.spinT, 5, 9);
	const re = kick(env.retrigT, 3.4, 4.5);
	const reBulge = env.retrigT >= 0 ? bump(env.retrigT, 0, 220) : 0;
	return [1 + 0.012 * spin + 0.05 * reBulge + 0.03 * re, 1 - 0.015 * spin + 0.045 * reBulge - 0.035 * re];
};
