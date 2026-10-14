// The layers the mesh wins are drawn from (src/game/meshWin/*,
// SymbolMeshWin.svelte). Ported from GoBananubis, whose art was 256px; this
// game's is 820px (high pays, specials) and 1024px (the letters), so every
// pixel constant below is written for a 256px canvas and scaled by K = W/256.
//
// CUT mode — the subject comes off its plate and acts ON it:
//   {n}_plate.png    the stone with the subject lifted off it
//   {n}_subject.png  the subject alone — what the mesh deforms
//   {n}_shadow.png   a soft dark silhouette, drawn UNDER the mesh while it is
//                    lifted, so the height reads
//   {n}_sheen.png    SHEEN_FRAMES frames of light sweeping across the subject,
//                    pre-clipped to it and weighted to its highlights, drawn
//                    additively through the SAME mesh so the light rides the
//                    deformation. Baked rather than shaded: the game runs on
//                    WebGPU by default, and a custom mesh shader would need a
//                    WGSL and a GLSL twin.
// Plate and subject come out of {n}.png pixel for pixel, so at rest the two
// recompose the original exactly.
//
// Only the crossed pickaxes (H3) are cut. This game's plates are dark,
// desaturated slate and cut cleanly — EXCEPT where a subject lights the stone
// around it, which is most of them: the lantern and the crystal throw a glow
// onto their plates, the cart stands on rails painted onto its plate, the
// bananas lie on a rock pile. A cut takes a torn ring of lit stone along (see
// design/cut_from_plate.py, which found the same wall on the dynamite's fuse).
// Those run in PANEL mode instead:
//
// PANEL mode — the frame is fixed and the whole inside is the mesh:
//   {n}_glow.png     the art with its alpha masked to the spec's `inked` region
//                    (and `inkColor`), for the additive flash — so the hit
//                    lights the subject, not the whole slab of stone
//   {n}_sheen.png    the light sweep, masked the same way
// The mask comes from the spec itself, so it cannot drift from the region the
// gate checks.
//
// Usage: node design/make_symbol_layers.mjs E:\stake\tools\gen [h3,l1,...]

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
const only = process.argv[3] ? new Set(process.argv[3].toLowerCase().split(',')) : null;
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
const read = (name) => PNG.sync.read(fs.readFileSync(path.join(DIR, name)));
const write = (name, w, h, data) => {
	const png = new PNG({ width: w, height: h });
	png.data.set(data);
	fs.writeFileSync(path.join(DIR, name), PNG.sync.write(png));
};

export const SHEEN_FRAMES = 24;
export const SHEEN_COLS = 6;
export const SHEEN_CELL = 128; // half the 256 canvas; the light is soft
const CANVAS = 256;
// the panel symbols' glow ships at this size (see below)
const GLOW = 512;

const chroma = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
const lumOf = (r, g, b) => (r + g + b) / 3;

// What counts as SUBJECT on a cut plate. Measured on a 256px downscale of h3:
//
//   slate           (64,59,52)    chroma ~15
//   lit slate       (135,96,61)   chroma ~75, green 0.71 of red
//   handles         (115,52,32)   chroma ~78, green 0.45 of red
//   steel heads     the only BRIGHT thing on the tile, lum > 150
//
// Saturation alone cannot tell the handles from the slate the heads light up
// at top left — both run chroma ~75, and at the first attempt a torn patch of
// that stone rode along on the left blade. Hue can: the wood is RED-brown.
const SUBJECTS = {
	h3: (r, g, b) => (r - b > 45 && g < 0.6 * r) || lumOf(r, g, b) > 150,
};

// in 256-canvas px; each scaled by K
// Nothing this close to the border is ever subject. Per symbol: the picks'
// blades curve out to within ~14px of the frame, and at Anubis's 30 both tips
// were left behind on the stone.
const EDGE = { h3: 10 };
// An island whose centroid is this close is the plate's trim. Per symbol: the
// right pick's lower blade is its own island (a dark seam parts it from the
// head), and its centroid sits 26px from the edge — at 40 it was thrown away.
const FRAME = { h3: 16 };
// Close radius: the handle passing over the other casts a dark shadow across
// it, which fails the colour test and notched the lower handle at 1.
const CLOSE = { h3: 3 };

