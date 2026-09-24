// Player-facing copy must not name another game's theme.
//
// This gate exists because the pay table and the rules panel — the two screens a
// player opens specifically to find out what they are playing — described HOT
// MIAMI. A rosette was labelled "Neon Diamond", a hay bale "Boombox", the free
// games were called "Neon Nights" and "Ocean Drive", and there was a row for a
// "Collector" this game has never had, while the Milk Churn that drives the
// entire free game had no row at all. Every other gate passed the whole time:
// the words were valid TypeScript, the assets all resolved, and nothing in the
// build has an opinion about whether a label matches its picture.
//
// It also catches the failure that hides behind it. ReplayIntro keyed its mode
// labels on BONUS_HITS / BONUS_EPIC — Hot Miami's bet-mode keys. Moooo's are
// BONUS / SUPER, so the lookup missed and the panel printed the raw key.
//
// WHAT IS SCANNED: all of src/. It was scoped to src/components/ui/ until
// 2026-08-27, and that is exactly how LoadingScreen.svelte kept its seven
// loading tips — the FIRST words a player reads about this game — describing
// Neon Frames, the Collector, and Neon Nights / Sunset Hits / Ocean Drive. One
// directory up from where the gate was looking.
//
// Source comments are stripped first, on purpose: the code is full of
// legitimate references to how the sibling games solved something, and several
// of those notes are the record of a bug being fixed. A gate that cannot tell an
// explanation from a label would be switched off within a week.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(appRoot, 'src');

if (!fs.existsSync(srcRoot)) {
	console.log('OK: (skipped) wp/apps/Moooo/src does not exist yet — nothing to check');
	process.exit(0);
}

// Vocabulary owned by the sibling games in this monorepo. Each entry is a word
// that could only appear in Moooo's player-facing copy by having been carried
// over — none of them describe anything at a county fair.
const FOREIGN = [
	// Hot Miami
	'neon',
	'collector',
	'flamingo',
	'boombox',
	'convertible',
	'art-deco',
	'neon nights',
	'sunset hits',
	'ocean drive',
	'miami',
	// GoBananas
	'banana',
	'gorilla',
	'jungle',
	// WildParty
	'wild party',
	'wildparty',
	// ── mechanics no version of this game has ───────────────────────────────
	// Not vocabulary so much as evidence: a name for a mechanic that does not
	// exist here got in by being copied, and the code behind it is either dead or
	// pointed at the wrong thing. All four were found on 2026-08-27 —
	// `tumble_win_1..4` and `sfx_fs_respins` declared and never used, `jng_` the
	// jungle prefix on the free-spin intro, and `SUPERSPIN` gating a whole
	// hold'n'spin counter that could never render.
	'tumble',
	'respins',
	'jng_',
	'superspin',
	// ── CSS class and custom-property prefixes ──────────────────────────────
	// `hm-` (Hot Miami), `wp-` (WildParty) and `gb-` (GoBananas) were the class
	// prefixes on every panel this game inherited — 184 occurrences across the
	// intro card, both modals and the loader, plus three CSS custom properties in
	// game/fonts.ts. A player never reads a class name, but a prefix is the most
	// literal possible statement of which game a file came from, and it is what
	// made the borrowed copy inside those files easy to keep missing.
	'hm-',
	'wp-',
	'gb-',
];

// Everything under src/. Machinery is scanned too — a `flavour="neon"` prop or a
// `const NEON` palette is not read by a player, but it is how the copy got
// wrong in the first place, and renaming it is cheap.
const PLAYER_FACING = (file) => /\.(svelte|ts)$/.test(file);

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return [full];
	});

// Comments only. Strings are left alone — a label is a string, and that is the
// whole point of the gate.
const stripComments = (source) =>
	source
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1');

// Substring matching is not good enough. `reelPreSpinSpeed` lowercases to
// `...prespinspeed`, which CONTAINS "respins", and three spin-timing constants
// were reported as Hot Miami leftovers on the first run. Underscore counts as a
// boundary here (`_` is a word character to \\b, so \\b would break `jng_`), and a
// term ending in `_` is treated as a prefix so `jng_intro_fs` still matches.
const MATCHERS = FOREIGN.map((word) => {
	const body = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// A term ending in `_` or `-` is a PREFIX and must still match what follows
	// it: `jng_intro_fs`, `hm-title-font`. Without this the trailing boundary
	// silently made all four prefix entries unmatchable, which a negative test
	// caught — the gate reported OK on a file that still said `--hm-title-font`.
	const tail = /[_-]$/.test(word) ? '' : '(?![a-z0-9])';
	return { word, re: new RegExp(`(?<![a-z0-9])${body}${tail}`) };
});

const problems = [];
for (const file of walk(srcRoot)) {
	const rel = file.replace(`${appRoot}/`, '');
	if (!PLAYER_FACING(rel)) continue;
	const stripped = fs.readFileSync(file, 'utf8');
	const lines = stripComments(stripped).split('\n');
	lines.forEach((line, index) => {
		const haystack = line.toLowerCase();
		for (const pattern of MATCHERS) {
			if (!pattern.re.test(haystack)) continue;
			problems.push(`${rel}:${index + 1}  "${pattern.word}" in ${line.trim().slice(0, 90)}`);
		}
	});
}

if (problems.length > 0) {
	console.error(`FAIL: ${problems.length} sibling-game word(s) in player-facing copy:`);
	for (const problem of problems) console.error(`  ${problem}`);
	process.exit(1);
}

console.log(`OK: no sibling-game vocabulary in player-facing copy (${FOREIGN.length} words checked)`);
