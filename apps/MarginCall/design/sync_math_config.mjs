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

// Typical free-spin count per buy mode, derived from the maths.
//
// This does not ride along in config_fe_*.json - the SDK exports cost/rtp/max_win
// per mode and nothing about how the feature is triggered. It matters to the copy
// because BLACK SWAN's whole proposition is that it opens on a longer feature,
// and that is a maths figure I retune: game_config.py's per-mode
// scatter_triggers, mapped through freespin_triggers.
//
// "Typical" needs a rule, because every mode can technically trigger any count.
// A scatter count is counted as typical if it carries at least a fifth of the
// mode's trigger weight - so the 180x bonus reads as 8 (its 3-scatter weight is
// 80% of the table) and BLACK SWAN reads as 10-12, which is what each actually
// plays like rather than what each can theoretically do.
const TYPICAL_SHARE = 0.2;
const mathSource = fs.readFileSync(
	path.resolve(appRoot, '../../../math-sdk/games/MarginCall/game_config.py'),
	'utf8',
);

const parseIntMap = (text) => {
	const map = {};
	for (const [, k, v] of text.matchAll(/(\d+)\s*:\s*(\d+)/g)) map[Number(k)] = Number(v);
	return map;
};

const triggerBlock = mathSource.match(
	/self\.freespin_triggers\s*=\s*\{\s*self\.basegame_type:\s*\{([^}]*)\}/,
);
if (!triggerBlock) {
	console.error('could not read freespin_triggers from game_config.py');
	process.exit(1);
}
const scattersToSpins = parseIntMap(triggerBlock[1]);

// One scatter_triggers per Distribution, in source order. Only the non-forced
// (i.e. not "wincap") distribution of each buy mode describes normal play, and
// that is the LAST scatter_triggers inside each BetMode block.
for (const modeName of Object.keys(raw.betModes)) {
	const modeStart = mathSource.indexOf(`name="${modeName}"`);
	if (modeStart < 0) continue;
	const nextMode = mathSource.indexOf('            BetMode(', modeStart);
	const block = mathSource.slice(modeStart, nextMode < 0 ? undefined : nextMode);
	const triggers = [...block.matchAll(/"scatter_triggers":\s*\{([^}]*)\}/g)];
	if (!triggers.length) continue;
	const weights = parseIntMap(triggers[triggers.length - 1][1]);
	const total = Object.values(weights).reduce((a, b) => a + b, 0);
	const spins = Object.entries(weights)
		.filter(([, w]) => w / total >= TYPICAL_SHARE)
		.map(([scatters]) => scattersToSpins[Number(scatters)])
		.filter((n) => n !== undefined)
		.sort((a, b) => a - b);
	if (spins.length) {
		raw.betModes[modeName].typical_spins = [spins[0], spins[spins.length - 1]];
	}
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
for (const [mode, info] of Object.entries(config.betModes)) {
	if (info.typical_spins) {
		const [lo, hi] = info.typical_spins;
		console.log(`  ${mode}: typically ${lo === hi ? lo : `${lo}-${hi}`} free spins`);
	}
}
console.log(`  rtp ${config.rtp}  max win ${config.betModes.base.max_win}x`);
