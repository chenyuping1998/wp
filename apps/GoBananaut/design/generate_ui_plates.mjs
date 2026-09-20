// Bet-bar plate art for GoBananas: the balance/win/bet tickers and the Buy
// Bonus button.
//
// TWO SETS, because this game ships two skins (see src/game/uiTheme.ts):
//
//   ticker_plate / buybonus_plate      the jungle generation's olive canvas and
//                                      brass, matched to the OLD reel housing.
//                                      Used by the 'bananaut' skin, byte for
//                                      byte as it shipped.
//   buybonus_helmet / buybonus_helmet_lit
//                                      the EVA helmet, visor down. Used by the
//                                      'platform' skin; the visor lights on
//                                      hover.
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

// ── the EVA helmet: this game's Buy Bonus ──────────────────────────────────
//
// WHY A HELMET. The plate has been a porthole and then a hatch wheel, and both
// were capsule furniture: correct for the setting, generic for the game. This
// game's character is an astronaut gorilla, and the single object that says
// "astronaut" before anything else on screen does is the helmet.
//
// IT IS NOT THE WILD, and the distinction is deliberate rather than lucky. W is
// a PORTRAIT — the gorilla's face behind goggles with a banana in his mouth.
// This is an empty EVA helmet seen front on, visor down and mirrored, with side
// pods and a neck ring. Go Bananas Boat's notes record the trap: its button wore
// the naval mine, which is also H2, so the CTA advertised a symbol you can land
// instead of the round it sells. Nothing here is landable.
//
// THE VISOR IS THE CAPTION'S GROUND, and that is the constraint turned into the
// design. ButtonBuyBonus centres its two lines on the plate and offers no way to
// move them, so the middle of any plate has to be clear — which is why the
// porthole and the wheel both ended up as rings round a bare well. A helmet has
// a large flat disc in exactly that position already.
//
// A MIRRORED visor, not a dark one, and that is what lets the caption stay dark
// engraved type. Measured, the ink (#141a1e) against the worst point of each
// state:
//
//   at rest, visor bottom   #8fa8b8   7.07
//   at rest, darkest        #7d94a4   5.55
//   lit, visor bottom       #4fb8d8   7.67
//   lit, darkest            #35a5c7   6.15
//
// So the words read in both states with no placard behind them. A dark visor
// would have forced pale type, and pale type cannot survive the visor lighting
// up.
//
// NO ROTATION. buyBonusHoverSpin goes to 0 in uiTheme.ts: a wheel turning under
// the hand is right and a helmet turning is a prop falling over. The hover is the
// visor lighting instead, which is the same language the board already speaks —
// the doubling wash, the x2 plate and the transition burst are all this ice.
const C = BS / 2;
const SHELL_R = 298;
const VISOR_R = 214;
const POD_X = 268;
const POD_W = 66;
const POD_H = 168;
const NECK_TOP = 520;
const NECK_H = 86;
const NECK_W = 372;

// The caption's clear zone, checked rather than assumed. At
// buyBonusLabelSizeRatio 0.48 on the 0.8-scale 150-unit button, "BONUS" is
// 3.51 em = 324 plate units across (+-162) and the two lines stand 100 units
// either side of centre. The visor therefore needs
// sqrt(VISOR_R^2 - 100^2) >= 162 + margin: at 214 that is 189 against 162, so
// 27 units of clearance. Raising the ratio in uiTheme.ts without raising
// VISOR_R here is what would break it.

