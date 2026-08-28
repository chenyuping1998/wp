// Redraw the six generated symbols to match the five supplied ones.
//
// The symbol set is currently two sets. H3/H4/H5/S/W are supplied artwork:
// 1024px, near-black rounded tile, a bold accent border, and a HOLLOW outlined
// neon glyph with a real glow bleeding onto the tile. H1/H2/L1-L4 are mine:
// 256px, olive-green tile, a thin flat stroke, no glow, and an amber that is not
// in the game's palette at all. Side by side they do not read as one set, and
// that is visible before any judgement about quality is even made.
//
// This redraws only MY six. The supplied five are never touched — see the note
// in design/dekey_supplied_art.mjs.
//
// Style, measured off h3.png at 1024 and halved for the 512 authoring size:
//   tile      inset 70, radius 90, near-black vertical gradient
//   outline   a thin near-black stroke outside the accent border
//   border    ~22px in the symbol's accent colour
//   highlight a faint light arc inside the top edge (glass)
//   glyph     hollow outline, ~26px stroke, bright accent, wide soft glow
//
// Writes to design/preview/ only. Nothing is installed into static/ by this
// script: run it, look at the contact sheet, and copy them in deliberately.
//
// ADOPTED SO FAR: L1, L2, L3, L4 only. H1 and H2 were rendered and reviewed but
// NOT taken — the amber coin and its pair stay as they were by decision, so the
// two premiums remain the odd ones out in the set. They are still generated here
// so the option stays open and the comparison sheet stays honest.
//
// Usage: node design/generate_symbols_match.mjs <dir with node_modules/@resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/generate_symbols_match.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYMBOL_DIR = path.join(appRoot, 'static/assets/sprites/marginCallSymbols');
const OUT_DIR = path.join(appRoot, 'design/preview/symbols_new');
fs.mkdirSync(OUT_DIR, { recursive: true });

// DejaVu Sans Bold, design-time only, for the two coin letterforms. Same source
// as the wordmark; the font is never shipped.
const FONT_DIRS = [
	path.resolve(appRoot, '../../../math-sdk/env/Lib/site-packages/matplotlib/mpl-data/fonts/ttf'),
];

const S = 512; // authoring size
const INSET = 35;
const TILE = S - INSET * 2;
const RADIUS = 45;
const BORDER = 13;
const GLYPH_W = 13;

// Palette. AMBER and VIOLET are already the plaque tiers' colours in
// generate_theme.mjs, so the premiums span the same range the rest of the game
// uses. The supplied art holds red (H3), green (H5, W) and cyan (S), so the two
// new premiums take the two the set is missing.
const BULL = '#4bd67f';
const BEAR = '#ff5566';
const AMBER = '#f7a83a';
const VIOLET = '#9b7bff';

/** The tile every symbol sits on. Identical for all six, by design. */
const tile = (accent) => `
	<rect x="${INSET}" y="${INSET}" width="${TILE}" height="${TILE}" rx="${RADIUS}"
		fill="none" stroke="#05070a" stroke-width="${BORDER + 9}"/>
	<rect x="${INSET}" y="${INSET}" width="${TILE}" height="${TILE}" rx="${RADIUS}"
		fill="url(#face)" stroke="${accent}" stroke-width="${BORDER}"/>
	<!-- glass: a faint lit arc just inside the top edge -->
	<path d="M ${INSET + 26} ${INSET + 62} Q ${INSET + 26} ${INSET + 26} ${INSET + 62} ${INSET + 26}
		L ${INSET + TILE - 46} ${INSET + 26}"
		fill="none" stroke="#ffffff" stroke-width="5" opacity="0.12" stroke-linecap="round"/>`;

/**
 * A glyph, drawn twice: a wide blurred copy for the neon bleed, then the crisp
 * outline on top. This is what the supplied art does and it is most of why it
 * reads as lit rather than as a line drawing.
 */
