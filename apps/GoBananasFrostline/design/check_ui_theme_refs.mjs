// Gate: every sprite/icon name in uiTheme.ts must be a registered asset key.
//
// THE MISS THIS CATCHES IS SILENT, which is the whole reason it exists.
//
// `uiTheme.sprites` and `uiTheme.icons` map SLOT NAMES to ASSET KEYS, and
// components resolve them through that map. Hand one a name that is not in
// assets.ts and nothing throws: UiSprite falls back to drawing its default
// rounded rectangle, and UiButton falls back to a text/emoji glyph. On the buy
// bonus that fallback is rendered with blendMode 'add', so a typo arrives on
// screen as a pale glowing box around the whole button — which is what Go
// Bananubis shipped once, and the comment it left behind ("A SLOT NAME, NOT AN
// ASSET KEY") is the only thing standing between the next game and the same
// afternoon.
//
// `check_assets.mjs` does not cover this: it verifies that the PATHS in
// assets.ts resolve on disk, not that anything referring to a key has spelled it
// right. The two checks are disjoint.
//
// Deliberately a text scan rather than an import: uiTheme.ts calls setUiTheme at
// module scope and reads localStorage, so loading it in node would mean standing
// up a fake DOM to learn something a regex already knows.
//
// Usage: node design/check_ui_theme_refs.mjs [--report]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = fs.readFileSync(path.join(APP, 'src/game/assets.ts'), 'utf8');
const theme = fs.readFileSync(path.join(APP, 'src/game/uiTheme.ts'), 'utf8');

// top-level keys of the assets object: `\tsomeKey: {`
const registered = new Set([...assets.matchAll(/^\t([A-Za-z0-9_]+): \{/gm)].map((m) => m[1]));

// Only the sprites/icons blocks, so an unrelated string in a comment is not
// mistaken for a reference. Both are object literals of `slot: 'assetKey',`.
const blocks = [...theme.matchAll(/\b(sprites|icons):\s*\{([^}]*)\}/g)];
if (blocks.length === 0) {
	console.log('  !! found no sprites/icons blocks in uiTheme.ts — has it been restructured?');
	process.exit(1);
}

const problems = [];
const seen = [];
for (const [, kind, body] of blocks) {
	for (const [, slot, key] of body.matchAll(/([A-Za-z0-9_]+):\s*'([^']+)'/g)) {
		seen.push({ kind, slot, key });
		if (!registered.has(key)) {
			problems.push(`uiTheme.${kind}.${slot} -> '${key}' is not a key in assets.ts`);
		}
	}
}

for (const p of problems) console.log(`  !! ${p}`);

if (process.argv.includes('--report')) {
	for (const { kind, slot, key } of seen) {
		console.log(`  ${kind}.${slot.padEnd(14)} ${key}`);
	}
}

console.log(
	problems.length === 0
		? `OK: all ${seen.length} uiTheme sprite/icon references resolve`
		: `${problems.length} unresolved uiTheme reference(s)`,
);
process.exit(problems.length === 0 ? 0 : 1);
