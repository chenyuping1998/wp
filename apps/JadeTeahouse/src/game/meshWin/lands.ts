/**
 * THE LANDINGS — each painting lands with its own gesture instead of the whole
 * tile squashing as one card (GoBananasBoat's lands.ts, on Jade's rigs).
 *
 * Every landing is LAND_MS long whatever the speed (SymbolMeshWin's
 * `fixedSpeed`): the reels must settle together, as SymbolSprite's squash did.
 * The body squashes on the card and springs back; then the loose part reacts —
 * the teapot's lid clatters, the gaiwan's lid clinks, the steamer's buns
 * jiggle, the tray's cups rattle, the lantern's tassel swings, the medallion's
 * monkey flicks its tail, the cup's rim wobbles. The royals keep their sprite
 * squash: a board of them landing is most of every spin, and it should be calm.
 */
import { flick, restPose, smoothstep, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Teapot';
import { H2 } from './h2Gaiwan';
import { H3 } from './h3Steamer';
import { H4 } from './h4Tray';
import { W } from './wMaster';
import { S } from './sLantern';
import { P_BASE } from './pCup';

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
		const lid = bone(rig, pose, 'lid');
		lid.dy = -1.6 * Math.max(0, flick(t, 50, 6, 10));
		lid.angle = 3 * flick(t, 60, 5, 9);
		bone(rig, pose, 'dragon').angle = 3 * flick(t, 40, 3.5, 8);
	}),
	H2: land(H2, 1, (rig, pose, t) => {
		const lid = bone(rig, pose, 'lid');
		lid.dy = -1.8 * Math.max(0, flick(t, 50, 6, 10));
		lid.angle = 2.6 * flick(t, 70, 5, 9);
	}),
	H3: land(H3, 0.95, (rig, pose, t) => {
		const j = flick(t, 50, 5, 9);
		for (const name of ['bunL', 'bunR']) {
			const bun = bone(rig, pose, name);
			bun.along = 1 - 0.06 * j;
			bun.across = 1 + 0.06 * j;
		}
		bone(rig, pose, 'lid').angle = 2.4 * flick(t, 40, 4, 8);
	}),
	H4: land(H4, 0.95, (rig, pose, t) => {
		['cupL', 'cupM', 'cupR'].forEach((name, i) => {
			const cup = bone(rig, pose, name);
			cup.dy = -2.2 * Math.max(0, flick(t, 50 + 25 * i, 6, 11));
			cup.angle = (i - 1 || 0.7) * 2.6 * flick(t, 60 + 25 * i, 5, 9);
		});
	}),
	W: land(W, 1.2, (rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 6 * flick(t, 40, 3.2, 7);
		bone(rig, pose, 'head').angle = 3 * flick(t, 60, 3.2, 8);
	}),
	S: land(S, 1.25, (rig, pose, t) => {
		bone(rig, pose, 'body').angle = 2.4 * flick(t, 40, 2.6, 6);
		bone(rig, pose, 'tassel').angle = -7 * flick(t, 70, 2.6, 5);
	}),
	P: land(
		{ ...P_BASE, limits: { body: { pos: 0, neg: 0 }, rim: { pos: 6, neg: 6 }, disc: { pos: 0, neg: 0 } } },
		1.1,
		(rig, pose, t) => {
			bone(rig, pose, 'rim').angle = 3 * flick(t, 50, 5, 9);
			const disc = bone(rig, pose, 'disc');
			disc.along = disc.across = 1 + 0.03 * Math.max(0, flick(t, 40, 5, 9));
		},
	),
};
