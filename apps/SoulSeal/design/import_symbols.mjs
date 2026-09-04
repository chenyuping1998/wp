// Bring supplied symbol art into static/ at the size the board expects.
//
// The art arrives as square-ish tiles rendered on an OPAQUE DARK background -
// black for most, dark red for h1 - at whatever size the generator produced
// (265..331px, all different). The board wants 200x200 with a 12px safe margin
// (art-bible.md §5.5) and transparency outside the artwork.
//
// This is a separate script from dekey_supplied_art.mjs, which removes a WHITE
// matte. Same idea, opposite end of the range, and the alpha recovery differs
// enough that one script doing both would be mostly branches.
//
// How the background is found: flood inward from the image border. A plain
// "dark is transparent" threshold cannot be used - these symbols have deep
// shadows, black outlines and near-black gaps inside the artwork that would be
// punched into holes. Flooding only ever reaches background connected to the
// outside edge, so dark pixels enclosed by the art survive.
//
// Alpha recovery inside the flooded region: the pixel is foreground over the
// sampled background, C = F*a + BG*(1-a), so a = (C - BG) / (F - BG). With F
// unknown, the channel furthest from BG gives the best estimate, and the colour
// is unpremultiplied against BG afterwards. A soft outer glow therefore survives
// as a glow instead of being cut off square - which matters here because every
// one of the letters has one.
//
// design/source/symbols holds the untouched originals and is the only input.
//
// Usage: node design/import_symbols.mjs <dir containing node_modules with pngjs>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/import_symbols.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/symbols');
const OUT = path.join(appRoot, 'static/assets/sprites/soulSealSymbols');

// Output cell and safe area, from art-bible.md §5.5.
const CELL = 200;
const MARGIN = 12;
const SAFE = CELL - MARGIN * 2;

// How close to the sampled background a pixel must be to count as background
// while flooding. Generous, because these are compressed renders and the matte
// is not perfectly flat.
const FLOOD_TOLERANCE = 42;

// ── enclosed counters ───────────────────────────────────────────────────────
//
// The flood starts at the image border, so it can only reach background that the
// artwork does not enclose. A letterform encloses plenty: measured on J, the
// counter inside its hook came out fully opaque, a dark red blob sitting in a
// hole that should be empty.
//
// Two separate things kept it. The flood could not REACH it, and the colour
// there is outside the tolerance anyway - the artist's red glow has nowhere to
// fade to inside a closed counter, so it pools:
//
//     image border          rgb   0,  0,  0     dist  0
//     counter, edges        rgb  38,  0,  0     dist 38   within tolerance
//     counter, middle       rgb  55,  0,  4     dist 55   outside it
//     the letter's own face rgb 101, 34, 20     dist 101
//
// So an enclosed region is flooded on its own pass and at a WIDER tolerance, and
// the two numbers say something different about the picture. Outside the
// silhouette the glow is ART - it is the symbol's aura and the alpha recovery
// below gives it a soft edge. Inside a counter there is nothing to preserve: a
// counter is a hole by definition, and anything pooling in it is spill.
//
// The gap between 55 and 101 is what makes this safe. It is checked per symbol
// when the script runs - see the per-file report - so a symbol whose counter
// really does hold artwork would show up as a large clear rather than a small one.
// ── enclosed counters, for the symbols that ask for it ──────────────────────
//
// The flood starts at the image border, so it can only reach background the
// artwork does not enclose. J encloses some: the counter inside its hook came out
// a solid dark-red blob sitting in a hole that should be empty, because the flood
// could not get to it and the artist's glow had pooled there.
//
// This is NOT applied to every symbol, and the list below is the whole of it.
// Three general rules were tried and each one damaged artwork that is legitimately
// enclosed and legitimately dark:
//
//   flood enclosed regions at a wider tolerance  the fox mask lost the disc it is
//                                                painted on (-33%)
//   ...at the border's own tolerance             the same, and Q lost 23%
//   ...plus a size cap                           better, still -17% on the fox
//
// The reason no threshold works is measurable. Against its own matte, Q's counter
// reads 52 and the darkest pixels of Q's own FACE read 28 - the hole is lighter
// than parts of the letter around it. And h1's matte is rgb(55,3,5), a red, with
// the fox painted on a disc that is within tolerance of it by design.
//
// So this is a property of individual pieces of art, not of the pipeline, and it
// is named per file rather than guessed at. Adding a symbol here means looking at
// it first.
const ENCLOSED_COUNTERS = new Set(['l4.png']);
// How big an enclosed region may be, as a share of the image, and how big an
// island may be as a share of the symbol's own mass. Both are small on purpose:
// a counter is a fragment, and anything approaching the size of the picture is
// the picture.
const COUNTER_MAX_SHARE = 0.04;
const ISLAND_MAX_SHARE_OF_SYMBOL = 0.06;

