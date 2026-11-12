// Every `new URL('../../assets/...')` in the asset registry must resolve to a
// real file. Vite does NOT fail the build for a missing one - it leaves the URL
// to be resolved at runtime, so the game builds green and then 404s on load.
// This runs as a build gate to catch that.
//
// The registry is src/game/assets.ts plus every map it spreads in
// (assetsHud.ts, assetsScene.ts, ...): all src/game/assets*.ts files are read.
// It used to read assets.ts alone, so the HUD and scene paths were never
// checked (2026-11-11).
//
// Also checked: literal `/assets/<path>.<ext>` strings anywhere else under src/
// (DOM panels reference a few files directly, e.g. the rules page's turbo
// icon). A path assembled from a variable cannot be checked here; keep such
// paths literal.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gameDir = path.join(appRoot, 'src/game');
const srcDir = path.join(appRoot, 'src');
const staticAssets = path.join(appRoot, 'static/assets');

const registryFiles = fs
	.readdirSync(gameDir)
	.filter((name) => /^assets.*\.ts$/.test(name))
	.map((name) => path.join(gameDir, name));

const refs = new Map(); // ref -> first file that names it
for (const file of registryFiles) {
	const source = fs.readFileSync(file, 'utf8');
	for (const m of source.matchAll(/assets\/([A-Za-z0-9_/.\-]+)/g)) {
		if (!refs.has(m[1])) refs.set(m[1], path.relative(appRoot, file));
	}
}

// literal paths with a file extension elsewhere in src/
const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === 'vendor' ? [] : walk(full);
		return /\.(svelte|ts)$/.test(entry.name) && !registryFiles.includes(full) ? [full] : [];
	});
for (const file of walk(srcDir)) {
	const source = fs.readFileSync(file, 'utf8');
	for (const m of source.matchAll(/\/assets\/((?:sprites|audio|castSpine43|spines)\/[A-Za-z0-9_/.\-]+\.(?:png|jpg|jpeg|webp|svg|json|atlas|m4a|wav|mp3|ogg))/g)) {
		if (!refs.has(m[1])) refs.set(m[1], path.relative(appRoot, file));
	}
}

const missing = [...refs.entries()].filter(([ref]) => !fs.existsSync(path.join(staticAssets, ref)));

if (missing.length > 0) {
	console.error(`FAIL: ${missing.length} of ${refs.size} asset references do not exist:`);
	for (const [ref, file] of missing) console.error(`  static/assets/${ref}   (${file})`);
	process.exit(1);
}

console.log(`OK: all ${refs.size} asset references resolve (${registryFiles.length} registry files + literal paths in src/)`);
