#!/usr/bin/env node
/**
 * UI palette gate.
 *
 * The bet bar's colours and the info panels' colours are the two surfaces where
 * a reskin leaks: they are written as bare hex literals, they build green with
 * any value at all, and nobody looks at the Settings panel while play-testing.
 * Turf War shipped with Capo Nostra's mint win accent (0x2ee6a8) in its bar for
 * exactly that reason, and its Replay card was still on Capo's mahogany after
 * every symbol had been redrawn.
 *
 * So: every colour literal in the theme and in the modal family must be one of
 * ART_BRIEF.md §0's swatches, an achromatic, or a value on the small explicit
 * exception list below. Comments are stripped first — they quote hexes to
 * explain what was replaced, and a gate that cannot tell code from prose is a
 * gate people delete.
 *
 * Run: node design/check_ui_palette.mjs [--report]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ART_BRIEF.md §0. Keep this table and that one in step.
const PALETTE = {
	'0e0f11': 'ink / deepest',
	'17191c': 'panel ground',
	'3a3d42': 'concrete mid',
	'5b5f66': 'concrete lit',
	'9c5a22': 'sodium dark',
	f5893d: 'sodium main',
	ffc38a: 'sodium highlight',
	d9d6ce: 'bone white',
	'2a343e': 'iron blue dark',
	'465562': 'iron blue',
	e0338a: 'graffiti magenta',
	'2ec4c6': 'graffiti cyan',
	'9bd437': 'graffiti acid green',
};

// Achromatics. Pure black and white are not swatches but are legitimate for
// shadows, strokes and the alpha ramps rgba() is built from.
const ACHROMATIC = new Set(['000000', 'ffffff', '000', 'fff']);

// The neutral platform-chrome skin (uiTheme.ts, `skin === 'hacksaw'`) is
// deliberately NOT this game's palette — that is the entire point of it, and it
// is the documented revert path. Its greys are listed rather than exempted by
// file, so a Turf-War-palette mistake inside that block is still caught.
const PLATFORM_CHROME = new Set([
	'2a2a2a',
	'0f0f0f',
	'14171a',
	'8e9499',
	'3a3a3a',
	'6b7278',
	'565e66',
	'343a40',
	'bfbfbf',
	'7d848a',
	'bdbdbd',
]);

// Reserved: the one saturated red in the game, and only for The Bruiser.
// Anywhere in the UI chrome it is a defect, not a shade.
const RESERVED_RED = 'b22222';

const FILES = [
	'src/game/uiTheme.ts',
	'src/game/fonts.ts',
	...readdirSync(join(ROOT, 'src/components/ui'))
		.filter((name) => name.endsWith('.svelte'))
		.map((name) => `src/components/ui/${name}`),
];

// Strip // line comments, /* */ blocks and <!-- --> so quoted hexes in prose do
// not trip the gate. Crude but adequate: these are style blocks and a const
// table, not string-heavy code, and a URL's "//" only costs one line of scan.
const stripComments = (text) =>
	text
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/^\s*\/\/.*$/gm, '');

const failures = [];
const seen = new Map();

for (const file of FILES) {
	const lines = stripComments(readFileSync(join(ROOT, file), 'utf8')).split('\n');
	lines.forEach((line, index) => {
		for (const match of line.matchAll(/(?:#|0x)([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
			const hex = match[1].toLowerCase();
			const where = `${file}:${index + 1}`;
			if (hex === RESERVED_RED) {
				failures.push(`${where}  ${match[0]} — #B22222 is reserved for The Bruiser (§0 rule 3)`);
				continue;
			}
			if (hex in PALETTE || ACHROMATIC.has(hex) || PLATFORM_CHROME.has(hex)) {
				seen.set(hex, (seen.get(hex) ?? 0) + 1);
				continue;
			}
			failures.push(`${where}  ${match[0]} — not in ART_BRIEF.md §0`);
		}
	});
}

if (process.argv.includes('--report')) {
	for (const [hex, count] of [...seen].sort((a, b) => b[1] - a[1])) {
		console.log(`  ${count.toString().padStart(3)}  #${hex}  ${PALETTE[hex] ?? 'platform/achromatic'}`);
	}
}

if (failures.length) {
	console.error('UI palette leak:\n' + failures.map((line) => `  ${line}`).join('\n'));
	process.exit(1);
}

console.log(`OK: ${FILES.length} UI files, ${seen.size} distinct colours, all in ART_BRIEF.md §0`);
