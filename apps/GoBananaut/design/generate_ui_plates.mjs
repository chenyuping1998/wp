// Bet-bar plate art for GoBananas: the balance/win/bet tickers and the Buy
// Bonus button, matched to the reel housing so the whole UI reads as one piece
// of kit.
//
// Three Buy Bonus plates are written:
//
//   buybonus_plate           the jungle generation's olive-and-gold CTA. Kept
//                            so the brass skin can be switched back to without
//                            a rebuild; nothing points at it any more.
//   buybonus_hatch           THIS game's: the reel housing's own gunmetal with
//                            a porthole cut into the top third.
//   buybonus_hatch_lit       the same porthole with the lamp on, drawn for
//                            ADDITIVE blending, for the hover state.
//
// THE HATCH'S METAL WAS SAMPLED OFF THE BOARD. frame_edge.png is 24% warm
// pixels and 44% neutral ones, and those two clusters are the brass and the
// steel the housing is actually made of:
//
//   brass  #251f12  #443a29  #6a5642  #8f8063  #a79676
//   steel  #000100  #313230  #3f403b  #4f5455  #636465
//
// THEN IT WAS LIFTED, because the housing's own value is the wrong value for a
// button that does not sit on the housing. Measured in the region the CTA
// actually occupies — left of the board, vertically centred:
//
//   backdrop            mean L    p90
//   bg_base               22.3    42.9
//   bg_holdandspin        34.2    62.0
//   bg_feature            53.7   113.0
//   the plate, as first drawn   50.8    77.8
//
// On the base backdrop that is a 28-level gap, which sounds like enough and is
// not: the plate's own p10 is 25.5, so its recessed panel and its 9px outer
// stroke were sitting ON the background rather than against it, and an edge that
// matches its surroundings is an edge that is not there. On bg_feature the whole
// plate was within three levels of the backdrop and effectively vanished.
//
// RAISED AGAIN, to match the board's own low symbols. The A/K/Q/J/10 tiles are
// the pale stone the player looks at most, and they measure:
//
//   tile      L p25    p50    p75
//   l1        140.4  175.2  190.2
//   l5        105.2  166.8  185.3
//
// so their FACE sits around 170-190. The plate's body was at a median of 126 and
// read as a darker object than anything on the board.
//
// Two things move it, and the second matters more than the first:
//
//   · the ramps go up
//   · THE FINISH CHANGES FROM CANVAS TO STEEL. CANVAS_FINISH is a cloth preset —
//     ao 0.45, spec 0.22 — and that ambient-occlusion pass was costing about 45
//     levels on its own. STEEL_FINISH is ao 0.35 with spec 0.5 and a brushed
//     pass, which is both the right material for a pressed steel panel and
//     substantially less darkening.
//
// The dark outer stroke stays: on a LIGHT body a dark contour is what makes the
// edge crisp; it was only a problem while the body was dark too.
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

import { surfaceDefs, finishRect, CANVAS_FINISH, BRASS_FINISH, STEEL_FINISH } from './surface.mjs';

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

// ── the hatch: this game's Buy Bonus ────────────────────────────────────────
//
// A PORTHOLE, and the choice is not decoration. The reel housing was rebuilt
// from cut parts of a hatch (see design/build_frame_capsule.py), so a hatch is
// the board's own object — the button is a panel off the same capsule rather
// than a plaque hung next to it. It also gives the hover an obvious physical
// reading: the lamp behind the glass comes on.
//
// GEOMETRY IS CONSTRAINED BY THE LABEL. UiButtonBuyBonus centres its caption and
// cannot move it; at buyBonusLabelSizeRatio 0.46 the two lines run y 224..416 in
// this 640 canvas. So the porthole has to FINISH above 224, which is what puts
// its centre at 140 with a 76 radius — 64..216, with 8px of clearance.
const PORT_CX = BS / 2;
const PORT_CY = 140;
const PORT_R = 76;

