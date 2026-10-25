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
import { bump, flick, hump, ramp, restPose, settled, smoothstep, springDecay, track, turnAbout, withFollow, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1, H2, H3, H4, W, S, P, FOLLOW } from './puttWins';
import { L_IDLES } from './puttFlags';

// 2026-10-23: long enough for the measured spring (4Hz, damping 0.45) to die
// out; it was 260 with a hand-keyed squash
export const LAND_MS = 340;

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
	pose.rigid.dx *= k;
	pose.rigid.dy *= k;
	return pose;
};

/**
 * The landing (2026-10-23, spine-generator's symbol-land): the reel's own stop
 * already overshoots and comes back (constants.ts reelBounceSizeMulti), so the
 * subject does not drop again; it takes the hit on its card as the kit
 * measured it on Iron Jaw — squashed by the impact and sprung back at 4Hz,
 * damping 0.45, sinking a little into the card first. The loose parts are not
 * keyed at all: they follow the squash through withFollow, so a tall part
 * whips and a short one barely stirs, as each is drawn.
 */
const land = (spec: Base, k: number): MeshWinSpec => {
	const moved = withFollow(
		{
			...spec,
			symbol: `${spec.symbol}:land`,
			durationMs: LAND_MS,
			landMs: 99999,
			hitMs: 0,
			events: [0],
			pose: (rig, t) => {
				const pose = restPose(rig);
				// in over 30ms, so the first frame is still the drawing
				const hit = springDecay(t) * smoothstep(t / 30);
				pose.rigid.sx = 1 + k * 0.072 * hit;
				pose.rigid.sy = 1 - k * 0.12 * hit;
				pose.rigid.dy = k * 3 * hit;
				// a small knock of its own on each part as well, so a part the hit
				// runs straight along (the sails, the clubs) still stirs
				loose(spec).forEach((p, i) => {
					bone(rig, pose, p.name).angle = (i % 2 ? -1 : 1) * 0.25 * p.lim * flick(t, 30 + 25 * i, 5, 9);
				});
				return pose;
			},
		},
		(FOLLOW[spec.symbol] ?? []).map((f) => ({ ...f, share: LAND_SHARE })),
	);
	// home last, follow-through and all, so the swap back to the sprite is exact
	return { ...moved, pose: (rig, t) => fadeHome(moved.pose(rig, t), t, LAND_MS) };
};
/** the landing is the parts' whole act: they answer it with half their range */
const LAND_SHARE = 0.5;

const idle = (spec: Base, ms: number, act?: (rig: Rig, pose: Pose, t: number) => void): MeshWinSpec => {
	const parts = loose(spec);
	return settled(withFollow({
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
					// the swing out and back eases at both ends, and its
					// overshoot is eased in rather than kicked
					const a0 = 40 + 160 * i, a1 = 560 + 160 * i;
					b.angle = (i % 2 ? -1 : 1) * amp * (hump(t, a0, a1) + 0.4 * flick(t, a1 - 120, 4, 6) * ramp(t, a1 - 120, a1 + 40));
					b.dy = -1.4 * hump(t, a0, a1);
				});
			return pose;
		},
	}, (FOLLOW[spec.symbol] ?? []).map((f) => ({ ...f, share: IDLE_SHARE }))));
};
/** on a still board the follow is a whisper under the idle's own move */
const IDLE_SHARE = 0.2;

const P_BASE: Base = { ...P, limits: P.limits };

/**
 * THE SCATTER'S TELL (2026-10-23, spine-generator's tease-shake): while a reel
 * is held for the feature, every golden flag already on the board trembles —
 * harder and harder, swelling toward the player, the flag cracking with it —
 * and lets go in the last 150ms. Symbol.svelte plays it again for as long as
 * any reel is teasing; each pass ends exactly on the drawing.
 */
export const TEASE_MS = 1200;
const shakeGrow = (t: number) => {
	// three sines at unrelated rates under a growing envelope, as the kit's shake
	const u = t / TEASE_MS;
	const release = smoothstep((1 - u) / 0.12);
	const env = Math.pow(u, 1.5) * release;
	const s = Math.sin((2 * Math.PI * 14 * t) / 1000 + 0.7) + 0.6 * Math.sin((2 * Math.PI * 19.2 * t) / 1000 + 2.1) + 0.35 * Math.sin((2 * Math.PI * 29.5 * t) / 1000 + 4.4);
	return { env, s: s / 1.95 };
};
export const S_TEASE: MeshWinSpec = settled({
	...S,
	symbol: 'S:tease',
	durationMs: TEASE_MS,
	landMs: 99999,
	hitMs: 0,
	// it is a tremble from start to finish
	events: [0, 300, 600, 900],
	pose: (rig, t) => {
		const pose = restPose(rig);
		const { env, s } = shakeGrow(t);
		pose.rigid.dx = 0.03 * 256 * env * s;
		pose.rigid.pop = track(t, [[0, 1], [TEASE_MS - 150, 1.06, 'in'], [TEASE_MS, 1, 'out']]);
		// the pin shivers up and down inside the shake, as the wins lift it
		bone(rig, pose, 'body').dy = -3 * env * Math.sin((2 * Math.PI * 17 * t) / 1000 + 0.4);
		const flag = bone(rig, pose, 'flag');
		const tip = bone(rig, pose, 'flagTip');
		flag.angle = 0.6 * 7 * env * Math.sin((2 * Math.PI * 9 * t) / 1000);
		tip.angle = 0.6 * 15 * env * Math.sin((2 * Math.PI * 9 * t) / 1000 - 1.1);
		pose.rigid = turnAbout(pose.rigid, [128, 128], S.feetY);
		return pose;
	},
});

export const MESH_LANDS: Record<string, MeshWinSpec> = {
	H1: land(H1, 1), H2: land(H2, 1), H3: land(H3, 0.95), H4: land(H4, 0.95),
	W: land(W, 1.2), S: land(S, 1.25), P: land(P_BASE, 1.1),
};

export const IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1300), H2: idle(H2, 1400), H3: idle(H3, 1300), H4: idle(H4, 1200),
	W: idle(W, 1600), S: idle(S, 1300), P: idle(P_BASE, 1200),
	// the pennants' idle is their own light breeze (puttFlags.ts): the
	// generic idle turns each part by turns, which folds the cloth
	L1: L_IDLES[0], L2: L_IDLES[1], L3: L_IDLES[2], L4: L_IDLES[3], L5: L_IDLES[4],
};

/** how often each is picked, relative: the specials most, the letters rarely */
export const IDLE_WEIGHT: Record<string, number> = {
	W: 4, S: 4, P: 2, H1: 2.5, H2: 2.5, H3: 2.5, H4: 2.5,
	L1: 0.6, L2: 0.6, L3: 0.6, L4: 0.6, L5: 0.6,
};

/** BanditCollect's pick beat, ms (its PICK_MS) */
export const P_PICK_MS = 420;
/** how far up the prize is at `t`, canvas px — the value badge rides it */
export const pPickLift = (t: number) => 22 * hump(t, 20, P_PICK_MS - 10);
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
		const squash = hump(t, 0, 110) - 0.6 * hump(t, P_PICK_MS - 110, P_PICK_MS);
		pose.rigid = turnAbout(
			{ sx: 1 + 0.08 * squash, sy: 1 - 0.1 * squash, rot: 0, pop: 1, dx: 0, dy: -pPickLift(t) },
			[128, 150],
			P_BASE.feetY,
		);
		pose.air = Math.min(1, pPickLift(t) / 22);
		return pose;
	},
	pose: (rig, t) => P_PICK.drive(rig, { t, side: 1 }),
};
