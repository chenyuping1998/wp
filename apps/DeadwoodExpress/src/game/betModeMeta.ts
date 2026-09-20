import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';
// The three tiers live in game/featureTiers.ts, so the buy menu and the splash
// that opens a feature cannot describe the same thing differently.
import { FEATURE_TIERS, type FeatureTier } from './featureTiers';

// Hot Miami ships four math modes: base play plus one feature buy per bonus
// tier. The shared library ships a template default (ANTE / SUPER ANTE / …)
// with no backing math here, so the shared meta is overridden with exactly what
// the math supports - otherwise the buy screen offers unplayable options.
//
// Social play cannot use betting terminology anywhere the player can read it -
// that includes the feature-buy cards, their confirmation dialog and the
// ticker. `pick` chooses at access time rather than at module load, because
// social() reads the page URL, which is not available while this module is
// being evaluated. The text fields are getters for the same reason.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

const RTP_PCT = `${(config.rtp * 100).toFixed(2)}%`;
const MAX_WIN = config.betModes.base.max_win.toLocaleString();

const idleTicker = () => pick('PLACE YOUR BET', 'READY TO PLAY');

const buildTier = (tier: FeatureTier): BetModeData => {
	const mode = config.betModes[tier.key];
	const cost = mode.cost;
	return {
		mode: tier.mode,
		costMultiplier: cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: mode.max_win,
		assets: { ...emptyAssets },
		text: {
			title: tier.title,
			get dialog() {
				return pick(
					`Enter ${tier.title} directly for ${cost}× your bet, at ${(mode.rtp * 100).toFixed(2)}% RTP. ${tier.summary} Landing ${tier.scatters}${tier.key === 'bonus_hits' ? ' or more' : ''} FS Scatters in the base game opens the same feature. Maximum win: ${MAX_WIN}× your bet.`,
					`Enter ${tier.title} directly for ${cost}× your amount, at ${(mode.rtp * 100).toFixed(2)}% RTP. ${tier.summary} Landing ${tier.scatters}${tier.key === 'bonus_hits' ? ' or more' : ''} FS Scatters in normal play opens the same feature. Maximum win: ${MAX_WIN}× your amount.`,
				);
			},
			// An em dash, not the arrow this used to carry. U+2192 is in neither
			// shipped face — checked against the `cmap` of both TTFs — so the arrow
			// dropped out of Orbitron mid-string into whatever the browser had, at a
			// different weight and baseline, right in the middle of the buy menu.
			// U+00D7 and U+2014 are both present, so the rest of this line is safe.
			get description() {
				return pick(
					`${cost}× BET — ${tier.title} (${tier.scatters} Scatters)`,
					`${cost}× AMOUNT — ${tier.title} (${tier.scatters} Scatters)`,
				);
			},
			get button() {
				return pick(`BUY ${cost}×`, `PLAY ${cost}×`);
			},
			get tickerIdle() {
				return idleTicker();
			},
			tickerSpin: `${tier.title} ACTIVATED`,
			bannerText: '',
		},
	};
};

export const HOT_MIAMI_BET_MODE_META: Record<string, BetModeData> = {
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
				return idleTicker();
			},
			tickerSpin: 'GOOD LUCK',
			bannerText: '',
		},
	},
	...Object.fromEntries(FEATURE_TIERS.map((tier) => [tier.mode, buildTier(tier)])),
};
