// Remove the white matte from the supplied win-banner frames.
//
// The art arrived rendered on opaque white - 0% transparent, about 30% of every
// image solid white - so drawing it in game would put a white rectangle around
// each banner. This keys that background out.
//
// A plain "white is transparent" threshold cannot be used: the neon cores and
// the flame highlights inside the frames are also near-white, and they would be
// punched into holes. So the background is found by flooding inward from the
// image border, which only reaches white that is connected to the outside. White
// enclosed by the frame is left alone.
//
// Within the flooded region the pixel is treated as foreground composited over
// white, C = F*a + 255*(1-a), and alpha is recovered as 1 - min(C)/255. That
// keeps the soft outer glow: a pure white pixel goes fully transparent, a pixel
// carrying colour keeps proportional alpha, and the colour is unpremultiplied so
// the glow does not darken.
//
// Source of truth is design/source/win_banners/ (the untouched originals), so
// this can be re-run and is not destructive to what was supplied.
//
// Usage: node design/dekey_win_banners.mjs <dir containing node_modules with pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node dekey_win_banners.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/win_banners');
const DST = path.join(appRoot, 'static/assets/sprites/marginCallWinBanners');

// Loose enough to follow the glow's fade a little way in, tight enough not to
// leak through the frame's lighter metal.
const FLOOD_MIN_CHANNEL = 200;

for (const file of ['tier1', 'tier2', 'tier3', 'tier4', 'tier5']) {
	const png = PNG.sync.read(fs.readFileSync(path.join(SRC, `${file}.png`)));
	const { width, height, data } = png;

	const minChannel = (i) => Math.min(data[i], data[i + 1], data[i + 2]);
	const outside = new Uint8Array(width * height);

	// Flood from every border pixel that is near-white.
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
	let softened = 0;
	for (let p = 0; p < width * height; p++) {
		if (!outside[p]) continue;
		const i = p * 4;
		const a = 1 - minChannel(i) / 255;
		// The matte is 252,252,252 rather than pure white, so "background" lands at
		// alpha 3/255 instead of 0. Anything under this is snapped to fully clear:
		// it is invisible either way, and unpremultiplying at alpha that low
		// divides by almost nothing and throws the colour to noise.
		if (a <= 0.05) {
			data[i + 3] = 0;
			cleared++;
			continue;
		}
		// unpremultiply from the white matte so the glow keeps its colour
		for (let c = 0; c < 3; c++) {
			data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - 255 * (1 - a)) / a)));
		}
		data[i + 3] = Math.round(a * 255);
		softened++;
	}

	fs.writeFileSync(path.join(DST, `${file}.png`), PNG.sync.write(png));
	const total = width * height;
	console.log(
		`${file}: ${width}x${height}  fully clear ${((cleared / total) * 100).toFixed(1)}%` +
			`  feathered ${((softened / total) * 100).toFixed(1)}%`,
	);
}

console.log('\nre-run design/preview_win_banners.mjs to see the result');
