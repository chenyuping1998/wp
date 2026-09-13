// Bet-bar plate art for Go Bananas Frostline: the balance/win/bet tickers and
// the Buy Bonus button.
//
// Re-cut from Go Bananas 100's olive-canvas-and-brass set into the arctic
// palette. The colours are `src/game/palette.ts` written as hex — that file is
// the source of truth and this is its rendered form, so if the two disagree the
// palette wins.
//
// Three things this set does that the inherited one did not:
//
//   1. Both plates are COLD. The bar's colours were re-themed in uiTheme.ts in
//      the same pass, and a slate-and-ice bar behind brass-and-olive plate art
//      reads as two bars stacked.
//
//   2. The Buy Bonus gets its own object, the way every other game in the family
//      does — Go Bananubis carves the sealed tablet's eye into basalt, Go
//      Bananas Boat uses a cargo container, Go Bananaut an airlock hatch. Here it
//      is a frost crystal cut into a steel hatch: the button is the one control
//      the player presses deliberately before spending 200x, so it earns being a
//      thing rather than a rounded rectangle with words on it.
//
//   3. That crystal ships TWICE — cut, and lit. The lit copy is drawn over the
//      plate with blendMode 'add' on hover, so it reads as the steel catching
//      light rather than as a decal. Its bloom is BAKED INTO the texture rather
//      than applied as a runtime filter: an additive child inside a filtered or
//      masked container composites into an isolated target that starts
//      transparent, so it would be adding to nothing and arrive as a faint film.
// Usage: node design/generate_ui_plates.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_ui_plates.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

import { surfaceDefs, finishRect, CANVAS_FINISH, BRASS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');
fs.mkdirSync(OUT, { recursive: true });

const render = (svg, name, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, name), resvg.render().asPng());
	console.log('rendered', name);
};

// shared palette — slate plate and ice trim, matching src/game/palette.ts
// (ICE_PLATE 0x1d2633, ICE_PLATE_DEEP 0x141c27, ICE_EDGE 0x5fa8d8,
//  ICE_BRIGHT 0x8fd9ff, ICE_HIGHLIGHT 0xd8f0ff)
const DEFS = surfaceDefs('sf') + `
	<linearGradient id="canvas" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#28323f"/>
		<stop offset="0.55" stop-color="#1a2330"/>
		<stop offset="1" stop-color="#111924"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#cfeaff"/>
		<stop offset="0.45" stop-color="#5fa8d8"/>
		<stop offset="1" stop-color="#1d4e73"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#e8f6ff"/>
		<stop offset="0.7" stop-color="#6ba9cd"/>
		<stop offset="1" stop-color="#1b3f59"/>
	</radialGradient>
	<linearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#000000" stop-opacity="0.45"/>
		<stop offset="0.5" stop-color="#000000" stop-opacity="0.12"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.4"/>
	</linearGradient>
	<filter id="grain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="23" result="t"/>
		<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.06 0.06 0.06 0 0"/>
	</filter>`;

