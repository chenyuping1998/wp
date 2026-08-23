// Bring the supplied background and frame art into static/.
//
// Four images, three jobs:
//
//   bg_base / bg_feature   convert and copy; they are used whole
//   frame_bg               convert and copy; the panel behind the reels
//   bg_base / bg_feature   CROPPED past the painted side columns
//   frame_bg               the wall behind the reels, MASKED to the window
//   frame_edge             key the MAGENTA window to transparent, and CHECK
//                          that the window is where BoardFrame expects it
//
// The magenta is the point. An image generator cannot reliably produce a
// transparent hole, so the frame is authored with its window filled flat
// #FF00FF and the hole is cut here. Flat is load bearing: a gradient or noise in
// that region leaves a fringe of magenta around the board.
//
// The window check matters more than it looks. BoardFrame draws the frame sprite
// at boardSize * FRAME_SCALE, so the art must have its opening at exactly
// 1/FRAME_SCALE of the sprite, centred. If the supplied art disagrees, the frame
// and the reels are misaligned by however much it disagrees by - and nothing
// downstream can tell, because both are individually correct.
//
// Usage: node design/import_scene.mjs <dir with node_modules for pngjs>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/import_scene.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/scene');
const BG_OUT = path.join(appRoot, 'static/assets/sprites/soulSealBackground');
const FRAME_OUT = path.join(appRoot, 'static/assets/sprites/soulSealFrame');

// Must match BoardFrame.svelte.
const FRAME_SCALE = 1280 / 1000;
const EXPECTED_WINDOW = 1 / FRAME_SCALE;
// How far the supplied window may sit from the expected fraction before this
// stops being a rounding difference and starts being a misalignment.
const WINDOW_TOLERANCE = 0.02;

const readAny = (file) => {
	// The art arrives as .jpg (sometimes named .png.jpg). Decode through ffmpeg
	// rather than adding a jpeg decoder: it is already here for the video work.
	if (file.endsWith('.png')) return PNG.sync.read(fs.readFileSync(file));
	const tmp = path.join(SRC, `.decode-${path.basename(file)}.png`);
	execFileSync(FFMPEG, ['-v', 'error', '-y', '-i', file, tmp]);
	const png = PNG.sync.read(fs.readFileSync(tmp));
	fs.unlinkSync(tmp);
	return png;
};

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

const find = (stem) => {
	const hit = fs.readdirSync(SRC).find((f) => f.startsWith(stem + '.'));
	if (!hit) {
		console.error(`Missing ${stem}.* in ${path.relative(appRoot, SRC)}`);
		process.exit(1);
	}
	return path.join(SRC, hit);
};

fs.mkdirSync(BG_OUT, { recursive: true });
fs.mkdirSync(FRAME_OUT, { recursive: true });

const at = (png, x, y) => (png.width * y + x) * 4;