// ── the carrier's spirit aura ───────────────────────────────────────────────
//
// M is the only symbol that gets one, and it is here rather than in the art
// because the reason is a MEASURED one about the board, not a drawing choice.
//
// Every symbol is fitted into the same 176px safe box, so a square-ish subject
// fills it and a portrait one does not. Measured across the set, the ink boxes
// are 152-176 wide except M's, which is 89 - the carrier is a slim standing
// ghost holding a talisman, while H1, W and S are all medallions inside a full
// square frame. At the same cell size M covers 27% of its canvas against 55-77%
// for the framed symbols, and on the board it reads as the smallest thing there
// despite being the one the player is hunting.
//
// Scaling cannot close that gap. The board mask is exactly the board's height,
// so a symbol whose ink exceeds one cell is cropped on the top and bottom rows;
// with M's ink at 88% of its canvas that ceiling is a ratio of 1.13, worth about
// 14% more area. So the cell is filled with LIGHT instead of with more ghost.
//
// Spirit-cyan, and only for this symbol, is what the art bible already says the
// colour is for: "spirit-cyan 只屬於妖" - the ghost's own cold self-light, which
// nothing in the environment is allowed to use (art-bible 2.2). The aura is
// derived from the ghost's own alpha rather than drawn, so it follows the pose
// and cannot drift out of register with the art.
const AURA_COLOR = [0x4f, 0xd1, 0xc5];
// Peak aura alpha. A glow, not a plate: high enough to claim the cell, low
// enough that the cell behind still reads as board rather than as a tile.
const AURA_PEAK = 168;
// Box-blur radius and passes. Three passes of a box blur approximate a Gaussian
// closely enough, and 13px on a 200px cell spreads the 89px-wide silhouette out
// to fill it.
const AURA_RADIUS = 15;
const AURA_PASSES = 3;

const boxBlur = (src, w, h, radius) => {
	const tmp = new Float32Array(w * h);
	const out = new Float32Array(w * h);
	const span = radius * 2 + 1;
	for (let y = 0; y < h; y++) {
		let sum = 0;
		for (let x = -radius; x <= radius; x++) sum += src[w * y + Math.min(w - 1, Math.max(0, x))];
		for (let x = 0; x < w; x++) {
			tmp[w * y + x] = sum / span;
			sum -= src[w * y + Math.min(w - 1, Math.max(0, x - radius))];
			sum += src[w * y + Math.min(w - 1, Math.max(0, x + radius + 1))];
		}
	}
	for (let x = 0; x < w; x++) {
		let sum = 0;
		for (let y = -radius; y <= radius; y++) sum += tmp[w * Math.min(h - 1, Math.max(0, y)) + x];
		for (let y = 0; y < h; y++) {
			out[w * y + x] = sum / span;
			sum -= tmp[w * Math.min(h - 1, Math.max(0, y - radius)) + x];
			sum += tmp[w * Math.min(h - 1, Math.max(0, y + radius + 1)) + x];
		}
	}
	return out;
};

