import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Go Boomana ships five math modes: base play, the 50x hold and spin, and
// three free-spin buys at 100x / 200x / 300x. The keys here are the math mode
// names uppercased — stateBet looks them up with activeBetModeKey.toUpperCase().
// The shared library ships a template default (ANTE / SUPER ANTE / …) with no
// backing math here, so we override the shared meta with exactly what the math
// supports.
//
// WHAT THE THREE BUYS ACTUALLY DIFFER BY
//
// Each tier opens with more dynamite already in the blast meter — 0, 2, 4 — and that is the
// thing the player sees. It is NOT where the price comes from, and the copy is
// written carefully around that. Measured, going from 0 to all 5 pre-split reels
// spans only about 2x, because splits stick and the board fills itself within a
// few spins anyway; 1 -> 3 is +43% against a 3x price step. The money comes from
// the tiers' hotter reels and longer runs. So the copy leads with the head start
// AND states the spin count, rather than implying the head start alone is worth
// triple.
//
// Social play cannot use betting terminology anywhere the player can read it —
// that includes the feature cards, their confirmation dialog and the ticker.
// `pick` chooses at access time rather than at module load: social() reads the
// page URL, which is not available while this module is being evaluated.
//
// The text fields below are getters for the same reason; they are still plain
// string properties as far as BetModeData is concerned.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

// The buy modal's card art. A DOM <img> src, not a pixi asset key — the cards
// are HTML, not canvas.
//
// NOTE: every one of these files is still gen-2 artwork, copied to the new mode
// names so nothing renders broken. card_bonus200 and card_bonus300 are currently
// the SAME image. design/generate_mode_cards.mjs must be re-run against this
// game's symbols before submission, and the three buy cards want to differ by
// the number of split reels they show, since that is what the tiers differ by.
const cardArt = (name: string) => `${base}/assets/sprites/goBananasUi/card_${name}.png`;

// Repeated in every dialog; kept in one place so the figure cannot drift between
// cards the way it did in gen-2.
const MAX_WIN = '10,000×';
// A full board is every cell the same symbol, so every reel contributes all four
// of its rows: 4^5. Derived, because the board size lives in the maths config.
const WAYS = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1).toLocaleString();
const RTP = `${(config.rtp * 100).toFixed(0)}%`;

