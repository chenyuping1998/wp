// Gate: the freeze takeover must actually be one continuous process.
//
// `src/game/frostTakeover.ts` drives a three-beat animation — frost creeps, ice
// sets, ice clarifies — and the ways it quietly breaks are all arithmetic, all
// invisible in a screenshot, and all obvious in a loop:
//
//   · a cell that ends the frost beat at 0.97, so the slab arrives over a cell
//     that never finished freezing
//   · a crystal whose growth curve is not monotonic, so it grows and then
//     shrinks back
//   · a beat that leaves something mid-flight when the next one starts
//   · the clarify beat not reaching zero, leaving a permanent film over every
//     locked reel for the rest of the feature
//
// Usage: node design/check_frost_takeover.mjs [--report]
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// pathToFileURL: on Windows a bare absolute path starts with a drive letter and
// node's ESM loader reads `E:` as an unsupported URL scheme.
const M = await import(
	pathToFileURL(path.join(appRoot, 'src/game/frostTakeover.ts')).href
);
const {
	FROST_TIMING,
	frostFront,
	cellFrost,
	crystalGrowth,
	crystalSeed,
	CRYSTALS_PER_CELL,
	rimeAt,
	slabAt,
	clarifyAt,
	CRACK_AT,
} = M;

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

const ROWS = 5;
const samples = (ms, step = 5) => {
	const out = [];
	for (let t = 0; t <= ms; t += step) out.push(t);
	if (out[out.length - 1] !== ms) out.push(ms);
	return out;
};
const monotonic = (values, label) => {
	for (let i = 1; i < values.length; i++) {
		if (values[i] < values[i - 1] - 1e-9) {
			fail(`${label} goes backwards at sample ${i} (${values[i - 1]} -> ${values[i]})`);
			return;
		}
	}
};

// ── the front only ever advances, and finishes ──────────────────────────────
const frontSeries = samples(FROST_TIMING.frostMs).map((t) => frostFront(t));
monotonic(frontSeries, 'the frost front');
if (Math.abs(frostFront(FROST_TIMING.frostMs) - 1) > 1e-9) {
	fail(`the frost front ends at ${frostFront(FROST_TIMING.frostMs)}, not 1`);
}
if (frostFront(0) !== 0) fail('the frost front does not start at 0');
// and it must lead rather than crawl: half the reel covered well before halftime
if (frostFront(FROST_TIMING.frostMs * 0.5) <= 0.5) {
	fail('the frost front is linear or slower — it should be fast off the landed cell');
}

// ── every cell starts clear, only advances, and ends fully frosted ──────────
// span is the furthest distance any cell sits from the landed one; worst case is
// the Wild landing on an end row.
for (const span of [1, 2, 3, 4, ROWS - 1]) {
	for (let d = 0; d <= span; d++) {
		const series = samples(FROST_TIMING.frostMs).map((t) => cellFrost(t, d, span));
		monotonic(series, `cell at distance ${d}/${span}`);
		if (series[0] !== 0) fail(`cell at distance ${d}/${span} does not start clear`);
		const end = cellFrost(FROST_TIMING.frostMs, d, span);
		if (Math.abs(end - 1) > 1e-9) {
			fail(`cell at distance ${d}/${span} ends at ${end.toFixed(4)}, not fully frosted`);
		}
	}
	// the landed cell must be ahead of the furthest one for most of the beat,
	// or the frost is not spreading FROM anywhere
	const mid = FROST_TIMING.frostMs * 0.45;
	if (span > 0 && !(cellFrost(mid, 0, span) > cellFrost(mid, span, span))) {
		fail(`at span ${span} the far cell is not behind the landed cell — nothing is spreading`);
	}
}

// ── crystals grow, and never ungrow ────────────────────────────────────────
const growth = samples(100, 1).map((n) => crystalGrowth(n / 100));
monotonic(growth.map((g) => g.arm), 'crystal arm');
monotonic(growth.map((g) => g.barb), 'crystal barb');
monotonic(growth.map((g) => g.alpha), 'crystal alpha');
const end = crystalGrowth(1);
if (end.arm !== 1) fail(`crystal arms end at ${end.arm}, not fully grown`);
if (end.barb !== 1) fail(`crystal barbs end at ${end.barb}, not fully grown`);
if (end.alpha !== 1) fail(`crystal alpha ends at ${end.alpha}, not opaque`);
// the barbs have to LAG the arms, which is the whole reason they are separate
if (!(crystalGrowth(0.3).barb === 0 && crystalGrowth(0.3).arm > 0.3)) {
	fail('crystal barbs do not lag the arms — the dendrite reads as a stamp fading in');
}

