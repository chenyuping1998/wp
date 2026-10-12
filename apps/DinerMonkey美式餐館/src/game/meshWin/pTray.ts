/**
 * P — THE ORDER TRAY (the collected prize). It never wins on its own, so its
 * acts are the ones around a win:
 *
 *   P_PICK   the collection (BanditCollect.svelte): before it is taken, the tray
 *            hops and TIPS toward the Chef who is about to collect it, as if
 *            sliding the order across the counter to him; the ticket on its
 *            spike lags the tip and flaps; it rights itself just as the flying
 *            copy takes over
 *   (the landing and the idle act are in lands.ts / idles.ts, on this rig)
 *
 * CUT mode over its card, like every Diner symbol.
 *
 * Coordinates are the 256 canvas of sushiSymbols/p.png (2026-10-09, measured
 * from the paper colour): ticket a skewed sheet (78..186, 12..170) with its
 * clip on top, held on the spike at (131, 172); chrome tray an ellipse
 * (18..243, 128..239) centred (130, 182).
 */
import { blob, bump, flick, polygon, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Pose, type Rig } from './meshRig';

const TRAY = blob([130, 184], 114, 56, 3);
const TICKET = polygon([[78, 44], [100, 12], [150, 10], [164, 30], [176, 70], [184, 124], [186, 168], [100, 172], [90, 120]]);

export const P_RIG: MeshWinSpec['rig'] = {
	grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
	soft: 4,
	parts: [
		{ name: 'root', pivot: [130, 236], dist: () => 14 },
		{ name: 'body', parent: 'root', pivot: [130, 236], axis: [0, -1], priority: 1, dist: TRAY },
		{
			name: 'ticket',
			parent: 'body',
			pivot: [131, 172],
			axis: [0, -1],
			priority: 3,
			dist: TICKET,
			// the foot of the ticket stays on its spike
			keep: (p) => smoothstep((166 - p[1]) / 18),
		},
	],
};

export const P_BASE: Omit<MeshWinSpec, 'pose' | 'durationMs' | 'landMs' | 'hitMs' | 'limits'> = {
	symbol: 'P',
	key: 'gbP',
	sprite: 'gbP',
	art: 'sushiSymbols/p.png',
	feetY: 236,
	rig: P_RIG,
};

export const P_LIMITS: MeshWinSpec['limits'] = { body: { pos: 0, neg: 0 }, ticket: { pos: 8, neg: 8 } };

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** BanditCollect's pick beat, ms (its PICK_MS) */
export const P_PICK_MS = 420;
/** how far up the tray is at `t`, canvas px — the prize badge rides it */
export const pPickLift = (t: number) => 22 * bump(t, 40, P_PICK_MS - 20);

export type PickEnv = { t: number; /** +1: the collector is to the right */ side: number };

export const P_PICK: MeshWinSpec & { drive: (rig: Rig, env: PickEnv) => Pose } = {
	...P_BASE,
	symbol: 'P:pick',
	durationMs: P_PICK_MS,
	landMs: 99999,
	hitMs: 160,
	limits: P_LIMITS,
	drive: (rig, { t, side }) => {
		const pose = restPose(rig);
		const tip = track(t, [[0, 0], [70, -0.15, 'out'], [200, 1, 'out'], [300, 0.85], [P_PICK_MS - 10, 0, 'inOut']]);
		// the ticket lags the tip and flaps, home before the flying copy takes over
		const home = 1 - smoothstep((t - 320) / 90);
		bone(rig, pose, 'ticket').angle = (-side * 3.5 * tip + side * 2.5 * flick(t, 220, 4, 6)) * home;
		const squash = bump(t, 0, 90) - 0.6 * bump(t, P_PICK_MS - 90, P_PICK_MS);
		pose.rigid = turnAbout(
			{ sx: 1 + 0.08 * squash, sy: 1 - 0.1 * squash, rot: side * 20 * tip, pop: 1, dx: 0, dy: -pPickLift(t) },
			[130, 150],
			236,
		);
		pose.air = Math.min(1, pPickLift(t) / 22);
		return pose;
	},
	pose: (rig, t) => P_PICK.drive(rig, { t, side: 1 }),
};
