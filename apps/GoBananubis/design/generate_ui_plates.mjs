// Bet-bar plate art: the balance/win/bet tickers and the Buy Bonus button.
//
// TWO SETS, because this game ships two skins (see src/game/uiTheme.ts):
//
//   ticker_plate / buybonus_plate      olive drill canvas + brass trim + rivets,
//                                      matched to the old reel housing. Used by
//                                      the 'bananubis' skin.
//   buybonus_stone / buybonus_stone_lit
//                                      the platform skin's Buy Bonus: the same
//                                      dark basalt plate every SYMBOL stands on,
//                                      empty, with the sealed tablet's eye carved
//                                      into it — and a second, additive copy of
//                                      that eye lit, for the hover state.
//
// The stone plate's colours are SAMPLED off the shipped symbol art rather than
// invented, so the button and the board are the same rock: h1.png gives the outer
// edge #3d4043, the face #3d4144 falling to #383b3d, and the corner studs
// #624c39 with a #7e6751 highlight.
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
const { PNG } = require('pngjs');

import { surfaceDefs, finishRect, CANVAS_FINISH, BRASS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');
// the shipped symbol art, which this reads the plate's colours and the eye's
// shape out of rather than restating either
const SYMBOLS = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
fs.mkdirSync(OUT, { recursive: true });

const render = (svg, name, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, name), resvg.render().asPng());
	console.log('rendered', name);
};

// shared palette — same brass and canvas as the reel frame / free-spin plaques
const DEFS = surfaceDefs('sf') + `
	<linearGradient id="canvas" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#2c3812"/>
		<stop offset="0.55" stop-color="#1c2609"/>
		<stop offset="1" stop-color="#131c06"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe282"/>
		<stop offset="0.45" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.7" stop-color="#c08a20"/>
		<stop offset="1" stop-color="#6d4a08"/>
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
		([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="url(#rivet)" stroke="#3a2c08" stroke-width="1.8"/>
	<circle cx="${x - 2}" cy="${y - 2}" r="2.2" fill="#fff3bd" opacity="0.85"/>`,
	)
	.join('');

