// Two textures that let the painted forge burn instead of sitting still.
//
// bg_background.png is one flat painting. Everything in it that should be moving
// — the dragon's lava pour, the cauldron, the furnace mouth, the cracks in the
// floor, and the flames wrapped around the reel frame — is baked into the same
// image as the stone, which must not move at all. A ken-burns drift over the
// whole picture cannot separate them: drift the fire and the anvil drifts with
// it.
//
// So the fire is separated out ONCE, here, and animated at runtime:
//
//   heat_mask.png  where the picture is hot, as an alpha mask
//   fx_flow.png    seamless streaked noise, scrolled through that mask
//
// Scrolling the noise inside the mask makes the hot pixels churn and the pour
// run downward while every stone pixel stays exactly where it was painted.
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

	fs.writeFileSync(path.join(OUT, 'heat_mask.png'), PNG.sync.write(out));
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

	const png = new PNG({ width: FLOW_SIZE, height: FLOW_SIZE });
	for (let y = 0; y < FLOW_SIZE; y += 1) {
		for (let x = 0; x < FLOW_SIZE; x += 1) {
			let sum = 0;
			let amp = 1;
			let norm = 0;
			for (let o = 0; o < OCTAVES; o += 1) {
				const period = LATTICE * 2 ** o;
				const u = (x / FLOW_SIZE) * period;
				// The stretch has to stay commensurate with the period or the wrap
				// breaks: sample fewer lattice cells down the axis, not a fraction of
				// one. Rounding up keeps at least one full cell on the tallest octave.
				const periodY = Math.max(1, Math.round(period / Y_STRETCH));
				const v = (y / FLOW_SIZE) * periodY;
				sum += amp * valueNoise(u, v, period, periodY);
				norm += amp;
				amp *= 0.5;
			}
			// Contrast: raw fbm is a grey mush centred on 0.5. Fire is mostly dark
			// with bright veins running through it, which is what this curve makes.
			const n = clamp01((sum / norm - 0.34) / 0.42) ** 1.5;
			const v = Math.round(n * 255);

			const p = (y * FLOW_SIZE + x) << 2;
			png.data[p] = 255;
			png.data[p + 1] = 255;
			png.data[p + 2] = 255;
			png.data[p + 3] = v;
		}
	}

	fs.writeFileSync(path.join(OUT, 'fx_flow.png'), PNG.sync.write(png));

	// The seam is the one thing that would be obvious in motion and invisible in a
	// still, so it is asserted rather than eyeballed.
	//
	// The test is NOT "opposite edges are equal" — they should not be. Row 0 and
	// row 511 are two pixels apart across the wrap, so they differ by one ordinary
	// gradient step, and on the finest octave (8px per lattice cell) that step is
	// large. Comparing them directly failed a texture that tiles perfectly.
	//
	// What actually matters is that the step ACROSS the seam is no bigger than the
	// steps everywhere else. Then the wrap is indistinguishable from any other
	// pair of adjacent rows, which is the definition of seamless.
	// The baseline is averaged over the WHOLE texture, not one row. The contrast
	// curve clips large areas flat, so a single mid-texture row can read 0.01 and
	// make any seam at all look catastrophic by comparison.
	const alpha = (x, y) => png.data[((y * FLOW_SIZE + x) << 2) + 3];
	let interior = 0;
	let interiorN = 0;
	for (let y = 0; y < FLOW_SIZE - 1; y += 1) {
		for (let x = 0; x < FLOW_SIZE - 1; x += 1) {
			interior += Math.abs(alpha(x, y) - alpha(x, y + 1));
			interior += Math.abs(alpha(x, y) - alpha(x + 1, y));
			interiorN += 2;
		}
	}
	let seam = 0;
	for (let i = 0; i < FLOW_SIZE; i += 1) {
		seam += Math.abs(alpha(i, FLOW_SIZE - 1) - alpha(i, 0));
		seam += Math.abs(alpha(FLOW_SIZE - 1, i) - alpha(0, i));
	}
	return { seam: seam / (FLOW_SIZE * 2), interior: interior / interiorN };
};

const heat = buildHeatMask();
console.log(
	`heat_mask.png  ${heat.W}x${heat.H}  ${heat.hotPct.toFixed(1)}% of the picture reads as hot`,
);

const points = buildHeatPoints(heat);
console.log(`heatPoints.ts  ${points} ember sources sampled off the fire`);
if (points < EMBER_SOURCES) {
	console.error('not enough hot pixels to seed the embers — the heat mask is probably too tight');
	process.exit(1);
}

const flow = buildFlowNoise();
console.log(
	`fx_flow.png    ${FLOW_SIZE}x${FLOW_SIZE}  ` +
		`step across seam ${flow.seam.toFixed(2)} vs ${flow.interior.toFixed(2)} inside`,
);
if (flow.seam > flow.interior * 1.5 + 1) {
	console.error('fx_flow.png does not tile — the scroll would show a moving seam');
	process.exit(1);
}
