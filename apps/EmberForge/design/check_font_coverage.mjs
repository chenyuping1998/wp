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

/**
 * Will a BROWSER accept this file?
 *
 * Coverage is measured by reading the cmap, and a lenient parser will read a
 * cmap out of a file no browser would ever load. That is not hypothetical: both
 * faces shipped for weeks with an OS/2 table two bytes short of its declared
 * version and a duplicate cmap segment, so `document.fonts` reported "error",
 * every Text fell back to Titan One, and the carved face was never once on
 * screen — while this check happily reported full coverage and the resvg
 * specimen rendered perfectly.
 *
 * These are the two things that were wrong. Both are fatal to a browser's font
 * sanitiser and invisible to everything else.
 */
const OS2_LENGTH_BY_VERSION = { 0: 78, 1: 86, 2: 96, 3: 96, 4: 96, 5: 100 };

const checkLoadable = (file) => {
	const buf = fs.readFileSync(file);
	const problems = [];
	const numTables = buf.readUInt16BE(4);
	const tables = {};
	for (let i = 0; i < numTables; i += 1) {
		const rec = 12 + i * 16;
		tables[buf.toString('ascii', rec, rec + 4)] = {
			offset: buf.readUInt32BE(rec + 8),
			length: buf.readUInt32BE(rec + 12),
		};
	}

	const os2 = tables['OS/2'];
	if (!os2) problems.push('no OS/2 table');
	else {
		const version = buf.readUInt16BE(os2.offset);
		const expected = OS2_LENGTH_BY_VERSION[version];
		if (expected === undefined) problems.push(`OS/2 declares unknown version ${version}`);
		else if (os2.length !== expected)
			problems.push(`OS/2 version ${version} must be ${expected} bytes, is ${os2.length}`);
	}

	const cmap = tables.cmap;
	if (!cmap) problems.push('no cmap table');
	else {
		const subCount = buf.readUInt16BE(cmap.offset + 2);
		for (let i = 0; i < subCount; i += 1) {
			const rec = cmap.offset + 4 + i * 8;
			const sub = cmap.offset + buf.readUInt32BE(rec + 4);
			if (buf.readUInt16BE(sub) !== 4) continue;
			const segCount = buf.readUInt16BE(sub + 6) / 2;
			const endsAt = sub + 14;
			let previous = -1;
			for (let seg = 0; seg < segCount; seg += 1) {
				const end = buf.readUInt16BE(endsAt + seg * 2);
				if (end <= previous)
					problems.push(
						`cmap segment ${seg} ends at 0x${end.toString(16)}, not after the previous ` +
							`0x${previous.toString(16)} — format 4 requires strictly increasing endCodes`,
					);
				previous = end;
			}
			if (previous !== 0xffff) problems.push('cmap format 4 does not end at 0xFFFF');
		}
	}
	return problems;
};

let unloadable = 0;
for (const file of TTFS) {
	const problems = checkLoadable(file);
	for (const problem of problems) {
		console.error(`  ${path.basename(file)}: ${problem}`);
		unloadable += 1;
	}
}
if (unloadable > 0) {
	console.error(`
${unloadable} problem(s) that make a browser refuse the file.`);
	process.exit(1);
}

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

// ── keep src/game/fontCoverage.ts in step with the faces on disk ─────────────
//
// Reporting a partially-covered locale is only half a fix: it tells a developer
// that a string cannot be set in the display face, but nothing stops the game
// asking for it anyway. fonts.ts uses this table at RUNTIME to choose the body
// stack instead, per string, so a locale the faces cannot draw never mixes two
// typefaces inside one word.
//
// Emitted from the faces themselves rather than maintained by hand — the two
// drifting apart is exactly the failure this is meant to prevent. Regenerate
// with `node design/check_font_coverage.mjs --emit`.
const COVERAGE_TS = path.join(appRoot, 'src/game/fontCoverage.ts');

const toRanges = (codes) => {
	const sorted = [...codes].sort((a, b) => a - b);
	const ranges = [];
	for (const code of sorted) {
		const last = ranges[ranges.length - 1];
		if (last && code === last[1] + 1) last[1] = code;
		else ranges.push([code, code]);
	}
	return ranges;
};

const hex = (n) => `0x${n.toString(16).padStart(4, '0')}`;
const ranges = toRanges(covered);
const coverageSource = `// GENERATED by design/check_font_coverage.mjs --emit — do not edit by hand.
//
// What the display faces can actually draw: the INTERSECTION of EmberRunic and
// EmberInscribed's cmaps, since a string may be set in either.
//
// This matters because browsers fall back PER GLYPH. Ask for Ember Runic and set
// the Polish "SIATKA ŻARU" in it and you get SIATKA - ARU in the display face and
// Ż in whatever the fallback is: two faces inside one word. That reads as a
// rendering bug and is strictly worse than setting the whole line in one plain
// face — which is what fonts.ts does instead, using this table.
const COVERED: readonly (readonly [number, number])[] = [
${ranges.map(([lo, hi]) => `\t[${hex(lo)}, ${hex(hi)}],`).join('\n')}
];

export const isCoveredByDisplayFont = (text: string): boolean => {
	for (const ch of text) {
		const code = ch.codePointAt(0);
		if (code === undefined) continue;
		// A space is drawn by nothing and breaks no word.
		if (code === 0x20) continue;
		if (!COVERED.some(([lo, hi]) => code >= lo && code <= hi)) return false;
	}
	return true;
};
`;

