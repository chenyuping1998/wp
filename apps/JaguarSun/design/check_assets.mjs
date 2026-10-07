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

console.log(
	missing === 0
		? `OK: all ${checked} asset paths resolve`
		: `${missing} of ${checked} asset path(s) missing`,
);
process.exit(missing === 0 ? 0 : 1);
