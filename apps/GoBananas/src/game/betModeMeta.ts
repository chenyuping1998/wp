import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Go Bananas ships three math modes: base play, the 200x free-spins buy and
// the 50x superspin (hold'em) buy. The shared library ships a template default
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
		assets: { ...emptyAssets },
		text: {
			get title() {
				return pick('BUY FREE SPINS', 'FREE SPINS');
			},
			get dialog() {
				return pick(
					'Buy direct entry into FREE SPINS for 200× your bet, at the same 96.5% RTP as base play. Every Wild that lands expands to cover its whole reel, sticks for the rest of the feature, and re-rolls a 2×–50× multiplier on each spin. Maximum win: 10,000× your bet.',
					'Enter FREE SPINS directly for 200× your amount, at the same 96.5% RTP as normal play. Every Wild that lands expands to cover its whole reel, sticks for the rest of the feature, and re-rolls a 2×–50× multiplier on each spin. Maximum win: 10,000× your amount.',
				);
			},
			get description() {
				return pick(
					'200× BET → FREE SPINS with sticky expanding Wilds (2×–50× multipliers)',
					'200× AMOUNT → FREE SPINS with sticky expanding Wilds (2×–50× multipliers)',
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
	SUPERSPIN: {
		mode: 'SUPERSPIN',
		costMultiplier: config.betModes.superspin.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.superspin.max_win,
		assets: { ...emptyAssets },
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
