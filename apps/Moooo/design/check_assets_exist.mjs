// Every `new URL('../../assets/...')` in src/game/assets.ts must resolve to a
// real file. Vite does NOT fail the build for a missing one - it leaves the URL
// to be resolved at runtime, so the game builds green and then 404s on load.
// This runs as a build gate to catch that.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticAssets = path.join(appRoot, 'static/assets');

const SRC_ROOT_FOR_GUARD = path.join(appRoot, 'src');

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

// src/ exists but the registry does not: that is a real broken state, not a
// not-yet state, so it fails rather than skipping.
if (!fs.existsSync(path.join(appRoot, 'src/game/assets.ts'))) {
	console.error('FAIL: src/ exists but src/game/assets.ts is missing');
	process.exit(1);
}

// The registry is not the only place the app names a file.
//
// This used to read src/game/assets.ts alone, and two 404s got through: the
// intro card builds its image paths as template strings
// (`${base}/assets/sprites/…`) rather than going through the registry at all, so
// a renamed symbol and a missing tile both shipped with every gate green and
// only showed up as a broken image in the browser. Anything in src/ that spells
// out an assets path is a reference, wherever it lives.
const walk = (dir) =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return /\.(ts|js|svelte|html|css)$/.test(entry.name) ? [full] : [];
	});

const sources = walk(path.join(appRoot, 'src'));
const refs = sources.flatMap((file) =>
	[...fs.readFileSync(file, 'utf8').matchAll(/assets\/([A-Za-z0-9_/.\-]+\.[A-Za-z0-9]+)/g)].map((m) => m[1]),
);
// Two-part paths, resolved.
//
// The intro card does not write a whole path anywhere. It declares a prefix
//     const BRAND = `${base}/assets/sprites/mooooBrand`;
// and then uses `${BRAND}/tile_foreground.png`, so NEITHER line contains a
// complete reference and scanning for literals finds nothing. That is how a
// missing tile and a renamed symbol both shipped green. Binding the two together
// is what actually closes it — verified by deleting the file and watching this
// fail, which the literal-only version did not.
const prefixes = new Map();
for (const file of sources) {
	const text = fs.readFileSync(file, 'utf8');
	for (const m of text.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*`[^`]*?assets\/([A-Za-z0-9_/.\-]+)`/g)) {
		prefixes.set(m[1], m[2].replace(/\/$/, ''));
	}
}
for (const file of sources) {
	const text = fs.readFileSync(file, 'utf8');
	for (const m of text.matchAll(/\$\{([A-Za-z_$][\w$]*)\}\/([A-Za-z0-9_.\-]+\.[A-Za-z0-9]+)/g)) {
		const prefix = prefixes.get(m[1]);
		if (prefix) refs.push(`${prefix}/${m[2]}`);
	}
}

// Fully interpolated names (`${SYMBOLS}/${icon}.png`) still cannot be resolved —
// the value comes from data — so this is a floor, not a proof.
const unique = [...new Set(refs)].filter((ref) => !ref.includes('$'));

const missing = unique.filter((ref) => !fs.existsSync(path.join(staticAssets, ref)));

if (missing.length > 0) {
	console.error(`FAIL: ${missing.length} of ${unique.length} asset references do not exist:`);
	for (const ref of missing) console.error(`  static/assets/${ref}`);
	process.exit(1);
}

console.log(`OK: all ${unique.length} asset references resolve`);