/** Composite a spirit aura UNDER `png`, in place. */
const addSpiritAura = (png) => {
	const { width: w, height: h, data } = png;
	let field = new Float32Array(w * h);
	for (let i = 0; i < w * h; i++) field[i] = data[i * 4 + 3];
	for (let pass = 0; pass < AURA_PASSES; pass++) field = boxBlur(field, w, h, AURA_RADIUS);

	let peak = 0;
	for (let i = 0; i < w * h; i++) if (field[i] > peak) peak = field[i];
	if (peak <= 0) return;

	for (let i = 0; i < w * h; i++) {
		// A curved falloff, not linear: a linear ramp off a blurred silhouette
		// fills the corners too evenly and the aura reads as a rounded rectangle.
		// The exponent was 2.0 on the first pass, which pulled the glow back so
		// close to the ghost that it bought no cell presence at all.
		const t = field[i] / peak;
		const auraA = (Math.pow(t, 1.55) * AURA_PEAK) / 255;
		if (auraA <= 0) continue;
		const j = i * 4;
		const symA = data[j + 3] / 255;
		// symbol OVER aura, straight alpha
		const outA = symA + auraA * (1 - symA);
		if (outA <= 0) continue;
		for (let c = 0; c < 3; c++) {
			data[j + c] = Math.round(
				(data[j + c] * symA + AURA_COLOR[c] * auraA * (1 - symA)) / outA,
			);
		}
		data[j + 3] = Math.round(outA * 255);
	}
};

const at = (png, x, y) => (png.width * y + x) * 4;
const dist = (png, i, bg) =>
	Math.max(
		Math.abs(png.data[i] - bg[0]),
		Math.abs(png.data[i + 1] - bg[1]),
		Math.abs(png.data[i + 2] - bg[2]),
	);

