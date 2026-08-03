// Turn the supplied symbol artwork into board-ready sprites.
//
// The originals live in design/source/symbols/ and are NEVER written to — this
// script only reads them. Everything it produces goes to
// static/assets/sprites/emberForgeSymbols/, so re-cutting the art is a matter of
// dropping new files in the source folder and re-running:
//
//   node design/process_symbols.mjs
//
// Two problems have to be solved, both caused by the files arriving without an
// alpha channel:
//
//  1. NO TRANSPARENCY. Nine of the ten have the editor's transparency
//     CHECKERBOARD flattened into them (two neutral greys, ~#a6a29e / #625f5c)
//     and h4 has a solid dark backing (~#1d2122). Used as-is, every symbol would
//     be an opaque rectangle: the free game's heat plates sit UNDER the symbols,
//     so the whole feature mechanic would be hidden behind ten grey tiles, and
//     the board would show a visible seam around every cell.
//
//  2. INCONSISTENT SIZE AND ASPECT. They range from 212x182 to 310x272, so
//     dropping them into a square cell unchanged would render each symbol at a
//     different scale.
//
// The background is removed by flood-filling inward from the border rather than
// by keying the whole image on colour. That distinction matters: the sword blade,
// the helmet and the anvil all contain the same neutral greys as the checker, and
// a global key would punch holes straight through them. Only background that is
// actually connected to the edge is removed.
//
// Edge pixels are then un-blended. An anti-aliased edge is a mix of symbol and
// checker, so leaving it alone would leave a grey fringe on every silhouette;
// the standard compositing formula recovers the symbol's own colour given the
// known background colour.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire('E:/stake/tools/gen/noop.js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/symbols');
const OUT = path.join(appRoot, 'static/assets/sprites/emberForgeSymbols');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 256;
const NAMES = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'w', 's'];

// How far a pixel may sit from a sampled background colour and still count as
// background. Generous enough to catch the checker's soft JPEG-ish noise, tight
// enough that the artwork's own mid-greys survive.
const TOLERANCE = 40;
// Fringe pixels are un-blended when they are this close to being pure background.
const FRINGE_TOLERANCE = 96;

const maxChannelDiff = (a, b) =>
	Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

// Both background kinds are NEUTRAL: the editor checkerboard is two greys and
// h4's backing is a near-black grey. Artwork that happens to touch the frame edge
// is not — leather is brown, flame is orange. Filtering on neutrality is what
// keeps the fill from eating the symbol.
const NEUTRAL_SPREAD = 16;
// A real background tone covers a good share of the border. A stray blend pixel
// covers one sample, and promoting it to a reference widens the key for nothing.
const MIN_REF_SHARE = 0.02;

/**
 * Sample the border and reduce it to the colours the background is actually made
 * of — one for a solid backing, two for a checkerboard.
 *
 * This has to reject artwork. h3 (the dragon torch) fills its frame edge to edge,
 * so a naive sampler picked up its dark leather (50,24,15) and its flame
 * (131,73,44) as background references and the flood fill then ate 89% of the
 * symbol, leaving a few scorched fragments.
 */
const sampleBackgroundColours = (png, name) => {
	const { width: W, height: H, data } = png;
	const at = (x, y) => {
		const o = (y * W + x) * 4;
		return [data[o], data[o + 1], data[o + 2]];
	};

	const samples = [];
	const step = Math.max(1, Math.floor(Math.min(W, H) / 60));
	for (let x = 0; x < W; x += step) {
		samples.push(at(x, 0), at(x, H - 1));
	}
	for (let y = 0; y < H; y += step) {
		samples.push(at(0, y), at(W - 1, y));
	}

	const clusters = [];
	for (const sample of samples) {
		const hit = clusters.find((cluster) => maxChannelDiff(cluster.colour, sample) <= TOLERANCE);
		if (hit) hit.count += 1;
		else clusters.push({ colour: sample, count: 1 });
	}

	const rejected = clusters.filter(
		(cluster) => Math.max(...cluster.colour) - Math.min(...cluster.colour) > NEUTRAL_SPREAD,
	);
	const refs = clusters
		.filter((cluster) => Math.max(...cluster.colour) - Math.min(...cluster.colour) <= NEUTRAL_SPREAD)
		.filter((cluster) => cluster.count / samples.length >= MIN_REF_SHARE)
		.sort((a, b) => b.count - a.count)
		.slice(0, 2);

	if (refs.length === 0) {
		throw new Error(
			`${name}: no neutral background found on the border — the art may already have alpha, or the backing is not flat`,
		);
	}
	return { refs: refs.map((cluster) => cluster.colour), rejected: rejected.length };
};

