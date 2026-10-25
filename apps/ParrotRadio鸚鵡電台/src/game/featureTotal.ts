import { stateBet } from 'state-shared';
import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

import config from './config';


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