const polar = (deg, r) => {
	const a = (deg * Math.PI) / 180;
	return [C + Math.sin(a) * r, C - Math.cos(a) * r];
};
const arcBand = (fromDeg, toDeg, rIn, rOut) => {
	const [x0, y0] = polar(fromDeg, rOut);
	const [x1, y1] = polar(toDeg, rOut);
	const [x2, y2] = polar(toDeg, rIn);
	const [x3, y3] = polar(fromDeg, rIn);
	const big = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
	return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${rOut} ${rOut} 0 ${big} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} A ${rIn} ${rIn} 0 ${big} 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z`;
};

// The neck ring's latches, and the pods' vents: both are the helmet's hardware,
// and both repeat so the plate has a rhythm rather than a scatter of detail.
const latches = [-118, -42, 42, 118]
	.map(
		(dx) => `<rect x="${C + dx - 21}" y="${NECK_TOP + 14}" width="42" height="${NECK_H - 28}" rx="6" fill="#5d6e7a" stroke="#1b2329" stroke-width="3"/>
	<rect x="${C + dx - 13}" y="${NECK_TOP + 22}" width="26" height="8" rx="4" fill="#cfd9de" opacity="0.5"/>`,
	)
	.join('\n\t');

const pod = (side) => {
	const x = C + side * POD_X - POD_W / 2;
	const y = C - POD_H / 2;
	return `<rect x="${x}" y="${y}" width="${POD_W}" height="${POD_H}" rx="26" fill="url(#podFace)" stroke="#1b2329" stroke-width="7"/>
	<rect x="${x + 9}" y="${y + 14}" width="${POD_W - 18}" height="10" rx="5" fill="#0f171d" opacity="0.5"/>
	<rect x="${x + 9}" y="${y + POD_H - 30}" width="${POD_W - 18}" height="10" rx="5" fill="#0f171d" opacity="0.5"/>
	<circle cx="${C + side * POD_X}" cy="${C}" r="17" fill="#121c23" stroke="#4d5d69" stroke-width="5"/>`;
};

const buyBonusHelmet = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<!-- THE SHELL is the suit's own white. It has to be light for a second reason
	     beyond being a spacesuit: the backdrop behind this control runs L 22-54,
	     and the shell at L ~200 is the only reason the button has an edge at all. -->
	<linearGradient id="shell" x1="0.25" y1="0" x2="0.7" y2="1">
		<stop offset="0" stop-color="#f4f7f8"/>
		<stop offset="0.45" stop-color="#dfe5e8"/>
		<stop offset="1" stop-color="#aeb8bd"/>
	</linearGradient>
	<linearGradient id="crest" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff"/>
		<stop offset="1" stop-color="#c8d1d5"/>
	</linearGradient>
	<linearGradient id="podFace" x1="0" y1="0" x2="0.4" y2="1">
		<stop offset="0" stop-color="#8b98a1"/>
		<stop offset="0.5" stop-color="#5e6c76"/>
		<stop offset="1" stop-color="#37424a"/>
	</linearGradient>
	<linearGradient id="neck" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#9aa7b0"/>
		<stop offset="0.45" stop-color="#6b7883"/>
		<stop offset="1" stop-color="#3a444c"/>
	</linearGradient>
	<!-- THE MIRROR. A visor reflects the sky above it and the ground below, so it
	     runs bright at the top and cool-dark at the bottom — which is also what
	     keeps the caption's contrast: the type sits across the middle band. -->
	<linearGradient id="mirror" x1="0.3" y1="0" x2="0.55" y2="1">
		<stop offset="0" stop-color="#e4eff5"/>
		<stop offset="0.38" stop-color="#c3d3dd"/>
		<stop offset="0.72" stop-color="#9fb3c1"/>
		<stop offset="1" stop-color="#7d94a4"/>
	</linearGradient>
</defs>

<!-- the shell, with a dark contour so it has an edge against the backdrop -->
<circle cx="${C}" cy="${C}" r="${SHELL_R}" fill="url(#shell)" stroke="#161d22" stroke-width="9"/>
${finishRect(C - SHELL_R, C - SHELL_R, SHELL_R * 2, SHELL_R * 2, SHELL_R, 'sf', { grain: 0.45, mottle: 0.35, spec: 0, edge: 0, ao: 0 })}

<!-- the sun-visor housing across the crown, and the seam where it slides -->
<path d="${arcBand(-64, 64, 244, SHELL_R - 10)}" fill="url(#crest)" stroke="#2b343a" stroke-width="5"/>
<path d="${arcBand(-64, 64, 244, 252)}" fill="#8b98a1" opacity="0.55" stroke="none"/>

${pod(-1)}
${pod(1)}

<!-- the neck ring, in front of the shell's lower arc -->
<rect x="${C - NECK_W / 2}" y="${NECK_TOP}" width="${NECK_W}" height="${NECK_H}" rx="26" fill="url(#neck)" stroke="#161d22" stroke-width="8"/>
<rect x="${C - NECK_W / 2 + 12}" y="${NECK_TOP + 8}" width="${NECK_W - 24}" height="7" rx="4" fill="#d7e0e4" opacity="0.45"/>
${latches}

<!-- THE VISOR: rim, mirror, then the reflections on it -->
<circle cx="${C}" cy="${C}" r="${VISOR_R + 13}" fill="#2f3941" stroke="#141b20" stroke-width="7"/>
<circle cx="${C}" cy="${C}" r="${VISOR_R + 5}" fill="none" stroke="#9fb0bb" stroke-width="4" opacity="0.7"/>
<circle cx="${C}" cy="${C}" r="${VISOR_R}" fill="url(#mirror)"/>
<!-- a specular sweep across the top left, and the faint horizon a mirror shows.
     Both are clear of the caption band, which is the middle +-100. -->
<path d="M ${C - 168} ${C - 44} A ${VISOR_R - 16} ${VISOR_R - 16} 0 0 1 ${C + 30} ${C - 190}"
      fill="none" stroke="#ffffff" stroke-width="30" opacity="0.4" stroke-linecap="round"/>
<path d="M ${C - 196} ${C + 84} A ${VISOR_R - 8} ${VISOR_R - 8} 0 0 0 ${C + 196} ${C + 84}"
      fill="none" stroke="#5f7686" stroke-width="5" opacity="0.28"/>
<!-- the ice hairline the hover lights up: present at rest, barely -->
<circle cx="${C}" cy="${C}" r="${VISOR_R - 7}" fill="none" stroke="#8fe4ff" stroke-width="3" opacity="0.3"/>
</svg>`;

