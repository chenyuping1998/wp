// The layers the mesh wins are drawn with (src/game/meshWin/*,
// SymbolMeshWin.svelte). Ported from GoBananubis' make_symbol_layers.mjs; the
// cutting half of that script is gone, because Bananaut's high pays, Wild and
// Scatter are already transparent cut-outs — the mesh draws the symbol's own
// sprite. What is left to bake, all at the 256px canvas the rigs work in (the
// art is 1024; these are soft and gain nothing from more):
//
//   CUT mode (H1-H4, W, S)
//     {n}_shadow.png  a soft dark silhouette, drawn UNDER the mesh while it is
//                     lifted, so the height reads
//     {n}_sheen.png   an atlas of SHEEN_FRAMES frames of light sweeping across
//                     the subject, weighted to its highlights, drawn additively
//                     through the same mesh
//   PANEL mode (L1-L5, the letter tiles)
//     {n}_glow.png    the art masked to the spec's `inked` region, for the
//                     additive flash — the hit lights the letter, not the tile
//     {n}_sheen.png   the light sweep, masked the same way
//
// Masks come from the specs themselves, so they cannot drift from what the
// gate checks.
//
// Usage: node design/make_symbol_layers.mjs E:/stake/tools/gen

import { createRequire, register } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// the meshWin modules import each other without an extension, as vite expects
register(
	'data:text/javascript,' +
		encodeURIComponent(`export async function resolve(s, c, next) {
			try { return await next(s, c); } catch (e) {
				if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c);
				throw e;
			}
		}`),
);

const toolsDir = process.argv[2];
if (!toolsDir) throw new Error('pass the tools dir (where pngjs lives) as the first argument');
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
const write = (name, w, h, data) => {
	const png = new PNG({ width: w, height: h });
	png.data.set(data);
	fs.writeFileSync(path.join(DIR, name), PNG.sync.write(png));
};

export const SHEEN_FRAMES = 24;
export const SHEEN_COLS = 6;
export const SHEEN_CELL = 128; // half the 256 canvas; the light is soft
const CANVAS = 256;

/** the symbol's art box-filtered down to the 256 canvas, colour weighted by
 *  alpha so the transparent surround does not darken the edges */
const readCanvas = (name) => {
	const src = PNG.sync.read(fs.readFileSync(path.join(DIR, name)));
	// any square: c.png is 777 wide, so the box a canvas pixel covers is not a
	// whole number of source pixels — take every source pixel it touches
	const k = src.width / CANVAS;
	if (src.height !== src.width || k < 1) throw new Error(`${name}: expected a square at least ${CANVAS} wide`);
	const data = new Uint8Array(CANVAS * CANVAS * 4);
	for (let y = 0; y < CANVAS; y++)
		for (let x = 0; x < CANVAS; x++) {
			let r = 0, g = 0, b = 0, a = 0, n = 0;
			const sy0 = Math.floor(y * k), sy1 = Math.min(src.height, Math.ceil((y + 1) * k));
			const sx0 = Math.floor(x * k), sx1 = Math.min(src.width, Math.ceil((x + 1) * k));
			for (let yy = sy0; yy < sy1; yy++)
				for (let xx = sx0; xx < sx1; xx++) {
					n++;
					const i = (yy * src.width + xx) * 4;
					const w = src.data[i + 3];
					r += src.data[i] * w;
					g += src.data[i + 1] * w;
					b += src.data[i + 2] * w;
					a += w;
				}
			const o = (y * CANVAS + x) * 4;
			data[o] = a ? r / a : 0;
			data[o + 1] = a ? g / a : 0;
			data[o + 2] = a ? b / a : 0;
			data[o + 3] = a / n;
		}
	return { width: CANVAS, height: CANVAS, data };
};

const blur = (src, W, H, R) => {
	const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let s = 0, n = 0;
			for (let d = -R; d <= R; d++) {
				const xx = x + d;
				if (xx < 0 || xx >= W) continue;
				s += src[y * W + xx];
				n++;
			}
			tmp[y * W + x] = s / n;
		}
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let s = 0, n = 0;
			for (let d = -R; d <= R; d++) {
				const yy = y + d;
				if (yy < 0 || yy >= H) continue;
				s += tmp[yy * W + x];
				n++;
			}
			out[y * W + x] = s / n;
		}
	return out;
};

