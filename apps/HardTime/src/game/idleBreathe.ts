/**
 * What a symbol does when NOTHING is happening.
 *
 * Every animation pass in this game so far — the win motions, the landings, the
 * anticipation, the Neon Frame beats, the rigged parts — animates a MOMENT. The
 * state a player actually spends most of their time looking at is the one none
 * of them touch: a settled board between spins, where every symbol is a still
 * PNG.
 *
 * That is not a guess about taste. It is the diagnosis Stake's own review gave a
 * sibling game in this repo, recorded in the skill's review-log:
 *
 *     "Poor animation" was the absence of any. Every symbol was a still PNG: no
 *     idle motion, no per-symbol win animation, nothing moving on a settled
 *     board, which is what a player looks at most of the time.
 *
 * and the fix that closed it there was deliberately tiny: about 1% of scale,
 * phase-offset by cell position so the grid never pulses as one block. "Nearly
 * invisible; conspicuous when absent."
 *
 * ── Why this is not the "everything moves the same" bug again ────────────────
 *
 * The whole animation effort has been about making twelve symbols read
 * differently. This is the opposite on purpose: idle is AMBIENT, not identity.
 * A board where each symbol idles in its own character would be twelve things
 * competing for attention while the player is deciding whether to spin. What
 * must not happen is the board breathing IN UNISON, which reads as one object
 * inflating — so the variation lives in the phase, per cell, not in the shape.
 *
 * No imports, so design/check_idle_breathe.mjs can measure it in plain node.
 */

/** Scale deviation at the peak of the breath. ~1%, as the precedent says. */
export const IDLE_AMPLITUDE = 0.009;
/** One full breath, ms. Slow enough to read as breathing rather than flicker. */
export const IDLE_PERIOD_MS = 2600;

/**
 * A cell's own place in the breath, 0..2π.
 *
 * Two properties matter, and the gate checks both:
 *
 *  · **neighbours must be out of step** — including diagonals. Two cells beside
 *    each other rising and falling together is the block pulse this whole thing
 *    exists to avoid, and it is invisible in a screenshot: a still frame of a
 *    synchronised board looks exactly like a still frame of a scattered one.
 *  · **the phases must cover the circle** — twenty cells bunched into two
 *    clusters is a block pulse with extra steps.
 *
 * The obvious answer, the golden angle over a linear cell index, gets the second
 * property perfectly and fails the first: on a 5×4 grid a diagonal neighbour is
 * five index steps away, and five golden-angle steps come back to 0.57 rad —
 * about 230ms apart on a 2.6s breath, which is not apart at all.
 *
 * So the twenty phases are evenly spaced and their ASSIGNMENT to cells was
 * searched (local swaps, 400 restarts) for the largest possible minimum gap
 * between spatial neighbours. The best achievable on this board is 0.63 rad;
 * this table is at it. That is also why the gate's limit is 0.5 rather than
 * 0.63: it is there to catch a board that pulses together, not to pin the
 * layout to the exact optimum.
 *
 * Rows here are the four VISIBLE rows. The reel strip is padded — `symbolIndex`
 * runs 0..5 with a hidden row above and below — so padding rows clamp onto the
 * nearest visible one. They are never seen; what matters is that the visible
 * neighbourhood is the one the search optimised.
 */
const PHASES: number[][] = [
	[3.4558, 0.0, 1.5708, 4.3982, 2.8274],
	[5.6549, 2.5133, 3.1416, 2.1991, 3.7699],
	[1.2566, 4.0841, 0.9425, 4.7124, 5.3407],
	[0.6283, 5.0265, 0.3142, 1.885, 5.969],
];

export const VISIBLE_ROWS = PHASES.length;
export const VISIBLE_REELS = PHASES[0].length;

export const idlePhase = (reel: number, row: number) => {
	const r = Math.min(VISIBLE_ROWS - 1, Math.max(0, row - 1));
	const c = Math.min(VISIBLE_REELS - 1, Math.max(0, reel));
	return PHASES[r][c];
};

/**
 * The breath itself. `t` is milliseconds — any clock, as long as every cell
 * shares it, which is what keeps the phase offsets meaningful.
 */
export const idleScale = (t: number, phase: number) =>
	1 + IDLE_AMPLITUDE * Math.sin((Math.PI * 2 * t) / IDLE_PERIOD_MS + phase);