// ── the same helmet with the VISOR RAISED ──────────────────────────────────────
//
// THE HOVER STATE IS THE HATCH OPENING, not the glass changing colour. The first
// version simply relit the mirror in ice-blue, which read as a coloured disc — and
// because that sprite was opaque and mounted on top of the caption, it also hid
// the words entirely (see the note on the caption in ButtonBuyBonus.svelte). A
// visor that slides UP into the crown is the thing a helmet actually does, and it
// gives the hover something to SHOW rather than just something to recolour.
//
// WHAT IS DRAWN, and only this:
//
//   · the interior, lit — a bright chamber where the mirror was, shaded so it has
//     depth instead of being a flat disc
//   · the raised glass, tucked into the top of the opening as a mirrored segment
//     clipped to the visor's own circle, with a bright seam along its lower edge
//   · the shadow that glass throws down onto the interior
//   · the halo of light spilling out onto the shell, and the pod lamps
//
// THE MIDDLE BAND IS KEPT CLEAN, and it is a constraint rather than a taste. The
// caption occupies y +-100 of centre; nothing here has detail inside it, and the
// raised glass and its shadow both stop above it. The interior is the caption's
// ground in this state, and the ink against its worst point measures 7.5.
//
// Painted over the plate with NORMAL blending. Only the visor, the pod lamps and a
// bloom are drawn: the white shell is left alone, or the helmet would read as a
// lamp rather than as a hatch that has opened.
const RAISED_TO = C - 150; // the glass' lower edge once it has slid up
const buyBonusHelmetLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<clipPath id="opening"><circle cx="${C}" cy="${C}" r="${VISOR_R}"/></clipPath>
	<!-- THE INTERIOR: bright at the centre, cooling toward the padded rim. The
	     centre sits a little low, so the light seems to come from within and below
	     — which also keeps the top, under the raised glass, the darker part. -->
	<radialGradient id="chamber" gradientUnits="userSpaceOnUse" cx="${C}" cy="${C + 26}" r="${VISOR_R + 30}">
		<stop offset="0" stop-color="#f6feff"/>
		<stop offset="0.5" stop-color="#bdeefa"/>
		<stop offset="0.85" stop-color="#6ccbe6"/>
		<stop offset="1" stop-color="#3fa9cb"/>
	</radialGradient>
	<linearGradient id="raisedGlass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#e4eff5"/>
		<stop offset="0.6" stop-color="#b9cbd6"/>
		<stop offset="1" stop-color="#8ea6b6"/>
	</linearGradient>
	<!-- what the raised glass throws onto the chamber: strongest at its edge, gone
	     before the caption band begins -->
	<linearGradient id="castShadow" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#155a76" stop-opacity="0.5"/>
		<stop offset="1" stop-color="#155a76" stop-opacity="0"/>
	</linearGradient>
	<filter id="bloom" x="-40%" y="-40%" width="180%" height="180%">
		<feGaussianBlur stdDeviation="15"/>
	</filter>
