// Two textures that let the painted forge burn instead of sitting still.
//
// bg_background.png is one flat painting. Everything in it that should be moving
// — the dragon's lava pour, the cauldron, the furnace mouth, the cracks in the
// floor, and the flames wrapped around the reel frame — is baked into the same
// image as the stone, which must not move at all. A ken-burns drift over the
// whole picture cannot separate them: drift the fire and the anvil drifts with
// it.
//
// So the fire is separated out ONCE, here, and emitted as a short looping
// sequence: heat_flow_00..NN.png, each frame the picture's own heat modulated by
// streaked noise that has scrolled a little further. Cross-fading through them
// makes the hot pixels churn and the pour run downward while every stone pixel
// stays exactly where it was painted.
//
// ── why this is baked and not done at runtime ──
// The first version did it live: one heat MASK, with noise tiles scrolled
// underneath it and blended additively. It rendered essentially nothing, and the
// reason is worth keeping. In Pixi v8 a sprite mask is a filter —
// `AlphaMaskEffect extends FilterEffect` — so the masked container is drawn into
// an isolated render texture that starts out transparent. Additive blending adds
// to whatever is already in the framebuffer, and inside that texture there was
// nothing to add to; the result then came back as a low-alpha orange film laid
// over fire that was already bright orange.
//
// Additive light has to be drawn straight into the scene. That rules out a mask,
// which is why the restriction to hot pixels has to be baked into the texture's
// own alpha instead — which is all these frames are.
//
// Usage: node design/generate_lava_flow.mjs <dir with node_modules>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const genDir = process.argv[2];
if (!genDir) {
	console.error('usage: node generate_lava_flow.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(genDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCENE = path.join(appRoot, 'static/assets/sprites/emberForgeBackground/bg_background.png');
const OUT = path.join(appRoot, 'static/assets/sprites/emberForgeFx');
const POINTS_OUT = path.join(appRoot, 'src/game/heatPoints.ts');

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (edge0, edge1, v) => {
	const t = clamp01((v - edge0) / (edge1 - edge0));
	return t * t * (3 - 2 * t);
};

// ── 1. the heat mask ──────────────────────────────────────────────────────────
//
// Two conditions, multiplied, because either one alone is wrong:
//
//   brightness  alone also catches the lit rims of the stonework and the pale
//               highlights along the brass, which are reflections of the fire
//               and must stay put
//   warmth      alone also catches the murky red gloom filling the whole room,
//               which is dark and enormous
//
// Only hot AND bright is actual fire. Warmth is measured as red over blue, since
// this palette runs from near-black through deep red to white-hot: blue only
// climbs where a pixel is approaching white, and the small penalty that puts on
// the very brightest cores is worth it for how cleanly it rejects the gloom.
const buildHeatMask = () => {
	const src = PNG.sync.read(fs.readFileSync(SCENE));
	// Half resolution. This is a soft mask over soft glow — the extra pixels buy
	// nothing visible and the file is shipped to every player.
	const W = src.width >> 1;
	const H = src.height >> 1;
	const out = new PNG({ width: W, height: H });

	let hot = 0;
	for (let y = 0; y < H; y += 1) {
		for (let x = 0; x < W; x += 1) {
			// box-filter the 2x2 it came from, so the downsample does not alias the
			// thin bright tongues into speckle
			let r = 0;
			let g = 0;
			let b = 0;
			for (let dy = 0; dy < 2; dy += 1) {
				for (let dx = 0; dx < 2; dx += 1) {
					const i = ((y * 2 + dy) * src.width + (x * 2 + dx)) << 2;
					r += src.data[i];
					g += src.data[i + 1];
					b += src.data[i + 2];
				}
			}
			r /= 4;
			g /= 4;
			b /= 4;

			const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
			const warmth = (r - b) / 255;

			const bright = smoothstep(0.16, 0.62, lum);
			const warm = smoothstep(0.06, 0.3, warmth);
			// ^1.35 pulls the mid-tones down: without it the dim red wash over the
			// brickwork keeps enough alpha to shimmer, and the whole floor crawls.
			const heat = clamp01(bright * warm) ** 1.35;

			const p = (y * W + x) << 2;
			out.data[p] = 255;
			out.data[p + 1] = 255;
			out.data[p + 2] = 255;
			out.data[p + 3] = Math.round(heat * 255);
			if (heat > 0.5) hot += 1;
		}
	}

	// Not written to disk any more — the heat is only an intermediate now. It is
	// what the flow frames are cut from and what the ember sources are sampled
	// from, and nothing at runtime ever wants it on its own.
	return { W, H, hotPct: (100 * hot) / (W * H), heat: out.data };
};

// ── 3. where the embers come from ────────────────────────────────────────────
//
// The drifting embers used to be seeded uniformly across the canvas, which is
// how you get sparks rising out of the flagstones. They should come off the
// fire, so the emitters are sampled FROM the heat mask and baked out as scene
// coordinates the runtime can just read.
//
// Emitted as a TS module rather than a JSON asset: it is a few hundred bytes of
// constants, and going through the asset loader would mean another fetch,
// another `assets.ts` entry, and a failure mode where the sparks quietly stop.
const EMBER_SOURCES = 44;

const buildHeatPoints = ({ W, H, heat }) => {
	// Weighted reservoir over the hot pixels: every hot pixel gets a shot at a
	// slot in proportion to how hot it is, so the furnace mouth and the pour —
	// which are large and bright — get more emitters than a thin tongue of flame,
	// without any region being hand-listed.
	//
	// Deterministic: a fixed seed, because this file is committed and a rebuild
	// that reshuffles every ember is noise in the diff.
	let seed = 0x9e3779b9;
	const rand = () => {
		seed ^= seed << 13;
		seed ^= seed >>> 17;
		seed ^= seed << 5;
		return ((seed >>> 0) % 1000000) / 1000000;
	};

	const chosen = [];
	let seen = 0;
	for (let y = 0; y < H; y += 1) {
		for (let x = 0; x < W; x += 1) {
			const a = heat[((y * W + x) << 2) + 3] / 255;
			if (a < 0.45) continue;
			seen += a;
			if (chosen.length < EMBER_SOURCES) {
				chosen.push({ x, y, a });
			} else if (rand() < (a * EMBER_SOURCES) / seen) {
				chosen[Math.floor(rand() * EMBER_SOURCES)] = { x, y, a };
			}
		}
	}
	// Sorted so the committed file has a stable order independent of the sampling.
	chosen.sort((p, q) => p.y - q.y || p.x - q.x);

	const rows = chosen
		.map(
			(p) =>
				`\t{ x: ${(p.x / W).toFixed(4)}, y: ${(p.y / H).toFixed(4)}, heat: ${p.a.toFixed(2)} },`,
		)
		.join('\n');

	fs.writeFileSync(
		POINTS_OUT,
		`// GENERATED by design/generate_lava_flow.mjs — do not edit by hand.
//
// Points on bg_background.png that are actually on fire, in scene-normalised
// coordinates (0..1 across the painting, NOT across the canvas). Background.svelte
// seeds its drifting embers here so sparks come off the furnace, the cauldron and
// the dragon's pour instead of rising out of the flagstones.
export type HeatPoint = { x: number; y: number; heat: number };

export const HEAT_POINTS: HeatPoint[] = [
${rows}
];
`,
	);
	return chosen.length;
};

// ── 2. the flow noise ─────────────────────────────────────────────────────────
//
// Seamless on both axes, so it can be scrolled in any direction forever by two
// copies chasing each other with no visible join.
//
// Stretched vertically before sampling: isotropic noise scrolled downward reads
// as static crawling, not as liquid. Elongating the features into streaks along
// the direction of travel is the whole difference between "noisy" and "flowing".
const FLOW_SIZE = 512;
const LATTICE = 8; // period of the base octave, in cells across FLOW_SIZE
const OCTAVES = 4;
const Y_STRETCH = 2.6; // features this many times taller than they are wide

const buildFlowNoise = () => {
	// Periodic value noise: the lattice wraps at `period`, so every octave — and
	// therefore the sum — is seamless.
	// The two axes wrap at DIFFERENT periods, and the hash has to know both.
	//
	// The vertical stretch means y crosses fewer lattice cells than x over the same
	// 512 pixels, so the y lattice wraps at `periodY`. Folding y with the x period
	// instead — which is the obvious way to write this — leaves the top and bottom
	// rows sampling unrelated lattice points, and the texture does not tile at all.
	// Math.imul, not `*`. A 32-bit mixing constant times a 32-bit accumulator is a
	// 64-bit product, and a double carries only 53 bits of mantissa — so plain `*`
	// silently drops the low bits, which are the only ones the following shift-xor
	// reads. Written with `*` this hash returned a value under the contrast
	// threshold for every single pixel and the texture came out entirely empty.
	const hash = (ix, iy, periodX, periodY) => {
		const x = ((ix % periodX) + periodX) % periodX;
		const y = ((iy % periodY) + periodY) % periodY;
		let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	};
	const fade = (t) => t * t * (3 - 2 * t);
	const valueNoise = (x, y, periodX, periodY) => {
		const ix = Math.floor(x);
		const iy = Math.floor(y);
		const fx = fade(x - ix);
		const fy = fade(y - iy);
		const a = hash(ix, iy, periodX, periodY);
		const b = hash(ix + 1, iy, periodX, periodY);
		const c = hash(ix, iy + 1, periodX, periodY);
		const d = hash(ix + 1, iy + 1, periodX, periodY);
		return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
	};

	// fbm at an arbitrary point of the (periodic) noise field.
	const fbm = (u, v) => {
		let sum = 0;
		let amp = 1;
		let norm = 0;
		for (let o = 0; o < OCTAVES; o += 1) {
			const period = LATTICE * 2 ** o;
			// The stretch has to stay commensurate with the period or the wrap
			// breaks: sample fewer lattice cells down the axis, not a fraction of
			// one. Rounding up keeps at least one full cell on the tallest octave.
			const periodY = Math.max(1, Math.round(period / Y_STRETCH));
			sum += amp * valueNoise(u * period, v * periodY, period, periodY);
			norm += amp;
			amp *= 0.5;
		}
		// Contrast: raw fbm is a grey mush centred on 0.5. Fire is mostly dark
		// with bright veins running through it, which is what this curve makes.
		return clamp01((sum / norm - 0.34) / 0.42) ** 1.5;
	};

	return fbm;
};

// ── 4. the flow frames ───────────────────────────────────────────────────────
//
// FRAMES steps through exactly ONE period of the noise, so the last frame runs
// back into the first with no jump — the loop is seamless in time for the same
// reason the texture was seamless in space.
const FRAMES = 12;
const TILES_X = 2.5; // how many times the noise repeats across the picture
const TILES_Y = 2;
// The floor matters: at 0 the fire would go completely out wherever a dark band
// of noise crossed it, which reads as the picture flickering rather than as
// something flowing through it. The fire always burns; the bands ride over it.
const FLOOR = 0.4;

const buildFlowFrames = ({ W, H, heat }, fbm) => {
	const dir = path.join(OUT, 'flow');
	fs.mkdirSync(dir, { recursive: true });

	// Precompute the noise once per frame offset rather than per pixel per frame:
	// the field is the same, only the v offset moves.
	let bytes = 0;
	for (let f = 0; f < FRAMES; f += 1) {
		const phase = f / FRAMES;
		const png = new PNG({ width: W, height: H });
		for (let y = 0; y < H; y += 1) {
			for (let x = 0; x < W; x += 1) {
				const p = (y * W + x) << 2;
				const h = heat[p + 3] / 255;
				// White, tinted at runtime. Storing the painting's actual fire colour
				// per pixel would quadruple these files to say something the artwork
				// underneath is already saying.
				png.data[p] = 255;
				png.data[p + 1] = 255;
				png.data[p + 2] = 255;
				if (h <= 0) continue;
				// Sideways drift as well as downward, so the flow is not a shutter
				// coming straight down the picture.
				const u = (x / W) * TILES_X + phase * 0.35;
				const v = (y / H) * TILES_Y + phase;
				png.data[p + 3] = Math.round(h * (FLOOR + (1 - FLOOR) * fbm(u, v)) * 255);
			}
		}
		const file = path.join(dir, `heat_flow_${String(f).padStart(2, '0')}.png`);
		const buffer = PNG.sync.write(png);
		fs.writeFileSync(file, buffer);
		bytes += buffer.length;
	}
	return { bytes };
};

const heat = buildHeatMask();
console.log(
	`heat           ${heat.W}x${heat.H}  ${heat.hotPct.toFixed(1)}% of the picture reads as hot`,
);

const points = buildHeatPoints(heat);
console.log(`heatPoints.ts  ${points} ember sources sampled off the fire`);
if (points < EMBER_SOURCES) {
	console.error('not enough hot pixels to seed the embers — the heat mask is probably too tight');
	process.exit(1);
}

const fbm = buildFlowNoise();
const frames = buildFlowFrames(heat, fbm);
console.log(
	`flow/          ${FRAMES} frames  ${(frames.bytes / 1024 / 1024).toFixed(2)}MB total`,
);
