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
 * The letters keep the sprite squash: they land on every spin, and a light
 * press of paint is all they need.
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
