/**
 * THE THINGS THAT HANG IN THE BACKGROUNDS.
 *
 * Base game: the two lanterns hanging on chains beside the archway sway; the
 * quake on a feature trigger (game/caveQuake) kicks them into a real swing on
 * each chest-beat strike. (Re-traced on Go Banalchemy's laboratory 2026-10-04;
 * the mine's lantern, rope coil, ropes and plank are gone with its art.)
 *
 * Each is a mesh over ONE small rectangle of its background (not the whole
 * 1920px plate), drawn exactly on top of the unchanged sprite by
 * BgProps.svelte. The rectangle's border belongs to `frame` and never moves, so
 * there is no seam where the mesh meets the sprite; the props hand their
 * weight back to it within a few units of the border.
 *
 * Rig units are a 256 x 144 canvas over the 1920 x 1080 plate (7.5px each).
 * Coordinates measured on bg_base.png / bg_feature.png, 2026-09-25.
 */
import {
	flick,
	polygon,
	polyline,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rect,
	type Rig,
} from './meshRig';

// The quake's strikes, COPIED from game/caveQuake.svelte.ts (which mirrors
// Mascot.svelte and design/generate_monkey_spine.mjs). Not imported: these
// modules must load under bare node for design/check_mesh_wins.mjs, and that
// file is a .svelte.ts with runes in it. Change all of them together.
const QUAKE_BEATS = 6;
const strikeAt = (i: number) => 480 + i * 300;

export const BG_CANVAS: [number, number] = [256, 144];

/** what drives the props this frame */
export type BgEnv = {
	/** ms since the scene appeared (the idle sway) */
	t: number;
	/** blast ladder rung, 1..5 */
	level: number;
	/** ms since the cave quake started, or < 0 */
	quakeT: number;
	/** ms since the last detonation, or < 0 */
	blastT: number;
};

export type BgPropSpec = MeshWinSpec & {
	/** the rectangle this mesh covers, rig units */
	rect: Rect;
	drive: (rig: Rig, env: BgEnv) => Pose;
};

const depthIn = (r: Rect, p: Point) => Math.max(0, Math.min(p[0] - r[0], r[2] - p[0], p[1] - r[1], r[3] - p[1]));

/** `frame` owns the rectangle's border and everything not near a prop */
const frame = (): PartSpec => ({ name: 'frame', pivot: [0, 0], dist: () => 5 });

/** a prop hanging from `pivot`: its own shape, handed back to the frame near
 *  the rectangle's border so the border never moves */
const prop = (rect: Rect, name: string, pivot: Point, dist: (p: Point) => number, keepExtra?: (p: Point) => number): PartSpec => ({
	name,
	parent: 'frame',
	pivot,
	axis: [0, 1],
	dist,
	keep: (p) => smoothstep((depthIn(rect, p) - 1) / 4) * (keepExtra ? keepExtra(p) : 1),
});

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a kick that swings and dies away, from each strike of the quake */
const quakeKick = (quakeT: number, hz: number, decay: number) => {
	if (quakeT < 0) return 0;
	let v = 0;
	for (let i = 0; i < QUAKE_BEATS; i++) v += flick(quakeT, strikeAt(i), hz, decay) * (0.5 + 0.1 * i);
	return v;
};

const wave = (t: number, period: number) => Math.sin((2 * Math.PI * t) / period);

// ---------------------------------------------------------------------------
// base game (Go Banalchemy's laboratory, 2026-10-04): the two lanterns hanging
// on chains from wall brackets either side of the archway. Each is its own
// small mesh, so the swing never drags the wall between them. Measured on
// goBanalchemyBackground/bg_base.png: chains from y 6, lantern bodies 20..46,
// centred x 41.5 (left) and 213.5 (right).

const lantern = (side: 'L' | 'R', cx: number): BgPropSpec => {
	// room round it for the wall to take the swing: at +-11 it folded by 2deg
	const rect: Rect = [cx - 24, 2, cx + 24, 62];
	const BODY = polygon([[cx - 2, 18], [cx + 2, 18], [cx + 7, 23], [cx + 7, 42], [cx + 1, 47], [cx - 1, 47], [cx - 7, 42], [cx - 7, 23]]);
	const CHAIN = polyline([[cx - 1.5, 6], [cx, 19]], 1.2);
	const shape = (p: Point) => Math.min(BODY(p), CHAIN.dist(p));
	const spec: BgPropSpec = {
		symbol: `bgLantern${side}`,
		key: 'gbBgBase',
		sprite: 'gbBgBase',
		mode: 'panel',
		feetY: 62,
		durationMs: 2600,
		landMs: 99999,
		hitMs: 99999,
		rect,
		inked: (p) => shape(p) === 0,
		rig: {
			canvas: BG_CANVAS,
			grid: { x0: rect[0], y0: rect[1], x1: rect[2], y1: rect[3], cols: 48, rows: 60 },
			soft: 1.2,
			parts: [
				frame(),
				// on its chain: the bracket's hook (above y 7) stays on the wall
				prop(rect, 'lantern', [cx - 1.5, 6], shape, (p) => smoothstep((p[1] - 6) / 4)),
			],
		},
		// geometric (check_mesh_wins.mjs bg:base --limits) — see the gate
		limits: { lantern: { pos: 9, neg: 9 } },
		drive: (rig, env) => {
			const pose = restPose(rig);
			bone(rig, pose, 'lantern').angle =
				2.4 * wave(env.t, side === 'L' ? 3300 : 3700) + LANTERN_KICK * quakeKick(env.quakeT, side === 'L' ? 0.9 : 1, 0.9);
			return pose;
		},
		pose: (rig, t) => spec.drive(rig, { t, level: 1, quakeT: t, blastT: -1 }),
	};
	return spec;
};

export const BG_BASE = lantern('L', 41.5);
export const BG_BASE_R = lantern('R', 213.5);

// (free game: nothing hangs in the crystal vault — its tubes and crystals
// stand on the floor — so it has no props.)

// set from the measured limits
const LANTERN_KICK = 3.5;
