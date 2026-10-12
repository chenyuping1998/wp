/**
 * P — THE JADE CUP (the collected prize). It never wins on its own, so its acts
 * are the ones around a win:
 *
 *   P_PICK   the collection (BanditCollect.svelte): before it is taken, the cup
 *            hops and TIPS toward the Tea Master who is about to collect it, as
 *            if pouring itself out to him, its rim lagging the tip; it rights
 *            itself just as the flying copy takes over
 *   (the landing and the idle act are in lands.ts / idles.ts, on this rig)
 *
 * CUT mode over its card, like every Jade painting.
 *
 * Coordinates are the 256 canvas of sushiSymbols/p.png (2026-10-09): rim
 * (40..222, 45..80), bowl (32..230, 75..190), prize disc (130,135) r52, foot
 * (80..183, 188..205).
 */
import { blob, bump, flick, polygon, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Pose, type Rig } from './meshRig';

const BODY = polygon([[40, 46], [222, 46], [230, 90], [230, 150], [204, 186], [184, 190], [184, 206], [80, 206], [80, 190], [56, 186], [30, 150], [30, 90]]);
const RIM = blob([131, 62], 94, 20, 3);
const DISC = blob([130, 135], 54, 54, 2);

export const P_RIG: MeshWinSpec['rig'] = {
	grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
	soft: 4,
	parts: [
		{ name: 'root', pivot: [130, 205], dist: () => 14 },
		{ name: 'body', parent: 'root', pivot: [130, 205], axis: [0, -1], priority: 1, dist: BODY },
		{
			name: 'rim',
			parent: 'body',
			pivot: [131, 80],
			axis: [0, -1],
			priority: 3,
			dist: RIM,
			keep: (p) => smoothstep((86 - p[1]) / 16),
		},
		{
			name: 'disc',
			parent: 'body',
			pivot: [130, 135],
			axis: [0, -1],
			priority: 2,
			dist: DISC,
			keep: (p) => smoothstep((1.1 - Math.hypot((p[0] - 130) / 54, (p[1] - 135) / 54)) / 0.35),
		},
	],
};

export const P_BASE: Omit<MeshWinSpec, 'pose' | 'durationMs' | 'landMs' | 'hitMs' | 'limits'> = {
	symbol: 'P',
	key: 'gbP',
	sprite: 'gbP',
	art: 'sushiSymbols/p.png',
	feetY: 205,
	rig: P_RIG,
};

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** BanditCollect's pick beat, ms (its PICK_MS) */
export const P_PICK_MS = 420;
/** how far up the cup is at `t`, canvas px — the prize badge rides it */
export const pPickLift = (t: number) => 22 * bump(t, 40, P_PICK_MS - 20);

export type PickEnv = { t: number; /** +1: the collector is to the right */ side: number };

export const P_PICK: MeshWinSpec & { drive: (rig: Rig, env: PickEnv) => Pose } = {
	...P_BASE,
	symbol: 'P:pick',
	durationMs: P_PICK_MS,
	landMs: 99999,
	hitMs: 160,
	limits: { body: { pos: 0, neg: 0 }, rim: { pos: 6, neg: 6 }, disc: { pos: 0, neg: 0 } },
	drive: (rig, { t, side }) => {
		const pose = restPose(rig);
		const tip = track(t, [[0, 0], [70, -0.15, 'out'], [200, 1, 'out'], [300, 0.85], [P_PICK_MS - 10, 0, 'inOut']]);
		// the rim lags the tip, and is home before the flying copy takes over
		const home = 1 - smoothstep((t - 320) / 90);
		bone(rig, pose, 'rim').angle = (-side * 4 * tip + side * 2.5 * flick(t, 220, 4, 6)) * home;
		const disc = bone(rig, pose, 'disc');
		disc.along = disc.across = 1 + 0.08 * bump(t, 60, 300);
		const squash = bump(t, 0, 90) - 0.6 * bump(t, P_PICK_MS - 90, P_PICK_MS);
		pose.rigid = turnAbout(
			{ sx: 1 + 0.08 * squash, sy: 1 - 0.1 * squash, rot: side * 24 * tip, pop: 1, dx: 0, dy: -pPickLift(t) },
			[130, 128],
			205,
		);
		pose.air = Math.min(1, pPickLift(t) / 22);
		return pose;
	},
	pose: (rig, t) => P_PICK.drive(rig, { t, side: 1 }),
};
