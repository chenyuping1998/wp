import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet } from 'state-shared';

// Money is always formatted against this locale, never the interface language.
// See numberToCurrencyString for why.
const CURRENCY_LOCALE = 'en-US';

// Social currencies are shown as their own symbol, never routed through Intl —
// which is what keeps a "$" off them. XEC is Stake EU's sweeps currency and
// displays as SC, the same as XSC.
const NO_LOCALISATION_CURRENCY_MAP: Record<string, string> = {
	XGC: 'GC',
	XSC: 'SC',
	XEC: 'SC',
};

// Currencies whose en-US "symbol" is a WORD rather than a symbol, so they show
// their ISO code instead.
//
// Intl renders XOF as "F CFA 1,234.50" — Stake review rejected exactly that on
// 2026-09-04, asking for "XOF or CFA, not F CFA". Sweeping all three CFA francs
// in rather than only the one that was reported: XAF gives "FCFA" and XPF gives
// "CFPF" from the same table, and there is no reason to make the reviewer find
// the other two.
//
// These stay on Intl rather than joining the map above, because that branch
// formats with toFixed and loses the thousands separators — and these are
// exactly the currencies that need them (XOF has no minor unit in practice, so
// ordinary amounts run to five figures).
const CODE_DISPLAY_CURRENCIES = new Set(['XOF', 'XAF', 'XPF']);

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

	// Formatted against a fixed locale, NOT the interface language.
	//
	// This used to go through the i18n instance, which formats with whatever
	// locale is active — so switching the game to French turned "$1,000.00" into
	// "1 000,00 $US". The amount is the same money either way; only its
	// presentation moved, which makes the balance look like it changed and puts a
	// currency suffix where the symbol belongs.
	//
	// `symbol`, NOT `narrowSymbol`. Narrow is defined as the symbol with its
	// disambiguating prefix removed, which is precisely the thing that keeps two
	// currencies apart: at en-US it renders USD, CAD, AUD, MXN, SGD, HKD and NZD
	// all as "$", and JPY and CNY both as "¥". A player who switched to Canadian
	// dollars still saw "$1.00" and had no way to tell which money they were
	// looking at. `symbol` gives CA$, A$, MX$, HK$, NZ$, CN¥ and so on, and has
	// no collisions across the currencies the platform offers.
	return new Intl.NumberFormat(CURRENCY_LOCALE, {
		minimumFractionDigits: 2,
		maximumFractionDigits,
		style: 'currency',
		currency: stateBet.currency,
		currencyDisplay: CODE_DISPLAY_CURRENCIES.has(stateBet.currency) ? 'code' : 'symbol',
	}).format(value);
};

// Book-event amounts are win figures — setTotalWin, prize values, the count-up on
// the win plaques — so these get the 4-decimal treatment. Stakes and balances go
// through numberToCurrencyString directly and stay at 2.
export const WIN_MAX_FRACTION_DIGITS = 4;

export const bookEventAmountToCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToCurrencyString(normalisedAmount, WIN_MAX_FRACTION_DIGITS);
};

/**
 * One frame of a count-up, given the amount it is counting TO.
 *
 * The 4-decimal allowance exists so a tiny win still matches the server's JSON
 * instead of collapsing to "$0.00". Applied per frame it does something nobody
 * wants: a big-win plaque counting to $33.00 passes through values like 1.299
 * and 7.4213, so the headline number grows and loses decimal places as it
 * climbs. Observed on the BIG WIN plaque reading "$1.299".
 *
 * The precision a win needs is a property of the win, not of whatever the tween
 * happens to be showing — so it is decided once from the final amount and held
 * for every frame. A $33.00 win counts in 2 decimals throughout; a $0.002 win
 * still gets its 4, so nothing certification asked for is given up.
 *
 * A separate function rather than a change to the one above: that one is used by
 * the other games in this repo, and a shared change has to default to the old
 * behaviour.
 */
export const bookEventAmountToCountUpString = (
	bookEventAmount: number,
	finalBookEventAmount: number,
) => {
	const finalAmount = bookEventAmountToNormalisedAmount(finalBookEventAmount);
	const digits = decimalsNeeded(finalAmount, WIN_MAX_FRACTION_DIGITS);
	return numberToCurrencyString(bookEventAmountToNormalisedAmount(bookEventAmount), digits);
};
