// Gate: the settled board must move, a little, and never as one block.
//
// Everything else in this game animates a MOMENT — a win, a landing, a tease, a
// Neon Frame. The state a player spends most time looking at is a board with
// nothing happening on it, and until 2026-08-21 that state was twenty still
// PNGs. Stake's review gave a sibling game in this repo exactly that diagnosis
// ("nothing moving on a settled board, which is what a player looks at most of
// the time"), and the fix that closed it was about 1% of scale, phase-offset per
// cell.
//
// Both halves of that are checkable, and both fail in opposite directions:
//
//   too big     an idle board that visibly pumps is worse than a still one; it
//               reads as the symbols being alive rather than the game being calm
//   too small   below about half a percent nothing is on screen at all
//   in unison   the failure this gate exists for. Twenty cells sharing a phase
//               is one object inflating, which is what "the grid pulses as one
//               block" means — and it is invisible in a screenshot, because a
//               screenshot of a synchronised board looks exactly like a
//               screenshot of a desynchronised one
//
// Usage: node design/check_idle_breathe.mjs [--report]
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { IDLE_AMPLITUDE, IDLE_PERIOD_MS, idlePhase, idleScale, VISIBLE_ROWS, VISIBLE_REELS } = await import(
	path.join(appRoot, 'src/game/idleBreathe.ts')
);

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

// The board this game actually draws — the VISIBLE rows. The reel strip carries
// a hidden padding row above and below, and `symbolIndex` counts those, so the
// visible grid is rows 1..4 of it.
const REELS = VISIBLE_REELS;
const ROWS = VISIBLE_ROWS;
const FIRST_VISIBLE_ROW = 1;
const TWO_PI = Math.PI * 2;

// ── 1. subtle, but present ───────────────────────────────────────────────────
if (IDLE_AMPLITUDE < 0.004) fail(`idle amplitude ${IDLE_AMPLITUDE} is below 0.4% — nothing would be visible`);
if (IDLE_AMPLITUDE > 0.02) fail(`idle amplitude ${IDLE_AMPLITUDE} is above 2% — an idle board would visibly pump`);
if (IDLE_PERIOD_MS < 1200) fail(`idle period ${IDLE_PERIOD_MS}ms is a flicker, not a breath`);
if (IDLE_PERIOD_MS > 5000) fail(`idle period ${IDLE_PERIOD_MS}ms is slow enough to read as drift`);

// ── 2. the shape is what it claims to be ─────────────────────────────────────
const samples = 240;
let peak = 0;
for (let i = 0; i <= samples; i++) {
	const value = idleScale((i / samples) * IDLE_PERIOD_MS, 0);
	peak = Math.max(peak, Math.abs(value - 1));
}
if (Math.abs(peak - IDLE_AMPLITUDE) > IDLE_AMPLITUDE * 0.05) {
	fail(`idleScale peaks at ${peak.toFixed(4)} but IDLE_AMPLITUDE says ${IDLE_AMPLITUDE}`);
}
// a breath returns: the mean over one period must sit on rest
const mean = Array.from({ length: samples }, (_, i) => idleScale((i / samples) * IDLE_PERIOD_MS, 1.1)).reduce((a, b) => a + b, 0) / samples;
if (Math.abs(mean - 1) > 0.001) fail(`idleScale averages ${mean.toFixed(4)} over a period — the board would sit permanently off its resting size`);

// ── 3. never in unison ───────────────────────────────────────────────────────
const cells = [];
for (let reel = 0; reel < REELS; reel++) {
	for (let row = 0; row < ROWS; row++) {
		cells.push({ reel, row, phase: idlePhase(reel, row + FIRST_VISIBLE_ROW) });
	}
}
for (const cell of cells) {
	if (!(cell.phase >= 0 && cell.phase < TWO_PI)) fail(`cell ${cell.reel},${cell.row} has phase ${cell.phase}, outside 0..2π`);
}

// neighbours (including diagonals) must be clearly out of step with each other
// Radians. The most a 5×4 board can achieve is about 0.63 (see idleBreathe.ts —
// the assignment was searched for it), so this sits below that on purpose: the
// check is here to catch cells breathing TOGETHER, not to pin the layout to the
// exact optimum and fail on any future adjustment.
const MIN_NEIGHBOUR_GAP = 0.5;
for (const a of cells) {
	for (const b of cells) {
		if (a === b) continue;
		const adjacent = Math.abs(a.reel - b.reel) <= 1 && Math.abs(a.row - b.row) <= 1;
		if (!adjacent) continue;
		const raw = Math.abs(a.phase - b.phase) % TWO_PI;
		const gap = Math.min(raw, TWO_PI - raw);
		if (gap < MIN_NEIGHBOUR_GAP) {
			fail(`cells ${a.reel},${a.row} and ${b.reel},${b.row} are neighbours ${gap.toFixed(2)} rad apart — they breathe together`);
		}
	}
}

// and the whole board must cover the circle: a big empty arc means the cells are
// bunched into a couple of groups, which is a block pulse with extra steps
const sorted = [...cells.map((c) => c.phase)].sort((a, b) => a - b);
let widestGap = TWO_PI - sorted[sorted.length - 1] + sorted[0];
for (let i = 1; i < sorted.length; i++) widestGap = Math.max(widestGap, sorted[i] - sorted[i - 1]);
if (widestGap > Math.PI / 2) {
	fail(`the board's phases leave a ${widestGap.toFixed(2)} rad gap — the cells are bunched, so they still pulse in groups`);
}

if (process.argv.includes('--report')) {
	console.log(`\n  amplitude ${(IDLE_AMPLITUDE * 100).toFixed(1)}% of size, period ${IDLE_PERIOD_MS}ms`);
	console.log('  phase by cell (radians), reels left to right:');
	for (let row = 0; row < ROWS; row++) {
		console.log('    ' + Array.from({ length: REELS }, (_, reel) => idlePhase(reel, row + FIRST_VISIBLE_ROW).toFixed(2).padStart(6)).join(''));
	}
	console.log(`  widest gap around the circle: ${widestGap.toFixed(2)} rad (limit ${(Math.PI / 2).toFixed(2)})`);
}

console.log(
	problems.length === 0
		? `OK: idle breath ${(IDLE_AMPLITUDE * 100).toFixed(1)}% over ${IDLE_PERIOD_MS}ms, ${cells.length} cells all out of phase`
		: `${problems.length} idle-breath problem(s) found`,
);
process.exit(problems.length === 0 ? 0 : 1);
