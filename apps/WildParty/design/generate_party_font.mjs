// WildParty party-styled replacement for the `gold` bitmap font (was the
// Mining Madness rustic wood-grain numeral font, static/assets/fonts/goldFont/
// mm_gold.{xml,png}). Every number/label in the game shares this one font
// (FreeSpinCounter, GlobalMultiplier, FreeSpinIntro's trigger count, Win.svelte's
// big-win amount) so replacing it here — keeping face="gold" and every glyph's
// existing x/y/width/height/xoffset/yoffset/xadvance box — updates all of them
// at once with zero component changes.
// Usage: node design/generate_party_font.mjs <dir containing node_modules with @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_party_font.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(appRoot, 'static/assets/fonts/goldFont');

// ─── original glyph metrics (kept byte-for-byte so BitmapText layout doesn't
// shift) — id, x, y, width, height, xoffset, yoffset, xadvance ────────────────
const SCALE_W = 1482;
const SCALE_H = 214;
const LINE_HEIGHT = 105;
const BASE = 105;

const CHARS = [
	{ id: 32, x: 0, y: 0, w: 39.5, h: 1, xoff: 0, yoff: 0, xadv: 39.5, glyph: null },
	{ id: 33, x: 1377, y: 108, w: 25, h: 105, xoff: 0, yoff: 0, xadv: 25, glyph: '!' },
	{ id: 36, x: 1141, y: 108, w: 41, h: 105, xoff: 0, yoff: 0, xadv: 41, glyph: '$' },
	{ id: 43, x: 797, y: 1, w: 54, h: 105, xoff: 0, yoff: 0, xadv: 54, glyph: '+' },
	{ id: 44, x: 1431, y: 108, w: 24, h: 105, xoff: 0, yoff: 0, xadv: 24, glyph: ',' },
	{ id: 45, x: 1304, y: 108, w: 35, h: 105, xoff: 0, yoff: 0, xadv: 35, glyph: '-' },
	{ id: 48, x: 965, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '0' },
	{ id: 49, x: 1020, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '1' },
	{ id: 50, x: 1075, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '2' },
	{ id: 51, x: 1130, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '3' },
	{ id: 52, x: 1185, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '4' },
	{ id: 53, x: 1240, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '5' },
	{ id: 54, x: 1295, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '6' },
	{ id: 55, x: 1350, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '7' },
	{ id: 56, x: 1405, y: 1, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '8' },
	{ id: 57, x: 1, y: 108, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: '9' },
	{ id: 59, x: 1404, y: 108, w: 25, h: 105, xoff: 0, yoff: 0, xadv: 25, glyph: ';' },
	{ id: 61, x: 853, y: 1, w: 54, h: 105, xoff: 0, yoff: 0, xadv: 54, glyph: '=' },
	{ id: 63, x: 1052, y: 108, w: 43, h: 105, xoff: 0, yoff: 0, xadv: 43, glyph: '?' },
	{ id: 65, x: 271, y: 108, w: 50, h: 105, xoff: 0, yoff: 0, xadv: 50, glyph: 'A' },
	{ id: 66, x: 426, y: 108, w: 48, h: 105, xoff: 0, yoff: 0, xadv: 48, glyph: 'B' },
	{ id: 67, x: 868, y: 108, w: 44, h: 105, xoff: 0, yoff: 0, xadv: 44, glyph: 'C' },
	{ id: 58, x: 1460, y: 1, w: 21, h: 105, xoff: 0, yoff: 0, xadv: 21, glyph: ':' },
	{ id: 68, x: 476, y: 108, w: 48, h: 105, xoff: 0, yoff: 0, xadv: 48, glyph: 'D' },
	{ id: 69, x: 526, y: 108, w: 48, h: 105, xoff: 0, yoff: 0, xadv: 48, glyph: 'E' },
	{ id: 8364, x: 559, y: 1, w: 60, h: 105, xoff: 0, yoff: 0, xadv: 60, glyph: '€' },
	{ id: 70, x: 626, y: 108, w: 47, h: 105, xoff: 0, yoff: 0, xadv: 47, glyph: 'F' },
	{ id: 71, x: 576, y: 108, w: 48, h: 105, xoff: 0, yoff: 0, xadv: 48, glyph: 'G' },
	{ id: 72, x: 683, y: 1, w: 55, h: 105, xoff: 0, yoff: 0, xadv: 55, glyph: 'H' },
	{ id: 73, x: 1227, y: 108, w: 37, h: 105, xoff: 0, yoff: 0, xadv: 37, glyph: 'I' },
	{ id: 8377, x: 425, y: 1, w: 67, h: 105, xoff: 0, yoff: 0, xadv: 67, glyph: '₹' },
	{ id: 74, x: 1097, y: 108, w: 42, h: 105, xoff: 0, yoff: 0, xadv: 42, glyph: 'J' },
	{ id: 75, x: 56, y: 108, w: 53, h: 105, xoff: 0, yoff: 0, xadv: 53, glyph: 'K' },
	{ id: 8361, x: 1, y: 1, w: 119, h: 105, xoff: 0, yoff: 0, xadv: 119, glyph: '₩' },
	{ id: 76, x: 675, y: 108, w: 47, h: 105, xoff: 0, yoff: 0, xadv: 47, glyph: 'L' },
	{ id: 77, x: 279, y: 1, w: 73, h: 105, xoff: 0, yoff: 0, xadv: 73, glyph: 'M' },
	{ id: 215, x: 914, y: 108, w: 44, h: 105, xoff: 0, yoff: 0, xadv: 44, glyph: '×' },
	{ id: 78, x: 165, y: 108, w: 51, h: 105, xoff: 0, yoff: 0, xadv: 51, glyph: 'N' },
	{ id: 79, x: 960, y: 108, w: 44, h: 105, xoff: 0, yoff: 0, xadv: 44, glyph: 'O' },
	{ id: 80, x: 773, y: 108, w: 46, h: 105, xoff: 0, yoff: 0, xadv: 46, glyph: 'P' },
	{ id: 46, x: 1457, y: 108, w: 23, h: 105, xoff: 0, yoff: 0, xadv: 23, glyph: '.' },
	{ id: 8369, x: 122, y: 1, w: 79, h: 105, xoff: 0, yoff: 0, xadv: 79, glyph: '₱' },
	{ id: 81, x: 724, y: 108, w: 47, h: 105, xoff: 0, yoff: 0, xadv: 47, glyph: 'Q' },
	{ id: 34, x: 1184, y: 108, w: 41, h: 105, xoff: 0, yoff: 0, xadv: 41, glyph: '"' },
	{ id: 82, x: 323, y: 108, w: 50, h: 105, xoff: 0, yoff: 0, xadv: 50, glyph: 'R' },
	{ id: 8381, x: 494, y: 1, w: 63, h: 105, xoff: 0, yoff: 0, xadv: 63, glyph: '₽' },
	{ id: 83, x: 821, y: 108, w: 45, h: 105, xoff: 0, yoff: 0, xadv: 45, glyph: 'S' },
	{ id: 84, x: 218, y: 108, w: 51, h: 105, xoff: 0, yoff: 0, xadv: 51, glyph: 'T' },
	{ id: 8378, x: 621, y: 1, w: 60, h: 105, xoff: 0, yoff: 0, xadv: 60, glyph: '₺' },
	{ id: 85, x: 909, y: 1, w: 54, h: 105, xoff: 0, yoff: 0, xadv: 54, glyph: 'U' },
	{ id: 86, x: 111, y: 108, w: 52, h: 105, xoff: 0, yoff: 0, xadv: 52, glyph: 'V' },
	{ id: 8363, x: 740, y: 1, w: 55, h: 105, xoff: 0, yoff: 0, xadv: 55, glyph: '₫' },
	{ id: 87, x: 203, y: 1, w: 74, h: 105, xoff: 0, yoff: 0, xadv: 74, glyph: 'W' },
	{ id: 88, x: 1006, y: 108, w: 44, h: 105, xoff: 0, yoff: 0, xadv: 44, glyph: 'X' },
	{ id: 89, x: 375, y: 108, w: 49, h: 105, xoff: 0, yoff: 0, xadv: 49, glyph: 'Y' },
	{ id: 122, x: 1266, y: 108, w: 36, h: 105, xoff: 0, yoff: 0, xadv: 36, glyph: 'z' },
	{ id: 165, x: 354, y: 1, w: 69, h: 105, xoff: 0, yoff: 0, xadv: 69, glyph: '¥' },
	{ id: 322, x: 1341, y: 108, w: 34, h: 105, xoff: 0, yoff: 0, xadv: 34, glyph: 'ł' },
];

