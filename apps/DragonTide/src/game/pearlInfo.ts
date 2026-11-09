import config from './config';

// TEMPORARY bridge for the Hypno-era rule texts (rules / paytable / buy modal) until the
// Dragon Tide text pass rewrites them: pearl values from the math, unlimited per board.
// TODO(dragon-tide text pass): delete once no component reads it.
const values = config.pearls.values as number[];
export const pearlInfo = {
	baseValues: values,
	freeValues: values,
	superValues: values.filter((v) => v >= 10),
	baseMaxThrows: 30,
	freeMaxThrows: 30,
	deadMaxThrows: 30,
};
