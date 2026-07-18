// Frames v3 — restyles the reel frame, the FS counter panel and the
// multiplier plank from the AI-painted ornate frame (new_symbols/frame.jpg).
//
// The source is square; the three targets have different aspects, so the art
// is adapted with a smart 9-slice: the corner ornaments and the mid-edge
// crests/gems keep their aspect (uniformly scaled), only the plain rail
// segments stretch. Two variants are built: hollow (board frame — window
// cleared) and filled (panels — the painted dark window becomes the panel
// backdrop).
//
// Outputs:
//  · reels_frame_v3.{png,json} — frame_bg (copied from v2 sheet),
//    frame_edge 1620x960 hollow, Frame_FSCounter 450x338 filled
//  · spines/globalMultiplier/multiframe_v2.{png,atlas} — Frame_Multiplier
//    region repainted with the filled frame (skeleton json unchanged)
//
// Usage: node design/generate_frames_v3.mjs <dir with node_modules for @resvg/resvg-js + pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node generate_frames_v3.mjs <toolsDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'static/assets/sprites/new_symbols/frame.jpg');
const REELS_DIR = path.join(appRoot, 'static/assets/sprites/reelsFrame');
const MULTI_DIR = path.join(appRoot, 'static/assets/spines/globalMultiplier');

// ── decode + magenta key (hue-direction, same recipe as the win banners) ────
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
// the baked top-left light beam isn't bg-hued — force-clear the outer
// margins it lives in (the frame never reaches these strips)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
	if (x < W * 0.1 || y < H * 0.055) bg[y * W + x] = 1;
}


for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
	const p = y * W + x;
	if (bg[p]) { data[p * 4 + 3] = 0; continue; }
	const touching = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
	if (touching) data[p * 4 + 3] = 130;
}

// tight crop
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
const art = new PNG({ width: CW, height: CH });
for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
	const so = ((minY + y) * W + (minX + x)) * 4, doff = (y * CW + x) * 4;
	for (let c = 0; c < 4; c++) art.data[doff + c] = data[so + c];
}
console.log(`keyed frame art ${CW}x${CH}`);

// the baked light beam contaminates only the LEFT half; the frame design is
// left-right symmetric, so rebuild the left half as a mirror of the clean
// right half — kills every beam remnant (corner haze, lit gem) at once
for (let y = 0; y < CH; y++) {
	for (let x = 0; x < CW >> 1; x++) {
		const so = (y * CW + (CW - 1 - x)) * 4, doff = (y * CW + x) * 4;
		for (let c = 0; c < 4; c++) art.data[doff + c] = art.data[so + c];
	}
}
console.log('symmetrised: left half mirrored from the clean right half');

// hollow variant: clear the window by flooding from the centre across
// everything that is NOT frame material — gold reads as a strong red-blue
// gap, the neon rim as red+blue both high — so the beam-lit window glow
// (warm but desaturated) is cleared along with the dark velvet. The flood
// is boxed to the inner region so it can never escape past the rim.
const hollow = new PNG({ width: CW, height: CH });
art.data.copy(hollow.data);
{
	const isFrameMaterial = (o) => {
		const r = hollow.data[o], g = hollow.data[o + 1], b = hollow.data[o + 2];
		const gold = r > 150 && r - b > 110;
		const neon = r > 195 && b > 165;
		return gold || neon;
	};
	const inBox = (p) => {
		const x = p % CW, y = (p / CW) | 0;
		return x > CW * 0.1 && x < CW * 0.9 && y > CH * 0.08 && y < CH * 0.92;
	};
	const seen = new Uint8Array(CW * CH);
	const q2 = [(CH >> 1) * CW + (CW >> 1)];
	seen[q2[0]] = 1;
	const win = [];
	while (q2.length) {
		const p = q2.pop();
		if (!inBox(p) || isFrameMaterial(p * 4)) continue;
		win.push(p);
		const x = p % CW;
		for (const n of [p - 1, p + 1, p - CW, p + CW]) {
			if (n < 0 || n >= CW * CH || seen[n]) continue;
			if ((n === p - 1 && x === 0) || (n === p + 1 && x === CW - 1)) continue;
			seen[n] = 1;
			q2.push(n);
		}
	}
	for (const p of win) hollow.data[p * 4 + 3] = 0;
	// feather ring: half-alpha where window meets the frame
	for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
		const p = y * CW + x;
		if (hollow.data[p * 4 + 3] === 0) continue;
		const nb = [p - 1, p + 1, p - CW, p + CW].some(
			(n) => n >= 0 && n < CW * CH && hollow.data[n * 4 + 3] === 0 && art.data[n * 4 + 3] > 0,
		);
		if (nb && Math.max(hollow.data[p * 4], hollow.data[p * 4 + 1], hollow.data[p * 4 + 2]) < 160)
			hollow.data[p * 4 + 3] = Math.min(hollow.data[p * 4 + 3], 120);
	}
	console.log(`hollowed window: ${win.length} px cleared`);
}