// ── seeds are deterministic, inside the cell, and staggered ────────────────
for (let cell = 0; cell < 6; cell++) {
	for (let i = 0; i < CRYSTALS_PER_CELL; i++) {
		const a = crystalSeed(cell, i);
		const b = crystalSeed(cell, i);
		if (a.dx !== b.dx || a.dy !== b.dy || a.radius !== b.radius) {
			fail(`crystalSeed(${cell},${i}) is not deterministic`);
		}
		// centre offset plus radius must stay inside the cell, or crystals bleed
		// onto the neighbouring reel
		if (Math.abs(a.dx) + a.radius > 0.5 || Math.abs(a.dy) + a.radius > 0.5) {
			fail(`crystalSeed(${cell},${i}) reaches outside its cell`);
		}
		if (a.delay < 0 || a.delay > 0.75) {
			fail(`crystalSeed(${cell},${i}) delay ${a.delay.toFixed(2)} leaves no time to grow`);
		}
	}
}

// ── rime leads the crystals ────────────────────────────────────────────────
monotonic(samples(100, 1).map((n) => rimeAt(n / 100).depth), 'rime depth');
if (!(rimeAt(0.3).depth > 0.5 * rimeAt(1).depth)) {
	fail('the rime does not lead — the edge should be furred while the middle is clear');
}
if (rimeAt(0).depth !== 0) fail('the rime does not start at zero');

// ── the slab sets, cracks once, and ends solid ─────────────────────────────
const slabSeries = samples(FROST_TIMING.freezeMs).map((t) => slabAt(t));
monotonic(slabSeries.map((s) => s.haze), 'slab haze');
monotonic(slabSeries.map((s) => s.rim), 'slab rim');
if (slabAt(0).haze !== 0) fail('the slab does not start transparent');
if (slabAt(FROST_TIMING.freezeMs).haze < 0.6) {
	fail(`the slab only reaches ${slabAt(FROST_TIMING.freezeMs).haze.toFixed(2)} — the ice never sets`);
}
const crackSeries = slabSeries.map((s) => s.crack);
if (Math.max(...crackSeries) < 0.9) fail('the crack flash never fires');
if (slabAt(FROST_TIMING.freezeMs * CRACK_AT * 0.5).crack !== 0) {
	fail('the crack fires before the ice sets');
}
if (slabAt(FROST_TIMING.freezeMs).crack > 0.02) {
	fail('the crack flash is still lit when the beat ends');
}

// ── the clarify beat gets all the way out of the way ───────────────────────
const clarify = samples(FROST_TIMING.clarifyMs).map((t) => clarifyAt(t));
for (let i = 1; i < clarify.length; i++) {
	if (clarify[i] > clarify[i - 1] + 1e-9) fail('the ice re-thickens while clarifying');
}
if (clarifyAt(0) !== 1) fail('the clarify beat does not start from solid ice');
if (clarifyAt(FROST_TIMING.clarifyMs) !== 0) {
	fail(
		`the ice ends at ${clarifyAt(FROST_TIMING.clarifyMs)} — every locked reel would keep a film over its panel`,
	);
}

if (process.argv.includes('--report')) {
	const total = FROST_TIMING.frostMs + FROST_TIMING.freezeMs + FROST_TIMING.clarifyMs;
	console.log(`\n  beats: frost ${FROST_TIMING.frostMs} + freeze ${FROST_TIMING.freezeMs} + clarify ${FROST_TIMING.clarifyMs} = ${total}ms`);
	console.log('  frost front:  ' + [0, 0.25, 0.5, 0.75, 1].map((f) => frostFront(FROST_TIMING.frostMs * f).toFixed(2)).join('  '));
	console.log('  cell frost over the beat (span 4):');
	for (let d = 0; d <= 4; d++) {
		const row = [0, 0.25, 0.5, 0.75, 1]
			.map((f) => cellFrost(FROST_TIMING.frostMs * f, d, 4).toFixed(2))
			.join('  ');
		console.log(`    d=${d}  ${row}`);
	}
	console.log('  slab haze:    ' + [0, 0.25, 0.5, 0.75, 1].map((f) => slabAt(FROST_TIMING.freezeMs * f).haze.toFixed(2)).join('  '));
	console.log('  crack:        ' + [0, 0.25, 0.5, 0.75, 1].map((f) => slabAt(FROST_TIMING.freezeMs * f).crack.toFixed(2)).join('  '));
}

console.log(
	problems.length === 0
		? 'OK: the freeze takeover is continuous (front, cells, crystals, slab, clarify)'
		: `${problems.length} freeze-takeover problem(s) found`,
);
process.exit(problems.length === 0 ? 0 : 1);