const morph = (mask, W, H, R, grow) => {
	// separable square max (grow) or min (shrink)
	const pick = grow ? Math.max : Math.min;
	const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let v = grow ? 0 : 1;
			for (let d = -R; d <= R; d++) {
				const xx = Math.min(W - 1, Math.max(0, x + d));
				v = pick(v, mask[y * W + xx]);
			}
			tmp[y * W + x] = v;
		}
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let v = grow ? 0 : 1;
			for (let d = -R; d <= R; d++) {
				const yy = Math.min(H - 1, Math.max(0, y + d));
				v = pick(v, tmp[yy * W + x]);
			}
			out[y * W + x] = v;
		}
	return out;
};

const blur = (src, W, H, R) => {
	// box blur via running sums, so a radius of 9 on 820px costs what 2 did
	const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
	for (let y = 0; y < H; y++) {
		let s = 0;
		const row = y * W;
		for (let x = -R; x <= R; x++) s += src[row + Math.min(W - 1, Math.max(0, x))];
		for (let x = 0; x < W; x++) {
			tmp[row + x] = s / (2 * R + 1);
			s += src[row + Math.min(W - 1, x + R + 1)] - src[row + Math.max(0, x - R)];
		}
	}
	for (let x = 0; x < W; x++) {
		let s = 0;
		for (let y = -R; y <= R; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
		for (let y = 0; y < H; y++) {
			out[y * W + x] = s / (2 * R + 1);
			s += tmp[Math.min(H - 1, y + R + 1) * W + x] - tmp[Math.max(0, y - R) * W + x];
		}
	}
	return out;
};

const cut = (plate, test, closeR, edgePx, frameAt) => {
	const W = plate.width, H = plate.height, N = W * H, K = W / CANVAS;
	const edge = Math.round(edgePx * K);
	const hit = new Uint8Array(N);
	for (let i = 0; i < N; i++) {
		const x = i % W, y = (i / W) | 0;
		if (Math.min(x, y, W - 1 - x, H - 1 - y) < edge) continue;
		hit[i] = test(plate.data[i * 4], plate.data[i * 4 + 1], plate.data[i * 4 + 2]) ? 1 : 0;
	}
	if (closeR) {
		const R = Math.round(closeR * K);
		hit.set(morph(morph(hit, W, H, R, true), W, H, R, false));
	}

	// everything the outside can reach without crossing the subject — the rest
	// (dark contours inside the shape) is subject
	const outside = new Uint8Array(N);
	const q = [];
	for (let x = 0; x < W; x++) q.push(x, (H - 1) * W + x);
	for (let y = 0; y < H; y++) q.push(y * W, y * W + W - 1);
	while (q.length) {
		const i = q.pop();
		if (outside[i] || hit[i]) continue;
		outside[i] = 1;
		const x = i % W, y = (i / W) | 0;
		if (x > 0) q.push(i - 1);
		if (x < W - 1) q.push(i + 1);
		if (y > 0) q.push(i - W);
		if (y < H - 1) q.push(i + W);
	}

	// a large enclosed region as bright as the plate goes back to the plate —
	// filled, a disc of stone would travel with the subject
	{
		const seen = new Uint8Array(N);
		for (let seed = 0; seed < N; seed++) {
			if (outside[seed] || hit[seed] || seen[seed]) continue;
			const region = [seed];
			seen[seed] = 1;
			let lum = 0;
			for (let k = 0; k < region.length; k++) {
				const i = region[k];
				lum += lumOf(plate.data[i * 4], plate.data[i * 4 + 1], plate.data[i * 4 + 2]);
				const x = i % W, y = (i / W) | 0;
				for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
					if (n < 0 || outside[n] || hit[n] || seen[n]) continue;
					seen[n] = 1;
					region.push(n);
				}
			}
			if (region.length > 400 * K * K && lum / region.length > 35) for (const i of region) outside[i] = 1;
		}
	}

	// every island except the plate's own trim and stray specks of lit stone
	const keep = new Uint8Array(N);
	const seen = new Uint8Array(N);
	for (let seed = 0; seed < N; seed++) {
		if (outside[seed] || seen[seed]) continue;
		const island = [seed];
		seen[seed] = 1;
		let sx = 0, sy = 0;
		for (let k = 0; k < island.length; k++) {
			const i = island[k];
			const x = i % W, y = (i / W) | 0;
			sx += x;
			sy += y;
			for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
				if (n < 0 || outside[n] || seen[n]) continue;
				seen[n] = 1;
				island.push(n);
			}
		}
		const cx = sx / island.length, cy = sy / island.length;
		// specks: the steel heads throw a faint glint onto the slate beside them,
		// which passes the brightness test in scattered pixels
		if (Math.min(cx, W - cx, cy, H - cy) < frameAt * K || island.length < 60 * K * K) continue;
		for (const i of island) keep[i] = 1;
	}

	// grow (the dark outline ring is neutral and fails the colour test), then
	// feather so the edge is not a hard alias
	let grown = keep;
	for (let g = 0; g < Math.round(2 * K); g++) {
		const next = Uint8Array.from(grown);
		for (let y = 1; y < H - 1; y++)
			for (let x = 1; x < W - 1; x++) {
				const i = y * W + x;
				if (!grown[i] && (grown[i - 1] || grown[i + 1] || grown[i - W] || grown[i + W])) next[i] = 1;
			}
		grown = next;
	}
	return blur(Float32Array.from(grown), W, H, Math.round(2 * K));
};

