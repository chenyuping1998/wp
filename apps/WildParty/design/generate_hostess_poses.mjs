// Split the 4-pose party-hostess grid (Gemini, solid pink background) into four
// true-alpha sprites for the Plan-A pose-switch system (PartyHostess.svelte):
//   idle · toast · surprised · anticipate
//
// The four cells share one generation grid, so the figure sits at the same
// place in every cell. We key each cell against the pink background, then crop
// ALL FOUR to a single shared union bbox — so a given body pixel lands at the
// same canvas coordinate in every output. That makes cross-fading between poses
// jump-free: only the arms/head differ, the body core stays locked.
//
// Pink-background key: the backdrop is a light magenta (R maxed, B high, G the
// lowest channel) — B > G separates it cleanly from warm skin (B lowest) and
// the champagne gold (B low). Flood-filled from the borders so interior pink-ish
// highlights (pearls, bubbles) are never touched.
//
// Usage: node design/generate_hostess_poses.mjs <dir with node_modules/pngjs> [srcImage]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node generate_hostess_poses.mjs <dir with node_modules/pngjs> [srcImage]');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/character');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SRC =
	process.argv[3] ||
	path.join(appRoot, 'design/source/hostess_poses.png');

const grid = PNG.sync.read(fs.readFileSync(SRC));
const { width: GW, height: GH } = grid;

// 2×2 layout → cell size
const CW = Math.floor(GW / 2);
const CH = Math.floor(GH / 2);
// cell → output name, in the grid order shown (row-major)
const CELLS = [
	{ name: 'idle', col: 0, row: 0 },
	{ name: 'toast', col: 1, row: 0 },
	{ name: 'surprised', col: 0, row: 1 },
	{ name: 'anticipate', col: 1, row: 1 },
];

// --- magenta-background test ----------------------------------------------
// backdrop is a magenta with a centre-bright gradient: dark corners ≈(171,45,
// 109), bright centre ≈(255,200,240). In every case green is the MIN channel,
// clearly below both red and blue. Every warm character tone (skin, brown suit,
// champagne gold) instead has blue as the min channel (B < G). So "green is the
// low channel, with real chroma on both sides" keys the backdrop and nothing
// on the figure.
const isPink = (r, g, b) => r - g > 24 && b - g > 16;

// key one cell in place: returns { data, W, H } with alpha applied, plus bbox
const keyCell = ({ col, row }) => {
	const ox = col * CW,
		oy = row * CH;
	const png = new PNG({ width: CW, height: CH });
	for (let y = 0; y < CH; y++) {
		for (let x = 0; x < CW; x++) {
			const so = ((oy + y) * GW + (ox + x)) * 4;
			const doff = (y * CW + x) * 4;
			png.data[doff] = grid.data[so];
			png.data[doff + 1] = grid.data[so + 1];
			png.data[doff + 2] = grid.data[so + 2];
			png.data[doff + 3] = grid.data[so + 3];
		}
	}
	const data = png.data;
	const W = CW,
		H = CH;
	const idx = (x, y) => (y * W + x) * 4;
	const pink = (x, y) => {
		const o = idx(x, y);
		return isPink(data[o], data[o + 1], data[o + 2]);
	};

	// pass 1: clear ALL magenta pixels. The figure contains no magenta (every
	// warm tone has B < G), so a global test also empties the enclosed pockets
	// the border flood can't reach — arm crooks, the elbow-to-torso gap, the
	// space beside the bag.
	const bg = new Uint8Array(W * H);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (pink(x, y)) bg[y * W + x] = 1;
		}
	}

	// pass 2: peel the anti-alias halo — rings of still-pinkish pixels adjacent
	// to background (looser test so the soft magenta fringe comes off too)
	const pinkish = (x, y) => {
		const o = idx(x, y);
		const r = data[o],
			g = data[o + 1],
			b = data[o + 2];
		return r - g > 10 && b - g > 5;
	};
	for (let ring = 0; ring < 3; ring++) {
		const peel = [];
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				if (bg[y * W + x] || !pinkish(x, y)) continue;
				const p = y * W + x;
				const touching =
					(x > 0 && bg[p - 1]) ||
					(x < W - 1 && bg[p + 1]) ||
					(y > 0 && bg[p - W]) ||
					(y < H - 1 && bg[p + W]);
				if (touching) peel.push(p);
			}
		}
		if (!peel.length) break;
		for (const p of peel) bg[p] = 1;
	}

	// apply alpha + soft 2px feather on the boundary
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const p = y * W + x;
			if (bg[p]) {
				data[idx(x, y) + 3] = 0;
				continue;
			}
			// count bg neighbours in a 2-ring for a gentle edge ramp
			let near = 0,
				tot = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const nx = x + dx,
						ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
					tot++;
					if (bg[ny * W + nx]) near++;
				}
			}
			if (near > 0) {
				const keep = 1 - (near / tot) * 0.7;
				data[idx(x, y) + 3] = Math.round(data[idx(x, y) + 3] * keep);
			}
		}
	}

	// bbox of opaque pixels
	let minX = W,
		minY = H,
		maxX = 0,
		maxY = 0;
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (data[idx(x, y) + 3] > 8) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	return { data, W, H, bbox: { minX, minY, maxX, maxY } };
};

