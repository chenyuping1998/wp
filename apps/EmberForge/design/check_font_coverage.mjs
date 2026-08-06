// Does the generated display face cover every string the game actually renders,
// in every locale Stake supports?
//
//   node design/check_font_coverage.mjs
//
// WHAT THIS IS FOR
//
// Ember Runic is Latin-only. The claim that this is safe rests on browsers doing
// PER-CHARACTER font fallback — Japanese drops through to a face that has kana,
// and nothing breaks. That claim is true, but it is not the whole story:
//
//   · a locale whose script is entirely absent from the face falls back cleanly
//     and renders in one consistent typeface. Fine.
//   · a locale that is MOSTLY covered but has a few missing characters renders
//     in TWO typefaces inside the same word — "M[ü]NZE" with the umlaut in a
//     different face. That is a visible defect, and it is the one that a
//     Latin-only display face actually causes.
//
// So the interesting question is not "which locales are uncovered" but "which
// locales are PARTIALLY covered". This reports exactly that.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Both generated faces. They are cut from the same skeleton so their coverage
// should be identical, and this is what proves it stays that way: the title face
// falls back to the runic one, so a gap in EITHER produces the same defect this
// check exists for — two typefaces inside one word.
const TTFS = [
	path.join(appRoot, 'static/fonts/EmberRunic.ttf'),
	path.join(appRoot, 'static/fonts/EmberInscribed.ttf'),
].filter((file) => fs.existsSync(file));

// ── read the font's own cmap, rather than trusting the generator's intent ────
const readCoverage = (file) => {
	const buf = fs.readFileSync(file);
	const numTables = buf.readUInt16BE(4);
	let cmapOffset = -1;
	for (let i = 0; i < numTables; i += 1) {
		const rec = 12 + i * 16;
		if (buf.toString('ascii', rec, rec + 4) === 'cmap') cmapOffset = buf.readUInt32BE(rec + 8);
	}
	if (cmapOffset < 0) throw new Error('no cmap table');

	const numSub = buf.readUInt16BE(cmapOffset + 2);
	let subOffset = -1;
	for (let i = 0; i < numSub; i += 1) {
		const rec = cmapOffset + 4 + i * 8;
		const platform = buf.readUInt16BE(rec);
		const encoding = buf.readUInt16BE(rec + 2);
		if (platform === 3 && (encoding === 1 || encoding === 10)) {
			subOffset = cmapOffset + buf.readUInt32BE(rec + 4);
		}
	}
	if (subOffset < 0) throw new Error('no windows cmap subtable');
	if (buf.readUInt16BE(subOffset) !== 4) throw new Error('expected cmap format 4');

	const segCountX2 = buf.readUInt16BE(subOffset + 6);
	const segCount = segCountX2 / 2;
	const endsAt = subOffset + 14;
	const startsAt = endsAt + segCountX2 + 2;
	const deltasAt = startsAt + segCountX2;

	const covered = new Set();
	for (let s = 0; s < segCount; s += 1) {
		const end = buf.readUInt16BE(endsAt + s * 2);
		const start = buf.readUInt16BE(startsAt + s * 2);
		const delta = buf.readUInt16BE(deltasAt + s * 2);
		if (start === 0xffff) continue;
		for (let code = start; code <= end; code += 1) {
			if (((code + delta) & 0xffff) !== 0) covered.add(code);
		}
	}
	return covered;
};

// A codepoint counts as covered only if EVERY shipped face has it.
const perFace = TTFS.map((file) => ({ file, codes: readCoverage(file) }));
const covered = perFace.reduce(
	(acc, face, index) =>
		index === 0 ? face.codes : new Set([...acc].filter((code) => face.codes.has(code))),
	new Set(),
);
for (const face of perFace) {
	console.log(`${path.basename(face.file).padEnd(22)} ${face.codes.size} codepoints`);
}

// ── collect every string the game renders in GAME_FONT ───────────────────────
const strings = [];

