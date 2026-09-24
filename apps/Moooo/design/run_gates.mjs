// Run every Moooo gate in one go.
//
// Once wp/apps/Moooo is a real app this belongs in package.json as the `build`
// script, chained ahead of `vite build`, exactly as Hot Miami does it:
//
//   "build": "node design/check_undefined_refs.mjs && node design/check_assets_exist.mjs
//             && node design/check_sprite_keys.mjs && node design/check_social_words.mjs
//             && node design/check_theme_words.mjs && node design/check_provenance.mjs
//             && vite build"
//
// Until then this script is how they get run. The math bundle gate is NOT in
// that chain and is not in this script's exit code by default — it checks an
// upload bundle, not the source tree, so it belongs immediately before a copy
// to upload/, not before a frontend build. Pass a bundle path to include it.
//
// The math gate needs `zstandard`, which lives in the math-sdk environment and
// not in a bare `python3`. Point PYTHON at that interpreter rather than assuming
// a global install — this repo's SDK runs in a conda env, and hardcoding one
// machine's path here is how a gate stops running on somebody else's laptop.
//
// Usage:  node design/run_gates.mjs [pathToMathBundle]
//         PYTHON=/path/to/math-sdk/python node design/run_gates.mjs <bundle>
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = process.argv[2];

const gates = [
	['node', ['check_undefined_refs.mjs']],
	['node', ['check_assets_exist.mjs']],
	['node', ['check_sprite_keys.mjs']],
	['node', ['check_social_words.mjs']],
	['node', ['check_theme_words.mjs']],
	['node', ['check_palette.mjs']],
	['node', ['check_provenance.mjs']],
];
const python = process.env.PYTHON ?? 'python3';
// Both of these read the shipped MATH, so they only run when a bundle is given.
if (bundle) {
	// Resolved against the caller's cwd, which is what anyone typing a relative
	// path expects. Checked here because the gate's own report for a path that
	// does not exist is "index.json missing", which sends you looking for a
	// missing file instead of a mistyped directory.
	const resolved = path.resolve(bundle);
	if (!fs.existsSync(resolved)) {
		console.error(`FAIL: math bundle not found at ${resolved}`);
		process.exit(1);
	}
	gates.push([python, ['check_math_bundle.py', resolved]]);
	// The buy menu tells the player which buy is the calmer ride. That is a
	// statement about the distribution, and it silently stopped being the
	// interesting one the moment Super moved from 175x to 250x — so it is
	// verified against the tables rather than trusted.
	gates.push([python, ['check_volatility.py', resolved]]);
}

let failed = 0;
for (const [cmd, args] of gates) {
	console.log(`\n── ${args[0]}`);
	const result = spawnSync(cmd, args, { cwd: here, stdio: 'inherit' });
	if (result.status !== 0) failed++;
}

console.log(
	failed === 0
		? `\nAll ${gates.length} gates passed`
		: `\n${failed} of ${gates.length} gates FAILED`,
);
process.exit(failed === 0 ? 0 : 1);
