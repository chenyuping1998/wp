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
export const IDLE_AMPLITUDE = 0.002;

/** One full breath, ms. Slow enough to read as breathing rather than flicker. */
export const IDLE_PERIOD_MS = 12000;

const PHASES: number[][] = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ((r * 5 + c * 8) % 25) * Math.PI * 2 / 25));

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
	1 + IDLE_AMPLITUDE * Math.sin(Math.PI * Math.min(1, ((t + phase / (Math.PI * 2) * IDLE_PERIOD_MS) % IDLE_PERIOD_MS) / 800)) ** 2;