// ── ticker plate: 652×146 (the UI draws it at 326:73) ───────────────────────
const TW = 652;
const TH = 146;
const tickerRivets = [
	[26, 26],
	[TW - 26, 26],
	[26, TH - 26],
	[TW - 26, TH - 26],
]
	.map(
		([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="url(#rivet)" stroke="#10202e" stroke-width="1.8"/>
	<circle cx="${x - 2}" cy="${y - 2}" r="2.2" fill="#e8f6ff" opacity="0.85"/>`,
	)
	.join('');

const ticker = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">
<defs>${DEFS}</defs>
<rect x="6" y="6" width="${TW - 12}" height="${TH - 12}" rx="30" fill="url(#canvas)" stroke="#0a1420" stroke-width="5"/>
${finishRect(6, 6, TW - 12, TH - 12, 30, 'sf', CANVAS_FINISH)}
<!-- recessed reading well so the digits sit in shadow -->
<rect x="20" y="20" width="${TW - 40}" height="${TH - 40}" rx="22" fill="url(#inner)"/>
<!-- brass frame + hairline highlight -->
<rect x="13" y="13" width="${TW - 26}" height="${TH - 26}" rx="25" fill="none" stroke="url(#brass)" stroke-width="7"/>
<rect x="21" y="21" width="${TW - 42}" height="${TH - 42}" rx="19" fill="none" stroke="#8fd9ff" stroke-width="1.6" opacity="0.5"/>
${tickerRivets}
</svg>`;

// ── buy-bonus plate: square, hotter brass so the CTA pops out of the bar ────
const BS = 640;
const buyRivets = [
	[36, 36],
	[BS - 36, 36],
	[36, BS - 36],
	[BS - 36, BS - 36],
]
	.map(
		([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#rivet)" stroke="#10202e" stroke-width="2"/>
	<circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#e8f6ff" opacity="0.85"/>`,
	)
	.join('');

const buyBonus = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<linearGradient id="cta" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#33465c"/>
		<stop offset="0.5" stop-color="#22303f"/>
		<stop offset="1" stop-color="#151f2b"/>
	</linearGradient>
	<radialGradient id="ctaGlow" cx="0.5" cy="0.32" r="0.75">
		<stop offset="0" stop-color="#8fd9ff" stop-opacity="0.3"/>
		<stop offset="1" stop-color="#8fd9ff" stop-opacity="0"/>
	</radialGradient>
</defs>
<rect x="10" y="10" width="${BS - 20}" height="${BS - 20}" rx="66" fill="url(#cta)" stroke="#0a1420" stroke-width="7"/>
${finishRect(10, 10, BS - 20, BS - 20, 66, 'sf', CANVAS_FINISH)}
<!-- cold top-light so the button reads as raised, not a flat tile -->
<rect x="10" y="10" width="${BS - 20}" height="${BS - 20}" rx="66" fill="url(#ctaGlow)"/>
<rect x="20" y="20" width="${BS - 40}" height="${BS - 40}" rx="56" fill="none" stroke="url(#brass)" stroke-width="11"/>
<rect x="31" y="31" width="${BS - 62}" height="${BS - 62}" rx="47" fill="none" stroke="#8fd9ff" stroke-width="2.2" opacity="0.55"/>
${buyRivets}
</svg>`;

// ── the frost crystal, CUT into the plate ──────────────────────────────────
//
// Six arms at 60 degrees, each with two pairs of barbs - the standard dendrite,
// drawn as geometry rather than sampled off a symbol. Go Bananubis reads its eye
// out of the shipped h2 art so that button and the board share an object; there
// is no equivalent here yet, because the Frostline symbol set is not drawn. When
// it is, and if one of its symbols carries a crystal, this should be re-cut from
// that art for the same reason.
//
// Sits in the TOP THIRD and stops above where the caption begins. The shared
// button centres its two-line label and cannot move it, so the only way both fit
// on a 120px plate is for the crystal to end before the words start - which is
// also why uiTheme.ts shrinks buyBonusLabelSizeRatio to 0.46. At that ratio the
// two lines run roughly y=224..416 in this 640 canvas, so the crystal is sized
// to END at 218: centred at 142 with a radius of 76. Its top at 66 clears the
// inner bevel (which sits at 31 plus an 11px stroke). Those are the two
// constraints — bevel above, caption below — and they leave a 152px band.
const CRYSTAL_CY = 142;
const CRYSTAL_R = 76;

const crystalPath = () => {
	const seg = [];
	for (let i = 0; i < 6; i++) {
		const a = (Math.PI / 3) * i - Math.PI / 2;
		const dx = Math.cos(a);
		const dy = Math.sin(a);
		seg.push(
			`M ${BS / 2} ${CRYSTAL_CY} L ${(BS / 2 + dx * CRYSTAL_R).toFixed(1)} ${(CRYSTAL_CY + dy * CRYSTAL_R).toFixed(1)}`,
		);
		// two barb pairs per arm, at 55% and 78% out, swept back at 45 degrees
		for (const [at, len] of [
			[0.55, 0.3],
			[0.78, 0.2],
		]) {
			const bx = BS / 2 + dx * CRYSTAL_R * at;
			const by = CRYSTAL_CY + dy * CRYSTAL_R * at;
			for (const sweep of [-1, 1]) {
				const ba = a + sweep * (Math.PI / 4);
				seg.push(
					`M ${bx.toFixed(1)} ${by.toFixed(1)} L ${(bx + Math.cos(ba) * CRYSTAL_R * len).toFixed(1)} ${(by + Math.sin(ba) * CRYSTAL_R * len).toFixed(1)}`,
				);
			}
		}
	}
	return seg.join(' ');
};
const CRYSTAL = crystalPath();

// A cut is a dark groove with a LIT LOWER EDGE under it. A groove without the
// lit edge is a stain, and that is the whole difference between carved and
// printed - the same trick Go Bananubis uses on its eye.
const crystalCut = `
<path d="${CRYSTAL}" fill="none" stroke="#9ecbe6" stroke-opacity="0.4" stroke-width="13" stroke-linecap="round" transform="translate(0,6)"/>
<path d="${CRYSTAL}" fill="none" stroke="#0a1420" stroke-opacity="0.55" stroke-width="13" stroke-linecap="round"/>
<circle cx="${BS / 2}" cy="${CRYSTAL_CY + 6}" r="15" fill="#9ecbe6" fill-opacity="0.4"/>
<circle cx="${BS / 2}" cy="${CRYSTAL_CY}" r="15" fill="#0a1420" fill-opacity="0.55"/>`;

const buyBonusIce = buyBonus.replace(buyRivets, `${crystalCut}\n${buyRivets}`);

// ── the same crystal, LIT - drawn for ADDITIVE blending ────────────────────
//
// Transparent everywhere else. Ice blue rather than near-white: this sits on a
// DARK plate, so unlike Go Bananubis' pale granite there is room to go bright
// without the glyph reading as a hole punched in the button.
const buyBonusIceLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#8fd9ff" stop-opacity="0.4"/>
		<stop offset="0.4" stop-color="#5fa8d8" stop-opacity="0.17"/>
		<stop offset="1" stop-color="#1e6fa8" stop-opacity="0"/>
	</radialGradient>
	<filter id="litSoft" x="-70%" y="-70%" width="240%" height="240%">
		<feGaussianBlur stdDeviation="11"/>
	</filter>
	<filter id="litCore" x="-30%" y="-30%" width="160%" height="160%">
		<feGaussianBlur stdDeviation="2"/>
	</filter>
</defs>
<ellipse cx="${BS / 2}" cy="${CRYSTAL_CY}" rx="${BS * 0.42}" ry="${BS * 0.3}" fill="url(#bloom)"/>
<g filter="url(#litSoft)">
	<path d="${CRYSTAL}" fill="none" stroke="#5fa8d8" stroke-width="15" stroke-linecap="round"/>
	<circle cx="${BS / 2}" cy="${CRYSTAL_CY}" r="17" fill="#5fa8d8"/>
</g>
<g filter="url(#litCore)">
	<path d="${CRYSTAL}" fill="none" stroke="#d8f0ff" stroke-opacity="0.88" stroke-width="7" stroke-linecap="round"/>
	<circle cx="${BS / 2}" cy="${CRYSTAL_CY}" r="10" fill="#d8f0ff" fill-opacity="0.88"/>
</g>
</svg>`;

render(ticker, 'ticker_plate.png', TW);
render(buyBonus, 'buybonus_plate.png', BS);
render(buyBonusIce, 'buybonus_ice.png', BS);
render(buyBonusIceLit, 'buybonus_ice_lit.png', BS);
console.log('ui plates written to', OUT);
