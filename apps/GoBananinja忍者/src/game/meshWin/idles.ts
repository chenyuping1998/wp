/**
 * THE BOARD BETWEEN SPINS — small idle acts, so a settled board is never a
 * still picture (GoBananasBoat's idles.ts and director, with this game's acts).
 *
 * When the board has stood still for a moment, the idle director
 * (game/idleDirector.ts, run by IdleDirector.svelte) picks one cell every few
 * seconds — now and then a second one just after, like a reaction — and the
 * symbol there does a little thing of its own, through the same rig and layers
 * as its win (SymbolSprite draws it in place of the sprite):
 *
 *   H1  the kabuto rises a touch and cocks its head; the horns hum, the knot sways
 *   H2  the shuriken spins once in place and settles with a quiver
 *   H3  the fuse hisses and spits, the smoke breathes out
 *   H4  the fan flutters twice, the tassels sway after it
 *   W   a breeze takes the ninja's headband tails; he glances round
 *   S   the bananas bob, the bow flaps
 *   L*  the letters, rarely: each a gesture from its shape
 *
 * Smaller than a win and with no light: no flash, no sweep, no impact frame —
 * this plays under the board's mask, where additive light draws nothing, and
 * it must read as life, not as a win the player did not get.
 */
import { bump, flick, restPose, restRigid, track, turnAbout, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Kabuto';
import { H2 } from './h2Shuriken';
import { H3 } from './h3Bomb';
import { H4 } from './h4Fan';
import { W } from './wNinja';
import { S } from './sBananas';
import { L1, L2, L3, L4, L5 } from './lowLetters';

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

const idle = (spec: MeshWinSpec, ms: number, act: (rig: Rig, pose: Pose, t: number) => void): MeshWinSpec => ({
	...spec,
	durationMs: ms,
	landMs: 0,
	hitMs: 0,
	noDust: true,
	smear: undefined,
	pose: (rig, t) => {
		const pose = restPose(rig);
		act(rig, pose, t);
		return pose;
	},
});

/** a small lift and a soft landing, rigid — costs the mesh nothing */
const bob = (pose: Pose, t: number, from: number, to: number, px: number) => {
	const up = bump(t, from, to);
	pose.rigid = {
		...restRigid(),
		dy: -px * up,
		sy: 1 - 0.035 * (bump(t, from - 60, from + 60) + bump(t, to - 60, to + 60)) + 0.02 * up,
		sx: 1 + 0.025 * (bump(t, from - 60, from + 60) + bump(t, to - 60, to + 60)) - 0.012 * up,
	};
	pose.air = 0.35 * up;
};

const ease = (t: number, a: number, b: number) => {
	const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
	return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};

export const IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1700, (rig, pose, t) => {
		bob(pose, t, 120, 1400, 4);
		const look = track(t, [[0, 0], [220, 0], [420, 1, 'out'], [700, 1], [900, -1, 'inOut'], [1200, -1], [1450, 0, 'inOut']]);
		pose.rigid.rot = 3 * look;
		// the horns hum with each turn of the head, the knot swings after it
		bone(rig, pose, 'horn_l').angle = -1.6 * flick(t, 420, 6, 6) - 1.4 * flick(t, 900, 6, 6);
		bone(rig, pose, 'horn_r').angle = 1.6 * flick(t, 440, 6, 6) + 1.4 * flick(t, 920, 6, 6);
		const lag = track(t, [[0, 0], [300, 0], [520, 1, 'out'], [800, 1], [1020, -1, 'inOut'], [1300, -1], [1560, 0, 'inOut']]);
		bone(rig, pose, 'knot').angle = -4 * lag;
		// the side guards lift with the rise and settle with a flap
		bone(rig, pose, 'guard_l').angle = 2 * bump(t, 120, 700) + 1.2 * flick(t, 1400, 3, 5);
		bone(rig, pose, 'guard_r').angle = -2 * bump(t, 120, 700) - 1.2 * flick(t, 1400, 3, 5);
	}),
	H2: idle(H2, 1400, (rig, pose, t) => {
		// one turn in place, about the hub, and a quiver as it stops
		pose.rigid = { ...restRigid(), rot: 360 * ease(t, 150, 900) };
		turnAbout(pose.rigid, [128, 129], H2.feetY);
		for (const n of ['blade_tl', 'blade_tr', 'blade_br', 'blade_bl']) bone(rig, pose, n).angle = -2.2 * bump(t, 300, 800) + 1.2 * flick(t, 900, 6, 7);
		// the jade glints as it comes round
		const gem = bone(rig, pose, 'gem');
		gem.along = gem.across = 1 + 0.16 * bump(t, 700, 1050);
	}),
	H3: idle(H3, 1500, (rig, pose, t) => {
		const hiss = bump(t, 60, 1300);
		bone(rig, pose, 'fuse').angle = 4 * hiss * Math.sin(t / 37) - 3 * flick(t, 200, 3, 4);
		const breathe = bump(t, 100, 1350);
		bone(rig, pose, 'smoke_l').along = 1 + 0.05 * breathe;
		bone(rig, pose, 'smoke_l').angle = -1.6 * breathe;
		bone(rig, pose, 'smoke_t').along = 1 + 0.05 * bump(t, 250, 1400);
		bone(rig, pose, 'smoke_r').along = 1 + 0.05 * breathe;
		bone(rig, pose, 'smoke_r').angle = 1.6 * breathe;
		bone(rig, pose, 'ball').along = 1 + 0.02 * bump(t, 400, 700);
		bone(rig, pose, 'ball').across = 1 + 0.02 * bump(t, 400, 700);
	}),
	H4: idle(H4, 1500, (rig, pose, t) => {
		const flutter = flick(t, 100, 3, 2.6);
		bone(rig, pose, 'fan_l').angle = -3.4 * flutter;
		bone(rig, pose, 'fan_r').angle = 3.4 * flutter;
		bone(rig, pose, 'tassel_l').angle = 5 * flick(t, 220, 1.6, 2);
		bone(rig, pose, 'tassel_r').angle = 5 * flick(t, 280, 1.6, 2);
	}),
	W: idle(W, 2000, (rig, pose, t) => {
		// a breeze through the tails, the tips wider and later
		const gust = bump(t, 60, 1850);
		const w = (2 * Math.PI * t) / 420;
		bone(rig, pose, 'tail_up').angle = 2.4 * gust * Math.sin(w);
		bone(rig, pose, 'tail_up_tip').angle = 7 * gust * Math.sin(w - 1.1);
		bone(rig, pose, 'tail_lo').angle = -2 * gust * Math.sin(w - 0.5);
		bone(rig, pose, 'tail_lo_tip').angle = -6 * gust * Math.sin(w - 1.6);
		bone(rig, pose, 'scarf').angle = -3.6 * gust * Math.sin(w - 2);
		// ...and he glances round
		const look = track(t, [[0, 0], [300, 0], [550, 1, 'out'], [900, 1], [1200, 0, 'inOut']]);
		bone(rig, pose, 'head').angle = 1.2 * look;
	}),
	S: idle(S, 1500, (rig, pose, t) => {
		bob(pose, t, 100, 900, 4);
		bone(rig, pose, 'bow').angle = 5 * flick(t, 200, 2.2, 2.6);
		bone(rig, pose, 'ends').angle = -6 * flick(t, 260, 2, 2.4);
	}),
	// the letters: rarely, and small
	L1: idle(L1, 1100, (rig, pose, t) => {
		const jack = flick(t, 80, 2.2, 2.5);
		bone(rig, pose, 'leg_l').angle = 3 * jack;
		bone(rig, pose, 'leg_r').angle = -3 * jack;
		bob(pose, t, 120, 700, 3);
	}),
	L2: idle(L2, 1000, (rig, pose, t) => {
		bone(rig, pose, 'leg').angle = 3.6 * bump(t, 100, 500) - 1.2 * flick(t, 500, 3, 6);
		bone(rig, pose, 'arm').angle = -2.5 * bump(t, 150, 550);
	}),
	L3: idle(L3, 1000, (rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 5.5 * flick(t, 60, 2.4, 3);
	}),
	L4: idle(L4, 1000, (rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 3.6 * flick(t, 60, 2, 3);
	}),
	L5: idle(L5, 1100, (rig, pose, t) => {
		bone(rig, pose, 'one').dy = -3 * bump(t, 80, 420);
		bone(rig, pose, 'zero').dy = -3 * bump(t, 380, 760);
	}),
};

/** how often each is picked, relative: the specials most, the letters rarely */
export const IDLE_WEIGHT: Record<string, number> = { W: 4, S: 4, H1: 2.5, H2: 2.5, H3: 2.5, H4: 2.5, L1: 0.6, L2: 0.6, L3: 0.6, L4: 0.6, L5: 0.6 };
