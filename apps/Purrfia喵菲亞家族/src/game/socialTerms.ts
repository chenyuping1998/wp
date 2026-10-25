import { stateUrlDerived } from 'state-shared';


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
		payTable: social ? 'win table' : 'pay table',
		payTableTitle: social ? 'WIN TABLE' : 'PAY TABLE',
		payTableLabel: social ? 'Win table' : 'Pay table',
		buyBonusName: social ? 'Play Bonus' : 'Buy Bonus',
		// the price label on a mode ("cost" is restricted in social play)
		costLabel: social ? 'Play for' : 'Cost',
		howSymbolsPay: social ? 'HOW SYMBOLS AWARD' : 'HOW SYMBOLS PAY',
	};
};
