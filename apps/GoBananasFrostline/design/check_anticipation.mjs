// Gate: the scatter tease must actually escalate.
//
// `Anticipation.svelte` makes three claims in its comments:
//
//   · the full tier (trigger already banked) is brighter than the low tier
//     (two scatters, could still trigger)
//   · the pulse gets FASTER at each reel to the right
//   · the low tier pulses slower than the full tier at every reel
//   · the beam travels the column and repeats
//
// The second one is in here because it was false in this very game until the
// stop-rhythm port: the period was `145 + reelIndex * 11`, so every reel pulsed
// SLOWER than the one before it and the tension drained away exactly as the
// payoff approached. Nobody noticed, because a claim in a comment is not checked
// by anything.
//
// So the numbers live in `src/game/anticipationFocus.ts` as pure functions and
// this asserts the properties. Ported from apps/HotMiami, minus its symbolFocus
// section — Frostline has not wired per-symbol lift into the tease, and a gate
// that checks a function nothing calls is theatre.
//
// Usage: node design/check_anticipation.mjs [--report]
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// pathToFileURL, not the bare path: on Windows an absolute path starts with a
// drive letter and node's ESM loader reads `E:` as an unsupported URL scheme.
// (apps/HotMiami's copy of this script still imports the bare path and throws
// here — worth fixing there too.)
const { isFullTier, tierIntensity, pulseRateMs, beamAt } = await import(
	pathToFileURL(path.join(appRoot, 'src/game/anticipationFocus.ts')).href
);

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

const REELS = [0, 1, 2, 3, 4];
// Magnitudes as this game emits them AFTER the gate: 2 = three scatters down
// (one away), 3 = four down (banked, spinning for the five-scatter tier). These
// are not Hot Miami's 1 and 2 — see anticipationFocus.isFullTier.
const LOW = 2;
const FULL = 3;

// ── tiers are what they say they are ─────────────────────────────────────────
if (isFullTier(LOW)) fail('magnitude 2 (three scatters, one away) is being treated as the full tier');
if (!isFullTier(FULL)) fail('magnitude 3 (trigger banked) is not the full tier');
// A missing magnitude must not silently downgrade a real tease.
if (!isFullTier(undefined))
	fail('a missing magnitude downgrades the tease instead of defaulting to full');

// ── the full tier is brighter ────────────────────────────────────────────────
if (!(tierIntensity(FULL) > tierIntensity(LOW))) {
	fail(
		`full tier is not brighter than the low tier (${tierIntensity(FULL)} vs ${tierIntensity(LOW)})`,
	);
}
for (const [label, magnitude] of [
	['low', LOW],
	['full', FULL],
]) {
	const i = tierIntensity(magnitude);
	if (!(i > 0 && i <= 1)) fail(`${label} tier intensity ${i} is outside 0-1`);
}

// ── tension rises to the right, and the low tier is always the calmer one ────
for (const reel of REELS) {
	if (reel > 0 && !(pulseRateMs(reel, FULL) < pulseRateMs(reel - 1, FULL))) {
		fail(
			`reel ${reel} pulses no faster than reel ${reel - 1} (${pulseRateMs(reel, FULL)}ms vs ${pulseRateMs(reel - 1, FULL)}ms) — tension falls away as the payoff approaches`,
		);
	}
	if (!(pulseRateMs(reel, LOW) > pulseRateMs(reel, FULL))) {
		fail(`reel ${reel}: the low tier does not pulse slower than the full tier`);
	}
	// A period under ~60ms is a strobe, not a pulse, and is an accessibility
	// problem as much as a taste one.
	if (pulseRateMs(reel, FULL) < 60) {
		fail(`reel ${reel} pulses every ${pulseRateMs(reel, FULL)}ms, which is a strobe`);
	}
}

// ── the beam travels, repeats, and stays inside the board ───────────────────
const sample = (magnitude) => {
	const rows = [];
	for (let t = 0; t <= 2000; t += 10) rows.push({ t, ...beamAt(t, magnitude) });
	return rows;
};
const wrapCount = (rows) => rows.filter((r, i) => i > 0 && r.y < rows[i - 1].y).length;
for (const [label, magnitude] of [
	['low', LOW],
	['full', FULL],
]) {
	const rows = sample(magnitude);
	const ys = rows.map((r) => r.y);
	if (Math.min(...ys) < 0 || Math.max(...ys) > 1)
		fail(`${label} beam leaves the board (y ${Math.min(...ys)}..${Math.max(...ys)})`);
	if (Math.max(...ys) - Math.min(...ys) < 0.8) fail(`${label} beam does not travel the column`);
	// it must come back: a beam that runs once and stops is a transition, not a tease
	if (wrapCount(rows) < 1) fail(`${label} beam never repeats within 2s`);
	const peak = Math.max(...rows.map((r) => r.alpha));
	if (peak < 0.15) fail(`${label} beam peaks at alpha ${peak.toFixed(2)} — it would not be visible`);
	if (peak > 0.8)
		fail(`${label} beam peaks at alpha ${peak.toFixed(2)}, which washes out the symbols under it`);
	// and it must fade at the rails rather than popping out of existence
	if (rows[0].alpha > 0.05) fail(`${label} beam appears at full strength at the top rail`);
	if (rows.some((r) => r.height <= 0)) fail(`${label} beam has non-positive height`);
}
if (!(wrapCount(sample(FULL)) > wrapCount(sample(LOW)))) {
	fail('the full tier beam does not travel more often than the low tier beam');
}

if (process.argv.includes('--report')) {
	console.log('\n  pulse period (ms, smaller = more urgent):');
	console.log('    reel:  ' + REELS.map((r) => String(r).padStart(6)).join(''));
	console.log('    full:  ' + REELS.map((r) => pulseRateMs(r, FULL).toFixed(0).padStart(6)).join(''));
	console.log('    low:   ' + REELS.map((r) => pulseRateMs(r, LOW).toFixed(0).padStart(6)).join(''));
	console.log(
		`  tier intensity: low ${tierIntensity(LOW)} · full ${tierIntensity(FULL)}`,
	);
	console.log(
		`  beam peak alpha: low ${Math.max(...sample(LOW).map((r) => r.alpha)).toFixed(2)} · full ${Math.max(...sample(FULL).map((r) => r.alpha)).toFixed(2)}`,
	);
	console.log(`  beam repeats in 2s: low ${wrapCount(sample(LOW))} · full ${wrapCount(sample(FULL))}`);
}

console.log(
	problems.length === 0
		? 'OK: anticipation escalates (tier, reel, beam)'
		: `${problems.length} anticipation problem(s) found`,
);
process.exit(problems.length === 0 ? 0 : 1);
