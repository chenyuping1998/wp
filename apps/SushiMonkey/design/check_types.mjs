// Type-check guard.
//
// `vite build` does not type-check. An undefined identifier is a legal free
// variable to the bundler, so it compiles happily and explodes at runtime — and
// check_undefined_refs.mjs is explicitly blind to identifiers used inside
// <script>. That hole is what this closes, and this game has fallen through it
// twice already:
//
//   · an asset declared `type: 'spritesheet'` instead of 'spriteSheet'. Unknown
//     type -> never loaded -> upgradeConfig(config, undefined) threw inside an
//     effect -> Svelte aborted the flush and the game froze mid free game.
//   · every rotate keyframe written as `angle` instead of `value`. Spine 4.x
//     silently reads no rotation at all, so the whole animation set played with
//     the character standing still.
//
// Both builds were green. TypeScript would have rejected the first outright.
//
// It gates on the count not INCREASING rather than on zero: the app inherited
// errors from the scaffold it was copied from, and most are in Storybook sample
// data that is going to be deleted rather than fixed. Ratchet the numbers down
// as they are fixed; delete entries whose files are gone.
//
// PER FILE, not per total. A total-only gate reads "at baseline" when a fixed
// error in one file is replaced by a new one somewhere else, and offsetting
// changes are the normal case during a refactor.
//
// Never raise a number here to make a red build pass. If a count went up, you
// broke something.
//
// Usage: node design/check_types.mjs
import fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// file → known error count, as svelte-check prints the path.
const BASELINE = {
	// The five Storybook entries that used to head this list are gone with
	// src/stories — gen-1 sample data never updated to this game's book events,
	// carrying 21 of the 46 errors this project inherited. Deleted at the copy
	// rather than carried into a fourth generation.
	// third-party / workspace packages, not this game's to fix
	'node_modules\\utils-xstate\\node_modules\\rgs-requests\\node_modules\\rgs-fetcher\\src\\rgsFetcher.ts': 5,
	'node_modules\\utils-slots\\src\\createReelForCascading.svelte.ts': 1,
	'node_modules\\components-ui-html\\node_modules\\envs\\src\\envs.svelte.ts': 1,
	// deprecated pixi v7 Graphics/TextStyle API — see the 85 remaining uses
	'src\\components\\GoldText.svelte': 3,
	'src\\components\\Win.svelte': 2,
	'src\\components\\FreeSpinIntro.svelte': 2,
	'src\\components\\ui\\ModalPayTable.svelte': 1,
	'src\\components\\SymbolSpineMain.svelte': 1,
	'src\\components\\PressToContinue.svelte': 1,
	'src\\components\\FreeSpinOutro.svelte': 1,
	'src\\components\\FreeSpinCounter.svelte': 1,
	// the padding-reel board literals are typed as { name: string }[][]
	'src\\game\\bookEventHandlerMap.ts': 2,
	'src\\game\\actor.ts': 1,
	'src\\i18n\\messagesMap\\index.ts': 3,
};

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(appRoot, 'node_modules/.bin/svelte-check');

let out = '';
try {
	out = execFileSync(bin, ['--threshold', 'error', '--output', 'machine'], {
		cwd: appRoot,
		encoding: 'utf8',
		shell: true,
	});
} catch (err) {
	// svelte-check exits non-zero whenever it found errors, which is the normal
	// case while any baseline entry is above 0. The output is still on stdout.
	out = (err.stdout || '') + (err.stderr || '');
}

// The catch above cannot tell "found errors" from "could not run", and the two
// look identical downstream: no ERROR lines parse out of either, so the script
// went on to report "OK: 0 type errors" for a checker that had crashed with
// MODULE_NOT_FOUND. A gate that passes when it fails to run is worse than no
// gate — it is a gate that lies.
//
// svelte-check's machine output always ends with a COMPLETED line, whatever it
// found. Its absence means the run did not happen.
if (!/^\d+ COMPLETED/m.test(out)) {
	console.error('svelte-check did not run to completion — this is NOT a clean type check.');
	console.error(`  binary: ${bin}`);
	if (!fs.existsSync(bin)) {
		console.error('  the binary does not exist. Run `pnpm install` from the workspace root.');
	}
	const detail = out.trim().split('\n').slice(0, 12).join('\n');
	if (detail) console.error(`\n${detail}`);
	process.exit(1);
}

const actual = new Map();
for (const m of out.matchAll(/^\d+ ERROR "([^"]*)"/gm)) {
	// The machine format escapes backslashes; unescape so the keys above can be
	// written the way the human format prints them.
	// Baseline keys were written on Windows; normalise to that spelling so the
	// gate works on macOS too (it used to count every file as new there).
	const file = m[1].replace(/\\\\/g, '\\').replace(/\//g, '\\');
	actual.set(file, (actual.get(file) ?? 0) + 1);
}

const regressions = [];
const improvements = [];

for (const [file, count] of actual) {
	const allowed = BASELINE[file] ?? 0;
	if (count > allowed) regressions.push({ file, count, allowed });
}
for (const [file, allowed] of Object.entries(BASELINE)) {
	const count = actual.get(file) ?? 0;
	if (count < allowed) improvements.push({ file, count, allowed });
}

if (regressions.length > 0) {
	console.error(`check_types: ${regressions.length} file(s) above their baseline`);
	for (const { file, count, allowed } of regressions.sort((a, b) => b.count - a.count)) {
		console.error(`   ${allowed} -> ${count}  ${file}`);
	}
	console.error('   Run: node_modules/.bin/svelte-check --threshold error');
	process.exit(1);
}

const total = [...actual.values()].reduce((a, b) => a + b, 0);
if (improvements.length > 0) {
	console.log(`OK: ${total} type errors, ${improvements.length} file(s) now below baseline:`);
	for (const { file, count, allowed } of improvements) {
		console.log(`     ${allowed} -> ${count}  ${file}   (lower BASELINE)`);
	}
} else {
	console.log(`OK: ${total} type errors, every file at its baseline`);
}