// the sheen: a soft diagonal band crossing the subject top-left to bottom-right
// over the frames, strongest on the subject's own highlights (so it reads as a
// gloss on the material rather than a wipe over it), with a small four-point
// glint blooming on the brightest point the band passes near its end.
const bakeSheen = (plate, alpha) => {
	const W = plate.width, H = plate.height;
	const C = SHEEN_CELL, S = W / C;
	const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
	const atlas = new Uint8Array(SHEEN_COLS * C * rows * C * 4);
	const AW = SHEEN_COLS * C;
	// highlight weight per canvas pixel: luminance above the subject's median
	const lums = [];
	for (let i = 0; i < W * H; i++) if (alpha[i] > 0.5) lums.push(0.3 * plate.data[i * 4] + 0.59 * plate.data[i * 4 + 1] + 0.11 * plate.data[i * 4 + 2]);
	lums.sort((a, b) => a - b);
	const median = lums[lums.length >> 1], top = lums[Math.floor(lums.length * 0.98)];
	const gloss = (i) => {
		const l = 0.3 * plate.data[i * 4] + 0.59 * plate.data[i * 4 + 1] + 0.11 * plate.data[i * 4 + 2];
		return 0.45 + 0.55 * Math.max(0, Math.min(1, (l - median) / Math.max(1, top - median)));
	};
	// the subject's diagonal extent, so the band enters and leaves it exactly
	let dMin = Infinity, dMax = -Infinity, glintI = -1, glintL = -1;
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			if (alpha[i] < 0.5) continue;
			const d = x + y;
			dMin = Math.min(dMin, d);
			dMax = Math.max(dMax, d);
		}
	// the glint sits on the brightest pixel in the band's last third
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			if (alpha[i] < 0.9 || x + y < dMin + (dMax - dMin) * 0.55) continue;
			const l = plate.data[i * 4] + plate.data[i * 4 + 1] + plate.data[i * 4 + 2];
			if (l > glintL) {
				glintL = l;
				glintI = i;
			}
		}
	const gx = glintI % W, gy = (glintI / W) | 0;
	const BAND = 26; // half-width of the band, in canvas px along the diagonal
	for (let f = 0; f < SHEEN_FRAMES; f++) {
		const t = f / (SHEEN_FRAMES - 1);
		const centre = dMin - BAND + t * (dMax - dMin + 2 * BAND);
		const glint = Math.max(0, 1 - Math.abs(t - 0.8) / 0.2);
		const ox = (f % SHEEN_COLS) * C, oy = Math.floor(f / SHEEN_COLS) * C;
		for (let cy = 0; cy < C; cy++)
			for (let cx = 0; cx < C; cx++) {
				// supersample the canvas pixels this cell pixel covers
				let v = 0;
				for (let sy = 0; sy < S; sy++)
					for (let sx = 0; sx < S; sx++) {
						const x = cx * S + sx, y = cy * S + sy, i = y * W + x;
						if (alpha[i] <= 0) continue;
						const u = (x + y - centre) / BAND;
						const band = Math.exp(-u * u * 2.2);
						let star = 0;
						if (glint > 0) {
							const dx = x - gx, dy = y - gy;
							const r = Math.hypot(dx, dy);
							const cross = Math.exp(-(dx * dx) / 3) * Math.exp(-(dy * dy) / 400) + Math.exp(-(dy * dy) / 3) * Math.exp(-(dx * dx) / 400);
							star = glint * (Math.exp(-(r * r) / 30) + 0.8 * cross);
						}
						v += alpha[i] * Math.min(1, band * gloss(i) + star);
					}
				v /= S * S;
				const o = ((oy + cy) * AW + ox + cx) * 4;
				const a = Math.round(255 * Math.min(1, v));
				atlas[o] = 255;
				atlas[o + 1] = 250;
				atlas[o + 2] = 232;
				atlas[o + 3] = a;
			}
	}
	return { atlas, width: AW, height: rows * C };
};

// c.png: the canister the mascot throws (canister.png, 777x770), padded to a
// centred square for the same reason (meshWin/cCanister.ts)
{
	const src = PNG.sync.read(fs.readFileSync(path.join(DIR, 'canister.png')));
	const n = Math.max(src.width, src.height);
	const ox = (n - src.width) >> 1, oy = (n - src.height) >> 1;
	const data = new Uint8Array(n * n * 4);
	for (let y = 0; y < src.height; y++)
		for (let x = 0; x < src.width; x++)
			data.set(src.data.subarray((y * src.width + x) * 4, (y * src.width + x) * 4 + 4), ((y + oy) * n + x + ox) * 4);
	write('c.png', n, n, data);
}

