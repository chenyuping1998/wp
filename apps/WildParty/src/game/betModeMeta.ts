import type { BetModeData } from 'state-shared';

import config from './config';

// Wild Party ships four bet modes: base play plus three Free-Spins buy tiers —
// Quick (50x), Bonus (100x) and Super (200x), each defined in config.betModes.
// We override the shared library's template meta (ANTE / SUPER ANTE / …), which
// has no backing math here, with WildParty-specific copy for the tiers we ship.
// Keep this list in sync with config.betModes and the Game Info paytable/rules.
const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

export const WILD_PARTY_BET_MODE_META: Record<string, BetModeData> = {
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
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'GOOD LUCK',
			bannerText: '',
		},
	},
	BONUS_QUICK: {
		mode: 'BONUS_QUICK',
		costMultiplier: config.betModes.bonus_quick.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus_quick.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'QUICK BONUS',
			dialog:
				'Buy direct entry into 5 Free Spins for 50× your bet — the lightest way in. The Global Multiplier starts at 1× and grows +1 for every Wild, applying to all wins (up to 100×). Max win 5,000× your bet.',
			description: '50× BET → 5 FREE SPINS · Multiplier starts 1×',
			button: 'BUY 50×',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'QUICK BONUS ACTIVATED',
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
			title: 'BONUS',
			dialog:
				'Buy direct entry into 5 Free Spins for 100× your bet — the same entry a natural Scatter trigger gives you, so the Global Multiplier starts at a random 1×–3×. It then grows +1 for every Wild, applying to all winning lines (up to 100×). Max win 5,000× your bet.',
			description: '100× BET → 5 FREE SPINS · Multiplier starts 1×–3×',
			button: 'BUY 100×',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'BONUS BUY ACTIVATED',
			bannerText: '',
		},
	},
	BONUS_SUPER: {
		mode: 'BONUS_SUPER',
		costMultiplier: config.betModes.bonus_super.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus_super.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'SUPER BONUS',
			dialog:
				'The premium high-volatility entry at 200× your bet. Buy into 5 Free Spins starting on an elevated Global Multiplier, which then grows +1 for every Wild (up to 100×). Built for bigger swings toward the 5,000× max win.',
			description: '200× BET → 5 FREE SPINS · Elevated start · High volatility',
			button: 'BUY 200×',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'SUPER BONUS ACTIVATED',
			bannerText: '',
		},
	},
};
