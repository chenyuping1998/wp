// Bet-bar plate art: the balance/win/bet tickers and the Buy Bonus button.
//
// TWO SETS, because this game ships two skins (see src/game/uiTheme.ts):
//
//   ticker_plate / buybonus_plate      olive drill canvas + brass trim + rivets,
//                                      matched to the old reel housing. Used by
//                                      the 'boat' skin.
//   buybonus_container / _lit          a shipping-container panel with the naval
//                                      mine stencilled on it. Used by the
//                                      'platform' skin, whose flat grey strip the
//                                      brass plate fights.
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

// The shared UI's type scale, and the button's own box, both fixed in
// components-ui-pixi. Copied rather than imported: this is a node script that
// renders PNGs and has no business pulling in a Svelte package to read two
// numbers. If either ever moves, the placard drifts off the words — which is
// visible immediately in the render, and is why this is written down here.
const UI_BASE_FONT_SIZE = 45;

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

// ---- the platform skin's Buy Bonus ----------------------------------------
//
// A container panel, empty, with the naval mine stencilled on it.
//
// Both halves are taken from the shipped art rather than styled to match it.
// The panel's colours are sampled off l1.png - outer frame #4E585E over a
// corrugated face running #5F6D73 to #3D4349 - and the stencil is painted in
// that tile's own worn cream, #D1CDB9, because the low symbols ARE stencils
// sprayed on container doors and this is the same mark on the same door.
//
// WHY THE SHIP'S WHEEL.
//
// The mark that was here first was the naval mine, and it was the wrong mark
// twice over. It is the TRANSITION PROP — the thing the captain throws at the
// camera between the base game and the free games — and it is also H2, a mid-tier
// paying symbol on the reels. So the button wore a picture of a symbol you can
// land, while the thing it actually sells is the free round.
//
// A wheel is not a symbol and never will be. It is the control you take hold of
// to commit the ship to a course, and pressing Buy Bonus is that: paying to go
// now instead of waiting for three scatters to turn up.
//
// IT WAS AN ENGINE TELEGRAPH FIRST, and the difference is worth writing down
// because it is the whole of why this was redrawn. A telegraph reduces to a
// graduated dial with two small levers on the case. Rendered at the 150px this
// button is actually drawn at, a graduated dial is a CLOCK — and no amount of
// work on the levers fixed that, because the levers are a detail and the clock
// is the shape. A wheel reduces to something no other object shares: a rim with
// HANDSPIKES RADIATING OUT OF IT. That reads at any size, and it reads in
// silhouette, which is what a mark on a button has to do.
//
// DRAWN HERE AS PATHS, NOT CUT OUT OF ARTWORK. The old note in this file argued
// against hand-drawing the mark, and it was right: hand-drawing a mine would have
// put a second, slightly different mine in a game that already had one. That
// argument only holds for a mark that is already art somewhere. Nothing in this
// game is a ship's wheel, and a flat mark IS a vector shape — so authoring it as
// SVG is both cheaper and more accurate than generating a painting and cutting
// it off its plate.
//
// THE CENTRE IS LEFT BARE ON PURPOSE. A wheel's spokes converge on a hub, and
// the hub is exactly where the caption has to go — so there are no inner spokes
// at all and the words stand where the hub would be. That is a real constraint
// honoured rather than worked around: see the clear-zone arithmetic below, and
// note that the handspikes alone carry the read, which is why losing the spokes
// costs nothing.
// WHERE THE CAPTION LANDS, derived rather than typed.
//
// The shared button centres its two lines on the plate and offers no way to move
// them (components-ui-pixi/ButtonBuyBonus). Their block is
// UI_BASE_FONT_SIZE * (ratio + 0.04) per line, two lines, in a 150px button
// drawn into this 640 canvas — so the band is a function of
// buyBonusLabelSizeRatio and nothing else. Keep the two in step: raising the
// ratio in uiTheme.ts without raising it here lets the stencil drift down into
// the words.
//
// THERE IS NO LONGER A PLACARD BEHIND THEM, and the reason is the game's own
// language rather than a compromise.
//
// The shared button draws its caption with no stroke and no shadow, so for a
// while the contrast came from a dark plate screwed to the door under the words.
// It worked and it looked like what it was: a black box stuck on the button.
//
// This game already solves exactly this problem five times on the reels. L1-L5
// are letters STENCILLED in worn cream paint straight onto a container panel,
// and they read at cell size with nothing behind them. So the caption is that:
// the same cream (#D1CDB9, sampled off l1.png) on the same panel value, which
// is a relationship already proven on this board. See buyBonusLabelFill in
// game/uiTheme.ts — the colour lives there because the shared button draws the
// text, and the two have to agree.
const LABEL_RATIO = 0.58;
const LABEL_BLOCK = ((UI_BASE_FONT_SIZE * (LABEL_RATIO + 0.04) * 2) / 150) * BS;
// The top of the line box, which is what the stencil above has to clear.
const LABEL_TOP = Math.round(BS / 2 - LABEL_BLOCK / 2);