// ── the three that copy straight across ─────────────────────────────────────
// ── the courtyard wall, taken out of the OUTER background ─────────────
//
// The scene is painted as a walled courtyard: sky and mountains across the top,
// a green brick wall filling the middle, and the altar table along the bottom.
// Inside the reel housing that wall is exactly right - it is the board's backing
// and it is what frame_bg supplies. OUTSIDE the housing it is a second wall, in
// the two gutters either side of the frame, and it flattens the whole screen:
// the shrine reads as standing in front of a wall a metre behind it rather than
// on a terrace at night.
//
// So the wall band is replaced with night air. The sky above it and the table
// below it - with the censer and the candle, which are the only warm light in
// the scene - are both kept.
//
// The two edges are MEASURED, not written down, because the two backgrounds are
// different paintings and a hand-read row from one would be wrong on the other:
//
//   the wall's TOP   the sky is blue-dominant (green minus blue about -21) and
//                    the wall is green-dominant (+5 to +10). The first row where
//                    that flips is the top of the wall, and it flips hard - the
//                    row-to-row step at that boundary is 120 against a typical 10.
//   the wall's FOOT  the table's stone coping is the brightest thing in the lower
//                    half by a distance, so the largest row-to-row step below the
//                    wall's top is where the table starts.
//
// The replacement is ONE gradient across the whole width, sampled from a
// horizontal average of the sky.
//
// Per-column was tried first and is worth recording as a failure. The idea was
// that each column would fade from its own last sky pixel, so the mountains would
// bleed downward as haze. What it actually sampled was the row just above the
// wall - which is the wall's own mossy coping, not sky - and it smeared that
// downward in vertical stripes. The result was a green curtain hanging under the
// mountains.
//
// A flat gradient has no such failure mode, and the picture it makes is a
// defensible one: mountains, then night air. A horizon does end in a line.
//
// ── AND IT STOPS ABOVE THE ALTAR ────────────────────────────────────────────
//
// The censer and the candle stand ON the table with the wall behind them, so a
// replacement that ran the full height of the wall erased both - and they are the
// only warm light in the scene. Measured (warm pixels, red leading blue by 30 in
// the lower half) they begin at 59% of the source height, so the replacement
// stops at 55% and the wall below that is left as painted.
//
// That strip of wall behind the altar is a COMPROMISE, not a solution. Removing a
// wall from a painting only works where there is something painted behind it, and
// here there is nothing - the honest fix is a background drawn without the wall
// in the first place.
const NIGHT = [10, 18, 28];

const rowStats = (png) => {
	const rows = [];
	for (let y = 0; y < png.height; y++) {
		let r = 0;
		let g = 0;
		let b = 0;
		for (let x = 0; x < png.width; x++) {
			const i = (png.width * y + x) * 4;
			r += png.data[i];
			g += png.data[i + 1];
			b += png.data[i + 2];
		}
		rows.push([r / png.width, g / png.width, b / png.width]);
	}
	return rows;
};

const findWallBand = (png) => {
	const rows = rowStats(png);
	const greenness = rows.map(([, g, b]) => g - b);
	// The wall starts where the row turns green-dominant and stays that way.
	let top = -1;
	for (let y = Math.round(png.height * 0.1); y < png.height - 4; y++) {
		if (greenness[y] > 0 && greenness[y + 1] > 0 && greenness[y + 2] > 0) {
			top = y;
			break;
		}
	}
	if (top < 0) return null;
	// The table is the biggest step anywhere below that.
	const step = (y) =>
		Math.abs(rows[y][0] - rows[y - 1][0]) +
		Math.abs(rows[y][1] - rows[y - 1][1]) +
		Math.abs(rows[y][2] - rows[y - 1][2]);
	let foot = -1;
	let best = 0;
	for (let y = top + Math.round(png.height * 0.2); y < png.height - 2; y++) {
		const v = step(y);
		if (v > best) {
			best = v;
			foot = y;
		}
	}
	return { top, foot, step: best };
};

// Where the replacement stops, as a fraction of the image height - just above the
// altar props. See the note above for how 0.55 was measured.
const WALL_REPLACE_TO = 0.55;

