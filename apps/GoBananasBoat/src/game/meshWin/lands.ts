/**
 * THE LANDINGS — what the high pays, the Scatter and the Wild do when their
 * reel stops, drawn through the same rigs and layers as their wins.
 *
 * The landing used to be a squash of the whole tile (SymbolSprite): the steel
 * panel flattened along with whatever was painted on it, which reads as a
 * sticker being pressed, not as a thing arriving. Here the panel stays put and
 * the SUBJECT takes the landing — the helmet sits down hard and its dome nods,
 * the mine and the net swing a little on what they hang from, the lantern rocks
 * and its flame jumps, the flags shiver, the captain bobs in his porthole.
 *
 * Small on purpose: it happens on most spins, on up to a dozen cells at once,
 * and has to read as weight, not as a celebration. No flash, no sweep, no dust
 * and no knock of the tile — those belong to the win, and the board's own mask
 * would swallow additive light here anyway.
 *
 * THE LETTERS TOO (2026-09-27). They kept the sprite squash for a while — they
 * land on every spin, and the squash seemed enough — but it pressed the steel
 * flat along with the paint, the "sticker" this file exists to get rid of,
 * on the symbols a player sees land most. So the steel stays put and the
 * paint lands, lighter than a high pay, each letter reacting through its own
 * shape: the A's legs splay, the K kicks, the Q's tail flicks, the J's hook
 * swings, the 1 and the 0 thud one after the other.
 *
 * Cost, measured (design: skinperf): ~70-95us to pose a letter's mesh on a
 * desktop CPU; the reels stop one after another, so a stop lands 4 cells at a
 * time, not 20 — well inside a frame even at four times that on a phone.
 *
 * `k` is the cell's impact (ReelSymbol): the Scatter and the Wild land harder.
 */
