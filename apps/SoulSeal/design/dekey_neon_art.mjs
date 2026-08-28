// Cut neon line art off its flat dark background.
//
// This is a SEPARATE script from dekey_supplied_art.mjs on purpose, not a mode
// added to it. That one keys a WHITE matte and has to flood inward from the
// border so that white *enclosed by* the art stays opaque - a symbol's own
// highlights must not be punched into holes.
//
// Neon line art on black is the opposite problem in both halves:
//
//   * there is nothing to protect. The inside of a bag outline is background and
//     has to go clear as well, so flooding from the border would be wrong - it
//     would leave the middle of every bag as an opaque black blob.
//   * alpha is recoverable directly. Over a black matte the compositing is
//     C = F*a, so a is just the brightest channel, and the glow's falloff comes
//     out of that for free instead of having to be feathered back in.
//
// So this is a per-pixel pass with no flood at all, which is why sharing code
// with the other script would have meant sharing only the file reading.
//
// The matte is measured from the image border rather than assumed to be pure
// black - the supplied bags sit on about (21,20,24), and treating that as 0
// would leave a faint grey wash over the whole sprite.
//
// design/source/ holds the untouched originals and is the only input.
//
// Usage: node design/dekey_neon_art.mjs <dir containing node_modules with pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node dekey_neon_art.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SETS = [['design/source/bags', 'static/assets/sprites/soulSealBags']];

// Below this the pixel is matte plus sensor noise. Kept low so the outer glow
// survives - it is most of what makes the art read as neon.
const CLEAR_BELOW_ALPHA = 0.03;

for (const [srcRel, dstRel] of SETS) {
	const src = path.join(appRoot, srcRel);
	const dst = path.join(appRoot, dstRel);
	if (!fs.existsSync(src)) continue;
	fs.mkdirSync(dst, { recursive: true });

	console.log(`${srcRel} -> ${dstRel}`);
	for (const file of fs.readdirSync(src).filter((f) => f.endsWith('.png'))) {
		const png = PNG.sync.read(fs.readFileSync(path.join(src, file)));
		const { width, height, data } = png;

		// Supplied cut out already? Nothing to do.
		if (data[3] < 16) {
			fs.copyFileSync(path.join(src, file), path.join(dst, file));
			console.log(`  ${file}: already cut out, copied as-is`);
			continue;
		}

		// Matte = the median of the border ring, per channel. Median rather than
		// mean so a stray bright pixel touching the edge cannot drag it up.
		const border = [[], [], []];
		const sample = (x, y) => {
			const i = (y * width + x) * 4;
			for (let c = 0; c < 3; c++) border[c].push(data[i + c]);
		};
		for (let x = 0; x < width; x++) {
			sample(x, 0);
			sample(x, height - 1);
		}
		for (let y = 0; y < height; y++) {
			sample(0, y);
			sample(width - 1, y);
		}
		const matte = border.map((channel) => {
			channel.sort((a, b) => a - b);
			return channel[channel.length >> 1];
		});

		let cleared = 0;
		let kept = 0;
		let peak = [0, 0, 0];
		let peakAlpha = 0;
		for (let p = 0; p < width * height; p++) {
			const i = p * 4;
			const above = [0, 1, 2].map((c) => Math.max(0, data[i + c] - matte[c]));
			const a = Math.max(above[0], above[1], above[2]) / 255;
			if (a <= CLEAR_BELOW_ALPHA) {
				data[i] = data[i + 1] = data[i + 2] = 0;
				data[i + 3] = 0;
				cleared++;
				continue;
			}
			// Unpremultiply: the stored colour is F*a over black, so dividing by a
			// recovers the neon's own colour and keeps the glow's edge soft rather
			// than letting it darken towards the matte.
			for (let c = 0; c < 3; c++) {
				data[i + c] = Math.max(0, Math.min(255, Math.round(above[c] / a)));
			}
			data[i + 3] = Math.round(a * 255);
			kept++;
			if (a > peakAlpha) {
				peakAlpha = a;
				peak = [data[i], data[i + 1], data[i + 2]];
			}
		}

		fs.writeFileSync(path.join(dst, file), PNG.sync.write(png));
		const hex = `#${peak.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
		console.log(
			`  ${file}: ${width}x${height} matte rgb(${matte.join(',')}) ` +
				`-> ${kept} px kept, ${cleared} cleared, brightest ${hex}`,
		);
	}
}
