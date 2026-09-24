// Restricted-word guard for social play.
//
// Social jurisdictions forbid gambling terminology in anything the player can
// read. Certification has come back for this three times — "pay", then
// "buy"/"cost", then "funds" — because the words are scattered across prose
// nobody re-reads after editing, and the third one lived in a shared package
// this script did not even look at.
//
// The word list is Stake's published table, not a guess:
// https://stake-engine.com/docs/approval-guidelines/jurisdiction-requirements
// (the page is client-rendered, so it has to be read in a browser, not fetched).
//
// Three mechanical rules:
//
//   1. Literal text in a template shows in BOTH modes, so it must never contain
//      a restricted word. Anything mode-dependent has to come through a {…}
//      expression.
//   2. The social argument of pick(normal, social) must be clean.
//   3. The true branch of `social ? … : …` must be clean — that is the shape the
//      shared i18n files use.
//
// None of these can see a word that arrives from a variable, so this is a
// backstop, not a proof.
//
// Usage: node design/check_social_words.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(appRoot, '../..');

// Stake's table: restricted phrase → their suggested replacement. The
// replacement is here for the reader, not the check — knowing what to write
// instead is most of the work when this fires.
const RESTRICTED = {
	'win feature': 'play feature',
	'pay out': 'win / won',
	'paid out': 'won',
	'pays out': 'won',
	'place your bets': 'come and play',
	'at the cost of': 'for',
	'cost of': 'can be played for',
	'buy bonus': 'get bonus',
	'bonus buy': 'bonus / feature',
	'total bet': 'total play',
	stake: 'play amount',
	betting: 'playing',
	bet: 'play',
	bets: 'plays',
	rebet: 'respin',
	cash: 'coins',
	payer: 'winner',
	pay: 'win',
	pays: 'wins',
	paid: 'won',
	money: 'coins',
	buy: 'play',
	bought: 'instantly triggered',
	purchase: 'play',
	credit: 'balance',
	gamble: 'play',
	wager: 'play',
	deposit: 'get coins',
	withdraw: 'redeem',
	currency: 'token',
	fund: 'balance',
	funds: 'balance',
	// not in the published table, but the same family and already flagged in
	// review prose
	cost: 'total',
	payout: 'win',
	payline: 'playline',
	paylines: 'playlines',
	'pay table': 'win table',
	paytable: 'win table',
};

// longest first so "total bet" is reported rather than the bare "bet" inside it
const terms = Object.keys(RESTRICTED).sort((a, b) => b.length - a.length);
const pattern = new RegExp(`(?<![\\w-])(${terms.map((t) => t.replace(/ /g, '\\s+')).join('|')})(?![\\w-])`, 'gi');

// "Stake Engine" is the platform's own name and appears in the attribution line.
// Only the standalone word is a wagering term.
const dropProperNouns = (text) => text.replace(/Stake\s+Engine/gi, 'Platform');

// Files whose social branches must be clean. Reaches into packages/ on purpose:
// the shared i18n is where the "funds" string lived, and no game's build was
// looking at it.
const SOCIAL_BRANCH_SOURCES = [
	path.join(appRoot, 'src/game/socialTerms.ts'),
	path.join(appRoot, 'src/game/betModeMeta.ts'),
	path.join(appRoot, 'src/components/ui/ReplayIntro.svelte'),
	path.join(repoRoot, 'packages/components-ui-html/src/i18n/i18nDerived.ts'),
	path.join(repoRoot, 'packages/components-ui-pixi/src/i18n/i18nDerived.ts'),
];

let problems = 0;

const report = (file, kind, text, hits) => {
	const words = [...new Set(hits.map((h) => h.toLowerCase().replace(/\s+/g, ' ')))];
	const advice = words.map((w) => `${w} → ${RESTRICTED[w] ?? '?'}`).join(', ');
	console.log(
		`  !! ${path.relative(repoRoot, file)}: ${kind}\n     ${text.trim().replace(/\s+/g, ' ').slice(0, 110)}\n     ${advice}`,
	);
	problems++;
};

// ── rule 1: literal text in every template ───────────────────────────────────
const svelteFiles = (dir) =>
	fs.existsSync(dir)
		? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
				const full = path.join(dir, e.name);
				if (e.isDirectory()) return svelteFiles(full);
				return e.name.endsWith('.svelte') ? [full] : [];
			})
		: [];

for (const file of svelteFiles(path.join(appRoot, 'src'))) {
	let markup = fs
		.readFileSync(file, 'utf8')
		.replace(/<script[\s\S]*?<\/script>/g, '')
		.replace(/<style[\s\S]*?<\/style>/g, '')
		.replace(/<!--[\s\S]*?-->/g, '');

	// remove balanced {…} regions at any depth — what is left is literal text
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

	const text = dropProperNouns(stripped.replace(/<[^>]*>/g, '\n'));
	for (const line of text.split('\n')) {
		const hits = line.match(pattern);
		if (hits) report(file, 'literal template text', line, hits);
	}
}

