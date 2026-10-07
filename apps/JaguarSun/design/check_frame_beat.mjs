// Gate: the Neon Frame beats must escalate with the money, and must settle.
//
// The Frames are this game's headline mechanic and they carry 2x to 100x. Until
// 2026-08-19 every Frame arrived with ONE shared 260ms pop, so a fifty-fold
// difference in value looked identical in motion — the same fault three
// reviewers rejected the game for at the symbol layer ("poor animation": all
// twelve symbols moving identically), one layer up.
//
// `src/game/frameBeat.ts` holds the three tier entries, the sweep flight
// shaping and the Collector's tick as pure functions. This checks:
//
//   1. each tier's entry ends exactly at rest (a Frame left mid-flash or
//      mid-shiver snaps in one frame when the entry finishes)
//   2. the tiers escalate: bigger peak, brighter flash, longer beat
//   3. the three entries are genuinely different SHAPES, not one curve at three
//      amplitudes — measured the same way check_symbol_motion.mjs does it
//   4. transforms stay inside sane bounds
//   5. the sweep really fans out: neighbouring Frames in a sweep must not fly
//      the same path (the code claimed this in a comment while using one
//      constant arc for every Frame, which is exactly the sort of claim this
//      repo has been burned by)
//   6. the Collector's kick rises with the value it absorbs, and is capped
//
// Usage: node design/check_frame_beat.mjs [--report]
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { tierOf, ENTRY_MS, frameEntry, sweepFlight, collectorTick } = await import(
	path.join(appRoot, 'src/game/frameBeat.ts')
);

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

const TIERS = ['plain', 'premium', 'elite'];
const CHANNELS = ['scale', 'rotation', 'glow', 'flash', 'ring', 'ringAlpha'];
const SAMPLES = 60;

// ── tier split agrees with the styling in NeonFrames.svelte ─────────────────
for (const [mult, expected] of [[2, 'plain'], [9, 'plain'], [10, 'premium'], [24, 'premium'], [25, 'elite'], [100, 'elite']]) {
	if (tierOf(mult) !== expected) fail(`tierOf(${mult}) is ${tierOf(mult)}, expected ${expected}`);
}

// ── sample each tier over its own beat ──────────────────────────────────────
const traces = {};
for (const tier of TIERS) {
	const ms = ENTRY_MS[tier];
	traces[tier] = Array.from({ length: SAMPLES + 1 }, (_, i) => frameEntry((i / SAMPLES) * ms, tier));

	// ── 4. bounds ──
	traces[tier].forEach((f, i) => {
		const t = ((i / SAMPLES) * ms).toFixed(0);
		// -1e-9 rather than 0: two tiers grow from exactly nothing, and the
		// back-out polynomial lands a hair below zero there in floating point.
		if (!(f.scale >= -1e-6 && f.scale <= 2.2)) fail(`${tier} at t=${t}ms: scale ${f.scale.toFixed(2)} outside 0-2.2`);
		if (Math.abs(f.rotation) > 0.3) fail(`${tier} at t=${t}ms: rotation ${f.rotation.toFixed(2)} rad is a tumble`);
		for (const c of ['glow', 'flash', 'ringAlpha']) {
			if (f[c] < 0 || f[c] > 1) fail(`${tier} at t=${t}ms: ${c} ${f[c]} outside 0-1`);
		}
		if (f.ring < 0 || f.ring > 4) fail(`${tier} at t=${t}ms: ring ${f.ring} outside 0-4 cells`);
	});

	// ── 1. ends at rest ──
	for (const t of [ENTRY_MS[tier], ENTRY_MS[tier] * 1.3]) {
		const f = frameEntry(t, tier);
		const off = [
			['scale', f.scale - 1, 0.01],
			['rotation', f.rotation, 0.01],
			['glow', f.glow - 1, 0.02],
			['flash', f.flash, 0.02],
			['ringAlpha', f.ringAlpha, 0.02],
		].filter(([, v, limit]) => Math.abs(v) > limit);
		if (off.length) {
			fail(`${tier} has not settled at t=${Math.round(t)}ms: ` + off.map(([c, v]) => `${c}=${v.toFixed(3)}`).join(', '));
		}
	}
}

// ── 2. escalation ───────────────────────────────────────────────────────────
const peak = (tier, channel) => Math.max(...traces[tier].map((f) => Math.abs(f[channel])));
// How far past its resting size the Frame goes — NOT the distance from rest,
// which was the first version of this and measured the wrong thing: two of the
// three tiers grow from zero, so "distance from rest" was 1.00 for both of them
// and the escalation check compared spawn size instead of arrival weight.
const overshoot = (tier) => Math.max(...traces[tier].map((f) => f.scale)) - 1;
for (let i = 1; i < TIERS.length; i++) {
	const [low, high] = [TIERS[i - 1], TIERS[i]];
	if (!(ENTRY_MS[high] > ENTRY_MS[low])) fail(`${high} does not take longer than ${low} (${ENTRY_MS[high]}ms vs ${ENTRY_MS[low]}ms)`);
	if (!(overshoot(high) > overshoot(low))) fail(`${high} does not arrive harder than ${low} (overshoot ${overshoot(high).toFixed(2)} vs ${overshoot(low).toFixed(2)})`);
	if (!(peak(high, 'flash') > peak(low, 'flash'))) fail(`${high} does not flash harder than ${low}`);
	if (!(peak(high, 'ring') >= peak(low, 'ring'))) fail(`${high} throws a smaller ring than ${low}`);
}
// The cheapest Frame must stay quiet: Ocean Drive puts up to twenty on the grid
// at once, and twenty heavy arrivals is noise, not a moment.
if (overshoot('plain') > 0.12) fail(`plain overshoots by ${overshoot('plain').toFixed(2)} — twenty of these land at once`);
if (peak('plain', 'flash') > 0) fail('plain flashes; it is meant to be the quiet one');

