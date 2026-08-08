// Every asset path in src/game/assets.ts must exist in the build output.
// A missing one 404s at load time and — because the preloader waits on the
// whole batch — can leave the game stuck on the loading screen.
// Usage: node design/check_assets.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(appRoot, 'src/game/assets.ts'), 'utf8');

let missing = 0;
let checked = 0;

// new URL('../../assets/…', import.meta.url) is resolved at RUNTIME against the
// served bundle URL (_app/immutable/…), so it lands on /assets/… — i.e. static/.
// It is not a build-time import, which is exactly why a typo here fails as a
// silent 404 instead of breaking the build.
for (const m of source.matchAll(/new URL\(\s*['"`]([^'"`]+)['"`]\s*,\s*import\.meta\.url/g)) {
	checked++;
	const rel = m[1].replace(/^(?:\.\.\/)+/, '');
	if (fs.existsSync(path.join(appRoot, 'static', rel))) continue;
	console.log(`  !! missing: ${m[1]}  →  static/${rel}`);
	missing++;
}

for (const m of source.matchAll(/src:\s*['"`](\/[^'"`\s]+)['"`]/g)) {
	checked++;
	if (fs.existsSync(path.join(appRoot, 'static', m[1].replace(/^\//, '')))) continue;
	console.log(`  !! missing (static): ${m[1]}`);
	missing++;
}

// ── the bespoke sound files, which assets.ts knows nothing about ────────────
//
// Sound.svelte plays most of the game's effects from its own WAVs rather than
// from the sprite in assets.ts, and it builds the URL by concatenation:
//
//     new Audio(`${base}/assets/audio/${CN_SFX_FILES[name]}`)
//
// so the directory name only ever appears as a bare `yard/…` fragment. When the
// game was renamed, a search-and-replace for `assets/audio/forge` matched every
// occurrence EXCEPT these — and every custom sound in the game 404'd. Nothing
// caught it: the build passed, this script passed, and a 404 on an Audio element
// is silent by design. Checking the fragments closes the hole.
const soundSource = fs.readFileSync(
	path.join(appRoot, 'src/components/Sound.svelte'),
	'utf8',
);
const audioMap = soundSource.match(/const CN_SFX_FILES[^=]*=\s*\{([\s\S]*?)\n\t\};/);
if (!audioMap) {
	console.log('  !! could not find CN_SFX_FILES in Sound.svelte — has it been renamed?');
	missing++;
} else {
	for (const m of audioMap[1].matchAll(/['"`]([^'"`]+\.(?:wav|mp3|ogg|m4a))['"`]/g)) {
		checked++;
		if (fs.existsSync(path.join(appRoot, 'static/assets/audio', m[1]))) continue;
		console.log(`  !! missing (audio): ${m[1]}  →  static/assets/audio/${m[1]}`);
		missing++;
	}
}

// ── the fonts, which are declared in app.html and nowhere else ─────────────
//
// Same failure shape as the sound files above: a @font-face whose src 404s does
// not throw, it silently falls back — and the fallback is a system sans, which
// is the one thing certification has already flagged on this codebase once.
const appHtml = fs.readFileSync(path.join(appRoot, 'src/app.html'), 'utf8');
for (const m of appHtml.matchAll(/%sveltekit\.assets%\/([^'"\s)]+\.(?:ttf|otf|woff2?))/g)) {
	checked++;
	if (fs.existsSync(path.join(appRoot, 'static', m[1]))) continue;
	console.log(`  !! missing (font): ${m[1]}  →  static/${m[1]}`);
	missing++;
}

console.log(
	missing === 0
		? `OK: all ${checked} asset paths resolve`
		: `${missing} of ${checked} asset path(s) missing`,
);
process.exit(missing === 0 ? 0 : 1);
