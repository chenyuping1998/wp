// Bring the supplied plaque art into static/, keyed off its checkerboard.
//
//   node design/import_banners.mjs <dir with node_modules for pngjs>
//
// ── the problem ──
//
// The five tier frames and the free-spin counter plaque arrive as JPEGs with the
// transparency DRAWN IN: a grey checkerboard, the pattern an image editor shows
// behind an alpha channel, baked into the pixels. Used as-is the game would draw
// each plaque sitting on a grey chequered rectangle.
//
// ── what does not work, and why ──
//
// A colour threshold cannot do it. The plaques are gold and fire, so most of the
// artwork is far from grey - but the dark well in the middle passes through the
// checker's range, and so does every grey-brown shadow in the carving.
//
// A border flood does better and still fails at the edges. The art is painted
// with soft outer glow, and where that glow is faint the checkerboard shows
// THROUGH it. A flood either stops at the first washed pixel, leaving a chequered
// halo, or is loosened until it eats the glow.
//
// Two versions of a CONTRAST test came before this one and both are worth
// recording, because the second looked right for a while.
//
// The first assumed the squares' pitch and phase - 18px from the origin - and
// read the two greys as the means of the two phases. The six images are six sizes
// with six different pitches, so the assumed grid cut across the real squares:
// tier1 reported light and dark as 149 and 149, the same number, and a contrast
// of zero means an alpha of one everywhere.
//
// The second dropped the grid and measured the SPREAD of the neutral pixels'
// luminance over a window: bare checker spreads by the full amount whatever its
// alignment, and anything covering it narrows the spread. That is true. What is
// not true is the converse, and the counter plaque is where it broke. Measured on
// that image, against a bare-checker reference of 60:
//
//     bare checker   ratio 0.97      roof tiles   ratio 0.95
//     bare bottom    ratio 1.02      brass bell   ratio 1.08
//     glow           ratio 0.90      dark panel   ratio 0.08
//
// The ARTWORK spreads as widely as the checkerboard does, because painted roof
// tiles and brass are full of light and dark neutral pixels. Only the flat dark
// panel separated. The key was being carried entirely by a chroma rule bolted on
// beside it, and 20% of the image came out part-transparent - which on a dark
// board is a visible grey chequered smear, not a soft edge.
//
// ── what actually separates them ──
//
// The checkerboard is not merely contrasty, it is PERIODIC, and the artwork is
// not - not at the checker's period, and not everywhere at once. So the test is
// the energy at that spatial frequency rather than the amount of contrast.
//
// A checkerboard of period P has its fundamental at the two diagonal frequencies
// (1/P, 1/P) and (1/P, -1/P). Over a window this measures the MAGNITUDE of both
// and divides by the window's own standard deviation, giving the fraction of the
// local variation that is checkerboard. On the counter plaque:
//
//     bare checker   0.85            roof tiles   0.30
//     glow           0.83            talisman     0.19
//                                    brass bell   0.10
//                                    dark panel   0.00
//
// A margin of 0.30 against 0.83, where the contrast test had 0.95 against 0.90.
//
// Taking the magnitude is what makes it phase-independent, and that is not a
// convenience: the counter plaque's horizontal and vertical periods measure 25
// and 24 pixels, so the pattern SLIPS by a whole square across the image and no
// single phase fits it. A phase-fitted version of this test read 0.83 in the
// middle of the image and -0.01 in the top-left corner, on identical bare
// checker.
//
// The period is measured per image, on a frame just inside the border where the
// art never reaches: 24.5 for the counter, 36 to 39 for the tiers.
//
// The glow reads as background here and is therefore REMOVED, which is a choice
// rather than a side effect. It cannot be kept: it is painted over the
// checkerboard, so every glow pixel carries the pattern, and holding it at half
// alpha holds the checkerboard at half alpha with it.
//
// ── seams ──
//
// The counter plaque's checkerboard has a SEAM: one vertical and one horizontal
// line where the pattern slips by a square, visible in the source as a
// double-width cell. The image was evidently assembled or resized in pieces, and
// it is also why its horizontal and vertical periods measure 25 and 24.
//
// A window straddling a seam sees two anti-phase halves that cancel, so it scores
// like artwork, and the first version of this key left two thin opaque bars
// running from the plaque out to the edge of the image.
//
// The fix is to score a pixel by the BEST nearby window rather than the one
// centred on it: a window offset far enough to clear the seam sits wholly in one
// phase and reads correctly. Because the score is already computed on a grid of
// overlapping windows, that is a local maximum over the grid and costs nothing.
//
// It shrinks the silhouette by about the offset - some sixteen pixels on a
// twelve-hundred-pixel image - since a pixel just inside the artwork now has a
// window that is wholly background within reach. That is a real cost and it is
// the cheaper one.
//
// ── the fringe ──
//
// A window-based test cannot put the boundary in exactly the right place, and on
// tier1 that showed as a light DASHED LINE tracing the whole plaque. Measured
// across its left edge, with the art starting near x=45:
//
//     x=18  bare checker   amp 15.7  sd 24.9  ->  0.63   transparent
//     x=27  straddling     amp 14.8  sd 39.3  ->  0.38
//     x=42  still checker  amp 13.0  sd 51.2  ->  0.25   alpha 127  <- the dash
//     x=48  gold border    amp 11.4  sd 51.4  ->  0.22   opaque
//
// Two things push the verdict outward over pixels that are still checkerboard.
// The window holds less checker as it crosses, so the amplitude decays; and the
// mean STEP between a bright checker and a dark plaque inflates the window's
// standard deviation, here from 25 to 51, halving the ratio again. Normalising
// against a high-passed signal removes the second and not the first - tried, and
// it moved x=42 only from 0.25 to 0.34, nowhere near the 0.68 it needed.
//
// So the fringe is cleaned with the one thing the window threw away: THE PIXEL'S
// OWN COLOUR. A checkerboard is neutral grey at two known levels, and the art on
// these plaques is gold, fire and lacquer. Measured over each image's
// part-transparent band:
//
//     tier1        62% neutral, luminance 129..227 around its grey of 194
//     tier5        16% neutral - the rest is the flames' own soft glow
//     fs_counter    2% neutral, and dark (17..22) - the panel's edge, not checker
//
// A part-transparent pixel that is neutral AND sits inside the checker's own
// luminance range is therefore checkerboard, and goes. tier5's flame edges and
// the counter's panel edge are untouched, because they are neither.
//
// This only ever REMOVES from the soft band. It cannot eat into the artwork,
// which is fully opaque by the time the band ends.
//
// The one thing this cannot recover is artwork that is itself periodic at the
// checker's period over a whole window. Nothing on these plaques is; the roof
// tiles come closest and reach 0.30.

