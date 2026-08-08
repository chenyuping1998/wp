import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Crusher Yard ships two math modes: base play and the free-spins buy. The
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

const cost = config.betModes.bonus.cost;
const rtp = `${(config.rtp * 100).toFixed(2)}%`;
const maxWin = config.betModes.bonus.max_win.toLocaleString();

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

export const CRUSHER_YARD_BET_MODE_META: Record<string, BetModeData> = {
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
			// Every figure below is read from `config`, never typed in. These strings
			// arrived from the forge game quoting 200x, 96.5% RTP and a 10,000x cap,
			// none of which this game has ever had — and they are the text on the
			// confirmation dialog, i.e. the last thing a player reads before spending
			// money. Interpolating from config is what stops that happening again.
			get dialog() {
				return pick(
					`Buy direct entry into FREE SPINS for ${cost}× your bet, at the same ${rtp} RTP as base play. The pressure gauge starts at 1× and rises by +1× every time the board is crushed, and it does not reset between free spins. Nitrogen Tanks left on the board multiply that whole spin. Maximum win: ${maxWin}× your bet.`,
					`Enter FREE SPINS directly for ${cost}× your amount, at the same ${rtp} RTP as normal play. The pressure gauge starts at 1× and rises by +1× every time the board is crushed, and it does not reset between free spins. Nitrogen Tanks left on the board multiply that whole spin. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${cost}× BET → FREE SPINS with a gauge that never resets`,
					`${cost}× AMOUNT → FREE SPINS with a gauge that never resets`,
				);
			},
			get button() {
				return pick(`BUY ${cost}×`, `PLAY ${cost}×`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'BONUS BUY ACTIVATED',
			bannerText: '',
		},
	},
};