// ── 3. different shapes, not one curve at three sizes ───────────────────────
//
// Same measurement as check_symbol_motion.mjs: z-score the channels against
// pooled statistics, centre and normalise each trace to unit length, and take
// the distance between the unit vectors. Amplitude is deliberately invisible to
// it — "the elite one is just bigger" must not be able to pass.
const rows = {};
for (const tier of TIERS) rows[tier] = traces[tier].map((f) => CHANNELS.map((c) => f[c]));
const mean = [], stdev = [];
for (let c = 0; c < CHANNELS.length; c++) {
	const values = TIERS.flatMap((t) => rows[t].map((r) => r[c]));
	const m = values.reduce((a, b) => a + b, 0) / values.length;
	mean.push(m);
	stdev.push(Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length) || 1);
}
const unit = (tier) => {
	const flat = [];
	for (let c = 0; c < CHANNELS.length; c++) {
		const column = rows[tier].map((r) => (r[c] - mean[c]) / stdev[c]);
		const m = column.reduce((a, b) => a + b, 0) / column.length;
		for (const v of column) flat.push(v - m);
	}
	const norm = Math.sqrt(flat.reduce((a, b) => a + b * b, 0)) || 1;
	return flat.map((v) => v / norm);
};
const MIN_PAIR_DISTANCE = 0.9;
const pairs = [];
for (let i = 0; i < TIERS.length; i++) {
	for (let j = i + 1; j < TIERS.length; j++) {
		const a = unit(TIERS[i]), b = unit(TIERS[j]);
		let sum = 0;
		for (let k = 0; k < a.length; k++) sum += (a[k] - b[k]) ** 2;
		const d = Math.sqrt(sum);
		pairs.push([d, TIERS[i], TIERS[j]]);
		if (d < MIN_PAIR_DISTANCE) fail(`${TIERS[i]} and ${TIERS[j]} arrive the same way (${d.toFixed(2)} < ${MIN_PAIR_DISTANCE}) — give one of them a different shape, not a different size`);
	}
}

// ── 5. the sweep fans out ───────────────────────────────────────────────────
for (const count of [2, 3, 4, 6, 10, 20]) {
	const paths = Array.from({ length: count }, (_, i) => sweepFlight(i, count, 5));
	for (let i = 1; i < count; i++) {
		const a = paths[i - 1], b = paths[i];
		if (Math.abs(a.arc - b.arc) < 0.08 && Math.abs(a.lateral - b.lateral) < 0.08) {
			fail(`sweep of ${count}: Frames ${i - 1} and ${i} fly the same path (arc ${a.arc}/${b.arc}, lateral ${a.lateral}/${b.lateral})`);
		}
	}
	for (const flight of paths) {
		if (flight.arc <= 0 || flight.arc > 1.2) fail(`sweep of ${count}: arc ${flight.arc} outside 0-1.2 cells`);
		if (Math.abs(flight.lateral) > 0.6) fail(`sweep of ${count}: lateral bow ${flight.lateral} would leave the board`);
		if (flight.flightScale < 1 || flight.flightScale > 1.5) fail(`sweep of ${count}: flightScale ${flight.flightScale} outside 1-1.5`);
	}
}
// a richer Frame must not fly FASTER than a poorer one
if (!(sweepFlight(0, 4, 100).flightScale >= sweepFlight(0, 4, 2).flightScale)) {
	fail('an elite Frame flies quicker than a plain one — the big ones should take the stage');
}

// ── 6. the Collector reacts to what it absorbs ──────────────────────────────
let previous = 0;
for (const mult of [2, 3, 5, 9, 10, 15, 25, 50, 100]) {
	const kick = collectorTick(mult);
	if (kick < previous) fail(`collectorTick(${mult}) = ${kick.toFixed(2)} is weaker than the previous tier`);
	if (kick < 1.05 || kick > 1.75) fail(`collectorTick(${mult}) = ${kick.toFixed(2)} outside 1.05-1.75`);
	previous = kick;
}
if (!(collectorTick(100) - collectorTick(2) > 0.25)) {
	fail('absorbing a 100x barely differs from absorbing a 2x — that moment is the whole subject of the sweep');
}

// Sorted before the summary line prints, not inside the --report branch: the
// first version sorted only when reporting, so `pnpm build` printed the FIRST
// pair's distance while calling it the closest.
pairs.sort((a, b) => a[0] - b[0]);

if (process.argv.includes('--report')) {
	console.log('\n  entry beats:');
	for (const tier of TIERS) {
		console.log(`    ${tier.padEnd(8)} ${ENTRY_MS[tier]}ms  overshoot ${overshoot(tier).toFixed(2)}  flash ${peak(tier, 'flash').toFixed(2)}  ring ${peak(tier, 'ring').toFixed(1)}`);
	}
	console.log('  shape distance:');
	for (const [d, a, b] of pairs) console.log(`    ${d.toFixed(2)}  ${a} / ${b}`);
	console.log('  collector kick: ' + [2, 10, 25, 100].map((m) => `${m}x→${collectorTick(m).toFixed(2)}`).join('  '));
}

console.log(problems.length === 0 ? `OK: 3 frame tiers escalate and differ (closest ${pairs[0][0].toFixed(2)}, limit ${MIN_PAIR_DISTANCE})` : `${problems.length} frame-beat problem(s) found`);
process.exit(problems.length === 0 ? 0 : 1);
