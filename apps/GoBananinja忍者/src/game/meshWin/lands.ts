/**
 * THE LANDINGS — what every symbol does when its reel stops, drawn through the
 * same rigs and layers as its win (GoBananasBoat's lands.ts, with this game's
 * acting).
 *
 * The landing used to be a squash of the whole tile (SymbolSprite): the slate
 * panel flattened along with whatever was painted on it, which reads as a
 * sticker being pressed, not as a thing arriving. Here the panel stays put and
 * the SUBJECT takes the landing — the kabuto sits down hard and its horns
 * twang, the shuriken bites and its blades quiver, the bomb's fuse jerks and
 * its smoke puffs, the fan shivers and its tassels swing, the bananas' bow
 * flaps, the ninja's headband tails flick, and each letter answers through its
 * own shape.
 *
 * Small on purpose: it happens on most spins, on up to twenty cells, and has
 * to read as weight, not as a celebration. No flash, no sweep, no dust, no
 * knock of the tile — those belong to the win, and the board's mask would
 * swallow additive light here anyway.
 *
 * `k` is the cell's impact (ReelSymbol): the Scatter and the Wild land harder.
 */
import { bump, flick, restPose, restRigid, track, turnAbout, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Kabuto';
import { H2 } from './h2Shuriken';
import { H3 } from './h3Bomb';
import { H4 } from './h4Fan';
import { W } from './wNinja';
import { S } from './sBananas';
import { L1, L2, L3, L4, L5 } from './lowLetters';

/** how long the act runs; the reel reports "landed" at 240ms as it always did */
export const LAND_MS = 480;

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** the thump every cut subject shares: pressed down onto the slate, rebound, rest */
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
	smear: undefined,
	pose: (rig, t, amp = 1) => {
		const pose = restPose(rig);
		act(rig, pose, t, amp);
		return pose;
	},
});

export const LANDS: Record<string, MeshWinSpec> = {
	H1: land(H1, (rig, pose, t, k) => {
		thump(pose, t, k);
		// the horns twang on the impact, the guards slap, the knot swings
		bone(rig, pose, 'horn_l').angle = -2.2 * k * flick(t, 30, 7, 7);
		bone(rig, pose, 'horn_r').angle = 2.2 * k * flick(t, 45, 7, 7);
		bone(rig, pose, 'guard_l').angle = 1.6 * k * flick(t, 40, 3.4, 6);
		bone(rig, pose, 'guard_r').angle = -1.6 * k * flick(t, 40, 3.4, 6);
		bone(rig, pose, 'knot').angle = 3 * k * flick(t, 60, 2.6, 5);
	}),
	H2: land(H2, (rig, pose, t, k) => {
		thump(pose, t, 0.8 * k);
		// it bites into the slate with a small turn, and the blades quiver
		pose.rigid.rot = 2.5 * k * flick(t, 0, 2.6, 6);
		turnAbout(pose.rigid, [128, 129], H2.feetY);
		for (const n of ['blade_tl', 'blade_tr', 'blade_br', 'blade_bl']) bone(rig, pose, n).angle = 1.2 * k * flick(t, 40, 6, 8);
	}),
	H3: land(H3, (rig, pose, t, k) => {
		thump(pose, t, 1.1 * k);
		bone(rig, pose, 'fuse').angle = -5 * k * flick(t, 40, 3.5, 5);
		const puff = bump(t, 30, 380);
		bone(rig, pose, 'smoke_l').along = 1 + 0.05 * k * puff;
		bone(rig, pose, 'smoke_t').along = 1 + 0.05 * k * puff;
		bone(rig, pose, 'smoke_r').along = 1 + 0.05 * k * puff;
	}),
	H4: land(H4, (rig, pose, t, k) => {
		thump(pose, t, 0.7 * k);
		const shiver = flick(t, 40, 4, 6);
		bone(rig, pose, 'fan_l').angle = -1.6 * k * shiver;
		bone(rig, pose, 'fan_r').angle = 1.6 * k * shiver;
		bone(rig, pose, 'tassel_l').angle = 4 * k * flick(t, 60, 2.4, 4);
		bone(rig, pose, 'tassel_r').angle = 4 * k * flick(t, 80, 2.4, 4);
	}),
	S: land(S, (rig, pose, t, k) => {
		thump(pose, t, k);
		bone(rig, pose, 'bow').angle = 4 * k * flick(t, 50, 3, 4);
		bone(rig, pose, 'ends').angle = -4 * k * flick(t, 80, 3, 4);
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
		bone(rig, pose, 'tail').angle = 4 * k * flick(t, 60, 2.8, 5);
	}),
	L4: land(L4, (rig, pose, t, k) => {
		thump(pose, t, 0.75 * k);
		bone(rig, pose, 'hook').angle = 2.6 * k * flick(t, 60, 2.6, 5);
	}),
	L5: land(L5, (rig, pose, t, k) => {
		thump(pose, t, 0.8 * k);
		bone(rig, pose, 'one').dy = 1.4 * k * bump(t, 30, 170);
		bone(rig, pose, 'zero').dy = 1.4 * k * bump(t, 90, 240);
	}),
	// painted edge to edge: the panel (never the rigid move, which would move
	// the frame) takes a small bob, and his headband tails flick
	W: land(W, (rig, pose, t, k) => {
		bone(rig, pose, 'panel').dy = 1.2 * k * track(t, [[0, 0], [60, 1, 'out'], [170, -0.3, 'out'], [300, 0, 'out']]);
		bone(rig, pose, 'tail_up').angle = 2.4 * k * flick(t, 40, 2.6, 4);
		bone(rig, pose, 'tail_up_tip').angle = 5 * k * flick(t, 90, 2.6, 4);
		bone(rig, pose, 'tail_lo').angle = -1.8 * k * flick(t, 60, 2.4, 4);
		bone(rig, pose, 'tail_lo_tip').angle = -4.5 * k * flick(t, 110, 2.4, 4);
	}),
};
