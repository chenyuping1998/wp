// Hand-written superspin demo events (the math library hasn't produced
// superspin books yet). Boards are 5 reels × 7 rows (5 visible + padding).
import type { RawSymbol } from '../../game/types';

const superspinBoard = (prizes: { reel: number; row: number; prize: number }[]) => {
	const board: RawSymbol[][] = Array.from({ length: 5 }, () =>
		Array.from({ length: 7 }, () => ({ name: 'X' }) as RawSymbol),
	);
	for (const p of prizes) {
		board[p.reel][p.row] = { name: 'P', prize: p.prize };
	}
	return board;
};

const reveal = (index: number, prizes: { reel: number; row: number; prize: number }[]) => ({
	index,
	type: 'reveal' as const,
	board: superspinBoard(prizes),
	paddingPositions: [10, 24, 38, 52, 66],
	gameType: 'superspin' as const,
	anticipation: [0, 0, 0, 0, 0],
});

const PRIZE_1 = { reel: 2, row: 3, prize: 200 };
const PRIZE_2 = { reel: 4, row: 1, prize: 1000 };
const PRIZE_3 = { reel: 0, row: 5, prize: 500 };

export default {
	// spin 1 of 3 — one coin lands and sticks (spins reset)
	updateFreeSpin: { index: 0, type: 'updateFreeSpin' as const, amount: 0, total: 3 },
	reveal: reveal(1, [PRIZE_1]),
	newStickySymbols: {
		index: 2,
		type: 'newStickySymbols' as const,
		newPrizes: [PRIZE_1],
	},
	updateFreeSpinReset: { index: 3, type: 'updateFreeSpin' as const, amount: 0, total: 3 },
	// next spin — two more coins land at once
	reveal2: reveal(4, [PRIZE_1, PRIZE_2, PRIZE_3]),
	newStickySymbols2: {
		index: 5,
		type: 'newStickySymbols' as const,
		newPrizes: [PRIZE_2, PRIZE_3],
	},
	// three dead spins later — final tally
	revealDead: reveal(6, [PRIZE_1, PRIZE_2, PRIZE_3]),
	prizeWinInfo: {
		index: 7,
		type: 'prizeWinInfo' as const,
		totalWin: 1700,
		wins: [PRIZE_1, PRIZE_2, PRIZE_3],
	},
	setWin: { index: 8, type: 'setWin' as const, amount: 1700, winLevel: 5 },
	finalWin: { index: 9, type: 'finalWin' as const, amount: 1700 },
};
