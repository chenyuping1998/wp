import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Medusa Gaze ships two math modes: base play and the free-spins buy. The shared
// library ships a template default (ANTE / SUPER ANTE / …) with no backing math
// here, so the meta is overridden with exactly what the math supports.
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
const fsSpins = config.freeSpins.spins;

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

export const MEDUSA_GAZE_BET_MODE_META: Record<string, BetModeData> = {
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
			// Every figure below is read from `config`, never typed in: this is the
			// text on the confirmation dialog, the last thing a player reads before
			// spending, so it must not drift from the maths.
			get dialog() {
				return pick(
					`Buy direct entry into FREE SPINS for ${cost}× your bet, at the same ${rtp} RTP as base play. ${fsSpins} free spins. Every multiplier Medusa throws on a spin with a win is added to a running total that never resets during the feature, and that total multiplies the spin. Maximum win: ${maxWin}× your bet.`,
					`Enter FREE SPINS directly for ${cost}× your amount, at the same ${rtp} RTP as normal play. ${fsSpins} free spins. Every multiplier Medusa throws on a spin with a win is added to a running total that never resets during the feature, and that total multiplies the spin. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${cost}× BET → FREE SPINS with a running Medusa multiplier`,
					`${cost}× AMOUNT → FREE SPINS with a running Medusa multiplier`,
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
