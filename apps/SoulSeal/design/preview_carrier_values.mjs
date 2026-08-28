// Composite the carrier value onto the carrier sprite, exactly as
// CarrierValues.svelte places it, and write a contact sheet.
//
// This exists because "does the number land on the paper" is the one thing the
// build cannot answer. The type checker sees numbers, the asset guard sees a
// file, and both are happy with a value printed on the spirit's face. The
// placement constants were measured off the artwork and they are wrong the
// moment the artwork is redrawn.
//
// The geometry here is COPIED from CarrierValues.svelte rather than imported -
// a .svelte file cannot be loaded from a plain node script. That duplication is
// the weakness of this preview: it verifies the numbers are sane, not that the
// component still uses them. Check both if you change either.
//
// Usage: node design/preview_carrier_values.mjs <dir with node_modules for @resvg/resvg-js>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/preview_carrier_values.mjs <dir with node_modules>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARRIER = path.join(appRoot, 'static/assets/sprites/soulSealSymbols/m.png');
const OUT = path.join(appRoot, 'design/preview_carrier_values.png');
// The real display face. Rendering the preview in Arial would flatter the fit:
// Cinzel is an inscriptional display face and wider per character than Arial, so a
// string that clears the paper in Arial can still overhang in the game.
const FONT = path.join(appRoot, 'static/fonts/Cinzel.ttf');

// Must match CarrierValues.svelte.
const CELL = 200;
const TALISMAN_CX = 0.54;
const TALISMAN_CY = 0.685;
const TALISMAN_W = 0.205;
const TALISMAN_H = 0.345;
// Matches CarrierValues.svelte. NOTE the preview renders Cinzel at weight 400 -
// resvg cannot instance a variable font's axis - while the game draws it at 700,
// which is wider. The ratio here is the GAME's, so this preview is deliberately
// pessimistic about the fit rather than flattering about it.
const CHAR_RATIO = 0.89;
const CINNABAR = '#C8102E';
const PAPER_SHADOW = '#7A2410';

const MIN_SIZE_RATIO = 0.05;
const fontSizeFor = (label) => {
	const paperW = CELL * TALISMAN_W * 0.9;
	const paperH = CELL * TALISMAN_H;
	const fit = paperW / (label.length * CHAR_RATIO);
	return Math.min(paperH * 0.42, Math.max(CELL * MIN_SIZE_RATIO, fit));
};

// Every distinct string length the ladder can produce, worst case first.
const SAMPLES = ['1000x', '0.5x', '250x', '15x', '2x'];

const carrierData = fs.readFileSync(CARRIER).toString('base64');

const tile = (label, i) => {
	const size = fontSizeFor(label);
	const x = i * CELL;
	const cx = x + CELL * TALISMAN_CX;
	const cy = CELL * TALISMAN_CY;
	// the paper's own box, drawn as a thin guide so a number that overflows it is
	// obvious rather than merely ugly
	const pw = CELL * TALISMAN_W;
	const ph = CELL * TALISMAN_H;
	return `
<image x="${x}" y="0" width="${CELL}" height="${CELL}" href="data:image/png;base64,${carrierData}"/>
<rect x="${cx - pw / 2}" y="${cy - ph / 2}" width="${pw}" height="${ph}"
      fill="none" stroke="#00FF88" stroke-width="1" stroke-dasharray="3 3" opacity="0.8"/>
<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
      font-family="Cinzel" font-size="${size}"
      fill="${CINNABAR}" stroke="${PAPER_SHADOW}" stroke-width="${Math.max(1, size * 0.09)}"
      paint-order="stroke">${label}</text>
<text x="${x + CELL / 2}" y="${CELL - 8}" text-anchor="middle"
      font-family="Arial, sans-serif" font-size="11" fill="#FFFFFF" opacity="0.7"
      >${label} @ ${size.toFixed(1)}px</text>`;
};

const width = CELL * SAMPLES.length;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${CELL}" viewBox="0 0 ${width} ${CELL}">
<rect width="${width}" height="${CELL}" fill="#1E3A3C"/>
${SAMPLES.map(tile).join('\n')}
</svg>`;

const resvg = new Resvg(svg, {
	fitTo: { mode: 'width', value: width * 2 },
	font: { fontFiles: [FONT], loadSystemFonts: true, defaultFontFamily: 'Cinzel' },
});
fs.writeFileSync(OUT, resvg.render().asPng());

console.log(`Wrote ${path.relative(appRoot, OUT)}`);
for (const label of SAMPLES) {
	const size = fontSizeFor(label);
	const estWidth = label.length * CHAR_RATIO * size;
	const paperW = CELL * TALISMAN_W * 0.9;
	// The longest values are allowed a modest overhang - see MIN_SIZE_RATIO.
	const fits = estWidth <= paperW * 1.3;
	console.log(
		`  ${label.padEnd(6)} font ${size.toFixed(1).padStart(5)}px  ` +
			`est width ${estWidth.toFixed(1).padStart(5)} / ${paperW.toFixed(1)}  ${fits ? 'fits' : 'OVERFLOWS'}`,
	);
	if (!fits) process.exitCode = 1;
}