const ticker = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">
<defs>${DEFS}</defs>
<rect x="6" y="6" width="${TW - 12}" height="${TH - 12}" rx="30" fill="url(#canvas)" stroke="#0c1206" stroke-width="5"/>
${finishRect(6, 6, TW - 12, TH - 12, 30, 'sf', CANVAS_FINISH)}
<!-- recessed reading well so the digits sit in shadow -->
<rect x="20" y="20" width="${TW - 40}" height="${TH - 40}" rx="22" fill="url(#inner)"/>
<!-- brass frame + hairline highlight -->
<rect x="13" y="13" width="${TW - 26}" height="${TH - 26}" rx="25" fill="none" stroke="url(#brass)" stroke-width="7"/>
<rect x="21" y="21" width="${TW - 42}" height="${TH - 42}" rx="19" fill="none" stroke="#ffe98a" stroke-width="1.6" opacity="0.5"/>
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
		([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
	<circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff3bd" opacity="0.85"/>`,
	)
	.join('');

const buyBonus = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<linearGradient id="cta" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#4a5c18"/>
		<stop offset="0.5" stop-color="#33420f"/>
		<stop offset="1" stop-color="#222c08"/>
	</linearGradient>
	<radialGradient id="ctaGlow" cx="0.5" cy="0.32" r="0.75">
		<stop offset="0" stop-color="#ffd75e" stop-opacity="0.35"/>
		<stop offset="1" stop-color="#ffd75e" stop-opacity="0"/>
	</radialGradient>
</defs>
<rect x="10" y="10" width="${BS - 20}" height="${BS - 20}" rx="66" fill="url(#cta)" stroke="#0c1206" stroke-width="7"/>
${finishRect(10, 10, BS - 20, BS - 20, 66, 'sf', CANVAS_FINISH)}
<!-- warm top-light so the button reads as raised, not a flat tile -->
<rect x="10" y="10" width="${BS - 20}" height="${BS - 20}" rx="66" fill="url(#ctaGlow)"/>
<rect x="20" y="20" width="${BS - 40}" height="${BS - 40}" rx="56" fill="none" stroke="url(#brass)" stroke-width="11"/>
<rect x="31" y="31" width="${BS - 62}" height="${BS - 62}" rx="47" fill="none" stroke="#ffe98a" stroke-width="2.2" opacity="0.55"/>
${buyRivets}
</svg>`;

// ── the platform skin's Buy Bonus ──────────────────────────────────────────
//
// The LOW symbols' plate, empty, with h2's Eye of Horus cut into it.
//
// Both halves of that are taken from the shipped symbol art rather than styled
// to match it. The plate's colours are sampled off l1.png — dark basalt frame
// #353d3d over a light granite inner panel #808e95 falling to #7a8386, with the
// steel corner studs the low tier uses and NO gilt bevel, which is the cue that
// separates the low plates from the high ones. The eye is h2's own wedjat,
// lifted as a silhouette; drawing one by hand would be a second, slightly
// different eye in a game that already has one.
//
// WHY A SILHOUETTE AND NOT THE SYMBOL ITSELF: h2 is a lapis amulet painted on a
// dark plate. Dropped onto a light granite face it would be a blue sticker. What
// is wanted is the same SHAPE cut into this stone, so only the outline travels.
const eyeSilhouette = () => {
	const src = PNG.sync.read(fs.readFileSync(path.join(SYMBOLS, 'h2.png')));
	const { width: W, height: H, data } = src;
	// blue dominance: the amulet is lapis on neutral basalt, so one channel
	// difference separates them with nothing to tune. Measured on h2.png, the
	// eye covers 9.9% of the tile at this threshold and nothing else passes.
	const mask = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) {
		const r = data[i * 4];
		const b = data[i * 4 + 2];
		if (b - r > 45) mask[i] = 1;
	}
	// The PUPIL IS LEFT OUT on purpose. It is dark, not blue, so it fails the
	// test and stays a hole in the mask — which is exactly right for a relief,
	// where the pupil is a deeper cut rather than part of the same face.
	let x0 = W, y0 = H, x1 = 0, y1 = 0;
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++)
			if (mask[y * W + x]) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
	const w = x1 - x0 + 1;
	const h = y1 - y0 + 1;
	const out = new PNG({ width: w, height: h });
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const i = ((y + y0) * W + (x + x0)) * 4;
			const o = (y * w + x) * 4;
			out.data[o] = out.data[o + 1] = out.data[o + 2] = 255;
			out.data[o + 3] = mask[(y + y0) * W + (x + x0)] ? 255 : 0;
		}
	return {
		href: `data:image/png;base64,${PNG.sync.write(out).toString('base64')}`,
		aspect: h / w,
	};
};

const EYE = eyeSilhouette();
const EYE_W = 190;
const EYE_H = Math.round(EYE_W * EYE.aspect);
const EYE_X = BS / 2 - EYE_W / 2;
// Top third, finishing above where the label's block begins. The shared button
// centres its caption and cannot move it, so the only way the two share a 120px
// plate is for the eye to end before the words start: at buyBonusLabelSizeRatio
// 0.46 those two lines run 224 to 416 in this 640 canvas.
const EYE_Y = 66;

const eyeImage = (filter, dy = 0) =>
	`<image href="${EYE.href}" x="${EYE_X}" y="${EYE_Y + dy}" width="${EYE_W}" height="${EYE_H}" filter="url(#${filter})"/>`;

const buyBonusStone = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<linearGradient id="frame" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#454b4f"/>
		<stop offset="1" stop-color="#2a3033"/>
	</linearGradient>
	<linearGradient id="granite" x1="0" y1="0" x2="0.2" y2="1">
		<stop offset="0" stop-color="#8d9aa1"/>
		<stop offset="0.5" stop-color="#808e95"/>
		<stop offset="1" stop-color="#6f7a7e"/>
	</linearGradient>
	<linearGradient id="steel" x1="0" y1="0" x2="0.4" y2="1">
		<stop offset="0" stop-color="#8b9396"/>
		<stop offset="0.55" stop-color="#5c6467"/>
		<stop offset="1" stop-color="#343b3e"/>
	</linearGradient>
	<!-- solid black at a fraction of the silhouette's alpha: the cut -->
	<filter id="cut" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.34 0"/>
	</filter>
	<!-- the same shape in pale stone, dropped a few pixels: the lit lower edge.
	     A shadow on its own is a stain; a shadow with a lit edge under it is a
	     groove, and that is the whole difference between carved and printed. -->
	<filter id="lip" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0.76  0 0 0 0 0.81  0 0 0 0 0.84  0 0 0 0.55 0"/>
	</filter>
</defs>
<rect x="8" y="8" width="${BS - 16}" height="${BS - 16}" rx="26" fill="url(#frame)" stroke="#1b1e21" stroke-width="9"/>
${finishRect(8, 8, BS - 16, BS - 16, 26, 'sf', CANVAS_FINISH)}
<!-- the recessed granite panel. No gilt bevel: that is the LOW tier's plate, and
     the absence of gold is the cue that tells the two tiers apart on the board. -->
<rect x="46" y="46" width="${BS - 92}" height="${BS - 92}" rx="16" fill="url(#granite)" stroke="#232a2d" stroke-width="6"/>
${finishRect(46, 46, BS - 92, BS - 92, 16, 'sf', CANVAS_FINISH)}
<rect x="55" y="55" width="${BS - 110}" height="${BS - 110}" rx="12" fill="none" stroke="#000000" stroke-width="2" opacity="0.22"/>

${eyeImage('lip', 7)}
${eyeImage('cut')}

${[[46, 46], [BS - 46, 46], [46, BS - 46], [BS - 46, BS - 46]]
	.map(([x, y]) => `<rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="5" fill="url(#steel)" stroke="#1e2426" stroke-width="4"/>
	<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="3" fill="#a3abae" opacity="0.5"/>`)
	.join('')}
</svg>`;

// ── the same eye, LIT — drawn for ADDITIVE blending ────────────────────────
//
// Transparent everywhere else, so it lays over the plate with blendMode 'add'
// and reads as the stone catching light rather than as a sticker. The bloom is
// baked in rather than filtered at run time: an additive child inside a filtered
// or masked container is composited into an isolated target that starts empty,
// so it would be adding to nothing and arrive as a faint film.
const buyBonusStoneLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffd75e" stop-opacity="0.42"/>
		<stop offset="0.4" stop-color="#ffb62c" stop-opacity="0.18"/>
		<stop offset="1" stop-color="#ff9a10" stop-opacity="0"/>
	</radialGradient>
	<filter id="litSoft" x="-70%" y="-70%" width="240%" height="240%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.72  0 0 0 0 0.12  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="11"/>
	</filter>
	<filter id="litCore" x="-30%" y="-30%" width="160%" height="160%">
		<!-- amber, not near-white: this sits on PALE granite, and anything close
		     to white there reads as a hole in the stone rather than as light -->
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.82  0 0 0 0 0.26  0 0 0 0.85 0"/>
		<feGaussianBlur stdDeviation="2"/>
	</filter>
</defs>
<ellipse cx="${BS / 2}" cy="${EYE_Y + EYE_H / 2}" rx="${BS * 0.42}" ry="${BS * 0.26}" fill="url(#bloom)"/>
${eyeImage('litSoft')}
${eyeImage('litCore')}
</svg>`;

render(ticker, 'ticker_plate.png', TW);
render(buyBonusStone, 'buybonus_stone.png', BS);
render(buyBonusStoneLit, 'buybonus_stone_lit.png', BS);
render(buyBonus, 'buybonus_plate.png', BS);
console.log('ui plates written to', OUT);
