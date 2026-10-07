// Measure whether a symbol's main motif actually reads at the size the game
// draws it.
//
//   node design/check_symbol_legibility.mjs <toolsDir> [symbol ...]
//   e.g. node design/check_symbol_legibility.mjs "E:/stake/tools/gen" h1 h2 h3 h4
//
// ── Why this exists, and why it does not measure sharpness alone ────────────
//
// The h1-h4 delivered on 2026-09-13 were reported as blurry. They are not:
// box-downscaled to the real 118px cell and compared against GoBananas100's
// same four tiles, h1 and h3 carry MORE edge energy than the first game did
// (54 vs 52, 65 vs 47). Adding detail would have made them worse.
//
// What is actually wrong is measurable, and it is three separate things:
//
//   1. NO FIGURE AND GROUND. h3's plate carried as much ice detail as the crate
//      on it. There is no quiet field for the eye to lock onto, and that is what
//      "cannot see the main motif" means.
//   2. NO VALUE SEPARATION: the subject measured the same brightness as the
//      plate it sits on, so the motif disappeared into its own background even
//      where its colour was right.
//   3. HUE CLASHES between tiles that have to be told apart at a glance.
//
// Softness was not one of them on that batch. It is measurable, but only on the
// subject's own edges — see MIN_ACUTANCE below.
//
// ── How the subject is found, and why not with a fixed centre box ───────────
//
// The first version of this script sampled a fixed inner 34% box as "the
// subject". That silently lies about any shape with a large counter: on the Q
// tile the inner box lands inside the hole in the letter, so it measured the
// PLATE and reported the letter as having 1.30 contrast against itself. The Q
// was fine; the ruler was wrong.
//
// So the subject is segmented instead of assumed. Otsu splits the inner region
// into two classes, and the one that does NOT dominate the region's outer ring
// is the subject — the ground is, by definition, the thing that runs out to the
// edges. Everything else is measured against that mask, which works the same for
// a letterform, a helmet and a bunch of bananas.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node design/check_symbol_legibility.mjs <toolsDir> [symbol ...]');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// --src=<dir> measures another game's folder, which is how the thresholds below
// were calibrated: GoBananas100 shipped, so its numbers are the definition of
// "good enough" and this script has to agree with them.
const args = process.argv.slice(3);
const srcArg = args.find((a) => a.startsWith('--src='));
const SRC = srcArg ? srcArg.slice(6) : path.join(APP, 'design/source/gen2_symbols');
const named = args.filter((a) => !a.startsWith('--'));
const SYMBOLS = named.length ? named : ['h1', 'h2', 'h3', 'h4'];

/** The cell the board actually draws a symbol into. */
const CELL = 118;
/** The bezel is the plate's own furniture and is not part of the judgement. */
const RIM = 0.08;

// ── The thresholds, and where each number came from ────────────────────────
//
// All three are the worst value GoBananas100 shipped, rounded down. That game is
// on the shelf and nobody called its tiles blurry, so its floor is the floor.
// Measured across its eleven tiles:
//
//     subject/ground   2.03 (w) .. 5.51 (J)
//     acutance         32.6 (J) .. 61.4 (h4)
//     contrast         2.56 (J) .. 4.67 (h4)
//
/** Subject/ground edge-density ratio. Below this the plate is as busy as the motif. */
const MIN_SUBJECT_FIELD = 2.0;
/**
 * RMS gradient over the subject and the ring around it.
 *
 * This constant has now been wrong twice, in opposite directions, and both times
 * because the REGION was wrong rather than the number:
 *
 *   55 over a fixed inner box   - failed 9 of GoBananas100's 11 shipped tiles
 *   32 over the whole inner region - passed everything, including genuinely soft
 *                                    art, because a plain plate drags the average
 *                                    down and a busy one props it up
 *
 * Measured on the subject alone, GB100 spans 57.2 (its 10) to 102.3 (its h4), so
 * 55 is its floor rounded down — and the first value turns out to have been the
 * right number attached to the wrong region.
 */
const MIN_ACUTANCE = 55;
/** WCAG contrast between the subject's mean colour and the ground's. */
const MIN_CONTRAST = 2.5;
/**
 * Hue separation is REPORTED, NOT ENFORCED, and the reference is why.
 *
 * GoBananas100 shipped with all eleven of its tiles inside a 23-degree band —
 * everything in that game is warm gold and olive — and it reads perfectly well,
 * because tiles are told apart by SHAPE first. A hard 60-degree gate fails 45
 * pairs on a game that is on the shelf, so as a pass/fail rule it is measuring
 * the theme, not the legibility.
 *
 * Hue only decides anything once two tiles already share a silhouette. In this
 * set that is exactly one pair: the scatter is a bunch of bananas and h3 is a
 * crate with bananas in it. That pair is worth acting on; the rest is noise.
 */