/** Replace the upper wall with night air, in place. */
const removeWall = (png, band) => {
	const { top } = band;
	const foot = Math.min(band.foot, Math.round(png.height * WALL_REPLACE_TO));
	if (foot <= top) return 0;

	// The sky's colour, averaged across the full width over a band well ABOVE the
	// wall - not the rows next to it, which are the wall's own coping.
	const from = Math.max(0, top - Math.round(png.height * 0.1));
	const to = Math.max(from + 1, top - Math.round(png.height * 0.03));
	const sky = [0, 0, 0];
	let n = 0;
	for (let y = from; y < to; y++) {
		for (let x = 0; x < png.width; x++) {
			const i = (png.width * y + x) * 4;
			sky[0] += png.data[i];
			sky[1] += png.data[i + 1];
			sky[2] += png.data[i + 2];
			n += 1;
		}
	}
	for (let c = 0; c < 3; c++) sky[c] /= n;

	// Feather both seams, so neither the sky above nor the wall below ends on a
	// drawn line.
	const feather = Math.max(6, Math.round((foot - top) * 0.18));

	for (let y = top - feather; y < foot; y++) {
		if (y < 0) continue;
		const t = Math.max(0, (y - top) / (foot - top));
		// sky -> night, most of it early, so the band settles rather than ramping
		// evenly and reading as a printed gradient
		const air = sky.map((v, c) => v + (NIGHT[c] - v) * Math.min(1, Math.sqrt(t)));
		// how much of the replacement applies here: 0 above the top seam, 1 through
		// the middle, back toward 0 at the foot so the wall below is met softly
		let mix = 1;
		if (y < top) mix = (y - (top - feather)) / feather;
		const intoWall = (y - (foot - feather)) / feather;
		if (intoWall > 0) mix = Math.min(mix, 1 - intoWall);

		for (let x = 0; x < png.width; x++) {
			const i = (png.width * y + x) * 4;
			for (let c = 0; c < 3; c++) {
				png.data[i + c] = Math.round(png.data[i + c] + (air[c] - png.data[i + c]) * mix);
			}
		}
	}
	return foot;
};

let backdropAspect = 0;

// ── the two backdrops, cropped past their own side columns ──────────────────
//
// Both scenes are painted with a jade stone column and a gilt bracket down each
// edge - the artist framing the courtyard. On its own that is good art. In the
// game it is a SECOND frame: the wooden shrine housing already frames the reels,
// and the painted columns sat just outside it, so the screen read as a frame
// inside a frame with a strip of wall trapped between them.
//
// MEASURED ONCE, then written down, rather than detected per run.
//
// Detection was tried first and is the reason for this note. The columns are
// darker than the sky behind them, so a luminance step across the top band looks
// like it should find their inner edge - and on the left it does. On the right it
// does not: the scene has a temple roof in silhouette a third of the way in, just
// as dark as a column and far wider, so the scan walked straight past the column
// and stopped against the roof. It cropped 36% off bg_base and 40% off
// bg_feature, most of it scene.
//
// MEASURED, in two passes, and the second pass is why the first was not enough.
//
// 0.115 was read off a ruler overlay and it landed ON the gilt bracket that caps
// each column - the column itself was gone but its corner ornament was still
// there, a piece of gold architecture floating at each top corner with nothing
// holding it up.
//
// The second pass measured rather than looked. The bracket is WARM and the sky
// behind it is cool, so scanning the top 12% of the image for pixels where red
// leads blue finds exactly where the ornament ends: the warm fraction peaks at
// 12% of the width and is at zero by 16%, on both sides. 0.155 clears it.
const BG_CROP_LEFT = 0.155;
const BG_CROP_RIGHT = 0.845;
// And a slice off the TOP, for the last of the same thing.
//
// The column capitals reach further in at their very tips than the columns do,
// so cropping the sides past the brackets still left a fragment of gold
// architecture in each top corner with nothing under it. Measured the same way -
// comparing the outer 7% of each side against the sky at the same row - those
// fragments run from the top edge to 4% of the height and there is clear sky
// below them. 5% takes them with room to spare, and costs only sky: the moon
// sits at about 12%.
const BG_CROP_TOP = 0.05;