const nearestRef = (pixel, refs) => {
	let best = refs[0];
	let bestDiff = Infinity;
	for (const ref of refs) {
		const diff = maxChannelDiff(ref, pixel);
		if (diff < bestDiff) {
			bestDiff = diff;
			best = ref;
		}
	}
	return { ref: best, diff: bestDiff };
};

/** Flood fill the background inward from every border pixel. */
const cutBackground = (png, refs) => {
	const { width: W, height: H, data } = png;
	const isBg = new Uint8Array(W * H);
	const queue = [];

	const consider = (x, y) => {
		const index = y * W + x;
		if (isBg[index]) return;
		const o = index * 4;
		const { diff } = nearestRef([data[o], data[o + 1], data[o + 2]], refs);
		if (diff > TOLERANCE) return;
		isBg[index] = 1;
		queue.push(index);
	};

	for (let x = 0; x < W; x += 1) {
		consider(x, 0);
		consider(x, H - 1);
	}
	for (let y = 0; y < H; y += 1) {
		consider(0, y);
		consider(W - 1, y);
	}

	while (queue.length > 0) {
		const index = queue.pop();
		const x = index % W;
		const y = (index / W) | 0;
		if (x > 0) consider(x - 1, y);
		if (x < W - 1) consider(x + 1, y);
		if (y > 0) consider(x, y - 1);
		if (y < H - 1) consider(x, y + 1);
	}

	// Pass 1: hard cut.
	for (let i = 0; i < W * H; i += 1) {
		if (isBg[i]) data[i * 4 + 3] = 0;
	}

	// Pass 2: un-blend the anti-aliased rim. A pixel touching removed background
	// is a mix of the symbol and the checker; recover alpha from how far it has
	// travelled away from the background colour, then divide the blend back out so
	// the silhouette does not keep a grey halo.
	let fringe = 0;
	for (let y = 0; y < H; y += 1) {
		for (let x = 0; x < W; x += 1) {
			const index = y * W + x;
			if (isBg[index]) continue;
			const touchesBg =
				(x > 0 && isBg[index - 1]) ||
				(x < W - 1 && isBg[index + 1]) ||
				(y > 0 && isBg[index - W]) ||
				(y < H - 1 && isBg[index + W]);
			if (!touchesBg) continue;

			const o = index * 4;
			const pixel = [data[o], data[o + 1], data[o + 2]];
			const { ref, diff } = nearestRef(pixel, refs);
			if (diff >= FRINGE_TOLERANCE) continue;

			const alpha = Math.max(0, Math.min(1, diff / FRINGE_TOLERANCE));
			if (alpha < 0.02) {
				data[o + 3] = 0;
				continue;
			}
			for (let c = 0; c < 3; c += 1) {
				const unblended = (pixel[c] - (1 - alpha) * ref[c]) / alpha;
				data[o + c] = Math.max(0, Math.min(255, Math.round(unblended)));
			}
			data[o + 3] = Math.round(alpha * 255);
			fringe += 1;
		}
	}

	let cut = 0;
	for (let i = 0; i < W * H; i += 1) if (isBg[i]) cut += 1;
	return { cut, fringe, total: W * H };
};

/**
 * Drop small disconnected islands left over from cropping.
 *
 * Cutting a symbol out of a contact sheet almost always drags in a few pixels of
 * its neighbours, and those specks survive the background key because they are
 * genuinely not background. They then widen the alpha bounding box, which makes
 * the fit-to-square step shrink the real symbol to make room for a speck.
 *
 * Kept relative to the largest island rather than as an absolute pixel count, so
 * it scales with whatever resolution the art arrives at. The threshold has to
 * clear debris while keeping deliberately detached parts — h3's flame is a
 * separate island from the torch body and must survive.
 */
