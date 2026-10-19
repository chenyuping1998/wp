/**
 * THE BOARD BETWEEN SPINS — small idle acts, so a settled board is never a
 * still picture (GoBananasBoat's idles.ts and director, ported 2026-10-04 with
 * this game's acts).
 *
 * When the board has stood still for a moment, the idle director
 * (game/idleDirector.ts, run by IdleDirector.svelte) picks one cell every few
 * seconds — now and then a second one just after, like a reaction — and the
 * symbol there does a little thing of its own, through the same rig as its win
 * (Symbol.svelte draws it in place of the sprite):
 *
 *   H1  the lantern rocks on its ring; the banana turns over in the elixir
 *   H2  the crystals shimmer open and closed
 *   H3  the tongs click twice; the orb wobbles on its collar
 *   H4  the still-coil boings; the flasks clink in the cart
 *   W   the goggles slip and are pushed back; a chew on the banana
 *   S   the seal rocks on its edge; the bunch bobs
 *   L*  the letters, rarely: each a gesture from its shape
 *
 * Smaller than a win and with no light at all, and every act stays INSIDE its
 * panel (the rigid move is never used, the frame never moves): it must read as
 * life, not as a win the player did not get.
 */
import { bump, flick, restPose, settled, track, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1 } from './h1Lantern';
import { H2 } from './h2Crystal';
import { H3 } from './h3Tongs';
import { H4 } from './h4Cart';
import { W } from './wGorilla';
import { S } from './sMedallion';
import { L1, L2, L3, L4, L5 } from './lowLetters';

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

const idle = (spec: MeshWinSpec, ms: number, act: (rig: Rig, pose: Pose, t: number) => void): MeshWinSpec =>
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
	H1: idle(H1, 1700, (rig, pose, t) => {
		bone(rig, pose, 'body').angle = 1.4 * flick(t, 80, 1.1, 1.6);
		const live = bump(t, 60, 1500);
		bone(rig, pose, 'elixir').angle = -1.6 * flick(t, 220, 1.1, 1.8);
		const banana = bone(rig, pose, 'banana');
		banana.angle = 6 * live * Math.sin((2 * Math.PI * (t - 60)) / 1400);
		banana.dy = -2 * live;
	}),
	H2: idle(H2, 1300, (rig, pose, t) => {
		const shimmer = flick(t, 80, 2, 2.4);
		bone(rig, pose, 'left').angle = -1.4 * shimmer;
		bone(rig, pose, 'right').angle = 1.4 * shimmer;
		const spire = bone(rig, pose, 'spire');
		spire.across = 1 + 0.04 * bump(t, 120, 700);
	}),
	H3: idle(H3, 1200, (rig, pose, t) => {
		// click, click
		const snap = track(t, [[0, 0], [100, -0.6, 'out'], [190, 0.45, 'in'], [330, -0.5, 'out'], [420, 0.45, 'in'], [620, 0, 'out']]);
		bone(rig, pose, 'claw_a').angle = 2.6 * snap;
		bone(rig, pose, 'claw_b').angle = -2.6 * snap;
		bone(rig, pose, 'loop').angle = -1.4 * snap;
		const orb = bone(rig, pose, 'orb');
		orb.angle = 2.4 * flick(t, 200, 1.6, 2);
		orb.along = orb.across = 1 + 0.04 * bump(t, 150, 650);
	}),
	H4: idle(H4, 1400, (rig, pose, t) => {
		const coil = bone(rig, pose, 'coil');
		coil.along = 1 - 0.05 * bump(t, 40, 200) + 0.06 * flick(t, 200, 3.2, 2.4);
		coil.angle = 2 * flick(t, 220, 2.1, 2.4);
		const load = bone(rig, pose, 'load');
		load.dy = 2 * bump(t, 120, 320);
		load.angle = 1.2 * flick(t, 260, 2.2, 2.8);
	}),
	W: idle(W, 1800, (rig, pose, t) => {
		// the goggles slip down a touch... and are shoved back up
		const goggles = bone(rig, pose, 'goggles');
		goggles.dy = track(t, [[0, 0], [300, 1.6, 'inOut'], [700, 1.6], [820, -1.8, 'out'], [1000, 0, 'inOut']]) - 0.6 * flick(t, 1000, 4, 6);
		goggles.angle = 1.4 * flick(t, 820, 2.6, 3.5);
		// and a chew
		const bite = bump(t, 1100, 1250) + bump(t, 1350, 1500);
		const jaw = bone(rig, pose, 'jaw');
		jaw.along = 1 - 0.04 * bite;
		jaw.dy = -1.6 * bite;
		bone(rig, pose, 'banana').angle = 2.4 * (flick(t, 1100, 3, 3.5) + 0.7 * flick(t, 1350, 3, 3.5));
		bone(rig, pose, 'head').angle = 0.7 * bump(t, 700, 1600);
	}),
	S: idle(S, 1600, (rig, pose, t) => {
		const rock = Math.exp(-Math.max(0, t - 80) / 520) * Math.sin((2 * Math.PI * Math.max(0, t - 80)) / 360);
		bone(rig, pose, 'medal').angle = 0;
		const bunch = bone(rig, pose, 'bunch');
		bunch.dy = -2 * bump(t, 200, 900);
		bone(rig, pose, 'upper').angle = 1.6 * Math.max(0, flick(t, 300, 1.6, 2.4));
	}),
	// the letters: rarely, and small
	L1: idle(L1, 1100, (rig, pose, t) => {
		const jack = flick(t, 80, 2.2, 2.5);
		bone(rig, pose, 'leg_l').angle = 1.8 * jack;
		bone(rig, pose, 'leg_r').angle = -1.8 * jack;
	}),
	L2: idle(L2, 1000, (rig, pose, t) => {
		bone(rig, pose, 'leg').angle = -2.6 * bump(t, 100, 500) + 1 * flick(t, 500, 3, 6);
		bone(rig, pose, 'arm').angle = 2 * bump(t, 150, 550);
	}),
	L3: idle(L3, 1000, (rig, pose, t) => {
		bone(rig, pose, 'tail').angle = 4 * flick(t, 60, 2.4, 3);
	}),
	L4: idle(L4, 1000, (rig, pose, t) => {
		bone(rig, pose, 'hook').angle = 3.6 * flick(t, 60, 2, 3);
	}),
	L5: idle(L5, 1100, (rig, pose, t) => {
		bone(rig, pose, 'one').dy = -2.4 * bump(t, 80, 420);
		bone(rig, pose, 'zero').dy = -2.4 * bump(t, 380, 760);
	}),
};

/** how often each is picked, relative: the specials most, the letters rarely */
export const IDLE_WEIGHT: Record<string, number> = { W: 4, S: 4, H1: 2.5, H2: 2.5, H3: 2.5, H4: 2.5, L1: 0.6, L2: 0.6, L3: 0.6, L4: 0.6, L5: 0.6 };
