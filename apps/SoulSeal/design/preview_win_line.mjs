// Draw a mock board with a win line at exactly the weight WinLines.svelte uses.
//
// The first version of that component was built from ONE still frame of the
// reference and got both the weight and the rhythm wrong: a 5-unit line with a
// 9-unit dark under-stroke and a dot on every cell, against a hairline with
// neither. A still frame also cannot show that the reference's rhythm comes from
// the paying SYMBOLS pulsing, not from the line.
//
// So this renders the line at the real ratio, on real symbols, at the real cell
// proportions. It cannot show the pulse - that needs the running game - but it
// settles the weight, which is the half that kept being wrong.
//
// Usage: node design/preview_win_line.mjs <dir with node_modules for @resvg/resvg-js>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/preview_win_line.mjs <dir with node_modules>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYMBOLS = path.join(appRoot, 'static/assets/sprites/soulSealSymbols');
const FONT = path.join(appRoot, 'static/fonts/Cinzel.ttf');
const OUT = path.join(appRoot, 'design/preview_win_line.png');

// Must match WinLines.svelte / constants.ts.
const CELL = 200;
const LINE_WIDTH_RATIO = 0.018;
const LINE = '#EFB938';
const REELS = 5;
const ROWS = 3;

// One of the nine paylines: [0,1,2,1,0], the V. Chosen because it exercises both
// the steep and the shallow segments.
const LINE_ROWS = [0, 1, 2, 1, 0];
// What sits in each cell. The paying symbol runs along the line; everything else
// is filler and would be DIMMED in the game - the preview leaves it bright so
// the line's contrast is judged against the worst case.
const BOARD = [
	['h1', 'l1', 'l3'],
	['l2', 'h1', 'l4'],
	['l5', 'l1', 'h1'],
	['l3', 'h1', 'l2'],
	['h1', 'l4', 'l5'],
];

const load = (name) => fs.readFileSync(path.join(SYMBOLS, `${name}.png`)).toString('base64');

const cellX = (reel) => reel * CELL;
const cellY = (row) => row * CELL;
const centreX = (reel) => cellX(reel) + CELL / 2;
const centreY = (row) => cellY(row) + CELL / 2;

const width = CELL * REELS;
const height = CELL * ROWS;

const tiles = BOARD.flatMap((column, reel) =>
	column.map(
		(name, row) =>
			`<image x="${cellX(reel)}" y="${cellY(row)}" width="${CELL}" height="${CELL}" ` +
			`href="data:image/png;base64,${load(name)}"/>`,
	),
).join('\n');

const points = LINE_ROWS.map((row, reel) => `${centreX(reel)},${centreY(row)}`).join(' ');
const lineWidth = CELL * LINE_WIDTH_RATIO;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#1E3A3C"/>
${tiles}
<polyline points="${points}" fill="none" stroke="${LINE}" stroke-width="${lineWidth}"
          stroke-linecap="round" stroke-linejoin="round"/>
<text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="central"
      font-family="Cinzel" font-size="${CELL * 0.46}"
      fill="#FFFFFF" stroke="#1A1008" stroke-width="${CELL * 0.055}" paint-order="stroke">24.00</text>
</svg>`;

const resvg = new Resvg(svg, {
	fitTo: { mode: 'width', value: width },
	font: { fontFiles: [FONT], loadSystemFonts: true, defaultFontFamily: 'Cinzel' },
});
fs.writeFileSync(OUT, resvg.render().asPng());

console.log(`Wrote ${path.relative(appRoot, OUT)}`);
console.log(`  line ${lineWidth.toFixed(1)}px on a ${CELL}px cell (${(LINE_WIDTH_RATIO * 100).toFixed(1)}% of a cell)`);
console.log('  reference footage measured ~3px on a ~210px cell, about 1.4%');
