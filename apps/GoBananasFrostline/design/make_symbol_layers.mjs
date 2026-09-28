// The high-pay symbols split into the layers their mesh wins are drawn from
// (src/game/meshWin/*, SymbolMeshWin.svelte). For each of h1-h4:
//
//   h{n}_plate.png    the stone with the subject lifted off it
//   h{n}_subject.png  the subject alone — what the mesh deforms
//   h{n}_shadow.png   a soft dark silhouette of the subject, drawn UNDER the
//                     mesh while it is lifted, so the height reads: the plate's
//                     own baked contact shadow stays put, this one spreads
//   h{n}_sheen.png    an atlas of SHEEN_FRAMES frames of light sweeping across
//                     the subject, pre-clipped to its shape and weighted to its
//                     highlights. Drawn additively through the SAME mesh, so the
//                     light rides the deformation. Baked rather than shaded
//                     because the game runs on WebGPU by default and a custom
//                     mesh shader would need a WGSL and a GLSL twin.
//
// Plate and subject come out of h{n}.png pixel-for-pixel, so at rest the two
// layers recompose the original exactly.
//
// The PANEL-mode symbols (L1-L5, W, S — meshRig.panelParts) are not cut: the
// mesh draws their own sprite. They get only
//   {n}_glow.png      the art with its alpha masked to the spec's `inked`
//                     region, for the additive flash — so the hit lights the
//                     letter or the head, not the whole slab of stone
//   {n}_sheen.png     the light sweep, masked the same way
// The mask comes from the spec itself (src/game/meshWin), so it cannot drift
// from the region the gate checks.
//
// Usage: node design/make_symbol_layers.mjs E:\stake\tools\gen

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
const read = (name) => PNG.sync.read(fs.readFileSync(path.join(DIR, name)));
const write = (name, w, h, data) => {
	const png = new PNG({ width: w, height: h });
	png.data.set(data);
	fs.writeFileSync(path.join(DIR, name), PNG.sync.write(png));
};

export const SHEEN_FRAMES = 24;
export const SHEEN_COLS = 6;
export const SHEEN_CELL = 128; // half the 256 canvas; the light is soft

// What counts as SUBJECT, per symbol.
//
// ONE TEST FOR ALL OF THEM, because this game's plates are all the same slate
// blue and none of its subjects is blue. That is the opposite of GoBananubis,
// where the plate is neutral basalt and each subject needed its own colour:
// here the PLATE is the coloured thing, which is what makes one test enough.
//
// Measured over each 256px tile (blue-minus-red):
//
//                 subject (b-r < 10)   valley 10..29   plate (>= 30)
//     h1               29.8%               5.8%            64.4%
//     h2               17.5                1.6             81.0
//     h3               26.6                5.9             67.5
//     h4               22.3                2.6             75.1
//
// The valley is where an edge pixel lands, so a threshold inside it costs a
// pixel of the outline either way. 14 sits in it for all four.
//
// This is the same discriminator design/cut_prop_from_plate.mjs uses to cut the
// grenade prop, and for the reason written up there: keying on the SUBJECT
// fails on neutral parts (steel rings, silver caps), keying on the PLATE keeps
// them.
const blueGate = (r, g, b) => b - r < 14;
const SUBJECTS = { h1: blueGate, h2: blueGate, h3: blueGate, h4: blueGate };

// The frame band, in the art's own 256px canvas: the bezel and its ink border
// run to ~11px, and every subject's own bbox starts further in. 44 was
// GoBananubis's much heavier basalt frame.
const FRAME = 18;

// Morphological close radius per symbol (0 = none): dilate then erode the
// colour mask, sealing gaps narrower than 2R. h3 needs it — the chest's
// interior between lid and box is near-black, touches the outside at both
// ends, and otherwise came out as a hole through the chest. h4's silver collar
// is neutral grey and runs edge to edge across the stem, so 4px seals it; the
// loop's 40px window is far too wide to be touched.
// h3's crate has a dark open interior that touches the outside at the lid, the
// same shape GoBananubis's chest had; the rest need none. The lantern's pierced
// vent holes are deliberately NOT closed — they show plate through, and the cut
// sends an enclosed plate-bright region back to the plate on its own.
const CLOSE = { h1: 0, h2: 0, h3: 6, h4: 0 };

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