if (process.argv.includes('--emit')) {
	fs.writeFileSync(COVERAGE_TS, coverageSource, 'utf8');
	console.log(`\nwrote ${path.relative(appRoot, COVERAGE_TS)} (${ranges.length} ranges)\n`);
} else if (!fs.existsSync(COVERAGE_TS)) {
	console.error(`\n${path.relative(appRoot, COVERAGE_TS)} is missing — run with --emit\n`);
	process.exit(1);
} else if (fs.readFileSync(COVERAGE_TS, 'utf8').replace(/\r\n/g, '\n') !== coverageSource) {
	console.error(
		`\n${path.relative(appRoot, COVERAGE_TS)} no longer matches the fonts on disk.` +
			`\nRe-run with --emit. Until then the game may ask the display face for a glyph it does not have.\n`,
	);
	process.exit(1);
}

// ── collect every string the game renders in GAME_FONT ───────────────────────
const strings = [];

// 1. the app's own 16-language dictionary
//
// ── not all of it ──
// This check rests on one premise: that every string it reads is drawn in the
// generated face. That was true while i18nText held nothing but short display
// labels. It stopped being true with the loading screen's feature panels, whose
// BODY copy is deliberately set in BODY_FONT — the system stack — because it is
// set around 14px and the generated faces close their counters below about 15.
//
// Scoring those against the face reports a problem that cannot occur: a sentence
// drawn in Trebuchet cannot render half in Ember Runic. Worse, it does real
// damage, because a body sentence carrying "Scatter" and a few digits drags a
// wholesale-fallback locale like ru or zh up past the 5% line and turns a clean
// pass into MIXED TYPEFACE.
//
// So keys ending in `Body` are skipped, and the convention is load-bearing: a key
// named `*Body` MUST be rendered in BODY_FONT, and anything drawn in the display
// face must NOT be named that way.
// Split on \r?\n, not \n. The file is CRLF in this working tree, and a trailing
// \r left on the line stops `$` from matching — which is not a hypothetical: the
// previous single-regex version anchored with /m and, unable to end a line at the
// \r, let its backreference run on to a quote SEVERAL ENTRIES LATER. It matched,
// so it looked like it worked, while attributing whole blocks of one language's
// text to whichever locale started the block.
const i18nText = fs.readFileSync(path.join(appRoot, 'src/game/i18nText.ts'), 'utf8');
let currentKey = '';
for (const line of i18nText.split(/\r?\n/)) {
	const keyMatch = line.match(/^\t(\w+):\s*\{/);
	if (keyMatch) {
		currentKey = keyMatch[1];
		continue;
	}
	const m = line.match(/^\t\t(\w{2}):\s*(['"`])([\s\S]*?)\2,?$/);
	if (!m) continue;
	if (currentKey.endsWith('Body')) continue;
	strings.push({ locale: m[1], text: m[3], where: `i18nText.${currentKey}` });
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
	console.log('\nLocales the display faces cannot set completely:');
	for (const p of partial) {
		console.log(`  ${p.locale}: ${p.chars.join(' ')}`);
	}
}

// ── the check that actually fails the build ─────────────────────────────────
//
// "Which locales are partially covered" used to BE the failure, on the reasoning
// that a partially covered locale mixes two faces inside a word. It does — but
// only if the game asks for the display face, and fonts.displayFontFor now
// declines to when the string is not fully covered. So partial coverage is
// information; asking for the face regardless is the bug.
//
// A component that draws gameText() must route through displayFontFor /
// titleFontFor rather than naming GAME_FONT or TITLE_FONT, or the fallback
// cannot happen.
const LOCALISED_COMPONENTS = fs
	.readdirSync(path.join(appRoot, 'src/components'), { withFileTypes: true })
	.flatMap((e) => (e.isFile() && e.name.endsWith('.svelte') ? [e.name] : []));

let failed = false;
for (const name of LOCALISED_COMPONENTS) {
	const file = path.join(appRoot, 'src/components', name);
	const src = fs.readFileSync(file, 'utf8');
	if (!src.includes('gameText(')) continue;
	// PressToContinue takes its face as a prop, so the caller chooses; it is
	// checked at its call sites like any other component.
	const names = [...src.matchAll(/fontFamily:\s*(GAME_FONT|TITLE_FONT)\b/g)];
	if (names.length > 0) {
		console.log(
			`\n  !! src/components/${name} draws localised text but names ` +
				`${[...new Set(names.map((m) => m[1]))].join('/')} directly` +
				`\n     use displayFontFor(text) / titleFontFor(text) from game/fonts`,
		);
		failed = true;
	}
}

if (failed) {
	process.exitCode = 1;
} else {
	console.log('\nOK: every localised string is set in a face that can draw it.');
}