const ISLAND_KEEP_RATIO = 0.03;

const dropStrayIslands = (png) => {
	const { width: W, height: H, data } = png;
	const label = new Int32Array(W * H).fill(-1);
	const sizes = [];
	const stack = [];

	for (let start = 0; start < W * H; start += 1) {
		if (label[start] !== -1 || data[start * 4 + 3] <= 8) continue;
		const id = sizes.length;
		let size = 0;
		stack.push(start);
		label[start] = id;
		while (stack.length > 0) {
			const index = stack.pop();
			size += 1;
			const x = index % W;
			const y = (index / W) | 0;
			const push = (nx, ny) => {
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
				const n = ny * W + nx;
				if (label[n] !== -1 || data[n * 4 + 3] <= 8) return;
				label[n] = id;
				stack.push(n);
			};
			push(x - 1, y);
			push(x + 1, y);
			push(x, y - 1);
			push(x, y + 1);
		}
		sizes.push(size);
	}

	if (sizes.length === 0) return { dropped: 0, islands: 0 };
	const largest = Math.max(...sizes);
	const keep = sizes.map((size) => size >= largest * ISLAND_KEEP_RATIO);

	let dropped = 0;
	for (let i = 0; i < W * H; i += 1) {
		const id = label[i];
		if (id !== -1 && !keep[id]) {
			data[i * 4 + 3] = 0;
			dropped += 1;
		}
	}
	return { dropped, islands: sizes.length - keep.filter(Boolean).length };
};