// ── smart 9-slice (5x5: fixed corners + fixed mid-edge crest/gems) ──────────
// segment fractions along each axis: [start, end, mode]
const COLS = [
	[0, 0.24, 'fixed'],
	[0.24, 0.36, 'stretch'],
	[0.36, 0.64, 'fixed'],
	[0.64, 0.76, 'stretch'],
	[0.76, 1, 'fixed'],
];
const ROWS = [
	[0, 0.22, 'fixed'],
	[0.22, 0.4, 'stretch'],
	[0.4, 0.6, 'fixed'],
	[0.6, 0.78, 'stretch'],
	[0.78, 1, 'fixed'],
];

const buildAxis = (segs, srcLen, targetLen, s) => {
	// returns piecewise map target→src
	const fixedLen = segs.filter(([, , m]) => m === 'fixed').reduce((sum, [a, b]) => sum + (b - a), 0) * srcLen * s;
	const stretchSrc = segs.filter(([, , m]) => m === 'stretch').reduce((sum, [a, b]) => sum + (b - a), 0) * srcLen;
	const stretchTarget = Math.max(1, targetLen - fixedLen);
	const pieces = [];
	let tPos = 0;
	for (const [a, b, mode] of segs) {
		const srcA = a * srcLen, srcB = b * srcLen;
		const tLen = mode === 'fixed' ? (srcB - srcA) * s : ((srcB - srcA) / stretchSrc) * stretchTarget;
		pieces.push({ t0: tPos, t1: tPos + tLen, s0: srcA, s1: srcB });
		tPos += tLen;
	}
	// normalise to exactly targetLen
	const k = targetLen / tPos;
	for (const p of pieces) { p.t0 *= k; p.t1 *= k; }
	return (t) => {
		for (const p of pieces) {
			if (t >= p.t0 && t <= p.t1) return p.s0 + ((t - p.t0) / (p.t1 - p.t0 || 1)) * (p.s1 - p.s0);
		}
		return srcLen - 1;
	};
};

const sliceTo = (srcPng, targetW, targetH, ornamentScale) => {
	const mapX = buildAxis(COLS, srcPng.width, targetW, ornamentScale);
	const mapY = buildAxis(ROWS, srcPng.height, targetH, ornamentScale);
	const out = new PNG({ width: targetW, height: targetH });
	const sd = srcPng.data, sw = srcPng.width, sh = srcPng.height;
	const sample = (fx, fy, c) => {
		const x0 = Math.max(0, Math.min(sw - 1, Math.floor(fx)));
		const y0 = Math.max(0, Math.min(sh - 1, Math.floor(fy)));
		const x1 = Math.min(sw - 1, x0 + 1), y1 = Math.min(sh - 1, y0 + 1);
		const tx = fx - x0, ty = fy - y0;
		const at = (x, y) => sd[(y * sw + x) * 4 + c];
		return at(x0, y0) * (1 - tx) * (1 - ty) + at(x1, y0) * tx * (1 - ty) + at(x0, y1) * (1 - tx) * ty + at(x1, y1) * tx * ty;
	};
	for (let y = 0; y < targetH; y++) {
		const sy = mapY(y + 0.5);
		for (let x = 0; x < targetW; x++) {
			const sx = mapX(x + 0.5);
			const o = (y * targetW + x) * 4;
			for (let c = 0; c < 4; c++) out.data[o + c] = Math.round(sample(sx, sy, c));
		}
	}
	return out;
};