const neon = (body, accent) => `
	<g filter="url(#bleedWide)" opacity="0.55">${body.replaceAll('%C', accent)}</g>
	<g filter="url(#bleed)" opacity="0.95">${body.replaceAll('%C', accent)}</g>
	<g>${body.replaceAll('%C', accent)}</g>`;

// ── glyphs ─────────────────────────────────────────────────────────────────
// Deliberately NOT real marks. The supplied H3 carries a registered wordmark
// already; there is no reason to add more of them, and a plain letter inside a
// coin is generic and reads instantly at cell size.
const coin = (letter) => `
	<circle cx="${S / 2}" cy="${S / 2}" r="132" fill="none" stroke="%C" stroke-width="${GLYPH_W}"/>
	<circle cx="${S / 2}" cy="${S / 2}" r="112" fill="none" stroke="%C" stroke-width="4" opacity="0.55"/>
	${Array.from({ length: 36 }, (_, i) => {
		const a = (i / 36) * Math.PI * 2;
		const r0 = 132 + GLYPH_W / 2;
		const r1 = r0 + 15;
		return `<path d="M ${(S / 2 + Math.cos(a) * r0).toFixed(1)} ${(S / 2 + Math.sin(a) * r0).toFixed(1)} L ${(S / 2 + Math.cos(a) * r1).toFixed(1)} ${(S / 2 + Math.sin(a) * r1).toFixed(1)}" stroke="%C" stroke-width="6" stroke-linecap="round" opacity="0.75"/>`;
	}).join('')}
	<text x="${S / 2}" y="${S / 2 + 58}" font-family="DejaVu Sans" font-weight="bold" font-size="168"
		text-anchor="middle" fill="none" stroke="%C" stroke-width="${GLYPH_W}"
		stroke-linejoin="round">${letter}</text>`;

/** A candlestick: hollow body, wick through it. Low symbols stay simple. */
const candle = (up) => {
	const cx = S / 2;
	const bodyH = 150;
	const bodyY = S / 2 - bodyH / 2 + (up ? -8 : 8);
	return `
	<path d="M ${cx} ${S / 2 - 148} L ${cx} ${S / 2 + 148}" stroke="%C" stroke-width="${GLYPH_W}" stroke-linecap="round"/>
	<rect x="${cx - 62}" y="${bodyY}" width="124" height="${bodyH}" rx="16"
		fill="none" stroke="%C" stroke-width="${GLYPH_W}"/>`;
};

/** A trend line with a head. L3 rallies, L4 sells off. */
const trend = (up) => {
	const p = up
		? `M ${S / 2 - 128} ${S / 2 + 92} L ${S / 2 - 42} ${S / 2 - 6} L ${S / 2 + 16} ${S / 2 + 46} L ${S / 2 + 118} ${S / 2 - 88}`
		: `M ${S / 2 - 128} ${S / 2 - 92} L ${S / 2 - 42} ${S / 2 + 6} L ${S / 2 + 16} ${S / 2 - 46} L ${S / 2 + 118} ${S / 2 + 88}`;
	const head = up
		? `M ${S / 2 + 52} ${S / 2 - 88} L ${S / 2 + 118} ${S / 2 - 88} L ${S / 2 + 118} ${S / 2 - 22}`
		: `M ${S / 2 + 52} ${S / 2 + 88} L ${S / 2 + 118} ${S / 2 + 88} L ${S / 2 + 118} ${S / 2 + 22}`;
	return `
	<path d="${p}" fill="none" stroke="%C" stroke-width="${GLYPH_W}" stroke-linejoin="round" stroke-linecap="round"/>
	<path d="${head}" fill="none" stroke="%C" stroke-width="${GLYPH_W}" stroke-linejoin="round" stroke-linecap="round"/>`;
};