for (const [stem, out] of [
	['bg_base', path.join(BG_OUT, 'bg_base.png')],
	['bg_feature', path.join(BG_OUT, 'bg_feature.png')],
]) {
	const png = readAny(find(stem));
	const left = Math.round(png.width * BG_CROP_LEFT);
	const right = Math.round(png.width * BG_CROP_RIGHT) - 1;
	const top = Math.round(png.height * BG_CROP_TOP);
	const width = right - left + 1;
	const height = png.height - top;
	const cropped = new PNG({ width, height });
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const from = (png.width * (top + y) + (left + x)) * 4;
			const to = (width * y + x) * 4;
			for (let c = 0; c < 3; c++) cropped.data[to + c] = png.data[from + c];
			// Opaque throughout - these sit behind everything.
			cropped.data[to + 3] = 255;
		}
	}
	const band = findWallBand(cropped);
	if (band) {
		const stoppedAt = removeWall(cropped, band);
		console.log(
			`  wall replaced from row ${band.top} to ${stoppedAt} ` +
				`(${((100 * band.top) / height).toFixed(0)}%..${((100 * stoppedAt) / height).toFixed(0)}%); ` +
				`the strip down to the altar at ${((100 * band.foot) / height).toFixed(0)}% is left as painted`,
		);
	} else {
		console.log('  !! no wall band found - the scene was left as painted');
	}

	fs.writeFileSync(out, PNG.sync.write(cropped));
	backdropAspect = width / height;
	console.log(`${stem.padEnd(11)} ${png.width}x${png.height} -> ${path.relative(appRoot, out)}`);
	console.log(
		`  cropped to x ${left}..${right}, top ${top} ` +
			`(${((100 * width) / png.width).toFixed(1)}% of the width, ` +
			`${((100 * height) / png.height).toFixed(1)}% of the height) ` +
			`-> ${width}x${height}, aspect ${(width / height).toFixed(3)}`,
	);
}

// ── the frame, with its window cut out ──────────────────────────────────────
const edge = readAny(find('frame_edge'));

// Magenta, generously: JPEG has smeared it, and the boundary pixels are a blend
// of magenta and the frame's gold.
const isWindow = (i) =>
	edge.data[i] > 150 && edge.data[i + 2] > 150 && edge.data[i + 1] < 120 &&
	edge.data[i] - edge.data[i + 1] > 60 && edge.data[i + 2] - edge.data[i + 1] > 60;

// The LARGEST CONNECTED region of magenta, not every magenta-ish pixel.
//
// The art is JPEG, so compression scatters isolated magenta-tinted pixels across
// the rest of the frame. Keying every one of them and then eroding turns each
// speck into a 5x5 hole, and the altar table came out riddled with them. The
// window is one big rectangle; nothing else in the image is connected to it.
const mask = new Uint8Array(edge.width * edge.height);
for (let p = 0; p < mask.length; p++) mask[p] = isWindow(p * 4) ? 1 : 0;

const seenWin = new Uint8Array(mask.length);
let best = null;
for (let p0 = 0; p0 < mask.length; p0++) {
	if (!mask[p0] || seenWin[p0]) continue;
	const stack = [p0];
	seenWin[p0] = 1;
	const region = [];
	while (stack.length) {
		const p = stack.pop();
		region.push(p);
		const x = p % edge.width;
		const y = (p - x) / edge.width;
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= edge.width || ny >= edge.height) continue;
			const np = edge.width * ny + nx;
			if (!mask[np] || seenWin[np]) continue;
			seenWin[np] = 1;
			stack.push(np);
		}
	}
	if (!best || region.length > best.length) best = region;
}

let wx0 = edge.width;
let wy0 = edge.height;
let wx1 = -1;
let wy1 = -1;
const count = best ? best.length : 0;
for (const p of best ?? []) {
	const x = p % edge.width;
	const y = (p - x) / edge.width;
	edge.data[p * 4 + 3] = 0;
	if (x < wx0) wx0 = x;
	if (x > wx1) wx1 = x;
	if (y < wy0) wy0 = y;
	if (y > wy1) wy1 = y;
}

if (count === 0) {
	console.error('  !! no magenta window found in frame_edge - was it authored with #FF00FF?');
	process.exit(1);
}

