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

		// "pay" is restricted in social play just as "bet" is
		payline: pick('payline', 'playline'),
		paylines: pick('paylines', 'playlines'),
		paylinesUpper: pick('PAYLINES', 'PLAYLINES'),
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
		// The rules page states the same rule as a full sentence. It cannot just
		// splice winsDirection in: the clause that follows is "starting from the
		// leftmost reel", which would leave "start from left to right, starting
		// from the leftmost reel". So that whole sentence is worded twice.
		combinationDirection: pick(
			'Winning combinations pay left to right, starting from the leftmost reel on adjacent reels',
			'Winning combinations start from left to right, on adjacent reels beginning with the leftmost reel',
		),
		// "Does not award" next to "Scatters award Free Spins" reads as a
		// contradiction, so social play states it the other way round.
		doesNotPay: pick('Does not pay', 'No line win'),
	};
};
