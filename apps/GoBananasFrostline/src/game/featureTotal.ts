import { stateBet } from 'state-shared';
import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

import config from './config';

/**
 * THE FEATURE'S TOTAL WIN INCLUDES THE SPIN THAT TRIGGERED IT.
 *
 * The maths' `freeSpinEnd.amount` is the FREE GAME's wins only — the trigger
 * spin's own win is not in it (math-sdk: win_manager.freegame_wins). So the
 * outro plaque showed 71,800 on a round that paid 72,040: the 240 the
 * triggering spin won was missing. Stake review 2026-10-04 (Go Bananas Boat,
 * events 83091 / 8341 / 75097). The money was always right — finalWin is the
 * whole round — only the plaque was short.
 *
 * The round's running total is what setTotalWin last said (stateBet
 * .winBookEventAmount): base win + every free spin. The larger of the two is
 * used, so the plaque can never read less than the free game itself.
 *
 * Its win level is re-derived from that total with the maths' own
 * "endFeature" table (math-sdk src/config/config.py get_win_level), against
 * this mode's win cap, because adding the trigger win can cross a threshold.
 */
const END_FEATURE: [number, number][] = [
	[0, 1],
	[1, 5],
	[5, 10],
	[10, 20],
	[20, 50],
	[50, 100],
	[100, 500],
	[500, 2000],
];

const winCap = () => {
	const key = stateBet.activeBetModeKey.toLowerCase() as keyof typeof config.betModes;
	const mode = (config.betModes[key] ?? config.betModes.base) as { max_win?: number };
	return mode.max_win ?? Infinity;
};

export const featureTotal = (freeGameAmount: number, freeGameWinLevel: number) => {
	const total = Math.max(freeGameAmount, stateBet.winBookEventAmount);
	if (total === freeGameAmount) return { amount: freeGameAmount, winLevel: freeGameWinLevel };
	const x = total / BOOK_AMOUNT_MULTIPLIER;
	const cap = winCap();
	let winLevel = x >= cap ? 10 : 9;
	for (let i = 0; i < END_FEATURE.length; i++) {
		if (x >= END_FEATURE[i][0] && x < END_FEATURE[i][1]) {
			winLevel = i + 1;
			break;
		}
	}
	return { amount: total, winLevel };
};
