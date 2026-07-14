// Strip the AI-baked checkerboard "transparency" off design/source/Role.png
// (party hostess character) and emit a true-alpha, tightly-cropped sprite.
// Same class of problem as the symbol art (see HANDOFF §9: process_symbols.py
// flood-fill 去棋盤格) — the checker tones here are white 255 / gray ~180.
//
// Method: flood-fill from every border pixel across low-saturation light
// pixels (the checker tones), then peel two conditional halo rings off the
// silhouette edge and feather the final boundary by one pixel.
//
// Usage: node design/process_role.mjs <dir with node_modules for pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node process_role.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/Role.png');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/character');
fs.mkdirSync(OUT_DIR, { recursive: true });

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width: W, height: H, data } = png;

const idx = (x, y) => (y * W + x) * 4;
const isChecker = (x, y, minLight, maxSpread) => {
	const o = idx(x, y);
	const r = data[o], g = data[o + 1], b = data[o + 2];
	const spread = Math.max(r, g, b) - Math.min(r, g, b);
	return spread <= maxSpread && Math.min(r, g, b) >= minLight;
};

// pass 1: flood from all borders across checker tones
const bg = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push([x, 0], [x, H - 1]); }
for (let y = 0; y < H; y++) { stack.push([0, y], [W - 1, y]); }
while (stack.length) {
	const [x, y] = stack.pop();
	if (x < 0 || y < 0 || x >= W || y >= H || bg[y * W + x]) continue;
	if (!isChecker(x, y, 150, 14)) continue;
	bg[y * W + x] = 1;
	stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// pass 2: peel anti-alias halo — two rings of still-light pixels touching bg
for (let ring = 0; ring < 2; ring++) {
	const peel = [];
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (bg[y * W + x] || !isChecker(x, y, 135, 22)) continue;
			const touching =
				(x > 0 && bg[y * W + x - 1]) || (x < W - 1 && bg[y * W + x + 1]) ||
				(y > 0 && bg[(y - 1) * W + x]) || (y < H - 1 && bg[(y + 1) * W + x]);
			if (touching) peel.push(y * W + x);
		}
	}
	for (const p of peel) bg[p] = 1;
}

// apply alpha + one-pixel feather on the remaining boundary
for (let y = 0; y < H; y++) {
	for (let x = 0; x < W; x++) {
		const p = y * W + x;
		if (bg[p]) { data[idx(x, y) + 3] = 0; continue; }
		const touching =
			(x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) ||
			(y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
		if (touching) data[idx(x, y) + 3] = 140;
	}
}

// tight crop to opaque bounds + small pad
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) {
	for (let x = 0; x < W; x++) {
		if (data[idx(x, y) + 3] > 0) {
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}
}
const PAD = 6;
minX = Math.max(0, minX - PAD); minY = Math.max(0, minY - PAD);
maxX = Math.min(W - 1, maxX + PAD); maxY = Math.min(H - 1, maxY + PAD);
const cw = maxX - minX + 1, ch = maxY - minY + 1;
const out = new PNG({ width: cw, height: ch });
for (let y = 0; y < ch; y++) {
	for (let x = 0; x < cw; x++) {
		const so = idx(minX + x, minY + y), doff = (y * cw + x) * 4;
		out.data[doff] = data[so];
		out.data[doff + 1] = data[so + 1];
		out.data[doff + 2] = data[so + 2];
		out.data[doff + 3] = data[so + 3];
	}
}
fs.writeFileSync(path.join(OUT_DIR, 'party_hostess.png'), PNG.sync.write(out));
console.log(`wrote party_hostess.png ${cw}x${ch} (cropped from ${W}x${H})`);
