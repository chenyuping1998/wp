// Build the 12-frame spinning-talisman sheet from ONE front-facing image.
//
// The coin sheet this replaces is not twelve drawings - it is one coin at twelve
// angles of a rotation about the vertical axis. Its frame widths give it away:
// 487, 469, 391, 267, 81, and back out again, at a constant height. So asking an
// image generator for twelve frames is the wrong request; it produces twelve
// different talismans. One flat, front-facing source and some arithmetic
// produces a sequence that actually holds together.
//
// What each frame is:
//
//   scaleX = cos(theta)          the horizontal squash
//   cos < 0                      the back of the paper: mirrored and darkened
//   |cos| near zero              edge on. Drawn as a thin sliver with the
//                                paper's thickness rather than as zero width,
//                                because a frame that vanishes reads as a
//                                dropped frame rather than as a rotation.
//
// The source is used at its native size inside a slightly larger cell, so
// nothing is upscaled. Particles are drawn small; sharpness matters more than
// filling the cell.
//
// Usage: node design/generate_talisman_spin.mjs <dir with node_modules for pngjs>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/generate_talisman_spin.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/fx/talisman.png');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/talisman');
const OUT_PNG = path.join(OUT_DIR, 'talisman.png');
const OUT_JSON = path.join(OUT_DIR, 'talisman.json');
// The face-on talisman on its own, as a plain sprite.
//
// The spritesheet is for the burst emitter, which wants twelve frames and an
// atlas. The talisman RAIL wants one, still, sitting in a socket - and it was
// drawing its own: a yellow rounded rectangle with a red line down it. That is
// not the object this game has anywhere else. What the burst throws is a gold
// plaque with an ornate border and a key-fret centre, so a player watched one of
// those lift off the board and land in the rail as something different.
//
// Copied from the same source, so the two cannot drift apart.
const OUT_FLAT = path.join(OUT_DIR, 'talisman_flat.png');

// ── the source arrives on a black card ─────────────────────────────
//
// design/source/fx/talisman.png is a gold plaque painted on an opaque black
// ground - 40% of its pixels are near-black - and it was used as-is. In the burst
// that is nearly invisible: the particles are small, moving, and mostly seen
// against a dark board. As the Buy Bonus plate it is not invisible at all, it is
// a black rectangle sitting behind the paper with hard corners, which is exactly
// what it looked like on screen.
//
// Keyed here, once, so BOTH outputs get it: the spin sheet and the flat sprite.
// Nothing about the frame geometry changes - keying moves alpha, not pixels.
//
// Flooded from the border rather than thresholded: the plaque has its own dark
// outline and dark recesses inside the ornament, and a global "dark is
// transparent" test punches those into holes. A flood only ever reaches ground
// connected to the outside.
const MATTE_FLOOR = 26;
// Above this the pixel is fully the artwork. Between the two it ramps, which is
// what keeps the plaque's own soft outer edge instead of cutting it square.
const MATTE_SOLID = 78;

const keyMatte = (png) => {
	const { width: w, height: h, data } = png;
	const lum = (i) => Math.max(data[i], data[i + 1], data[i + 2]);
	const outside = new Uint8Array(w * h);
	const stack = [];
	const push = (x, y) => {
		if (x < 0 || y < 0 || x >= w || y >= h) return;
		const p = w * y + x;
		if (outside[p] || lum(p * 4) > MATTE_FLOOR) return;
		outside[p] = 1;
		stack.push(x, y);
	};
	for (let x = 0; x < w; x++) {
		push(x, 0);
		push(x, h - 1);
	}
	for (let y = 0; y < h; y++) {
		push(0, y);
		push(w - 1, y);
	}
	while (stack.length) {
		const y = stack.pop();
		const x = stack.pop();
		push(x + 1, y);
		push(x - 1, y);
		push(x, y + 1);
		push(x, y - 1);
	}

	let cleared = 0;
	for (let p = 0; p < w * h; p++) {
		if (!outside[p]) continue;
		const i = p * 4;
		const l = lum(i);
		const a = l <= MATTE_FLOOR ? 0 : Math.min(255, Math.round(((l - MATTE_FLOOR) / (MATTE_SOLID - MATTE_FLOOR)) * 255));
		data[i + 3] = a;
		if (a === 0) cleared += 1;
	}
	return cleared;
};