// Area-average downsample to n x n: the sheen is baked on the 256 canvas.
const downsample = (data, W, H, channels, n) => {
	const out = new Float32Array(n * n * channels);
	for (let y = 0; y < n; y++) {
		const y0 = Math.floor((y * H) / n), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * H) / n));
		for (let x = 0; x < n; x++) {
			const x0 = Math.floor((x * W) / n), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * W) / n));
			for (let c = 0; c < channels; c++) {
				let s = 0;
				for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) s += data[(yy * W + xx) * channels + c];
				out[(y * n + x) * channels + c] = s / ((y1 - y0) * (x1 - x0));
			}
		}
	}
	return out;
};

// the plate with the subject removed: the hole is filled by diffusing its rim
// inward (a harmonic fill), coarse-to-fine so the middle of a 60px-wide hole
// converges, shaded a touch toward the middle, with grain from a clear patch of
// the same plate. The rim is the baked contact shadow, so what a lifted subject
// reveals reads as its shadow on the stone.
const fillPlate = (plate, alpha) => {
	const W = plate.width, H = plate.height, N = W * H, K = W / CANVAS;
	const hole = new Uint8Array(N);
	for (let i = 0; i < N; i++) hole[i] = alpha[i] > 0.03 ? 1 : 0;
	// grown: the dark outline and bevel shade run wider than the cut
	hole.set(morph(hole, W, H, Math.round(4 * K), true));
	const depth = new Float32Array(N);
	{
		let ring = hole;
		for (let k = 1; k < 64 * K; k++) {
			const next = new Uint8Array(N);
			let any = false;
			for (let y = 1; y < H - 1; y++)
				for (let x = 1; x < W - 1; x++) {
					const i = y * W + x;
					if (ring[i] && ring[i - 1] && ring[i + 1] && ring[i - W] && ring[i + W]) {
						next[i] = 1;
						depth[i] = k;
						any = true;
					}
				}
			if (!any) break;
			ring = next;
		}
	}
	const out = Buffer.from(plate.data);
	const idx = [];
	for (let i = 0; i < N; i++) if (hole[i] && (i % W) > 0 && (i % W) < W - 1 && i >= W && i < N - W) idx.push(i);

	// coarse guess: the 256 canvas, filled the Anubis way, sampled back up
	const C = CANVAS;
	const small = downsample(plate.data, W, H, 4, C);
	const smallHole = new Uint8Array(C * C);
	for (let y = 0; y < C; y++)
		for (let x = 0; x < C; x++) {
			const sx = Math.min(W - 1, Math.floor(((x + 0.5) * W) / C)), sy = Math.min(H - 1, Math.floor(((y + 0.5) * H) / C));
			smallHole[y * C + x] = hole[sy * W + sx];
		}
	for (let c = 0; c < 3; c++) {
		const v = new Float32Array(C * C);
		for (let i = 0; i < C * C; i++) v[i] = small[i * 4 + c];
		const sIdx = [];
		for (let i = 0; i < C * C; i++) if (smallHole[i] && (i % C) > 0 && (i % C) < C - 1 && i >= C && i < C * C - C) sIdx.push(i);
		for (let it = 0; it < 1500; it++) for (const i of sIdx) v[i] = 0.25 * (v[i - 1] + v[i + 1] + v[i - C] + v[i + C]);
		const full = new Float32Array(N);
		for (let i = 0; i < N; i++) full[i] = plate.data[i * 4 + c];
		for (const i of idx) {
			const x = i % W, y = (i / W) | 0;
			const sx = Math.min(C - 1, Math.floor((x * C) / W)), sy = Math.min(C - 1, Math.floor((y * C) / H));
			full[i] = v[sy * C + sx];
		}
		for (let it = 0; it < 300; it++) for (const i of idx) full[i] = 0.25 * (full[i - 1] + full[i + 1] + full[i - W] + full[i + W]);
		for (const i of idx) out[i * 4 + c] = full[i];
	}

	// grain from a clear square of this plate, inside the frame, clear of the hole
	const PATCH = (() => {
		const P = Math.round(16 * K), IN = Math.round(36 * K), M = Math.round(4 * K);
		for (let y = IN + M; y + P + M < H - IN; y += 2)
			for (let x = IN + M; x + P + M < W - IN; x += 2) {
				let clear = true;
				for (let yy = y - M; yy < y + P + M && clear; yy++)
					for (let xx = x - M; xx < x + P + M; xx++)
						if (hole[yy * W + xx]) { clear = false; break; }
				if (clear) return { x, y, w: P, h: P };
			}
		throw new Error('no clear grain patch on this plate');
	})();
	const lum = (i) => lumOf(plate.data[i * 4], plate.data[i * 4 + 1], plate.data[i * 4 + 2]);
	const G = Math.max(2, Math.round(2 * K));
	const grainAt = (x, y) => {
		const px = PATCH.x + (x % PATCH.w), py = PATCH.y + (y % PATCH.h);
		let s = 0, n = 0;
		for (let dy = -G; dy <= G; dy += Math.max(1, G >> 1))
			for (let dx = -G; dx <= G; dx += Math.max(1, G >> 1)) {
				s += lum((py + dy) * W + px + dx);
				n++;
			}
		return lum(py * W + px) - s / n;
	};
	for (const i of idx) {
		const x = i % W, y = (i / W) | 0;
		const shade = 1 - 0.1 * Math.min(1, depth[i] / (18 * K));
		const grain = grainAt(x, y) * 0.9;
		for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(out[i * 4 + c] * shade + grain)));
		out[i * 4 + 3] = 255;
	}
	return out;
};

