import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Ember Forge ships two math modes: base play and the 200x free-spins buy. The
// shared library ships a template default (ANTE / SUPER ANTE / …) with no backing
// math here, so the meta is overridden with exactly what the math supports.
//
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

export const EMBER_FORGE_BET_MODE_META: Record<string, BetModeData> = {
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
					'Buy direct entry into FREE SPINS for 200× your bet, at the same 96.5% RTP as base play. Every position that pays is heated and keeps a multiplier that grows by +1 each time it pays again — a cluster is paid by the total heat beneath it. Maximum win: 10,000× your bet.',
					'Enter FREE SPINS directly for 200× your amount, at the same 96.5% RTP as normal play. Every position that pays is heated and keeps a multiplier that grows by +1 each time it pays again — a cluster is paid by the total heat beneath it. Maximum win: 10,000× your amount.',
				);
			},
			get description() {
				return pick(
					'200× BET → FREE SPINS with growing position multipliers',
					'200× AMOUNT → FREE SPINS with growing position multipliers',
				);
			},
			get button() {
				return pick('BUY 200×', 'PLAY 200×');
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'BONUS BUY ACTIVATED',
			bannerText: '',
		},
	},
};
