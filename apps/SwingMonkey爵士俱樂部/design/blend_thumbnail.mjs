// Blend the monkey portrait panel into the cover's background.
//
// Thumbnail_GoBananas.png was assembled from two separate images: a monkey
// portrait (with its own bright, high-contrast sunset baked in) pasted as a hard
// rectangle onto a duller sunset background. The seam shows on three sides and
// the two sunsets read as different pictures.
//
// This does two things on the flattened image (the source layers are gone):
//   1. Dissolves the rectangle seam — a blurred copy is cross-faded in only
//      along a feather band straddling each panel edge, so the hard line melts
//      while the panel interior and the outer background both stay sharp.
//   2. Harmonises tone — a soft warm wash over the upper region plus a gentle
//      knock-down of the panel's over-bright sunburst, so the two sunsets settle
//      into one.
//
// Usage: node design/blend_thumbnail.mjs [in.png] [out.png]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PNG } = require('E:/stake/tools/gen/node_modules/pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inPath = process.argv[2] || path.join(appRoot, 'Thumbnail_GoBananas.orig.png');
const outPath = process.argv[3] || path.join(appRoot, 'Thumbnail_GoBananas.png');

const img = PNG.sync.read(fs.readFileSync(inPath));
const { width: W, height: H, data } = img;

// panel rectangle (measured from the source seams)
const L = 50,
	R = 356,
	T = 6,
	B = 304;
const FEATHER = 22; // seam band half-width
const BLUR_R = 9;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smoothstep = (a, b, x) => {
	const t = clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};

// signed distance to the panel rectangle boundary (negative inside)
const sdfRect = (x, y) => {
	const qx = Math.max(L - x, x - R);
	const qy = Math.max(T - y, y - B);
	const ax = Math.max(qx, 0),
		ay = Math.max(qy, 0);
	const outside = Math.hypot(ax, ay);
	const inside = Math.min(Math.max(qx, qy), 0);
	return outside + inside;
};

// ── separable box blur of the RGB channels ────────────────────────────────
const blurred = Buffer.from(data);
const boxBlur = (src, dst, horizontal) => {
	for (let a = 0; a < (horizontal ? H : W); a++) {
		for (let c = 0; c < 3; c++) {
			let sum = 0;
			const N = horizontal ? W : H;
			const at = (b) => {
				const x = horizontal ? b : a;
				const y = horizontal ? a : b;
				return src[(y * W + x) * 4 + c];
			};
			for (let b = -BLUR_R; b <= BLUR_R; b++) sum += at(clamp(b, 0, N - 1));
			for (let b = 0; b < N; b++) {
				const x = horizontal ? b : a;
				const y = horizontal ? a : b;
				dst[(y * W + x) * 4 + c] = Math.round(sum / (2 * BLUR_R + 1));
				sum -= at(clamp(b - BLUR_R, 0, N - 1));
				sum += at(clamp(b + BLUR_R + 1, 0, N - 1));
			}
		}
	}
};
const tmp = Buffer.from(data);
boxBlur(data, tmp, true);
boxBlur(tmp, blurred, false);

// ── compose ────────────────────────────────────────────────────────────────
for (let y = 0; y < H; y++) {
	for (let x = 0; x < W; x++) {
		const i = (y * W + x) * 4;

		// 1. seam dissolve — cross-fade the blur in only near the panel border
		const dist = Math.abs(sdfRect(x, y));
		const seam = 1 - smoothstep(0, FEATHER, dist);
		for (let c = 0; c < 3; c++) {
			data[i + c] = Math.round(data[i + c] * (1 - seam) + blurred[i + c] * seam);
		}

		// 2. tone harmonise, upper region only (leave the green band + text alone)
		if (y < 320) {
			const fade = 1 - smoothstep(300, 320, y); // ease out into the green
			let r = data[i],
				g = data[i + 1],
				b = data[i + 2];
			const lum = 0.3 * r + 0.59 * g + 0.11 * b;

			// tame the panel's over-bright sunburst so it doesn't out-glow the
			// surrounding sunset — pull only the very brightest values down a touch
			const hot = smoothstep(200, 255, lum);
			const tame = 1 - 0.14 * hot * fade;
			r *= tame;
			g *= tame;
			b *= tame;

			// soft unifying warm wash (a low-alpha sunset orange overlaid), which
			// gives both images one shared cast
			const WASH = [214, 120, 40];
			const wa = 0.1 * fade;
			r = r * (1 - wa) + WASH[0] * wa;
			g = g * (1 - wa) + WASH[1] * wa;
			b = b * (1 - wa) + WASH[2] * wa;

			data[i] = clamp(Math.round(r), 0, 255);
			data[i + 1] = clamp(Math.round(g), 0, 255);
			data[i + 2] = clamp(Math.round(b), 0, 255);
		}
	}
}

fs.writeFileSync(outPath, PNG.sync.write(img));
console.log('blended →', outPath);