// the sheen, on the 256 canvas: a soft diagonal band crossing the subject top
// left to bottom right, strongest on its own highlights (a gloss on the
// material, not a wipe over it), with a small four-point glint blooming on the
// brightest point the band passes near its end
const bakeSheen = (rgba256, alpha256) => {
	const W = CANVAS, H = CANVAS;
	const C = SHEEN_CELL, S = W / C;
	const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
	const atlas = new Uint8Array(SHEEN_COLS * C * rows * C * 4);
	const AW = SHEEN_COLS * C;
	const L = (i) => 0.3 * rgba256[i * 4] + 0.59 * rgba256[i * 4 + 1] + 0.11 * rgba256[i * 4 + 2];
	const lums = [];
	for (let i = 0; i < W * H; i++) if (alpha256[i] > 0.5) lums.push(L(i));
	lums.sort((a, b) => a - b);
	const median = lums[lums.length >> 1], top = lums[Math.floor(lums.length * 0.98)];
	const gloss = (i) => 0.45 + 0.55 * Math.max(0, Math.min(1, (L(i) - median) / Math.max(1, top - median)));
	let dMin = Infinity, dMax = -Infinity, glintI = -1, glintL = -Infinity;
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			if (alpha256[y * W + x] < 0.5) continue;
			dMin = Math.min(dMin, x + y);
			dMax = Math.max(dMax, x + y);
		}
	// The glint blooms where the band IS when it blooms (t = 0.8), on the most
	// GLOSSY pixel there: bright and near-neutral, so it lands on steel, glass or
	// a flame's core. Anubis took the brightest pixel anywhere in the last third,
	// and on the picks that was the end of a handle: an orange smudge.
	const at08 = dMin - 26 + 0.8 * (dMax - dMin + 52);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const i = y * W + x;
			if (alpha256[i] < 0.9 || Math.abs(x + y - at08) > 30) continue;
			const r = rgba256[i * 4], g = rgba256[i * 4 + 1], b = rgba256[i * 4 + 2];
			const l = L(i) - 1.5 * (Math.max(r, g, b) - Math.min(r, g, b));
			if (l > glintL) { glintL = l; glintI = i; }
		}
	const gx = glintI % W, gy = (glintI / W) | 0;
	const BAND = 26;
	for (let f = 0; f < SHEEN_FRAMES; f++) {
		const t = f / (SHEEN_FRAMES - 1);
		const centre = dMin - BAND + t * (dMax - dMin + 2 * BAND);
		const glint = Math.max(0, 1 - Math.abs(t - 0.8) / 0.2);
		const ox = (f % SHEEN_COLS) * C, oy = Math.floor(f / SHEEN_COLS) * C;
		for (let cy = 0; cy < C; cy++)
			for (let cx = 0; cx < C; cx++) {
				let v = 0;
				for (let sy = 0; sy < S; sy++)
					for (let sx = 0; sx < S; sx++) {
						const x = cx * S + sx, y = cy * S + sy, i = y * W + x;
						if (alpha256[i] <= 0) continue;
						const u = (x + y - centre) / BAND;
						const band = Math.exp(-u * u * 2.2);
						let star = 0;
						if (glint > 0 && glintI >= 0) {
							const dx = x - gx, dy = y - gy;
							const r = Math.hypot(dx, dy);
							const cross = Math.exp(-(dx * dx) / 3) * Math.exp(-(dy * dy) / 400) + Math.exp(-(dy * dy) / 3) * Math.exp(-(dx * dx) / 400);
							star = glint * (Math.exp(-(r * r) / 30) + 0.8 * cross);
						}
						v += alpha256[i] * Math.min(1, band * gloss(i) + star);
					}
				v /= S * S;
				const o = ((oy + cy) * AW + ox + cx) * 4;
				atlas[o] = 255;
				atlas[o + 1] = 250;
				atlas[o + 2] = 232;
				atlas[o + 3] = Math.round(255 * Math.min(1, v));
			}
	}
	return { atlas, width: AW, height: rows * C };
};