// Bolts around the rim at 45 degrees. Four, not eight: at the 120px the button
// is actually drawn, eight merge into a grey ring and the porthole stops reading
// as a made thing.
const portBolts = [45, 135, 225, 315]
	.map((deg) => {
		const a = (deg * Math.PI) / 180;
		const x = PORT_CX + Math.cos(a) * (PORT_R - 9);
		const y = PORT_CY + Math.sin(a) * (PORT_R - 9);
		return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="#2b2f31" stroke="#14171a" stroke-width="1.6"/>
	<circle cx="${(x - 1.6).toFixed(1)}" cy="${(y - 1.6).toFixed(1)}" r="2" fill="#8f979a" opacity="0.7"/>`;
	})
	.join('');

const hatchRivets = [
	[46, 46],
	[BS - 46, 46],
	[46, BS - 46],
	[BS - 46, BS - 46],
]
	.map(
		([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="url(#hatchBrass)" stroke="#1a160d" stroke-width="4"/>
	<circle cx="${x - 5}" cy="${y - 5}" r="5" fill="#c8b894" opacity="0.7"/>`,
	)
	.join('');

const buyBonusHatch = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<linearGradient id="hatchSteel" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="#f4f7f8"/>
		<stop offset="0.45" stop-color="#dde3e6"/>
		<stop offset="1" stop-color="#bac3c8"/>
	</linearGradient>
	<linearGradient id="hatchPanel" x1="0" y1="0" x2="0.2" y2="1">
		<stop offset="0" stop-color="#eaeff1"/>
		<stop offset="0.55" stop-color="#d6dde0"/>
		<stop offset="1" stop-color="#b4bdc2"/>
	</linearGradient>
	<!-- the brass is lifted with it, or the rivets sink into the new steel: at the
	     old values they were within a few levels of it and stopped reading as a
	     different metal at all -->
	<linearGradient id="hatchBrass" x1="0" y1="0" x2="0.3" y2="1">
		<stop offset="0" stop-color="#e8d4a6"/>
		<stop offset="0.4" stop-color="#c9b184"/>
		<stop offset="0.75" stop-color="#9c8259"/>
		<stop offset="1" stop-color="#6a5642"/>
	</linearGradient>
	<!-- the glass. Cool and very dark, so the lit state has somewhere to go: a
	     porthole that is already bright cannot be switched on. -->
	<radialGradient id="hatchGlass" cx="0.38" cy="0.32" r="0.85">
		<stop offset="0" stop-color="#1b2630"/>
		<stop offset="0.6" stop-color="#101821"/>
		<stop offset="1" stop-color="#080c11"/>
	</radialGradient>
</defs>
<rect x="8" y="8" width="${BS - 16}" height="${BS - 16}" rx="26" fill="url(#hatchSteel)" stroke="#14171a" stroke-width="9"/>
${finishRect(8, 8, BS - 16, BS - 16, 26, 'sf', STEEL_FINISH)}

<!-- the recessed panel, with a hairline lit top edge so the plate reads as a
     pressed sheet rather than a flat tile -->
<rect x="40" y="40" width="${BS - 80}" height="${BS - 80}" rx="16" fill="url(#hatchPanel)" stroke="#1c2022" stroke-width="6"/>
${finishRect(40, 40, BS - 80, BS - 80, 16, 'sf', STEEL_FINISH)}
<!-- DARK, not light. This was a pale hairline, which is how you draw a lit edge
     on dark steel and is invisible on pale steel. On a light body the engraved
     line is the shadow. -->
<rect x="49" y="49" width="${BS - 98}" height="${BS - 98}" rx="12" fill="none" stroke="#2b3236" stroke-width="1.8" opacity="0.35"/>

<!-- THE PORTHOLE, outside in: brass ring, dark bevel, glass, then a lit lower
     lip. The lip is the same trick the carved motifs use — a shadow on its own
     is a stain, a shadow with a lit edge under it is a groove. -->
<circle cx="${PORT_CX}" cy="${PORT_CY}" r="${PORT_R}" fill="url(#hatchBrass)" stroke="#14120c" stroke-width="5"/>
<circle cx="${PORT_CX}" cy="${PORT_CY + 3}" r="${PORT_R - 3}" fill="none" stroke="#c8b894" stroke-width="2.4" opacity="0.35"/>
<circle cx="${PORT_CX}" cy="${PORT_CY}" r="${PORT_R - 14}" fill="#101418" stroke="#0a0d10" stroke-width="3"/>
<circle cx="${PORT_CX}" cy="${PORT_CY}" r="${PORT_R - 20}" fill="url(#hatchGlass)"/>
<!-- a single specular streak across the glass: without it the disc is a hole -->
<path d="M ${PORT_CX - 40} ${PORT_CY + 12} A ${PORT_R - 22} ${PORT_R - 22} 0 0 1 ${PORT_CX + 6} ${PORT_CY - 42}"
      fill="none" stroke="#c3cbcf" stroke-width="7" opacity="0.22" stroke-linecap="round"/>
${portBolts}

<!-- NO PLACARD BEHIND THE CAPTION.
     There was one — a recessed dark panel sized to the two lines of type — added
     when the label was white, because white on pale steel has no edges and
     UiButtonBuyBonus draws its caption as a plain Text with no stroke or shadow
     to give it any. The label is dark ink again, so the panel is doing nothing
     except putting a black box on a grey plate. The bare steel IS the contrast. -->

<!-- A GRIP RECESS low on the panel. The label runs y 224..416, so the bottom
     fifth is dead space and an empty field there makes the plate read as
     unfinished. This is a real hatch feature rather than ornament, and it is
     drawn at very low contrast on purpose: at the 120px the button is actually
     drawn it should register as construction, not as a second thing to look at. -->
<rect x="${BS / 2 - 96}" y="524" width="192" height="26" rx="13" fill="#22272a" stroke="#14171a" stroke-width="3"/>
<rect x="${BS / 2 - 90}" y="547" width="180" height="5" rx="3" fill="#e2e8ea" opacity="0.35"/>

${hatchRivets}
</svg>`;

// ── the same porthole, LIT — drawn for ADDITIVE blending ────────────────────
//
// Transparent everywhere else, so it lays over the plate with blendMode 'add'
// and reads as the lamp coming on behind the glass rather than as a sticker
// dropped on top. The bloom is baked into the texture rather than filtered at
// run time: an additive child inside a filtered or masked container composites
// into an isolated target that starts empty, so a filter here would be adding to
// nothing and arrive as a faint film.
//
// ICE CYAN, the value ReelGrow washes a doubling column in. The button buys FREE
// SPINS, and the free game is where the doubling lives — so the light behind the
// glass is the same light the thing it sells is made of. Amber would have tied it
// to the Scatter instead, which is the one route into the feature this button is
// an alternative to.
const buyBonusHatchLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="portBloom" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#8fe4ff" stop-opacity="0.34"/>
		<stop offset="0.45" stop-color="#3aa8d8" stop-opacity="0.14"/>
		<stop offset="1" stop-color="#1c6a90" stop-opacity="0"/>
	</radialGradient>
	<radialGradient id="portCore" cx="0.42" cy="0.36" r="0.7">
		<stop offset="0" stop-color="#ddf6ff" stop-opacity="0.95"/>
		<stop offset="0.45" stop-color="#8fe4ff" stop-opacity="0.6"/>
		<stop offset="1" stop-color="#2ea8d8" stop-opacity="0.18"/>
	</radialGradient>
</defs>
<ellipse cx="${PORT_CX}" cy="${PORT_CY}" rx="${BS * 0.36}" ry="${BS * 0.3}" fill="url(#portBloom)"/>
<circle cx="${PORT_CX}" cy="${PORT_CY}" r="${PORT_R - 20}" fill="url(#portCore)"/>
<!-- the ring catches it too, or the glass looks lit and the metal around it does
     not, which reads as a screen rather than as a window -->
<circle cx="${PORT_CX}" cy="${PORT_CY}" r="${PORT_R - 7}" fill="none" stroke="#8fe4ff" stroke-width="6" opacity="0.3"/>
</svg>`;

render(ticker, 'ticker_plate.png', TW);
render(buyBonus, 'buybonus_plate.png', BS);
render(buyBonusHatch, 'buybonus_hatch.png', BS);
render(buyBonusHatchLit, 'buybonus_hatch_lit.png', BS);
console.log('ui plates written to', OUT);
