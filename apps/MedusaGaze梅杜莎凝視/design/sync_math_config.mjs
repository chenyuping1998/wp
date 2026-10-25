/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * The math build writes library/configs/config_fe_MedusaGaze.json; this copies it
 * across verbatim so the two can never drift by hand-editing, and merges in the
 * rules the SDK file does not carry (Medusa's multiplier values, the Aegis pays,
 * free-spin counts) from the maths' own export_fe_extras.py. Re-run after every
 * math change:
 *
 *   node design/sync_math_config.mjs
 *
 * Written as compact JSON: the padding reels alone are 6 x 400 symbols, and
 * nothing reads this file by eye.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { mathGameDir } from '../../../tools/math_game_dir.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

const GAME_ID = 'MedusaGaze';
const MATH_DIR = mathGameDir(GAME_ID);
const MATH_CONFIG = path.join(MATH_DIR, 'library', 'configs', `config_fe_${GAME_ID}.json`);
const PYTHON = path.resolve(appRoot, '../../../math-sdk/env/Scripts/python.exe');
const OUT = path.join(appRoot, 'src/game/config.ts');

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error(`Run the math pipeline first (${path.basename(MATH_DIR)}/run.py).`);
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));
const extras = JSON.parse(
	execFileSync(PYTHON, ['export_fe_extras.py'], { cwd: MATH_DIR, encoding: 'utf8' }),
);

// Sanity checks. These are the shape assumptions the game code makes, and a math
// change that breaks one would otherwise surface as a blank board.
const problems = [];
if (raw.gameID !== GAME_ID) problems.push(`gameID is "${raw.gameID}", expected "${GAME_ID}"`);
if (raw.numReels !== 6) problems.push(`numReels is ${raw.numReels}, expected 6`);
if (!Array.isArray(raw.numRows) || raw.numRows.some((n) => n !== 6)) {
	problems.push(`numRows is ${JSON.stringify(raw.numRows)}, expected six 6s`);
}
for (const gameType of ['basegame', 'freegame']) {
	const strips = raw.paddingReels?.[gameType];
	if (!Array.isArray(strips) || strips.length !== raw.numReels) {
		problems.push(`paddingReels.${gameType} missing or wrong reel count`);
	}
}

// SYMBOL_INFO_MAP and assets.ts are keyed by these names, and a symbol the math
// emits with no entry there renders as nothing at all — a hole in the board that
// still pays. W is asserted ABSENT: in a pay-anywhere game a wild joins every
// symbol's count at once, and if one ever appears every payout changed with it.
const EXPECTED_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S'];
const actualSymbols = raw.symbols.flatMap((entry) => Object.keys(entry));
for (const name of EXPECTED_SYMBOLS) {
	if (!actualSymbols.includes(name)) problems.push(`symbol ${name} missing from math config`);
}
for (const name of actualSymbols) {
	if (!EXPECTED_SYMBOLS.includes(name)) {
		problems.push(`unexpected symbol ${name} — needs art, SYMBOL_INFO_MAP and paytable entries`);
	}
}
if (!extras.medusa?.baseValues?.length || !extras.medusa?.freeValues?.length) {
	problems.push('export_fe_extras.py returned no Medusa multiplier values');
}
if (problems.length) {
	console.error('Math config failed validation:');
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}

// The math writes symbols as a list of single-key objects in arbitrary order.
// Flatten to a map so the paytable modal can look a symbol up directly.
const symbols = {};
for (const entry of raw.symbols) {
	for (const [name, info] of Object.entries(entry)) symbols[name] = info;
}

const config = { ...raw, symbols, ...extras };

const header = `// GENERATED FILE - do not edit by hand.
// Source: math-sdk/games/${path.basename(MATH_DIR)}/library/configs/config_fe_${GAME_ID}.json
//       + export_fe_extras.py (Medusa values, Aegis pays, free-spin counts)
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
console.log(`  reels ${config.numReels} x ${config.numRows[0]}`);
console.log(`  symbols: ${Object.keys(symbols).sort().join(', ')}`);
console.log(`  bet modes: ${Object.keys(config.betModes).join(', ')}`);
console.log(`  rtp ${config.rtp}  max win ${config.betModes.base.max_win}x`);
console.log(`  medusa base ${config.medusa.baseValues.join('/')}  free ${config.medusa.freeValues.join('/')}`);
