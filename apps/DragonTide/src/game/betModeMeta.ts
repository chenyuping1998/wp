import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Dragon Tide ships four math modes: base play, EXTRA BET (math mode `ante`,
// 1.25x the bet, more dragon gates; wins and big-win tiers stay on the 1x bet),
// the free-spins buy and the super buy (every dragon pearl x10 or more). The
// shared library's template meta is overridden with exactly what the math supports.
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
const superCost = config.betModes.super_bonus.cost;
const superRtp = `${(config.betModes.super_bonus.rtp * 100).toFixed(2)}%`;
const superMaxWin = config.betModes.super_bonus.max_win.toLocaleString();
const superMin = 10;
const anteCost = config.betModes.ante.cost;
const anteRtp = `${(config.betModes.ante.rtp * 100).toFixed(2)}%`;

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
	ANTE: {
		mode: 'ANTE',
		costMultiplier: anteCost,
		type: 'activate',
		parent: '',
		children: '',
		maxWin: config.betModes.ante.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'EXTRA BET',
			get dialog() {
				return pick(
					`EXTRA BET costs ${anteCost}× your bet and brings more dragon gates, raising the chance to trigger FREE SPINS, at ${anteRtp} RTP. Wins and big-win levels are still counted on your base bet. EXTRA BET stays on until you turn it off.`,
					`EXTRA PLAY costs ${anteCost}× your amount and brings more dragon gates, raising the chance to trigger FREE SPINS, at ${anteRtp} RTP. Wins are still counted on your base amount. EXTRA PLAY stays on until you turn it off.`,
				);
			},
			description: 'More dragon gates: a higher chance of FREE SPINS.',
			button: 'ACTIVATE',
			get betAmountLabel() {
				return pick('EXTRA BET', 'EXTRA PLAY');
			},
			get tickerIdle() {
				return pick('EXTRA BET IS ACTIVE', 'EXTRA PLAY IS ACTIVE');
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
					`Buy direct entry into FREE SPINS for ${cost}× your bet, at ${rtp} RTP. ${fsSpins} free spins. On a spin with a win, every dragon pearl on the board joins a TOTAL MULTIPLIER that never resets during the feature, and that total multiplies the spin. Maximum win: ${maxWin}× your bet.`,
					`Enter FREE SPINS directly for ${cost}× your amount, at ${rtp} RTP. ${fsSpins} free spins. On a spin with a win, every dragon pearl on the board joins a TOTAL MULTIPLIER that never resets during the feature, and that total multiplies the spin. Maximum win: ${maxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${cost}× BET → FREE SPINS with a growing TOTAL MULTIPLIER`,
					`${cost}× AMOUNT → FREE SPINS with a growing TOTAL MULTIPLIER`,
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
	SUPER_BONUS: {
		mode: 'SUPER_BONUS',
		costMultiplier: superCost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.super_bonus.max_win,
		assets: { ...emptyAssets },
		text: {
			get title() {
				return pick('BUY SUPER FREE SPINS', 'SUPER FREE SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into SUPER FREE SPINS for ${superCost}× your bet, at ${superRtp} RTP. ${fsSpins} free spins. Every dragon pearl is ×${superMin} or more. On a spin with a win, the pearls join a TOTAL MULTIPLIER that never resets during the feature, and that total multiplies the spin. Maximum win: ${superMaxWin}× your bet.`,
					`Enter SUPER FREE SPINS directly for ${superCost}× your amount, at ${superRtp} RTP. ${fsSpins} free spins. Every dragon pearl is ×${superMin} or more. On a spin with a win, the pearls join a TOTAL MULTIPLIER that never resets during the feature, and that total multiplies the spin. Maximum win: ${superMaxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${superCost}× BET → FREE SPINS, every pearl ×${superMin} or more`,
					`${superCost}× AMOUNT → FREE SPINS, every pearl ×${superMin} or more`,
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