// g.png: the grow marker badge (growMarker.png, 236x256, cropped to its own
// alpha for the cell corner) padded out to a centred square, so the rig's 256
// canvas maps onto it the way it maps onto every symbol (meshWin/gMarker.ts)
{
	const src = PNG.sync.read(fs.readFileSync(path.join(DIR, 'growMarker.png')));
	if (src.height !== CANVAS || src.width > CANVAS) throw new Error('growMarker.png: expected 256 tall, at most 256 wide');
	const ox = (CANVAS - src.width) >> 1;
	const data = new Uint8Array(CANVAS * CANVAS * 4);
	for (let y = 0; y < CANVAS; y++)
		for (let x = 0; x < src.width; x++) data.set(src.data.subarray((y * src.width + x) * 4, (y * src.width + x) * 4 + 4), (y * CANVAS + x + ox) * 4);
	write('g.png', CANVAS, CANVAS, data);
}

const { MESH_WINS } = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/index.ts')).href);
const baked = new Set();
for (const spec of Object.values(MESH_WINS)) {
	// S_TRIGGER shares S's drawing and layers
	if (baked.has(spec.key)) continue;
	baked.add(spec.key);
	const name = spec.symbol.toLowerCase();
	const art = readCanvas(`${name}.png`);
	const W = art.width, H = art.height, N = W * H;

	if (spec.mode === 'panel') {
		const hard = new Float32Array(N);
		for (let i = 0; i < N; i++) {
			const inside = spec.inked([i % W, (i / W) | 0]);
			const coloured = !spec.inkColor || spec.inkColor(art.data[i * 4], art.data[i * 4 + 1], art.data[i * 4 + 2]);
			hard[i] = inside && coloured ? 1 : 0;
		}
		const mask = blur(hard, W, H, 3);
		const glow = new Uint8Array(N * 4);
		for (let i = 0; i < N; i++)
			glow.set([art.data[i * 4], art.data[i * 4 + 1], art.data[i * 4 + 2], Math.round(255 * mask[i])], i * 4);
		write(`${name}_glow.png`, W, H, glow);
		const sheen = bakeSheen(art, mask);
		write(`${name}_sheen.png`, sheen.width, sheen.height, sheen.atlas);
		console.log(`${name}: panel -> ${name}_{glow,sheen}.png`);
		continue;
	}

	const alpha = new Float32Array(N);
	for (let i = 0; i < N; i++) alpha[i] = art.data[i * 4 + 3] / 255;

	// the FEATURE layer (spec.feature): the art masked to the pixels that light
	// on their own — the comet's craters, the pack's lamps — softened a little
	// so the glow has a falloff
	if (spec.feature) {
		const hard = new Float32Array(N);
		for (let i = 0; i < N; i++) {
			const p = [i % W, (i / W) | 0];
			const inside = !spec.feature.inside || spec.feature.inside(p);
			hard[i] = alpha[i] > 0.5 && inside && spec.feature.test(art.data[i * 4], art.data[i * 4 + 1], art.data[i * 4 + 2]) ? 1 : 0;
		}
		const soft = blur(hard, W, H, 2);
		const feat = new Uint8Array(N * 4);
		for (let i = 0; i < N; i++) feat.set([art.data[i * 4], art.data[i * 4 + 1], art.data[i * 4 + 2], Math.round(255 * Math.min(1, soft[i] * 1.4))], i * 4);
		write(`${name}_feature.png`, W, H, feat);
	}
	// the light sweep, confined where the spec asks (the Wild: its goggles)
	const sheenAlpha = spec.sheenMask ? alpha.map((a, i) => a * spec.sheenMask([i % W, (i / W) | 0])) : alpha;
	// the drop shadow: the silhouette grown and heavily softened
	const soft = blur(blur(alpha, W, H, 5), W, H, 5);
	const shadow = new Uint8Array(N * 4);
	for (let i = 0; i < N; i++) shadow.set([4, 6, 10, Math.round(255 * Math.min(1, soft[i] * 1.15))], i * 4);
	write(`${name}_shadow.png`, W, H, shadow);
	const sheen = bakeSheen(art, sheenAlpha);
	write(`${name}_sheen.png`, sheen.width, sheen.height, sheen.atlas);
	console.log(`${name}: cut -> ${name}_{shadow,sheen${spec.feature ? ',feature' : ''}}.png`);
}
