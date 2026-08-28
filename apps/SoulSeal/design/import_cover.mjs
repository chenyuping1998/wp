// Key a cover character off its black matte.
//
//   node design/import_cover.mjs <dir with node_modules for pngjs> [name]
//
// `name` picks design/source/cover/<name>_src.png and writes <name>.png.
// Defaults to `character`.
//
// ── why this is not import_symbols.mjs ──
//
// A symbol is opaque art with a hard edge. These characters are wrapped in
// SPIRIT FLAME - a warm glow that fades over many pixels into the black. Key it
// with a symbol's threshold and the glow is sliced off square, which is worse
// than not keying at all: the figure then sits in a visible rectangle of missing
// glow.
//
// ── why the alpha is not a brightness threshold ──
//
// The obvious approach is "brightness is coverage": a glow pixel is flame over
// black, so alpha = luminance. That was the first version and it fails, twice
// over, and the second failure is the interesting one.
//
// First failure: the threshold was set at 235, on the reasoning that anything
// short of white is partly transparent. The ROBE went 40% transparent and the
// character read as fog over the background.
//
// Second failure: lowering it did not fix the general case. Measured on the
// full-body art, the darkest artwork and the dimmest flame OVERLAP -
//
//     belt        p05 19   p10 24   median 47
//     outer flame p05  0   p10  1   median 33
//
// - so there is no brightness that separates cloth from flame. There cannot be:
// a dark fold and a faint wisp are the same handful of dark pixels.
//
// ── what actually separates them ──
//
// POSITION. A faint wisp is next to the matte; a dark fold is deep inside the
// figure. So the alpha ramp is applied only within FEATHER pixels of the matte,
// measured by breadth-first search out from it, and everything further in is
// opaque whatever its brightness. The belt is 150px from any matte pixel and
// stays solid; the flame's fade-out is by definition at the boundary and stays
// soft.
//
// The cost of the approximation: glow that fades further than FEATHER from the
// matte keeps full alpha, so the outermost breath of the flame carries a faint
// dark halo. Two exact alternatives were tried and both fail on this art - hole
// filling leaves the belt open, because its straps run down into the hem and out
// of the bottom of the frame, and a plain luminance ramp cannot tell cloth from
// glow at all (above). The halo only reads against a LIGHT ground; these
// characters composite over the game's night background, where it is invisible.
// Checked on both - design/preview_cover_*_light.png and _dark.png.
//
// ── and why finding the matte is itself not a threshold ──
//
// The matte is not uniformly black. The full-body art carries a cool vignette
// that lifts the bottom-right corner to luminance 38, and NOT ONE PIXEL of its
// bottom edge is below 8 - so a flood seeded at a fixed floor cannot get into
// that corner at all, and it stays as an opaque black wedge beside the hem.
//
// Raising the floor is not open either: 38 is inside the belt's own range, so
// any threshold that reaches the corner also eats the belt. Letting the flood
// climb the gradient on a tolerance leaks worse still - dark artwork chains
// together, and a step of 3 already took 46% of the belt.
//
// HUE is what separates them, cleanly, and for a physical reason: the lift is
// cool ambient spill while every part of the character is lit warm.
//
//     black wedge   13,15,21   b-r  +8      belt          49,33,33   b-r -16
//     corner        23,29,37   b-r +14      hem shadow    71,43,61   b-r -10
//     true matte     0, 0, 0   b-r   0      spirit flame  64,42,29   b-r -35
//
// So the flood climbs the vignette on a tolerance, but only through pixels that
// are not warm. Measured over the whole image that clears 99% of the wedge and
// 100% of the corner while taking 0.0% of the belt, 0.0% of the hem and 0.0% of
// the dark purple sleeve.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/import_cover.mjs <dir with node_modules/pngjs> [name]');
	process.exit(1);
}
const NAME = process.argv[3] ?? 'character';
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(appRoot, 'design/source/cover');
const SRC = path.join(DIR, `${NAME}_src.png`);
const OUT = path.join(DIR, `${NAME}.png`);

// The flood is SEEDED only at border pixels this dark. Both images' mattes reach
// pure black somewhere along the border, so the seeds are never in doubt; the
// vignette is climbed afterwards rather than seeded into.
const FLOOR = 8;
// Climbing the vignette: a neighbour joins the matte if it is no more than this
// much brighter than the brightest pixel on the path that reached it. Small
// enough that a painted edge stops it, large enough for a smooth gradient.
const CLIMB_STEP = 4;
// A hard cap on the climb, so a long shallow ramp cannot walk up into artwork.
// The corner needed 44; the belt starts at 19 but is warm and excluded by hue.
const CLIMB_CEILING = 55;
// Blue minus red. The matte and its spill are neutral-to-cool (0 to +14); every
// part of the character is warm (-10 or lower). Slack for JPEG noise.
const COOL_MIN = -2;
// How far the alpha ramp reaches in from the matte, in pixels. Wide enough for a
// soft flame edge, far short of anything structural: the nearest solid artwork
// to the matte on these images is the sleeve outline, which is a hard edge, and
// the deepest interior shadow is over a hundred pixels in.
const FEATHER = 26;
// Inside the feather band, this is the brightness at which a pixel counts as
// fully covered.
const FEATHER_SOLID = 150;
// Below this alpha the unpremultiply divisor blows dim pixels out to nonsense.
// They are nearly transparent anyway, so their colour barely reads.
const UNPREMULTIPLY_MIN_ALPHA = 40;