// ── the telegraph, in plate coordinates ────────────────────────────────────
//
// THE CLEAR ZONE IS THE CONSTRAINT, and it is a number rather than a judgement.
// The shared button wraps the caption at buyBonusLabelWrapWidth (108 of its 150
// units), so the widest the words can ever be is 108/150 of the plate — +-230px
// here — and their two lines stand 119px each side of the centre. Nothing cream
// may be drawn inside that, or the words lose the panel they read against.
//
// So the ring's inner edge sits at 246, every tick points OUTWARD from the rim
// rather than inward, and the pointer starts at 150 — which is outside the
// caption's top line (119) and inside the rim.
const DIAL_CX = BS / 2;
const DIAL_CY = BS / 2;

// THE CLEAR ZONE IS THE CONSTRAINT, and it is a number rather than a judgement.
// The shared button wraps the caption at buyBonusLabelWrapWidth (94 of its 150
// units), so the widest the words can ever be is +-200px here, and their two
// lines stand 119px each side of the centre. At the height of a line the rim's
// inner edge has sqrt(216^2 - 119^2) = 180px of clearance, against the ~167 that
// BUY BONUS actually measures — so nothing cream is ever drawn through the words.
//
// Raising buyBonusLabelWrapWidth in uiTheme.ts without raising RIM_IN here is
// what would break it. The comment there says the same thing from the far side.
const RIM_IN = 216;
const RIM_OUT = 244;

// The handspikes. EIGHT, EVENLY SPACED, AND LONG — this is the entire mark.
//
// A ring with many short teeth is a cog; a ring with a few long tapered ones is
// a wheel, and nothing else in a slot cabinet looks like it. They are drawn as
// tapered quads rather than round-capped lines because a handspike is turned
// wood: wide where it is socketed into the rim, narrower along its length, with
// a swell at the end for the hand.
//
// The outer reach is bounded by the plate it sits on rather than by the canvas:
// the tip plus its swell (286 + 18) has to stay inside CASE_R, or the wheel grows
// out of its own mounting.
const SPIKE_N = 8;
const SPIKE_OUT = 286;
const spikes = Array.from({ length: SPIKE_N }, (_, i) => {
	const a = (i / SPIKE_N) * Math.PI * 2;
	const sin = Math.sin(a);
	const cos = Math.cos(a);
	// along the spike, and across it
	const at = (r, w) => [
		DIAL_CX + sin * r - cos * w,
		DIAL_CY - cos * r - sin * w,
	];
	const [ax, ay] = at(RIM_OUT - 10, 15);
	const [bx, by] = at(SPIKE_OUT, 9);
	const [cx, cy] = at(SPIKE_OUT, -9);
	const [dx, dy] = at(RIM_OUT - 10, -15);
	const [kx, ky] = at(SPIKE_OUT, 0);
	return `<path d="M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)} L ${cx.toFixed(1)} ${cy.toFixed(1)} L ${dx.toFixed(1)} ${dy.toFixed(1)} Z" stroke="none"/>
	<circle cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" r="18" stroke="none"/>`;
}).join('');