const OUTLINE = '#2a0a20'; // same dark plum outline used by banner_big.png text
const FONT_STACK = "'Arial Black', Arial, 'Segoe UI', sans-serif";

// One glyph per <text>, fit into its box with textLength (width) and a
// baseline pinned to the box bottom (matches yoffset=0 for all chars).
let glyphMarkup = '';
for (const c of CHARS) {
	if (!c.glyph) continue; // space — leave transparent
	const cx = c.x + c.w / 2;
	const baseline = c.y + c.h * 0.93;
	glyphMarkup += `
	<text x="${cx}" y="${baseline}" text-anchor="middle" textLength="${c.w * 0.92}" lengthAdjust="spacingAndGlyphs"
		font-family="${FONT_STACK}" font-weight="900" font-size="${c.h}"
		fill="#2a0a20" opacity="0.55" transform="translate(1.5 3)">${c.glyph}</text>
	<text x="${cx}" y="${baseline}" text-anchor="middle" textLength="${c.w * 0.92}" lengthAdjust="spacingAndGlyphs"
		font-family="${FONT_STACK}" font-weight="900" font-size="${c.h}"
		fill="url(#txt)" stroke="${OUTLINE}" stroke-width="${c.h * 0.085}" paint-order="stroke">${c.glyph}</text>
	<text x="${cx}" y="${baseline}" text-anchor="middle" textLength="${c.w * 0.92}" lengthAdjust="spacingAndGlyphs"
		font-family="${FONT_STACK}" font-weight="900" font-size="${c.h}" fill="url(#shine)">${c.glyph}</text>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SCALE_W}" height="${SCALE_H}" viewBox="0 0 ${SCALE_W} ${SCALE_H}">
	<defs>
		<linearGradient id="txt" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#e8930c"/>
		</linearGradient>
		<linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/>
			<stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
			<stop offset="1" stop-color="#000000" stop-opacity="0.15"/>
		</linearGradient>
	</defs>
	${glyphMarkup}
</svg>`;

const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: SCALE_W }, font: { loadSystemFonts: true } });
fs.writeFileSync(path.join(FONT_DIR, 'mm_gold.png'), resvg.render().asPng());
console.log('rendered mm_gold.png');

const xmlChars = CHARS.map(
	(c) =>
		`    <char id="${c.id}" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" xoffset="${c.xoff}" yoffset="${c.yoff}" xadvance="${c.xadv}" yadvance="${c.h}"/>`,
).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<font>
  <info face="gold" size="105" bold="0" italic="0" charset="" unicode="" stretchH="105" smooth="1" aa="1" padding="0,0,0,0" spacing="1,0" outline="0"/>
  <common lineHeight="${LINE_HEIGHT}" base="${BASE}" scaleW="${SCALE_W}" scaleH="${SCALE_H}" pages="1" packed="0"/>
  <pages>
    <page id="0" file="mm_gold.png"/>
  </pages>
  <chars>
${xmlChars}
  </chars>
</font>
`;
fs.writeFileSync(path.join(FONT_DIR, 'mm_gold.xml'), xml);
console.log('wrote mm_gold.xml —', CHARS.length, 'glyphs');
