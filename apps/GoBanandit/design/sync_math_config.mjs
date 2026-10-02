/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * The math build writes library/configs/config_fe_GoBanandit.json; this
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
 *                    cost/rtp/max_win per mode and nothing about the feature.
 *   buy_start_meter  how many Bandits each tier opens with on the meter — the
 *                    visible difference between the two cards.
 *   meter_thresholds / meter_spins_added / collect_mults
 *                    the Bandit ladder the free-spin meter draws and the rules
 *                    page prints.
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
const MATH_DIR = path.resolve(appRoot, '../../../math-sdk/games/GoBanandit');
const MATH_CONFIG = path.join(MATH_DIR, 'library/configs/config_fe_GoBanandit.json');
const OUT = path.join(appRoot, 'src/game/config.ts');

const EXPECTED_REELS = 5;
const EXPECTED_ROWS = 4;
// P is the Banana Sack (carries a prize, in bet multiples); W is the Bandit.
// A symbol the maths emits that the client cannot draw is a blank cell in play.
const EXPECTED_SYMBOLS = [
	'H1', 'H2', 'H3', 'H4',
	'L1', 'L2', 'L3', 'L4', 'L5',
	'W', 'S', 'P',
];
const EXPECTED_MODES = ['base', 'bonus', 'superbonus'];

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error('Run the math pipeline first (games/GoBanandit/run.py).');
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));
const problems = [];

if (raw.gameID !== 'GoBanandit') {
	problems.push(`gameID is "${raw.gameID}", expected "GoBanandit"`);
}
if (raw.numReels !== EXPECTED_REELS) {
	problems.push(`numReels is ${raw.numReels}, expected ${EXPECTED_REELS}`);
}
if (!Array.isArray(raw.numRows) || raw.numRows.some((n) => n !== EXPECTED_ROWS)) {
	problems.push(
		`numRows is ${JSON.stringify(raw.numRows)}, expected ${EXPECTED_REELS} x ${EXPECTED_ROWS}`,
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
const buyStartMeter = readDict('buy_start_meter');
for (const mode of Object.keys(buySpins)) {
	if (!raw.betModes[mode]) continue;
	raw.betModes[mode].spins = buySpins[mode];
	raw.betModes[mode].start_meter = buyStartMeter[mode] ?? 0;
}

const readList = (name) => {
	const m = mathSource.match(new RegExp(`self\\.${name}\\s*=\\s*\\[([^\\]]*)\\]`));
	if (!m) {
		console.error(`could not read ${name} from game_config.py`);
		process.exit(1);
	}
	return m[1].split(',').map((v) => Number(v.trim())).filter((v) => !Number.isNaN(v));
};
const readNumber = (name) => {
	const m = mathSource.match(new RegExp(`self\\.${name}\\s*=\\s*(\\d+)`));
	if (!m) {
		console.error(`could not read ${name} from game_config.py`);
		process.exit(1);
	}
	return Number(m[1]);
};
// The Bandit ladder: meter thresholds, spins each rung adds, and the collect
// multiplier at each level (index 0 = before the first rung).
const banditMeter = {
	thresholds: readList('meter_thresholds'),
	spinsAdded: readNumber('meter_spins_added'),
	mults: readList('collect_mults'),
};

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

const config = { ...raw, symbols, scatterSpins, banditMeter };

const header = `// GENERATED FILE - do not edit by hand.
// Source: math-sdk/games/GoBanandit/library/configs/config_fe_GoBanandit.json
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
console.log(`  board ${config.numRows[0]} x ${config.numReels}  (${config.numRows.reduce((a, b) => a * b, 1).toLocaleString()} ways)`);
console.log(`  symbols: ${Object.keys(symbols).sort().join(', ')}`);
console.log(`  scatters -> spins: ${JSON.stringify(scatterSpins)}`);
console.log(`  bandit meter: ${JSON.stringify(banditMeter)}`);
for (const [mode, info] of Object.entries(config.betModes)) {
	const extra = info.spins ? `, ${info.spins} spins, meter starts at ${info.start_meter}` : '';
	console.log(`  ${mode}: ${info.cost}x cost, max win ${info.max_win}x${extra}`);
}
console.log(`  rtp ${config.rtp}`);
