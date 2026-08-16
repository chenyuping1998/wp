// Guard: player-facing copy must not have maths figures typed into it.
//
// The buy-bonus card read "200x BET" and "the same 96% RTP" while the maths had
// moved to a 180x buy at 93%. The confirmation dialog showed the wrong multiple
// directly above the correct price, because the price came from config and the
// sentence did not. Nothing failed - a literal in a string cannot go stale
// loudly.
//
// Two rules, both narrow enough to have no false positives:
//
//   A. src/game/betModeMeta.ts - the bet-mode cards - may not contain a digit
//      inside any copy string. Every figure there is a maths figure, so every
//      one of them has to be interpolated from `config`.
//
//   B. anywhere in src/, a percentage presented as the RTP must equal the RTP in
//      config.ts.
//
// Run from the app root: node design/check_copy_figures.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'src');

let failed = false;
const fail = (message) => {
	console.error(`!! ${message}`);
	failed = true;
};

/**
 * Strip comments before scanning. The rules below are about COPY, and a comment
 * explaining why a figure changed necessarily names the old one - the first run
 * of this check failed on its own changelog note.
 *
 * Block comments go entirely; line comments only when the line is a comment,
 * which keeps `https://` inside a string safe. That is enough for this codebase,
 * where trailing `//` comments are not the house style.
 */
const stripComments = (src) =>
	src
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.split('\n')
		.filter((line) => !line.trim().startsWith('//'))
		.join('\n');

// ── the figures the maths actually publishes ────────────────────────────────
const configSrc = fs.readFileSync(path.join(SRC, 'game/config.ts'), 'utf8');
const json = JSON.parse(configSrc.slice(configSrc.indexOf('{'), configSrc.lastIndexOf('}') + 1));
const rtpPct = Math.round(json.rtp * 100);

// ── rule A: no typed digits in the bet-mode copy ───────────────────────────
const metaPath = path.join(SRC, 'game/betModeMeta.ts');
const metaSrc = stripComments(fs.readFileSync(metaPath, 'utf8'));

// Every string literal in the file, with `${...}` interpolations removed - those
// are derived values and are exactly what we want to see.
const stringLiterals = [
	...metaSrc.matchAll(/`((?:[^`\\]|\\.)*)`/g),
	...metaSrc.matchAll(/'((?:[^'\\]|\\.)*)'/g),
];
for (const [, raw] of stringLiterals) {
	const literalOnly = raw.replace(/\$\{[^}]*\}/g, '');
	// 5x5 is the board shape, not a maths figure that can drift - the row count
	// is fixed by the game design and checked separately by check_board_fit.
	const suspicious = literalOnly.replace(/5×5/g, '').match(/\d[\d,.]*/g);
	if (suspicious) {
		fail(
			`betModeMeta.ts has typed figures in copy: ${suspicious.join(', ')}\n` +
				`   in: "${literalOnly.trim().slice(0, 90)}"\n` +
				`   interpolate them from config instead.`,
		);
	}
}

// ── rule B: any RTP percentage in player-facing copy must be the real one ──
const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return /\.(svelte|ts)$/.test(entry.name) ? [full] : [];
	});

for (const file of walk(SRC)) {
	const src = stripComments(fs.readFileSync(file, 'utf8'));
	// "96% RTP" / "RTP is 96%" / "96.00% RTP", but only where the two are adjacent
	for (const m of src.matchAll(/(\d{2}(?:\.\d+)?)\s*%\s*RTP|RTP[^.\n]{0,12}?(\d{2}(?:\.\d+)?)\s*%/gi)) {
		const found = Number(m[1] ?? m[2]);
		if (Math.round(found) !== rtpPct) {
			fail(
				`${path.relative(appRoot, file)}: copy says ${found}% RTP, ` +
					`config says ${rtpPct}% — "${m[0].trim()}"`,
			);
		}
	}
}

if (failed) process.exit(1);
console.log(`OK: no maths figures typed into copy (rtp ${rtpPct}%, buy ${json.betModes.bonus.cost}x)`);
