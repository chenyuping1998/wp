// The buy-bonus talisman's SEAL DEVICE, cut out as its own sprite.
//
//   node design/generate_buybonus_glyph.mjs <dir with node_modules/pngjs>
//
// ── NOT CURRENTLY USED ──
//
// This was written for a hover state that lit the incantation. It worked - the
// cut below is sound and the preview is clean - and the RESULT was wrong: the
// talisman is already the brightest object outside the reels and it carries the
// button's label, so lighting its face washed both out and the middle of the
// paper became a pale smear.
//
// The hover is an outline on the plate's edge now, which adds nothing to its
// face. See buyBonusHoverStyle in the shared theme.
//
// Kept because the cut is the hard part and it is not obvious: if a later idea
// needs the glyph on its own, this produces it. Its output is not registered in
// assets.ts, so running it writes a file the game does not ship.
//
// That needs the glyph on its own, and it is not available on its own. The plate
// is assembled in design/generate_theme.mjs from a supplied PAINTING embedded as
// a data URI, so there is no vector path to re-render and no layer to export.
//
// ── why it is cut by high-pass and not by colour ──
//
// The obvious cut is by luminance, and it does not work. Measured on the plate:
//
//     paper, upper half     144        the glyph's own strokes    145
//     paper beside a stroke 135        paper, lower half          183
//
// The glyph is ten levels from the paper it sits on, while the paper itself
// travels eighty levels top to bottom under its own lighting gradient. Any
// threshold that catches the glyph catches half the paper with it.
//
// What separates them is not tone but RELIEF. The glyph is embossed: it has
// edges. The paper does not - it is a smooth gradient, and a smooth gradient is
// exactly what a blur reproduces. So subtracting a blurred copy leaves the
// glyph, the corner scrollwork and the border frame, and takes the lighting with
// it.
//
// The scrollwork and the frame are then removed by GEOMETRY rather than by any
// further cleverness: they are furniture at fixed positions on a plate that never
// changes, so an interior crop is both sufficient and honest about what it is.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/generate_buybonus_glyph.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'static/assets/sprites/soulSealUi/buybonus_plate.png');
const OUT = path.join(appRoot, 'static/assets/sprites/soulSealUi/buybonus_glyph.png');

// Blur radius. Wide enough that the paper's gradient survives it intact, narrow
// enough that the glyph's strokes do not.
const BLUR = 14;
// How far a pixel must sit from its own neighbourhood to count as relief.
const RELIEF = 22;
// The interior, as fractions of the plate. Outside this are the border frame and
// the four corner scrolls, which are relief too and are not the incantation.
// Tightened horizontally from 0.235: the talisman has an INNER panel edge as
// well as an outer frame, and a crop at 0.235 ran straight along it - so the lit
// glyph came out with a bright vertical bar down each side, which is the crop
// boundary itself showing.
const CROP = { x0: 0.285, x1: 0.715, y0: 0.245, y1: 0.775 };
// Softening pass, so the lit glyph has an edge that glows rather than one that
// cuts. In pixels of the 640px plate.
const FEATHER = 3;

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width: w, height: h, data } = png;

const lum = new Float32Array(w * h);
for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
	lum[j] = data[i + 3] > 200 ? (data[i] + data[i + 1] + data[i + 2]) / 3 : -1;
}

// summed-area table, so the blur is O(1) per pixel
const sat = new Float64Array((w + 1) * (h + 1));
for (let y = 0; y < h; y += 1) {
	let run = 0;
	for (let x = 0; x < w; x += 1) {
		run += Math.max(0, lum[w * y + x]);
		sat[(w + 1) * (y + 1) + x + 1] = sat[(w + 1) * y + x + 1] + run;
	}
}
const blurred = (cx, cy, r) => {
	const x0 = Math.max(0, cx - r);
	const x1 = Math.min(w - 1, cx + r);
	const y0 = Math.max(0, cy - r);
	const y1 = Math.min(h - 1, cy + r);
	const s =
		sat[(w + 1) * (y1 + 1) + x1 + 1] -
		sat[(w + 1) * y0 + x1 + 1] -
		sat[(w + 1) * (y1 + 1) + x0] +
		sat[(w + 1) * y0 + x0];
	return s / ((x1 - x0 + 1) * (y1 - y0 + 1));
};

const X0 = Math.round(w * CROP.x0);
const X1 = Math.round(w * CROP.x1);
const Y0 = Math.round(h * CROP.y0);
const Y1 = Math.round(h * CROP.y1);

const mask = new Float32Array(w * h);
let hits = 0;
for (let y = Y0; y < Y1; y += 1) {
	for (let x = X0; x < X1; x += 1) {
		const j = w * y + x;
		if (lum[j] < 0) continue;
		const relief = Math.abs(lum[j] - blurred(x, y, BLUR));
		if (relief <= RELIEF) continue;
		mask[j] = Math.min(1, (relief - RELIEF) / 34);
		hits += 1;
	}
}

// Feather, so the glow has a soft shoulder instead of an aliased edge.
const soft = new Float32Array(w * h);
for (let y = 0; y < h; y += 1) {
	for (let x = 0; x < w; x += 1) {
		let sum = 0;
		let n = 0;
		for (let dy = -FEATHER; dy <= FEATHER; dy += 1) {
			for (let dx = -FEATHER; dx <= FEATHER; dx += 1) {
				const yy = y + dy;
				const xx = x + dx;
				if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
				sum += mask[w * yy + xx];
				n += 1;
			}
		}
		soft[w * y + x] = sum / n;
	}
}

const out = new PNG({ width: w, height: h });
let lit = 0;
for (let y = 0; y < h; y += 1) {
	for (let x = 0; x < w; x += 1) {
		const j = w * y + x;
		const i = j * 4;
		const a = Math.min(1, soft[j] * 2.4);
		// White, so the sprite can be tinted to whatever the theme asks for.
		out.data[i] = 255;
		out.data[i + 1] = 255;
		out.data[i + 2] = 255;
		out.data[i + 3] = Math.round(a * 255);
		if (a > 0.05) lit += 1;
	}
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, PNG.sync.write(out));
console.log(
	`${w}x${h}: ${hits.toLocaleString()} relief px -> ${lit.toLocaleString()} lit ` +
		`(${((100 * lit) / (w * h)).toFixed(1)}% of the plate) -> ${path.relative(appRoot, OUT)}`,
);