const sheenFor = (art, alpha) => {
	const W = art.width, H = art.height;
	const rgba = downsample(art.data, W, H, 4, CANVAS);
	const a = downsample(alpha, W, H, 1, CANVAS);
	return bakeSheen(rgba, a);
};

// ---------------------------------------------------------------------------
// cut mode

for (const name of Object.keys(SUBJECTS)) {
	if (only && !only.has(name)) continue;
	const plate = read(`${name}.png`);
	const W = plate.width, H = plate.height, N = W * H;
	const alpha = cut(plate, SUBJECTS[name], CLOSE[name] ?? 0, EDGE[name] ?? 30, FRAME[name] ?? 40);

	const subject = new Uint8Array(N * 4);
	for (let i = 0; i < N; i++)
		subject.set([plate.data[i * 4], plate.data[i * 4 + 1], plate.data[i * 4 + 2], Math.round(255 * alpha[i])], i * 4);
	write(`${name}_subject.png`, W, H, subject);
	write(`${name}_plate.png`, W, H, fillPlate(plate, alpha));

	// the drop shadow: the silhouette grown and heavily softened — so soft it
	// ships at the 256 canvas
	const K = W / CANVAS;
	const R = Math.round(5 * K);
	const soft = downsample(blur(blur(alpha, W, H, R), W, H, R), W, H, 1, CANVAS);
	const shadow = new Uint8Array(CANVAS * CANVAS * 4);
	for (let i = 0; i < CANVAS * CANVAS; i++) shadow.set([8, 6, 4, Math.round(255 * Math.min(1, soft[i] * 1.15))], i * 4);
	write(`${name}_shadow.png`, CANVAS, CANVAS, shadow);

	const sheen = sheenFor(plate, alpha);
	write(`${name}_sheen.png`, sheen.width, sheen.height, sheen.atlas);

	let px = 0;
	for (let i = 0; i < N; i++) if (alpha[i] > 0.5) px++;
	console.log(`${name}: subject ${((100 * px) / N).toFixed(1)}% -> ${name}_{subject,plate,shadow,sheen}.png`);
}

