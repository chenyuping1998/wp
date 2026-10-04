/**
 * THE BOARD BETWEEN SPINS — small idle acts, so a settled board is never a
 * still picture (GoBananasBoat's system, ported to Go Bananeon 2026-10-03).
 *
 * When the board has stood still for a moment, the idle director
 * (game/idleDirector.ts, run by IdleDirector.svelte) picks one cell every few
 * seconds — now and then a second one just after, like a reaction — and the
 * symbol there does a little thing of its own, through the same rig as its
 * win (neonSymbols.ts). Symbol.svelte plays it through SymbolMeshWin in place
 * of the sprite:
 *
 *   H1  the boombox thumps twice, both speakers pumping, the handle rattling
 *   H2  the visor peeks open and snaps shut
 *   H3  the can gives a little rattle, then a puff of mist
 *   H4  the sneaker taps its toe twice, the laces and heel tab flick
 *   W   the gorilla nods to a beat only he hears, the horns hand bobbing
 *   S   the bunch wobbles like jelly, the stem flicks
 *   L*  the letters, rarely: a little tilt and wobble
 *
 * Smaller than a win and with no light: no flash, no sweep, no sparks, no pay
 * frame (`quiet`) — it plays under the board's mask, where additive light
 * draws nothing, and it must read as life, not as a win the player did not get.
 */
import { bump, flick, restPose, type MeshWinSpec, type Pose, type Rig } from './meshRig';
import { H1, H2, H3, H4, W, S, L1, L2, L3, L4, L5 } from './neonSymbols';

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

const idle = (spec: MeshWinSpec, ms: number, act: (rig: Rig, pose: Pose, t: number) => void): MeshWinSpec => ({
	...spec,
	symbol: `${spec.symbol}:idle`,
	durationMs: ms,
	// no dust, no burst: both fire past the end, and the component clears its
	// timers when the act unmounts
	landMs: ms + 1000,
	hitMs: ms + 1000,
	quiet: true,
	pose: (rig, t) => {
		const pose = restPose(rig);
		act(rig, pose, t);
		return pose;
	},
});

/** a soft thump: in over 40ms, out over ~140 — 0 before, smooth */
const thump = (t: number, at: number) =>
	t < at - 40 ? 0 : Math.min(1, (t - at + 40) / 40) ** 2 * Math.exp(-Math.max(0, t - at) / 140);

export const MESH_IDLES: Record<string, MeshWinSpec> = {
	H1: idle(H1, 1000, (rig, pose, t) => {
		const beat = thump(t, 200) + thump(t, 520);
		for (const name of ['spkL', 'spkR']) {
			const s = bone(rig, pose, name);
			s.along = s.across = 1 + 0.1 * beat;
		}
		const body = bone(rig, pose, 'body');
		body.along = 1 - 0.02 * beat;
		body.across = 1 + 0.012 * beat;
		bone(rig, pose, 'handle').angle = 2.4 * (flick(t, 200, 7, 7) - 0.7 * flick(t, 520, 7, 7));
	}),
	H2: idle(H2, 1100, (rig, pose, t) => {
		const visor = bone(rig, pose, 'visor');
		// peeks open, holds a beat, snaps shut with a bounce
		const open = t < 300 ? bump(t, 0, 600) : t < 620 ? 1 : Math.max(0, 1 - (t - 620) / 80);
		visor.angle = 3.2 * open - 1.2 * flick(t, 700, 6, 8);
		visor.dy = -1.5 * open;
		bone(rig, pose, 'shell').angle = 1 * Math.sin(t / 160) * bump(t, 0, 1000);
	}),
	H3: idle(H3, 1100, (rig, pose, t) => {
		const can = bone(rig, pose, 'can');
		const shake = Math.sin(t / 19) * bump(t, 0, 380);
		// along the can's own length (neonSymbols.ts CAN_AXIS)
		can.dx = -0.42 * 4 * shake;
		can.dy = -0.91 * 4 * shake;
		const puff = bump(t, 520, 1000);
		const mist = bone(rig, pose, 'mist');
		mist.along = 1 + 0.08 * puff;
		mist.across = 1 + 0.05 * puff;
	}),
	H4: idle(H4, 1100, (rig, pose, t) => {
		// two toe taps
		const tap = bump(t, 80, 300) + bump(t, 380, 600);
		bone(rig, pose, 'toe').angle = -4 * tap;
		// each tap lands back on the heel: the shoe gives a little squash
		const slap = bump(t, 260, 380) + bump(t, 560, 680);
		const shoe = bone(rig, pose, 'shoe');
		shoe.along = 1 - 0.03 * slap;
		shoe.across = 1 + 0.015 * slap;
		bone(rig, pose, 'laces').angle = 3.5 * (flick(t, 300, 5, 6) + flick(t, 600, 5, 6));
		bone(rig, pose, 'laces').dy = -1.5 * tap;
		bone(rig, pose, 'tab').angle = 7 * flick(t, 320, 4, 5);
	}),
	W: idle(W, 1300, (rig, pose, t) => {
		// nodding to a beat only he hears
		const beat = thump(t, 260) + thump(t, 600) + 0.7 * thump(t, 940);
		const head = bone(rig, pose, 'head');
		head.dy = 3.5 * beat;
		head.along = 1 - 0.03 * beat;
		head.angle = 2.5 * beat;
		const hand = bone(rig, pose, 'hand');
		hand.angle = 3 * beat;
		hand.across = 1 + 0.04 * beat;
	}),
	S: idle(S, 1100, (rig, pose, t) => {
		const bunch = bone(rig, pose, 'bunch');
		const wob = flick(t, 0, 3, 3.5);
		bunch.along = 1 + 0.025 * wob;
		bunch.across = 1 - 0.018 * wob;
		bunch.angle = 1.4 * flick(t, 60, 2.2, 3);
		bone(rig, pose, 'stem').angle = 5 * flick(t, 120, 4, 4.5);
	}),
	...Object.fromEntries(
		[L1, L2, L3, L4, L5].map((spec, i) => [
			spec.symbol,
			idle(spec, 900, (rig, pose, t) => {
				const l = bone(rig, pose, 'letter');
				const wob = flick(t, 0, 2.6, 4);
				l.angle = 2.6 * wob * (i % 2 ? -1 : 1);
				l.along = 1 + 0.03 * bump(t, 0, 300);
			}),
		]),
	),
};

/** who the director picks, by weight: the specials most, the letters rarely */
export const IDLE_WEIGHT: Record<string, number> = {
	W: 3,
	S: 3,
	H1: 2,
	H2: 2,
	H3: 2,
	H4: 2,
	L1: 0.5,
	L2: 0.5,
	L3: 0.5,
	L4: 0.5,
	L5: 0.5,
};