export const GO_BANANAS_BET_MODE_META: Record<string, BetModeData> = {
	BASE: {
		mode: 'BASE',
		costMultiplier: config.betModes.base.cost,
		type: 'default',
		parent: '',
		children: '',
		maxWin: config.betModes.base.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'BASE',
			dialog: '',
			button: '',
			betAmountLabel: '',
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'GOOD LUCK',
			bannerText: '',
		},
	},

	// The 50x hold and spin. Carried over from gen-1 and gen-2, renamed from
	// "hold and spin". It deliberately shares no vocabulary with the three free-spin
	// cards, because it is a different board: coins, not ways.
	HOLDANDSPIN: {
		mode: 'HOLDANDSPIN',
		costMultiplier: config.betModes.holdandspin.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.holdandspin.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('holdandspin') },
		text: {
			title: 'HOLD AND SPIN',
			get dialog() {
				return pick(
					`A hold-and-spin round for 50× your bet. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and paid out. Maximum win: 1,000× your bet.`,
					`A hold-and-spin round for 50× your amount. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and awarded. Maximum win: 1,000× your amount.`,
				);
			},
			get description() {
				return pick(
					'50× BET → 3 respins, Coins stick and reset the count (max 1,000×)',
					'50× AMOUNT → 3 respins, Coins stick and reset the count (max 1,000×)',
				);
			},
			get button() {
				return pick('BUY 50×', 'PLAY 50×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'HOLD AND SPIN ACTIVATED',
			bannerText: '',
		},
	},

	BONUS100: {
		mode: 'BONUS100',
		costMultiplier: config.betModes.bonus100.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus100.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus100') },
		text: {
			get title() {
				return pick('BUY FREE SPINS', 'FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into ${config.betModes.bonus100.spins} FREE SPINS for 100× your bet, at the same ${RTP} RTP as base play. Every Dynamite that lands fills its reel with the best symbol on it, and widens the next blast. Five reels of one symbol is 1,024 ways at once. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.bonus100.spins} FREE SPINS directly for 100× your amount, at the same ${RTP} RTP as normal play. Every Dynamite that lands fills its reel with the best symbol on it, and widens the next blast. Five reels of one symbol is 1,024 ways at once. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`100× BET → ${config.betModes.bonus100.spins} FREE SPINS, opening with the blast meter empty: the first Dynamite blows one reel`,
					`100× AMOUNT → ${config.betModes.bonus100.spins} FREE SPINS, opening with the blast meter empty: the first Dynamite blows one reel`,
				);
			},
			get button() {
				return pick('BUY 100×', 'PLAY 100×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('BONUS BUY ACTIVATED', 'BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},

	BONUS200: {
		mode: 'BONUS200',
		costMultiplier: config.betModes.bonus200.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus200.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus200') },
		text: {
			get title() {
				return pick('BUY SUPER FREE SPINS', 'SUPER FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy entry into ${config.betModes.bonus200.spins} FREE SPINS for 200× your bet, at the same ${RTP} RTP as base play. The blast meter opens half-filled, so the first Dynamite already blows two reels. Every Dynamite widens the next blast, and five reels of one symbol is ${WAYS} ways at once. Maximum win: ${MAX_WIN} your bet.`,
					`Enter ${config.betModes.bonus200.spins} FREE SPINS for 200× your amount, at the same ${RTP} RTP as normal play. The blast meter opens half-filled, so the first Dynamite already blows two reels. Every Dynamite widens the next blast, and five reels of one symbol is ${WAYS} ways at once. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`200× BET → ${config.betModes.bonus200.spins} FREE SPINS, opening with the blast meter half-filled: the first Dynamite blows two reels`,
					`200× AMOUNT → ${config.betModes.bonus200.spins} FREE SPINS, opening with the blast meter half-filled: the first Dynamite blows two reels`,
				);
			},
			get button() {
				return pick('BUY 200×', 'PLAY 200×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('SUPER BONUS BUY ACTIVATED', 'SUPER BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},

	// The top tier. Its maximum win is 1,500x the base bet — 5x this mode's own
	// cost, against 15x for BONUS100 — so the copy leads on the head start and the
	// spin count and does NOT imply a bigger top end than the cheaper tiers. It
	// has the highest floor of the three, not the highest ceiling.
	BONUS300: {
		mode: 'BONUS300',
		costMultiplier: config.betModes.bonus300.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus300.max_win,
		assets: { ...emptyAssets, dialogImage: cardArt('bonus300') },
		text: {
			get title() {
				return pick('BUY MAX FREE SPINS', 'MAX FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy the strongest entry for 300× your bet, at the same ${RTP} RTP as base play: ${config.betModes.bonus300.spins} FREE SPINS opening with the blast meter nearly full, so the first Dynamite already blows three reels. Every Dynamite widens the next blast, and five reels of one symbol is ${WAYS} ways at once. Maximum win: ${MAX_WIN} your bet.`,
					`Enter the strongest round for 300× your amount, at the same ${RTP} RTP as normal play: ${config.betModes.bonus300.spins} FREE SPINS opening with the blast meter nearly full, so the first Dynamite already blows three reels. Every Dynamite widens the next blast, and five reels of one symbol is ${WAYS} ways at once. Maximum win: ${MAX_WIN} your amount.`,
				);
			},
			get description() {
				return pick(
					`300× BET → ${config.betModes.bonus300.spins} FREE SPINS, opening with the blast meter nearly full: the first Dynamite blows three reels`,
					`300× AMOUNT → ${config.betModes.bonus300.spins} FREE SPINS, opening with the blast meter nearly full: the first Dynamite blows three reels`,
				);
			},
			get button() {
				return pick('BUY 300×', 'PLAY 300×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('MAX BONUS BUY ACTIVATED', 'MAX BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},
};
