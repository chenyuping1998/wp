// Key the black background out of frame art that was delivered flattened.
//
// The supplied plaques are 100% opaque with pure-black margins, so on screen the
// frame arrives inside a black rectangle. Removing that is not a threshold job:
// these frames are surrounded by FLAME, and a flame fades to black. Cutting at
// any threshold leaves a hard edge exactly where the glow was supposed to fade
// out — a visible rectangle in a slightly different black.
//
// So alpha comes from luminance, continuously. Black becomes fully transparent,
// the glow keeps its falloff, and the metal stays solid.
//
// Two things that follow from that, and both are load-bearing:
//
//  1. The WELL has to be protected. It is dark by design, so a luminance key
//     punches a hole through the middle of the plaque. It is found by flooding
//     from a dark seed inside the frame, bounded by the frame's own bright metal
//     — which gives its true shape, including rounded corners, where a measured
//     rectangle would cut them off.
//
//  2. Colour has to be un-premultiplied. The art is glow composited ONTO black,
//     i.e. what is stored is colour x intensity. Reading intensity as alpha and
//     leaving the colour alone would composite it a second time and the glow
//     would come out muddy over any background that is not black.

import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire('E:/stake/tools/gen/noop.js');
const { PNG } = require('pngjs');

const luminance = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * @param {Buffer} buffer  PNG bytes
 * @param {object} options
 *   knee    luminance at which a pixel becomes fully opaque (default 64)
 *   well    {left, right, top, bottom} the bar's interior, kept opaque
 *   feather how far the well's protection fades out, in pixels
 *
 * ── why the well is a SHAPE and not a flood ──
 * Flooding dark pixels from a seed inside the frame was tried first and is wrong
 * twice over. Unbounded it walks out through the rails, which thin at the rounded
 * ends, and claims 91% of the canvas. Bounded to the measured bar it stays inside
 * but still spreads through everything dark in that box — on MAX the murky red
 * behind the flames is dark enough to join the well, so the whole bounding box
 * came out opaque and the plaque wore a hard rectangle.
 *
 * The wells in all five frames are rounded bars. Drawing that shape directly
 * cannot leak, and where it does not quite match the art it does not matter: the
 * frame's inner edge is bright metal, so it is already opaque from the luminance
 * key and covers the join.
 */
export const keyBlackBackground = (buffer, { knee = 64, well = null, feather = 10 } = {}) => {
	const png = PNG.sync.read(buffer);
	const { width: W, height: H, data } = png;

	const lum = new Float32Array(W * H);
	for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
		lum[p] = luminance(data[i], data[i + 1], data[i + 2]);
	}

	// ── the well, as a rounded bar with a soft edge ──
	const wellAlpha = new Float32Array(W * H);
	if (well) {
		const w = well.right - well.left;
		const h = well.bottom - well.top;
		const cx = (well.left + well.right) / 2;
		const cy = (well.top + well.bottom) / 2;
		// pill-ish: radius is a share of the bar's height, which is what these
		// frames' ends actually look like
		const radius = Math.min(h * 0.42, w * 0.5);
		const halfW = w / 2 - radius;
		const halfH = h / 2 - radius;
		for (let y = 0; y < H; y += 1) {
			for (let x = 0; x < W; x += 1) {
				// distance to the rounded rectangle
				const dx = Math.max(Math.abs(x - cx) - halfW, 0);
				const dy = Math.max(Math.abs(y - cy) - halfH, 0);
				const dist = Math.hypot(dx, dy) - radius;
				if (dist >= feather) continue;
				wellAlpha[y * W + x] = dist <= 0 ? 1 : 1 - dist / feather;
			}
		}
	}

	// ── alpha from luminance, colour un-premultiplied ──
	// The divisor is floored: below it the recovered colour is amplified noise
	// rather than glow, and it shows up as coloured speckle in the fade.
	const FLOOR = 0.3;
	for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
		// Floor: the "black" background is not all exactly zero — there is a little
		// noise at luminance 1-5 — and without this it keys to alpha 4-20 instead of
		// nothing, leaving a faint but real rectangle exactly where the black was.
		const keyed = lum[p] <= 3 ? 0 : Math.min(1, lum[p] / knee);
		const a = Math.max(keyed, wellAlpha[p]);
		data[i + 3] = Math.round(a * 255);
		if (a <= 0) continue;
		const d = Math.max(a, FLOOR);
		data[i] = Math.min(255, Math.round(data[i] / d));
		data[i + 1] = Math.min(255, Math.round(data[i + 1] / d));
		data[i + 2] = Math.min(255, Math.round(data[i + 2] / d));
	}

	let opaque = 0;
	let clear = 0;
	for (let i = 3; i < data.length; i += 4) {
		if (data[i] === 255) opaque += 1;
		else if (data[i] === 0) clear += 1;
	}
	return {
		buffer: PNG.sync.write(png),
		stats: { opaquePct: (100 * opaque) / (W * H), clearPct: (100 * clear) / (W * H) },
	};
};

export const readPng = (file) => PNG.sync.read(fs.readFileSync(file));