const FRAMES = 12;
const COLS = 4;
const ROWS = 3;
// Margin around the source inside its cell, so the round caps of the edge sliver
// and any glow are not clipped.
const MARGIN = 8;
// The paper's thickness seen edge on, as a fraction of its full width.
//
// Not zero, and not a token 2px. The coin sheet this replaces bottoms out at
// 81/487 = 0.166 of its full width, because a coin has a rim - and that visible
// rim is what stops the edge-on frame reading as a dropped frame. Paper is
// thinner than a coin, but it still has an edge.
const EDGE_WIDTH_RATIO = 0.14;
// How much darker the back of the paper is than the front.
const BACK_DARKEN = 0.68;
// Below this squash the frame is drawn as the edge sliver instead.
const EDGE_THRESHOLD = 0.14;

// The squash is |cos| raised to this power.
//
// Straight |cos| at 30-degree steps gives 1.00, 0.87, 0.50, edge - which spends
// half its frames past 45 degrees and reads as a flicker rather than a turn.
// The coin sheet weights its frames toward face-on, and this reproduces that:
// the paper lingers where you can read it and hurries through the edge.
const SQUASH_EASE = 0.62;

if (!fs.existsSync(SRC)) {
	console.error(`No source talisman at ${path.relative(appRoot, SRC)}`);
	console.error('Put the flat front-facing image there first.');
	process.exit(1);
}

const src = PNG.sync.read(fs.readFileSync(SRC));
const cleared = keyMatte(src);
console.log(
	`  keyed the black card off the source: ${((100 * cleared) / (src.width * src.height)).toFixed(1)}% cleared`,
);
const at = (png, x, y) => (png.width * y + x) * 4;

// ── key the black matte and trim, same approach as import_symbols.mjs ───────
const TOLERANCE = 42;
const bgOf = (png) => {
	const corners = [
		at(png, 0, 0),
		at(png, png.width - 1, 0),
		at(png, 0, png.height - 1),
		at(png, png.width - 1, png.height - 1),
	];
	return [0, 1, 2].map((c) => {
		const v = corners.map((i) => png.data[i + c]).sort((a, b) => a - b);
		return Math.round((v[1] + v[2]) / 2);
	});
};
const bg = bgOf(src);
const dist = (i) =>
	Math.max(
		Math.abs(src.data[i] - bg[0]),
		Math.abs(src.data[i + 1] - bg[1]),
		Math.abs(src.data[i + 2] - bg[2]),
	);

