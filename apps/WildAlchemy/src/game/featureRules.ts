import config from './config';

/**
 * The free-game numbers the player is told about, in one place.
 *
 * The frontend config (config.ts) is generated from the maths and carries the
 * grid, lines, pays, costs and max win, but not the feature's own rules. Those
 * live in math-sdk/games/wild_alchemy/game_config.py (SPEC §1): 5 visible
 * Scatter cells open 6 free spins; every converted WILD cell is a point; every
 * 12 points step the multiplier up the ladder and add 3 spins; SUPER FREE GAME
 * opens one step up (×2, 9 spins). Copy that quotes these numbers reads them
 * from here, so a maths change is one edit, not a hunt through strings.
 */
export const FEATURE_RULES = {
	/** visible Scatter (Tower) cells that open the free game */
	triggerCells: 5,
	freeSpins: 6,
	pointsPerStep: 12,
	spinsPerStep: 3,
	/** the multiplier ladder, from the starting ×1 */
	ladder: [1, 2, 3, 5, 8, 12],
	superStartMult: 2,
	superSpins: 9,
} as const;

/** largest merged block edge: the grid's own height */
export const MAX_BLOCK = config.numRows?.[0] ?? config.numReels;

/** The locale's grouping (20.000 in de), Latin digits. Pure Intl — no Lingui. */
export const formatNumberIn = (lang: string, value: number) =>
	new Intl.NumberFormat(`${lang === 'en' ? 'en-US' : lang}-u-nu-latn`).format(value);

/**
 * Placeholder values for the translated copy in game/i18nText.ts (buy menu,
 * buy confirm, loading tips). Every figure comes from config or FEATURE_RULES.
 * In Arabic the ×-ladder is wrapped in a left-to-right isolate (U+2066…U+2069)
 * so "×2, ×3, ×5" keeps its reading order inside the right-to-left sentence
 * (verified in the buy confirm dialog, 2026-11-11).
 */
export const featureTextVars = (lang: string) => {
	const ltr = (text: string) => (lang === 'ar' ? `\u2066${text}\u2069` : text);
	// Arabic keeps the Latin comma: the Arabic comma is a right-to-left letter
	// class and would re-order the figures inside the left-to-right isolate.
	const sep = lang === 'zh' || lang === 'ja' ? '、' : ', ';
	const rows = config.numRows?.[0] ?? config.numReels;
	return {
		grid: `${config.numReels}×${rows}`,
		lines: Object.keys(config.paylines).length,
		max: formatNumberIn(lang, config.betModes.base.max_win),
		cells: FEATURE_RULES.triggerCells,
		fs: FEATURE_RULES.freeSpins,
		pts: FEATURE_RULES.pointsPerStep,
		plus: FEATURE_RULES.spinsPerStep,
		m0: FEATURE_RULES.ladder[0],
		sm: FEATURE_RULES.superStartMult,
		ss: FEATURE_RULES.superSpins,
		/** the steps above the starting ×1, as a list: ×2, ×3, ×5, ×8, ×12 */
		ladderSteps: ltr(FEATURE_RULES.ladder.slice(1).map((m) => `×${m}`).join(sep)),
		/** the whole climb, as a sequence: ×1 → ×2 → … → ×12 */
		ladderClimb: ltr(FEATURE_RULES.ladder.map((m) => `×${m}`).join(' → ')),
	};
};
