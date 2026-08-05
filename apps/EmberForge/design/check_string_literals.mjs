// Catch string literals that lost their quotes.
//
// This has now bitten twice, both times from the same cause: writing source
// through a shell that ate single quotes, turning `'sprite'` into `sprite` and
// `'scatter_1'` into `scatter_1`. Neither vite build nor the template's checks
// notice — a bare identifier is valid syntax, it just throws ReferenceError the
// first time that line runs. The Sound.svelte instance sat in `soundTumbleHit`,
// which only fires on a winning spin, so every win aborted its round while
// losing spins looked perfectly fine.
//
// There is no eslint config in this workspace and svelte-check is not
// installed, so this fills the gap with the one check that would have caught
// it: take the vocabularies that are only ever written as strings (sfx names,
// asset keys, game types) and assert none of them appears bare.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'src');

const read = (file) => fs.readFileSync(file, 'utf8');

// config.ts is a generated one-line dump of the math config — thousands of
// quoted keys, none of them written by hand, and nothing in it is code.
const GENERATED = new Set(['config.ts']);

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		if (GENERATED.has(entry.name)) return [];
		return /\.(svelte|ts)$/.test(entry.name) ? [full] : [];
	});

// ── vocabulary ────────────────────────────────────────────────────────────
// Every token that is written as a string literal ANYWHERE in src.
//
// Deliberately not a hand-maintained list. The first version of this check
// carried one — sfx names, asset keys, game types — and it would have caught
// the Sound.svelte case only because I already knew where to look. The whole
// point is to catch the one I do not know about, so the net is: if a word is
// quoted somewhere, it is a string, and a bare use of it elsewhere is a
// ReferenceError waiting for that line to run.
const vocab = new Set();
const files = walk(SRC);
for (const file of files) {
	for (const [, single, double] of read(file).matchAll(/'([^'\\\n]*)'|"([^"\\\n]*)"/g)) {
		const literal = single ?? double;
		if (literal && /^[A-Za-z_$][\w$]*$/.test(literal)) vocab.add(literal);
	}
}

if (vocab.size < 5) {
	console.error('check_string_literals: vocabulary came out empty — the scrape broke, not the code');
	process.exit(1);
}

// Several of these words are ALSO real identifiers somewhere — `sound` is an
// asset key and an imported binding, `explosion` is an asset key and a const.
// Those cannot be judged by name alone, so drop them rather than report a
// finding that is always noise. What is left is the set of names that have no
// legitimate identifier meaning in this codebase, which is where the check has
// teeth and no false positives.
const declared = new Set([
	// language and platform names that are legitimately both a bare identifier and
	// a quoted string somewhere (module specifiers, typeof tests, keys)
	'undefined', 'null', 'true', 'false', 'this', 'window', 'document', 'console',
	'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Promise', 'Set',
	'Map', 'Date', 'JSON', 'Error', 'Audio', 'Image', 'performance', 'navigator',
	'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
	'cancelAnimationFrame', 'fetch', 'URL', 'Float32Array', 'Uint8Array', 'RegExp',
	'Infinity', 'NaN', 'globalThis', 'structuredClone', 'queueMicrotask',
	'number', 'string', 'boolean', 'object', 'function', 'symbol', 'bigint',
	'default', 'from', 'as', 'type', 'in', 'of', 'new', 'return', 'await',
]);
const declarationPatterns = [
	/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g,
	/\bimport\s+([A-Za-z_$][\w$]*)/g,
	/\bimport\s+(?:type\s+)?\{([^}]*)\}/g,
	/\bexport\s+(?:type\s+)?\{([^}]*)\}/g,
	// parameter lists — an arrow's parameter is a declaration too, and missing
	// them is what made `anticipation` look bare on its own first use
	/\(([^()]*)\)\s*(?::[^=]*?)?=>/g,
	/\bfunction\s*[A-Za-z_$\w]*\s*\(([^()]*)\)/g,
	/\bcatch\s*\(([^)]*)\)/g,
];
for (const file of walk(SRC)) {
	const source = read(file);
	for (const pattern of declarationPatterns) {
		for (const [, captured] of source.matchAll(pattern)) {
			for (const name of captured.split(',')) {
				const cleaned = name
					.replace(/\btype\b/, '')
					.split(/\s+as\s+/)
					.pop()
					// parameters carry a type annotation and possibly a default
					?.split(':')[0]
					.split('=')[0]
					.replace(/[{}[\]?.]/g, '')
					.trim();
				if (cleaned) declared.add(cleaned);
			}
		}
	}
}
for (const name of declared) vocab.delete(name);

// ── scan ──────────────────────────────────────────────────────────────────
// Strip comments and string/template contents first, so the only thing left is
// code. A name surviving that is being used as an identifier.
// Blanking must preserve newlines. Collapsing a block comment to one space
// shifts every line number after it, which is how this reported a finding on
// `console.error(` that was really eleven lines further down.
const blank = (match) => match.replace(/[^\n]/g, ' ');

const strip = (source) =>
	source
		.replace(/\/\*[\s\S]*?\*\//g, blank)
		.replace(/(^|[^:])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)))
		.replace(/<!--[\s\S]*?-->/g, blank)
		.replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
		.replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
		.replace(/`(?:[^`\\]|\\.)*`/g, '``');

// Markup is prose — "The Forge Scatter can land anywhere" is not a bare
// identifier. Only code is scanned.
const scriptOnly = (source, file) => {
	if (!file.endsWith('.svelte')) return source;
	const blocks = [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
	// keep line numbers honest: blank out everything that is not script
	const lines = source.split('\n');
	const keep = new Array(lines.length).fill(false);
	for (const block of blocks) {
		const startLine = source.slice(0, block.index).split('\n').length - 1;
		const endLine = startLine + block[0].split('\n').length - 1;
		for (let i = startLine; i <= endLine; i += 1) keep[i] = true;
	}
	return lines.map((line, i) => (keep[i] ? line : '')).join('\n');
};

const findings = [];
for (const file of walk(SRC)) {
	const raw = read(file);
	const stripped = strip(scriptOnly(raw, file));
	const lines = stripped.split('\n');
	lines.forEach((line, index) => {
		for (const word of vocab) {
			// bare use: not a property key (`word:`), not an optional type member
			// (`word?:`), not a member access (`.word`), not a declaration
			const re = new RegExp(`(^|[^\\w.'"\`])${word}(?![\\w:]|\\?:)`, 'g');
			let match;
			while ((match = re.exec(line))) {
				const before = line.slice(0, match.index + match[0].length - word.length);
				if (/\b(const|let|var|function|class|import|as|from|interface|type)\s+$/.test(before)) continue;
				findings.push({
					file: path.relative(appRoot, file),
					line: index + 1,
					word,
					source: raw.split('\n')[index]?.trim() ?? '',
				});
			}
		}
	});
}

if (findings.length > 0) {
	console.error('Bare identifiers that should be string literals:\n');
	for (const f of findings) {
		console.error(`  ${f.file}:${f.line}  ${f.word}`);
		console.error(`    ${f.source}`);
	}
	console.error(`\n${findings.length} finding(s). Each one throws ReferenceError when that line runs.`);
	process.exit(1);
}

console.log(`OK: no unquoted string literals (${vocab.size} names checked)`);
