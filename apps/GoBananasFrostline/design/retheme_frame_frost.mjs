// Re-colour the reel housing and its panels from jungle brass into ice.
//
//   node design/retheme_frame_frost.mjs <dir with node_modules/pngjs>
//
// The frame is delivered PNG art with no generator behind it, so this is a
// TRANSFORM of that art rather than a redraw. Originals are copied to
// design/source/frame_jungle/ on the first run and are the input every time
// after, so the transform is idempotent and reversible: restore from there and
// the jungle housing is back, byte for byte.
//
// ── Why a transform and not new art ─────────────────────────────────────────
//
// Everything that makes the housing read as a made object — the bevels on the
// rail, the brushed streaks across the backing, the rivets, the wear on the
// corner caps — lives in its LUMINANCE. Redrawing it as flat ice slabs would
// throw all of that away and land where design/GEN2_ART_SPEC.md warns
// vector-drawn UI always lands: looking like placeholder art next to painted
// symbols. Keeping the luminance and replacing the hue keeps the object and
// changes the material.
//
// ── The one thing a single ramp gets wrong ──────────────────────────────────
//
// Mapping luminance alone flattens two materials into one wherever they happen
// to share a brightness: the olive rail and the darker parts of the brass frame
// sit close enough that they would come out the same slate, and the housing
// would lose its frame. So there are TWO ramps, and each pixel is blended
// between them by how GOLD it was — (R-B), which separates brass from olive
// cleanly because the olive is barely warmer than neutral and the brass is very.
//
//   metal ramp    what the brass becomes: lit ice, bright and cool
//   body ramp     what the olive and the backing become: slate
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pngDir = process.argv[2];
if (!pngDir) {
	console.error('usage: node design/retheme_frame_frost.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(pngDir, 'noop.js'));
const { PNG } = require('pngjs');

const DESIGN = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(DESIGN, '..');
const LIVE = path.join(APP, 'static/assets/sprites/goBananasFrame');
const ORIG = path.join(DESIGN, 'source/frame_jungle');
fs.mkdirSync(ORIG, { recursive: true });

const FILES = ['frame_bg.png', 'frame_edge.png', 'fs_counter_panel.png', 'fs_sign.png'];

/** Ramp lookup: stops are [luminance, r, g, b], linearly interpolated. */
const ramp = (stops) => (l) => {
	const x = Math.max(0, Math.min(1, l));
	for (let i = 1; i < stops.length; i++) {
		if (x <= stops[i][0]) {
			const [l0, r0, g0, b0] = stops[i - 1];
			const [l1, r1, g1, b1] = stops[i];
			const u = l1 === l0 ? 0 : (x - l0) / (l1 - l0);
			return [r0 + (r1 - r0) * u, g0 + (g1 - g0) * u, b0 + (b1 - b0) * u];
		}
	}
	const s = stops[stops.length - 1];
	return [s[1], s[2], s[3]];
};

// Brass -> lit ice. The top end is deliberately not pure white: a frame that
// clips to white loses its own bevel at exactly the brightest points, which are
// the rivets and the corner caps.
const metal = ramp([
	[0.0, 8, 14, 22],
	[0.18, 26, 46, 66],
	[0.38, 58, 104, 142],
	[0.58, 120, 180, 218],
	[0.78, 186, 226, 248],
	[1.0, 240, 252, 255],
]);

// Olive rail and the dark backing -> slate. Flatter and darker than the metal
// ramp: this is the body of the housing and it must stay behind the frame.
const body = ramp([
	[0.0, 5, 8, 13],
	[0.2, 20, 28, 40],
	[0.45, 40, 56, 76],
	[0.7, 78, 106, 134],
	[1.0, 168, 200, 224],
]);

let touched = 0;
for (const file of FILES) {
	const orig = path.join(ORIG, file);
	const live = path.join(LIVE, file);
	if (!fs.existsSync(orig)) {
		if (!fs.existsSync(live)) {
			console.error(`missing ${file} in both ${path.relative(APP, ORIG)} and the live folder`);
			process.exit(1);
		}
		fs.copyFileSync(live, orig);
		console.log(`kept original  ${file}`);
	}

	const png = PNG.sync.read(fs.readFileSync(orig));
	for (let i = 0; i < png.data.length; i += 4) {
		const a = png.data[i + 3];
		if (a === 0) continue;
		const r = png.data[i];
		const g = png.data[i + 1];
		const b = png.data[i + 2];
		// Rec.709 luminance, which is what keeps the bevels where they were
		const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
		// how brass this pixel was, 0..1
		const gold = Math.max(0, Math.min(1, (r - b) / 110));
		const m = metal(l);
		const bo = body(l);
		for (let c = 0; c < 3; c++) {
			png.data[i + c] = Math.round(bo[c] + (m[c] - bo[c]) * gold);
		}
	}
	fs.writeFileSync(live, PNG.sync.write(png));
	console.log(`re-themed      ${file}  ${png.width}x${png.height}`);
	touched++;
}

console.log(`\n${touched} file(s) re-themed. Originals in ${path.relative(APP, ORIG)} —`);
console.log('restore from there to get the jungle housing back.');