// ── despill and erode ──────────────────────────────────────────────────────
//
// The key alone leaves a magenta fringe. The art arrives as JPEG, so the
// boundary between the window and the gold moulding is a gradient of blended
// pixels: too gold to key, too magenta to keep. Left alone it draws as a thin
// pink outline around the board, which is exactly the kind of thing that looks
// like a deliberate neon trim until someone asks why it is pink.
//
// Two passes. Erode the opening by ERODE px so the worst of the blend is simply
// removed, then desaturate whatever magenta tint survives by pulling the red and
// blue channels down toward green - the same despill a chroma key does.
const ERODE = 2;
const alphaCopy = new Uint8Array(edge.width * edge.height);
for (let i = 0, p = 0; i < edge.data.length; i += 4, p++) alphaCopy[p] = edge.data[i + 3];
for (let y = 0; y < edge.height; y++) {
	for (let x = 0; x < edge.width; x++) {
		const p = edge.width * y + x;
		if (alphaCopy[p] === 0) continue;
		let nearHole = false;
		for (let dy = -ERODE; dy <= ERODE && !nearHole; dy++) {
			for (let dx = -ERODE; dx <= ERODE; dx++) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= edge.width || ny >= edge.height) continue;
				if (alphaCopy[edge.width * ny + nx] === 0) {
					nearHole = true;
					break;
				}
			}
		}
		if (nearHole) edge.data[p * 4 + 3] = 0;
	}
}
// A pixel is magenta only when green is WELL below both red and blue.
//
// The first version asked for `r > g && b > g`, which is true of any warm brown
// where blue happens to sit a point above green - and the altar table is full of
// those. It flattened [73,42,43] to [42,42,42] and left the table speckled with
// grey. `min(r,b) - g` is the actual magenta signal, and the fringe carries far
// more of it than any of the artwork does.
const SPILL_THRESHOLD = 25;
for (let i = 0; i < edge.data.length; i += 4) {
	if (edge.data[i + 3] === 0) continue;
	const r = edge.data[i];
	const g = edge.data[i + 1];
	const b = edge.data[i + 2];
	const spill = Math.min(r, b) - g;
	if (spill <= SPILL_THRESHOLD) continue;
	const cap = g + spill * 0.15;
	edge.data[i] = Math.round(Math.min(r, Math.max(cap, g)));
	edge.data[i + 2] = Math.round(Math.min(b, Math.max(cap, g)));
}

// The frame's own outer black matte goes too, so the art can sit over the
// background rather than on a black card.
//
// FLOODED from the border, not thresholded globally. A global "anything within
// 30 of the corner colour is background" pass also deletes the dark red cord
// binding the posts and the shadowed lip of the altar table, because those are
// genuinely that dark - the first version of this did exactly that and chewed
// notches out of both. Flooding only ever reaches matte connected to the
// outside, so dark artwork enclosed by the frame survives.
// Two tests, and the second one is the important one.
//
// The altar table runs to the left and right edges of the image, so its dark
// shadowed wood TOUCHES the border - and a flood that only asks "is this close
// to black" walks straight in and eats speckled holes out of the table top. The
// matte is NEUTRAL black; the table is dark RED. Requiring near-neutrality stops
// the flood at the artwork's edge, where a distance test alone cannot.
const OUTER_TOLERANCE = 26;
const NEUTRAL_SPREAD = 12;
const outerBg = [0, 1, 2].map((c) => edge.data[at(edge, 0, 0) + c]);
const isOuter = (idx) => {
	const i = idx * 4;
	if (edge.data[i + 3] === 0) return false;
	const r = edge.data[i];
	const g = edge.data[i + 1];
	const b = edge.data[i + 2];
	if (Math.max(r, g, b) - Math.min(r, g, b) > NEUTRAL_SPREAD) return false;
	return (
		Math.max(Math.abs(r - outerBg[0]), Math.abs(g - outerBg[1]), Math.abs(b - outerBg[2])) <=
		OUTER_TOLERANCE
	);
};
{
	const seen = new Uint8Array(edge.width * edge.height);
	const stack = [];
	const push = (x, y) => {
		if (x < 0 || y < 0 || x >= edge.width || y >= edge.height) return;
		const idx = edge.width * y + x;
		if (seen[idx] || !isOuter(idx)) return;
		seen[idx] = 1;
		stack.push(x, y);
	};
	for (let x = 0; x < edge.width; x++) {
		push(x, 0);
		push(x, edge.height - 1);
	}
	for (let y = 0; y < edge.height; y++) {
		push(0, y);
		push(edge.width - 1, y);
	}
	while (stack.length) {
		const y = stack.pop();
		const x = stack.pop();
		push(x + 1, y);
		push(x - 1, y);
		push(x, y + 1);
		push(x, y - 1);
	}
	for (let p = 0; p < seen.length; p++) if (seen[p]) edge.data[p * 4 + 3] = 0;
}

