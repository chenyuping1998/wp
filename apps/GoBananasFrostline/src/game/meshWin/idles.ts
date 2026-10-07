/**
 * THE BOARD BETWEEN SPINS — small idle acts, so a settled board is never a
 * still picture. Ported from Go Bananas Boat's idles.ts, acted for this set.
 *
 * When the board has stood still for a moment, the idle director
 * (game/idleDirector.ts, run by IdleDirector.svelte) picks one cell every few
 * seconds — now and then a second one just after, like a reaction — and the
 * symbol there does a little thing of its own, through the same rig and
 * layers as its win (SymbolSprite draws it in place of the sprite):
 *
 *   H1  the fur hat gives a little hop and its flaps flutter after it
 *   H2  the grenade wobbles on its base and its pull ring swings
 *   H3  the crate's lid lifts a crack — peeking — and drops shut
 *   H4  the lantern bobs and its bail rings
 *   W   the gorilla chews his banana; the goggles twitch
 *   S   the bow's two loops flutter, the bunch sways
 *   L*  the letters, rarely: each a gesture from its shape
 *
 * Smaller than a win and with no light: no flash, no sweep, no sparks, no
 * frame — this plays under the board's mask, and it must read as life, not as
 * a win the player did not get.
 *
 * Each act is held under its bone's measured limit (check_mesh_wins gates
 * every one, as `H1:idle` etc.).
 */
import { bump, flick, restPose, restRigid, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Ushanka';
import { H2 } from './h2Flare';
import { H3 } from './h3Sled';
import { H4 } from './h4Lantern';
import { L1, L2, L3, L4, L5, W, S } from './panelWins';

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

const idle = (spec: MeshWinSpec, ms: number, act: (rig: Rig, pose: Pose, t: number) => void): MeshWinSpec => ({
	...spec,
	durationMs: ms,
	landMs: 0,
	hitMs: 0,
	landing: true,
	pose: (rig, t) => {
		const pose = restPose(rig);
		act(rig, pose, t);
		return pose;
	},
});

/** CUT mode: a small lift and a soft landing, rigid — costs the mesh nothing */
const bob = (pose: Pose, t: number, from: number, to: number, px: number) => {
	const up = bump(t, from, to);
	pose.rigid = {
		...restRigid(),
		dy: -px * up,
		sy: 1 - 0.03 * (bump(t, from - 60, from + 60) + bump(t, to - 60, to + 60)) + 0.018 * up,
		sx: 1 + 0.022 * (bump(t, from - 60, from + 60) + bump(t, to - 60, to + 60)) - 0.01 * up,
	};
	pose.air = 0.35 * up;
};

/** PANEL mode: the same lift on the panel bone — the frame stays nailed */
const lift = (rig: Rig, pose: Pose, t: number, from: number, to: number, px: number) => {
	bone(rig, pose, 'panel').dy = -px * bump(t, from, to);
};

export const IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1100, (rig, pose, t) => {
		bob(pose, t, 80, 520, 5);
		bone(rig, pose, 'flap_l').angle = 2.6 * flick(t, 420, 2.6, 4);
		bone(rig, pose, 'flap_r').angle = -2.6 * flick(t, 460, 2.4, 4);
	}),
	H2: idle(H2, 1200, (rig, pose, t) => {
		// a wobble on its base: rigid, about the feet
		pose.rigid = { ...restRigid(), rot: 3 * flick(t, 60, 2.2, 3.2) };
		bone(rig, pose, 'ring').angle = 5 * flick(t, 160, 1.9, 2.8);
	}),
	H3: idle(H3, 1100, (rig, pose, t) => {
		// the lid lifts a crack and drops back with a knock
		bone(rig, pose, 'lid').angle = track(t, [[0, 0], [260, 3, 'out'], [520, 3], [640, -0.6, 'in'], [800, 0, 'out']]);
		bone(rig, pose, 'box').angle = 0.9 * flick(t, 640, 3, 6);
	}),
	H4: idle(H4, 1300, (rig, pose, t) => {
		bob(pose, t, 60, 420, 4);
		bone(rig, pose, 'bail').angle = 4.5 * flick(t, 200, 2, 2.6);
	}),
	W: idle(W, 1300, (rig, pose, t) => {
		// two chews: the banana dips and rises in his teeth
		bone(rig, pose, 'banana').angle = 3 * (bump(t, 120, 380) - bump(t, 380, 640)) + 2.4 * bump(t, 700, 960);
		bone(rig, pose, 'goggles').angle = 1.8 * flick(t, 300, 3, 5);
		bone(rig, pose, 'head').angle = 0.8 * bump(t, 100, 1000);
	}),
	S: idle(S, 1300, (rig, pose, t) => {
		bone(rig, pose, 'bunch').angle = 1.5 * flick(t, 40, 1.6, 2.6);
		bone(rig, pose, 'bow_l').angle = 4 * flick(t, 120, 2.4, 3.2);
		bone(rig, pose, 'bow_r').angle = -4 * flick(t, 200, 2.4, 3.2);
	}),
	L1: idle(L1, 900, (rig, pose, t) => {
		lift(rig, pose, t, 60, 420, 3);
		const splay = flick(t, 300, 2.6, 4);
		bone(rig, pose, 'left').angle = 1.6 * splay;
		bone(rig, pose, 'right').angle = -1.6 * splay;
	}),
	L2: idle(L2, 900, (rig, pose, t) => {
		bone(rig, pose, 'leg').angle = -2.4 * flick(t, 60, 2.4, 3.6);
		bone(rig, pose, 'arm').angle = 2 * flick(t, 220, 2.4, 3.6);
	}),
	L3: idle(L3, 900, (rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 3.6 * flick(t, 60, 2.2, 3.2);
	}),
	L4: idle(L4, 900, (rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 4.5 * flick(t, 60, 2, 3);
	}),
	L5: idle(L5, 900, (rig, pose, t) => {
		bone(rig, pose, 'one').dy = -2.4 * bump(t, 60, 360);
		bone(rig, pose, 'zero').dy = -2.4 * bump(t, 260, 560);
	}),
};

/** how often each symbol is picked: the specials most, the letters rarely */
export const IDLE_WEIGHT: Record<string, number> = {
	W: 4,
	S: 4,
	H1: 2.5,
	H2: 2.5,
	H3: 2.5,
	H4: 2.5,
	L1: 0.6,
	L2: 0.6,
	L3: 0.6,
	L4: 0.6,
	L5: 0.6,
};
