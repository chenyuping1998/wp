/**
 * THE BOARD BETWEEN SPINS — small idle acts, so a settled board is never a
 * still picture (GoBananasBoat's idles.ts and director, on Jade's rigs).
 *
 * When the board has been still for a moment the idle director
 * (game/idleDirector.ts, run by IdleDirector.svelte) picks a cell every few
 * seconds — now and then a second just after, like a reaction — and the
 * painting there does a little thing of its own through the same rig as its
 * win:
 *
 *   H1  the teapot's lid lifts a hair and settles; the dragon turns its head
 *   H2  the gaiwan's lid is nudged and clinks back
 *   H3  the steamer's lid puffs up as if steam pushed it; the buns wobble
 *   H4  the three cups clink one after another
 *   W   the carved monkey flicks its tail and glances up
 *   S   the lantern sways on its ring; the tassel follows
 *   P   the cup's rim wobbles (only a cup without a prize on it)
 *   L*  the letters, rarely: each one gesture from its shape
 *
 * Smaller than a win, no rigid move (the painting never leaves its card), and
 * no light: it must read as life, not as a win the player did not get.
 */
import { bump, flick, restPose, settled, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Teapot';
import { H2 } from './h2Gaiwan';
import { H3 } from './h3Steamer';
import { H4 } from './h4Tray';
import { W } from './wMaster';
import { S } from './sLantern';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { P_BASE } from './pCup';

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

const idle = (
	spec: Pick<MeshWinSpec, 'symbol' | 'key' | 'sprite' | 'art' | 'feetY' | 'rig' | 'limits'>,
	ms: number,
	act: (rig: Rig, pose: Pose, t: number) => void,
): MeshWinSpec =>
	settled({
		...spec,
		symbol: `${spec.symbol}:idle`,
		durationMs: ms,
		// no landing dust: nothing lands
		landMs: 99999,
		hitMs: 0,
		pose: (rig, t) => {
			const pose = restPose(rig);
			act(rig, pose, t);
			return pose;
		},
	});

const P_LIMITS = { body: { pos: 0, neg: 0 }, rim: { pos: 6, neg: 6 }, disc: { pos: 0, neg: 0 } };

export const IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1600, (rig, pose, t) => {
		const lid = bone(rig, pose, 'lid');
		lid.dy = -1.6 * bump(t, 80, 520) + 0.5 * flick(t, 520, 5, 8);
		lid.angle = 1.6 * flick(t, 520, 4.5, 7);
		bone(rig, pose, 'dragon').angle = track(t, [[0, 0], [500, 0], [800, -4, 'inOut'], [1150, -4], [1450, 0, 'inOut']]);
	}),
	H2: idle(H2, 1200, (rig, pose, t) => {
		const lid = bone(rig, pose, 'lid');
		lid.angle = 2.6 * flick(t, 80, 2.2, 3.2);
		lid.dy = -1.2 * bump(t, 60, 300) + 0.5 * flick(t, 300, 5, 9);
	}),
	H3: idle(H3, 1400, (rig, pose, t) => {
		// a puff of steam lifts the lid and lets it drop
		bone(rig, pose, 'lid').angle = 2.4 * bump(t, 100, 520) - 1 * flick(t, 520, 4, 7);
		const wob = flick(t, 520, 3.5, 5);
		for (const name of ['bunL', 'bunR']) {
			const bun = bone(rig, pose, name);
			bun.along = 1 - 0.04 * wob;
			bun.across = 1 + 0.04 * wob;
		}
	}),
	H4: idle(H4, 1300, (rig, pose, t) => {
		['cupL', 'cupM', 'cupR'].forEach((name, i) => {
			const cup = bone(rig, pose, name);
			const at = 80 + i * 170;
			cup.dy = -2.4 * bump(t, at, at + 160);
			cup.angle = (i - 1 || 0.7) * 2 * flick(t, at + 160, 4.5, 7);
		});
	}),
	W: idle(W, 1700, (rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 7 * flick(t, 60, 1.6, 2.2);
		bone(rig, pose, 'head').angle = track(t, [[0, 0], [600, 0], [850, -5, 'inOut'], [1200, -5], [1500, 0, 'inOut']]);
	}),
	S: idle(S, 1800, (rig, pose, t) => {
		bone(rig, pose, 'body').angle = 2.6 * flick(t, 60, 1, 1.6);
		bone(rig, pose, 'tassel').angle = -5 * flick(t, 220, 1, 1.4);
	}),
	P: idle({ ...P_BASE, limits: P_LIMITS }, 1100, (rig, pose, t) => {
		bone(rig, pose, 'rim').angle = 2.6 * flick(t, 80, 2.6, 3.4);
		const disc = bone(rig, pose, 'disc');
		disc.along = disc.across = 1 + 0.025 * bump(t, 60, 600);
	}),
	// the letters: rarely, and small
	L1: idle(L1, 1000, (rig, pose, t) => {
		const jack = flick(t, 80, 2.2, 2.5);
		bone(rig, pose, 'legL').angle = 4 * jack;
		bone(rig, pose, 'legR').angle = -4 * jack;
	}),
	L2: idle(L2, 1000, (rig, pose, t) => {
		bone(rig, pose, 'kick').angle = -6 * bump(t, 100, 500) + 2 * flick(t, 500, 3, 6);
	}),
	L3: idle(L3, 1000, (rig, pose, t) => {
		// the short-tailed Q has no tail bone: it bobs on its own baseline
		const glyph = bone(rig, pose, 'glyph');
		const bob = bump(t, 80, 380) - 0.6 * bump(t, 380, 640);
		glyph.along = 1 + 0.05 * bob;
		glyph.across = 1 - 0.035 * bob;
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
