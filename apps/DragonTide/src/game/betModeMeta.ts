import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Hypno Monkey ships three math modes: base play, the free-spins buy and the
// super buy (every pocket watch x10 or more, Stone 2026-10-28). The shared
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
const rtp = `${(config.betModes.bonus.rtp * 100).toFixed(2)}%`;
const maxWin = config.betModes.bonus.max_win.toLocaleString();
const fsSpins = config.freeSpins.spins;
const superCost = config.betModes.super.cost;
const superRtp = `${(config.betModes.super.rtp * 100).toFixed(2)}%`;
const superMaxWin = config.betModes.super.max_win.toLocaleString();
const superMin = Math.min(...config.hypno.superValues);

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
					`Buy direct entry into FREE SPINS for ${cost}× your bet, at ${rtp} RTP. ${fsSpins} free spins. Every pocket-watch multiplier the Hypnotist adds on a spin with a win joins a running total that never resets during the feature, and that total multiplies the spin. Maximum win: ${maxWin}× your bet.`,
					`Enter FREE SPINS directly for ${cost}× your amount, at ${rtp} RTP. ${fsSpins} free spins. Every pocket-watch multiplier the Hypnotist adds on a spin with a win joins a running total that never resets during the feature, and that total multiplies the spin. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${cost}× BET → FREE SPINS with a running watch multiplier`,
					`${cost}× AMOUNT → FREE SPINS with a running watch multiplier`,
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
	SUPER: {
		mode: 'SUPER',
		costMultiplier: superCost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.super.max_win,
		assets: { ...emptyAssets },
		text: {
			get title() {
				return pick('BUY SUPER FREE SPINS', 'SUPER FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into SUPER FREE SPINS for ${superCost}× your bet, at ${superRtp} RTP. ${fsSpins} free spins. Every pocket watch the Hypnotist throws is ×${superMin} or more. Watches added on a spin with a win join a running total that never resets during the feature, and that total multiplies the spin. Maximum win: ${superMaxWin}× your bet.`,
					`Enter SUPER FREE SPINS directly for ${superCost}× your amount, at ${superRtp} RTP. ${fsSpins} free spins. Every pocket watch the Hypnotist throws is ×${superMin} or more. Watches added on a spin with a win join a running total that never resets during the feature, and that total multiplies the spin. Maximum win: ${superMaxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${superCost}× BET → FREE SPINS, every watch ×${superMin} or more`,
					`${superCost}× AMOUNT → FREE SPINS, every watch ×${superMin} or more`,
				);
			},
			get button() {
				return pick(`BUY ${superCost}×`, `PLAY ${superCost}×`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			tickerSpin: 'SUPER BONUS ACTIVATED',
			bannerText: '',
		},
	},
};