import { bump, flick, restPose, restRigid, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Helmet';
import { H2 } from './h2Mine';
import { H3 } from './h3Lantern';
import { H4 } from './h4Flags';
import { W } from './wCaptain';
import { S } from './sScatter';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { M } from './mReveal';

/** how long the act runs; the reel reports "landed" at 240ms as it always did */
export const LAND_MS = 480;

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** the thump every cut subject shares: pressed down onto the steel, rebound, rest */
const thump = (pose: Pose, t: number, k: number) => {
	pose.rigid = {
		...restRigid(),
		sx: 1 + k * track(t, [[0, 0], [60, 0.05, 'out'], [170, -0.015, 'out'], [300, 0, 'out']]),
		sy: 1 + k * track(t, [[0, 0], [60, -0.09, 'out'], [170, 0.03, 'out'], [300, 0, 'out']]),
	};
};

const land = (spec: MeshWinSpec, act: (rig: Rig, pose: Pose, t: number, k: number) => void): MeshWinSpec => ({
	...spec,
	durationMs: LAND_MS,
	landMs: 0,
	hitMs: 0,
	noDust: true,
	landing: true,
	pose: (rig, t, amp = 1) => {
		const pose = restPose(rig);
		act(rig, pose, t, amp);
		return pose;
	},
});

export const LANDS: Record<string, MeshWinSpec> = {
	H1: land(H1, (rig, pose, t, k) => {
		thump(pose, t, k);
		// the dome nods forward onto the collar, the hose kicks
		bone(rig, pose, 'dome').angle = 1.8 * k * flick(t, 40, 3, 6);
		bone(rig, pose, 'hose').angle = -2.4 * k * flick(t, 60, 3, 5);
	}),
	// it hangs: no thump, a small swing on the shackle
	H2: land(H2, (rig, pose, t, k) => {
		bone(rig, pose, 'ball').angle = 2.2 * k * flick(t, 20, 2, 4);
		bone(rig, pose, 'ball').along = 1 + 0.02 * k * bump(t, 20, 200);
	}),
	// bolted on: it rocks on the bracket and the flame jumps
	H3: land(H3, (rig, pose, t, k) => {
		bone(rig, pose, 'body').angle = 1.2 * k * flick(t, 30, 2.5, 5);
		bone(rig, pose, 'flame').along = 1 + 0.12 * k * bump(t, 30, 260);
		bone(rig, pose, 'flame').angle = -2 * k * flick(t, 60, 3, 5);
	}),
	H4: land(H4, (rig, pose, t, k) => {
		thump(pose, t, k * 0.7);
		const shiver = flick(t, 50, 3.4, 5);
		bone(rig, pose, 'cloth_l').angle = 0.9 * k * shiver;
		bone(rig, pose, 'tip_l').angle = 2.4 * k * flick(t, 90, 3.4, 5);
		bone(rig, pose, 'cloth_r').angle = -0.9 * k * shiver;
		bone(rig, pose, 'tip_r').angle = -2.4 * k * flick(t, 110, 3.4, 5);
	}),
	// it hangs: the net swings a little and bounces on the rope
	S: land(S, (rig, pose, t, k) => {
		bone(rig, pose, 'bunch').angle = 2 * k * flick(t, 20, 1.8, 3.5);
		bone(rig, pose, 'bunch').along = 1 + 0.03 * k * Math.max(0, flick(t, 40, 2.6, 4));
		bone(rig, pose, 'loose').angle = -2.5 * k * flick(t, 90, 2.4, 4);
	}),
	// the letters: a lighter thump, and each one's own limb
	L1: land(L1, (rig, pose, t, k) => {
		thump(pose, t, 0.8 * k);
		const splay = flick(t, 40, 3.2, 6);
		bone(rig, pose, 'leg_l').angle = 2.4 * k * splay;
		bone(rig, pose, 'leg_r').angle = -2.4 * k * splay;
	}),
	L2: land(L2, (rig, pose, t, k) => {
		thump(pose, t, 0.8 * k);
		bone(rig, pose, 'arm').angle = -3 * k * flick(t, 40, 3.2, 6);
		bone(rig, pose, 'leg').angle = 2.6 * k * flick(t, 80, 3.2, 6);
	}),
	L3: land(L3, (rig, pose, t, k) => {
		thump(pose, t, 0.9 * k);
		bone(rig, pose, 'tail').angle = 4.5 * k * flick(t, 60, 2.8, 5);
	}),
	L4: land(L4, (rig, pose, t, k) => {
		thump(pose, t, 0.75 * k);
		bone(rig, pose, 'hook').angle = 3 * k * flick(t, 60, 2.6, 5);
	}),
	// the 1 and the 0 thud in turn: the rigid squash, then each digit dips
	L5: land(L5, (rig, pose, t, k) => {
		thump(pose, t, 0.8 * k);
		bone(rig, pose, 'one').dy = 1.4 * k * bump(t, 30, 170);
		bone(rig, pose, 'zero').dy = 1.4 * k * bump(t, 90, 240);
	}),
	// THE CRATE (2026-10-03): it lands on most free spins, and stood stiff while
	// everything round it acted. Now the bundle is set down hard: it squats, the
	// canvas over its shoulders slumps and springs back up taut, the ropes take
	// it. Its own rig is the tarp's (mReveal.ts) — not the reveal: it stays put
	// and keeps its plate.
	M: land({ ...M, endsAway: false, plateUntilMs: undefined }, (rig, pose, t, k) => {
		thump(pose, t, 1.1 * k);
		bone(rig, pose, 'crate').across = 1 + 0.045 * k * Math.max(0, flick(t, 30, 2.6, 6));
		bone(rig, pose, 'top').along = 1 - 0.07 * k * flick(t, 40, 3, 5);
		bone(rig, pose, 'top').angle = 2.2 * k * flick(t, 90, 2.4, 5);
	}),
	// behind glass: the panel (not the rigid move, which would move the frame)
	// takes the bob, and he nods
	W: land(W, (rig, pose, t, k) => {
		const panel = bone(rig, pose, 'panel');
		// small: at the heaviest impact (1.5) a 2.5px bob folded the glass's rim
		// to 53%, just over the floor
		panel.along = 1 + k * track(t, [[0, 0], [60, -0.03, 'out'], [170, 0.012, 'out'], [300, 0, 'out']]);
		panel.dy = 1.6 * k * track(t, [[0, 0], [60, 1, 'out'], [170, -0.3, 'out'], [300, 0, 'out']]);
		bone(rig, pose, 'head').angle = 1.5 * k * flick(t, 50, 3, 6);
	}),
};
