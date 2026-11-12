import type { BetModeData } from 'state-shared';
import { stateBet, stateUrlDerived } from 'state-shared';
import { numberToCurrencyString } from 'utils-shared/amount';

import config from './config';
import { featureTextVars } from './featureRules';
import { gameText } from './i18nText';

// Wild Alchemy ships three math modes: base play plus two feature buys. The
// shared library ships a template default (ANTE / SUPER ANTE / …) with no
// backing math here, so the shared meta is overridden with exactly what the
// math supports — otherwise the buy screen offers unplayable options.
//
// Social play cannot use betting terminology anywhere the player can read it:
// `pick` chooses at access time rather than at module load, because social()
// reads the page URL, which is not available while this module is evaluated.
const pick = (normal: string, socialText: string) =>
	stateUrlDerived.social() ? socialText : normal;

const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

/** RTP in the player's notation (96,05 % in de), Latin digits */
const pct = (lang: string, value: number) =>
	new Intl.NumberFormat(`${lang === 'en' ? 'en-US' : lang}-u-nu-latn`, {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);

const idleTicker = () => pick('PLACE YOUR BET', 'READY TO PLAY');

export type FeatureBuy = {
	key: 'bonus' | 'super_bonus';
	mode: 'BONUS' | 'SUPER_BONUS';
	/** product name — English in every language, as on the intro card and rules */
	title: string;
	/** i18nText key of the one-sentence feature summary */
	summaryKey: 'buySummaryFree' | 'buySummarySuper';
};

/**
 * The two buys, in price order. SPEC §1: FREE GAME opens 6 spins at ×1; SUPER
 * FREE GAME opens one step up the ladder. The figures in the copy are never
 * typed here — they come from config and FEATURE_RULES (featureTextVars).
 */
export const FEATURE_BUYS: FeatureBuy[] = [
	{ key: 'bonus', mode: 'BONUS', title: 'FREE GAME', summaryKey: 'buySummaryFree' },
	{ key: 'super_bonus', mode: 'SUPER_BONUS', title: 'SUPER FREE GAME', summaryKey: 'buySummarySuper' },
];

/**
 * The confirm dialog's paragraph (shared ModalBuyBonusConfirm renders it as
 * plain text). Real-money play reads i18nText in the player's language; social
 * play is English-only and words the bet as "amount" (socialTerms).
 * Arabic direction comes from the dir="rtl" wrapper in components/ui/Modals.svelte.
 */
const buyDialog = (buy: FeatureBuy, cost: number, rtp: number) => {
	const lang = stateUrlDerived.lang();
	const base = featureTextVars(lang);
	const vars = { ...base, ladder: base.ladderSteps, title: buy.title, cost, rtp: pct(lang, rtp) };
	const summary = gameText(buy.summaryKey, vars);
	// The actual amount, not only the multiple: the bet as it stands when the
	// dialog renders (stateBet is reactive, so a stepper change re-reads it).
	// Currency string from the shared formatter — two decimals, the currency's
	// own symbol (SC / GC in social play, never $). Isolated in Arabic so the
	// symbol and figures keep their order inside the right-to-left sentence.
	const money = numberToCurrencyString(stateBet.betAmount * cost);
	const amount = lang === 'ar' ? `\u2066${money}\u2069` : money;
	if (stateUrlDerived.social()) {
		return `Total amount: ${money}. Enter the ${buy.title} directly for ${cost}× your amount, at an RTP of ${vars.rtp}. ${summary} Landing ${vars.cells} or more Tower (Scatter) cells in normal play opens the same feature. Maximum win: ${vars.max}× your amount.`;
	}
	const gap = lang === 'ja' || lang === 'zh' ? '' : ' ';
	return `${gameText('buyTotal', { amount })}${gap}${gameText('buyDialog', { ...vars, summary })}`;
};

const buildBuy = (buy: FeatureBuy): BetModeData => {
	const mode = config.betModes[buy.key];
	const cost = mode.cost;
	return {
		mode: buy.mode,
		costMultiplier: cost,
		type: 'buy',
		parent: '',
		children: '',
		maxWin: mode.max_win,
		assets: { ...emptyAssets },
		text: {
			title: buy.title,
			get dialog() {
				return buyDialog(buy, cost, mode.rtp);
			},
			// only the shared BonusCards reads this; this game's own ModalBuyBonus does not
			get description() {
				return pick(`${cost}× BET — ${buy.title}`, `${cost}× AMOUNT — ${buy.title}`);
			},
			get button() {
				return stateUrlDerived.social() ? `PLAY ${cost}×` : gameText('buyButton', { cost });
			},
			get tickerIdle() {
				return idleTicker();
			},
			tickerSpin: `${buy.title} ACTIVATED`,
			bannerText: '',
		},
	};
};

export const WILD_ALCHEMY_BET_MODE_META: Record<string, BetModeData> = {
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
	...Object.fromEntries(FEATURE_BUYS.map((buy) => [buy.mode, buildBuy(buy)])),
};
/** kept for callers that still import the old name */
export const HARD_TIME_BET_MODE_META = WILD_ALCHEMY_BET_MODE_META;
