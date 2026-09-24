import { stateUrlDerived } from 'state-shared';

// Social play (`?social=true`) forbids betting terminology anywhere the player
// can read. Wild Party had none of this: the rules page and the pay table both
// hardcoded "bet", "pays", "paylines", "payout" and "buy", which is precisely
// what cost the sibling Go Bananas a review round.
//
// The two panels describe the same game, so the words that differ are named once
// here and referenced from both rather than each keeping its own copy to drift.
//
// Built on demand rather than at module scope: social() reads the page URL, which
// is not available while this module is being evaluated. Calling it from a
// component's init is safe; calling it at import time is not.
export const getSocialTerms = () => {
	const social = stateUrlDerived.social();
	const pick = (normal: string, socialText: string) => (social ? socialText : normal);

	return {
		totalBet: pick('total bet', 'total play'),

		// Must match what the bar button actually says — components-ui-pixi's
		// i18nDerived.buyBonus() renders "PLAY BONUS" in social play, so the rules
		// page cannot go on calling it Buy Bonus.
		buyBonusName: pick('Buy Bonus', 'Play Bonus'),
		buy: pick('buy', 'play'),
		entryVerb: pick('Buy', 'Play'), // sentence-initial, e.g. "Buy direct entry"

		payline: pick('payline', 'playline'),
		paylines: pick('paylines', 'playlines'),
		paylinesUpper: pick('PAYLINES', 'PLAYLINES'),
		// Stake named the replacement for this one explicitly: "PAY TABLE" →
		// "WIN TABLE". It is not the "pay → play" substitution the rest of the
		// table follows, which is what this originally guessed.
		payTableUpper: pick('PAY TABLE', 'WIN TABLE'),
		payTable: pick('pay table', 'win table'),
		pays: pick('pays', 'awards'),
		paysStart: pick('Pays', 'Awards'), // sentence-initial
		paid: pick('paid', 'awarded'),
		payout: pick('payout', 'win'),

		// Certification asked for "pay left to right" to read "start from left to
		// right" in social play.
		winsDirection: pick('pay left to right', 'start from left to right'),
		// The rules page states the same rule as a full sentence and cannot just
		// splice winsDirection in — the clause that follows is "starting from the
		// leftmost reel", which would produce "start from left to right, starting
		// from the leftmost reel". So that sentence is worded twice.
		combinationDirection: pick(
			'Winning combinations pay left to right, starting from the leftmost reel on adjacent reels',
			'Winning combinations start from left to right, on adjacent reels beginning with the leftmost reel',
		),
		// Scatters in this game do not need to be on a line.
		scatterPays: pick('pay anywhere on the reels', 'award anywhere on the reels'),

		// ── bet-mode copy ────────────────────────────────────────────────────
		// The buy-tier dialogs, buttons and tickers. These were missed on the
		// first pass because they live in a plain .ts data table rather than a
		// component, and certification came back on every one of them.
		bet: pick('bet', 'play amount'),
		betUpper: pick('BET', 'PLAY'),
		yourBet: pick('your bet', 'your play amount'),
		// Stake's table maps "place your bets" → "come and play".
		tickerIdle: pick('PLACE YOUR BET', 'COME AND PLAY'),
		// Button verb: "BUY 50×" → "PLAY 50×".
		buyUpper: pick('BUY', 'PLAY'),
		entrySentence: pick('Buy direct entry', 'Play direct entry'),
		buyInto: pick('Buy into', 'Play into'),
		// "bonus buy" is itself on the restricted table, so the social ticker
		// drops the qualifier rather than translating it word for word.
		bonusBuyActivated: pick('BONUS BUY ACTIVATED', 'BONUS ACTIVATED'),
	};
};