// ---------------------------------------------------------------------------
// panel mode: glow + sheen, masked to the spec's `inked` region
{
	// the wins and the dynamite's landing — not the swell, which draws the
	// plain sprite and needs no layers
	const { MESH_WINS, MESH_LANDS } = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/index.ts')).href);
	for (const spec of [...Object.values(MESH_WINS), ...Object.values(MESH_LANDS)]) {
		if (spec.mode !== 'panel') continue;
		const name = spec.symbol.toLowerCase();
		if (only && !only.has(name)) continue;
		const art = read(`${name}.png`);
		const W = art.width, H = art.height, N = W * H, K = W / CANVAS;
		const hard = new Float32Array(N);
		for (let i = 0; i < N; i++) {
			// the spec speaks the 256 canvas
			const inside = spec.inked([((i % W) + 0.5) / K, (((i / W) | 0) + 0.5) / K]);
			const coloured = !spec.inkColor || spec.inkColor(art.data[i * 4], art.data[i * 4 + 1], art.data[i * 4 + 2]);
			hard[i] = inside && coloured ? 1 : 0;
		}
		const mask = blur(hard, W, H, Math.round(3 * K));

		// The glow is a soft additive flash at ~30%, so it ships at GLOW px, not
		// the art's 820-1024: at full size the ten of them were 13MB. The mesh
		// samples by UV, so the size does not matter to it. Colour is zeroed
		// wherever the mask is empty, which is most of the tile and compresses
		// to nothing.
		const glowFull = new Float32Array(N * 4);
		for (let i = 0; i < N; i++) {
			const a = mask[i];
			for (let c = 0; c < 3; c++) glowFull[i * 4 + c] = a > 0 ? art.data[i * 4 + c] : 0;
			glowFull[i * 4 + 3] = 255 * a;
		}
		const G = Math.min(GLOW, W);
		const glow = Uint8Array.from(downsample(glowFull, W, H, 4, G), (v) => Math.round(v));
		write(`${name}_glow.png`, G, G, glow);

		const sheen = sheenFor(art, mask);
		write(`${name}_sheen.png`, sheen.width, sheen.height, sheen.atlas);
		console.log(`${name}: panel -> ${name}_{glow,sheen}.png`);
	}
}
