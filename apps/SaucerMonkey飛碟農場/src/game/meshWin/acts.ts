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
import { H1, H2, H3, H4, W, S, P } from './saucerWins';
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

/**
 * THE ABDUCTION (2026-10-23, user: make the cow being beamed up fun). One
 * mesh from the moment the beam finds her to the moment the saucer swallows
 * her, so nothing swaps mid-act (BanditCollect.svelte moves and turns the
 * whole thing; this poses the cow inside it):
 *
 *   0-90ms     she sinks (the spec's 8% squash: she is heavy)
 *   90-170     the double take: her head snaps round to the saucer, ears
 *              shoot up, a little hop off the board
 *   170-340    and she FREEZES — the comic beat (SAUCER_動畫需求單 §0.3)
 *   then       up she goes, still deadpan: ears flapping like useless wings,
 *              her tag swinging as she turns over in the beam, stretched
 *              thinner and thinner as the saucer pulls her in
 */
export const P_PICK_MS = 340;
export const P_FLY_MS = 900;
/** how far up the prize is at `t`, canvas px — the flight starts from here */
export const pPickLift = (t: number) => 14 * track(t, [[0, 0], [90, -0.25, 'out'], [170, 1, 'back'], [P_PICK_MS, 1]]);
export type PickEnv = { t: number; /** +1: the collector is to the right */ side: number };

const pLim = Object.fromEntries(loose(P_BASE).map((p) => [p.name, p.lim]));
export const P_PICK: MeshWinSpec & { drive: (rig: Rig, env: PickEnv) => Pose } = {
	...P_BASE,
	symbol: 'P:pick',
	durationMs: P_PICK_MS + P_FLY_MS,
	landMs: 99999,
	hitMs: 90,
	drive: (rig, { t, side }) => {
		const pose = restPose(rig);
		const B = (name: string) => bone(rig, pose, name);
		// the take: anticipation, the snap (with its overshoot), the freeze
		const take = track(t, [[0, 0], [90, -0.2, 'out'], [170, 1, 'back'], [P_PICK_MS, 1]]);
		const sink = bump(t, 0, 150);
		// in the air
		const f = t - P_PICK_MS;
		const air = smoothstep(f / 120);
		const flap = f > 0 ? Math.sin((2 * Math.PI * f) / 180) * air : 0;
		const pull = smoothstep((f - 0.5 * P_FLY_MS) / (0.4 * P_FLY_MS));

		// head: round toward the saucer and up, then a slow, unimpressed nod
		B('head').angle = side * pLim.head * 0.6 * take - (f > 0 ? 0.35 * pLim.head * Math.sin((2 * Math.PI * f) / 620) * air : 0);
		// ears: shot straight up on the take, then both flapping like wings
		// (the left ear's + is up, the right's -)
		const ear = 0.9 * Math.min(1, take) - 0.65 * (0.5 + 0.5 * flap) * air;
		B('earL').angle = pLim.earL * ear;
		B('earR').angle = -pLim.earR * ear;
		B('earL').along = 1 + 0.08 * take;
		B('earR').along = 1 + 0.08 * take;
		// the tag: jolted on the take, then swinging against her turn
		B('tag').angle = pLim.tag * (0.8 * flick(t, 120, 3, 5) + (f > 0 ? 0.6 * Math.sin((2 * Math.PI * f) / 420) * air : 0));
		// the whole cow: sinks, then pulled long and thin toward the saucer
		const sx = 1 + 0.08 * sink - 0.24 * pull;
		const sy = 1 - 0.1 * sink + 0.42 * pull;
		pose.rigid = turnAbout({ sx, sy, rot: 0, pop: 1, dx: 0, dy: -pPickLift(Math.min(t, P_PICK_MS)) }, [128, 150], P_BASE.feetY);
		pose.air = Math.min(1, pPickLift(Math.min(t, P_PICK_MS)) / 14);
		// by the end she is a speck inside the saucer (BanditCollect scales her
		// to nothing); the pose eases home under that so the act ends at rest
		const end = P_PICK_MS + P_FLY_MS;
		fadeHome(pose, t, end, 60);
		const k = 1 - smoothstep((t - (end - 60)) / 60);
		pose.rigid.dx *= k;
		pose.rigid.dy *= k;
		pose.air *= k;
		return pose;
	},
	pose: (rig, t) => P_PICK.drive(rig, { t, side: 1 }),
};
