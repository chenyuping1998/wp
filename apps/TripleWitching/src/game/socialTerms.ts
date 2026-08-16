import { stateUrlDerived } from 'state-shared';

// Social play forbids betting terminology in player-facing copy. The rules page
// and the pay table are where it concentrates, and they describe the same game —
// so the words that differ are named once here and referenced from both, rather
// than each panel keeping its own copy to drift out of sync.
//
// Built on demand rather than at module scope: social() reads the page URL, which
// is not available while this module is being evaluated.
export const getSocialTerms = () => {
	const social = stateUrlDerived.social();
	const pick = (normal: string, socialText: string) => (social ? socialText : normal);

	return {
		bet: pick('bet', 'amount'), // "your bet" / "your amount"
		totalBet: pick('total bet', 'total amount'),
		betLevels: pick('bet levels', 'amount levels'),
		betMenu: pick('bet menu', 'play menu'),
		buy: pick('buy', 'play'),
		bought: pick('bought', 'started'),
		entryVerb: pick('Buy', 'Play'), // sentence-initial, e.g. "Buy for 200x"
		// "cost" is restricted in social play alongside "bet" and "buy"
		cost: pick('cost', 'total'),
		// Must match what the bar button actually says — components-ui-pixi's
		// i18nDerived.buyBonus() renders "PLAY BONUS" in social play, so the rules
		// page cannot go on calling it Buy Bonus.
		buyBonusName: pick('Buy Bonus', 'Play Bonus'),

		// "pay" is restricted in social play just as "bet" is. There is no
		// payline vocabulary here: Triple Witching is a ways game, so the panels talk
		// about ways and adjacent reels instead.
		payTable: pick('pay table', 'play table'),
		payTableCaps: pick('Pay table', 'Play table'),
		// matches the bar button, which already reads PLAY TABLE in social play
		payTableUpper: pick('PAY TABLE', 'PLAY TABLE'),
		pay: pick('pay', 'award'),
		pays: pick('pays', 'awards'),
		paysStart: pick('Pays', 'Awards'), // sentence-initial
		paid: pick('paid', 'awarded'),
		payout: pick('payout', 'award'),

		// Certification asked for "pay left to right" to read "start from left to
		// right" in social play.
		winsDirection: pick('pay left to right', 'start from left to right'),
		// "Does not award" next to "TRIPLE WITCHING awards free spins" reads as a
		// contradiction, so social play states it the other way round. Not "no line
		// win" — there are no lines to lose on in a ways game.
		doesNotPay: pick('Does not pay', 'No symbol win'),
	};
};
