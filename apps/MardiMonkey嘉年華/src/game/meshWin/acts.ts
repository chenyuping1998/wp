/**
 * THE ACTS AROUND A WIN — landings, idles and the collection beat, built from
 * this game's own win rigs (2026-10-10, ported from Diner / Jade Teahouse's
 * lands.ts, idles.ts and pTray.ts).
 *
 * Every symbol's win rig is a body plus a few loose parts (its accents). The
 * acts here move only those parts, each by a share of its measured limit, so
 * no act can bend a part further than the gate already allows:
 *
 *   MESH_LANDS  the body squashes on its card, then the loose parts react in
 *               turn (LAND_MS, at normal speed whatever the bet speed)
 *   IDLES       on a settled board, one part does a small thing of its own
 *               (picked by game/idleDirector.ts); no rigid move, no light
 *   P_PICK      the collected prize hops and tips toward its collector before
 *               it flies (BanditCollect.svelte)
 */
import { bump, flick, restPose, settled, smoothstep, track, turnAbout, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1, H2, H3, H4, W, S, P } from './mardiWins';
import { L1, L2, L3, L4, L5 } from './lowLetters';

export const LAND_MS = 260;

type Base = Pick<MeshWinSpec, 'symbol' | 'key' | 'sprite' | 'art' | 'feetY' | 'rig' | 'limits'>;
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
/** the loose parts of a rig, with their measured limits */
const loose = (spec: Base) =>
	spec.rig.parts
		.filter((p) => p.name !== 'root' && p.name !== 'body' && p.name !== 'glyph')
		.map((p) => ({ name: p.name, lim: Math.min(spec.limits[p.name]?.pos ?? 0, spec.limits[p.name]?.neg ?? 0) }));

const fadeHome = (pose: Pose, t: number, end: number, ms = 70) => {
	const k = 1 - smoothstep((t - (end - ms)) / ms);
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

const land = (spec: Base, k: number): MeshWinSpec => {
	const parts = loose(spec);
	return {
		...spec,
		symbol: `${spec.symbol}:land`,
		durationMs: LAND_MS,
		landMs: 99999,
		hitMs: 0,
		pose: (rig, t) => {
			const pose = restPose(rig);
			pose.rigid.sx = 1 + k * track(t, [[0, 0], [60, 0.09, 'out'], [140, -0.03], [230, 0]]);
			pose.rigid.sy = 1 - k * track(t, [[0, 0], [60, 0.14, 'out'], [140, -0.05], [230, 0]]);
			parts.forEach((p, i) => {
				const b = bone(rig, pose, p.name);
				b.angle = (i % 2 ? -1 : 1) * 0.7 * p.lim * flick(t, 45 + 25 * i, 5, 9);
				b.dy = -1.6 * Math.max(0, flick(t, 45 + 25 * i, 6, 10));
			});
			return fadeHome(pose, t, LAND_MS);
		},
	};
};

const idle = (spec: Base, ms: number, act?: (rig: Rig, pose: Pose, t: number) => void): MeshWinSpec => {
	const parts = loose(spec);
	return settled({
		...spec,
		symbol: `${spec.symbol}:idle`,
		durationMs: ms,
		landMs: 99999,
		hitMs: 0,
		pose: (rig, t) => {
			const pose = restPose(rig);
			if (act) act(rig, pose, t);
			else
				parts.forEach((p, i) => {
					const b = bone(rig, pose, p.name);
					// the first part leads, the others answer a beat later and smaller
					const amp = (i ? 0.35 : 0.6) * p.lim;
					b.angle = (i % 2 ? -1 : 1) * amp * (bump(t, 80 + 160 * i, 520 + 160 * i) + 0.4 * flick(t, 520 + 160 * i, 4, 6));
					b.dy = -1.4 * bump(t, 80 + 160 * i, 520 + 160 * i);
				});
			return pose;
		},
	});
};

const P_BASE: Base = { ...P, limits: P.limits };

export const MESH_LANDS: Record<string, MeshWinSpec> = {
	H1: land(H1, 1), H2: land(H2, 1), H3: land(H3, 0.95), H4: land(H4, 0.95),
	W: land(W, 1.2), S: land(S, 1.25), P: land(P_BASE, 1.1),
};

export const IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1300), H2: idle(H2, 1400), H3: idle(H3, 1300), H4: idle(H4, 1200),
	W: idle(W, 1600), S: idle(S, 1300), P: idle(P_BASE, 1200),
	L1: idle(L1, 1000, (rig, pose, t) => {
		const jack = flick(t, 80, 2.2, 2.5);
		bone(rig, pose, 'legL').angle = 4 * jack;
		bone(rig, pose, 'legR').angle = -4 * jack;
	}),
	L2: idle(L2, 1000, (rig, pose, t) => {
		bone(rig, pose, 'kick').angle = -6 * bump(t, 100, 500) + 2 * flick(t, 500, 3, 6);
	}),
	L3: idle(L3, 1000, (rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 6 * flick(t, 60, 2.2, 3);
	}),
	L4: idle(L4, 1000, (rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 7 * flick(t, 60, 2, 3);
	}),
	L5: idle(L5, 1100, (rig, pose, t) => {
		bone(rig, pose, 'one').dy = -3 * bump(t, 80, 420);
		bone(rig, pose, 'zero').dy = -3 * bump(t, 380, 760);
	}),
};

/** how often each is picked, relative: the specials most, the letters rarely */
export const IDLE_WEIGHT: Record<string, number> = {
	W: 4, S: 4, P: 2, H1: 2.5, H2: 2.5, H3: 2.5, H4: 2.5,
	L1: 0.6, L2: 0.6, L3: 0.6, L4: 0.6, L5: 0.6,
};

/** BanditCollect's pick beat, ms (its PICK_MS) */
export const P_PICK_MS = 420;
/** how far up the prize is at `t`, canvas px — the value badge rides it */
export const pPickLift = (t: number) => 22 * bump(t, 40, P_PICK_MS - 20);
export type PickEnv = { t: number; /** +1: the collector is to the right */ side: number };

const pParts = loose(P_BASE);
export const P_PICK: MeshWinSpec & { drive: (rig: Rig, env: PickEnv) => Pose } = {
	...P_BASE,
	symbol: 'P:pick',
	durationMs: P_PICK_MS,
	landMs: 99999,
	hitMs: 160,
	drive: (rig, { t, side }) => {
		const pose = restPose(rig);
		const tip = track(t, [[0, 0], [70, -0.15, 'out'], [200, 1, 'out'], [300, 0.85], [P_PICK_MS - 10, 0, 'inOut']]);
		const home = 1 - smoothstep((t - 320) / 90);
		pParts.forEach((p, i) => {
			bone(rig, pose, p.name).angle = (-side * 0.5 * p.lim * tip + side * 0.35 * p.lim * flick(t, 220 + 30 * i, 4, 6)) * home;
		});
		const squash = bump(t, 0, 90) - 0.6 * bump(t, P_PICK_MS - 90, P_PICK_MS);
		pose.rigid = turnAbout(
			{ sx: 1 + 0.08 * squash, sy: 1 - 0.1 * squash, rot: side * 18 * tip, pop: 1, dx: 0, dy: -pPickLift(t) },
			[128, 150],
			P_BASE.feetY,
		);
		pose.air = Math.min(1, pPickLift(t) / 22);
		return pose;
	},
	pose: (rig, t) => P_PICK.drive(rig, { t, side: 1 }),
};