let x0 = src.width;
let y0 = src.height;
let x1 = -1;
let y1 = -1;
for (let y = 0; y < src.height; y++) {
	for (let x = 0; x < src.width; x++) {
		const i = at(src, x, y);
		const d = dist(i);
		const a = d <= TOLERANCE ? 0 : Math.min(255, Math.round(((d - TOLERANCE) / (255 - TOLERANCE)) * 255 * 1.6));
		src.data[i + 3] = a;
		if (a > 10) {
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	}
}
if (x1 < 0) {
	console.error('Nothing survived keying - is the source on a dark matte?');
	process.exit(1);
}

const artW = x1 - x0 + 1;
const artH = y1 - y0 + 1;
const CELL_W = artW + MARGIN * 2;
const CELL_H = artH + MARGIN * 2;

const sheet = new PNG({ width: CELL_W * COLS, height: CELL_H * ROWS });
sheet.data.fill(0);

/** Average colour of the artwork's own edge, for the sliver seen edge on. */
const edgeColour = () => {
	let r = 0;
	let g = 0;
	let b = 0;
	let n = 0;
	for (let y = y0; y <= y1; y++) {
		for (const x of [x0, x0 + 1, x1 - 1, x1]) {
			const i = at(src, x, y);
			if (src.data[i + 3] < 200) continue;
			r += src.data[i];
			g += src.data[i + 1];
			b += src.data[i + 2];
			n += 1;
		}
	}
	return n === 0 ? [200, 160, 60] : [r / n, g / n, b / n].map((v) => Math.round(v * 0.75));
};
const EDGE = edgeColour();

const frames = {};

for (let f = 0; f < FRAMES; f++) {
	const theta = (f / FRAMES) * Math.PI * 2;
	const c = Math.cos(theta);
	const back = c < 0;
	const squash = Math.abs(c) ** SQUASH_EASE;

	const col = f % COLS;
	const row = Math.floor(f / COLS);
	const originX = col * CELL_W;
	const originY = row * CELL_H;
	const centreX = originX + CELL_W / 2;

	const edgeHalf = Math.max(1, Math.round((artW * EDGE_WIDTH_RATIO) / 2));

	if (squash < EDGE_THRESHOLD) {
		// Edge on: a thin sliver the height of the paper. Not zero width - a frame
		// that disappears reads as a dropped frame, not as a rotation.
		for (let y = 0; y < artH; y++) {
			for (let dx = -edgeHalf; dx <= edgeHalf; dx++) {
				const dxi = Math.round(centreX + dx);
				const dyi = originY + MARGIN + y;
				if (dxi < originX || dxi >= originX + CELL_W) continue;
				const di = at(sheet, dxi, dyi);
				// Taper the very top and bottom so the sliver has the paper's
				// slightly rounded corners rather than reading as a hard bar.
				const t = Math.min(y, artH - 1 - y) / (artH * 0.04);
				const alpha = Math.round(255 * Math.min(1, t));
				sheet.data[di] = EDGE[0];
				sheet.data[di + 1] = EDGE[1];
				sheet.data[di + 2] = EDGE[2];
				sheet.data[di + 3] = alpha;
			}
		}
	} else {
		const drawW = Math.max(1, Math.round(artW * squash));
		const left = Math.round(centreX - drawW / 2);
		// Light falls off as the paper turns away, and the back is darker still.
		const shade = (back ? BACK_DARKEN : 1) * (0.82 + 0.18 * squash);

		for (let dx = 0; dx < drawW; dx++) {
			// Map destination column to source column. Mirrored on the back half,
			// because that is the other face of the same sheet of paper.
			const u = drawW === 1 ? 0.5 : dx / (drawW - 1);
			const su = back ? 1 - u : u;
			const sx = x0 + Math.min(artW - 1, Math.round(su * (artW - 1)));

			for (let y = 0; y < artH; y++) {
				const si = at(src, sx, y0 + y);
				const alpha = src.data[si + 3];
				if (alpha === 0) continue;
				const dxi = left + dx;
				const dyi = originY + MARGIN + y;
				if (dxi < originX || dxi >= originX + CELL_W) continue;
				const di = at(sheet, dxi, dyi);
				sheet.data[di] = Math.round(src.data[si] * shade);
				sheet.data[di + 1] = Math.round(src.data[si + 1] * shade);
				sheet.data[di + 2] = Math.round(src.data[si + 2] * shade);
				sheet.data[di + 3] = alpha;
			}
		}
	}

	// Every frame is the SAME cell size, with the squashed art centred in it.
	// The coin sheet this replaces used tightly packed variable-width frames;
	// uniform cells make the particle's on-screen size constant through the spin
	// without the emitter having to know anything about the rotation.
	frames[`${f + 1}.png`] = {
		frame: { x: originX, y: originY, w: CELL_W, h: CELL_H },
		rotated: false,
		trimmed: false,
		spriteSourceSize: { x: 0, y: 0, w: CELL_W, h: CELL_H },
		sourceSize: { w: CELL_W, h: CELL_H },
	};
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_PNG, PNG.sync.write(sheet));
fs.writeFileSync(
	OUT_JSON,
	`${JSON.stringify(
		{
			frames,
			meta: {
				app: 'design/generate_talisman_spin.mjs',
				version: '1.0',
				image: 'talisman.png',
				format: 'RGBA8888',
				size: { w: sheet.width, h: sheet.height },
				scale: '1',
			},
		},
		null,
		1,
	)}\n`,
);

console.log(`Wrote ${path.relative(appRoot, OUT_PNG)}  ${sheet.width}x${sheet.height}`);
fs.writeFileSync(OUT_FLAT, PNG.sync.write(src));

console.log(`      ${path.relative(appRoot, OUT_JSON)}  ${FRAMES} frames of ${CELL_W}x${CELL_H}`);
console.log(`      ${path.relative(appRoot, OUT_FLAT)}  the face-on frame, as a plain sprite`);
console.log(`  source art ${artW}x${artH}, used at native size (no upscale)`);
console.log(
	`  widths through the spin: ${Array.from({ length: FRAMES }, (_, f) => {
		const s = Math.abs(Math.cos((f / FRAMES) * Math.PI * 2)) ** SQUASH_EASE;
		return s < EDGE_THRESHOLD
			? Math.max(1, Math.round((artW * EDGE_WIDTH_RATIO) / 2)) * 2 + 1
			: Math.round(artW * s);
	}).join(', ')}`,
);
