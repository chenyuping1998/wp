import config from './config';

// Dragon pearl values for the player-facing texts (rules, pay table, buy menu,
// feature cards), read from the maths export (math-sdk dragon_tide PEARL_VALUES
// via design/sync_math_config.mjs) — never typed in. Any number of pearls can sit
// on a board; their values add up.
const values = config.pearls.values as number[];
const superValues = values.filter((v) => v >= 10); // Super Free Spins draw 10×–1000× only (super_pearls)
export const pearlRules = {
	values,
	superValues,
	min: Math.min(...values),
	max: Math.max(...values),
	superMin: Math.min(...superValues),
};