import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/import_banners.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/banners');
// Where each source file goes. The win banners and the counter plaque are the
// same job with the same checkerboard, so they run through the same key - they
// only differ in which directory they land in.
const DESTINATIONS = {
	tier1: path.join(appRoot, 'static/assets/sprites/soulSealWinBanners/tier1.png'),
	tier2: path.join(appRoot, 'static/assets/sprites/soulSealWinBanners/tier2.png'),
	tier3: path.join(appRoot, 'static/assets/sprites/soulSealWinBanners/tier3.png'),
	tier4: path.join(appRoot, 'static/assets/sprites/soulSealWinBanners/tier4.png'),
	tier5: path.join(appRoot, 'static/assets/sprites/soulSealWinBanners/tier5.png'),
	fs_counter: path.join(appRoot, 'static/assets/sprites/soulSealFrame/fs_counter_panel.png'),
};
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

// Above this fraction of the window's variation being checkerboard, the pixel is
// background. Below SOLID_BELOW it is artwork. Between, it ramps - which is what
// gives the plaque's edge its antialiasing, since a window straddling the edge
// is genuinely part checker.
//
// The band sits in the gap the measurements above leave: the worst artwork reads
// 0.30 and the weakest background 0.75.
const CLEAR_ABOVE = 0.68;
const SOLID_BELOW = 0.45;
// The score is computed on a grid this many pixels apart and interpolated. A
// window is 1.5 periods across, so it cannot change quickly enough for 4px
// sampling to miss anything, and computing it per pixel is 1.4 billion
// multiply-adds on the counter plaque alone.
const STEP = 4;
// How far, in grid cells, to look for a better-placed window.
//
// This wants to be LARGER than the window radius - a window shifted by less than
// R still straddles the seam it was shifted to avoid - and it cannot be, because
// the relaxation erodes thin artwork by roughly the same distance. Derived from
// the radius (ceil(R / STEP) + 1, so 24px against a radius of 18) it clears every
// seam on every image and takes the counter plaque's bell CORDS with it, leaving
// two brass bells hanging in mid-air.
//
// So it is held at the largest value the thinnest artwork survives, and the seams
// it cannot reach are cleaned afterwards by eroding checker-coloured pixels in
// from the silhouette - see CHECKER_ERODE_MAX_PASSES.
const SEAM_REACH = 4;
// Window radius as a fraction of the period. 0.75 spans one and a half squares
// each way, enough to see the alternation without smearing the art's edges more
// than necessary.
const WINDOW = 0.75;
// The period is searched over this range. The six supplied images measure 24.5
// to 39.
const PERIOD_MIN = 10;
const PERIOD_MAX = 70;

