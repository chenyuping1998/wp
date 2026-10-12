/**
 * THE LANDINGS — each dish lands with its own gesture instead of the whole
 * tile squashing as one card (Jade Teahouse's lands.ts, on the Diner rigs in
 * dinerWins.ts).
 *
 * Every landing is LAND_MS long whatever the speed (SymbolMeshWin's
 * `fixedSpeed`): the reels must settle together, as SymbolSprite's squash did.
 * The body squashes on the card and springs back; then the loose part — the
 * rig's `accent` — reacts: the burger's top bun bounces, the shake's cherry and
 * straw wobble, the sausage tip flips, the pie point dips, the Chef's hat
 * jolts, the bell's button pings, the tray's ticket flaps. The royals keep
 * their sprite squash: a board of them landing is most of every spin, and it
 * should be calm.
 */
import { flick, restPose, smoothstep, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1, H2, H3, H4, W, S } from './dinerWins';
import { P_BASE, P_LIMITS } from './pTray';

export const LAND_MS = 260;

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** the squash every landing shares, scaled by how hard the symbol hits */
const squash = (t: number, k: number) => ({
	sx: 1 + k * track(t, [[0, 0], [60, 0.09, 'out'], [140, -0.03, 'inOut'], [230, 0, 'inOut']]),
	sy: 1 - k * track(t, [[0, 0], [60, 0.14, 'out'], [140, -0.05, 'inOut'], [230, 0, 'inOut']]),
});

/** blend every bone home over the last `ms` — meshRig.settled's 180ms would
 *  flatten most of a 260ms landing */
const fadeHome = (pose: Pose, t: number, ms = 70) => {
	const k = 1 - smoothstep((t - (LAND_MS - ms)) / ms);
	for (const b of pose.bones) {
		b.angle *= k;
		b.along = 1 + (b.along - 1) * k;
		b.across = 1 + (b.across - 1) * k;
		b.dx *= k;
		b.dy *= k;
	}
	pose.rigid.sx = 1 + (pose.rigid.sx - 1) * k;
	pose.rigid.sy = 1 + (pose.rigid.sy - 1) * k;
	return pose;
};

const land = (
	spec: Pick<MeshWinSpec, 'symbol' | 'key' | 'sprite' | 'art' | 'feetY' | 'rig' | 'limits'>,
	k: number,
	act: (rig: Rig, pose: Pose, t: number) => void,
): MeshWinSpec => ({
	...spec,
	symbol: `${spec.symbol}:land`,
	durationMs: LAND_MS,
	landMs: 99999,
	hitMs: 0,
	pose: (rig, t) => {
		const pose = restPose(rig);
		const s = squash(t, k);
		pose.rigid.sx = s.sx;
		pose.rigid.sy = s.sy;
		act(rig, pose, t);
		return fadeHome(pose, t);
	},
});

export const MESH_LANDS: Record<string, MeshWinSpec> = {
	H1: land(H1, 1, (rig, pose, t) => {
		// the top bun hops off the patties and drops back on
		const bun = bone(rig, pose, 'accent');
		bun.dy = -2.4 * Math.max(0, flick(t, 50, 6, 10));
		bun.angle = 3 * flick(t, 60, 5, 9);
	}),
	H2: land(H2, 1, (rig, pose, t) => {
		bone(rig, pose, 'accent').angle = 5 * flick(t, 50, 4.5, 8);
	}),
	H3: land(H3, 0.95, (rig, pose, t) => {
		bone(rig, pose, 'accent').angle = 4 * flick(t, 45, 5, 9);
	}),
	H4: land(H4, 0.95, (rig, pose, t) => {
		bone(rig, pose, 'accent').angle = -4 * flick(t, 55, 5, 9);
	}),
	W: land(W, 1.2, (rig, pose, t) => {
		// the hat jolts on his head
		const hat = bone(rig, pose, 'accent');
		hat.angle = 5 * flick(t, 40, 3.6, 7);
		hat.dy = -1.6 * Math.max(0, flick(t, 40, 6, 10));
	}),
	S: land(S, 1.25, (rig, pose, t) => {
		// the button pings up when the bell hits the counter
		const button = bone(rig, pose, 'accent');
		button.dy = -3 * Math.max(0, flick(t, 40, 7, 10));
		button.angle = 2.4 * flick(t, 70, 5, 8);
	}),
	P: land({ ...P_BASE, limits: P_LIMITS }, 1.1, (rig, pose, t) => {
		bone(rig, pose, 'ticket').angle = 4 * flick(t, 50, 4.5, 8);
	}),
};
