/**
 * What a symbol does when NOTHING is happening (ported from DeadwoodExpress,
 * 2026-09-28).
 *
 * Every animation in this game animates a MOMENT — a landing, a win, a blast.
 * The state a player looks at for most of a session is the one none of them
 * touch: a settled board between spins, where every symbol was a still PNG.
 * Stake's review of a sibling game named exactly that as "poor animation":
 * "nothing moving on a settled board, which is what a player looks at most of
 * the time". The fix that closed it there is deliberately tiny — about 1% of
 * scale, a slow breath — "nearly invisible; conspicuous when absent".
 *
 * Idle is AMBIENT, not identity: every cell breathes the same shape. What must
 * never happen is the board breathing IN UNISON, which reads as one object
 * inflating — so the variation is in the PHASE, per cell. The twenty phases
 * below are Deadwood's: evenly spaced round the circle, and assigned to the
 * 5 x 4 cells by a search for the largest minimum gap between neighbours
 * (diagonals included), 0.63 rad. This board is the same 5 x 4.
 * design/check_idle_land.mjs holds it to that.
 *
 * No imports, so the gate can load it in plain node.
 */

/** Scale deviation at the peak of the breath. ~1%, as the precedent says. */
export const IDLE_AMPLITUDE = 0.009;

/** One full breath, ms. Slow enough to read as breathing rather than flicker. */
export const IDLE_PERIOD_MS = 2600;

const PHASES: number[][] = [
	[3.4558, 0.0, 1.5708, 4.3982, 2.8274],
	[5.6549, 2.5133, 3.1416, 2.1991, 3.7699],
	[1.2566, 4.0841, 0.9425, 4.7124, 5.3407],
	[0.6283, 5.0265, 0.3142, 1.885, 5.969],
];

export const VISIBLE_ROWS = PHASES.length;
export const VISIBLE_REELS = PHASES[0].length;

/**
 * A cell's own place in the breath, 0..2π. `row` is the padded reel index (a
 * hidden row above the four visible ones), so row 1 is the top visible row;
 * padding rows clamp onto the nearest visible one — they are never seen.
 */
export const idlePhase = (reel: number, row: number) => {
	const r = Math.min(VISIBLE_ROWS - 1, Math.max(0, row - 1));
	const c = Math.min(VISIBLE_REELS - 1, Math.max(0, reel));
	return PHASES[r][c];
};

/** The breath. `t` is ms on a clock every cell shares (idleClock). */
export const idleScale = (t: number, phase: number) =>
	1 + IDLE_AMPLITUDE * Math.sin((Math.PI * 2 * t) / IDLE_PERIOD_MS + phase);