const cut = (plate, close) => {
	const W = plate.width, H = plate.height, N = W * H;
	const test = plate.test;
	// Nothing within EDGE of the border is ever subject. The centroid test below
	// is not enough on its own: on h3 the right and bottom frame bars join into
	// one L whose centroid lands INSIDE the band, and the chest came out framed.
	const EDGE = 38;
	const hit = new Uint8Array(N);
	for (let i = 0; i < N; i++) {
		const x = i % W, y = (i / W) | 0;
		if (Math.min(x, y, W - 1 - x, H - 1 - y) < EDGE) continue;
		hit[i] = test(plate.data[i * 4], plate.data[i * 4 + 1], plate.data[i * 4 + 2]) ? 1 : 0;
	}
	if (close) hit.set(morph(morph(hit, W, H, close, true), W, H, close, false));

	// everything the outside can reach without crossing the subject — the rest
	// (incised lines, the pupil, dark contours inside the shape) is subject
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

	// An enclosed hole is usually subject — an incised line, the pupil, the
	// chest's dark interior. But the ankh's loop encloses a window of PLATE, and
	// filled, a disc of stone would travel with the ankh when it hops. So a
	// large enclosed region as bright as the plate (the basalt sits at ~45-70
	// luminance; the pupil and the chest interior are far darker) goes back
	// to the outside.
	{
		const seen = new Uint8Array(N);
		for (let seed = 0; seed < N; seed++) {
			if (outside[seed] || hit[seed] || seen[seed]) continue;
			const region = [seed];
			seen[seed] = 1;
			let lum = 0;
			for (let k = 0; k < region.length; k++) {
				const i = region[k];
				lum += (plate.data[i * 4] + plate.data[i * 4 + 1] + plate.data[i * 4 + 2]) / 3;
				const x = i % W, y = (i / W) | 0;
				for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
					if (n < 0 || outside[n] || hit[n] || seen[n]) continue;
					seen[n] = 1;
					region.push(n);
				}
			}
			if (region.length > 400 && lum / region.length > 35) for (const i of region) outside[i] = 1;
		}
	}

	// every island except the plate's own trim, rejected by POSITION
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
		if (Math.min(cx, W - cx, cy, H - cy) < FRAME || island.length < 12) continue;
		for (const i of island) keep[i] = 1;
	}

	// grow 2px (the dark outline ring is neutral and fails the colour test),
	// then feather 2px so the edge is not a hard alias
	let grown = keep;
	for (let g = 0; g < 2; g++) {
		const next = Uint8Array.from(grown);
		for (let y = 1; y < H - 1; y++)
			for (let x = 1; x < W - 1; x++) {
				const i = y * W + x;
				if (!grown[i] && (grown[i - 1] || grown[i + 1] || grown[i - W] || grown[i + W])) next[i] = 1;
			}
		grown = next;
	}
	return blur(Float32Array.from(grown), W, H, 2);
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

