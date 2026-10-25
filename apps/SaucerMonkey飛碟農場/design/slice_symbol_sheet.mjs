// Slice a contact sheet of symbol tiles into individual PNGs.
//
// The art is delivered as one image: a grid of tiles on a pure-black ground,
// with a white filename caption under each. This finds the tiles by projection
// (black ground = zero signal) rather than by hardcoded coordinates, so a
// re-exported sheet with different margins or a different number of rows still
// slices correctly. Captions are ignored — they are thin bands, and the row
// filter drops anything shorter than half the tallest band.
//
// Tiles are written at their native size to design/source/gen2_symbols/;
// generate_symbols_gen2.mjs does the scaling to 256. Names come from ORDER
// below (reading order, left to right, top to bottom) because reading the
// captions would mean OCR for no benefit — if the sheet's layout changes, edit
// ORDER to match.
//
// Usage: node design/slice_symbol_sheet.mjs <toolsDir> <sheet.png>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const [toolsDir, sheetPath] = process.argv.slice(2);
if (!toolsDir || !sheetPath) {
	console.error('usage: node slice_symbol_sheet.mjs <toolsDir> <sheet.png>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'design/source/gen2_symbols');
fs.mkdirSync(OUT_DIR, { recursive: true });

const ORDER = ['w', 's', 'h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5'];

// Anything above this is "content". The ground is pure black; the darkest tile
// corners still sit well above it, and the captions are pure white.
const INK = 28;

const png = PNG.sync.read(fs.readFileSync(sheetPath));
const lum = (x, y) => {
	const i = (png.width * y + x) * 4;
	return (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3;
};

// Contiguous runs of indices whose signal clears `min`.
const runs = (counts, min) => {
	const out = [];
	let start = -1;
	for (let i = 0; i <= counts.length; i++) {
		const on = i < counts.length && counts[i] > min;
		if (on && start < 0) start = i;
		if (!on && start >= 0) {
			out.push([start, i - 1]);
			start = -1;
		}
	}
	return out;
};

// Row bands, then drop the caption bands: tile bands are hundreds of px tall,
// captions are single digits, so half the tallest band separates them with an
// enormous margin either way.
const rowCounts = [];
for (let y = 0; y < png.height; y++) {
	let c = 0;
	for (let x = 0; x < png.width; x++) if (lum(x, y) > INK) c++;
	rowCounts.push(c);
}
const allRows = runs(rowCounts, png.width * 0.05);
const tallest = Math.max(...allRows.map(([a, b]) => b - a + 1));
const rowBands = allRows.filter(([a, b]) => b - a + 1 > tallest / 2);

const tiles = [];
for (const [y0, y1] of rowBands) {
	const colCounts = [];
	for (let x = 0; x < png.width; x++) {
		let c = 0;
		for (let y = y0; y <= y1; y++) if (lum(x, y) > INK) c++;
		colCounts.push(c);
	}
	// 30% of the band height: high enough to ignore a stray caption pixel, low
	// enough that a tile with dark upper corners still registers across its
	// full width.
	const widest = Math.max(...runs(colCounts, (y1 - y0 + 1) * 0.3).map(([a, b]) => b - a + 1));
	for (const [x0, x1] of runs(colCounts, (y1 - y0 + 1) * 0.3)) {
		// A tile whose middle is dark can split into two runs; anything much
		// narrower than the widest run in the band is such a fragment, so merge
		// it into the previous tile rather than emitting it as its own.
		if (x1 - x0 + 1 < widest * 0.5 && tiles.length && tiles.at(-1).y0 === y0) {
			tiles.at(-1).x1 = Math.max(tiles.at(-1).x1, x1);
			continue;
		}
		tiles.push({ x0, x1, y0, y1 });
	}
}

if (tiles.length !== ORDER.length) {
	throw new Error(
		`found ${tiles.length} tiles but ORDER lists ${ORDER.length} names — ` +
			`check the sheet layout and update ORDER.\n` +
			tiles.map((t) => `  ${t.x0},${t.y0} -> ${t.x1},${t.y1}`).join('\n'),
	);
}

// Tighten each tile to its own ink: the band edges are shared across a row, and
// tiles in the same row do not all start and end on the same scanline.
for (const t of tiles) {
	let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
	for (let y = t.y0; y <= t.y1; y++) {
		for (let x = t.x0; x <= t.x1; x++) {
			if (lum(x, y) > INK) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		}
	}
	Object.assign(t, { x0, x1, y0, y1 });
}

tiles.forEach((t, i) => {
	const w = t.x1 - t.x0 + 1;
	const h = t.y1 - t.y0 + 1;
	const out = new PNG({ width: w, height: h });
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const s = ((t.y0 + y) * png.width + (t.x0 + x)) * 4;
			const d = (y * w + x) * 4;
			for (let c = 0; c < 4; c++) out.data[d + c] = png.data[s + c];
		}
	}
	const name = ORDER[i];
	fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), PNG.sync.write(out));
	console.log(`${name}.png  ${w}x${h}  from ${t.x0},${t.y0}`);
});

console.log(`\nsliced ${tiles.length} tiles to ${path.relative(appRoot, OUT_DIR)}`);
