import { stateBet } from 'state-shared';
import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

import config from './config';
import type { WinLevel } from './winLevelMap';

/**
 * Big-win tiers on the 1x bet, the reference game's (天使奧丁 §6): BIG 25x, SUPER 50x,
 * MEGA 100x, EPIC 200x. The maths sends the same tiers as setWin.winLevel 1-5
 * (math game_config.get_win_level: 1 normal, 2 BIG ... 5 EPIC); the plaque table
 * (winLevelMap) numbers them 6-9, and 10 (MAX) is the mode's win cap. Extra Bet pays and
 * celebrates on the 1x bet too: book amounts are already in that unit.
 */
export const BIG_WIN_FROM: Record<6 | 7 | 8 | 9, number> = { 6: 25, 7: 50, 8: 100, 9: 200 };

export const winCap = () => {
	const key = stateBet.activeBetModeKey.toLowerCase() as keyof typeof config.betModes;
	const mode = (config.betModes[key] ?? config.betModes.base) as { max_win?: number };
	return mode.max_win ?? Infinity;
};

/** Book units (bet x 100) where plaque level `level` (6-10) starts. */
export const plaqueThreshold = (level: number) =>
	(BIG_WIN_FROM[level as 6 | 7 | 8 | 9] ?? winCap()) * BOOK_AMOUNT_MULTIPLIER;

/**
 * Plaque level for an amount in book units. Below 25x there is no plaque; the small rungs
 * only pace a count-up (the end-of-feature plaque).
 */
export const plaqueLevelForAmount = (amount: number): WinLevel => {
	const x = amount / BOOK_AMOUNT_MULTIPLIER;
	if (x >= winCap()) return 10;
	for (const level of [9, 8, 7, 6] as const) if (x >= BIG_WIN_FROM[level]) return level;
	if (x >= 10) return 5;
	if (x >= 5) return 4;
	if (x >= 1) return 3;
	return x > 0 ? 2 : 1;
};
