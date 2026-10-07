/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * The math build writes library/configs/config_fe_GoBananaut.json; this
 * copies it across so the two can never drift by hand-editing. Re-run after
 * every math change:
 *
 *   node design/sync_math_config.mjs
 *
 * Written as compact JSON rather than pretty-printed: the padding reels alone
 * are 5 x 320 symbols, and one object per line would make the file thousands of
 * lines for no benefit — nothing reads this by eye.
 *
 * Two things the math config does NOT carry, which the client needs and which
 * are therefore lifted out of game_config.py by hand below:
 *
 *   buy_spins        how many free spins each bought tier plays. The SDK exports
 *                    cost/rtp/max_win per mode and nothing about the feature, and
 *                    the tiers' whole proposition is that they run longer.
 *   buy_start_steps  how far up the growth ladder each tier opens — the visible
 *                    difference between the three cards.
 *   growth geometry  base/max rows, the ladder's length, and the multiplier a
 *                    stretched reel carries. numRows in the math config is a
 *                    STATIC [4,4,4,4,4] written once at the end of the run, so
 *                    everything about the board's real height has to come from
 *                    here and from the growReels book event.
 *
 * Reading them from the Python rather than restating them here is the point: the
 * rules page and the buy cards print these numbers, and a copy that drifts from
 * the maths is exactly the kind of thing certification sends back.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const MATH_DIR = path.resolve(appRoot, '../../../math-sdk/games/GoBananaut');
const MATH_CONFIG = path.join(MATH_DIR, 'library/configs/config_fe_GoBananaut.json');
const OUT = path.join(appRoot, 'src/game/config.ts');

const EXPECTED_REELS = 5;
const EXPECTED_ROWS = 4;
// X and P belong to hold and spin (blank and coin); M is the machete. All three
// are registered in the maths and all three need art, so they are listed here —
// a symbol the maths emits that the client cannot draw is a blank cell in play.
// Symbols the client has art for. The grow-marked names (H1G..L5G) are NOT
// listed and are not supposed to be: a marked cell is drawn as its ORDINARY
// symbol with a marker laid over it, so "H2G" needs H2's art and nothing else.
// GROW_SUFFIX below is what tells the check that.
const BASE_SYMBOLS = [
	'H1', 'H2', 'H3', 'H4',
	'L1', 'L2', 'L3', 'L4', 'L5',
	'W', 'S', 'P', 'X',
];
const GROW_SUFFIX = 'G';
// A marked name is legal exactly when the symbol underneath it is.
const unmark = (name) =>
	name.endsWith(GROW_SUFFIX) && BASE_SYMBOLS.includes(name.slice(0, -GROW_SUFFIX.length))
		? name.slice(0, -GROW_SUFFIX.length)
		: name;
const EXPECTED_SYMBOLS = BASE_SYMBOLS;
const EXPECTED_MODES = ['base', 'holdandspin', 'bonus100', 'bonus200', 'bonus300'];

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error('Run the math pipeline first (games/GoBananaut/run.py).');
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));
const problems = [];

if (raw.gameID !== 'GoBananaut') {
	problems.push(`gameID is "${raw.gameID}", expected "GoBananaut"`);
}
if (raw.numReels !== EXPECTED_REELS) {
	problems.push(`numReels is ${raw.numReels}, expected ${EXPECTED_REELS}`);
}
if (!Array.isArray(raw.numRows) || raw.numRows.some((n) => n !== EXPECTED_ROWS)) {
	problems.push(
		`numRows is ${JSON.stringify(raw.numRows)}, expected ${EXPECTED_REELS} x ${EXPECTED_ROWS}`,
	);
}
for (const gameType of ['basegame', 'freegame', 'holdandspin']) {
	const strips = raw.paddingReels?.[gameType];
	if (!Array.isArray(strips) || strips.length !== raw.numReels) {
		problems.push(`paddingReels.${gameType} missing or wrong reel count`);
	}
}

// The math writes symbols as a list of single-key objects in arbitrary order.
// Flatten to a map so the paytable modal can look a symbol up directly.
const symbols = {};
for (const entry of raw.symbols) {
	for (const [name, info] of Object.entries(entry)) symbols[name] = info;
}
const missing = EXPECTED_SYMBOLS.filter((name) => !(name in symbols));
const extra = Object.keys(symbols).filter((name) => !EXPECTED_SYMBOLS.includes(unmark(name)));
if (missing.length) problems.push(`symbols missing from math config: ${missing.join(', ')}`);
if (extra.length) problems.push(`symbols the client has no art for: ${extra.join(', ')}`);

const modesMissing = EXPECTED_MODES.filter((m) => !(m in (raw.betModes ?? {})));
const modesExtra = Object.keys(raw.betModes ?? {}).filter((m) => !EXPECTED_MODES.includes(m));
if (modesMissing.length) problems.push(`bet modes missing: ${modesMissing.join(', ')}`);
if (modesExtra.length) problems.push(`bet modes with no client meta: ${modesExtra.join(', ')}`);

