import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import { base } from '$app/paths';

import config from './config';

// Go Bananas 100 ships four math modes: base play, the 200x free-spins buy, the
// 500x super free-spins buy and the 50x superspin (hold'em) buy. The keys here
// are the math mode names uppercased — stateBet looks them up with
// activeBetModeKey.toUpperCase(). The shared library ships a template default
// (ANTE / SUPER ANTE / …) with no backing math here, so we override the shared
// meta with exactly what the math supports.
// Social play cannot use betting terminology anywhere the player can read it —
// that includes the feature-buy cards, their confirmation dialog and the ticker.
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

// The buy modal's card art. A DOM <img> src, not a pixi asset key — the bonus
// cards are HTML, not canvas.
//
// Supplying this is what opts the game into BonusCard's full-bleed cover: the
// component draws one only when the field is non-empty, and every other game in
// the workspace leaves it as ''. Without it the three cards are identical dark
// rectangles told apart only by their words, which is what they were.
//
// `icon` is deliberately left empty. It stamps a small glyph above the
// description, and it was the right answer while the cards had no art — a 44px
// mark was the only thing separating them. Now that each card carries its own
// picture edge to edge, an icon would put the same motif on the card twice, once
// full size behind and once as a thumbnail in the middle of the text.
//
// See design/generate_mode_cards.mjs — the art is composited from this game's
// own symbol sprites, so it follows the symbols whenever they are regenerated.
const cardArt = (name: string) => `${base}/assets/sprites/goBananasUi/card_${name}.png`;

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
	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus.max_win,
		// one locked reel and three Scatters — the ordinary way in
		assets: { ...emptyAssets, dialogImage: cardArt('bonus') },
		text: {
			get title() {
				return pick('BUY FREE SPINS', 'FREE SPINS');
			},
			get dialog() {
				return pick(
					'Buy direct entry into FREE SPINS for 200× your bet, at the same 95% RTP as base play. Every Wild that lands expands to cover its whole reel and sticks for the rest of the feature — and its multiplier never resets, growing on every spin up to 100×. Multipliers on the same line add together. Maximum win: 25,000× your bet.',
					'Enter FREE SPINS directly for 200× your amount, at the same 95% RTP as normal play. Every Wild that lands expands to cover its whole reel and sticks for the rest of the feature — and its multiplier never resets, growing on every spin up to 100×. Multipliers on the same line add together. Maximum win: 25,000× your amount.',
				);
			},
			get description() {
				return pick(
					'200× BET → FREE SPINS with sticky Wilds whose multipliers grow to 100×',
					'200× AMOUNT → FREE SPINS with sticky Wilds whose multipliers grow to 100×',
				);
			},
			get button() {
				return pick('BUY 200×', 'PLAY 200×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			// the ticker is player-facing in both modes, so "BUY" has to go in social
			get tickerSpin() {
				return pick('BONUS BUY ACTIVATED', 'BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},
	// The 500x buy. Max win is 25,000x the base bet, i.e. 50x this mode's own cost
	// against 125x for BONUS, so the copy leads on the guaranteed 5-Scatter entry
	// rather than implying a bigger top end than BONUS has.
	//
	// That framing matches what the optimised maths actually does. Against the 200x
	// buy this mode has a higher floor (median 0.54x its cost vs 0.31x, and 73%
	// chance of finishing under cost vs 80%) and better odds at the cap (1 in 2,000
	// vs 1 in 12,500), paid for out of the p90-p99 band, where it comes in below
	// BONUS. It is the safer buy, not the wilder one — do not write copy that sells
	// it as the bigger-win mode.
	SUPERBONUS: {
		mode: 'SUPERBONUS',
		costMultiplier: config.betModes.superbonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.superbonus.max_win,
		// the same picture with five Scatters and two locked reels: what 500x buys
		// over 200x is more of exactly this
		assets: { ...emptyAssets, dialogImage: cardArt('superbonus') },
		text: {
			get title() {
				return pick('BUY SUPER FREE SPINS', 'SUPER FREE SPINS');
			},
			get dialog() {
				return pick(
					'Buy the strongest entry into FREE SPINS for 500× your bet, at the same 95% RTP as base play. Guarantees a full 5-Scatter start — 18 spins instead of 8 to 15 — and Wilds land more often, start higher and climb faster, all the way to 100×. Maximum win: 25,000× your bet.',
					'Enter SUPER FREE SPINS for 500× your amount, at the same 95% RTP as normal play. Guarantees a full 5-Scatter start — 18 spins instead of 8 to 15 — and Wilds land more often, start higher and climb faster, all the way to 100×. Maximum win: 25,000× your amount.',
				);
			},
			get description() {
				return pick(
					'500× BET → 18 FREE SPINS, more Wilds and faster multiplier growth',
					'500× AMOUNT → 18 FREE SPINS, more Wilds and faster multiplier growth',
				);
			},
			get button() {
				return pick('BUY 500×', 'PLAY 500×');
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
	SUPERSPIN: {
		mode: 'SUPERSPIN',
		costMultiplier: config.betModes.superspin.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.superspin.max_win,
		// a part-filled board of held Coins — deliberately shares no vocabulary
		// with the two free-spin cards, because it is not free spins
		assets: { ...emptyAssets, dialogImage: cardArt('superspin') },
		text: {
			title: 'SUPER SPIN',
			get dialog() {
				return pick(
					'A hold-and-spin round for 50× your bet. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and paid out. Maximum win: 2,000× your bet.',
					'A hold-and-spin round for 50× your amount. You start with 3 respins — every Coin that lands sticks to the board and resets the respins back to 3. When no respins remain, all stuck Coin values are added up and awarded. Maximum win: 2,000× your amount.',
				);
			},
			get description() {
				return pick(
					'50× BET → 3 respins, Coins stick and reset the count (max 2,000×)',
					'50× AMOUNT → 3 respins, Coins stick and reset the count (max 2,000×)',
				);
			},
			get button() {
				return pick('BUY 50×', 'PLAY 50×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'SUPER SPIN ACTIVATED',
			bannerText: '',
		},
	},
};
