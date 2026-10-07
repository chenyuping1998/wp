// Gate: the scatter tease must actually escalate.
//
// `Anticipation.svelte` makes four claims in its comments:
//
//   · the full tier (trigger already banked) is brighter and closer than the low
//     tier (two scatters, could still trigger)
//   · the pulse gets FASTER at each reel to the right
//   · the low tier pulses slower than the full tier at every reel
//   · the beam travels the column and repeats
//
// The second one is in there because it was once false in the shipped game: the
// period was `145 + reelIndex * 11`, so every reel pulsed SLOWER than the one
// before it and the tension drained away exactly as the payoff approached.
// Nobody noticed, because a claim in a comment is not checked by anything.
//
// So the numbers live in `src/game/anticipationFocus.ts` as pure functions and
// this asserts the properties. Same argument as check_symbol_motion.mjs: what a
// comment asserts, a script should be able to prove.
//
// Usage: node design/check_anticipation.mjs [--report]
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { isFullTier, tierIntensity, pulseRateMs, symbolFocus, beamAt } = await import(
	path.join(appRoot, 'src/game/anticipationFocus.ts')
);

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

const REELS = [0, 1, 2, 3, 4];
const LOW = 1;
const FULL = 2;

// ── tiers are what they say they are ─────────────────────────────────────────
if (isFullTier(LOW)) fail('magnitude 1 (two scatters) is being treated as the full tier');
if (!isFullTier(FULL)) fail('magnitude 2 (trigger banked) is not the full tier');
// A missing magnitude must not silently downgrade a real tease — Anticipations
// passes `stateGame.anticipation[reel] ?? 1`, but other callers may omit it.
if (!isFullTier(undefined)) fail('a missing magnitude downgrades the tease instead of defaulting to full');

// ── the full tier is brighter and closer ─────────────────────────────────────
if (!(tierIntensity(FULL) > tierIntensity(LOW))) {
	fail(`full tier is not brighter than the low tier (${tierIntensity(FULL)} vs ${tierIntensity(LOW)})`);
}
const focusLow = symbolFocus(LOW);
const focusFull = symbolFocus(FULL);
if (!(focusFull.scale > focusLow.scale) || !(focusFull.bloom > focusLow.bloom)) {
	fail('the full tier does not lift its symbols further than the low tier');
}
// Above ~1.1 the symbols start clipping into the neighbouring column, which
// reads as a bug rather than as emphasis.
for (const [label, f] of [['low', focusLow], ['full', focusFull]]) {
	if (f.scale <= 1) fail(`${label} tier does not lift its symbols at all (scale ${f.scale})`);
	if (f.scale > 1.1) fail(`${label} tier scales symbols to ${f.scale}, which clips the neighbouring reel`);
	if (f.bloom < 0 || f.bloom > 0.6) fail(`${label} tier bloom ${f.bloom} is outside 0-0.6`);
}

// ── tension rises to the right, and the low tier is always the calmer one ────
for (const reel of REELS) {
	if (reel > 0 && !(pulseRateMs(reel, FULL) < pulseRateMs(reel - 1, FULL))) {
		fail(`reel ${reel} pulses no faster than reel ${reel - 1} (${pulseRateMs(reel, FULL)}ms vs ${pulseRateMs(reel - 1, FULL)}ms) — tension falls away as the payoff approaches`);
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
for (const [label, magnitude] of [['low', LOW], ['full', FULL]]) {
	const rows = sample(magnitude);
	const ys = rows.map((r) => r.y);
	if (Math.min(...ys) < 0 || Math.max(...ys) > 1) fail(`${label} beam leaves the board (y ${Math.min(...ys)}..${Math.max(...ys)})`);
	if (Math.max(...ys) - Math.min(...ys) < 0.8) fail(`${label} beam does not travel the column`);
	// it must come back: a beam that runs once and stops is a transition, not a tease
	const wraps = rows.filter((r, i) => i > 0 && r.y < rows[i - 1].y).length;
	if (wraps < 1) fail(`${label} beam never repeats within 2s`);
	const peak = Math.max(...rows.map((r) => r.alpha));
	if (peak < 0.15) fail(`${label} beam peaks at alpha ${peak.toFixed(2)} — it would not be visible`);
	if (peak > 0.8) fail(`${label} beam peaks at alpha ${peak.toFixed(2)}, which washes out the symbols under it`);
	// and it must fade at the rails rather than popping out of existence
	if (rows[0].alpha > 0.05) fail(`${label} beam appears at full strength at the top rail`);
	if (rows.some((r) => r.height <= 0)) fail(`${label} beam has non-positive height`);
}
const fullPeriodFaster =
	sample(FULL).filter((r, i) => i > 0 && r.y < sample(FULL)[i - 1].y).length >
	sample(LOW).filter((r, i) => i > 0 && r.y < sample(LOW)[i - 1].y).length;
if (!fullPeriodFaster) fail('the full tier beam does not travel more often than the low tier beam');

if (process.argv.includes('--report')) {
	console.log('\n  pulse period (ms, smaller = more urgent):');
	console.log('    reel:  ' + REELS.map((r) => String(r).padStart(6)).join(''));
	console.log('    full:  ' + REELS.map((r) => pulseRateMs(r, FULL).toFixed(0).padStart(6)).join(''));
	console.log('    low:   ' + REELS.map((r) => pulseRateMs(r, LOW).toFixed(0).padStart(6)).join(''));
	console.log(`  symbol lift: low ×${focusLow.scale} bloom ${focusLow.bloom} · full ×${focusFull.scale} bloom ${focusFull.bloom}`);
	console.log(`  beam peak alpha: low ${Math.max(...sample(LOW).map((r) => r.alpha)).toFixed(2)} · full ${Math.max(...sample(FULL).map((r) => r.alpha)).toFixed(2)}`);
}

console.log(problems.length === 0 ? 'OK: anticipation escalates (tier, reel, beam)' : `${problems.length} anticipation problem(s) found`);
process.exit(problems.length === 0 ? 0 : 1);
