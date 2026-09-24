import { stateUrlDerived } from 'state-shared';

// Social play forbids betting terminology in player-facing copy. The rules page
// and the pay table are where it concentrates, and they describe the same game —
// so the words that differ are named once here and referenced from both, rather
// than each panel keeping its own copy to drift out of sync.
//
// This module exists because that drift is exactly what certification kept
// catching on the sibling game: three separate review rounds were lost, each
// time because the words were fixed only where the reviewer's screenshot
// pointed. Fix the class, not the instance.
//
// Built on demand rather than at module scope: social() reads the page URL,
// which is not available while this module is being evaluated.
//
// The authoritative word list is Stake's own, at
// stake-engine.com/docs/approval-guidelines/jurisdiction-requirements — the page
// is client-rendered, so it has to be read in a browser, not fetched.
// `design/check_social_words.mjs` carries a copy of the table and guards the
// social branch of every pick() below.
export const getSocialTerms = () => {
	const social = stateUrlDerived.social();
	const pick = (normal: string, socialText: string) => (social ? socialText : normal);

	return {
		bet: pick('bet', 'amount'), // "your bet" / "your amount"
		totalBet: pick('total bet', 'total amount'),
		betLevel: pick('bet level', 'amount level'),
		betLevels: pick('bet levels', 'amount levels'),
		betMenu: pick('bet menu', 'play menu'),
		betPanel: pick('Bet', 'Amount'), // the readout's own label
		buy: pick('buy', 'play'),
		bought: pick('bought', 'started'),
		entryVerb: pick('Buy', 'Play'), // sentence-initial, e.g. "Buy for 100x"
		// "cost" is restricted in social play alongside "bet" and "buy"
		cost: pick('cost', 'total'),
		// Must match what the bar button actually says — components-ui-pixi's
		// i18nDerived renders "PLAY BONUS" in social play, so the rules page
		// cannot go on calling it Buy Bonus.
		buyBonusName: pick('Buy Bonus', 'Play Bonus'),

		// The feature-buy menu's own copy. "buy" is restricted, and Stake's named
		// replacement for "buy bonus" is "get bonus" rather than the mechanical
		// "play bonus", so the heading follows that.
		featureMenuTitle: pick('BUY A FEATURE', 'GET A FEATURE'),
		featureMenuLede: pick(
			// The RTP sentence was removed rather than restated. It used to say every
			// feature plays at the base game's rate, which stopped being true when
			// the modes were spread across a range (94.58-94.78% as of the
			// 2026-09-03 retarget) — and an RTP claim on the buy screen is a
			// compliance surface, not flavour text. The exact per-mode figures are
			// in the rules panel's mode table, which reads them from the maths
			// config and therefore cannot drift.
			'Enter any of the three free-spin features directly, for the multiple of your bet shown on each card.',
			'Enter any of the three free-spin features directly, for the multiple of your amount shown on each card.',
		),
		insufficientForMode: pick('Balance too low for this feature.', 'Balance too low for this feature.'),

		// "pay" is restricted in social play just as "bet" is
		payline: pick('payline', 'playline'),
		paylines: pick('paylines', 'playlines'),
		paylinesUpper: pick('PAYLINES', 'PLAYLINES'),
		// "WIN TABLE", not "PLAY TABLE". This is one of the two terms Stake names
		// explicitly rather than leaving to the pay→play substitution, and Wild
		// Party shipped the derived guess, passed its own restricted-word guard on
		// it, and had it come back as an open review issue.
		payTableCaps: pick('Pay table', 'Win table'),
		payTableUpper: pick('PAY TABLE', 'WIN TABLE'),
		pays: pick('pays', 'awards'),
		paysStart: pick('Pays', 'Awards'), // sentence-initial
		paid: pick('paid', 'awarded'),
		payout: pick('payout', 'award'),

		// Stake's approval checklist requires a disclaimer equivalent to
		// "Malfunction voids all pays and plays." — but "pays" is itself
		// restricted, so the exact wording ships in the real-money build and the
		// compliant substitution ships in social.
		disclaimerOpening: pick(
			'Malfunction voids all pays and plays.',
			'Malfunction voids all wins and plays.',
		),

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
		doesNotPayAlone: pick('Does not pay on its own', 'No line win on its own'),
		// Same trap in the Scatter section of the rules, where the sentence
		// continues "and does not need to land on a payline".
		noPayOnItsOwn: pick(
			'It does not pay on its own',
			'It does not award a line win on its own',
		),
	};
};