// Every payout the RGS accepts is a whole number of 0.10x units, and a ways win
// is paytable x ways with ways an integer — so an off-grid paytable entry makes
// the majority of books fail verification. Checked here as well as in the maths
// because this is the file the client actually prints from.
for (const [name, info] of Object.entries(symbols)) {
	for (const entry of info.paytable ?? []) {
		for (const [kind, value] of Object.entries(entry)) {
			if (kind === '99') continue; // registration-only rows
			if (Math.abs(Math.round(value * 10) - value * 10) > 1e-9) {
				problems.push(`${name} ${kind}-of-a-kind pays ${value}, not a multiple of 0.10`);
			}
		}
	}
}

if (problems.length) {
	console.error('Math config failed validation:');
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}

// --- figures that only exist in game_config.py ---------------------------
const mathSource = fs.readFileSync(path.join(MATH_DIR, 'game_config.py'), 'utf8');

const readDict = (name) => {
	const block = mathSource.match(new RegExp(`self\\.${name}\\s*=\\s*\\{([^}]*)\\}`));
	if (!block) {
		console.error(`could not read ${name} from game_config.py`);
		process.exit(1);
	}
	const out = {};
	for (const [, key, value] of block[1].matchAll(/"(\w+)"\s*:\s*(\d+)/g)) {
		out[key] = Number(value);
	}
	return out;
};

const buySpins = readDict('buy_spins');
const buyStartSteps = readDict('buy_start_steps');
for (const mode of Object.keys(buySpins)) {
	if (!raw.betModes[mode]) continue;
	raw.betModes[mode].spins = buySpins[mode];
	raw.betModes[mode].start_steps = buyStartSteps[mode] ?? 0;
}

// Growth geometry, lifted from the Python for the same reason the spin counts
// are: the rules page and the buy cards print these, and a hardcoded copy on the
// client is a second source of truth for numbers that live in the maths.
const readInt = (name) => {
	// Built from a plain string, not a template literal: a template literal eats
	// the backslashes before RegExp ever sees them, so `\d` arrives as a literal
	// "d" and the pattern silently matches nothing.
	const m = mathSource.match(new RegExp('self\\.' + name + '\\s*=\\s*(\\d+)'));
	if (!m) {
		console.error(`could not read ${name} from game_config.py`);
		process.exit(1);
	}
	return Number(m[1]);
};

const growth = {
	// base_num_rows is written as [4] * self.num_reels, so the row count is the
	// literal inside the brackets.
	baseRows: (() => {
		const m = mathSource.match(/self\.base_num_rows\s*=\s*\[(\d+)\]\s*\*/);
		if (!m) {
			console.error('could not read base_num_rows from game_config.py');
			process.exit(1);
		}
		return Number(m[1]);
	})(),
	maxRows: readInt('max_num_rows'),
	maxMarkersPerReel: readInt('max_markers_per_reel'),
	reelMultiplier: readInt('growth_reel_multiplier'),
};
// growth_max_steps is an expression in the Python (reels x rows gained), so it is
// recomputed here rather than parsed — a regex over an expression would be a
// second implementation of the same arithmetic.
growth.maxSteps = raw.numReels * (growth.maxRows - growth.baseRows);

// The scatter-count to spin-count map, for the base game's own trigger.
const triggerBlock = mathSource.match(
	/self\.freespin_triggers\s*=\s*\{\s*self\.basegame_type:\s*\{([^}]*)\}/,
);
if (!triggerBlock) {
	console.error('could not read freespin_triggers from game_config.py');
	process.exit(1);
}
const scatterSpins = {};
for (const [, k, v] of triggerBlock[1].matchAll(/(\d+)\s*:\s*(\d+)/g)) {
	scatterSpins[Number(k)] = Number(v);
}

const config = { ...raw, symbols, scatterSpins, growth };

const header = `// GENERATED FILE - do not edit by hand.
// Source: math-sdk/games/GoBananaut/library/configs/config_fe_GoBananaut.json
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
console.log(
	`  baseline board ${config.numRows[0]} x ${config.numReels}` +
		`  (${config.numRows.reduce((a, b) => a * b, 1).toLocaleString()} ways,` +
		` ${Math.pow(growth.maxRows, config.numReels).toLocaleString()} when full)`,
);
console.log(`  symbols: ${Object.keys(symbols).sort().join(', ')}`);
console.log(`  scatters -> spins: ${JSON.stringify(scatterSpins)}`);
console.log(
	`  growth: ${growth.baseRows} -> ${growth.maxRows} rows, ${growth.maxSteps} steps,` +
		` max ${growth.maxMarkersPerReel} markers/reel, stretched reel x${growth.reelMultiplier}`,
);
for (const [mode, info] of Object.entries(config.betModes)) {
	const extra = info.spins ? `, ${info.spins} spins, opens on step ${info.start_steps}` : '';
	console.log(`  ${mode}: ${info.cost}x cost, max win ${info.max_win}x${extra}`);
}
console.log(`  rtp ${config.rtp}`);