const FRAME_EDGE_W = 1620, FRAME_EDGE_H = 960;
const frameEdge = sliceTo(hollow, FRAME_EDGE_W, FRAME_EDGE_H, (FRAME_EDGE_H / CH) * 0.9);

// FG intro/outro backdrop panel (filled variant, 1.4:1) — replaces the old
// bunting/disco-ball fsPanel spine
const FS_ORNATE_DIR = path.join(appRoot, 'static/assets/sprites/fsOrnate');
fs.mkdirSync(FS_ORNATE_DIR, { recursive: true });
const fsOrnate = sliceTo(art, 1400, 1000, (1000 / CH) * 0.9);
fs.writeFileSync(path.join(FS_ORNATE_DIR, 'fs_ornate_panel.png'), PNG.sync.write(fsOrnate));
console.log('wrote fs_ornate_panel.png 1400x1000');
const FS_W = 450, FS_H = 338;
const fsPanel = sliceTo(art, FS_W, FS_H, (FS_H / CH) * 0.9);
const FM_W = 211, FM_H = 135;
const multPlank = sliceTo(art, FM_W, FM_H, (FM_H / CH) * 0.9);

// ── reels_frame_v3 sheet: frame_bg (from v2) + new edge + new FS panel ──────
const v2Json = JSON.parse(fs.readFileSync(path.join(REELS_DIR, 'reels_frame_v2.json'), 'utf8'));
const v2Png = PNG.sync.read(fs.readFileSync(path.join(REELS_DIR, 'reels_frame_v2.png')));
const bgFrame = v2Json.frames['frame_bg.png'].frame;
const frameBg = new PNG({ width: bgFrame.w, height: bgFrame.h });
for (let y = 0; y < bgFrame.h; y++) for (let x = 0; x < bgFrame.w; x++) {
	const so = ((bgFrame.y + y) * v2Png.width + (bgFrame.x + x)) * 4, doff = (y * bgFrame.w + x) * 4;
	for (let c = 0; c < 4; c++) frameBg.data[doff + c] = v2Png.data[so + c];
}

const PAD = 8;
const sheetW = bgFrame.w + FRAME_EDGE_W + FS_W + PAD * 4;
const sheetH = Math.max(bgFrame.h, FRAME_EDGE_H, FS_H) + PAD * 2;
const sheet = new PNG({ width: sheetW, height: sheetH });
const blit = (dst, src, dx, dy) => {
	for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
		const so = (y * src.width + x) * 4, doff = ((dy + y) * dst.width + (dx + x)) * 4;
		for (let c = 0; c < 4; c++) dst.data[doff + c] = src.data[so + c];
	}
};
const bgX = PAD, edgeX = bgX + bgFrame.w + PAD, fsX = edgeX + FRAME_EDGE_W + PAD;
blit(sheet, frameBg, bgX, PAD);
blit(sheet, frameEdge, edgeX, PAD);
blit(sheet, fsPanel, fsX, PAD);
fs.writeFileSync(path.join(REELS_DIR, 'reels_frame_v3.png'), PNG.sync.write(sheet));