// ── rules 2 and 3: social branches ───────────────────────────────────────────
const STRING = `(['"])((?:\\\\.|(?!\\1)[\\s\\S])*)\\1`;

for (const file of SOCIAL_BRANCH_SOURCES) {
	if (!fs.existsSync(file)) continue;
	const source = dropProperNouns(fs.readFileSync(file, 'utf8'));

	// pick(normal, social) — the second argument is what social play shows
	for (const m of source.matchAll(new RegExp(`pick\\(\\s*${STRING}\\s*,\\s*${STRING}\\s*,?\\s*\\)`, 'g'))) {
		const hits = m[4].match(pattern);
		if (hits) report(file, 'social branch of pick()', m[4], hits);
	}

	// social ? 'social text' : … — the true branch is the social one
	for (const m of source.matchAll(new RegExp(`social(?:\\(\\))?\\s*\\?\\s*${STRING}`, 'g'))) {
		const hits = m[2].match(pattern);
		if (hits) report(file, 'social branch of ternary', m[2], hits);
	}
}

// ── rule 4: plain string literals in the bet-mode table ──────────────────────
//
// Rules 2 and 3 only look at pick(…) and `social ? …` shapes. betModeMeta.ts was
// listed in SOCIAL_BRANCH_SOURCES from the start and contained neither, because
// every string in it was a hardcoded English literal — so there was nothing for
// those rules to inspect and this script reported a clean pass on a file that
// was entirely violations. Certification found "Buy direct entry", "50× BET",
// "BUY 50×" and "PLACE YOUR BET" in it.
//
// A probe has to be able to see its target. Here that means judging every string
// literal in the file, not only the ones already wearing a social branch.
{
	const file = path.join(appRoot, 'src/game/betModeMeta.ts');
	if (fs.existsSync(file)) {
		const source = dropProperNouns(
			fs
				.readFileSync(file, 'utf8')
				.replace(/\/\/[^\n]*/g, '')
				.replace(/\/\*[\s\S]*?\*\//g, ''),
		);
		// Only the `text: { … }` blocks. The rest of the table is machine-facing —
		// `type: 'buy'` is the shared library's mode discriminator, and flagging it
		// would put three permanent false positives in front of every build. A
		// guard that cries wolf is a guard that gets ignored.
		for (const block of source.matchAll(/\btext:\s*\{([\s\S]*?)\n\t*\}/g)) {
			// Template literals here are the fixed part of a t.* interpolation, so
			// the ${…} placeholders are dropped before matching — `${t.buyUpper} 50×`
			// must not be reported for the word its term happens to resolve to.
			for (const m of block[1].matchAll(/(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g)) {
				const text = m[2].replace(/\$\{[^}]*\}/g, ' ');
				const hits = text.match(pattern);
				if (hits) report(file, 'hardcoded string in bet-mode table', text, hits);
			}
		}
	}
}

// ── rule 5: prose string literals inside a component's <script> ──────────────
//
// Rule 1 strips <script> before looking at a .svelte file, because that block is
// full of identifiers and class names rather than copy. That was true until the
// rules page grew a controls guide built as an array of objects — player-facing
// sentences living entirely in the script, invisible to every rule here.
// Certification found "pay table" in one of them.
//
// Only literals containing whitespace are considered. Copy has spaces in it;
// the identifiers this block is otherwise full of ('payTable', 'wp-paytable',
// 'gameRules') do not, so the filter separates prose from code without needing a
// list of exceptions.
const PROSE_SCRIPT_SOURCES = [
	path.join(appRoot, 'src/components/ui/ModalGameRules.svelte'),
	path.join(appRoot, 'src/components/ui/ModalPayTable.svelte'),
	path.join(appRoot, 'src/components/ui/IntroFeatures.svelte'),
];

for (const file of PROSE_SCRIPT_SOURCES) {
	if (!fs.existsSync(file)) continue;
	const scripts = fs.readFileSync(file, 'utf8').match(/<script[\s\S]*?<\/script>/g) || [];
	for (const block of scripts) {
		const source = dropProperNouns(
			block.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''),
		);
		for (const m of source.matchAll(/(['"`])((?:\\.|(?!\1)[\s\S])*)\1/g)) {
			const text = m[2].replace(/\$\{[^}]*\}/g, ' ');
			if (!/\s/.test(text)) continue;
			const hits = text.match(pattern);
			if (hits) report(file, 'prose string in component script', text, hits);
		}
	}
}

console.log(
	problems === 0
		? 'OK: no restricted words in social-facing copy'
		: `${problems} restricted-word problem(s) found`,
);
process.exit(problems === 0 ? 0 : 1);
