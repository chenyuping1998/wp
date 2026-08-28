// Remove the white matte from supplied art.
//
// Art has arrived twice now rendered on opaque white rather than on
// transparency - the win banner frames, then five symbols. Drawn as-is that puts
// a white rectangle around a banner and a white border around a symbol tile, on a
// board that is nearly black.
//
// A plain "white is transparent" threshold cannot be used: neon cores, flame
// highlights and the light parts of a symbol are also near-white and would be
// punched into holes. So the background is found by flooding inward from the
// image border, which only ever reaches white connected to the outside. White
// enclosed by the art is left alone.
//
// Inside the flooded region the pixel is treated as foreground over white,
// C = F*a + 255*(1-a), and alpha is recovered as 1 - min(C)/255. A pure white
// pixel goes fully clear; a pixel carrying colour keeps proportional alpha and is
// unpremultiplied, so a soft outer glow survives instead of being cut off.
//
// design/source/ holds the untouched originals and is the only input. Running
// this is not destructive to what was supplied, and it is how supplied art gets
// into static/ at all - nothing else writes those files.
//
// Usage: node design/dekey_supplied_art.mjs <dir containing node_modules with pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node dekey_supplied_art.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// source directory -> destination directory
// The win banners were supplied art and are generated again now
// (generate_theme.mjs), so they are deliberately NOT in this list - keying
// them here would overwrite the generated set on the next run. The originals
// stay in design/source/win_banners as a reference.
const SETS = [['design/source/symbols', 'static/assets/sprites/tripleWitchingSymbols']];

// Loose enough to follow a glow's fade a little way in, tight enough not to leak
// through the lighter metal of a frame or the pale parts of a symbol.
const FLOOD_MIN_CHANNEL = 200;

// The mattes are not pure white (252,252,252 is common), so "background" lands at
// alpha 3/255 rather than 0. Anything under this is snapped fully clear: it is
// invisible either way, and unpremultiplying at alpha that low divides by almost
// nothing and throws the colour to noise.
const CLEAR_BELOW_ALPHA = 0.05;

let processed = 0;
let skipped = 0;

for (const [srcRel, dstRel] of SETS) {
	const src = path.join(appRoot, srcRel);
	const dst = path.join(appRoot, dstRel);
	if (!fs.existsSync(src)) continue;
	fs.mkdirSync(dst, { recursive: true });

	console.log(`${srcRel} -> ${dstRel}`);
	for (const file of fs.readdirSync(src).filter((f) => f.endsWith('.png'))) {
		const png = PNG.sync.read(fs.readFileSync(path.join(src, file)));
		const { width, height, data } = png;

		// Already transparent somewhere round the edge? Then it was supplied cut
		// out and there is nothing to key - copy it through untouched.
		const cornerAlpha = Math.max(
			data[3],
			data[(width - 1) * 4 + 3],
			data[(height - 1) * width * 4 + 3],
			data[(height * width - 1) * 4 + 3],
		);
		if (cornerAlpha < 16) {
			fs.copyFileSync(path.join(src, file), path.join(dst, file));
			console.log(`  ${file}: already cut out, copied as-is`);
			skipped++;
			continue;
		}

		const minChannel = (i) => Math.min(data[i], data[i + 1], data[i + 2]);
		const outside = new Uint8Array(width * height);
		const stack = [];
		const push = (x, y) => {
			if (x < 0 || y < 0 || x >= width || y >= height) return;
			const p = y * width + x;
			if (outside[p]) return;
			if (minChannel(p * 4) < FLOOD_MIN_CHANNEL) return;
			outside[p] = 1;
			stack.push(p);
		};
		for (let x = 0; x < width; x++) {
			push(x, 0);
			push(x, height - 1);
		}
		for (let y = 0; y < height; y++) {
			push(0, y);
			push(width - 1, y);
		}
		while (stack.length) {
			const p = stack.pop();
			const x = p % width;
			const y = (p - x) / width;
			push(x + 1, y);
			push(x - 1, y);
			push(x, y + 1);
			push(x, y - 1);
		}

		let cleared = 0;
		let feathered = 0;
		for (let p = 0; p < width * height; p++) {
			if (!outside[p]) continue;
			const i = p * 4;
			const a = 1 - minChannel(i) / 255;
			if (a <= CLEAR_BELOW_ALPHA) {
				data[i + 3] = 0;
				cleared++;
				continue;
			}
			for (let c = 0; c < 3; c++) {
				data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - 255 * (1 - a)) / a)));
			}
			data[i + 3] = Math.round(a * 255);
			feathered++;
		}

		// ── the halo ────────────────────────────────────────────────────────
		// The flood stops as soon as a pixel is darker than FLOOD_MIN_CHANNEL, but
		// the edge of the art is antialiased: there is a ring one or two pixels
		// wide that is a blend of the white matte and the artwork, too dark for
		// the flood to enter and too light to belong to the art. Left alone it
		// stays fully opaque and reads as a thin white outline around every
		// symbol - which is exactly what it did.
		//
		// Those pixels can be told apart from the art by colour, not brightness:
		// matte residue is near-grey, the art here is saturated neon. So the ring
		// just outside the art is walked, and only the near-grey, bright pixels in
		// it are keyed. Keying on brightness alone would eat the tile's own bright
		// border, which is saturated and must stay opaque.
		const MAX_HALO_CHROMA = 34;
		const MIN_HALO_LEVEL = 128;
		const HALO_DEPTH = 2;

		let halo = 0;
		let frontier = new Set();
		for (let p = 0; p < width * height; p++) if (outside[p]) frontier.add(p);

		for (let step = 0; step < HALO_DEPTH; step++) {
			const next = new Set();
			for (const p of frontier) {
				const x = p % width;
				const y = (p - x) / width;
				for (const [nx, ny] of [
					[x + 1, y],
					[x - 1, y],
					[x, y + 1],
					[x, y - 1],
				]) {
					if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
					const q = ny * width + nx;
					if (outside[q]) continue;
					const i = q * 4;
					const min = Math.min(data[i], data[i + 1], data[i + 2]);
					const max = Math.max(data[i], data[i + 1], data[i + 2]);
					if (max - min > MAX_HALO_CHROMA || min < MIN_HALO_LEVEL) continue;
					const a = 1 - min / 255;
					if (a <= CLEAR_BELOW_ALPHA) {
						data[i + 3] = 0;
					} else {
						for (let c = 0; c < 3; c++) {
							data[i + c] = Math.max(
								0,
								Math.min(255, Math.round((data[i + c] - 255 * (1 - a)) / a)),
							);
						}
						data[i + 3] = Math.round(a * 255);
					}
					outside[q] = 1;
					next.add(q);
					halo++;
				}
			}
			frontier = next;
		}

		fs.writeFileSync(path.join(dst, file), PNG.sync.write(png));
		const total = width * height;
		console.log(
			`  ${file}: ${width}x${height}  clear ${((cleared / total) * 100).toFixed(1)}%` +
				`  feathered ${((feathered / total) * 100).toFixed(1)}%  halo ${halo}px`,
		);
		processed++;
	}
}

console.log(`\n${processed} keyed, ${skipped} already cut out`);
