// Every `new URL('../../assets/...')` in src/game/assets.ts must resolve to a
// real file. Vite does NOT fail the build for a missing one - it leaves the URL
// to be resolved at runtime, so the game builds green and then 404s on load.
// This runs as a build gate to catch that.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsFile = path.join(appRoot, 'src/game/assets.ts');
const staticAssets = path.join(appRoot, 'static/assets');

const source = fs.readFileSync(assetsFile, 'utf8');
const refs = [...source.matchAll(/assets\/([A-Za-z0-9_/.\-]+)/g)].map((m) => m[1]);
const unique = [...new Set(refs)];

const missing = unique.filter((ref) => !fs.existsSync(path.join(staticAssets, ref)));

if (missing.length > 0) {
	console.error(`FAIL: ${missing.length} of ${unique.length} asset references do not exist:`);
	for (const ref of missing) console.error(`  static/assets/${ref}`);
	process.exit(1);
}

console.log(`OK: all ${unique.length} asset references resolve`);
