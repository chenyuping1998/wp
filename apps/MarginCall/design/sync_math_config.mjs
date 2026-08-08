/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * The math build writes library/configs/config_fe_MarginCall.json; this copies it
 * across verbatim so the two can never drift by hand-editing. Re-run after every
 * math change:
 *
 *   node design/sync_math_config.mjs
 *
 * Written as compact JSON rather than pretty-printed: the padding reels alone are
 * 5 x 80 symbols, and one object per line would make the file thousands of lines
 * for no benefit - nothing reads this by eye.
 *
 * Note on numRows: the math emits the *basegame* board only, because the feature
 * game grows the board at runtime and make_fe_config has no slot for a second
 * size. The client learns the feature height from the `boardExpand` event, and
 * constants.ts holds only MAX_ROWS for layout sizing. That is checked below so a
 * math change to either number cannot pass silently.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

const MATH_CONFIG = path.resolve(
	appRoot,
	'../../../math-sdk/games/MarginCall/library/configs/config_fe_MarginCall.json',
);
const OUT = path.join(appRoot, 'src/game/config.ts');

const EXPECTED_REELS = 5;
const EXPECTED_BASE_ROWS = 3;
const EXPECTED_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S', 'W'];

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error('Run the math pipeline first (games/MarginCall/run.py).');
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));

// Sanity checks. These are the shape assumptions the game code makes, and a math
// change that breaks one of them would otherwise surface as a blank board.
const problems = [];
if (raw.gameID !== 'MarginCall') problems.push(`gameID is "${raw.gameID}", expected "MarginCall"`);
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

const config = { ...raw, symbols };

const header = `// GENERATED FILE - do not edit by hand.
// Source: math-sdk/games/MarginCall/library/configs/config_fe_MarginCall.json
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
console.log(`  base board ${config.numReels} x ${config.numRows[0]}`);
console.log(`  symbols: ${Object.keys(symbols).sort().join(', ')}`);
console.log(`  bet modes: ${Object.keys(config.betModes).join(', ')}`);
console.log(`  rtp ${config.rtp}  max win ${config.betModes.base.max_win}x`);