if (!fs.existsSync(SRC)) {
	console.error(`No source at ${path.relative(appRoot, SRC)}`);
	process.exit(1);
}

const img = PNG.sync.read(fs.readFileSync(SRC));
const { width: W, height: H, data } = img;
const lum = (i) => Math.max(data[i], data[i + 1], data[i + 2]);

// ── 1. the matte, flooded from the border ───────────────────────────────────
//
// Flooded rather than thresholded: the figure has shadow inside the robe folds
// and under the hat as dark as the matte. A global test punches those into
// holes; a flood cannot reach them. See the header for the tolerance and the hue
// test, which are what let the flood cross this art's vignette.
const isMatte = new Uint8Array(W * H);
{
	// The brightest pixel on the path that reached each matte pixel. Carrying the
	// running maximum rather than the neighbour's own value is what stops the
	// flood from ratcheting: a dip in the gradient cannot reset the budget.
	const reachedAt = new Uint8Array(W * H);
	const queue = [];
	let head = 0;

	const seed = (p) => {
		if (isMatte[p] || lum(p * 4) > FLOOR) return;
		isMatte[p] = 1;
		reachedAt[p] = lum(p * 4);
		queue.push(p);
	};
	for (let x = 0; x < W; x++) {
		seed(x);
		seed(W * (H - 1) + x);
	}
	for (let y = 0; y < H; y++) {
		seed(W * y);
		seed(W * y + W - 1);
	}

	while (head < queue.length) {
		const p = queue[head++];
		const x = p % W;
		const y = (p - x) / W;
		const budget = reachedAt[p];
		const neighbours = [
			x + 1 < W ? p + 1 : -1,
			x > 0 ? p - 1 : -1,
			y + 1 < H ? p + W : -1,
			y > 0 ? p - W : -1,
		];
		for (const n of neighbours) {
			if (n < 0 || isMatte[n]) continue;
			const i = n * 4;
			const l = lum(i);
			if (l > CLIMB_CEILING || l > budget + CLIMB_STEP) continue;
			if (data[i + 2] - data[i] < COOL_MIN) continue; // warm: this is the figure
			isMatte[n] = 1;
			reachedAt[n] = Math.max(l, budget);
			queue.push(n);
		}
	}
}

// ── 2. how far each non-matte pixel is from the matte ───────────────────────
//
// BFS outward from the matte, capped at FEATHER. Anything the search never
// reaches is interior, and interior is opaque by definition.
const depth = new Uint8Array(W * H); // 0 = unreached (interior)
{
	let frontier = [];
	for (let p = 0; p < isMatte.length; p++) {
		if (!isMatte[p]) continue;
		const x = p % W;
		const y = (p - x) / W;
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
			const np = W * ny + nx;
			if (isMatte[np] || depth[np]) continue;
			depth[np] = 1;
			frontier.push(np);
		}
	}
	for (let d = 2; d <= FEATHER && frontier.length; d++) {
		const next = [];
		for (const p of frontier) {
			const x = p % W;
			const y = (p - x) / W;
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
				const np = W * ny + nx;
				if (isMatte[np] || depth[np]) continue;
				depth[np] = d;
				next.push(np);
			}
		}
		frontier = next;
	}
}

// ── 3. alpha ────────────────────────────────────────────────────────────────
let x0 = W;
let y0 = H;
let x1 = -1;
let y1 = -1;
let feathered = 0;