/** Tight bounding box of everything still visible. */
const alphaBounds = (png) => {
	const { width: W, height: H, data } = png;
	let minX = W;
	let minY = H;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < H; y += 1) {
		for (let x = 0; x < W; x += 1) {
			if (data[(y * W + x) * 4 + 3] > 8) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	if (maxX < 0) return null;
	return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

/**
 * Draw the trimmed artwork centred on a square canvas at a fixed fill fraction,
 * so every symbol occupies the same share of its cell whatever its own aspect.
 * Bilinear, because these are photographic-looking renders and nearest-neighbour
 * would alias the gem facets badly.
 */
const fitToSquare = (png, box, fill) => {
	const out = new PNG({ width: SIZE, height: SIZE });
	out.data.fill(0);

	const scale = Math.min((SIZE * fill) / box.width, (SIZE * fill) / box.height);
	const drawW = Math.round(box.width * scale);
	const drawH = Math.round(box.height * scale);
	const offX = Math.round((SIZE - drawW) / 2);
	const offY = Math.round((SIZE - drawH) / 2);

	const { width: W, data } = png;
	for (let y = 0; y < drawH; y += 1) {
		for (let x = 0; x < drawW; x += 1) {
			const srcXf = box.x + ((x + 0.5) / drawW) * box.width - 0.5;
			const srcYf = box.y + ((y + 0.5) / drawH) * box.height - 0.5;
			const x0 = Math.max(box.x, Math.min(box.x + box.width - 1, Math.floor(srcXf)));
			const y0 = Math.max(box.y, Math.min(box.y + box.height - 1, Math.floor(srcYf)));
			const x1 = Math.min(box.x + box.width - 1, x0 + 1);
			const y1 = Math.min(box.y + box.height - 1, y0 + 1);
			const fx = Math.max(0, Math.min(1, srcXf - x0));
			const fy = Math.max(0, Math.min(1, srcYf - y0));

			const o = ((offY + y) * SIZE + (offX + x)) * 4;
			for (let c = 0; c < 4; c += 1) {
				const p00 = data[(y0 * W + x0) * 4 + c];
				const p10 = data[(y0 * W + x1) * 4 + c];
				const p01 = data[(y1 * W + x0) * 4 + c];
				const p11 = data[(y1 * W + x1) * 4 + c];
				const top = p00 + (p10 - p00) * fx;
				const bottom = p01 + (p11 - p01) * fx;
				out.data[o + c] = Math.round(top + (bottom - top) * fy);
			}
		}
	}
	return out;
};

// Wild and Scatter are drawn with their own banner and already read as "bigger
// than a pay symbol"; the rest fill the same share of the cell as each other.
const FILL = { w: 0.98, s: 0.98 };
const DEFAULT_FILL = 0.92;

let failed = false;
for (const name of NAMES) {
	const file = path.join(SRC, `${name}.png`);
	if (!fs.existsSync(file)) {
		console.error(`  MISSING ${name}.png in design/source/symbols`);
		failed = true;
		continue;
	}
	const png = PNG.sync.read(fs.readFileSync(file));
	let refs;
	let rejected;
	try {
		({ refs, rejected } = sampleBackgroundColours(png, name));
	} catch (error) {
		console.error(`  ${error.message}`);
		failed = true;
		continue;
	}
	const { cut, total } = cutBackground(png, refs);
	const { dropped, islands } = dropStrayIslands(png);
	const box = alphaBounds(png);
	if (!box) {
		console.error(`  ${name}: nothing left after keying — background sample was wrong`);
		failed = true;
		continue;
	}

	const pct = (100 * cut) / total;
	// A key that removes almost everything has eaten the artwork, which is exactly
	// how h3 failed the first time round. Loud, because the output still looks like
	// a valid PNG and the damage is only obvious on the board.
	const suspicious = pct > 90 || box.width < png.width * 0.2 || box.height < png.height * 0.2;

	const out = fitToSquare(png, box, FILL[name] ?? DEFAULT_FILL);
	fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(out));

	console.log(
		`  ${name.padEnd(3)} ${String(png.width).padStart(4)}x${String(png.height).padEnd(4)}` +
			` -> ${SIZE}x${SIZE}   bg cut ${pct.toFixed(0).padStart(3)}%   refs ${refs.length}` +
			`${rejected ? ` (${rejected} non-neutral rejected)` : ''}` +
			`${islands ? `   dropped ${islands} stray island(s), ${dropped}px` : ''}` +
			`   content ${box.width}x${box.height}` +
			`${suspicious ? '   <-- SUSPICIOUS, check the output' : ''}`,
	);
	if (suspicious) failed = true;
}

// Contact sheet at real cell size, on the board plate and again on a lit heat
// plate. The automatic guard above only catches a key that ate the artwork; a
// grey fringe left around a silhouette is invisible in the numbers and obvious
// here. Not shipped — design/ only.
{
	const { Resvg } = require('@resvg/resvg-js');
	const CELL = 84;
	const COLS = 5;
	const rows = Math.ceil(NAMES.length / COLS);
	const href = (name) =>
		`data:image/png;base64,${fs.readFileSync(path.join(OUT, `${name}.png`)).toString('base64')}`;
	const block = (offsetY, plate) =>
		NAMES.map((name, i) => {
			const x = (i % COLS) * CELL;
			const y = offsetY + Math.floor(i / COLS) * CELL;
			const under = plate
				? `<rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="8" fill="#dd7a1e" opacity="0.62"/>`
				: '';
			return `${under}<image x="${x}" y="${y}" width="${CELL}" height="${CELL}" href="${href(name)}"/>`;
		}).join('');

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CELL}" height="${rows * CELL * 2}">
		<rect width="100%" height="100%" fill="#1e1a17"/>
		${block(0, false)}
		${block(rows * CELL, true)}
	</svg>`;
	const sheet = path.join(appRoot, 'design/forge_contact_sheet.png');
	fs.writeFileSync(
		sheet,
		new Resvg(svg, { fitTo: { mode: 'width', value: COLS * CELL * 2 } }).render().asPng(),
	);
	console.log(`\ncontact sheet: ${path.relative(appRoot, sheet)}`);
}

if (failed) process.exitCode = 1;
console.log(`wrote ${NAMES.length} symbols to ${path.relative(appRoot, OUT)}`);
