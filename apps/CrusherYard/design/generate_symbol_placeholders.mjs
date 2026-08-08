// Stand-in symbol art for Crusher Yard.
//
// These exist so the game is bootable and its timing, sizing and contrast can be
// judged honestly BEFORE the real artwork arrives. When it does, it goes in
// design/source/symbols/ and `node design/process_symbols.mjs` overwrites
// everything this writes — same filenames, same directory, same 256x256 RGBA.
// Nothing else in the game needs to change.
//
// Usage: node design/generate_symbol_placeholders.mjs <dir with node_modules/@resvg/resvg-js>
//
// Two rules drive the drawings, both learned the hard way on the sibling games:
//
//  1. EVERY SYMBOL HAS ITS OWN SILHOUETTE. In a 98px cell, four shapes that
//     differ only in colour are unreadable. So the eight paying symbols are four
//     distinct machine outlines and four distinct hardware outlines, and the two
//     specials are shapes nothing else in the set uses. The check is the contact
//     sheet: if two symbols blur together at cell size, the thing to change is
//     the shape, not the hue.
//
//  2. RANK IS CARRIED BY MATERIAL. Highs are painted, saturated salvage — a
//     yellow engine block, a teal television. Lows are bare galvanised steel in
//     four greys. That leaves the whole warm end of the palette to the pressure
//     gauge and the win marks, which is where the player has to look during a
//     tumble.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_symbol_placeholders.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/crusherYardSymbols');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 256;

/** Painted metal for the high symbols: a body colour plus its shading ramp. */
const paint = (id, light, mid, dark) => `
	<linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="${light}"/>
		<stop offset="0.45" stop-color="${mid}"/>
		<stop offset="1" stop-color="${dark}"/>
	</linearGradient>`;

const DEFS = `
	${paint('pYellow', '#ffe08a', '#e8a417', '#8c5c07')}
	${paint('pTeal', '#8fe6de', '#2f9c96', '#12494a')}
	${paint('pWhite', '#f6f7f2', '#c3c8c0', '#6e7570')}
	${paint('pRed', '#ff9c72', '#c9482a', '#6b1d10')}
	${paint('sSteel1', '#e6ebee', '#9fa9b0', '#575f66')}
	${paint('sSteel2', '#d3dade', '#8e989f', '#4a5258')}
	${paint('sSteel3', '#c2c9cd', '#7f888f', '#3f474d')}
	${paint('sSteel4', '#b2b9bd', '#727b82', '#363d43')}
	${paint('pOrange', '#ffd08a', '#f07c18', '#8a3c05')}
	${paint('pCyan', '#c9f4ff', '#3fb6dd', '#12556e')}
	<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
		<stop offset="0.42" stop-color="#ffffff" stop-opacity="0"/>
	</linearGradient>
	<filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
		<feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
	</filter>`;

/**
 * Dark underlay, body fill, top sheen — the same three-pass build the UI icons
 * use. The underlay is what keeps a symbol readable against a light cell and
 * against the additive bloom the win effect draws over it.
 */
