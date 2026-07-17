// Win-tier banner plaques (big/superwin/mega/epic/max) — chroma-keys the
// AI-painted JPGs in static/assets/sprites/new_symbols off their solid
// magenta background and writes tight-cropped transparent PNGs to
// static/assets/sprites/winBanners/<alias>.png, plus a geometry manifest
// (src/game/winBanners.json) so Win.svelte knows each plaque's aspect.
//
// JPGs are decoded by rendering them through resvg (pngjs is PNG-only).
//
// Usage: node design/process_win_banners.mjs <dir with node_modules for @resvg/resvg-js + pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node process_win_banners.mjs <toolsDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(appRoot, 'static/assets/sprites/new_symbols');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/winBanners');
fs.mkdirSync(OUT_DIR, { recursive: true });

// src file → win-level alias (matches winLevelMap aliases)
const BANNERS = {
	bigwin: 'big',
	superwin: 'superwin',
	megawin: 'mega',
	epicwin: 'epic',
	maxwin: 'max',
};

// baked-in light beams hug specific corners on some renders and stay
// connected to the plaque through glow pixels, so the island filter can't
// drop them — force-clear these corner boxes (fractions of source size)
const CORNER_CUTS = {
	mega: [
		[0, 0, 0.42, 0.18],
		[0, 0, 0.26, 0.22],
		[0, 0, 0.1, 0.42],
	],
	max: [
		[0.8, 0, 1, 0.32],
		[0.7, 0, 1, 0.08],
		[0.92, 0, 1, 0.46],
		[0, 0, 0.16, 0.22],
	],
	epic: [
		[0, 0, 0.13, 0.15],
		[0.87, 0, 1, 0.15],
	],
};

// minimal JPEG SOF parse for dimensions
const jpegSize = (buf) => {
	let i = 2;
	while (i < buf.length) {
		if (buf[i] !== 0xff) { i++; continue; }
		const marker = buf[i + 1];
		if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
			return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
		}
		i += 2 + buf.readUInt16BE(i + 2);
	}
	throw new Error('no SOF');
};