// key every cell, then take the union bbox so all four crop identically
const keyed = CELLS.map((c) => ({ ...c, ...keyCell(c) }));
const uni = keyed.reduce(
	(a, k) => ({
		minX: Math.min(a.minX, k.bbox.minX),
		minY: Math.min(a.minY, k.bbox.minY),
		maxX: Math.max(a.maxX, k.bbox.maxX),
		maxY: Math.max(a.maxY, k.bbox.maxY),
	}),
	{ minX: CW, minY: CH, maxX: 0, maxY: 0 },
);
const PAD = 4;
uni.minX = Math.max(0, uni.minX - PAD);
uni.minY = Math.max(0, uni.minY - PAD);
uni.maxX = Math.min(CW - 1, uni.maxX + PAD);
uni.maxY = Math.min(CH - 1, uni.maxY + PAD);
const OW = uni.maxX - uni.minX + 1;
const OH = uni.maxY - uni.minY + 1;

// per-pose horizontal anchor = hip-band centroid. The arms swing wildly between
// poses (a raised toast arm, a hand to the mouth) so the torso centroid is
// unusable; the hip is the stable body axis. Anchoring each pose on its own hip
// column keeps the body locked in place across cross-fades — no left/right
// drift when switching. Measured in output space over the 48–56% height band.
const hipAnchor = (k) => {
	const { data, W } = k;
	let sum = 0,
		n = 0;
	const y0 = uni.minY + Math.round(OH * 0.48);
	const y1 = uni.minY + Math.round(OH * 0.56);
	for (let y = y0; y < y1; y++) {
		for (let x = uni.minX; x <= uni.maxX; x++) {
			if (data[(y * W + x) * 4 + 3] > 60) {
				sum += x - uni.minX;
				n++;
			}
		}
	}
	return n ? Number((sum / n / OW).toFixed(4)) : 0.5;
};
const anchors = Object.fromEntries(keyed.map((k) => [k.name, hipAnchor(k)]));

for (const k of keyed) {
	const out = new PNG({ width: OW, height: OH });
	for (let y = 0; y < OH; y++) {
		for (let x = 0; x < OW; x++) {
			const so = ((uni.minY + y) * k.W + (uni.minX + x)) * 4;
			const doff = (y * OW + x) * 4;
			out.data[doff] = k.data[so];
			out.data[doff + 1] = k.data[so + 1];
			out.data[doff + 2] = k.data[so + 2];
			out.data[doff + 3] = k.data[so + 3];
		}
	}
	fs.writeFileSync(path.join(OUT_DIR, `party_hostess_${k.name}.png`), PNG.sync.write(out));
	console.log(`wrote party_hostess_${k.name}.png ${OW}x${OH}`);
}

const manifest = {
	imageWidth: OW,
	imageHeight: OH,
	anchorY: 1,
	// per-pose hip-column anchor keeps the body axis fixed across cross-fades
	anchors,
	poses: CELLS.map((c) => c.name),
};
fs.writeFileSync(
	path.join(appRoot, 'src/game/hostessPoses.json'),
	JSON.stringify(manifest, null, '\t') + '\n',
);
console.log('wrote src/game/hostessPoses.json', manifest);