// Unpremultiplying divides by alpha, so at very low alpha it amplifies whatever
// noise is there and lands on white. Under this threshold the pixel keeps its
// composited colour: it is nearly transparent, so what colour it is barely reads;
// what does read is that it is not suddenly white. design/import_cover.mjs
// carries the same guard for the same reason.
const UNPREMULTIPLY_MIN_ALPHA = 40;

// A pixel counts as neutral - and so as possible checkerboard - below this
// chroma. The artwork is gold, fire and lacquer; none of it is grey.
const NEUTRAL_CHROMA = 16;
// How far outside the measured checker luminance range a neutral pixel may sit
// and still be treated as checkerboard. JPEG softens the squares' edges, so the
// blend between the two greys runs a little past both.
const CHECKER_LUM_MARGIN = 18;
// How many times to peel checker-coloured pixels off the silhouette.
//
// What is left after the relaxation is the SEAMS the relaxation could not reach:
// on tier1, a five-pixel line where the checkerboard was joined, standing off the
// top of the plaque as an opaque grey spike. It survives every window-based test
// because it is a strong, narrow feature - which is also what makes it easy to
// remove from the other side.
//
// A pixel goes if it is neutral, sits inside the checker's own luminance range,
// and touches transparency. Repeated, that eats a narrow neutral structure from
// both edges until nothing is left, and stops dead at anything coloured. The
// plaques' borders are gold and lacquer and the counter's panel edge is nearly
// black, so none of them is touched.
//
// It runs to CONVERGENCE rather than for a fixed number of passes. A seam is not
// one clean column - measured on tier3, the peel went 195, 169, 114, 66, 44, 27,
// 18, 10 pixels and was still going, and stopping at eight left a five-pixel grey
// spike standing off the roof. The cap below only keeps a pathological image from
// looping forever; the six supplied ones all settle well inside it.
const CHECKER_ERODE_MAX_PASSES = 64;

const decode = (jpg) => {
	const tmp = path.join(SRC, `.decode-${path.basename(jpg, '.jpg')}.png`);
	execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', jpg, tmp]);
	const png = PNG.sync.read(fs.readFileSync(tmp));
	fs.unlinkSync(tmp);
	return png;
};

/**
 * How much of the local variation is checkerboard at period P, and the window's
 * mean luminance - which is the grey to unpremultiply against.
 */
const checkerScore = (lum, w, h, cx, cy, P, R) => {
	const x0 = Math.max(0, cx - R);
	const x1 = Math.min(w - 1, cx + R);
	const y0 = Math.max(0, cy - R);
	const y1 = Math.min(h - 1, cy + R);
	let n = 0;
	let sum = 0;
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			sum += lum[w * y + x];
			n += 1;
		}
	}
	const mean = sum / n;
	// The two diagonal components, each as a complex amplitude so that only its
	// magnitude is used and the phase drops out.
	let ar = 0;
	let ai = 0;
	let br = 0;
	let bi = 0;
	let v2 = 0;
	const k = (2 * Math.PI) / P;
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			const v = lum[w * y + x] - mean;
			v2 += v * v;
			const a = k * (x + y);
			const b = k * (x - y);
			ar += v * Math.cos(a);
			ai += v * Math.sin(a);
			br += v * Math.cos(b);
			bi += v * Math.sin(b);
		}
	}
	const amp = (Math.sqrt(ar * ar + ai * ai) + Math.sqrt(br * br + bi * bi)) / n;
	const sd = Math.sqrt(v2 / n);
	// A window with almost no variation at all is flat artwork, not faint
	// checkerboard - dividing by its tiny sd would report noise as a strong score.
	return { rel: sd > 1 ? amp / sd : 0, mean };
};

/** Sample points on a frame just inside the border, where the art never reaches. */
const framePoints = (w, h) => {
	const band = Math.max(12, Math.round(Math.min(w, h) * 0.03));
	const pts = [];
	for (let y = band; y < band * 2; y += 8) {
		for (let x = band; x < w - band; x += 8) pts.push([x, y]);
	}
	for (let y = h - band * 2; y < h - band; y += 8) {
		for (let x = band; x < w - band; x += 8) pts.push([x, y]);
	}
	return pts;
};