// the plate with the subject removed: the hole is filled by diffusing its rim
// inward (a harmonic fill), shaded a touch toward the middle, with grain from a
// clear patch of the same plate. The rim is the baked contact shadow, so what
// is revealed under a lifted subject reads as its shadow on the stone.
const fillPlate = (plate, alpha) => {
	const W = plate.width, H = plate.height, N = W * H;
	const hole = new Uint8Array(N);
	for (let i = 0; i < N; i++) hole[i] = alpha[i] > 0.03 ? 1 : 0;
	// grown 4px: the dark outline and bevel shade around a subject run wider
	// than its cut, and at 2px h4 left a dotted ghost of the ankh's outline
	for (let g = 0; g < 4; g++) {
		const next = Uint8Array.from(hole);
		for (let y = 1; y < H - 1; y++)
			for (let x = 1; x < W - 1; x++) {
				const i = y * W + x;
				if (!hole[i] && (hole[i - 1] || hole[i + 1] || hole[i - W] || hole[i + W])) next[i] = 1;
			}
		hole.set(next);
	}
	const depth = new Float32Array(N);
	let ring = hole;
	for (let k = 1; k < 64; k++) {
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
	const out = Buffer.from(plate.data);
	const idx = [];
	for (let i = 0; i < N; i++) if (hole[i]) idx.push(i);
	for (let c = 0; c < 3; c++) {
		const v = new Float32Array(N);
		for (let i = 0; i < N; i++) v[i] = plate.data[i * 4 + c];
		let rim = 0, rimN = 0;
		for (const i of idx)
			for (const n of [i - 1, i + 1, i - W, i + W])
				if (!hole[n]) {
					rim += v[n];
					rimN++;
				}
		for (const i of idx) v[i] = rim / rimN;
		for (let it = 0; it < 1500; it++) for (const i of idx) v[i] = 0.25 * (v[i - 1] + v[i + 1] + v[i - W] + v[i + W]);
		for (const i of idx) out[i * 4 + c] = v[i];
	}
	// grain comes from a clear square of this plate, inside the frame and
	// clear of the hole. A fixed patch overlapped h4's ankh and tiled
	// its cracks across the fill.
	const PATCH = (() => {
		// 16px from the frame's inner edge (36) in: h3's chest fills its plate
		// nearly to the frame and leaves no 24px square anywhere
		const P = 16, IN = 36, M = 4;
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
	const lum = (i) => (plate.data[i * 4] + plate.data[i * 4 + 1] + plate.data[i * 4 + 2]) / 3;
	const grainAt = (x, y) => {
		const px = PATCH.x + (x % PATCH.w), py = PATCH.y + (y % PATCH.h);
		let s = 0, n = 0;
		for (let dy = -2; dy <= 2; dy++)
			for (let dx = -2; dx <= 2; dx++) {
				s += lum((py + dy) * W + px + dx);
				n++;
			}
		return lum(py * W + px) - s / n;
	};
	for (const i of idx) {
		const x = i % W, y = (i / W) | 0;
		const shade = 1 - 0.1 * Math.min(1, depth[i] / 18);
		const grain = grainAt(x, y) * 0.9;
		for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(out[i * 4 + c] * shade + grain)));
		out[i * 4 + 3] = 255;
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

for (const name of Object.keys(SUBJECTS)) {
	const plate = read(`${name}.png`);
	plate.test = SUBJECTS[name];
	const W = plate.width, H = plate.height, N = W * H;
	const alpha = cut(plate, CLOSE[name]);

	const subject = new Uint8Array(N * 4);
	for (let i = 0; i < N; i++) {
		subject.set([plate.data[i * 4], plate.data[i * 4 + 1], plate.data[i * 4 + 2], Math.round(255 * alpha[i])], i * 4);
	}
	write(`${name}_subject.png`, W, H, subject);
	write(`${name}_plate.png`, W, H, fillPlate(plate, alpha));

	// the drop shadow: the silhouette grown and heavily softened
	const soft = blur(blur(alpha, W, H, 5), W, H, 5);
	const shadow = new Uint8Array(N * 4);
	for (let i = 0; i < N; i++) shadow.set([8, 6, 4, Math.round(255 * Math.min(1, soft[i] * 1.15))], i * 4);
	write(`${name}_shadow.png`, W, H, shadow);

	const sheen = bakeSheen(plate, alpha);
	write(`${name}_sheen.png`, sheen.width, sheen.height, sheen.atlas);

	let px = 0;
	for (let i = 0; i < N; i++) if (alpha[i] > 0.5) px++;
	console.log(`${name}: subject ${px}px -> ${name}_{subject,plate,shadow,sheen}.png`);
}

// ---------------------------------------------------------------------------
// the panel-mode symbols: glow + sheen, masked to the spec's `inked` region
{
	const { MESH_WINS } = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/index.ts')).href);
	for (const spec of Object.values(MESH_WINS)) {
		if (spec.mode !== 'panel') continue;
		const name = spec.symbol.toLowerCase();
		const art = read(`${name}.png`);
		const W = art.width, H = art.height, N = W * H;
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
	}
}