const mkFrame = (x, w, h) => ({
	frame: { x, y: PAD, w, h },
	rotated: false,
	trimmed: false,
	spriteSourceSize: { x: 0, y: 0, w, h },
	sourceSize: { w, h },
});
const v3Json = {
	frames: {
		'frame_bg.png': mkFrame(bgX, bgFrame.w, bgFrame.h),
		'frame_edge.png': mkFrame(edgeX, FRAME_EDGE_W, FRAME_EDGE_H),
		'Frame_FSCounter.png': mkFrame(fsX, FS_W, FS_H),
	},
	meta: {
		app: 'design/generate_frames_v3.mjs',
		version: '1.0',
		image: 'reels_frame_v3.png',
		format: 'RGBA8888',
		size: { w: sheetW, h: sheetH },
		scale: '1',
	},
};
fs.writeFileSync(path.join(REELS_DIR, 'reels_frame_v3.json'), JSON.stringify(v3Json, null, '\t') + '\n');
console.log('wrote reels_frame_v3 sheet', sheetW, 'x', sheetH);

// ── multiframe_v2: repaint Frame_Multiplier as a gem-less gold plank that
// echoes the ornate board frame's gold (no diamonds, no neon) ──────────────
const goldPlankSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${FM_W}" height="${FM_H}" viewBox="0 0 ${FM_W} ${FM_H}">
<defs>
	<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe9a0"/>
		<stop offset="0.45" stop-color="#d8a84e"/>
		<stop offset="1" stop-color="#8a5a1a"/>
	</linearGradient>
	<linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#33123f"/>
		<stop offset="1" stop-color="#170a20"/>
	</linearGradient>
</defs>
<rect x="3" y="3" width="${FM_W - 6}" height="${FM_H - 6}" rx="20" fill="url(#g)" stroke="#3a2408" stroke-width="4"/>
<rect x="6" y="6" width="${FM_W - 12}" height="${FM_H - 12}" rx="17" fill="none" stroke="#fff3c4" stroke-width="1.6" opacity="0.75"/>
<rect x="15" y="14" width="${FM_W - 30}" height="${FM_H - 28}" rx="12" fill="url(#win)" stroke="#552d0a" stroke-width="3"/>
<path d="M 22 10 Q ${FM_W / 2} 2 ${FM_W - 22} 10" fill="none" stroke="#a97a2c" stroke-width="2.4" opacity="0.8"/>
<path d="M 22 ${FM_H - 10} Q ${FM_W / 2} ${FM_H - 2} ${FM_W - 22} ${FM_H - 10}" fill="none" stroke="#a97a2c" stroke-width="2.4" opacity="0.8"/>
</svg>`;
const plankPng = PNG.sync.read(
	new Resvg(goldPlankSvg, { fitTo: { mode: 'width', value: FM_W } }).render().asPng(),
);
const multiPng = PNG.sync.read(fs.readFileSync(path.join(MULTI_DIR, 'multiframe.png')));
// clear region (1px pad) then blit the plank at its 2,2 bounds
for (let y = 1; y <= 137; y++) for (let x = 1; x <= 213; x++) {
	const doff = (y * multiPng.width + x) * 4;
	for (let c = 0; c < 4; c++) multiPng.data[doff + c] = 0;
}
for (let y = 0; y < FM_H; y++) for (let x = 0; x < FM_W; x++) {
	const so = (y * FM_W + x) * 4, doff = ((2 + y) * multiPng.width + (2 + x)) * 4;
	for (let c = 0; c < 4; c++) multiPng.data[doff + c] = plankPng.data[so + c];
}
fs.writeFileSync(path.join(MULTI_DIR, 'multiframe_v2.png'), PNG.sync.write(multiPng));
const atlasText = fs.readFileSync(path.join(MULTI_DIR, 'multiframe.atlas'), 'utf8');
fs.writeFileSync(path.join(MULTI_DIR, 'multiframe_v2.atlas'), atlasText.replace(/multiframe\.png/g, 'multiframe_v2.png'));
console.log('wrote multiframe_v2.{png,atlas}');
