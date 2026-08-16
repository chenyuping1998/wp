// Restricted-word guard for social play.
//
// Social jurisdictions forbid betting terminology in anything the player can
// read. Two rounds of certification have now come back for the same reason —
// first "pay", then "buy" and "cost" — because the words are scattered across
// prose that nobody re-reads after editing.
//
// Two rules, both mechanical:
//
//   1. Literal text in a player-facing template shows in BOTH modes, so it must
//      never contain a restricted word. Anything mode-dependent has to come
//      through a {…} expression instead.
//   2. The social argument of pick(normal, social) must not contain one either.
//
// Neither rule can catch a word that arrives from a variable, so this is a
// backstop, not a proof.
//
// Usage: node design/check_social_words.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Player-facing copy. Not every file in src — the check is only meaningful
// where the text is prose the player reads.
const TEMPLATES = [
	'src/components/ui/ModalGameRules.svelte',
	'src/components/ui/ModalPayTable.svelte',
	'src/components/ui/ReplayIntro.svelte',
];

const PICK_SOURCES = ['src/game/socialTerms.ts', 'src/game/betModeMeta.ts'];

// Words certification has flagged, plus the obvious neighbours. "pays"/"bought"
// etc. are covered by the word boundaries below.
const RESTRICTED = [
	'bet',
	'bets',
	'betting',
	'buy',
	'buys',
	'bought',
	'cost',
	'costs',
	'pay',
	'pays',
	'paid',
	'payout',
	'payline',
	'paylines',
	'paytable',
	'wager',
	'wagers',
	'stake',
	'stakes',
	'gamble',
	'gambling',
	'cash',
	'purchase',
	'price',
];

const pattern = new RegExp(`\\b(${RESTRICTED.join('|')})\\b`, 'gi');

// "Stake Engine" is the platform's own name and appears in the required
// attribution line. Only the standalone word is a wagering term.
const dropProperNouns = (text) => text.replace(/Stake Engine/g, 'Platform');

let problems = 0;

const report = (file, kind, text, words) => {
	console.log(
		`  !! ${file}: ${kind} contains ${[...new Set(words)].join(', ')}\n     ${text.trim().replace(/\s+/g, ' ').slice(0, 100)}`,
	);
	problems++;
};

// ── rule 1: literal text in templates ────────────────────────────────────────
for (const rel of TEMPLATES) {
	const full = path.join(appRoot, rel);
	if (!fs.existsSync(full)) continue;
	let markup = fs.readFileSync(full, 'utf8');

	// drop script, style, comments, and every {…} expression — what is left is
	// the literal text the player sees in both modes
	markup = markup
		.replace(/<script[\s\S]*?<\/script>/g, '')
		.replace(/<style[\s\S]*?<\/style>/g, '')
		.replace(/<!--[\s\S]*?-->/g, '');

	// remove balanced {…} regions at any depth
	let stripped = '';
	for (let i = 0; i < markup.length; i++) {
		if (markup[i] !== '{') {
			stripped += markup[i];
			continue;
		}
		let depth = 0;
		for (let j = i; j < markup.length; j++) {
			if (markup[j] === '{') depth++;
			else if (markup[j] === '}' && --depth === 0) {
				i = j;
				break;
			}
		}
	}

	// drop tags and attributes, keep text nodes
	const text = stripped.replace(/<[^>]*>/g, '\n');

	for (const line of dropProperNouns(text).split('\n')) {
		const hits = line.match(pattern);
		if (hits) report(rel, 'literal template text', line, hits);
	}
}

// ── rule 2: the social side of pick(normal, social) ──────────────────────────
for (const rel of PICK_SOURCES) {
	const full = path.join(appRoot, rel);
	if (!fs.existsSync(full)) continue;
	const source = fs.readFileSync(full, 'utf8');

	// pick( 'a', 'b' ) with either quote style, possibly across lines
	const calls = source.matchAll(
		/pick\(\s*(['"])((?:\\.|(?!\1)[\s\S])*)\1\s*,\s*(['"])((?:\\.|(?!\3)[\s\S])*)\3\s*,?\s*\)/g,
	);
	for (const m of calls) {
		const socialText = m[4];
		const hits = socialText.match(pattern);
		if (hits) report(rel, 'social branch of pick()', socialText, hits);
	}
}

console.log(
	problems === 0
		? 'OK: no restricted words in social-facing copy'
		: `${problems} restricted-word problem(s) found`,
);
process.exit(problems === 0 ? 0 : 1);