for (let p = 0; p < W * H; p++) {
	const i = p * 4;

	if (isMatte[p]) {
		data[i + 3] = 0;
		continue;
	}

	if (depth[p] === 0) {
		// interior: opaque whatever its brightness
		data[i + 3] = 255;
	} else {
		// in the feather band: brightness is coverage, eased toward opaque as the
		// band goes deeper so the transition does not stop abruptly at FEATHER
		const l = lum(i);
		const byLum = Math.min(1, Math.max(0, (l - FLOOR) / (FEATHER_SOLID - FLOOR)));
		const byDepth = depth[p] / FEATHER;
		const a = Math.round(255 * Math.min(1, Math.max(byLum, byDepth * byDepth)));
		data[i + 3] = a;
		if (a > 0 && a < 255) {
			feathered += 1;
			if (a >= UNPREMULTIPLY_MIN_ALPHA) {
				const k = 255 / a;
				for (let c = 0; c < 3; c++) data[i + c] = Math.min(255, Math.round(data[i + c] * k));
			}
		}
	}

	if (data[i + 3] > 8) {
		const x = p % W;
		const y = (p - x) / W;
		if (x < x0) x0 = x;
		if (x > x1) x1 = x;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
}

fs.writeFileSync(OUT, PNG.sync.write(img));

// ── a game-sized copy, for the trigger tease ────────────────────────────────
//
// The keyed cover is 1043x1008 and about 1.5MB. That is right for a 408x546
// store card composed offline; it is wrong as a runtime asset, and this one IS
// one - TriggerTease draws the priestess over the board when a spin is about to
// open the feature.
//
// Capped by HEIGHT rather than by area: the tease draws her at a fraction of the
// canvas height, so height is the axis that decides whether she is sharp.
const GAME_HEIGHT = 560;
if (NAME === 'character') {
	const scale = Math.min(1, GAME_HEIGHT / H);
	const w = Math.max(1, Math.round(W * scale));
	const h = Math.max(1, Math.round(H * scale));
	const small = new PNG({ width: w, height: h });
	// Box filter rather than nearest: this is a downscale of painted art with a
	// soft keyed edge, and point-sampling it produces a jagged alpha the additive
	// glow behind her would then trace.
	const step = 1 / scale;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const sx0 = Math.floor(x * step);
			const sy0 = Math.floor(y * step);
			const sx1 = Math.min(W, Math.ceil((x + 1) * step));
			const sy1 = Math.min(H, Math.ceil((y + 1) * step));
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let n = 0;
			for (let sy = sy0; sy < sy1; sy++) {
				for (let sx = sx0; sx < sx1; sx++) {
					const i = (W * sy + sx) * 4;
					// premultiply so a transparent pixel's colour cannot bleed in
					const pa = data[i + 3] / 255;
					r += data[i] * pa;
					g += data[i + 1] * pa;
					b += data[i + 2] * pa;
					a += data[i + 3];
					n += 1;
				}
			}
			const j = (w * y + x) * 4;
			// r/g/b are sums of PREMULTIPLIED colour and `a` is a sum of alpha, both
			// over the same n samples. Unpremultiplying the mean is therefore
			// (r / n) / ((a / n) / 255), and the two n's cancel: r * 255 / a.
			//
			// The first version divided by (a / 255) and then multiplied by n as
			// well, which is n times too large - and n is the number of source pixels
			// per output pixel, about 3 here. Everything came out clipped to white,
			// which is not obvious in a downscale of already-bright art: it looked
			// like the tease was drawing her too bright, and the tease was innocent.
			const alpha = a / n;
			const k = a > 0 ? 255 / a : 0;
			small.data[j] = Math.min(255, Math.round(r * k));
			small.data[j + 1] = Math.min(255, Math.round(g * k));
			small.data[j + 2] = Math.min(255, Math.round(b * k));
			small.data[j + 3] = Math.round(alpha);
		}
	}
	const gameOut = path.join(appRoot, 'static/assets/sprites/soulSealUi/priestess.png');
	fs.mkdirSync(path.dirname(gameOut), { recursive: true });
	fs.writeFileSync(gameOut, PNG.sync.write(small));
	console.log(
		`  game copy ${w}x${h} -> ${path.relative(appRoot, gameOut)}  ` +
			`${(fs.statSync(gameOut).size / 1024).toFixed(0)} KB`,
	);
}

// ── 4. the framing Stake actually checks ────────────────────────────────────
//
// Round 6 was lost on this: "The character extends from edge to edge, which
// should not be the case." They want the figure complete inside a safe area with
// only the BACKGROUND bleeding out. A half-body portrait running off the BOTTOM
// is normal and is not what they objected to - the top and the two sides are.
const touch = { top: y0 === 0, left: x0 === 0, right: x1 === W - 1, bottom: y1 === H - 1 };

console.log(`${NAME}: ${W}x${H} -> ${path.relative(appRoot, OUT)}`);
console.log(`  artwork ${x1 - x0 + 1}x${y1 - y0 + 1} at (${x0},${y0})`);
console.log(`  feathered pixels: ${feathered}`);
console.log(`  edges — top:${touch.top} left:${touch.left} right:${touch.right} bottom:${touch.bottom}`);

if (touch.top || touch.left || touch.right) {
	const sides = [touch.top && 'top', touch.left && 'left', touch.right && 'right']
		.filter(Boolean)
		.join(', ');
	console.log(`  !! the figure reaches the ${sides} edge. Stake rejects that -`);
	console.log('     the character must be complete inside the frame, background bleeds.');
	console.log('     Keying cannot fix it: the artwork is cut, and scaling a cut edge');
	console.log('     down just makes a smaller cut edge. Regenerate with more margin.');
	process.exitCode = 1;
} else {
	console.log('  OK: complete on the top and both sides; only the robe runs off the bottom.');
}
