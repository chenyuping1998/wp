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

const registry = fs.readFileSync(path.join(srcRoot, 'game/assets.ts'), 'utf8');
// Registry entries are `keyName: {` at the top level of the exported maps.
const known = new Set([...registry.matchAll(/^\s{1,2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{/gm)].map((m) => m[1]));

const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return entry.name.endsWith('.svelte') ? [full] : [];
	});

const problems = [];
for (const file of walk(srcRoot)) {
	const source = fs.readFileSync(file, 'utf8');
	for (const match of source.matchAll(/\bkey="([A-Za-z][A-Za-z0-9_]*)"/g)) {
		if (!known.has(match[1])) {
			const line = source.slice(0, match.index).split('\n').length;
			problems.push(`${path.relative(appRoot, file)}:${line}  key="${match[1]}"`);
		}
	}
}

if (problems.length > 0) {
	console.error(`FAIL: ${problems.length} sprite key(s) are not in the asset registry:`);
	for (const problem of problems) console.error(`  ${problem}`);
	process.exit(1);
}

console.log(`OK: every static sprite key resolves (${known.size} registry entries)`);