// The felloes — the rim of a wooden wheel is built from segments, and the joints
// fall BETWEEN the handspikes. A small detail that costs eight short lines and
// is most of what stops the rim reading as a plain printed hoop.
const felloes = Array.from({ length: SPIKE_N }, (_, i) => {
	const a = ((i + 0.5) / SPIKE_N) * Math.PI * 2;
	const at = (r) => [DIAL_CX + Math.sin(a) * r, DIAL_CY - Math.cos(a) * r];
	const [x0, y0] = at(RIM_IN - 1);
	const [x1, y1] = at(RIM_OUT + 1);
	return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke-width="7" opacity="0.45"/>`;
}).join('');

// One group, so the whole mark can be stamped twice — once as the dark creep
// under the paint, once as the paint.
const helm = (fill, opacity, dy = 0) => `<g transform="translate(0 ${dy})" fill="${fill}" stroke="${fill}" opacity="${opacity}">
	<circle cx="${DIAL_CX}" cy="${DIAL_CY}" r="${(RIM_IN + RIM_OUT) / 2}" fill="none" stroke-width="${RIM_OUT - RIM_IN}"/>
	${spikes}
	<g stroke="#000000" opacity="1">${felloes}</g>
</g>`;

const buyBonusContainer = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<!-- THE BOARD'S OWN PANEL, a shade lighter.
	     Sampled off l1.png, whose face means (72,81,87). This sits a little above
	     that so it separates from the background art behind it, and no further:
	     the button is meant to be a container door like every tile on the reels.
	     It was ~25% lighter for a while, to carry white type — see the note on
	     the caption below for why that is no longer the job. -->
	<linearGradient id="cFrame" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#5e6c74"/>
		<stop offset="1" stop-color="#3b464e"/>
	</linearGradient>
	<linearGradient id="cFace" x1="0" y1="0" x2="0.2" y2="1">
		<stop offset="0" stop-color="#6d7e8a"/>
		<stop offset="0.55" stop-color="#5a6b76"/>
		<stop offset="1" stop-color="#434f59"/>
	</linearGradient>
	<linearGradient id="cSteel" x1="0" y1="0" x2="0.4" y2="1">
		<stop offset="0" stop-color="#8b9396"/>
		<stop offset="0.55" stop-color="#5c6467"/>
		<stop offset="1" stop-color="#343b3e"/>
	</linearGradient>
	<!-- the corrugation. The same wide, low-contrast ribs the buy cards use: at
	     button size anything stronger turns into a moire against the bet bar. -->
	<pattern id="cRibs" width="44" height="12" patternUnits="userSpaceOnUse">
		<rect width="4" height="12" fill="#ffffff" fill-opacity="0.055"/>
		<rect x="22" width="2" height="12" fill="#000000" fill-opacity="0.18"/>
	</pattern>
	<linearGradient id="cRust" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#8a4a1e" stop-opacity="0"/>
		<stop offset="0.4" stop-color="#8a4a1e" stop-opacity="0.5"/>
		<stop offset="1" stop-color="#5e2f12" stop-opacity="0"/>
	</linearGradient>
	<!-- THE STENCIL IS PAINT, NOT A CUT.
	     Go Bananubis carves its eye into stone, with a dark cut and a pale lip
	     under it. Wrong verb here: nobody chisels a steel container, they spray
	     through a stencil. So this is flat worn cream with no relief at all, and
	     the wear comes from the ribs and the rust showing through it. -->
	<filter id="cPaint" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0.82  0 0 0 0 0.80  0 0 0 0 0.73  0 0 0 0.88 0"/>
	</filter>
	<!-- a dark offset UNDER the paint: spray creeps beneath a stencil edge and the
	     panel behind it is darker than the paint. A few pixels of this is the
	     difference between painted on and pasted on. -->
	<filter id="cPaintShadow" x="-20%" y="-20%" width="140%" height="140%">
		<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0"/>
	</filter>
</defs>
<rect x="8" y="8" width="${BS - 16}" height="${BS - 16}" rx="26" fill="url(#cFrame)" stroke="#1b1e21" stroke-width="9"/>
${finishRect(8, 8, BS - 16, BS - 16, 26, 'sf', CANVAS_FINISH)}
<!-- the container face, recessed inside the frame -->
<rect x="46" y="46" width="${BS - 92}" height="${BS - 92}" rx="16" fill="url(#cFace)" stroke="#232a2d" stroke-width="6"/>
<rect x="46" y="46" width="${BS - 92}" height="${BS - 92}" rx="16" fill="url(#cRibs)"/>
<rect x="${BS * 0.24}" y="46" width="14" height="${BS - 92}" fill="url(#cRust)"/>
<rect x="${BS * 0.72}" y="46" width="10" height="${BS - 92}" fill="url(#cRust)"/>
${finishRect(46, 46, BS - 92, BS - 92, 16, 'sf', CANVAS_FINISH)}
<rect x="55" y="55" width="${BS - 110}" height="${BS - 110}" rx="12" fill="none" stroke="#000000" stroke-width="2" opacity="0.22"/>

${helm('#000000', 0.3, 5)}
${helm('#d1cdb9', 0.88)}

${[[46, 46], [BS - 46, 46], [46, BS - 46], [BS - 46, BS - 46]]
	.map(([x, y]) => `<rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="5" fill="url(#cSteel)" stroke="#1e2426" stroke-width="4"/>
	<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="3" fill="#a3abae" opacity="0.5"/>`)
	.join('')}
</svg>`;

// ---- the same stencil, LIT - drawn for ADDITIVE blending -------------------
//
// Transparent everywhere else, so it lays over the plate with blendMode 'add'
// and reads as the paint catching light rather than as a sticker. The bloom is
// baked in rather than filtered at run time: an additive child inside a filtered
// or masked container is composited into an isolated target that starts empty,
// so it would be adding to nothing and arrive as a faint film.
const buyBonusContainerLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="cBloom" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffb02c" stop-opacity="0.26"/>
		<stop offset="0.4" stop-color="#ff8c1a" stop-opacity="0.17"/>
		<stop offset="1" stop-color="#ff6a10" stop-opacity="0"/>
	</radialGradient>
	<filter id="cLitSoft" x="-70%" y="-70%" width="240%" height="240%">
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.6  0 0 0 0 0.12  0 0 0 1 0"/>
		<feGaussianBlur stdDeviation="12"/>
	</filter>
	<filter id="cLitCore" x="-30%" y="-30%" width="160%" height="160%">
		<!-- amber, not near-white: this sits on a PALE cream stencil, and anything
		     close to white there reads as a hole in the panel rather than as light -->
		<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.74  0 0 0 0 0.24  0 0 0 0.85 0"/>
		<feGaussianBlur stdDeviation="2"/>
	</filter>
</defs>
<ellipse cx="${DIAL_CX}" cy="${DIAL_CY}" rx="${BS * 0.46}" ry="${BS * 0.4}" fill="url(#cBloom)"/>
<!-- 0.55, not 1: at the 150px the button is actually drawn, a full-strength
     soft pass blew the rim out into a white ring and took the caption with it -->
<g filter="url(#cLitSoft)" opacity="0.55">${helm('#ffffff', 1)}</g>
<g filter="url(#cLitCore)">${helm('#ffffff', 1)}</g>
</svg>`;

// ── THE GROUND UNDER THE MARK: three answers, so it can be chosen by looking ──
//
// The question is whether the container door is still earning its place now that
// the mark is an instrument rather than a stencil. In the game it sits to the
// left of a board MADE OF container panels, so a container panel next to it can
// read as a stray board cell that came loose — which is the case for dropping it.
// The case for keeping it is that a button needs an edge: a mark floating on the
// painted dock has no boundary, and a control with no boundary is not obviously
// a control.
//
// Rendered all three rather than argued about.

// B — no ground at all. The dial sprayed straight onto the scene.
const buyBonusBare = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>${DEFS}</defs>
${helm('#000000', 0.45, 6)}
${helm('#d1cdb9', 0.94)}
</svg>`;

// C — the instrument's own case. A dark steel body with a brass bezel, which is
// what a telegraph actually is, and which gives the caption a face to sit on
// instead of a painted panel. Note this is NOT the black placard that was tried
// and rejected under the words once before: that was a rectangle stuck on a grey
// panel to prop the type up, this is the object the mark belongs to.
// ONE RING, NOT TWO. The first version of this put a heavy brass bezel around
// the plate, which was right while the mark was a painted dial — the bezel was
// the only warm thing on a grey bet bar and the dial had no weight of its own.
// A wheel is a physical object with its own rim, so a bezel around it is a second
// concentric circle doing the same job a few pixels further out, and the two read
// as one fussy target. The brass moved INTO the wheel instead: same warmth on the
// bar, one object instead of two, and the mark now looks turned and mounted
// rather than stencilled.
const CASE_R = 310;
const buyBonusCase = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	${DEFS}
	<radialGradient id="caseFace" cx="0.38" cy="0.32" r="0.85">
		<stop offset="0" stop-color="#46525c"/>
		<stop offset="0.6" stop-color="#2f3a43"/>
		<stop offset="1" stop-color="#171f25"/>
	</radialGradient>
	<!-- lit from the upper left, like the reel housing's brass -->
	<linearGradient id="helmBrass" x1="0.15" y1="0" x2="0.7" y2="1">
		<stop offset="0" stop-color="#ffeaa0"/>
		<stop offset="0.3" stop-color="#e8b545"/>
		<stop offset="0.65" stop-color="#b57e1e"/>
		<stop offset="1" stop-color="#6d4a0d"/>
	</linearGradient>
</defs>
<circle cx="${DIAL_CX}" cy="${DIAL_CY}" r="${CASE_R}" fill="url(#caseFace)"/>
<!-- the only thing left of the bezel: a hairline, so the button has an edge -->
<circle cx="${DIAL_CX}" cy="${DIAL_CY}" r="${CASE_R - 3}" fill="none" stroke="#8a5c14" stroke-width="5" opacity="0.85"/>
<circle cx="${DIAL_CX}" cy="${DIAL_CY}" r="${CASE_R - 9}" fill="none" stroke="#000000" stroke-width="12" opacity="0.4"/>
${helm('#000000', 0.45, 6)}
${helm('url(#helmBrass)', 1)}
<!-- a top highlight along the rim, which is what makes brass look turned -->
<circle cx="${DIAL_CX}" cy="${DIAL_CY}" r="${(RIM_IN + RIM_OUT) / 2 - 8}" fill="none" stroke="#ffeaa0" stroke-width="3" opacity="0.4"/>
</svg>`;

// `node generate_ui_plates.mjs <dir> --variants <outdir>` writes the three
// grounds side by side instead of shipping one. Nothing else reads this.
const variantDir = process.argv.indexOf('--variants') > -1 && process.argv[process.argv.indexOf('--variants') + 1];
if (variantDir) {
	fs.mkdirSync(variantDir, { recursive: true });
	for (const [name, svg] of [['a_door', buyBonusContainer], ['b_bare', buyBonusBare], ['c_case', buyBonusCase]]) {
		const r = new Resvg(svg, { fitTo: { mode: 'width', value: BS }, font: { loadSystemFonts: false } });
		fs.writeFileSync(path.join(variantDir, `${name}.png`), r.render().asPng());
		console.log('variant', name);
	}
}

render(ticker, 'ticker_plate.png', TW);
render(buyBonus, 'buybonus_plate.png', BS);
// THE CASE, NOT THE DOOR.
//
// buybonus_container.png keeps its name — it is wired through uiTheme.ts and an
// asset key rename buys nothing — but what it now contains is the instrument's
// own body rather than a shipping-container panel.
//
// The door went because it had stopped doing a job. It was there to say "this
// button belongs to this game" back when the mark on it was a stencil, and a
// stencil needs a panel to be sprayed on. An engine telegraph is an object, not
// a marking, and it brings its own edges. Worse, in place the door sat to the
// left of a board MADE of container panels and read as a board cell that had
// come loose.
//
// The brass is the other half of the reason. The platform skin's bet bar is flat
// grey and the door was grey on grey, which made the one control the game most
// wants pressed the quietest thing on the strip. The bezel is the same brass as
// the reel housing and the win plaques, so the CTA is now the only warm object
// down there — which is exactly what a CTA should be.
render(buyBonusCase, 'buybonus_container.png', BS);
render(buyBonusContainerLit, 'buybonus_container_lit.png', BS);
console.log('ui plates written to', OUT);
