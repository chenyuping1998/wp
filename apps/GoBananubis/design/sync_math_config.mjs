/**
 * Regenerate src/game/config.ts from the math SDK's generated frontend config.
 *
 * WHY THIS EXISTS
 *
 * It did not, and that was the hazard. This app inherited a config.ts that was
 * maintained BY HAND — the header did not even say it was generated — while the
 * maths wrote its own copy into library/configs and nothing reconciled the two.
 * They had already drifted: the maths declared the 50x hold-and-spin as a
 * feature and the hand-edited client declared it a buy, and that disagreement
 * shipped in gen-1 and survived two forks. Adding the sealed tablet made the
 * problem unignorable, because M is a symbol the client's SymbolName type is
 * derived from — a symbol the maths emits and the client's config has never
 * heard of is not a wrong label, it is a crash.
 *
 * Re-run after every math change:
 *
 *   node design/sync_math_config.mjs
 *
 * Written as compact JSON rather than pretty-printed: the padding reels are
 * 5 x ~620 symbols and nothing reads this file by eye.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const MATH_DIR = path.resolve(appRoot, '../../../math-sdk/games/GoBananubis');
const MATH_CONFIG = path.join(MATH_DIR, 'library/configs/config_fe_GoBananubis.json');
const OUT = path.join(appRoot, 'src/game/config.ts');

const EXPECTED_REELS = 5;
const EXPECTED_ROWS = 5;
// Every symbol the maths can put on a board. X and P belong to the
// hold-and-spin round (blank and coin); M is the sealed tablet. A symbol listed
// here needs art — one the maths emits and the client cannot draw is a blank
// cell in live play, not a cosmetic gap.
const EXPECTED_SYMBOLS = [
	'H1', 'H2', 'H3', 'H4',
	'L1', 'L2', 'L3', 'L4', 'L5',
	'W', 'S', 'M', 'P', 'X',
];
const EXPECTED_MODES = ['base', 'bonus', 'superbonus', 'superspin'];

if (!fs.existsSync(MATH_CONFIG)) {
	console.error(`Math config not found: ${MATH_CONFIG}`);
	console.error('Run the math pipeline first (games/GoBananubis/run.py).');
	process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(MATH_CONFIG, 'utf8'));
const problems = [];

if (raw.gameID !== 'GoBananubis') {
	problems.push(`gameID is "${raw.gameID}", expected "GoBananubis"`);
}
if (raw.numReels !== EXPECTED_REELS) {
	problems.push(`numReels is ${raw.numReels}, expected ${EXPECTED_REELS}`);
}
if (!Array.isArray(raw.numRows) || raw.numRows.some((n) => n !== EXPECTED_ROWS)) {
	problems.push(
		`numRows is ${JSON.stringify(raw.numRows)}, expected ${EXPECTED_REELS} x ${EXPECTED_ROWS}`,
	);
}
for (const gameType of ['basegame', 'freegame', 'superspin']) {
	const strips = raw.paddingReels?.[gameType];
	if (!Array.isArray(strips) || strips.length !== raw.numReels) {
		problems.push(`paddingReels.${gameType} missing or wrong reel count`);
	}
}

// The math writes symbols as a list of single-key objects in arbitrary order.
// Flatten to a map so SymbolName (keyof typeof config.symbols) and the paytable
// modal can both look a symbol up directly.
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

// The 50x hold-and-spin has to reach the player through the buy menu. It is the
// flag that was wrong for two generations, so it is asserted rather than
// trusted.
if (raw.betModes?.superspin && raw.betModes.superspin.buyBonus !== true) {
	problems.push('superspin is not flagged buyBonus in the maths');
}

// Every payout the RGS accepts is a whole number of 0.10x units. Checked here
// as well as in the maths because this is the file the client prints from.
for (const [name, info] of Object.entries(symbols)) {
	for (const entry of info.paytable ?? []) {
		for (const [kind, value] of Object.entries(entry)) {
			if (kind === '99') continue; // registration-only rows (X, M)
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
// Lifted rather than restated: the rules page and the buy cards print these,
// and a hand-kept copy is a second source of truth for a number that lives in
// the maths. That is the exact failure this whole script exists to close.
const mathSource = fs.readFileSync(path.join(MATH_DIR, 'game_config.py'), 'utf8');

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

// How many Scatters each bet mode's ordinary entry puts on the board.
//
// `freespin_bonus_spins` used to be read here instead, because the 500x buy
// added three spins on top of its award and the rules page had to say so. That
// mechanism is gone: every mode now awards exactly what its own Scatter count is
// worth, so what the front end needs is the COUNT, and the spins follow from
// scatterSpins above.
//
// It is scraped rather than restated for the reason this whole file exists. The
// loading tips, the feature card and the rules page all print "N Scatters award
// M spins", and all three of them once said "4 or 5 award 12 or 15" while every
// distribution in the maths forced five — a claim no book in the shipped game
// supported. Numbers a player reads come from the maths or they come from
// nowhere.
//
// The wincap criteria is skipped: it manufactures a cap book and is not the
// entry a player normally sees. It is checked against the ordinary one instead,
// because a cap book that lands a different Scatter count than the rest of its
// mode is a visible tell and awards a different number of spins.
const betModeBlocks = mathSource.split(/\bBetMode\(/).slice(1);
for (const block of betModeBlocks) {
	const name = block.match(/name="(\w+)"/)?.[1];
	if (!name || !raw.betModes[name]) continue;
	const byCriteria = {};
	for (const chunk of block.split(/\bDistribution\(/).slice(1)) {
		const criteria = chunk.match(/criteria="([^"]+)"/)?.[1];
		const triggers = chunk.match(/"scatter_triggers":\s*\{([^}]*)\}/);
		if (!criteria || !triggers) continue;
		const weights = {};
		for (const [, k, v] of triggers[1].matchAll(/(\d+)\s*:\s*(\d+)/g)) weights[Number(k)] = Number(v);
		byCriteria[criteria] = weights;
	}
	const entry = byCriteria.freegame;
	if (!entry) continue;
	for (const count of Object.keys(entry)) {
		if (!(count in scatterSpins)) {
			problems.push(`bet mode ${name} forces ${count} Scatters, which freespin_triggers does not award spins for`);
		}
	}
	if (byCriteria.wincap) {
		const capCounts = Object.keys(byCriteria.wincap);
		const entryCounts = Object.keys(entry);
		for (const count of capCounts) {
			if (!entryCounts.includes(count)) {
				problems.push(
					`bet mode ${name}: wincap books land ${count} Scatters but ordinary entries land ` +
						`${entryCounts.join('/')} — the cap book would show a board the mode never otherwise makes, ` +
						`and award ${scatterSpins[count]} spins instead of ${entryCounts.map((c) => scatterSpins[c]).join('/')}`,
				);
			}
		}
	}
	raw.betModes[name].scatterTriggers = entry;
}

// Re-checked after the scatter scrape, which is the only validation that needs
// both files. Everything above this ran before game_config.py had been read.
if (problems.length) {
	console.error('Math config failed validation:');
	for (const p of problems) console.error(`  - ${p}`);
	process.exit(1);
}

const config = { ...raw, symbols, scatterSpins };

const header = `// GENERATED FILE - do not edit by hand.
// Source: math-sdk/games/GoBananubis/library/configs/config_fe_GoBananubis.json
// Regenerate with: node design/sync_math_config.mjs
`;

fs.writeFileSync(OUT, `${header}export default ${JSON.stringify(config)};\n`, 'utf8');

const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Wrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
