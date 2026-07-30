import { stateI18n } from 'state-shared';

import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet } from 'state-shared';

const NO_LOCALISATION_CURRENCY_MAP: Record<string, string> = {
	XGC: 'GC',
	XSC: 'SC',
};

// bookEventAmount: is the amount or win numbers in the events of books, e.g. the amount in setTotalWin bookEvent
// {
// 	"index": 3,
// 	"type": "setTotalWin",
// 	"amount": 100
// },
// if betting on $1,   100 bookEventAmount equals to $1.    betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $1,    50 bookEventAmount equals to $0.5.  betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5
// if betting on $0.5, 100 bookEventAmount equals to $0.5.  betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $0.5,  50 bookEventAmount equals to $0.25. betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5

export const bookEventAmountToBetAmountMultiplier = (bookEventAmount: number) =>
	bookEventAmount / BOOK_AMOUNT_MULTIPLIER;

export const bookEventAmountToNormalisedAmount = (bookEventAmount: number) => {
	const betAmountMultiplier = bookEventAmountToBetAmountMultiplier(bookEventAmount);
	return stateBet.wageredBetAmount * betAmountMultiplier;
};

export const numberToFloat = (value: number) => Number.parseFloat(`${value}`);

// Stakes and balances are money the player handed over or holds, and those are
// always shown to 2 decimals. Win amounts are not: a payout of 2000 book units on
// a $0.01 stake is $0.002, and at 2 decimals that renders as "$0.00" — the win
// vanishes from the UI and no longer matches the JSON the server sent. Wins
// therefore allow up to 4 decimals.
//
// `maximumFractionDigits` is a maximum, not a fixed width: with a minimum of 2 a
// small win reads "$0.002" and a large one still reads "$331.60", rather than
// padding everything to "$331.6000".
// Smallest number of decimals (never below 2) that still represents the value
// exactly at `maximumFractionDigits`. Only the non-localised branch needs this —
// Intl applies minimum/maximumFractionDigits itself.
const decimalsNeeded = (value: number, maximumFractionDigits: number) => {
	const target = Number(value.toFixed(maximumFractionDigits));
	for (let digits = 2; digits < maximumFractionDigits; digits++) {
		if (Number(value.toFixed(digits)) === target) return digits;
	}
	return maximumFractionDigits;
};

export const numberToCurrencyString = (value: number, maximumFractionDigits = 2) => {
	if (stateBet.currency in NO_LOCALISATION_CURRENCY_MAP) {
		// This branch bypasses Intl, so it has to apply the same rule itself —
		// it used to be hardcoded to 2 decimals, which broke small wins in XGC/XSC
		// while every other currency was fine.
		const symbol = NO_LOCALISATION_CURRENCY_MAP[stateBet.currency];
		const amount = numberToFloat(value);
		return `${symbol} ${amount.toFixed(decimalsNeeded(amount, maximumFractionDigits))}`;
	}

	return stateI18n.i18n.number(value, {
		minimumFractionDigits: 2,
		maximumFractionDigits,
		style: 'currency',
		currency: stateBet.currency,
		// numberingSystem: 'latn',
	});
};

// Book-event amounts are win figures — setTotalWin, prize values, the count-up on
// the win plaques — so these get the 4-decimal treatment. Stakes and balances go
// through numberToCurrencyString directly and stay at 2.
export const WIN_MAX_FRACTION_DIGITS = 4;

export const bookEventAmountToCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToCurrencyString(normalisedAmount, WIN_MAX_FRACTION_DIGITS);
};
