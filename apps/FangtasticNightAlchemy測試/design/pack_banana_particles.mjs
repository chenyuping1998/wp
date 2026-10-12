// Pack the individual banana cut-outs into one TexturePacker-format sheet for
// the win particle emitter.
//
// The emitter hands the whole sheet to `upgradeConfig`, which gives each
// particle ONE randomly chosen frame and then spins it with rotationSpeed. So
// the frames are not an animation — they are ten different viewing angles of the
// same banana, and a particle picks one and tumbles. That is why the angles have
// to be spread (side, three-quarter, end-on); ten near-identical side views
// would read as one image being rotated.
//
// Output matches the shape of the coin sheet it replaces (SD2_Coin.json), which
// is what pixi's Assets loader expects: `frames` keyed by filename, plus `meta`.
//
// Usage: node design/pack_banana_particles.mjs <toolsDir>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node pack_banana_particles.mjs <toolsDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(appRoot, 'design/source/banana_particles');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/goBananasWinBananas');
fs.mkdirSync(OUT_DIR, { recursive: true });

// 256 rather than the sources' 512: the particle is drawn at scale 0.3-0.4, so
// even 256 is already more than it can show, and halving it quarters the atlas.
const CELL = 256;
const COLS = 5;

const files = fs
	.readdirSync(SRC_DIR)
	.filter((f) => /^banana_\d+\.png$/i.test(f))
	.sort();
if (files.length === 0) {
	console.error('no banana_NN.png in ' + path.relative(appRoot, SRC_DIR));
	process.exit(1);
}

const resize = (src, size) => {
	const out = new PNG({ width: size, height: size });
	const sc = src.width / size;
	for (let y = 0; y < size; y++)
		for (let x = 0; x < size; x++) {
			const fx = Math.min(src.width - 1, x * sc), fy = Math.min(src.height - 1, y * sc);
			const x0 = Math.floor(fx), y0 = Math.floor(fy);
			const x1 = Math.min(src.width - 1, x0 + 1), y1 = Math.min(src.height - 1, y0 + 1);
			const tx = fx - x0, ty = fy - y0;
			const d = (y * size + x) * 4;
			for (let c = 0; c < 4; c++) {
				const g = (gx, gy) => src.data[(gy * src.width + gx) * 4 + c];
				out.data[d + c] = Math.round(
					g(x0,y0)*(1-tx)*(1-ty) + g(x1,y0)*tx*(1-ty) + g(x0,y1)*(1-tx)*ty + g(x1,y1)*tx*ty,
				);
			}
		}
	return out;
};

const rows = Math.ceil(files.length / COLS);
const sheet = new PNG({ width: COLS * CELL, height: rows * CELL });
sheet.data.fill(0);

const frames = {};
files.forEach((file, i) => {
	const src = PNG.sync.read(fs.readFileSync(path.join(SRC_DIR, file)));
	const cell = src.width === CELL ? src : resize(src, CELL);
	const cx = (i % COLS) * CELL, cy = Math.floor(i / COLS) * CELL;
	for (let y = 0; y < CELL; y++)
		for (let x = 0; x < CELL; x++) {
			const s = (y * CELL + x) * 4, d = ((cy + y) * sheet.width + cx + x) * 4;
			for (let c = 0; c < 4; c++) sheet.data[d + c] = cell.data[s + c];
		}
	frames[file] = {
		frame: { x: cx, y: cy, w: CELL, h: CELL },
		rotated: false,
		trimmed: false,
		spriteSourceSize: { x: 0, y: 0, w: CELL, h: CELL },
		sourceSize: { w: CELL, h: CELL },
	};
	console.log(`  ${file} -> cell ${i} (${cx},${cy})`);
});

fs.writeFileSync(path.join(OUT_DIR, 'bananas.png'), PNG.sync.write(sheet));
fs.writeFileSync(
	path.join(OUT_DIR, 'bananas.json'),
	JSON.stringify(
		{
			frames,
			animations: { banana: files },
			meta: {
				app: 'design/pack_banana_particles.mjs',
				version: '1.0',
				image: 'bananas.png',
				format: 'RGBA8888',
				size: { w: sheet.width, h: sheet.height },
				scale: '1',
			},
		},
		null,
		'\t',
	),
);
console.log(`\npacked ${files.length} frames -> ${path.relative(appRoot, OUT_DIR)} (${sheet.width}x${sheet.height})`);
