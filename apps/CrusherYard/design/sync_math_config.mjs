/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * The math build writes library/configs/config_fe_CrusherYard.json; this copies it
 * across verbatim so the two can never drift by hand-editing. Re-run after every
 * math change:
 *
 *   node design/sync_math_config.mjs
 *
 * Written as compact JSON rather than pretty-printed: the padding reels alone are
 * 6 x ~251 symbols, and one object per line would make the file ~15k lines for no
 * benefit — nothing reads this by eye.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

const MATH_CONFIG = path.resolve(
	appRoot,
	'../../../math-sdk/games/CrusherYard/library/configs/config_fe_CrusherYard.json',
);
const OUT = path.join(appRoot, 'src/game/config.ts');

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error('Run the math pipeline first (games/CrusherYard/run.py).');
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));

// Sanity checks. These are the shape assumptions the game code makes, and a math
// change that breaks one of them would otherwise surface as a blank board.
const problems = [];
if (raw.gameID !== 'CrusherYard') problems.push(`gameID is "${raw.gameID}", expected "CrusherYard"`);
if (raw.numReels !== 6) problems.push(`numReels is ${raw.numReels}, expected 6`);
if (!Array.isArray(raw.numRows) || raw.numRows.some((n) => n !== 5)) {
	problems.push(`numRows is ${JSON.stringify(raw.numRows)}, expected six 5s`);
}
for (const gameType of ['basegame', 'freegame']) {
	const strips = raw.paddingReels?.[gameType];
	if (!Array.isArray(strips) || strips.length !== raw.numReels) {
		problems.push(`paddingReels.${gameType} missing or wrong reel count`);
	}
}

// The symbol set is load-bearing in a way the board dimensions are not:
// SYMBOL_INFO_MAP and assets.ts are keyed by these names, and a symbol the math
// emits with no entry there renders as nothing at all — a hole in the board that
// still pays. Checked here rather than trusted, because it has already changed
// once (W dropped, M added) and would change again if the maths gained a feature
// symbol.
//
// W is asserted ABSENT on purpose. game_config.py still declares
// special_symbols["wild"] = ["W"] because Scatter.get_scatterpay_wins indexes
// that key unconditionally, but no strip carries one — see the readme. If a W
// ever appears here it means someone put wilds on the reels, and every payout in
// the game changed with it.
const EXPECTED_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'S', 'M'];
const actualSymbols = raw.symbols.flatMap((entry) => Object.keys(entry));
for (const name of EXPECTED_SYMBOLS) {
	if (!actualSymbols.includes(name)) problems.push(`symbol ${name} missing from math config`);
}
for (const name of actualSymbols) {
	if (!EXPECTED_SYMBOLS.includes(name)) {
		problems.push(`unexpected symbol ${name} — needs art, SYMBOL_INFO_MAP and paytable entries`);
	}
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

const config = { ...raw, symbols };

const header = `// GENERATED FILE - do not edit by hand.
// Source: math-sdk/games/CrusherYard/library/configs/config_fe_CrusherYard.json
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
console.log(`  reels ${config.numReels} x ${config.numRows[0]}`);
console.log(`  symbols: ${Object.keys(symbols).sort().join(', ')}`);
console.log(`  bet modes: ${Object.keys(config.betModes).join(', ')}`);
console.log(`  rtp ${config.rtp}  max win ${config.betModes.base.max_win}x`);
