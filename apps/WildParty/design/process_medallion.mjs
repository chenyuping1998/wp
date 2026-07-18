// Multiplier medallion — keys new_symbols/banner.jpg (round ornate gold
// frame, dark velvet round window) off its magenta bg, mirrors the clean
// right half over the beam-lit left half, and writes
// static/assets/sprites/multMedallion/medallion.png (+ prints dims for
// GlobalMultiplier.svelte).
//
// Usage: node design/process_medallion.mjs <dir with node_modules for @resvg/resvg-js + pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node process_medallion.mjs <toolsDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'static/assets/sprites/new_symbols/banner.jpg');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/multMedallion');
fs.mkdirSync(OUT_DIR, { recursive: true });

const jpegSize = (b) => {
	let i = 2;
	while (i < b.length) {
		if (b[i] !== 0xff) { i++; continue; }
		const m = b[i + 1];
		if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
			return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
		i += 2 + b.readUInt16BE(i + 2);
	}
	throw new Error('no SOF');
};
const buf = fs.readFileSync(SRC);
const { width: JW, height: JH } = jpegSize(buf);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${JW}" height="${JH}"><image href="data:image/jpeg;base64,${buf.toString('base64')}" width="${JW}" height="${JH}"/></svg>`;
const png = PNG.sync.read(new Resvg(svg, { fitTo: { mode: 'width', value: JW } }).render().asPng());
const { width: W, height: H, data } = png;

let br = 0, bgc = 0, bb = 0, bn = 0;
for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const o = (y * W + x) * 4; br += data[o]; bgc += data[o + 1]; bb += data[o + 2]; bn++; }
for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { const o = (y * W + x) * 4; br += data[o]; bgc += data[o + 1]; bb += data[o + 2]; bn++; }
br /= bn; bgc /= bn; bb /= bn;
const bgLen = Math.sqrt(br * br + bgc * bgc + bb * bb) || 1;
const bnr = br / bgLen, bng = bgc / bgLen, bnb = bb / bgLen;
const dotAt = (o) => {
	const r = data[o], g = data[o + 1], b = data[o + 2];
	const len = Math.sqrt(r * r + g * g + b * b) || 1;
	return (r * bnr + g * bng + b * bnb) / len;
};
const isBgHue = (o) => {
	const r = data[o], g = data[o + 1], b = data[o + 2];
	if (Math.sqrt(r * r + g * g + b * b) < 40) return false;
	return dotAt(o) > 0.972;
};

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
for (let ring = 0; ring < 4; ring++) {
	const peel = [];
	for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
		const p = y * W + x;
		if (bg[p] || dotAt(p * 4) <= 0.952) continue;
		if ((x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W])) peel.push(p);
	}
	for (const p of peel) bg[p] = 1;
}
// beam margins + alpha
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
	if (x < W * 0.08 || y < H * 0.05) bg[y * W + x] = 1;
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
	const p = y * W + x;
	if (bg[p]) { data[p * 4 + 3] = 0; continue; }
	const touching = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
	if (touching) data[p * 4 + 3] = 130;
}

// crop
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
	if (data[(y * W + x) * 4 + 3] > 0) {
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}
}
const CW = maxX - minX + 1, CH = maxY - minY + 1;
const out = new PNG({ width: CW, height: CH });
for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
	const so = ((minY + y) * W + (minX + x)) * 4, doff = (y * CW + x) * 4;
	for (let c = 0; c < 4; c++) out.data[doff + c] = data[so + c];
}
// mirror the clean right half over the beam-lit left half
for (let y = 0; y < CH; y++) for (let x = 0; x < CW >> 1; x++) {
	const so = (y * CW + (CW - 1 - x)) * 4, doff = (y * CW + x) * 4;
	for (let c = 0; c < 4; c++) out.data[doff + c] = out.data[so + c];
}
fs.writeFileSync(path.join(OUT_DIR, 'medallion.png'), PNG.sync.write(out));
console.log(`wrote medallion.png ${CW}x${CH}`);
