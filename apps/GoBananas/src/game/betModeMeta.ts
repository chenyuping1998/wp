import type { BetModeData } from 'state-shared';

import config from './config';

// Go Bananas ships three math modes: base play, the 200x free-spins buy and
// the 50x superspin (hold'em) buy. The shared library ships a template default
// (ANTE / SUPER ANTE / …) with no backing math here, so we override the shared
// meta with exactly what the math supports.
const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

export const GO_BANANAS_BET_MODE_META: Record<string, BetModeData> = {
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
	BONUS: {
		mode: 'BONUS',
		costMultiplier: config.betModes.bonus.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.bonus.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'BUY FREE SPINS',
			dialog:
				'Purchase instant access to FREE SPINS for 200× your bet. Wilds expand to cover the whole reel, stick for every remaining spin, and re-roll a 2×–50× multiplier on each spin. Maximum win: 5,000× your bet.',
			description: '200× BET → FREE SPINS with sticky expanding Wilds (2×–50× multipliers)',
			button: 'BUY 200×',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'BONUS BUY ACTIVATED',
			bannerText: '',
		},
	},
	SUPERSPIN: {
		mode: 'SUPERSPIN',
		costMultiplier: config.betModes.superspin.cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: config.betModes.superspin.max_win,
		assets: { ...emptyAssets },
		text: {
			title: 'SUPER SPIN',
			dialog:
				'A hold-em style round for 50× your bet. You start with 3 spins — every coin that lands sticks to the board and resets your spins back to 3. When no spins remain, all stuck coins are paid out. Maximum win: 2,000× your bet.',
			description: '50× BET → 3 respins, coins stick and reset the count (max 2,000×)',
			button: 'BUY 50×',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'SUPER SPIN ACTIVATED',
			bannerText: '',
		},
	},
};
