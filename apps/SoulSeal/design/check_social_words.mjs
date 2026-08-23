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

// Files whose <script> string literals are player-facing copy in their own
// right. The template rule above strips <script> wholesale, which is correct
// for logic and wrong for these: the loading screen's rotating tips are an
// array of literal sentences that the player reads before anything else.
const LITERAL_SOURCES = ['src/components/LoadingScreen.svelte'];

// The pixi-drawn strings. Certification came back on the feature intro's max-win
// line, which lives here and not in any template: gameText() renders it and
// there was no social branch at all, so the word showed in both modes.
const I18N_SOURCE = 'src/game/i18nText.ts';

// Stake's published restricted list, transcribed from
// <https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements>,
// plus the obvious neighbours. "pays"/"bought" etc. are covered by the word
// boundaries below.
//
// This list started as "the words review has flagged so far" and was extended
// each time one got through. That is backwards, and it cost a round: review
// flagged "currency" in the pay table's unit banner - a word that is on Stake's
// published table and was simply never in this array. Everything on their table
// is here now, whether or not it has been flagged, so the guard can fail before
// the upload rather than after it.
const RESTRICTED = [
	'bet',
	'bets',
	'betting',
	'rebet',
	'buy',
	'buys',
	'bought',
	'cost',
	'costs',
	'pay',
	'pays',
	'paid',
	'payer',
	'payout',
	'payouts',
	'payline',
	'paylines',
	'paytable',
	'wager',
	'wagers',
	'wagering',
	'stake',
	'stakes',
	'gamble',
	'gambling',
	'cash',
	'purchase',
	'purchases',
	'price',
	// The half of their table that this guard used to be blind to. "balance",
	// "coins" and "token" are the sanctioned replacements and are NOT restricted.
	'currency',
	'currencies',
	'money',
	'fund',
	'funds',
	'credit',
	'credits',
	'deposit',
	'deposits',
	'withdraw',
	'withdrawal',
	'withdrawals',
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

// ── rule 3: literal strings in named script sources ──────────────────────────
for (const rel of LITERAL_SOURCES) {
	const full = path.join(appRoot, rel);
	if (!fs.existsSync(full)) continue;
	const source = fs.readFileSync(full, 'utf8').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
	for (const m of source.matchAll(/(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g)) {
		const hits = dropProperNouns(m[2]).match(pattern);
		if (hits) report(rel, 'string literal', m[2], hits);
	}
}

// ── rule 4: gameText strings need a social twin ──────────────────────────────
// TEXTS may legitimately say "bet" — that is the normal-play wording. What is
// NOT allowed is for it to have no social override, because gameText then
// renders the same sentence in both modes. Only English is checked: the
// restricted list is English, and a Russian or Japanese sentence never matches
// it however it is worded, so a per-locale check would be theatre. The pairing
// is what actually protects the other 15 — SOCIAL_TEXTS is all-or-nothing per
// key by construction (see gameText).
{
	const full = path.join(appRoot, I18N_SOURCE);
	if (fs.existsSync(full)) {
		const source = fs.readFileSync(full, 'utf8');
		// The two tables, sliced apart so a key's English can be attributed to the
		// right one. Both are top-level `const NAME = {` … `\n};` blocks.
		// TEXTS closes with `} as const;` and SOCIAL_TEXTS with `};`, so both
		// terminators have to be tried and the nearer one taken - matching only
		// `\n};` runs the TEXTS block on into SOCIAL_TEXTS and the two stop being
		// distinguishable.
		const block = (name) => {
			const start = source.indexOf(`const ${name}`);
			if (start < 0) return '';
			const ends = ['\n} as const;', '\n};']
				.map((token) => source.indexOf(token, start))
				.filter((at) => at >= 0);
			return ends.length ? source.slice(start, Math.min(...ends)) : source.slice(start);
		};
		const englishByKey = (text) => {
			const out = {};
			// `key: {` opens an entry; the first `en: '…'` after it belongs to that key
			for (const m of text.matchAll(/(\w+):\s*\{/g)) {
				const rest = text.slice(m.index);
				const en = rest.match(/\ben:\s*(['"])((?:\\.|(?!\1)[\s\S])*)\1/);
				const nextKey = rest.slice(m[0].length).match(/\n\t(\w+):\s*\{/);
				// only accept an `en` that falls before the next key starts
				if (en && (!nextKey || en.index < nextKey.index + m[0].length)) out[m[1]] = en[2];
			}
			return out;
		};

		const normal = englishByKey(block('TEXTS'));
		const social = englishByKey(block('SOCIAL_TEXTS'));

		for (const [key, text] of Object.entries(normal)) {
			const hits = dropProperNouns(text).match(pattern);
			if (!hits) continue;
			if (!(key in social)) {
				report(I18N_SOURCE, `TEXTS.${key} has no SOCIAL_TEXTS override`, text, hits);
				continue;
			}
			const socialHits = dropProperNouns(social[key]).match(pattern);
			if (socialHits) report(I18N_SOURCE, `SOCIAL_TEXTS.${key}`, social[key], socialHits);
		}
	}
}

console.log(
	problems === 0
		? 'OK: no restricted words in social-facing copy'
		: `${problems} restricted-word problem(s) found`,
);
process.exit(problems === 0 ? 0 : 1);
