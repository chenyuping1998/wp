/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * The math build writes library/configs/config_fe_EmberForge.json; this copies it
 * across verbatim so the two can never drift by hand-editing. Re-run after every
 * math change:
 *
 *   node design/sync_math_config.mjs
 *
 * Written as compact JSON rather than pretty-printed: the padding reels alone are
 * 7 x ~251 symbols, and one object per line would make the file ~18k lines for no
 * benefit — nothing reads this by eye.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

const MATH_CONFIG = path.resolve(
	appRoot,
	'../../../math-sdk/games/EmberForge/library/configs/config_fe_EmberForge.json',
);
const OUT = path.join(appRoot, 'src/game/config.ts');

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error('Run the math pipeline first (games/EmberForge/run.py).');
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));

// Sanity checks. These are the shape assumptions the game code makes, and a math
// change that breaks one of them would otherwise surface as a blank board.
const problems = [];
if (raw.gameID !== 'EmberForge') problems.push(`gameID is "${raw.gameID}", expected "EmberForge"`);
if (raw.numReels !== 7) problems.push(`numReels is ${raw.numReels}, expected 7`);
if (!Array.isArray(raw.numRows) || raw.numRows.some((n) => n !== 7)) {
	problems.push(`numRows is ${JSON.stringify(raw.numRows)}, expected seven 7s`);
}
for (const gameType of ['basegame', 'freegame']) {
	const strips = raw.paddingReels?.[gameType];
	if (!Array.isArray(strips) || strips.length !== raw.numReels) {
		problems.push(`paddingReels.${gameType} missing or wrong reel count`);
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
// Source: math-sdk/games/EmberForge/library/configs/config_fe_EmberForge.json
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
console.log(`  reels ${config.numReels} x ${config.numRows[0]}`);
console.log(`  symbols: ${Object.keys(symbols).sort().join(', ')}`);
console.log(`  bet modes: ${Object.keys(config.betModes).join(', ')}`);
console.log(`  rtp ${config.rtp}  max win ${config.betModes.base.max_win}x`);
