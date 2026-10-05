import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet } from 'state-shared';

// Money is always formatted against this locale, never the interface language.
// See numberToCurrencyString for why.
const CURRENCY_LOCALE = 'en-US';

// Every currency is displayed the way Stake's RGS documentation lists it
// (stake-engine.com/docs/rgs, "Supported Currencies"): its own display symbol,
// before or after the amount as the table says.
//
// Stake review, 2026-10-04 (Deadwood Express): "Please ensure that either
// currency abbreviations are displayed for all currencies or currency symbols
// are displayed for all currencies, rather than mixing the two formats" —
// Intl at en-US had a symbol for USD/EUR but fell back to the ISO code for RUB,
// UGX, XOF and many others, so one game showed "$1.00" and "RUB 1.00". The
// table below is the platform's own, so every currency now shows its symbol.
// "XEC, XSC, XGC must have their Display Currency, regardless if the
// abbreviation is used by other": XGC → GC, XSC → SC, XEC → SC (yes, both SC).
//
// `decimals` is the currency's standard precision and the minimum shown; wins
// may still extend past it (see numberToCurrencyString).
type CurrencyMeta = { symbol: string; decimals: number; symbolAfter?: boolean };
const CURRENCY_META: Record<string, CurrencyMeta> = {
	USD: { symbol: '$', decimals: 2 },
	CAD: { symbol: 'CA$', decimals: 2 },
	JPY: { symbol: '¥', decimals: 0 },
	EUR: { symbol: '€', decimals: 2 },
	RUB: { symbol: '₽', decimals: 2 },
	CNY: { symbol: 'CN¥', decimals: 2 },
	PHP: { symbol: '₱', decimals: 2 },
	INR: { symbol: '₹', decimals: 2 },
	IDR: { symbol: 'Rp', decimals: 0 },
	KRW: { symbol: '₩', decimals: 0 },
	BRL: { symbol: 'R$', decimals: 2 },
	MXN: { symbol: 'MX$', decimals: 2 },
	DKK: { symbol: 'KR', decimals: 2, symbolAfter: true },
	PLN: { symbol: 'zł', decimals: 2, symbolAfter: true },
	VND: { symbol: '₫', decimals: 0, symbolAfter: true },
	TRY: { symbol: '₺', decimals: 2 },
	CLP: { symbol: 'CLP', decimals: 0, symbolAfter: true },
	ARS: { symbol: 'ARS', decimals: 2, symbolAfter: true },
	PEN: { symbol: 'S/', decimals: 2, symbolAfter: true },
	NGN: { symbol: '₦', decimals: 2 },
	SAR: { symbol: 'SAR', decimals: 2, symbolAfter: true },
	ILS: { symbol: '₪', decimals: 2 },
	AED: { symbol: 'AED', decimals: 2, symbolAfter: true },
	TWD: { symbol: 'NT$', decimals: 2 },
	NOK: { symbol: 'kr', decimals: 2, symbolAfter: true },
	KWD: { symbol: 'KD', decimals: 3 },
	JOD: { symbol: 'JD', decimals: 3 },
	CRC: { symbol: '₡', decimals: 2 },
	TND: { symbol: 'TND', decimals: 3, symbolAfter: true },
	SGD: { symbol: 'SG$', decimals: 2 },
	MYR: { symbol: 'RM', decimals: 2 },
	OMR: { symbol: 'OMR', decimals: 3, symbolAfter: true },
	QAR: { symbol: 'QAR', decimals: 2, symbolAfter: true },
	BHD: { symbol: 'BD', decimals: 3 },
	PKR: { symbol: '₨', decimals: 2 },
	EGP: { symbol: 'ج.م', decimals: 2 },
	NZD: { symbol: 'NZ$', decimals: 2 },
	BOB: { symbol: 'Bs', decimals: 2 },
	GHS: { symbol: 'GH₵', decimals: 2 },
	KES: { symbol: 'KSh', decimals: 2 },
	MAD: { symbol: 'MAD', decimals: 2, symbolAfter: true },
	BAM: { symbol: 'KM', decimals: 2 },
	ISK: { symbol: 'kr', decimals: 0, symbolAfter: true },
	TZS: { symbol: 'TSh', decimals: 2 },
	UGX: { symbol: 'USh', decimals: 0 },
	XOF: { symbol: 'CFA', decimals: 0, symbolAfter: true },
	// The docs' example reads "10.00 GC", so Gold Coins keep 2 decimals here
	// (its code table says 0, but GC stakes and wins run fractional).
	XGC: { symbol: 'GC', decimals: 2, symbolAfter: true },
	XSC: { symbol: 'SC', decimals: 2, symbolAfter: true },
	XEC: { symbol: 'SC', decimals: 2, symbolAfter: true },
};

// A currency the table does not list shows its code after the amount — the
// docs' own fallback.
const currencyMeta = (currency: string): CurrencyMeta =>
	CURRENCY_META[currency.toUpperCase()] ?? { symbol: currency, decimals: 2, symbolAfter: true };

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
// Smallest number of decimals (never below `minimum`) that still represents
// the value exactly at `maximumFractionDigits`.
const decimalsNeeded = (value: number, maximumFractionDigits: number, minimum = 2) => {
	const target = Number(value.toFixed(maximumFractionDigits));
	for (let digits = minimum; digits < maximumFractionDigits; digits++) {
		if (Number(value.toFixed(digits)) === target) return digits;
	}
	return Math.max(minimum, maximumFractionDigits);
};

export const numberToCurrencyString = (value: number, maximumFractionDigits = 2) => {
	const meta = currencyMeta(stateBet.currency);
	const amount = numberToFloat(value);

	// The currency's own precision is the floor; a win may run past it up to
	// `maximumFractionDigits` so a sub-cent payout still matches the server's
	// JSON. A 0-decimal currency (JPY, UGX, XOF…) shows whole amounts unless the
	// value genuinely has a fraction.
	const digits = decimalsNeeded(
		amount,
		Math.max(meta.decimals, maximumFractionDigits),
		meta.decimals,
	);

	// Grouping only — formatted against a fixed locale, NOT the interface
	// language, so switching the game to French does not turn "$1,000.00" into
	// "1 000,00 $US". The symbol is placed by hand from the table above.
	const number = new Intl.NumberFormat(CURRENCY_LOCALE, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	}).format(Math.abs(amount));
	const sign = amount < 0 && number.replace(/[^1-9]/g, '') !== '' ? '-' : '';

	return meta.symbolAfter ? `${sign}${number} ${meta.symbol}` : `${sign}${meta.symbol}${number}`;
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
