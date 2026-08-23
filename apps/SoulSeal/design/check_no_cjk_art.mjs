// No CJK glyphs in the game's own art or in its non-localised strings.
//
// The symbols are A K Q J and a set of painted icons; nothing the player sees
// is written in Chinese. An earlier draft of this game had the low symbols as
// the five elements (金木水火土) and the wordmark as 封魂, and the placeholder
// generator drew all of them - so the constraint is not hypothetical, it is a
// direction that was already once going the other way.
//
// LOCALISATION IS NOT ART. src/i18n and src/game/i18nText.ts carry zh, ja and ko
// strings on purpose: the platform sends ?lang=zh and the game has to answer in
// it. Those are exempt. What is checked is everything that ends up baked into a
// texture or shown regardless of language.
//
// Usage: node design/check_no_cjk_art.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

// CJK ideographs, kana, and Hangul. Not punctuation - the em dash and the
// ideographic space turn up in comments and are harmless.
//
// Built from escapes rather than written out, so this file does not trip its
// own check. It did, on the first run.
const CJK = new RegExp(
	'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]',
);

// Localisation lives here and is exempt by design.
const EXEMPT = [
	path.join(appRoot, 'src/i18n'),
	path.join(appRoot, 'src/game/i18nText.ts'),
	path.join(appRoot, 'src/game/fontCoverage.ts'),
	// The design notes are written in Chinese for the person maintaining them.
	path.join(appRoot, 'design/source'),
];

const SEARCH = [
	{ dir: path.join(appRoot, 'src'), exts: ['.ts', '.svelte'] },
	{ dir: path.join(appRoot, 'design'), exts: ['.mjs'] },
];

const isExempt = (file) => EXEMPT.some((e) => file === e || file.startsWith(e + path.sep));

const walk = (dir, exts, out = []) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (isExempt(full)) continue;
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules') continue;
			walk(full, exts, out);
		} else if (exts.some((e) => entry.name.endsWith(e))) {
			out.push(full);
		}
	}
	return out;
};

const hits = [];

for (const { dir, exts } of SEARCH) {
	if (!fs.existsSync(dir)) continue;
	for (const file of walk(dir, exts)) {
		const lines = fs.readFileSync(file, 'utf8').split('\n');
		lines.forEach((line, i) => {
			if (!CJK.test(line)) return;
			// A comment explaining the constraint may name what it excludes, and a
			// comment is never drawn. Only flag CJK that could reach a texture or a
			// visible string.
			const trimmed = line.trim();
			if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
			hits.push(`${path.relative(appRoot, file)}:${i + 1}  ${trimmed.slice(0, 80)}`);
		});
	}
}

if (hits.length > 0) {
	console.log(`  !! ${hits.length} CJK glyph(s) outside localisation`);
	for (const h of hits.slice(0, 20)) console.log(`     ${h}`);
	if (hits.length > 20) console.log(`     ... and ${hits.length - 20} more`);
	console.log('  The game does not use Chinese characters in its art or its');
	console.log('  language-independent strings. Localised copy belongs in src/i18n.');
	process.exit(1);
}

console.log('OK: no CJK glyphs in art or language-independent strings');
