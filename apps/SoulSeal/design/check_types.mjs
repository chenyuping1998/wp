// Type-check guard.
//
// `vite build` does not type-check. An undefined identifier is a legal free
// variable to the bundler, so it compiles happily and explodes at runtime — and
// check_undefined_refs.mjs is explicitly blind to identifiers used inside
// <script>. That hole is what this closes.
//
// The app inherited type errors from the TripleWitching scaffold it was copied
// from. Fixing them all up front would be wasted work, because most of the
// offending code is being deleted anyway. So this gates on the count not
// INCREASING rather than on zero, and BASELINE is ratcheted down as the rewrite
// removes the old mechanics.
//
// PER FILE, not per total. A total-only gate reported "at baseline" during the
// collect rewrite while a deleted component's 2 errors were silently replaced by
// 2 NEW ones in ResumeBet and BoardFrame — both real regressions, both invisible
// because the sum happened to match. Offsetting changes are the normal case
// during a refactor, so the sum is the wrong thing to watch.
//
// Never raise a number here to make a red build pass. If a count went up, you
// broke something.

import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// file → known error count. Lower entries as they are fixed; delete entries
// whose files are gone. Paths as svelte-check prints them.
const BASELINE = {
	'src\\game\\stateGame.svelte.ts': 7,
	'node_modules\\utils-xstate\\node_modules\\rgs-requests\\node_modules\\rgs-fetcher\\src\\rgsFetcher.ts': 5,
	'src\\i18n\\messagesMap\\index.ts': 3,
	'src\\components\\GoldText.svelte': 0,
	'src\\components\\Anticipations.svelte': 3,
	'src\\components\\ui\\ModalPayTable.svelte': 1,
	'src\\components\\Win.svelte': 2,
	'src\\components\\ReelDust.svelte': 2,
	'src\\components\\FreeSpinIntro.svelte': 1,
	'src\\game\\actor.ts': 1,
	'src\\components\\SymbolSpineMain.svelte': 1,
	'src\\components\\ReelSymbol.svelte': 1,
	'src\\components\\PressToContinue.svelte': 1,
	'src\\components\\FreeSpinOutro.svelte': 1,
	'src\\components\\FreeSpinCounter.svelte': 0,
	'node_modules\\utils-slots\\src\\createReelForCascading.svelte.ts': 1,
	'node_modules\\components-ui-html\\node_modules\\envs\\src\\envs.svelte.ts': 1,
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

const actual = new Map();
for (const m of out.matchAll(/^\d+ ERROR "([^"]*)"/gm)) {
	// The machine format escapes backslashes; unescape so the keys above can be
	// written the way the human format prints them.
	const file = m[1].replace(/\\\\/g, '\\');
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
	console.error(`  !! ${regressions.length} file(s) above their baseline`);
	for (const { file, count, allowed } of regressions.sort((a, b) => b.count - a.count)) {
		console.error(`     ${allowed} -> ${count}  ${file}`);
	}
	console.error('  Run: pnpm exec svelte-check --threshold error');
	process.exit(1);
}

const total = [...actual.values()].reduce((a, b) => a + b, 0);
if (improvements.length > 0) {
	console.log(`OK: ${total} type errors, ${improvements.length} file(s) now below baseline:`);
	for (const { file, count, allowed } of improvements) {
		console.log(`     ${allowed} -> ${count}  ${file}   (update BASELINE)`);
	}
} else {
	console.log(`OK: ${total} type errors, every file at its baseline`);
}
