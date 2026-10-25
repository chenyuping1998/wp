// Run design/check_parts.py as part of the build.
//
// Why a wrapper: the check is Python (it measures PNGs with PIL) and the build
// is a chain of node scripts. Calling `python3` directly from package.json would
// make the build fail differently, and silently, on a machine where python3 is
// not the interpreter that has PIL.
//
// Why it is in the build at all: on 2026-08-26 an art drop replaced all twelve
// symbols. Every one of the ten build gates passed, and the game was broken —
// the parts rig is cut from the old art, so each symbol would have visibly
// turned into a different drawing the moment it landed. check_parts.py caught it
// immediately, but only because someone thought to run it by hand. A check that
// only runs when you remember it is not a check.
//
// If no interpreter has PIL this FAILS the build rather than skipping. A gate
// that quietly does nothing is worse than no gate: it reports OK.
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(appRoot, 'design/check_parts.py');

const candidates = [
	process.env.HOTMIAMI_PYTHON,
	'python3',
	'/Applications/anaconda3/bin/python',
	'/Applications/anaconda3/envs/math-sdk/bin/python',
].filter(Boolean);

let interpreter = null;
for (const candidate of candidates) {
	const probe = spawnSync(candidate, ['-c', 'import PIL'], { stdio: 'ignore' });
	if (probe.status === 0) {
		interpreter = candidate;
		break;
	}
}

if (!interpreter) {
	console.error('FAIL: check_parts needs a Python with Pillow and none of these had it:');
	for (const candidate of candidates) console.error(`  - ${candidate}`);
	console.error('Install it (pip install pillow) or point HOTMIAMI_PYTHON at one that has it.');
	process.exit(1);
}

// Only the verdict, not the per-part table: the build prints one line per gate
// and this one has thirty. `--report` on the command line gets the detail back.
const run = spawnSync(interpreter, [script, ...process.argv.slice(2)], { encoding: 'utf8' });
const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
if (run.status !== 0) {
	process.stdout.write(output);
	process.exit(run.status ?? 1);
}
const verdict = output.trim().split('\n').filter((line) => /^(OK|!!)/.test(line.trim()));
console.log(verdict.length ? verdict.join('\n') : output.trim());