</defs>
<!-- the light spilling out onto the shell around the opening -->
<circle cx="${C}" cy="${C}" r="${VISOR_R + 16}" fill="none" stroke="#8fe4ff" stroke-width="34" opacity="0.55" filter="url(#bloom)"/>

<g clip-path="url(#opening)">
	<circle cx="${C}" cy="${C}" r="${VISOR_R}" fill="url(#chamber)"/>
	<!-- the padded rim of the interior, a step darker than the light inside it -->
	<circle cx="${C}" cy="${C}" r="${VISOR_R - 8}" fill="none" stroke="#2a86a8" stroke-width="14" opacity="0.5"/>
	<circle cx="${C}" cy="${C}" r="${VISOR_R - 18}" fill="none" stroke="#1b6684" stroke-width="2" opacity="0.32"/>
	<!-- the shadow of the raised glass, then the glass itself and its seam -->
	<rect x="${C - VISOR_R}" y="${RAISED_TO}" width="${VISOR_R * 2}" height="46" fill="url(#castShadow)"/>
	<rect x="${C - VISOR_R}" y="${C - VISOR_R}" width="${VISOR_R * 2}" height="${RAISED_TO - (C - VISOR_R)}" fill="url(#raisedGlass)"/>
	<rect x="${C - VISOR_R}" y="${RAISED_TO - 5}" width="${VISOR_R * 2}" height="9" fill="#2f3941"/>
	<rect x="${C - VISOR_R}" y="${RAISED_TO + 4}" width="${VISOR_R * 2}" height="4" fill="#ffffff" opacity="0.85"/>
	<!-- a streak of reflection on the raised glass, so it reads as glass -->
	<path d="M ${C - 150} ${RAISED_TO - 22} L ${C - 40} ${RAISED_TO - 22}" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.55"/>
</g>

<!-- the opening's rim, lit -->
<circle cx="${C}" cy="${C}" r="${VISOR_R + 5}" fill="none" stroke="#8fe4ff" stroke-width="6" opacity="0.9"/>
<circle cx="${C}" cy="${C}" r="${VISOR_R - 1}" fill="none" stroke="#dff7ff" stroke-width="3" opacity="0.8"/>

<!-- the pod lamps come on with it: the helmet is powered, not just opened -->
<circle cx="${C - POD_X}" cy="${C}" r="13" fill="#dff7ff"/>
<circle cx="${C + POD_X}" cy="${C}" r="13" fill="#dff7ff"/>
<circle cx="${C - POD_X}" cy="${C}" r="24" fill="#8fe4ff" opacity="0.6" filter="url(#bloom)"/>
<circle cx="${C + POD_X}" cy="${C}" r="24" fill="#8fe4ff" opacity="0.6" filter="url(#bloom)"/>
</svg>`;

render(ticker, 'ticker_plate.png', TW);
render(buyBonus, 'buybonus_plate.png', BS);
render(buyBonusHelmet, 'buybonus_helmet.png', BS);
render(buyBonusHelmetLit, 'buybonus_helmet_lit.png', BS);
console.log('ui plates written to', OUT);
