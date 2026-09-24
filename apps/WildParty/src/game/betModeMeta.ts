import type { BetModeData } from 'state-shared';

import config from './config';
import { getSocialTerms } from './socialTerms';

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

// Built on call, not at module scope.
//
// Every string below is player-readable, and social play forbids betting
// terminology in all of it — "bet", "buy", "place your bets", "bonus buy". This
// table was hardcoded English through the first social pass and certification
// came back on the lot of it: the buy-tier dialogs, the BUY buttons, and the
// mode names shown in the replay window.
//
// It has to be a function because getSocialTerms() reads the page URL, which is
// not available while a module is being evaluated. setContext() calls this from
// component init, where it is.
export const buildBetModeMeta = (): Record<string, BetModeData> => {
	const t = getSocialTerms();
	return {
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
				tickerIdle: t.tickerIdle,
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
					`${t.entrySentence} into 5 Free Spins for 50× ${t.yourBet} — the lightest way in. The Global Multiplier starts at 1× and grows +1 for every Wild, applying to all wins (up to 100×). Max win 5,000× ${t.yourBet}.`,
				description: `50× ${t.betUpper} → 5 FREE SPINS · Multiplier starts 1×`,
				button: `${t.buyUpper} 50×`,
				tickerIdle: t.tickerIdle,
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
					`${t.entrySentence} into 5 Free Spins for 100× ${t.yourBet} — the same entry a natural Scatter trigger gives you, so the Global Multiplier starts at a random 1×–3×. It then grows +1 for every Wild, applying to all winning lines (up to 100×). Max win 5,000× ${t.yourBet}.`,
				description: `100× ${t.betUpper} → 5 FREE SPINS · Multiplier starts 1×–3×`,
				button: `${t.buyUpper} 100×`,
				tickerIdle: t.tickerIdle,
				tickerSpin: t.bonusBuyActivated,
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
					`The premium high-volatility entry at 200× ${t.yourBet}. ${t.buyInto} 5 Free Spins starting on an elevated Global Multiplier, which then grows +1 for every Wild (up to 100×). Built for bigger swings toward the 5,000× max win.`,
				description: `200× ${t.betUpper} → 5 FREE SPINS · Elevated start · High volatility`,
				button: `${t.buyUpper} 200×`,
				tickerIdle: t.tickerIdle,
				tickerSpin: 'SUPER BONUS ACTIVATED',
				bannerText: '',
			},
		},
	};
};