const SYMBOLS = {
	h1: { accent: AMBER, glyph: coin('B'), label: 'B-coin' },
	h2: { accent: VIOLET, glyph: coin('E'), label: 'E-coin' },
	l1: { accent: BULL, glyph: candle(true), label: 'Green Candle' },
	l2: { accent: BEAR, glyph: candle(false), label: 'Red Candle' },
	l3: { accent: BULL, glyph: trend(true), label: 'Rally' },
	l4: { accent: BEAR, glyph: trend(false), label: 'Selloff' },
};

const render = (accent, glyph) => {
	const defs = `
	<linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#141518"/>
		<stop offset="0.55" stop-color="#0b0c0e"/>
		<stop offset="1" stop-color="#050607"/>
	</linearGradient>
	<radialGradient id="bed" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="${accent}" stop-opacity="0.3"/>
		<stop offset="1" stop-color="${accent}" stop-opacity="0"/>
	</radialGradient>
	<filter id="bleed" x="-45%" y="-45%" width="190%" height="190%">
		<feGaussianBlur stdDeviation="15"/>
	</filter>
	<filter id="bleedWide" x="-70%" y="-70%" width="240%" height="240%">
		<feGaussianBlur stdDeviation="34"/>
	</filter>
	<clipPath id="tileClip">
		<rect x="${INSET}" y="${INSET}" width="${TILE}" height="${TILE}" rx="${RADIUS}"/>
	</clipPath>`;

	const body = `
	${tile(accent)}
	<g clip-path="url(#tileClip)">
		<rect x="${INSET}" y="${INSET}" width="${TILE}" height="${TILE}" fill="url(#bed)"/>
		${neon(glyph, accent)}
	</g>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><defs>${defs}</defs>${body}</svg>`;
};

const opts = { fitTo: { mode: 'width', value: S }, font: { fontDirs: FONT_DIRS, loadSystemFonts: true } };

for (const [name, spec] of Object.entries(SYMBOLS)) {
	const png = new Resvg(render(spec.accent, spec.glyph), opts).render().asPng();
	fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), png);
	console.log(`  ${name}.png  ${(png.length / 1024).toFixed(1)} KB   ${spec.label}`);
}

// ── contact sheet: new six on top, supplied five below, on the real ground ──
const CELL = 200;
const PAD = 18;
const newNames = Object.keys(SYMBOLS);
const supplied = ['h3', 'h4', 'h5', 's', 'w'];
const cols = Math.max(newNames.length, supplied.length);
const W = PAD + cols * (CELL + PAD);
const H = PAD + 2 * (CELL + PAD + 26) + 34;

const uri = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
const row = (names, dir, y, caption) => {
	let out = `<text x="${PAD}" y="${y - 10}" font-family="DejaVu Sans" font-size="15" fill="#7f9d8c">${caption}</text>`;
	names.forEach((n, i) => {
		const x = PAD + i * (CELL + PAD);
		out += `<image x="${x}" y="${y}" width="${CELL}" height="${CELL}" href="${uri(path.join(dir, `${n}.png`))}"/>`;
		out += `<text x="${x + CELL / 2}" y="${y + CELL + 18}" font-family="DejaVu Sans" font-size="14" fill="#cfe9da" text-anchor="middle">${n.toUpperCase()}</text>`;
	});
	return out;
};

const sheet =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
	`<rect width="${W}" height="${H}" fill="#0d1611"/>` +
	row(newNames, OUT_DIR, PAD + 26, 'NEW — redrawn to match') +
	row(supplied, SYMBOL_DIR, PAD + 26 + CELL + PAD + 26 + 26, 'SUPPLIED — untouched, for comparison') +
	`</svg>`;

const sheetPath = path.join(appRoot, 'design/preview/symbols_compare.png');
fs.writeFileSync(sheetPath, new Resvg(sheet, { fitTo: { mode: 'width', value: W }, font: { fontDirs: FONT_DIRS, loadSystemFonts: true } }).render().asPng());
console.log(`\nwrote ${path.relative(appRoot, sheetPath)}`);
console.log('NOT installed — static/assets/sprites/marginCallSymbols is untouched.');
