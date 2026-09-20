import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';
// The three tiers live in game/featureTiers.ts, so the buy menu and the splash
// that opens a feature cannot describe the same thing differently.
import { FEATURE_TIERS, type FeatureTier } from './featureTiers';

// Turf War ships four math modes: base play plus one feature buy per bonus
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

// Each mode's OWN rate, not the base game's.
//
// This used to be one `RTP_PCT` off `config.rtp` printed into all three
// dialogs, over the words "at the same X% RTP as base play". That was true
// while every mode sat on one number; the modes now climb with the price
// ladder (94.58 / 94.63 / 94.67 / 94.78 — retargeted down 0.5 points from
// 95.08/95.13/95.17/95.28 on 2026-09-03, spread unchanged), so the Lookout
// dialog was stating a specific figure that was not the Lookout's. An RTP
// printed next to a price is the most load-bearing sentence on the screen, so
// it is read per mode and the "same as base play" claim is gone with it.
const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
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
					`Enter ${tier.title} directly for ${cost}× your bet, at an RTP of ${pct(mode.rtp)}. ${tier.summary} Landing ${tier.scatters} Scatters in the base game opens the same feature. Maximum win: ${MAX_WIN}× your bet.`,
					`Enter ${tier.title} directly for ${cost}× your amount, at an RTP of ${pct(mode.rtp)}. ${tier.summary} Landing ${tier.scatters} Scatters in normal play opens the same feature. Maximum win: ${MAX_WIN}× your amount.`,
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

export const TURF_WAR_BET_MODE_META: Record<string, BetModeData> = {
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