/** The checker's period in this image, taken as the one the border agrees on. */
const estimatePeriod = (lum, w, h) => {
	const pts = framePoints(w, h);
	let best = null;
	for (let P = PERIOD_MIN; P <= PERIOD_MAX; P += 0.5) {
		const R = Math.round(P * WINDOW);
		let sum = 0;
		for (const [x, y] of pts) sum += checkerScore(lum, w, h, x, y, P, R).rel;
		const rel = sum / pts.length;
		if (!best || rel > best.rel) best = { P, rel };
	}
	return best;
};

if (!fs.existsSync(SRC)) {
	console.error(`No source at ${path.relative(appRoot, SRC)}`);
	process.exit(1);
}

const files = fs
	.readdirSync(SRC)
	.filter((f) => path.basename(f, path.extname(f)) in DESTINATIONS)
	.sort();
if (files.length === 0) {
	console.error(
		`Nothing to import in ${path.relative(appRoot, SRC)} - expected one of: ` +
			Object.keys(DESTINATIONS).join(', '),
	);
	process.exit(1);
}

for (const file of files) {
	const png = decode(path.join(SRC, file));
	const { width: w, height: h, data } = png;

	const lum = new Float32Array(w * h);
	for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
		lum[j] = (data[i] + data[i + 1] + data[i + 2]) / 3;
	}

	const period = estimatePeriod(lum, w, h);
	if (period.rel < 0.3) {
		console.error(
			`  !! ${file}: no checkerboard found along the border (best ${period.rel.toFixed(2)} at ` +
				`period ${period.P}) - is this image actually keyed?`,
		);
		process.exitCode = 1;
		continue;
	}

	// The score on a coarse grid, then interpolated. Both the score and the local
	// grey are carried, because the grey is what the pixel is unpremultiplied
	// against and it varies across the image.
	const R = Math.round(period.P * WINDOW);
	const gw = Math.ceil(w / STEP) + 1;
	const gh = Math.ceil(h / STEP) + 1;
	const grid = new Float32Array(gw * gh);
	const greys = new Float32Array(gw * gh);
	for (let gy = 0; gy < gh; gy += 1) {
		for (let gx = 0; gx < gw; gx += 1) {
			const s = checkerScore(
				lum,
				w,
				h,
				Math.min(w - 1, gx * STEP),
				Math.min(h - 1, gy * STEP),
				period.P,
				R,
			);
			grid[gw * gy + gx] = s.rel;
			greys[gw * gy + gx] = s.mean;
		}
	}
	// The best-placed window within reach, which is what clears the seams.
	const relaxed = new Float32Array(gw * gh);
	const reach = SEAM_REACH;
	for (let gy = 0; gy < gh; gy += 1) {
		for (let gx = 0; gx < gw; gx += 1) {
			let best = 0;
			for (let dy = -reach; dy <= reach; dy += 1) {
				const y = gy + dy;
				if (y < 0 || y >= gh) continue;
				for (let dx = -reach; dx <= reach; dx += 1) {
					const x = gx + dx;
					if (x < 0 || x >= gw) continue;
					const v = grid[gw * y + x];
					if (v > best) best = v;
				}
			}
			relaxed[gw * gy + gx] = best;
		}
	}

	// ONE grey to unpremultiply against, taken from the windows that are certainly
	// background.
	//
	// The window's own mean was used at first and put a pale outline round the
	// whole plaque: at the silhouette a window is half artwork, so its mean is far
	// darker than the checkerboard, and dividing by alpha against too dark a
	// background sends the edge to white. The checkerboard is uniform across each
	// image, so one number is both simpler and right.
	const backgroundGrey = (() => {
		const samples = [];
		for (let i = 0; i < grid.length; i += 1) {
			if (grid[i] > CLEAR_ABOVE) samples.push(greys[i]);
		}
		if (samples.length === 0) return 141;
		samples.sort((a, b) => a - b);
		return samples[samples.length >> 1];
	})();

	const sample = (field, x, y) => {
		const fx = x / STEP;
		const fy = y / STEP;
		const gx = Math.min(gw - 2, Math.floor(fx));
		const gy = Math.min(gh - 2, Math.floor(fy));
		const tx = fx - gx;
		const ty = fy - gy;
		const a = field[gw * gy + gx];
		const b = field[gw * gy + gx + 1];
		const c = field[gw * (gy + 1) + gx];
		const d = field[gw * (gy + 1) + gx + 1];
		return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
	};

	// The checker's own luminance range, taken from the pixels the score is sure
	// about. Not the two nominal greys: JPEG blends across every square boundary,
	// so what is actually on the image is the whole span between them.
	const checkerRange = (() => {
		const samples = [];
		for (let y = 0; y < h; y += 3) {
			for (let x = 0; x < w; x += 3) {
				if (sample(relaxed, x, y) <= CLEAR_ABOVE) continue;
				const i = (w * y + x) * 4;
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				if (Math.max(r, g, b) - Math.min(r, g, b) > NEUTRAL_CHROMA) continue;
				samples.push((r + g + b) / 3);
			}
		}
		if (samples.length < 100) return null;
		samples.sort((a, b) => a - b);
		return {
			lo: samples[Math.floor(samples.length * 0.02)] - CHECKER_LUM_MARGIN,
			hi: samples[Math.floor(samples.length * 0.98)] + CHECKER_LUM_MARGIN,
		};
	})();


	let cleared = 0;
	let partial = 0;
	let fringe = 0;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (w * y + x) * 4;
			const rel = sample(relaxed, x, y);
			let alpha = Math.min(1, Math.max(0, (CLEAR_ABOVE - rel) / (CLEAR_ABOVE - SOLID_BELOW)));

			// The fringe rule. Inside the soft band only, and only for a pixel that
			// is itself checkerboard-coloured. See the note at the top.
			if (alpha > 0 && alpha < 1 && checkerRange) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				const lumHere = (r + g + b) / 3;
				if (
					Math.max(r, g, b) - Math.min(r, g, b) <= NEUTRAL_CHROMA &&
					lumHere >= checkerRange.lo &&
					lumHere <= checkerRange.hi
				) {
					alpha = 0;
					fringe += 1;
				}
			}

			const a = Math.round(alpha * 255);
			data[i + 3] = a;
			if (a === 0) cleared += 1;
			else if (a < 255) partial += 1;

			if (a >= UNPREMULTIPLY_MIN_ALPHA && a < 255) {
				for (let c = 0; c < 3; c++) {
					const v = (data[i + c] - backgroundGrey * (1 - alpha)) / alpha;
					data[i + c] = Math.max(0, Math.min(255, Math.round(v)));
				}
			}
		}
	}

	// Peel the seams. See CHECKER_ERODE_MAX_PASSES.
	let eroded = 0;
	if (checkerRange) {
		const isChecker = (i) => {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			if (Math.max(r, g, b) - Math.min(r, g, b) > NEUTRAL_CHROMA) return false;
			const l = (r + g + b) / 3;
			return l >= checkerRange.lo && l <= checkerRange.hi;
		};
		for (let pass = 0; pass < CHECKER_ERODE_MAX_PASSES; pass += 1) {
			const doomed = [];
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const i = (w * y + x) * 4;
					if (data[i + 3] === 0 || !isChecker(i)) continue;
					const open =
						(x > 0 && data[i - 4 + 3] === 0) ||
						(x < w - 1 && data[i + 4 + 3] === 0) ||
						(y > 0 && data[i - w * 4 + 3] === 0) ||
						(y < h - 1 && data[i + w * 4 + 3] === 0);
					if (open) doomed.push(i);
				}
			}
			if (doomed.length === 0) break;
			for (const i of doomed) data[i + 3] = 0;
			eroded += doomed.length;
		}
	}

	const out = DESTINATIONS[path.basename(file, path.extname(file))];
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, PNG.sync.write(png));
	console.log(
		`${file.padEnd(10)} ${w}x${h} aspect ${(h / w).toFixed(3)} ` +
			`period ${period.P} (border ${period.rel.toFixed(2)}, grey ${backgroundGrey.toFixed(0)}) ` +
			`-> ${path.relative(appRoot, out)}`,
	);
	console.log(
		`  ${((100 * cleared) / (w * h)).toFixed(1)}% cleared, ` +
			`${((100 * partial) / (w * h)).toFixed(1)}% part-transparent, ` +
			`${fringe.toLocaleString()} fringe + ${eroded.toLocaleString()} seam px removed` +
			(checkerRange ? ` (checker lum ${checkerRange.lo.toFixed(0)}..${checkerRange.hi.toFixed(0)})` : ''),
	);
}

console.log('\nNow run design/measure_banner_wells.mjs and reconcile the wells in game/constants.ts.');