// 1. the app's own 16-language dictionary
const i18nText = fs.readFileSync(path.join(appRoot, 'src/game/i18nText.ts'), 'utf8');
for (const m of i18nText.matchAll(/^\t\t(\w{2}):\s*(['"`])([\s\S]*?)\2,?$/gm)) {
  strings.push({ locale: m[1], text: m[3], where: 'i18nText' });
}

// 2. the shared bet-bar labels, which are drawn with the game's font too
const sharedDir = path.resolve(appRoot, '../../packages/components-ui-pixi/src/i18n/messagesMap');
for (const file of fs.existsSync(sharedDir) ? fs.readdirSync(sharedDir) : []) {
	if (!file.endsWith('.ts') || file === 'index.ts') continue;
	const locale = path.basename(file, '.ts');
	const src = fs.readFileSync(path.join(sharedDir, file), 'utf8');
	for (const m of src.matchAll(/['"`]([^'"`\n]{2,})['"`]\s*[,:}]/g)) {
		strings.push({ locale, text: m[1], where: `shared/${file}` });
	}
}

// 3. strings hardcoded in components (always English, but check them anyway)
for (const file of ['src/components/SpinLedger.svelte', 'src/components/Game.svelte']) {
	const src = fs.readFileSync(path.join(appRoot, file), 'utf8');
	for (const m of src.matchAll(/text=["'`]([A-Z][A-Z0-9 ·×$.,/+-]{2,})["'`]/g)) {
		strings.push({ locale: 'en', text: m[1], where: path.basename(file) });
	}
}

// ── analyse per locale ──────────────────────────────────────────────────────
const byLocale = new Map();
for (const entry of strings) {
	if (!byLocale.has(entry.locale)) byLocale.set(entry.locale, { total: 0, missing: new Map() });
	const bucket = byLocale.get(entry.locale);
	for (const ch of entry.text) {
		const code = ch.codePointAt(0);
		if (code === 0x20) continue;
		bucket.total += 1;
		if (!covered.has(code)) {
			const seen = bucket.missing.get(ch) ?? 0;
			bucket.missing.set(ch, seen + 1);
		}
	}
}

const LOCALES = ['ar','de','en','es','fr','id','ja','ko','pl','pt','ru','tr','vi','zh','fi','hi'];

console.log(`font covers ${covered.size} codepoints\n`);
console.log('locale  chars  missing   coverage  verdict');
console.log('------  -----  -------   --------  -------');

const partial = [];
for (const locale of LOCALES) {
	const bucket = byLocale.get(locale);
	if (!bucket || bucket.total === 0) {
		console.log(`${locale.padEnd(6)}  ${'-'.padStart(5)}  ${'-'.padStart(7)}   ${'-'.padStart(8)}  no strings found`);
		continue;
	}
	const missingCount = [...bucket.missing.values()].reduce((a, b) => a + b, 0);
	const pct = (100 * (bucket.total - missingCount)) / bucket.total;

	// A locale is either fully covered, or fully absent (clean fallback), or —
	// the problem case — somewhere in between, which mixes two typefaces inside
	// one word.
	let verdict;
	if (missingCount === 0) verdict = 'OK — all in Ember Runic';
	else if (pct < 5) verdict = 'OK — falls back wholesale';
	else {
		verdict = 'MIXED TYPEFACE';
		partial.push({ locale, pct, chars: [...bucket.missing.keys()] });
	}
	console.log(
		`${locale.padEnd(6)}  ${String(bucket.total).padStart(5)}  ${String(missingCount).padStart(7)}   ${pct.toFixed(1).padStart(7)}%  ${verdict}`,
	);
}

if (partial.length > 0) {
	console.log('\nPartially covered locales render two faces inside one word:');
	for (const p of partial) {
		console.log(`  ${p.locale}: ${p.chars.join(' ')}`);
	}
	const all = [...new Set(partial.flatMap((p) => p.chars))].sort();
	console.log(`\n  union of missing characters (${all.length}): ${all.join(' ')}`);
	process.exitCode = 1;
} else {
	console.log('\nOK: no locale is partially covered.');
}
