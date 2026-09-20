// Every `key="..."` on a <Sprite>/<SpineTrack> in src must name an entry in the
// asset registry (src/game/assets.ts). A key that does not exist fails only at
// runtime — pixi logs `key "x" is not found in the loadedAssets` and draws
// nothing — so the build stays green while the sprite is silently invisible.
//
// This caught `gbH2` (a GoBananas key) still keying the win-line runner, which
// meant every winning line animated with an invisible token.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(appRoot, 'src');

const SRC_ROOT_FOR_GUARD = srcRoot;

// `wp/apps/Moooo/` currently holds this design/ folder and nothing else — the
// app has not been scaffolded yet. The gate exists from day one on purpose (the
// Hot Miami post-mortem is that gates added late are gates added after the bug
// shipped), so until src/ appears it reports that plainly and passes. It starts
// checking the moment there is something to check.
const srcMissing = !fs.existsSync(SRC_ROOT_FOR_GUARD);
if (srcMissing) {
	console.log('OK: (skipped) wp/apps/Moooo/src does not exist yet — nothing to check');
	process.exit(0);
}

const registryPath = path.join(srcRoot, 'game/assets.ts');
if (!fs.existsSync(registryPath)) {
	console.error('FAIL: src/ exists but src/game/assets.ts is missing');
	process.exit(1);
}

const registry = fs.readFileSync(registryPath, 'utf8');
// Registry entries are `keyName: {` at the top level of the exported maps.
const known = new Set([...registry.matchAll(/^\s{1,2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{/gm)].map((m) => m[1]));

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return entry.name.endsWith('.svelte') || entry.name.endsWith('.ts') ? [full] : [];
	});

const problems = [];
for (const file of walk(srcRoot)) {
	const source = fs.readFileSync(file, 'utf8');
	// Three ways the code names an asset, and the first two used to be invisible
	// here. Renaming the audio bundle's key left `loadedAssets['sound']` behind:
	// the build was green, every gate passed, and the game died at boot reading
	// `.src` of undefined — because a bracket lookup is not a `key="…"` attribute
	// and nothing was looking at it. A gate that only sees one of three spellings
	// gives false confidence in exactly the situation it exists for.
	const patterns = [
		/\bkey="([A-Za-z][A-Za-z0-9_]*)"/g, // <Sprite key="…">
		/loadedAssets\[\s*'([A-Za-z][A-Za-z0-9_]*)'\s*\]/g, // loadedAssets['…']
	];
	// `key: '…'` names an asset only in the motion tables. Elsewhere in the app
	// `key` means something else entirely — betModeMeta.ts has `key: 'bonus'` for
	// a BET MODE — and scanning for it everywhere reported three confident
	// failures about assets that were never meant to exist. A gate that cries
	// wolf gets skimmed, so this one is scoped to the files where the idiom
	// actually means an asset.
	if (/Motion\.ts$/.test(file)) {
		patterns.push(/\bkey:\s*'([A-Za-z][A-Za-z0-9_]*)'/g);
	}
	// `key={cond ? 'a' : 'b'}` — an EXPRESSION key. This spelling was invisible
	// to the three patterns above, and that is how FxBurst.svelte kept keying
	// 'fxStar' / 'fxStreak' / 'fxLeaf' after the assets were renamed with the
	// `moooo` prefix: every gate passed, the build was green, and the console
	// filled with `key "fxStar" is not found in the loadedAssets` while every
	// particle in the game drew nothing.
	//
	// Literals on the right of a comparison are operands, not keys — the same
	// FxBurst line tests `props.flavour === 'neon'` — so those are dropped, or
	// the gate reports a confident failure about an asset named 'neon'.
	// Template literals are skipped: their key is not knowable statically, which
	// is what check_assets_exist.mjs's two-part path handling is for.
	for (const brace of source.matchAll(/\bkey=\{([^{}]*)\}/g)) {
		const expression = brace[1];
		if (expression.includes('`')) continue;
		const operands = new Set(
			[...expression.matchAll(/[=!]==?\s*'([A-Za-z][A-Za-z0-9_]*)'/g)].map((m) => m[1]),
		);
		for (const literal of expression.matchAll(/'([A-Za-z][A-Za-z0-9_]*)'/g)) {
			if (operands.has(literal[1])) continue;
			if (known.has(literal[1])) continue;
			const line = source.slice(0, brace.index).split('\n').length;
			problems.push(`${path.relative(appRoot, file)}:${line}  key={… '${literal[1]}' …}`);
		}
	}
	for (const pattern of patterns) {
		for (const match of source.matchAll(pattern)) {
			if (!known.has(match[1])) {
				const line = source.slice(0, match.index).split('\n').length;
				problems.push(`${path.relative(appRoot, file)}:${line}  ${match[0]}`);
			}
		}
	}
}

if (problems.length > 0) {
	console.error(`FAIL: ${problems.length} sprite key(s) are not in the asset registry:`);
	for (const problem of problems) console.error(`  ${problem}`);
	process.exit(1);
}

console.log(`OK: every static sprite key resolves (${known.size} registry entries)`);
