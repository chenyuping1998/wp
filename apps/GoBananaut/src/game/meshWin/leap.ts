/**
 * THE HIGH SYMBOLS' SIGNATURE TURN — a whole-symbol move on top of the mesh
 * beat, kept INSIDE THE CELL.
 *
 * History: 2026-09-27 these were leaps out of the cell and across the
 * neighbours ("跳得誇張一點，碰到或跨越其他格"); the same day that was taken back
 * ("高分獎圖不要跳離格子"). What stayed is the part that never left the cell —
 * each high's own turn, timed to its spec's T:
 *
 *   H1 planet   one full revolution while it hops — a planet spinning
 *   H2 comet    tips back on the wind-up, dips into the lunge
 *   H3 boot     toe up on the lift, heel down into the stomp
 *   H4 jetpack  wobbles on its thrust while it hovers
 *
 * No offset and no swell here, so nothing is carried past the cell's edge; the
 * hop itself is the spec's own rigid move (WinLevel lift/swell). `slamAt` is
 * where it comes back down: the landing dust and a knock through the housing.
 */
import { track } from './meshRig';

export type LeapPose = { dx: number; dy: number; scale: number; rot: number };
export type LeapSpec = { pose: (t: number) => LeapPose; slamAt: number; slam: number };

const TAU = Math.PI * 2;
const turn = (rot: number): LeapPose => ({ dx: 0, dy: 0, scale: 1, rot });

export const LEAPS: Record<string, LeapSpec> = {
	// T = { crouch: 110, rise: 300, fall: 620, land: 800 }
	H1: {
		slamAt: 800,
		slam: 0.6,
		// a full turn reads the same as none, so it hands back to rest cleanly
		pose: (t) => turn(t < 760 ? -TAU * track(t, [[220, 0], [760, 1, 'inOut']]) : 0),
	},
	// T = { wind: 120, lunge: 280, back: 620 }
	H2: {
		slamAt: 900,
		slam: 0.35,
		pose: (t) => turn(track(t, [[0, 0], [140, 0.1], [360, -0.12, 'out'], [620, -0.07], [900, 0, 'inOut']])),
	},
	// T = { lift: 120, up: 330, stomp: 520, tap: 760 }
	H3: {
		slamAt: 520,
		slam: 0.8,
		pose: (t) => turn(track(t, [[0, 0], [340, 0.1, 'out'], [450, 0.12], [520, -0.03, 'in'], [640, 0, 'out']])),
	},
	// T = { crouch: 120, rise: 300, fall: 640, land: 820 }
	H4: {
		slamAt: 820,
		slam: 0.5,
		pose: (t) => turn(0.07 * track(t, [[250, 0], [360, 1], [600, 1], [720, 0]]) * Math.sin((TAU * (t - 250)) / 330)),
	},
};

/** how hard the landing knocks for a win's size (its `kind`) */
export const leapAmount = (kind: number) => (kind >= 5 ? 1 : kind === 4 ? 0.85 : 0.65);

/** a pose scaled by `k`; the turn is not — the planet's is a whole revolution,
 *  and 0.65 of one would stop short and snap upright at the end */
export const scaleLeap = (p: LeapPose, k: number): LeapPose => ({
	dx: p.dx * k,
	dy: p.dy * k,
	scale: 1 + (p.scale - 1) * k,
	rot: p.rot,
});