const symbol = (shape, fill, { outline = '#141518', sheen = true } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
	<defs>${DEFS}</defs>
	<g filter="url(#drop)">
		<g stroke="${outline}" stroke-width="22" stroke-linejoin="round" stroke-linecap="round" fill="${outline}">${shape}</g>
		<g fill="url(#${fill})" stroke="${outline}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${shape}</g>
		${sheen ? `<g fill="url(#sheen)" opacity="0.45">${shape}</g>` : ''}
	</g>
</svg>`;

// ── high symbols: painted salvage, four unmistakable outlines ────────────────

// H1 engine block — a stepped mass with four cylinder bores across the top
const H1 = `
	<path d="M52 96 h152 v96 a14 14 0 0 1 -14 14 h-124 a14 14 0 0 1 -14 -14 z"/>
	<rect x="62" y="70" width="30" height="30" rx="6"/>
	<rect x="102" y="70" width="30" height="30" rx="6"/>
	<rect x="142" y="70" width="30" height="30" rx="6"/>
	<rect x="182" y="70" width="22" height="30" rx="6"/>
	<rect x="74" y="206" width="24" height="18" rx="4"/>
	<rect x="158" y="206" width="24" height="18" rx="4"/>`;

// H2 CRT television — a deep box with a rounded screen and two dials
const H2 = `
	<path d="M40 68 h176 a16 16 0 0 1 16 16 v96 a16 16 0 0 1 -16 16 h-176 a16 16 0 0 1 -16 -16 v-96 a16 16 0 0 1 16 -16 z"/>
	<path d="M96 196 h64 l14 32 h-92 z"/>
	<circle cx="206" cy="106" r="12"/>
	<circle cx="206" cy="146" r="12"/>`;

// H3 washing machine — an upright box dominated by one huge round door
const H3 = `
	<path d="M60 34 h136 a16 16 0 0 1 16 16 v156 a16 16 0 0 1 -16 16 h-136 a16 16 0 0 1 -16 -16 v-156 a16 16 0 0 1 16 -16 z"/>
	<circle cx="128" cy="146" r="52"/>
	<rect x="66" y="52" width="60" height="16" rx="8"/>
	<circle cx="188" cy="60" r="11"/>`;

// H4 bumper — one long chrome bar, the only wide-and-thin shape in the set
const H4 = `
	<path d="M20 108 q108 -34 216 0 v34 q-108 -30 -216 0 z"/>
	<rect x="52" y="146" width="26" height="42" rx="8"/>
	<rect x="178" y="146" width="26" height="42" rx="8"/>`;

// ── low symbols: bare steel hardware, four distinct outlines ─────────────────

// L1 hex nut
const L1 = `
	<path d="M128 40 l76 44 v88 l-76 44 l-76 -44 v-88 z"/>
	<circle cx="128" cy="128" r="34" fill="#141518"/>`;

// L2 coil spring — the only shape in the set built from repeated bands
const L2 = `
	<path d="M66 62 h124" stroke-width="26"/>
	<path d="M74 100 h108" stroke-width="26"/>
	<path d="M66 138 h124" stroke-width="26"/>
	<path d="M74 176 h108" stroke-width="26"/>
	<path d="M84 210 h88" stroke-width="26"/>`;

// L3 gear — a toothed disc, the only radial shape among the lows
const L3 = `
	<path d="M128 28 l18 6 12 -14 16 12 -6 18 14 12 -12 16 6 18 -18 6 -6 18 -18 -6 -12 14 -16 -12 6 -18 -14 -12 12 -16 -6 -18 18 -6 6 -18z"
		transform="translate(0,26) scale(1.28) translate(-28,-28)"/>
	<circle cx="128" cy="128" r="30" fill="#141518"/>`;

// L4 tin can — a plain cylinder with a pull ring
const L4 = `
	<path d="M76 62 h104 v132 a10 10 0 0 1 -10 10 h-84 a10 10 0 0 1 -10 -10 z"/>
	<ellipse cx="128" cy="62" rx="52" ry="16"/>
	<circle cx="128" cy="56" r="14" fill="#141518"/>`;

// ── specials: shapes nothing else in the set uses ────────────────────────────

// S the crusher — an open press, two jaws about to close. Deliberately the only
// symbol with a gap through its middle, so it reads at a glance on a busy board.
const S = `
	<path d="M28 30 h200 v46 h-40 v22 h-120 v-22 h-40 z"/>
	<path d="M28 226 h200 v-46 h-40 v-22 h-120 v22 h-40 z"/>
	<rect x="112" y="112" width="32" height="32" rx="6"/>`;

// M nitrogen tank — an upright capsule with a valve, the only rounded-end shape
const M = `
	<path d="M128 54 a52 52 0 0 1 52 52 v72 a52 52 0 0 1 -104 0 v-72 a52 52 0 0 1 52 -52 z"/>
	<rect x="112" y="26" width="32" height="34" rx="8"/>
	<rect x="90" y="14" width="76" height="18" rx="9"/>
	<path d="M96 118 h64" stroke-width="14" stroke="#141518"/>
	<path d="M96 146 h64" stroke-width="14" stroke="#141518"/>`;

const SYMBOLS = [
	['h1', H1, 'pYellow'],
	['h2', H2, 'pTeal'],
	['h3', H3, 'pWhite'],
	['h4', H4, 'pRed'],
	['l1', L1, 'sSteel1'],
	['l2', L2, 'sSteel2'],
	['l3', L3, 'sSteel3'],
	['l4', L4, 'sSteel4'],
	['s', S, 'pOrange'],
	['m', M, 'pCyan'],
];

for (const [name, shape, fill] of SYMBOLS) {
	const svg = symbol(shape, fill);
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng();
	fs.writeFileSync(path.join(OUT, `${name}.png`), png);
	console.log(`  ${name}.png`);
}

// A stale w.png would keep passing check_assets while being referenced by
// nothing — the exact kind of orphan the standing asset scan is meant to catch.
const stale = path.join(OUT, 'w.png');
if (fs.existsSync(stale)) {
	fs.unlinkSync(stale);
	console.log('  removed w.png (this game has no wild)');
}

console.log(`\nwrote ${SYMBOLS.length} placeholder symbols to ${OUT}`);