fs.writeFileSync(path.join(FRAME_OUT, 'frame_edge.png'), PNG.sync.write(edge));

const winW = (wx1 - wx0 + 1) / edge.width;
const winH = (wy1 - wy0 + 1) / edge.height;
const cx = (wx0 + wx1 + 1) / 2 / edge.width;
const cy = (wy0 + wy1 + 1) / 2 / edge.height;

console.log(`frame_edge  ${edge.width}x${edge.height} -> static/assets/sprites/soulSealFrame/frame_edge.png`);
console.log(`  window ${wx1 - wx0 + 1}x${wy1 - wy0 + 1} at (${wx0},${wy0})`);
console.log(`  fraction of sprite: ${winW.toFixed(4)} wide, ${winH.toFixed(4)} tall`);
console.log(`  window centre: (${cx.toFixed(4)}, ${cy.toFixed(4)})`);

// ── the wall behind the reels, masked to the window ─────────────────────────
//
// frame_bg is the shrine's brick wall, and it used to be copied across whole:
// one fully opaque 1376x768 rectangle. BoardFrame draws it at the SAME rect as
// frame_edge, so it covered everything the frame sprite spanned - and the frame
// spans well past the pillars on both sides. The result on screen was a hard
// vertical edge a hundred pixels outside each pillar with the night sky cut off
// behind it. The painted background was there the whole time; the wall was
// parked on top of it.
//
// So the wall is cut to the window it belongs in. Everything outside is dropped,
// with a short feather so the boundary is under the frame's inner moulding
// rather than being a second visible edge.
//
// BLEED is why this is a grow and not an exact crop: the moulding has depth, and
// a wall that stopped exactly at the measured magenta would show a sliver of
// night sky between the wall and the wood on any rounding.
{
	const bg = readAny(find('frame_bg'));
	// The window as fractions of the EDGE sprite, applied to the bg sprite's own
	// grid: the two files are different sizes (1376x768 against 1328x800) and are
	// drawn to one destination rect, so fractions are the only thing they share.
	const fx0 = wx0 / edge.width;
	const fx1 = (wx1 + 1) / edge.width;
	const fy0 = wy0 / edge.height;
	const fy1 = (wy1 + 1) / edge.height;
	// Grow, as a fraction of the window's own size.
	const BLEED = 0.035;
	// Feather, likewise. Kept smaller than BLEED so the ramp finishes inside the
	// moulding rather than starting outside it.
	const FEATHER = 0.02;

	const gw = (fx1 - fx0) * bg.width;
	const gh = (fy1 - fy0) * bg.height;
	const left = fx0 * bg.width - gw * BLEED;
	const right = fx1 * bg.width + gw * BLEED;
	const top = fy0 * bg.height - gh * BLEED;
	const bottom = fy1 * bg.height + gh * BLEED;
	const featherX = gw * FEATHER;
	const featherY = gh * FEATHER;

	// 1 inside, ramping to 0 across the feather band, 0 outside.
	const band = (v, lo, hi, feather) => {
		if (v < lo - feather || v > hi + feather) return 0;
		if (v < lo) return (v - (lo - feather)) / feather;
		if (v > hi) return (hi + feather - v) / feather;
		return 1;
	};

	let kept = 0;
	for (let y = 0; y < bg.height; y++) {
		for (let x = 0; x < bg.width; x++) {
			const a = band(x + 0.5, left, right, featherX) * band(y + 0.5, top, bottom, featherY);
			const i = (bg.width * y + x) * 4;
			bg.data[i + 3] = Math.round(a * 255);
			if (a > 0) kept += 1;
		}
	}

	const out = path.join(FRAME_OUT, 'frame_bg.png');
	fs.writeFileSync(out, PNG.sync.write(bg));
	console.log(`frame_bg    ${bg.width}x${bg.height} -> ${path.relative(appRoot, out)}`);
	console.log(
		`  masked to the window +${(BLEED * 100).toFixed(1)}% bleed - ` +
			`${((100 * kept) / (bg.width * bg.height)).toFixed(1)}% of the sprite kept, ` +
			'the rest lets the background through',
	);
}

