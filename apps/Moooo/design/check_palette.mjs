// Moooo's UI palette must not be a sibling game's palette.
//
// It was. All 22 colour values in src/game/uiTheme.ts were byte-equal to
// apps/HotMiami/src/game/uiTheme.ts — zero unique — so a dusk county fair was
// played through a magenta-and-cyan neon bar for weeks. Nothing caught it:
//
//   · the build has no opinion about hex constants
//   · check_provenance.mjs hashes ASSET FILES, not source
//   · every screenshot review looked at the board, where the art IS this game's
//
// The rule is not "no shared colour" — greys, near-blacks and pure white are
// nobody's, and two games can legitimately land on the same warm gold. The rule
// is about WHOLESALE reuse: if most of the palette matches one sibling exactly,
// the file was copied rather than designed.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appsRoot = path.resolve(appRoot, '..');
// uiTheme.ts is where the bet bar's colours live, but it is not the only place
// this went wrong: the intro card — the FIRST screen a player sees — carried the
// same borrowed palette in plain CSS, in a different notation, and would have
// passed a gate that only read the theme file.
const SOURCES = ['src/game/uiTheme.ts', 'src/components/ui'];

if (!fs.existsSync(path.join(appRoot, 'src/game/uiTheme.ts'))) {
	console.log('OK: (skipped) src/game/uiTheme.ts does not exist yet — nothing to check');
	process.exit(0);
}

// Colours no game owns: neutrals, and anything within a hair of black or white.
const isNeutral = (hex) => {
	const r = parseInt(hex.slice(2, 4), 16);
	const g = parseInt(hex.slice(4, 6), 16);
	const b = parseInt(hex.slice(6, 8), 16);
	const spread = Math.max(r, g, b) - Math.min(r, g, b);
	return spread < 24 || Math.max(r, g, b) < 24 || Math.min(r, g, b) > 232;
};

// Three notations, because the app uses all three: `0xrrggbb` in the pixi theme,
// `#rrggbb` in component CSS, and `rgb()/rgba()` in gradients. Normalised to
// 0xrrggbb so a colour written two ways still counts as one colour.
const readColours = (source) => {
	const text = fs.readFileSync(source, 'utf8');
	const out = [];
	for (const m of text.matchAll(/0x([0-9a-fA-F]{6})\b/g)) out.push(m[1].toLowerCase());
	for (const m of text.matchAll(/#([0-9a-fA-F]{6})\b/g)) out.push(m[1].toLowerCase());
	for (const m of text.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
		out.push(
			[m[1], m[2], m[3]]
				.map((n) => Number(n).toString(16).padStart(2, '0'))
				.join(''),
		);
	}
	return out;
};

const filesUnder = (target) => {
	if (!fs.existsSync(target)) return [];
	if (fs.statSync(target).isFile()) return [target];
	return fs
		.readdirSync(target, { withFileTypes: true })
		.flatMap((entry) => filesUnder(path.join(target, entry.name)))
		.filter((file) => /\.(svelte|ts)$/.test(file));
};

const palette = (root) => {
	const colours = SOURCES.flatMap((source) =>
		filesUnder(path.join(root, source)).flatMap(readColours),
	);
	return new Set(colours.map((hex) => `0x${hex}`).filter((hex) => !isNeutral(hex)));
};

// ── Signature colours ────────────────────────────────────────────────────────
//
// The percentage test above compares PALETTES and is deliberately loose, because
// two games can land on the same warm gold. These are different: each one is a
// hue no fair uses, each was found in this game's own source, and each was there
// because a file was copied rather than designed. They are banned outright,
// anywhere under src/ — a single occurrence fails.
//
// Comments are exempt: several of these appear in notes recording where the
// colour used to be and why it went, and that record is worth more than the
// tidiness of never naming it.
const BANNED = {
	'0xff2e88': "Hot Miami magenta",
	'0xff8ede': "Hot Miami pink",
	'0x00e5ff': "Hot Miami cyan",
	'0x8a3ffc': "Hot Miami violet",
	'0x2ee6a8': "Hot Miami mint",
	'0x66f6ff': "Hot Miami cyan (symbol tint)",
	'0xb08cff': "Hot Miami violet (symbol tint)",
	'0xff3b8b': "Hot Miami pink (symbol tint)",
	'0xff8cf0': "Hot Miami pink (fx tint)",
	'0x4dffa6': "Hot Miami mint (fx tint)",
	'0x2b0a2e': "Hot Miami plum (text stroke)",
	'0x4de8e0': "Hot Miami cyan (card corner)",
	'0x1e290e': "GoBananas olive",
	'0x8fbf4a': "GoBananas lime",
};

const stripComments = (source) =>
	source
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(^|[^:"'`\\])\/\/[^\n]*/gm, '$1');

const banned = [];
for (const file of filesUnder(path.join(appRoot, 'src'))) {
	const text = stripComments(fs.readFileSync(file, 'utf8'));
	text.split('\n').forEach((line, index) => {
		for (const [hex, who] of Object.entries(BANNED)) {
			const bare = hex.slice(2);
			if (!line.includes(hex) && !line.includes(`#${bare}`)) continue;
			banned.push(
				`${path.relative(appRoot, file)}:${index + 1}  ${hex} — ${who}`,
			);
		}
	});
}

if (banned.length > 0) {
	console.error(`FAIL: ${banned.length} sibling-game signature colour(s) in src/:`);
	for (const problem of banned) console.error(`  ${problem}`);
	process.exit(1);
}

const mine = palette(appRoot);
if (mine.size === 0) {
	console.log('OK: no non-neutral colours declared');
	process.exit(0);
}

// Above this share of an identical match, the file was not designed for this
// game. Two independently themed games overlapping on two thirds of a palette
// by coincidence is not a thing that happens.
const LIMIT = 0.6;

const problems = [];
for (const entry of fs.readdirSync(appsRoot, { withFileTypes: true })) {
	if (!entry.isDirectory() || entry.name === 'Moooo') continue;
	const siblingRoot = path.join(appsRoot, entry.name);
	if (!fs.existsSync(path.join(siblingRoot, 'src/game/uiTheme.ts'))) continue;
	const theirs = palette(siblingRoot);
	if (theirs.size === 0) continue;
	const shared = [...mine].filter((hex) => theirs.has(hex));
	const share = shared.length / mine.size;
	const pct = Math.round(share * 100);
	if (share > LIMIT) {
		problems.push(
			`${entry.name}: ${shared.length}/${mine.size} colours identical (${pct}%) — ${shared.slice(0, 6).join(' ')}${shared.length > 6 ? ' …' : ''}`,
		);
	} else {
		console.log(`   vs ${entry.name}: ${shared.length}/${mine.size} shared (${pct}%)`);
	}
}

if (problems.length > 0) {
	console.error('FAIL: the UI palette is a sibling game\'s palette:');
	for (const problem of problems) console.error(`  ${problem}`);
	console.error('  These are source constants — no asset gate can see them.');
	process.exit(1);
}

console.log(`OK: UI palette is this game's own (${mine.size} non-neutral colours)`);