/** Mark every pixel reachable from the border that is still near `bg`. */
const floodBackground = (png, bg, clearCounters) => {
	const seen = new Uint8Array(png.width * png.height);
	const stack = [];
	const push = (x, y) => {
		if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
		const idx = png.width * y + x;
		if (seen[idx]) return;
		if (dist(png, idx * 4, bg) > FLOOD_TOLERANCE) return;
		seen[idx] = 1;
		stack.push(x, y);
	};
	for (let x = 0; x < png.width; x++) {
		push(x, 0);
		push(x, png.height - 1);
	}
	for (let y = 0; y < png.height; y++) {
		push(0, y);
		push(png.width - 1, y);
	}
	while (stack.length) {
		const y = stack.pop();
		const x = stack.pop();
		push(x + 1, y);
		push(x - 1, y);
		push(x, y + 1);
		push(x, y - 1);
	}

	// ── the second pass: background the border could not reach ───────────────
	//
	// Only for the files named in ENCLOSED_COUNTERS - see the note there.
	if (!clearCounters) return { seen, enclosedCount: 0 };

	//
	// Every pixel still unseen is either the symbol or a counter enclosed by it.
	// A counter is found the same way the outside was - by flooding - only seeded
	// from the pixels themselves and judged at COUNTER_TOLERANCE. A component is
	// only cleared if EVERY pixel in it passed, so a region that is background at
	// its edges and artwork in the middle is left alone entire.
	const enclosed = [];
	const region = new Int32Array(png.width * png.height);
	for (let y0 = 0; y0 < png.height; y0++) {
		for (let x0 = 0; x0 < png.width; x0++) {
			const start = png.width * y0 + x0;
			if (seen[start] || region[start]) continue;
			if (dist(png, start * 4, bg) > FLOOD_TOLERANCE) continue;
			// walk this component, collecting it
			const members = [];
			const work = [x0, y0];
			region[start] = 1;
			let touchesEdge = false;
			while (work.length) {
				const y = work.pop();
				const x = work.pop();
				members.push(png.width * y + x);
				if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) touchesEdge = true;
				for (const [dx, dy] of [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1],
				]) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= png.width || ny >= png.height) continue;
					const n = png.width * ny + nx;
					if (seen[n] || region[n]) continue;
					if (dist(png, n * 4, bg) > FLOOD_TOLERANCE) continue;
					region[n] = 1;
					work.push(nx, ny);
				}
			}
			// A component reaching the edge is not enclosed - the border flood
			// already judged it at the narrower tolerance and decided to keep it.
			// SMALL enclosed regions only.
			//
			// "Enclosed and the colour of the matte" is not by itself a hole. The
			// fox mask is painted on a dark disc that sits within tolerance of its
			// own matte, and the priestess has a filled frame: clearing every
			// enclosed match took a third of the fox away. What a counter has that
			// those do not is that it is SMALL - J's is 2% of its image where the
			// fox's disc is 28% of its own.
			if (!touchesEdge && members.length <= png.width * png.height * COUNTER_MAX_SHARE) {
				enclosed.push(...members);
			}
		}
	}
	for (const idx of enclosed) seen[idx] = 1;

	// ── islands ──────────────────────────────────────────────────────────────
	//
	// What is left opaque is the symbol plus anything the symbol encloses that the
	// floods above could not judge - the core of a counter, where the artist's
	// glow pooled too far from the matte colour to be recognised as background.
	//
	// The symbol is the LARGEST connected mass. Everything else that does not
	// reach the image border is enclosed by the symbol and is not it.
	const island = new Uint8Array(png.width * png.height);
	const components = [];
	for (let y0 = 0; y0 < png.height; y0++) {
		for (let x0 = 0; x0 < png.width; x0++) {
			const start = png.width * y0 + x0;
			if (seen[start] || island[start]) continue;
			const members = [];
			const work = [x0, y0];
			island[start] = 1;
			let touchesEdge = false;
			while (work.length) {
				const y = work.pop();
				const x = work.pop();
				members.push(png.width * y + x);
				if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) touchesEdge = true;
				for (const [dx, dy] of [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1],
				]) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= png.width || ny >= png.height) continue;
					const n = png.width * ny + nx;
					if (seen[n] || island[n]) continue;
					island[n] = 1;
					work.push(nx, ny);
				}
			}
			components.push({ members, touchesEdge });
		}
	}
	// Islands are removed only when they are SMALL. The symbol is the largest mass
	// and everything enclosed by it is a fragment; capping the size is what stops
	// this from eating a symbol that the flood happened to split in two, which is
	// how the fox mask lost its disc and Q lost its face on the way here.
	let biggest = 0;
	for (const c of components) biggest = Math.max(biggest, c.members.length);
	let islandCount = 0;
	for (const c of components) {
		if (c.touchesEdge || c.members.length === biggest) continue;
		if (c.members.length > biggest * ISLAND_MAX_SHARE_OF_SYMBOL) continue;
		for (const idx of c.members) seen[idx] = 1;
		islandCount += c.members.length;
	}

	return { seen, enclosedCount: enclosed.length + islandCount };
};

/** Nearest-neighbour resample of an RGBA buffer region into a CELLxCELL canvas. */
const fitInto = (src, box, scale, dx, dy) => {
	const out = new PNG({ width: CELL, height: CELL });
	out.data.fill(0);
	for (let y = 0; y < CELL; y++) {
		for (let x = 0; x < CELL; x++) {
			const sx = Math.round((x - dx) / scale) + box.x0;
			const sy = Math.round((y - dy) / scale) + box.y0;
			if (sx < box.x0 || sy < box.y0 || sx > box.x1 || sy > box.y1) continue;
			const si = at(src, sx, sy);
			const di = at(out, x, y);
			out.data[di] = src.data[si];
			out.data[di + 1] = src.data[si + 1];
			out.data[di + 2] = src.data[si + 2];
			out.data[di + 3] = src.data[si + 3];
		}
	}
	return out;
};

