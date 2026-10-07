/**
 * THE BOARD BETWEEN SPINS — small idle acts, so a settled board is never a
 * still picture (asked for 2026-10-02: "the most important one, make it
 * attractive to players").
 *
 * When the board has stood still for a moment, the idle director
 * (game/idleDirector.ts, run by IdleDirector.svelte) picks one cell every few
 * seconds — now and then a second one just after, like a reaction — and the
 * symbol there does a little thing of its own, through the same rig and
 * layers as its win (SymbolSprite draws it in place of the sprite):
 *
 *   H1  the helmet peeks: rises a touch and looks left, then right; the hose
 *       swishes after it and two bubbles escape the valve
 *   H2  the mine gets nervous: a shiver, then it swings on its shackle
 *   H3  the lantern's flame gutters and flares, the lamp rocks, embers rise
 *   H4  a gust: both flags ripple out and fall slack
 *   W   the captain looks round his porthole and takes two chomps of banana
 *   S   the net of bananas sways on its hook, the loose ones wag
 *   L*  the letters, rarely: each a gesture from its shape
 *
 * Smaller than a win and with no light: no flash, no sweep, no impact frame —
 * this plays under the board's mask, where additive light draws nothing, and
 * it must read as life, not as a win the player did not get.
 */
import { bump, flick, restPose, restRigid, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Helmet';
import { H2 } from './h2Mine';
import { H3 } from './h3Lantern';
import { H4 } from './h4Flags';
import { W } from './wCaptain';
import { S } from './sScatter';
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
		// a hint of squash at each end of it
		sy: 1 - 0.035 * (bump(t, from - 60, from + 60) + bump(t, to - 60, to + 60)) + 0.02 * up,
		sx: 1 + 0.025 * (bump(t, from - 60, from + 60) + bump(t, to - 60, to + 60)) - 0.012 * up,
	};
	pose.air = 0.35 * up;
};

export const IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1700, (rig, pose, t) => {
		bob(pose, t, 120, 1400, 4);
		// look left... hold... look right... hold... home
		const look = track(t, [[0, 0], [220, 0], [420, 1, 'out'], [700, 1], [900, -1, 'inOut'], [1200, -1], [1450, 0, 'inOut']]);
		bone(rig, pose, 'dome').angle = 3.2 * look;
		// and the whole helmet cocks its head with the look (rigid: free)
		pose.rigid.rot = 3.5 * look;
		// the hose follows a beat behind each turn
		const lag = track(t, [[0, 0], [300, 0], [520, 1, 'out'], [800, 1], [1020, -1, 'inOut'], [1300, -1], [1560, 0, 'inOut']]);
		bone(rig, pose, 'hose').angle = -5 * lag + 1.5 * flick(t, 1500, 3, 6);
	}),
	H2: idle(H2, 1700, (rig, pose, t) => {
		// a shiver first — something brushed it — then it swings
		const shiver = t < 260 ? Math.sin(t / 11) * (1 - t / 260) : 0;
		pose.rigid = { ...restRigid(), dx: 1.6 * shiver };
		bone(rig, pose, 'ball').angle = 5 * flick(t, 220, 1.3, 1.9);
	}),
	H3: idle(H3, 1600, (rig, pose, t) => {
		const gutter = bump(t, 80, 1400);
		bone(rig, pose, 'flame').along = 1 + 0.16 * gutter * (0.55 + 0.45 * Math.sin(t / 47));
		bone(rig, pose, 'flame').across = 1 - 0.06 * gutter * Math.sin(t / 61);
		bone(rig, pose, 'flame').angle = 4 * gutter * Math.sin(t / 83);
		bone(rig, pose, 'body').angle = 2.8 * flick(t, 120, 1.5, 2);
	}),
	H4: idle(H4, 1500, (rig, pose, t) => {
		const gust = bump(t, 60, 1350);
		const w = (2 * Math.PI * t) / 300;
		bone(rig, pose, 'cloth_l').angle = 2 * gust * Math.sin(w);
		bone(rig, pose, 'tip_l').angle = 6.5 * gust * Math.sin(w - 1.2);
		bone(rig, pose, 'cloth_r').angle = -1.6 * gust * Math.sin(w - 0.4);
		// the right cloth smaller: its mesh is the tight one (it is at the gate's limit in the win)
		bone(rig, pose, 'tip_r').angle = -4.6 * gust * Math.sin(w - 1.6);
		for (const n of ['tip_l', 'tip_r']) bone(rig, pose, n).along = 1 + 0.03 * gust * (0.5 + 0.5 * Math.sin(w - 1.4));
	}),
	W: idle(W, 1800, (rig, pose, t) => {
		const look = track(t, [[0, 0], [150, 0], [400, 1, 'out'], [650, 1], [900, -1, 'inOut'], [1150, -1], [1450, 0, 'inOut']]);
		bone(rig, pose, 'head').angle = 3.2 * look;
		bone(rig, pose, 'banana').angle = 7 * flick(t, 1100, 3, 4) + 5.5 * flick(t, 1350, 3, 4);
		// he leans out to look: the portrait rises in the glass a little
		bone(rig, pose, 'panel').dy = -2.4 * bump(t, 300, 1500);
		// each chomp thumps the porthole, as in his win
		pose.plateHit = 1 + 0.028 * bump(t, 1080, 1220) + 0.024 * bump(t, 1330, 1470);
	}),
	S: idle(S, 1800, (rig, pose, t) => {
		bone(rig, pose, 'bunch').angle = 6.5 * flick(t, 60, 1.1, 1.5);
		bone(rig, pose, 'loose').angle = -4.5 * flick(t, 220, 1.7, 2);
	}),
	// the letters: rarely, and small
	L1: idle(L1, 1100, (rig, pose, t) => {
		// a jumping jack: legs out, in, out
		const jack = flick(t, 80, 2.2, 2.5);
		bone(rig, pose, 'leg_l').angle = 3 * jack;
		bone(rig, pose, 'leg_r').angle = -3 * jack;
		bob(pose, t, 120, 700, 3);
	}),
	L2: idle(L2, 1000, (rig, pose, t) => {
		bone(rig, pose, 'leg').angle = 4 * bump(t, 100, 500) - 1.2 * flick(t, 500, 3, 6);
		bone(rig, pose, 'arm').angle = -2.5 * bump(t, 150, 550);
	}),
	L3: idle(L3, 1000, (rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 6 * flick(t, 60, 2.4, 3);
	}),
	L4: idle(L4, 1000, (rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 3.8 * flick(t, 60, 2, 3);
	}),
	L5: idle(L5, 1100, (rig, pose, t) => {
		// the 1 hops, then the 0
		bone(rig, pose, 'one').dy = -3 * bump(t, 80, 420);
		bone(rig, pose, 'zero').dy = -3 * bump(t, 380, 760);
	}),
};

/** how often each is picked, relative: the specials most, the letters rarely */
export const IDLE_WEIGHT: Record<string, number> = { W: 4, S: 4, H1: 2.5, H2: 2.5, H3: 2.5, H4: 2.5, L1: 0.6, L2: 0.6, L3: 0.6, L4: 0.6, L5: 0.6 };