const HUE_NOTE_BELOW = 60;
/**
 * Below this saturation a tile has no hue worth comparing — its measured angle
 * is noise on a grey. The low-pay letters are deliberately achromatic, so a hue
 * clash between two of them is not a finding; they are told apart by the glyph.
 */
const ACHROMATIC = 0.12;

/** Box-downscale to n x n — the same averaging the GPU does drawing into a cell. */
const down = (g, n) => {
	const out = new Float64Array(n * n * 3);
	const sx = g.width / n;
	const sy = g.height / n;
	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			let a0 = 0;
			let a1 = 0;
			let a2 = 0;
			let c = 0;
			for (let j = Math.floor(y * sy); j < Math.floor((y + 1) * sy); j++) {
				for (let i = Math.floor(x * sx); i < Math.floor((x + 1) * sx); i++) {
					const k = (j * g.width + i) * 4;
					a0 += g.data[k];
					a1 += g.data[k + 1];
					a2 += g.data[k + 2];
					c++;
				}
			}
			out[(y * n + x) * 3] = a0 / c;
			out[(y * n + x) * 3 + 1] = a1 / c;
			out[(y * n + x) * 3 + 2] = a2 / c;
		}
	}
	return out;
};

const rel = (c) => {
	const v = c / 255;
	return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const contrastOf = (a, b) => {
	const y1 = 0.2126 * rel(a[0]) + 0.7152 * rel(a[1]) + 0.0722 * rel(a[2]);
	const y2 = 0.2126 * rel(b[0]) + 0.7152 * rel(b[1]) + 0.0722 * rel(b[2]);
	return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
};
const hueOf = (r, g, b) => {
	const mx = Math.max(r, g, b);
	const mn = Math.min(r, g, b);
	if (mx === mn) return { hue: 0, sat: 0 };
	let h;
	if (mx === r) h = 60 * (((g - b) / (mx - mn)) % 6);
	else if (mx === g) h = 60 * ((b - r) / (mx - mn) + 2);
	else h = 60 * ((r - g) / (mx - mn) + 4);
	if (h < 0) h += 360;
	return { hue: h, sat: (mx - mn) / mx };
};

const measure = (file) => {
	const b = down(PNG.sync.read(fs.readFileSync(file)), CELL);
	const L = (i) => 0.2126 * b[i * 3] + 0.7152 * b[i * 3 + 1] + 0.0722 * b[i * 3 + 2];

	const lo = Math.round(CELL * RIM);
	const hi = CELL - lo;

	// ── segment: Otsu over the inner region ────────────────────────────────
	const hist = new Float64Array(256);
	let total = 0;
	let sumAll = 0;
	for (let y = lo; y < hi; y++) {
		for (let x = lo; x < hi; x++) {
			const v = Math.min(255, Math.max(0, Math.round(L(y * CELL + x))));
			hist[v]++;
			total++;
			sumAll += v;
		}
	}
	let w0 = 0;
	let s0 = 0;
	let best = -1;
	let thr = 128;
	for (let t = 0; t < 256; t++) {
		w0 += hist[t];
		s0 += hist[t] * t;
		const w1 = total - w0;
		if (!w0 || !w1) continue;
		const bc = (w0 * w1 * (s0 / w0 - (sumAll - s0) / w1) ** 2) / (total * total);
		if (bc > best) {
			best = bc;
			thr = t;
		}
	}

	// Which class is the ground? The one that fills the inner region's outer
	// ring — the subject is centred and the background is what runs to the edge.
	let ringBright = 0;
	let ringN = 0;
	for (let y = lo; y < hi; y++) {
		for (let x = lo; x < hi; x++) {
			if (x > lo && x < hi - 1 && y > lo && y < hi - 1) continue;
			if (L(y * CELL + x) > thr) ringBright++;
			ringN++;
		}
	}
	const subjectIsBright = ringBright / ringN < 0.5;
	const isSubject = (i) => (L(i) > thr) === subjectIsBright;

	// ── colour of each class ───────────────────────────────────────────────
	const acc = [
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];
	for (let y = lo; y < hi; y++) {
		for (let x = lo; x < hi; x++) {
			const i = y * CELL + x;
			const a = acc[isSubject(i) ? 0 : 1];
			a[0] += b[i * 3];
			a[1] += b[i * 3 + 1];
			a[2] += b[i * 3 + 2];
			a[3]++;
		}
	}
	const mean = (a) => [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
	const subject = mean(acc[0]);
	const ground = mean(acc[1]);
	const subjectShare = acc[0][3] / total;

	// ── edge density on each class, and overall acutance ───────────────────
	//
	// Pixels ON the boundary between the two classes belong to neither: the
	// subject's own outline would otherwise be counted as background detail and
	// every tile would look like it had a busy plate. A ground pixel is only
	// counted once all four of its neighbours are ground too.
	let sEdge = 0;
	let sN = 0;
	let gEdge = 0;
	let gN = 0;
	let g2 = 0;
	let gc = 0;
	for (let y = lo + 1; y < hi - 1; y++) {
		for (let x = lo + 1; x < hi - 1; x++) {
			const i = y * CELL + x;
			const m = Math.hypot(L(i + 1) - L(i - 1), L(i + CELL) - L(i - CELL));
			// ACUTANCE IS THE SUBJECT'S EDGES, NOT THE TILE'S.
			//
			// This used to average over the whole inner region, which quietly made
			// it a measure of how BUSY THE PLATE IS. When the 2026-09-14 h1-h4
			// arrived with the plain plates the art brief had asked for, acutance
			// fell from 52/40/61/40 to 35/21/28/21 and the guard reported three of
			// them as "too soft" — while their subject/ground ratios had improved
			// two- to four-fold and the copper lantern is plainly crisp on screen.
			// The tiles got better and the number got worse, which means the number
			// was measuring the wrong thing.
			//
			// Restricted to the subject and the ring of pixels around it, so it
			// answers the question actually being asked: are the subject's own
			// edges hard?
			const near =
				isSubject(i) ||
				isSubject(i - 1) ||
				isSubject(i + 1) ||
				isSubject(i - CELL) ||
				isSubject(i + CELL);
			if (near) {
				g2 += m * m;
				gc++;
			}
			const pure =
				isSubject(i) === isSubject(i - 1) &&
				isSubject(i) === isSubject(i + 1) &&
				isSubject(i) === isSubject(i - CELL) &&
				isSubject(i) === isSubject(i + CELL);
			if (!pure) continue;
			if (isSubject(i)) {
				sN++;
				if (m > 28) sEdge++;
			} else {
				gN++;
				if (m > 28) gEdge++;
			}
		}
	}
	const groundDensity = gN ? gEdge / gN : 0;
	const subjectDensity = sN ? sEdge / sN : 0;

	return {
		subjectField: groundDensity ? subjectDensity / groundDensity : Infinity,
		acutance: Math.sqrt(g2 / gc),
		contrast: contrastOf(subject, ground),
		share: subjectShare,
		...hueOf(subject[0], subject[1], subject[2]),
	};
};

const results = [];
for (const s of SYMBOLS) {
	const file = path.join(SRC, `${s}.png`);
	if (!fs.existsSync(file)) {
		console.error(`missing: ${path.relative(APP, file)}`);
		process.exit(1);
	}
	results.push({ s, ...measure(file) });
}

let failed = 0;
const fail = (msg) => {
	console.log(`  FAIL  ${msg}`);
	failed++;
};

for (const r of results) {
	console.log(
		`${r.s}  subject/ground ${r.subjectField.toFixed(2)}  acutance ${r.acutance.toFixed(1)}  ` +
			`contrast ${r.contrast.toFixed(2)}  hue ${Math.round(r.hue)}deg sat ${r.sat.toFixed(2)}  ` +
			`subject ${(r.share * 100).toFixed(0)}% of tile`,
	);
	if (r.subjectField < MIN_SUBJECT_FIELD)
		fail(
			`${r.s}: subject/ground edge density ${r.subjectField.toFixed(2)} < ${MIN_SUBJECT_FIELD} — ` +
				`the plate around the motif is as busy as the motif. Take the texture off the plate.`,
		);
	if (r.acutance < MIN_ACUTANCE)
		fail(`${r.s}: acutance ${r.acutance.toFixed(1)} < ${MIN_ACUTANCE} — the edges are too soft.`);
	if (r.contrast < MIN_CONTRAST)
		fail(
			`${r.s}: subject-vs-ground contrast ${r.contrast.toFixed(2)} < ${MIN_CONTRAST} — the ` +
				`subject does not stand off its own plate.`,
		);
}

// Hue separation is a property of the SET, not of one tile, and it is a note
// rather than a failure (see HUE_NOTE_BELOW). Two achromatic tiles have no hue
// to clash: the low-pay letters are meant to be colourless and are told apart by
// their glyph, so only coloured pairs are compared at all.
const notes = [];
for (let i = 0; i < results.length; i++) {
	for (let j = i + 1; j < results.length; j++) {
		const a = results[i];
		const c = results[j];
		if (a.sat < ACHROMATIC || c.sat < ACHROMATIC) continue;
		const d = Math.abs(a.hue - c.hue);
		const sep = Math.min(d, 360 - d);
		if (sep < HUE_NOTE_BELOW)
			notes.push(
				`${a.s} and ${c.s} share a hue (${Math.round(sep)}deg apart). Only act on this if ` +
					`the two also share a silhouette.`,
			);
	}
}
if (notes.length) {
	console.log();
	console.log('notes (not failures):');
	for (const n of notes) console.log(`  ${n}`);
}

console.log();
if (failed) {
	console.log(`${failed} problem(s). See design/HIGHPAY_REGEN_PROMPT.md for what each one means.`);
	process.exit(1);
}
console.log('all symbols read at 118px.');