const files = fs
	.readdirSync(SRC)
	.filter((f) => f.endsWith('.png'))
	.sort();

if (files.length === 0) {
	console.error(`No source symbols in ${path.relative(appRoot, SRC)}`);
	process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

for (const file of files) {
	const png = PNG.sync.read(fs.readFileSync(path.join(SRC, file)));

	// Sample the matte from the four corners and take the median channel, so one
	// corner that happens to carry artwork cannot define the background.
	const corners = [
		at(png, 0, 0),
		at(png, png.width - 1, 0),
		at(png, 0, png.height - 1),
		at(png, png.width - 1, png.height - 1),
	];
	const bg = [0, 1, 2].map((c) => {
		const vals = corners.map((i) => png.data[i + c]).sort((a, b) => a - b);
		return Math.round((vals[1] + vals[2]) / 2);
	});

	const { seen: isBg, enclosedCount } = floodBackground(png, bg, ENCLOSED_COUNTERS.has(file));

	let x0 = png.width;
	let y0 = png.height;
	let x1 = -1;
	let y1 = -1;

	for (let y = 0; y < png.height; y++) {
		for (let x = 0; x < png.width; x++) {
			const idx = png.width * y + x;
			const i = idx * 4;
			if (!isBg[idx]) {
				png.data[i + 3] = 255;
			} else {
				// C = F*a + BG*(1-a). The channel furthest from the matte carries the
				// most signal about a, so use it, then unpremultiply against BG.
				//
				// The ramp starts at FLOOD_TOLERANCE, not at zero. Without that knee
				// a matte that is dark-but-not-flat - a near-black tile with a soft
				// vignette, which is what m.png arrived as - keeps alpha ~67 across
				// its whole area and the symbol draws with a dark rectangle behind
				// it. Anything inside the matte's own noise floor must go fully
				// clear, or it is not keyed at all.
				const d = dist(png, i, bg);
				const a =
					d <= FLOOD_TOLERANCE
						? 0
						: Math.min(255, Math.round(((d - FLOOD_TOLERANCE) / (255 - FLOOD_TOLERANCE)) * 255 * 1.6));
				png.data[i + 3] = a;
				if (a > 0) {
					for (let c = 0; c < 3; c++) {
						const v = (png.data[i + c] - bg[c] * (1 - a / 255)) / (a / 255);
						png.data[i + c] = Math.max(0, Math.min(255, Math.round(v)));
					}
				}
			}
			if (png.data[i + 3] > 10) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		}
	}

	if (x1 < 0) {
		console.error(`  !! ${file}: nothing survived keying - check the matte`);
		process.exitCode = 1;
		continue;
	}

	// Fit the trimmed artwork inside the safe area, preserving aspect. Fitting
	// rather than filling keeps a tall letter and a round medallion at the same
	// visual weight, which is what stops the board looking like it was assembled
	// from two different games.
	const box = { x0, y0, x1, y1 };
	const w = x1 - x0 + 1;
	const h = y1 - y0 + 1;
	const scale = Math.min(SAFE / w, SAFE / h);
	const dx = Math.round((CELL - w * scale) / 2);
	const dy = Math.round((CELL - h * scale) / 2);

	const out = fitInto(png, box, scale, dx, dy);
	const aura = file === 'm.png';
	if (aura) addSpiritAura(out);
	fs.writeFileSync(path.join(OUT, file), PNG.sync.write(out));

	console.log(
		`${file.padEnd(8)} ${png.width}x${png.height} matte rgb(${bg}) ` +
			`-> content ${w}x${h} -> ${CELL}x${CELL} @ ${scale.toFixed(2)}x` +
			(enclosedCount ? ` + ${enclosedCount.toLocaleString()}px of enclosed counter` : '') +
			(aura ? ' + spirit aura' : ''),
	);
}

console.log(`\nWrote ${files.length} symbol(s) to ${path.relative(appRoot, OUT)}`);
