// Recolors the two remaining Mining Madness text-banner sheets (16-language
// "press anywhere" prompt + ~20-language "you won / free spins" banner) into
// the party gold/orange/plum palette, WITHOUT touching the glyph shapes or the
// sprite-sheet .json coordinates — every language's existing lettering is kept,
// only its color ramp is remapped (like a Photoshop gradient map), so no
// translation/retypesetting is needed and PressToContinue.svelte /
// FreeSpinIntro.svelte need zero changes.
// Usage: node design/generate_text_banners_party.mjs <dir containing node_modules with pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pngjsDir = process.argv[2];
if (!pngjsDir) {
	console.error('usage: node generate_text_banners_party.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(pngjsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// gradient-map stops, keyed by source luminance 0..255 — same palette as
// banner_big.png / the new party bitmap font (outline -> orange -> gold -> shine)
const STOPS = [
	{ t: 0, c: [0x2a, 0x0a, 0x20] },
	{ t: 60, c: [0x2a, 0x0a, 0x20] },
	{ t: 130, c: [0xe8, 0x93, 0x0c] },
	{ t: 195, c: [0xff, 0xe0, 0x66] },
	{ t: 255, c: [0xff, 0xf7, 0xd1] },
];

const gradientMap = (lum) => {
	for (let i = 0; i < STOPS.length - 1; i++) {
		const a = STOPS[i];
		const b = STOPS[i + 1];
		if (lum >= a.t && lum <= b.t) {
			const f = (lum - a.t) / (b.t - a.t || 1);
			return [
				Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
				Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
				Math.round(a.c[2] + (b.c[2] - a.c[2]) * f),
			];
		}
	}
	return STOPS[STOPS.length - 1].c;
};

// freeSpins.png already carries a baked-in light/dark gradient per letter, so
// a straight luminance gradient-map recolor reproduces the same shading in
// the new palette.
{
	const file = path.join(appRoot, 'static/assets/sprites/freeSpins/freeSpins.png');
	const png = PNG.sync.read(fs.readFileSync(file));
	const { width, height, data } = png;
	for (let i = 0; i < width * height; i++) {
		const o = i * 4;
		if (data[o + 3] === 0) continue;
		const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
		const [nr, ng, nb] = gradientMap(lum);
		data[o] = nr;
		data[o + 1] = ng;
		data[o + 2] = nb;
	}
	fs.writeFileSync(file, PNG.sync.write(png));
	console.log('recolored', path.relative(appRoot, file), `(${width}x${height})`);
}

// MM_pressanywhere.png is a FLAT WHITE silhouette (alpha carries 100% of the
// shape/AA, RGB is always 255,255,255) — a luminance gradient-map can't do
// anything with that. Instead: paint a gold fill and synthesize a dark-plum
// outline by detecting pixels near the alpha edge (radius check).
{
	const file = path.join(appRoot, 'static/assets/sprites/pressToContinueText/MM_pressanywhere.png');
	const png = PNG.sync.read(fs.readFileSync(file));
	const { width, height, data } = png;
	const alphaAt = (x, y) => {
		if (x < 0 || y < 0 || x >= width || y >= height) return 0;
		return data[(y * width + x) * 4 + 3];
	};
	const R = 1;
	const out = Buffer.from(data);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const o = (y * width + x) * 4;
			const alpha = data[o + 3];
			if (alpha === 0) continue;
			let nearEdge = false;
			for (let dy = -R; dy <= R && !nearEdge; dy++) {
				for (let dx = -R; dx <= R; dx++) {
					if (alphaAt(x + dx, y + dy) < 160) {
						nearEdge = true;
						break;
					}
				}
			}
			if (nearEdge) {
				out[o] = 0x2a;
				out[o + 1] = 0x0a;
				out[o + 2] = 0x20;
			} else {
				// gentle top-to-bottom shine within the whole canvas
				const t = y / height;
				const [nr, ng, nb] = gradientMap(255 - t * 90);
				out[o] = nr;
				out[o + 1] = ng;
				out[o + 2] = nb;
			}
		}
	}
	png.data = out;
	fs.writeFileSync(file, PNG.sync.write(png));
	console.log('recolored', path.relative(appRoot, file), `(${width}x${height})`);
}
console.log('done');
