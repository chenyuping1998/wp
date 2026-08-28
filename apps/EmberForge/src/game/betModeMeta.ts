import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Ember Forge ships three math modes: base play, the 200x free-spins buy, and the
// 300x extended buy. The shared library ships a template default (ANTE / SUPER ANTE
// / …) with no backing math here, so the meta is overridden with exactly what the
// math supports.
//
// ModalBuyBonus renders one card per mode with type 'buy', so both buys appear
// without any layout change.
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

// Read from the maths rather than typed into the prose. The RTP used to be the
// literal "96.5%" in two places here, and when the game moved to 94% those two
// strings were the only thing in the frontend still claiming the old figure —
// which is precisely the sort of mismatch certification looks for.
const rtpPct = `${(config.rtp * 100).toFixed(1)}%`;
const bonusCost = config.betModes.bonus.cost;
const bigCost = config.betModes.bonusplus.cost;
// Read per mode even though the two currently match. They did not during
// development — bonusplus was briefly capped at 2000x while it was being tried as
// a low-variance mode — and a single shared constant is exactly what would have
// let the copy keep claiming 10,000x through that.
const bonusMaxWin = config.betModes.bonus.max_win.toLocaleString();
const bigMaxWin = config.betModes.bonusplus.max_win.toLocaleString();

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
					`Buy direct entry into FREE SPINS for ${bonusCost}× your bet, at the same ${rtpPct} RTP as base play. Enters on 4 or 5 Scatters, for 10 or 12 spins. Every position that pays is heated and keeps a multiplier that grows by +1 each time it pays again — a cluster is paid by the total heat beneath it. Maximum win: ${bonusMaxWin}× your bet.`,
					`Enter FREE SPINS directly for ${bonusCost}× your amount, at the same ${rtpPct} RTP as normal play. Enters on 4 or 5 Scatters, for 10 or 12 spins. Every position that pays is heated and keeps a multiplier that grows by +1 each time it pays again — a cluster is paid by the total heat beneath it. Maximum win: ${bonusMaxWin}× your amount.`,
				);
			},
			get description() {
				return pick(
					`${bonusCost}× BET → FREE SPINS with growing position multipliers`,
					`${bonusCost}× AMOUNT → FREE SPINS with growing position multipliers`,
				);
			},
			get button() {
				return pick(`BUY ${bonusCost}×`, `PLAY ${bonusCost}×`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			// "BUY" is on Stake's restricted list and this was a bare literal, so it
			// showed unchanged in social play. Every other string in this file was
			// already branched; this one and its sibling below were missed because
			// the ticker is not a surface anybody screenshots.
			get tickerSpin() {
				return pick('BONUS BUY ACTIVATED', 'FEATURE ACTIVATED');
			},
			bannerText: '',
		},
	},
	// The premium entry: the same feature, longer. It is NOT a low-variance mode —
	// that was tried and does not work at this price and length (see the maths
	// config) — so nothing here should suggest it is safer, only bigger.
	BONUSPLUS: {
		mode: 'BONUSPLUS',
		costMultiplier: config.betModes.bonusplus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonusplus.max_win,
		assets: { ...emptyAssets },
		text: {
			get title() {
				return pick('BUY EXTENDED SPINS', 'EXTENDED SPINS');
			},
			get dialog() {
				return pick(
					`Buy direct entry into an extended FREE SPINS run for ${bigCost}× your bet. Enters on 6 or 7 Scatters, for 15 or 18 spins — half again as many as the ${bonusCost}× entry. More spins means more time for positions to heat, and heat is never reset within a feature. RTP is ${rtpPct} and the maximum win is ${bigMaxWin}× your bet, the same as every other mode.`,
					`Enter an extended FREE SPINS run directly for ${bigCost}× your amount. Enters on 6 or 7 Scatters, for 15 or 18 spins — half again as many as the ${bonusCost}× entry. More spins means more time for positions to heat, and heat is never reset within a feature. The return is ${rtpPct} and the maximum win is ${bigMaxWin}× your amount, the same as every other mode.`,
				);
			},
			get description() {
				return pick(
					`${bigCost}× BET → 15 or 18 FREE SPINS, more time to build heat`,
					`${bigCost}× AMOUNT → 15 or 18 FREE SPINS, more time to build heat`,
				);
			},
			get button() {
				return pick(`BUY ${bigCost}×`, `PLAY ${bigCost}×`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('EXTENDED BUY ACTIVATED', 'EXTENDED FEATURE ACTIVATED');
			},
			bannerText: '',
		},
	},
};
