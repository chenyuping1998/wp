/**
 * When each cell blinks.
 *
 * A blinking symbol is the cheapest evidence that a character is alive, and the
 * settled board is what a player looks at for most of a session — the state this
 * game had nothing happening in at all. But blinking is only worth anything if
 * the cells blink INDEPENDENTLY: twenty symbols closing their eyes on the same
 * frame does not read as twenty characters, it reads as the screen flickering,
 * and it is more conspicuously wrong than not blinking.
 *
 * So each cell gets its own period and its own offset, derived from its position
 * rather than from Math.random(): the same cell keeps its rhythm across
 * re-renders, and the pattern is reproducible, which is what lets
 * `design/check_symbol_parts.mjs` prove the twenty cells never line up.
 *
 * No imports — the checker loads this in plain node.
 */

/** A blink is one closed-eye frame held briefly; longer reads as a doze. */
export const BLINK_MS = 110;
/** Range of the gap between blinks. Human resting rate is ~4s. */
export const BLINK_MIN_GAP_MS = 3200;
export const BLINK_MAX_GAP_MS = 7400;

/**
 * Golden-ratio (low-discrepancy) spread, not a hash.
 *
 * A hash gives each cell an INDEPENDENT random offset, and independent draws
 * clump: the first version of this put five of the twenty cells inside the same
 * 110ms blink at t=16.9s, which the gate caught. A low-discrepancy sequence is
 * the tool for "spread these as evenly as possible without a grid" — successive
 * values of (i × φ⁻¹ mod 1) never bunch, so no two cells land on the same beat
 * and the maximum overlap stays at two.
 */
const PHI_INV = 0.6180339887498949;
const spread = (index: number, salt: number) => (index * PHI_INV + salt * 0.381966) % 1;

/**
 * The cell's own blink cycle, in ms: `gap` between blinks and `offset` into the
 * first one. Two cells share a cycle only if they share both, which the
 * different hashes make vanishingly unlikely — and the gate checks it rather
 * than trusting the arithmetic.
 */
export const blinkCycle = (reel: number, row: number) => {
	// One index per cell, so the sequence spreads across the whole board rather
	// than within a column.
	const index = reel * 4 + row;
	const gap = BLINK_MIN_GAP_MS + spread(index, 0) * (BLINK_MAX_GAP_MS - BLINK_MIN_GAP_MS);
	const offset = spread(index, 1) * gap;
	return { gap, offset };
};

/** Is this cell mid-blink at time `t` (ms, any monotonic clock)? */
export const isBlinking = (reel: number, row: number, t: number) => {
	const { gap, offset } = blinkCycle(reel, row);
	return (t + offset) % gap < BLINK_MS;
};
