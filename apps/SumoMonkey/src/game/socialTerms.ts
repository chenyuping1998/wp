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


		// Delta is a WAYS game, not a lines game — there are no paylines to
		// rename. "Ways" is not on the restricted list, so it is the same word in
		// both modes; it lives here anyway so the rules page and the pay table
		// cannot start calling it different things.
		ways: 'ways',
		waysUpper: 'WAYS',

		// "pay" is restricted in social play just as "bet" is. These three used to
		// carry payline/playline; a ways game has no such thing, so they now name
		// the ways themselves and the social variant is identical.
		payline: pick('winning way', 'winning way'),
		paylines: pick('ways', 'ways'),
		paylinesUpper: pick('WAYS', 'WAYS'),
		payTable: pick('pay table', 'win table'),
		payTableCaps: pick('Pay table', 'Win table'),
		// Stake's sanctioned social wording is WIN TABLE (Wild Party review) — not
		// PLAY TABLE, which the pay→play pattern suggests. Matches the menu button.
		payTableUpper: pick('PAY TABLE', 'WIN TABLE'),
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
		// A ways game adds one clause a lines game does not need: position on the
		// reel is irrelevant. Leaving it out is the single most common way a ways
		// game's rules get read as a lines game's.
		combinationDirection: pick(
			'Winning combinations pay left to right on adjacent reels, starting from the leftmost reel, in any position',
			'Winning combinations start from left to right on adjacent reels, beginning with the leftmost reel, in any position',
		),
		// "Does not award" next to "Scatters award Free Spins" reads as a
		// contradiction, so social play states it the other way round.
		doesNotPay: pick('Does not pay', 'No line win'),
	};
};
