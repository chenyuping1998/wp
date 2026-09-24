import type { BetModeData } from 'state-shared';
import { stateUrlDerived } from 'state-shared';

import config from './config';

// Moooo ships three math modes: base play plus two feature buys. The shared
// library ships a template default (ANTE / SUPER ANTE / …)
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

// Each mode states ITS OWN RTP.
//
// This used to print one figure and call it "the same RTP as base play". The
// three modes are no longer equal — base 94.50%, Free Spins 94.83%, Super
// 94.89% — and while that spread is well inside what Stake allows, a buy card
// claiming a number the mode does not pay is a false statement about the
// player's return, which is a different kind of wrong from a typo.
const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
const MAX_WIN = config.betModes.base.max_win.toLocaleString();

const idleTicker = () => pick('PLACE YOUR BET', 'READY TO PLAY');

type TierCopy = {
	key: 'bonus' | 'super';
	mode: string;
	title: string;
	scatters: number;
	summary: string;
};

const TIERS: TierCopy[] = [
	{
		key: 'bonus',
		mode: 'BONUS',
		title: 'FREE SPINS',
		scatters: 3,
		summary:
			'10 free spins with every Milk Meter starting on its first step. A Milk Churn landing on a reel raises that reel\u2019s meter one step, and a reel\u2019s meter is the lowest bell a MOOOO cow can carry there for the rest of the round.',
	},
	{
		key: 'super',
		mode: 'SUPER',
		title: 'SUPER FREE SPINS',
		scatters: 4,
		summary:
			'The same 10 free spins, but every Milk Meter starts one step in, so no reel can carry a brass bell at any point in the round.',
	},
];

// Volatility labels, and why they are the way round they are.
//
// Super costs 2.5x what Free Spins costs and pays 2.5x as much, and it is also
// the CALMER ride — measured, not asserted. On the shipped lookup tables:
//
//   Free Spins  100x   avg  94.83x   CV 1.83
//   Super       250x   avg 237.22x   CV 1.27
//
// Starting every meter a step in removes the bad early spins rather than adding
// a bigger top end, so the spread relative to what the mode pays comes down.
//
// One honest caveat, because the shape changed when the price did: at 175x
// Super also returned less than its stake noticeably less often (74.4% against
// 79.8%). At 250x that advantage is gone — both buys now sit at ~79.6%. Super is
// steadier in SPREAD, not in how often it disappoints. "HIGH" against "VERY
// HIGH" is still the right way round; it just no longer means what it meant at
// the old price.
//
// This is a claim about a distribution, and distributions move when prices and
// RTP targets move — so it is CHECKED rather than remembered. Run
// `design/check_volatility.py`, which reads these labels and the shipped lookup
// tables and fails if the ordering disagrees.
const VOLATILITY: Record<TierCopy['key'], string> = {
	bonus: 'VERY HIGH',
	super: 'HIGH',
};

const buildTier = (tier: TierCopy): BetModeData => {
	const mode = config.betModes[tier.key];
	const cost = mode.cost;
	return {
		mode: tier.mode,
		costMultiplier: cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: mode.max_win,
		assets: { ...emptyAssets, volatility: VOLATILITY[tier.key], dialogVolatility: VOLATILITY[tier.key] },
		text: {
			title: tier.title,
			get dialog() {
				return pick(
					`Enter ${tier.title} directly for ${cost}× your bet, at ${pct(mode.rtp)} RTP. ${tier.summary} Landing ${tier.scatters} FS Scatters in the base game opens the same feature. Maximum win: ${MAX_WIN}× your bet.`,
					`Enter ${tier.title} directly for ${cost}× your amount, at ${pct(mode.rtp)} RTP. ${tier.summary} Landing ${tier.scatters} FS Scatters in normal play opens the same feature. Maximum win: ${MAX_WIN}× your amount.`,
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

export const MOOOO_BET_MODE_META: Record<string, BetModeData> = {
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
	...Object.fromEntries(TIERS.map((tier) => [tier.mode, buildTier(tier)])),
};
