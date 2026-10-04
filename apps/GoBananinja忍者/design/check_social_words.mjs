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
	paytable: 'play table',
	// THE OTHER FORMS OF THE SAME WORDS (2026-10-04). The match is whole-word, so
	// the table above never saw "buys": Boat's rules said "what a dearer round
	// buys is more crates" in both modes and certification flagged it with this
	// guard green. Every restricted verb/noun needs its inflections listed.
	buys: 'plays',
	buying: 'playing',
	purchases: 'plays',
	purchased: 'played',
	purchasing: 'playing',
	costs: 'totals',
	costing: 'totalling',
	paying: 'winning',
	payouts: 'wins',
	bettor: 'player',
	stakes: 'play amounts',
	staked: 'played',
	wagers: 'plays',
	wagered: 'played',
	wagering: 'playing',
	gambling: 'playing',
	deposits: 'get coins',
	withdrawal: 'redemption',
	credits: 'balance',
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
// BACKTICKS COUNT. The quote class was ['"] only, so every pick() whose
// arguments were template literals matched nothing and was skipped in silence
// — and those are the longest strings in the game, the feature dialogs, because
// they interpolate spin counts out of the maths config. 8 of this game's 23
// pick() calls went unchecked while the gate reported a clean pass.
const STRING = `(['"\`])((?:\\\\.|(?!\\1)[\\s\\S])*)\\1`;

// A ${…} expression is code, not copy. Its identifiers are full of the very
// words being looked for — config.betModes, mode.cost — and none of them reach
// the screen. Stripped at any depth before the text is tested.
const stripInterpolations = (text) => {
	let out = '';
	for (let i = 0; i < text.length; i++) {
		if (text[i] !== '$' || text[i + 1] !== '{') {
			out += text[i];
			continue;
		}
		let depth = 0;
		for (let j = i + 1; j < text.length; j++) {
			if (text[j] === '{') depth++;
			else if (text[j] === '}' && --depth === 0) {
				i = j;
				break;
			}
		}
	}
	return out;
};

for (const file of SOCIAL_BRANCH_SOURCES) {
	if (!fs.existsSync(file)) continue;
	const source = dropProperNouns(fs.readFileSync(file, 'utf8'));

	// pick(normal, social) — the second argument is what social play shows
	for (const m of source.matchAll(new RegExp(`pick\\(\\s*${STRING}\\s*,\\s*${STRING}\\s*,?\\s*\\)`, 'g'))) {
		const social = stripInterpolations(m[4]);
		const hits = social.match(pattern);
		if (hits) report(file, 'social branch of pick()', social, hits);
	}

	// social ? 'social text' : … — the true branch is the social one
	for (const m of source.matchAll(new RegExp(`social(?:\\(\\))?\\s*\\?\\s*${STRING}`, 'g'))) {
		const social = stripInterpolations(m[2]);
		const hits = social.match(pattern);
		if (hits) report(file, 'social branch of ternary', social, hits);
	}
}

console.log(
	problems === 0
		? 'OK: no restricted words in social-facing copy'
		: `${problems} restricted-word problem(s) found`,
);
process.exit(problems === 0 ? 0 : 1);