// ── emit the geometry the client needs ──────────────────────────────────────
//
// MEASURED, not hand-copied. BoardFrame used to carry a single FRAME_SCALE
// constant on the assumption that the window was a centred 78.1% of the sprite
// in both axes. The supplied art is 60.7% x 57.3% and its window sits BELOW
// centre, because the altar table takes up the bottom of the frame. A constant
// would have been wrong the moment the art arrived, and nothing downstream could
// have noticed: the frame and the reels would each have been drawn correctly,
// just not around each other.
//
// The frame is scaled UNIFORMLY, fitted so the window is never smaller than the
// board on either axis. The window is proportionally wider than the board, so
// fitting the height leaves a little of the wall showing left and right - which
// is the wall, in a frame that is a wall. Stretching the ornate art by the 6%
// needed to close that gap would be the worse trade.
const aspect = edge.width / edge.height;
const geometry = {
	// The cropped backdrop's proportions. Background.svelte COVER-fits the scene
	// rather than stretching it, so it needs this - and it used to carry the
	// number as a literal, which went stale the moment the crop moved. Anything
	// measured here that the client needs belongs here.
	backdropAspect: Number(backdropAspect.toFixed(5)),
	// sprite size as a multiple of the BOARD's height
	spriteHeightPerBoardHeight: Number((1 / winH).toFixed(5)),
	spriteAspect: Number(aspect.toFixed(5)),
	// how far above the board's centre the sprite's centre sits, as a multiple
	// of the sprite's own height
	centreOffsetY: Number((0.5 - cy).toFixed(5)),
	measured: {
		source: `${edge.width}x${edge.height}`,
		window: `${wx1 - wx0 + 1}x${wy1 - wy0 + 1} at (${wx0},${wy0})`,
	},
};

const geomPath = path.join(appRoot, 'src/game/frameGeometry.ts');
fs.writeFileSync(
	geomPath,
	`// GENERATED FILE - do not edit by hand.\n` +
		`// Source: design/source/scene/frame_edge.*\n` +
		`// Regenerate with: node design/import_scene.mjs <tool dir>\n` +
		`//\n` +
		`// Where the frame art's window sits, measured off the magenta key. BoardFrame\n` +
		`// scales and offsets the sprite from these so the opening lands on the reels.\n` +
		`export default ${JSON.stringify(geometry, null, 1)} as const;\n`,
	'utf8',
);
console.log(`  wrote ${path.relative(appRoot, geomPath)}`);
console.log(
	`    sprite height = board height x ${geometry.spriteHeightPerBoardHeight}, ` +
		`aspect ${geometry.spriteAspect}, centre offset ${geometry.centreOffsetY}`,
);

// A window that is SMALLER than the board on either axis would clip the reels,
// and no scaling can fix that - the art has to be redrawn.
const boardAspect = 5 / 3;
const windowAspect = ((wx1 - wx0 + 1) / (wy1 - wy0 + 1));
if (windowAspect < boardAspect - 0.001) {
	console.log(
		`  !! the window is ${windowAspect.toFixed(3)}:1 but the board is ` +
			`${boardAspect.toFixed(3)}:1 - fitting the width would clip the reels ` +
			`top and bottom. Widen the opening in the art.`,
	);
	process.exitCode = 1;
} else {
	const slack = (windowAspect / boardAspect - 1) * 100;
	console.log(`  window is ${slack.toFixed(1)}% wider than the board - that much wall shows at the sides`);
}
