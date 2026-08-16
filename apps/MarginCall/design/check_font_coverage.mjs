// Guard: every localised string is set in a face that can actually draw it.
//
// Titan One ships subset to Latin-1 here. Browsers fall back PER GLYPH, so
// asking for it with a Polish or Russian or Chinese string produces one word in
// two typefaces. src/game/fontCoverage.ts carries the font's real cmap and
// src/game/fonts.ts exposes displayFontFor(); this checks three things:
//
//   1. fontCoverage.ts still matches the font file on disk (it is generated
//      data, and a resubset font would silently invalidate it)
//   2. every string in game/i18nText is reachable from a component that routes
//      through displayFontFor rather than naming GAME_FONT
//   3. reports which of the sixteen Stake locales fall back, so the cost is
//      visible rather than a surprise in a screenshot
//
// Run from the app root: node design/check_font_coverage.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT = path.join(appRoot, 'static/fonts/TitanOne.ttf');
const COVERAGE_TS = path.join(appRoot, 'src/game/fontCoverage.ts');
const I18N_TS = path.join(appRoot, 'src/game/i18nText.ts');
const COMPONENTS = path.join(appRoot, 'src/components');

let failed = false;
const fail = (message) => {
	console.error(`!! ${message}`);
	failed = true;
};

// ── 1. read the font's cmap and compare with the checked-in ranges ──────────
const readCmapRanges = (file) => {
	const d = fs.readFileSync(file);
	const numTables = d.readUInt16BE(4);
	let cmapOffset = null;
	for (let i = 0; i < numTables; i++) {
		const off = 12 + i * 16;
		if (d.toString('latin1', off, off + 4) === 'cmap') cmapOffset = d.readUInt32BE(off + 8);
	}
	if (cmapOffset === null) throw new Error('no cmap table');
	const n = d.readUInt16BE(cmapOffset + 2);
	let sub = null;
	for (let i = 0; i < n; i++) {
		const rec = cmapOffset + 4 + i * 8;
		const offset = cmapOffset + d.readUInt32BE(rec + 4);
		if (d.readUInt16BE(offset) === 4) sub = offset;
	}
	if (sub === null) throw new Error('no format-4 cmap subtable');
	const segX2 = d.readUInt16BE(sub + 6);
	const seg = segX2 / 2;
	const ranges = [];
	for (let i = 0; i < seg; i++) {
		const end = d.readUInt16BE(sub + 14 + i * 2);
		const start = d.readUInt16BE(sub + 16 + segX2 + i * 2);
		if (end !== 0xffff) ranges.push([start, end]);
	}
	return ranges;
};

const actual = readCmapRanges(FONT);
const coverageSrc = fs.readFileSync(COVERAGE_TS, 'utf8');
const declared = [...coverageSrc.matchAll(/\[0x([0-9a-f]{4}), 0x([0-9a-f]{4})\]/g)].map((m) => [
	parseInt(m[1], 16),
	parseInt(m[2], 16),
]);

const asKey = (ranges) => ranges.map(([a, b]) => `${a}-${b}`).join(',');
if (asKey(actual) !== asKey(declared)) {
	fail(
		`fontCoverage.ts is out of date with TitanOne.ttf.\n` +
			`   font declares ${actual.length} segments, fontCoverage.ts has ${declared.length}.\n` +
			`   replace COVERED with:\n   ` +
			actual.map(([a, b]) => `[0x${a.toString(16).padStart(4, '0')}, 0x${b.toString(16).padStart(4, '0')}]`).join(',\n   '),
	);
}

const covers = (text) => {
	for (const char of text) {
		const code = char.codePointAt(0);
		if (!actual.some(([lo, hi]) => code >= lo && code <= hi)) return false;
	}
	return true;
};

// ── 2. no component may set a gameText string in GAME_FONT ─────────────────
const files = fs
	.readdirSync(COMPONENTS, { recursive: true })
	.filter((f) => String(f).endsWith('.svelte'))
	.map((f) => path.join(COMPONENTS, String(f)));

for (const file of files) {
	const src = fs.readFileSync(file, 'utf8');
	if (!src.includes('gameText')) continue;
	if (src.includes('fontFamily: GAME_FONT')) {
		fail(
			`${path.relative(appRoot, file)} renders localised text but still names GAME_FONT.\n` +
				`   use displayFontFor(text) / displayWeightFor(text) from game/fonts.`,
		);
	}
}

// ── 3. report which locales fall back, per string ──────────────────────────
const i18nSrc = fs.readFileSync(I18N_TS, 'utf8');
const entries = [...i18nSrc.matchAll(/^\t\t([a-z]{2}): '((?:[^'\\]|\\.)*)',$/gm)];
const byLocale = new Map();
for (const [, locale, raw] of entries) {
	const text = raw.replace(/\\'/g, "'");
	if (!byLocale.has(locale)) byLocale.set(locale, { total: 0, fallback: 0 });
	const row = byLocale.get(locale);
	row.total += 1;
	if (!covers(text)) row.fallback += 1;
}

const display = [];
const fallback = [];
for (const [locale, row] of [...byLocale].sort()) {
	(row.fallback === 0 ? display : fallback).push(`${locale}${row.fallback ? `(${row.fallback}/${row.total})` : ''}`);
}
console.log(`   display face: ${display.join(' ') || 'none'}`);
console.log(`   body fallback: ${fallback.join(' ') || 'none'}`);

if (failed) process.exit(1);
console.log('OK: every localised string is set in a face that can draw it');
