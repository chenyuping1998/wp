import { stateUrlDerived } from 'state-shared';

/**
 * Player-facing vocabulary, in the two registers the game has to speak.
 *
 * Social play forbids gambling terminology in copy: nothing may be called a
 * BET, and nothing may PAY. The rules and the pay table are where almost all of
 * it lives, and keeping two copies of that prose is how the two versions drift
 * — one gets an edit, the other does not, and the social build ships a sentence
 * that says "pays" three months later.
 *
 * So the words that differ are named once, here, and the prose is written
 * around them. The rules modal already did this for the bet nouns; this extends
 * it to the pay verbs, which were still hardcoded, and puts both in one place so
 * the pay table can use them too.
 *
 * Read as a function rather than exported as a constant: `social()` comes from
 * the URL, which is not known at module-evaluation time.
 */
export const socialTerms = () => {
	const social = stateUrlDerived.social();
	return {
		social,

		// ── the stake ──
		bet: social ? 'amount' : 'bet', // "your bet" / "your amount"
		totalBet: social ? 'total amount' : 'total bet',
		betLevel: social ? 'amount level' : 'bet level',
		betLevels: social ? 'amount levels' : 'bet levels',
		betMenu: social ? 'play menu' : 'bet menu',
		betPanel: social ? 'Amount' : 'Bet', // the readout's own label
		betBar: social ? 'control bar' : 'bet bar',
		buy: social ? 'play' : 'buy',
		bought: social ? 'started' : 'bought',

		// ── the return ──
		// "award" carries the same meaning without claiming a payment was made,
		// and it is already the word the free-spin panel uses ("12 AWARDED"), so
		// the social build stays internally consistent rather than inventing a
		// second euphemism.
		pay: social ? 'award' : 'pay',
		pays: social ? 'awards' : 'pays',
		paid: social ? 'awarded' : 'paid',
		paying: social ? 'awarding' : 'paying',
		payout: social ? 'award' : 'payout',
		payValue: social ? 'award value' : 'pay value',
		// The genre name. "pay-anywhere" has no gambling noun in it, so unlike the
		// verbs above it needs no social variant — but `scatterPays` would, and is
		// deliberately not used: this game's Scatter is the feature trigger, and
		// calling the win type "scatter pays" next to a symbol called Scatter is
		// the one piece of industry vocabulary players reliably misread.
		payAnywhere: 'pay-anywhere',
		paylines: social ? 'award lines' : 'paylines',

		// ── titles ──
		payTable: social ? 'play table' : 'pay table',
		payTableTitle: social ? 'PLAY TABLE' : 'PAY TABLE',
		payTableLabel: social ? 'Play table' : 'Pay table',
		howSymbolsPay: social ? 'HOW SYMBOLS AWARD' : 'HOW SYMBOLS PAY',
	};
};
