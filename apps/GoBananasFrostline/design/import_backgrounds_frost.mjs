// Import the delivered Frostline background plates.
//
//   node design/import_backgrounds_frost.mjs <dir with node_modules/@resvg/resvg-js + pngjs> <src dir>
//
// Reads the three JPEGs named in SOURCES from <src dir>, and writes
// bg_base / bg_feature / bg_superspin into static/assets/sprites/goBananasBackground.
//
// ── Two things it has to do, and one it deliberately does not ───────────────
//
// 1. CROP TO 16:9. The delivery is 1376x768 (1.792), and the plate is stretched
//    to the window with no aspect preservation, so the 0.8% error would simply
//    become a 0.8% horizontal stretch. Eleven columns come off the sides.
//
// 2. FEATHER THE COMPOSITION GUIDES. The generator rendered "keep the centre
//    dark and quiet" as a literal flat dark RECTANGLE with hard edges — a
//    vertical seam either side of centre, and on the base plate a horizontal one
//    across the sky. Measured on the base plate the step is ~51 luminance levels
//    at x=477, which is not subtle.
//
//    Those seams are NOT hidden by the reel housing. Rendering the housing's
//    real footprint over the plate at all three layouts shows the vertical band
//    running below the reels in landscape and full-height beside them in
//    portrait.
//
//    The dark centre itself is wanted and stays. Only the STEP is removed, by
//    blurring horizontally (or vertically) inside a narrow window centred on
//    each detected edge. Everything outside those windows is untouched.
//
// 3. What it does NOT do is try to restore the painting under the band. Sampling
//    across the left edge at nine heights gives inside/outside ratios from 0.43
//    to 0.62 — not a uniform tint — and the inside values are near-flat whatever
//    is outside them. The centre was painted over, not shaded, so there is
//    nothing to recover. If the flat centre is not good enough, the fix is a
//    regeneration with the guide wording corrected, not a filter here.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
const srcDir = process.argv[3];
if (!toolsDir || !srcDir) {
	console.error('usage: node design/import_backgrounds_frost.mjs <toolsDir> <srcDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'static/assets/sprites/goBananasBackground');

const SOURCES = {
	bg_base: 'Gemini_Generated_Image_328v4m328v4m328v.jpg',
	bg_feature: 'Gemini_Generated_Image_ejinr0ejinr0ejin.jpg',
	bg_superspin: 'Gemini_Generated_Image_lfhwallfhwallfhw.jpg',
};

const TARGET_W = 1920;
const TARGET_H = 1080;

/** Decode a JPEG by handing it to resvg, which is the only decoder here. */
const decode = (file, w, h) => {
	const b64 = fs.readFileSync(file).toString('base64');
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
		`<image href="data:image/jpeg;base64,${b64}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/></svg>`;
	return PNG.sync.read(new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng());
};

const lum = (png, x, y) => {
	const i = (y * png.width + x) * 4;
	return 0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2];
};

/**
 * Column (or row) means, then the indices where the first difference exceeds
 * `minJump`. Adjacent indices are collapsed to one edge — a seam is a few
 * columns wide after JPEG compression, not one.
 */
const findEdges = (png, axis, minJumpFloor) => {
	const n = axis === 'x' ? png.width : png.height;
	const m = axis === 'x' ? png.height : png.width;
	const mean = new Float64Array(n);
	for (let a = 0; a < n; a++) {
		let s = 0;
		for (let b = 0; b < m; b++) s += axis === 'x' ? lum(png, a, b) : lum(png, b, a);
		mean[a] = s / m;
	}
	// THRESHOLD ADAPTS TO THE PLATE'S OWN CONTRAST, and it has to.
	//
	// A fixed jump of 8 found both seams on the base and feature plates and MISSED
	// the superspin one entirely — that plate is a near-black night scene, so its
	// column means barely move and a seam that is plainly visible only steps about
	// 7. A seam is an OUTLIER against the image's own gradients, so the threshold
	// is six times the median step, floored so a perfectly smooth plate does not
	// start feathering its own noise.
	const diffs = [];
	for (let a = 1; a < n; a++) diffs.push(Math.abs(mean[a] - mean[a - 1]));
	const sorted = [...diffs].sort((x, y) => x - y);
	const median = sorted[sorted.length >> 1] || 0;
	const minJump = Math.max(minJumpFloor, median * 6);

	const hits = [];
	for (let a = 1; a < n; a++) if (Math.abs(mean[a] - mean[a - 1]) > minJump) hits.push(a);
	// collapse runs, and keep only edges away from the frame itself
	const edges = [];
	for (const a of hits) {
		if (a < n * 0.1 || a > n * 0.9) continue;
		if (edges.length && a - edges[edges.length - 1] < 40) continue;
		edges.push(a);
	}
	return edges;
};

/**
 * Blur across `axis` inside a window around `at`, so a step becomes a ramp.
 * A box blur run three times, which is close enough to Gaussian and needs no
 * kernel.
 */
const feather = (png, axis, at, radius) => {
	const W = png.width;
	const H = png.height;
	const lo = Math.max(1, at - radius);
	const hi = Math.min((axis === 'x' ? W : H) - 1, at + radius);
	const span = hi - lo;
	if (span < 4) return;
	const lines = axis === 'x' ? H : W;
	for (let line = 0; line < lines; line++) {
		for (let pass = 0; pass < 3; pass++) {
			for (let c = 0; c < 3; c++) {
				const buf = new Float64Array(span);
				for (let k = 0; k < span; k++) {
					const x = axis === 'x' ? lo + k : line;
					const y = axis === 'x' ? line : lo + k;
					buf[k] = png.data[(y * W + x) * 4 + c];
				}
				const out = new Float64Array(span);
				const r = Math.max(2, Math.round(radius / 3));
				for (let k = 0; k < span; k++) {
					let s = 0;
					let cnt = 0;
					for (let d = -r; d <= r; d++) {
						const j = k + d;
						if (j < 0 || j >= span) continue;
						s += buf[j];
						cnt++;
					}
					out[k] = s / cnt;
				}
				for (let k = 0; k < span; k++) {
					const x = axis === 'x' ? lo + k : line;
					const y = axis === 'x' ? line : lo + k;
					// taper the correction to zero at the window's ends, so the blur
					// itself does not introduce a new (softer) seam
					const t = k / (span - 1);
					const w = Math.sin(Math.PI * t) ** 0.6;
					const i = (y * W + x) * 4;
					png.data[i + c] = Math.round(png.data[i + c] * (1 - w) + out[k] * w);
				}
			}
		}
	}
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, file] of Object.entries(SOURCES)) {
	const src = path.join(srcDir, file);
	if (!fs.existsSync(src)) {
		console.error(`missing source for ${name}: ${src}`);
		process.exit(1);
	}
	// `slice` crops to 16:9 rather than squashing — the 1.792 delivery loses
	// eleven columns off the sides and nothing off the top or bottom.
	const png = decode(src, TARGET_W, TARGET_H);

	const vertical = findEdges(png, 'x', 2.5);
	const horizontal = findEdges(png, 'y', 2.5);
	for (const at of vertical) feather(png, 'x', at, 48);
	for (const at of horizontal) feather(png, 'y', at, 36);

	fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(png));
	console.log(
		`${name}.png  ${TARGET_W}x${TARGET_H}  feathered ${vertical.length} vertical + ${horizontal.length} horizontal seam(s)` +
			(vertical.length ? `  [x=${vertical.join(', ')}]` : ''),
	);
}
console.log(`\nwritten to ${path.relative(APP, OUT)}`);