const jpgToPng = (file) => {
	const buf = fs.readFileSync(file);
	const { width, height } = jpegSize(buf);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><image href="data:image/jpeg;base64,${buf.toString('base64')}" width="${width}" height="${height}"/></svg>`;
	return PNG.sync.read(
		new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng(),
	);
};

const manifest = {};

for (const [srcName, alias] of Object.entries(BANNERS)) {
	const png = jpgToPng(path.join(SRC_DIR, `${srcName}.jpg`));
	const { width: W, height: H, data } = png;
	const idx = (x, y) => (y * W + x) * 4;

	// magenta bg reference from the border average. Classification is by HUE
	// DIRECTION (normalised colour vector vs the bg's) — immune to the JPEG
	// noise and corner vignette that defeat step/distance gates. Gold, velvet
	// and the neon-pink rim all point in measurably different directions.
	let br = 0, bgc = 0, bb = 0, bn = 0;
	for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const o = idx(x, y); br += data[o]; bgc += data[o + 1]; bb += data[o + 2]; bn++; }
	for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { const o = idx(x, y); br += data[o]; bgc += data[o + 1]; bb += data[o + 2]; bn++; }
	br /= bn; bgc /= bn; bb /= bn;
	const bgLen = Math.sqrt(br * br + bgc * bgc + bb * bb) || 1;
	const bnr = br / bgLen, bng = bgc / bgLen, bnb = bb / bgLen;
	const isBgHue = (o) => {
		const r = data[o], g = data[o + 1], b = data[o + 2];
		const len = Math.sqrt(r * r + g * g + b * b);
		if (len < 40) return false; // too dark to have a stable hue (velvet)
		const dot = (r * bnr + g * bng + b * bnb) / len;
		// 0.972: loose enough to ride over JPEG chroma noise; the closest
		// object colour (neon-pink rim) measures ~0.955, so still separable
		return dot > 0.972;
	};

	// bg = hue-matching pixels connected to the border
	const bg = new Uint8Array(W * H);
	const seeds = [];
	for (let x = 0; x < W; x++) seeds.push(x, x + (H - 1) * W);
	for (let y = 0; y < H; y++) seeds.push(y * W, y * W + W - 1);
	for (const p of seeds) if (isBgHue(p * 4)) bg[p] = 1;
	const queue = seeds.filter((p) => bg[p]);
	while (queue.length) {
		const p = queue.pop();
		const x = p % W;
		for (const q of [p - 1, p + 1, p - W, p + W]) {
			if (q < 0 || q >= W * H || bg[q]) continue;
			if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue;
			if (isBgHue(q * 4)) { bg[q] = 1; queue.push(q); }
		}
	}
	// peel the AA halo: near-bg-hue pixels touching the cleared area
	for (let ring = 0; ring < 4; ring++) {
		const peel = [];
		for (let y = 0; y < H; y++) {
			for (let x = 0; x < W; x++) {
				const p = y * W + x;
				if (bg[p]) continue;
				const o = p * 4;
				const r = data[o], g = data[o + 1], b = data[o + 2];
				const len = Math.sqrt(r * r + g * g + b * b) || 1;
				const dot = (r * bnr + g * bng + b * bnb) / len;
				if (dot <= 0.952) continue;
				if ((x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W])) peel.push(p);
			}
		}
		for (const p of peel) bg[p] = 1;
	}

	// force-clear the per-alias corner boxes (baked light beams)
	for (const [fx0, fy0, fx1, fy1] of CORNER_CUTS[alias] ?? []) {
		const x0 = Math.floor(fx0 * W), x1 = Math.ceil(fx1 * W);
		const y0 = Math.floor(fy0 * H), y1 = Math.ceil(fy1 * H);
		for (let y = y0; y < y1; y++) for (let x = x0; x < Math.min(x1, W); x++) bg[y * W + x] = 1;
	}

	// keep the largest island (also removes maxwin's loose confetti bits)
	const label = new Int32Array(W * H).fill(-1);
	const areas = [];
	for (let p = 0; p < W * H; p++) {
		if (bg[p] || label[p] !== -1) continue;
		const id = areas.length;
		let area = 0;
		const q2 = [p];
		label[p] = id;
		while (q2.length) {
			const c = q2.pop();
			area++;
			const cx = c % W;
			for (const n of [c - 1, c + 1, c - W, c + W]) {
				if (n < 0 || n >= W * H || bg[n] || label[n] !== -1) continue;
				if ((n === c - 1 && cx === 0) || (n === c + 1 && cx === W - 1)) continue;
				label[n] = id;
				q2.push(n);
			}
		}
		areas.push(area);
	}
	const keepId = areas.indexOf(Math.max(...areas));
	for (let p = 0; p < W * H; p++) if (!bg[p] && label[p] !== keepId) bg[p] = 1;

	// alpha + feather + tight crop (kept at native aspect)
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const p = y * W + x;
			if (bg[p]) { data[idx(x, y) + 3] = 0; continue; }
			const touching = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
			if (touching) data[idx(x, y) + 3] = 130;
		}
	}
	let minX = W, minY = H, maxX = 0, maxY = 0;
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		if (data[idx(x, y) + 3] > 0) {
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}
	const cw = maxX - minX + 1, ch = maxY - minY + 1;
	const out = new PNG({ width: cw, height: ch });
	for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
		const so = idx(minX + x, minY + y), doff = (y * cw + x) * 4;
		for (let c = 0; c < 4; c++) out.data[doff + c] = data[so + c];
	}
	fs.writeFileSync(path.join(OUT_DIR, `${alias}.png`), PNG.sync.write(out));
	manifest[alias] = { width: cw, height: ch };
	console.log(`keyed ${alias}.png ${cw}x${ch} (from ${srcName}.jpg ${W}x${H})`);
}

fs.writeFileSync(
	path.join(appRoot, 'src/game/winBanners.json'),
	JSON.stringify(manifest, null, '\t') + '\n',
);
console.log('wrote src/game/winBanners.json');
