import { stateBet } from 'state-shared';

import { plaqueLevelForAmount } from './winTiers';

/**
 * The feature's total win includes the spin that triggered it.
 *
 * The maths' `freeSpinEnd.amount` is the free game's wins only — the trigger
 * spin's own win (its chain, the pearls, the gate pay) is not in it
 * (math-sdk win_manager.freegame_wins). Stake's review (2026-10-04) flags an
 * outro plaque that reads less than the round paid, so the plaque shows the
 * round's running total — what setTotalWin last said — whenever that is larger.
 *
 * The plaque's level (count-up pace, coins, the big-win sound) comes from that total on the
 * big-win tiers (winTiers). The book's own freeSpinEnd.winLevel is the reference game's
 * voice switch (2 at 50x+), not a plaque level.
 */
export const featureTotal = (freeGameAmount: number) => {
	const amount = Math.max(freeGameAmount, stateBet.winBookEventAmount);
	return { amount, winLevel: plaqueLevelForAmount(amount) };
};
