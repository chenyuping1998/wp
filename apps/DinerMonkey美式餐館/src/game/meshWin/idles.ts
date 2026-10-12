/**
 * THE BOARD BETWEEN SPINS — small idle acts, so a settled board is never a
 * still picture (Jade Teahouse's idles.ts and director, on the Diner rigs).
 *
 * When the board has been still for a moment the idle director
 * (game/idleDirector.ts, run by IdleDirector.svelte) picks a cell every few
 * seconds — now and then a second just after, like a reaction — and the
 * symbol there does a little thing of its own through the same rig as its win:
 *
 *   H1  the burger's top bun lifts a hair and plops back down
 *   H2  the cherry and straw sway as if someone bumped the counter
 *   H3  the sausage tip wiggles out of the bun
 *   H4  the pie point sags and springs back
 *   W   the Chef tips his hat
 *   S   the bell's button is tapped: down, and a ring
 *   P   the order ticket flutters on its spike (only a tray without a prize)
 *   L*  the letters, rarely: each one gesture from its shape
 *
 * Smaller than a win, no rigid move (the dish never leaves its card), and no
 * light: it must read as life, not as a win the player did not get.
 */
import { bump, flick, restPose, settled, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1, H2, H3, H4, W, S } from './dinerWins';
import { L1, L2, L3, L4, L5 } from './lowLetters';
import { P_BASE, P_LIMITS } from './pTray';

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

export const IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1300, (rig, pose, t) => {
		const bun = bone(rig, pose, 'accent');
		bun.dy = -2.6 * bump(t, 80, 520) + 0.8 * flick(t, 520, 5, 8);
		bun.angle = 1.8 * flick(t, 520, 4.5, 7);
	}),
	H2: idle(H2, 1500, (rig, pose, t) => {
		bone(rig, pose, 'accent').angle = 5 * flick(t, 80, 1.8, 2.4);
	}),
	H3: idle(H3, 1300, (rig, pose, t) => {
		bone(rig, pose, 'accent').angle = 3.5 * Math.sin((2 * Math.PI * t) / 330) * bump(t, 60, 1100);
	}),
	H4: idle(H4, 1200, (rig, pose, t) => {
		bone(rig, pose, 'accent').angle = -4 * bump(t, 80, 480) + 2 * flick(t, 480, 4, 6);
	}),
	W: idle(W, 1700, (rig, pose, t) => {
		// a tip of the hat: up and over, held, and back
		const hat = bone(rig, pose, 'accent');
		hat.angle = track(t, [[0, 0], [200, 0], [480, -6, 'inOut'], [900, -6], [1250, 0, 'inOut']]) + 1.2 * flick(t, 1250, 4, 6);
		hat.dy = -2.5 * bump(t, 200, 1250);
	}),
	S: idle(S, 1300, (rig, pose, t) => {
		// tapped: the button goes down, comes up, and rings
		const button = bone(rig, pose, 'accent');
		button.dy = 2.8 * bump(t, 80, 260) - 1.2 * Math.max(0, flick(t, 260, 6, 8));
		button.angle = 2 * flick(t, 300, 7, 4);
	}),
	P: idle({ ...P_BASE, limits: P_LIMITS }, 1200, (rig, pose, t) => {
		bone(rig, pose, 'ticket').angle = 4 * flick(t, 80, 2.4, 3);
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
		// Bangers' short wedge tail flicks
		bone(rig, pose, 'tail').angle = 6 * flick(t, 60, 2.2, 3);
	}),
	L4: idle(L4, 1000, (_rig, pose, t) => {
		pose.rigid.rot = 2.5 * flick(t, 60, 2, 3);
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
