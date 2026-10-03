/**
 * THE LANDINGS — what every symbol does when its reel stops, drawn through the
 * same rigs and layers as its win. Ported from Go Bananas Boat (its lands.ts).
 *
 * The landing used to be a squash of the whole tile (SymbolSprite): the slate
 * plate flattened along with whatever was painted on it, which reads as a
 * sticker being pressed, not as a thing arriving. Here the plate stays put and
 * the SUBJECT takes the landing — the hat sits down and its flaps bounce, the
 * grenade settles and its ring swings, the crate thumps and its lid knocks, the
 * lantern drops and its bail rings, the letters and the Wild press into their
 * panels with one limb each answering.
 *
 * Small on purpose. It happens on most spins, on up to fifteen cells, and has
 * to read as WEIGHT, not as a celebration: no flash, no sweep, no sparks, no
 * dust and no cell pop — those belong to the win (meshRig `landing`).
 *
 * `k` is the cell's impact (ReelSymbol LANDING_IMPACT: the Scatter 1.25 and the
 * Wild 1.2 land harder, the letters 0.7). check_mesh_wins.mjs poses every
 * landing at AMP_MAX, so each bone's base number here is held under its
 * measured limit divided by 1.5 — the heaviest landing is the one measured.
 */
import { bump, flick, restPose, restRigid, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Ushanka';
import { H2 } from './h2Flare';
import { H3 } from './h3Sled';
import { H4 } from './h4Lantern';
import { L1, L2, L3, L4, L5, W, S } from './panelWins';

/** how long the act runs; the reel still reports "landed" at 240ms */
export const LAND_MS = 480;

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** CUT mode: the subject pressed down onto the slate about its feet, rebound,
 *  rest. Rigid, so it folds no triangle at any k. */
const thump = (pose: Pose, t: number, k: number) => {
	pose.rigid = {
		...restRigid(),
		sx: 1 + k * track(t, [[0, 0], [60, 0.05, 'out'], [170, -0.015, 'out'], [300, 0, 'out']]),
		sy: 1 + k * track(t, [[0, 0], [60, -0.085, 'out'], [170, 0.028, 'out'], [300, 0, 'out']]),
	};
};

/** PANEL mode: the same press, on the `panel` bone. A rigid move would carry
 *  the frame with it, which the gate forbids in panel mode — the frame is nailed
 *  down and only what is inside it lands. The panel's axis is UP and its pivot
 *  is the inner bottom edge, so a shorter `along` is the art pressed down. */
const press = (rig: Rig, pose: Pose, t: number, k: number) => {
	const p = bone(rig, pose, 'panel');
	p.along = 1 + k * track(t, [[0, 0], [60, -0.05, 'out'], [170, 0.015, 'out'], [300, 0, 'out']]);
	p.across = 1 + k * track(t, [[0, 0], [60, 0.03, 'out'], [170, -0.009, 'out'], [300, 0, 'out']]);
};

const land = (spec: MeshWinSpec, act: (rig: Rig, pose: Pose, t: number, k: number) => void): MeshWinSpec => ({
	...spec,
	durationMs: LAND_MS,
	landMs: 0,
	hitMs: 0,
	landing: true,
	pose: (rig, t, amp = 1) => {
		const pose = restPose(rig);
		act(rig, pose, t, amp);
		return pose;
	},
});

export const LANDS: Record<string, MeshWinSpec> = {
	// the hat sits down; the flaps carry on bouncing after it has stopped
	H1: land(H1, (rig, pose, t, k) => {
		thump(pose, t, k);
		const bounce = flick(t, 50, 3.2, 6);
		bone(rig, pose, 'flap_l').angle = 3 * k * bounce;
		bone(rig, pose, 'flap_r').angle = -3 * k * flick(t, 70, 3, 5.5);
		bone(rig, pose, 'goggles').angle = 1.5 * k * flick(t, 40, 3.6, 7);
	}),
	// it is stood on end: a short settle, and the ring swings on its hinge
	H2: land(H2, (rig, pose, t, k) => {
		thump(pose, t, 0.6 * k);
		bone(rig, pose, 'cap').angle = 1 * k * flick(t, 40, 3.4, 7);
		bone(rig, pose, 'ring').angle = 4 * k * flick(t, 50, 2.4, 4.5);
	}),
	// the heaviest thing on the board: a hard thump, and the lid knocks once
	H3: land(H3, (rig, pose, t, k) => {
		thump(pose, t, 1.15 * k);
		bone(rig, pose, 'box').angle = 1.2 * k * flick(t, 50, 3, 6);
		bone(rig, pose, 'lid').angle = 1.6 * k * flick(t, 70, 3.2, 6);
	}),
	// it drops onto its base and the bail rings back and forth
	H4: land(H4, (rig, pose, t, k) => {
		thump(pose, t, k);
		bone(rig, pose, 'bail').angle = 3.2 * k * flick(t, 50, 2.6, 4.5);
	}),

	// THE LETTERS: a lighter press, and each one's own limb answering it
	L1: land(L1, (rig, pose, t, k) => {
		press(rig, pose, t, k);
		const splay = flick(t, 50, 3.2, 6);
		bone(rig, pose, 'left').angle = 1.4 * k * splay;
		bone(rig, pose, 'right').angle = -1.4 * k * splay;
	}),
	L2: land(L2, (rig, pose, t, k) => {
		press(rig, pose, t, k);
		bone(rig, pose, 'leg').angle = -1.6 * k * flick(t, 50, 3.2, 6);
		bone(rig, pose, 'arm').angle = 1.4 * k * flick(t, 90, 3.2, 6);
	}),
	L3: land(L3, (rig, pose, t, k) => {
		press(rig, pose, t, k);
		bone(rig, pose, 'tail').angle = 2.6 * k * flick(t, 60, 2.8, 5);
	}),
	L4: land(L4, (rig, pose, t, k) => {
		press(rig, pose, t, k);
		bone(rig, pose, 'hook').angle = 3 * k * flick(t, 60, 2.6, 5);
	}),
	// the 1 and the 0 thud one after the other, the way a pair is set down
	L5: land(L5, (rig, pose, t, k) => {
		press(rig, pose, t, k);
		bone(rig, pose, 'one').dy = 2 * k * bump(t, 20, 150);
		bone(rig, pose, 'zero').dy = 2 * k * bump(t, 70, 200);
	}),

	// THE WILD: his head nods into the press, the goggles and the banana lag it
	W: land(W, (rig, pose, t, k) => {
		press(rig, pose, t, 0.8 * k);
		bone(rig, pose, 'head').angle = 0.8 * k * flick(t, 50, 3, 6);
		bone(rig, pose, 'goggles').angle = -1.6 * k * flick(t, 70, 3.2, 6);
		bone(rig, pose, 'banana').angle = 2 * k * flick(t, 80, 3, 5);
	}),
	// THE SCATTER: the bunch settles and the bow's two loops flutter
	S: land(S, (rig, pose, t, k) => {
		// a lighter press than the letters: the bunch fills its panel almost to
		// the frame, and at full press the corner of the panel stretched 1.74x
		// against the nailed-down frame (gate, AMP_MAX)
		press(rig, pose, t, 0.55 * k);
		bone(rig, pose, 'bunch').angle = 1.2 * k * flick(t, 40, 2.6, 5);
		bone(rig, pose, 'bow_l').angle = 3 * k * flick(t, 60, 3.2, 5);
		bone(rig, pose, 'bow_r').angle = -3 * k * flick(t, 80, 3.2, 5);
	}),
};
