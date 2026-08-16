// Measure the dark inner well of each win-banner frame.
//
// The frames are supplied art with different aspect ratios and different border
// thicknesses, and the tier label and the amount have to sit inside the well -
// not centred on the image, which on the fiery top tier would put the text on
// top of the wings. Eyeballing five different insets is how text ends up
// half-covered on one tier and nobody notices until it is live, so this measures
// them: for each image it finds the largest run of near-black opaque pixels
// through the centre and reports the well as fractions of the image.
//
// Usage: node design/measure_banner_wells.mjs <dir containing node_modules with pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pngDir = process.argv[2];
if (!pngDir) {
	console.error('usage: node measure_banner_wells.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(pngDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(appRoot, 'static/assets/sprites/tripleWitchingWinBanners');

// "Well" = opaque and dark. The frames' borders are bright metal and neon, the
// outside is transparent, so this separates cleanly.
const isWell = (r, g, b, a) => a > 200 && r < 70 && g < 70 && b < 70;

for (const file of ['tier1', 'tier2', 'tier3', 'tier4', 'tier5']) {
	const png = PNG.sync.read(fs.readFileSync(path.join(DIR, `${file}.png`)));
	const { width, height, data } = png;
	const at = (x, y) => {
		const i = (y * width + x) * 4;
		return isWell(data[i], data[i + 1], data[i + 2], data[i + 3]);
	};

	// Horizontal extent: the longest well run along the vertical centre line.
	const midY = Math.floor(height / 2);
	let bestL = 0;
	let bestR = 0;
	let runStart = -1;
	for (let x = 0; x <= width; x++) {
		const on = x < width && at(x, midY);
		if (on && runStart === -1) runStart = x;
		if (!on && runStart !== -1) {
			if (x - runStart > bestR - bestL) {
				bestL = runStart;
				bestR = x;
			}
			runStart = -1;
		}
	}

	// Vertical extent: same, down the middle of that run.
	const midX = Math.floor((bestL + bestR) / 2);
	let bestT = 0;
	let bestB = 0;
	runStart = -1;
	for (let y = 0; y <= height; y++) {
		const on = y < height && at(midX, y);
		if (on && runStart === -1) runStart = y;
		if (!on && runStart !== -1) {
			if (y - runStart > bestB - bestT) {
				bestT = runStart;
				bestB = y;
			}
			runStart = -1;
		}
	}

	const cx = (bestL + bestR) / 2 / width - 0.5;
	const cy = (bestT + bestB) / 2 / height - 0.5;
	const w = (bestR - bestL) / width;
	const h = (bestB - bestT) / height;

	console.log(
		`${file}: ${width}x${height}  aspect ${(height / width).toFixed(3)}  ` +
			`well { cx: ${cx.toFixed(3)}, cy: ${cy.toFixed(3)}, w: ${w.toFixed(3)}, h: ${h.toFixed(3)} }`,
	);
}
