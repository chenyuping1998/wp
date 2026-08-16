import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Ember Forge ships three math modes: base play, the 200x free-spins buy, and the
// 300x steady buy. The shared library ships a template default (ANTE / SUPER ANTE
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
const steadyCost = config.betModes.bonusplus.cost;
// The two buys do NOT share a ceiling — the steady one is capped far lower, and
// that cap is the reason it is steady. Read per mode so the copy cannot claim a
// number the maths does not back.
const bonusMaxWin = config.betModes.bonus.max_win.toLocaleString();
const steadyMaxWin = config.betModes.bonusplus.max_win.toLocaleString();

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
					`Buy direct entry into FREE SPINS for ${bonusCost}× your bet, at the same ${rtpPct} RTP as base play. Enters on 4 or 5 Scatters, for 10 or 12 spins. Every position that pays is heated and keeps a multiplier that grows by +1 each time it pays again — a cluster is paid by the total heat beneath it. The high-ceiling entry: maximum win ${bonusMaxWin}× your bet.`,
					`Enter FREE SPINS directly for ${bonusCost}× your amount, at the same ${rtpPct} RTP as normal play. Enters on 4 or 5 Scatters, for 10 or 12 spins. Every position that pays is heated and keeps a multiplier that grows by +1 each time it pays again — a cluster is paid by the total heat beneath it. The high-ceiling entry: maximum win ${bonusMaxWin}× your amount.`,
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
	// The steadier entry. What it sells is a narrower spread, NOT a better return,
	// and the copy has to say so plainly in both modes — a card that costs half
	// again as much and does not say why invites the reading that it pays better.
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
				return pick('BUY STEADY SPINS', 'STEADY SPINS');
			},
			get dialog() {
				return pick(
					`Buy entry into a longer FREE SPINS run for ${steadyCost}× your bet. Enters on 5 or 6 Scatters, for 12 or 15 spins. The RTP is ${rtpPct}, the same as every other mode — this does not pay more overall, it pays more evenly. The trade is the ceiling: maximum win ${steadyMaxWin}× your bet, against ${bonusMaxWin}× on the ${bonusCost}× entry. Capping the top end is what lets the typical result sit much closer to what you paid.`,
					`Enter a longer FREE SPINS run for ${steadyCost}× your amount. Enters on 5 or 6 Scatters, for 12 or 15 spins. The return is ${rtpPct}, the same as every other mode — this does not give more overall, it gives more evenly. The trade is the ceiling: maximum win ${steadyMaxWin}× your amount, against ${bonusMaxWin}× on the ${bonusCost}× entry. Capping the top end is what lets the typical result sit much closer to what you played.`,
				);
			},
			get description() {
				return pick(
					`${steadyCost}× BET → longer FREE SPINS, steadier results, ${steadyMaxWin}× cap`,
					`${steadyCost}× AMOUNT → longer FREE SPINS, steadier results, ${steadyMaxWin}× cap`,
				);
			},
			get button() {
				return pick(`BUY ${steadyCost}×`, `PLAY ${steadyCost}×`);
			},
			get tickerIdle() {
				return pick('PLACE YOUR BET', 'READY TO PLAY');
			},
			get tickerSpin() {
				return pick('STEADY BUY ACTIVATED', 'STEADY FEATURE ACTIVATED');
			},
			bannerText: '',
		},
	},
};
