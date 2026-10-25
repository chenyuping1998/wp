// Every asset('...') in src/ must resolve to a
// real file. Vite does NOT fail the build for a missing one - it leaves the URL
// to be resolved at runtime, so the game builds green and then 404s on load.
// This runs as a build gate to catch that.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsFile = path.join(appRoot, 'src/game/assets.ts');
const staticAssets = path.join(appRoot, 'static/assets');

const collect = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
 const file = path.join(dir, entry.name);
 return entry.isDirectory() ? collect(file) : /\.(ts|svelte)$/.test(file) ? [file] : [];
});
const source = collect(path.join(appRoot, 'src')).map(file => fs.readFileSync(file, 'utf8')).join('\n');
const refs = [...source.matchAll(/asset\('([^']+)'\)/g)].map((m) => m[1]);
const unique = [...new Set(refs)];
if (!unique.length) throw new Error('No static asset references found');

const missing = unique.filter((ref) => !fs.existsSync(path.join(staticAssets, ref)));

if (missing.length > 0) {
	console.error(`FAIL: ${missing.length} of ${unique.length} asset references do not exist:`);
	for (const ref of missing) console.error(`  static/assets/${ref}`);
	process.exit(1);
}

console.log(`OK: all ${unique.length} asset references resolve`);
