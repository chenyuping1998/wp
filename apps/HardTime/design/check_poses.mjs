// Gate: every pose must be on screen long enough to be SEEN.
//
// The pose sheets are the most expensive art this game has commissioned — three
// separate drawings of one character, and four attempts to get them — so the way
// they fail is not "they were not drawn" but "they were drawn and then flashed
// past". A pose held for 30ms is a pose the player never saw, and it costs
// exactly as much as one held for 300ms.
//
// The number below comes from the animation literature this plan is built on:
// limited animation reads as a POSE at around 4 frames on twos, which is ~130ms
// at 60fps. Under that the eye integrates it into the frames either side and the
// drawing is spent for nothing.
//
// Also checked: the beat has to be a beat. wind is the load, peak is the picture
// the player is meant to remember, settle is the return — if peak is not the
// longest of the three, the money drawing is not the one on screen.
//
// Usage: node design/check_poses.mjs [--report]
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { POSE_PLAN, poseAt, poseDurations, smearAt, SMEAR_MS } = await import(
	path.join(appRoot, 'src/game/posePlan.ts')
);
const { HOLD_MS } = await import(path.join(appRoot, 'src/game/symbolWinMotion.ts'));

const REPORT = process.argv.includes('--report');
const problems = [];
const fail = (m) => problems.push(m);

const MIN_VISIBLE_MS = 130;

const held = poseDurations(HOLD_MS);
for (const pose of ['wind', 'peak', 'settle']) {
	if (held[pose] < MIN_VISIBLE_MS) {
		fail(
			`${pose} is on screen for ${held[pose].toFixed(0)}ms (floor ${MIN_VISIBLE_MS}). ` +
				`Below about four frames on twos the eye integrates it into its neighbours and the drawing is spent for nothing.`,
		);
	}
}
if (!(held.peak > held.wind && held.peak > held.settle)) {
	fail(
		`peak (${held.peak.toFixed(0)}ms) is not the longest pose — wind ${held.wind.toFixed(0)}ms, ` +
			`settle ${held.settle.toFixed(0)}ms. peak carries the expression; it has to be the one that lingers.`,
	);
}

// The plan must cover the hold with no gap and no overlap, or a frame falls
// through to whatever poseAt's fallback is and the symbol blinks back to rest
// mid-beat.
let cursor = 0;
for (const step of POSE_PLAN) {
	if (Math.abs(step.from - cursor) > 1e-9) {
		fail(`the plan jumps from ${cursor} to ${step.from} — a gap or an overlap between poses`);
	}
	cursor = step.to;
}
if (Math.abs(cursor - 1) > 1e-9) fail(`the plan ends at ${cursor} of the hold, not 1`);

// It must END at rest. Board.svelte flips a paying cell to its static art when
// the hold expires; if the last frame of the win is a different drawing from the
// first frame of the static board, that swap reads as a glitch.
if (poseAt(HOLD_MS - 1, HOLD_MS) !== 'rest') {
	fail('the hold does not end on `rest` — the cut back to the static board will show two different drawings');
}

// The smear exists to be caught in motion. It has to fire ON a pose change and
// be gone before the next frame pair.
for (const step of POSE_PLAN.slice(1)) {
	const at = step.from * HOLD_MS;
	if (!(smearAt(at, HOLD_MS) > 0.9)) fail(`no smear at the ${step.pose} change (${at.toFixed(0)}ms)`);
	if (smearAt(at + SMEAR_MS + 1, HOLD_MS) !== 0) fail(`the smear at ${step.pose} outlives ${SMEAR_MS}ms`);
}

if (REPORT) {
	console.log(`hold ${HOLD_MS}ms\n`);
	for (const step of POSE_PLAN) {
		const ms = (step.to - step.from) * HOLD_MS;
		console.log(
			`  ${step.pose.padEnd(7)} ${(step.from * HOLD_MS).toFixed(0).padStart(4)}ms → ` +
				`${(step.to * HOLD_MS).toFixed(0).padStart(4)}ms   ${ms.toFixed(0).padStart(4)}ms on screen`,
		);
	}
	console.log('');
}

if (problems.length) {
	console.error('check_poses FAILED');
	for (const p of problems) console.error('  - ' + p);
	process.exit(1);
}
console.log('check_poses ok');
