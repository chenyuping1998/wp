/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * The math build writes library/configs/config_fe_SoulSeal.json; this copies it
 * across verbatim so the two can never drift by hand-editing. Re-run after every
 * math change:
 *
 *   node design/sync_math_config.mjs
 *
 * Written as compact JSON rather than pretty-printed: the padding reels alone are
 * 5 x 80 symbols, and one object per line would make the file thousands of lines
 * for no benefit - nothing reads this by eye.
 *
 * The board is 5x3 in every mode, so numRows needs no special handling - what
 * the maths emits is what the client draws.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

const MATH_CONFIG = path.resolve(
	appRoot,
	'../../../math-sdk/games/SoulSeal/library/configs/config_fe_SoulSeal.json',
);
// The carrier ladders, which the SDK's frontend config does NOT carry: to the
// SDK a multiplier symbol simply has no pay table, and it writes M out as
// `{paytable: null}`. For this game that is the most important number on the
// board, so the pay-table panel needs the range. Written by the companion script
// games/SoulSeal/dump_carrier_values.py - see its docstring.
const CARRIER_VALUES = path.resolve(
	appRoot,
	'../../../math-sdk/games/SoulSeal/library/configs/carrier_values.json',
);
const OUT = path.join(appRoot, 'src/game/config.ts');

const EXPECTED_REELS = 5;
const EXPECTED_BASE_ROWS = 3;
// Four icons, five royals, the carrier, scatter, and the wild - which is also
// the collector, so there is no separate symbol for it.
const EXPECTED_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'M', 'S', 'W'];

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error('Run the math pipeline first (games/SoulSeal/run.py).');
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));

// Sanity checks. These are the shape assumptions the game code makes, and a math
// change that breaks one of them would otherwise surface as a blank board.
const problems = [];
if (raw.gameID !== 'SoulSeal') problems.push(`gameID is "${raw.gameID}", expected "SoulSeal"`);
if (raw.numReels !== EXPECTED_REELS) {
	problems.push(`numReels is ${raw.numReels}, expected ${EXPECTED_REELS}`);
}
if (!Array.isArray(raw.numRows) || raw.numRows.some((n) => n !== EXPECTED_BASE_ROWS)) {
	problems.push(
		`numRows is ${JSON.stringify(raw.numRows)}, expected ${EXPECTED_REELS}x${EXPECTED_BASE_ROWS}`,
	);
}
for (const gameType of ['basegame', 'freegame']) {
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
const extra = Object.keys(symbols).filter((name) => !EXPECTED_SYMBOLS.includes(name));
if (missing.length) problems.push(`symbols missing from math config: ${missing.join(', ')}`);
if (extra.length) problems.push(`symbols the client has no art for: ${extra.join(', ')}`);

if (problems.length) {
	console.error('Math config failed validation:');
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}

// One payline table and one paytable, both straight from the maths.
//
// The scaffold carried a second set of each, dumped by a companion script,
// because its feature grew the board to five rows (40 lines) and could evaluate
// as ways. Soul Seal's board never changes shape and it is lines-only in every
// mode, so there is nothing to reconcile and no sidecar to keep in step.
// The ladder is merged in rather than left for the panel to hard-code. Missing
// is a warning and not a failure: it only costs the pay table one sentence, and
// blocking a config sync on a sidecar would make the maths harder to iterate on
// than it needs to be.
let carrierValues = null;
if (fs.existsSync(CARRIER_VALUES)) {
	carrierValues = JSON.parse(fs.readFileSync(CARRIER_VALUES, 'utf8'));
} else {
	console.warn(`  ! no carrier_values.json — run games/SoulSeal/dump_carrier_values.py`);
}

const config = {
	...raw,
	symbols,
	...(carrierValues ? { carrierValues } : {}),
};

const header = `// GENERATED FILE - do not edit by hand.
// Source: math-sdk/games/SoulSeal/library/configs/config_fe_SoulSeal.json
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
console.log(`  base board ${config.numReels} x ${config.numRows[0]}`);
console.log(`  symbols: ${Object.keys(symbols).sort().join(', ')}`);
console.log(`  bet modes: ${Object.keys(config.betModes).join(', ')}`);
console.log(`  paylines: ${Object.keys(config.paylines).length}`);
console.log(`  rtp ${config.rtp}  max win ${config.betModes.base.max_win}x`);
if (carrierValues) {
	for (const [gametype, ladder] of Object.entries(carrierValues)) {
		const values = Object.keys(ladder).map(Number);
		console.log(
			`  carrier values (${gametype}): ${values.length}, ` +
				`${Math.min(...values)}x to ${Math.max(...values)}x`,
		);
	}
}
