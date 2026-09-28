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
//   2. The Buy Bonus is an OBJECT — a cut ice crystal. See THE ICE CRYSTAL
//      below for why that shape, and for the wheel and the hatch it replaced.
//
//   3. That crystal ships TWICE — as ice, and catching light. The lit copy is
//      drawn over the plate with blendMode 'add' on hover.
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

// ── THE ICE CRYSTAL ────────────────────────────────────────────────────────
//
// A cut crystal: a pointed-top hexagon with six bevelled faces round a flat
// table, the caption on the table. Still Go Bananas Boat's principle — the
// button is an OBJECT from the game's world, not a panel with a decoration on
// it — but not Boat's shape. A crystal wheel was built first, on Boat's ship's
// wheel, and it read as a helm; the brief is a crystal, and a crystal is a gem
// cut, not a wheel.
//
// WHY A GEM CUT READS AT ~120px: the six bevel faces are each a different value,
// lit from the upper left like every plate in this game — pale at the top-left,
// deep blue at the bottom-right. That light-to-dark ring of flat facets is what
// a crystal looks like at any size, and it is carried by VALUE, so it survives
// being drawn small. A plain blue hexagon with a gradient reads as a tile.
//
// THE HOVER DOES NOT TURN. The wheel's lit copy spun, because wheels turn. A
// crystal turning on the spot looks like the texture came loose, so the lit copy
// here is the crystal CATCHING LIGHT: its ridges flare and a glint opens on the
// upper-left corner. buyBonusHoverSpin is unset in uiTheme.ts for that reason.
//
// ── THE CLEAR ZONE — measured in this game's face ───────────────────────────
//
// Measured by rendering each caption in Titan One (see design/preview_buybonus
// for the harness), at buyBonusLabelSizeRatio 0.50, in this 640 canvas:
//
//     BONUS     half-width 168, line box reaches y = +87
//     DISABLE   half-width 204, single line, y within +-35   <- the widest
//
// A pointed-top hexagon's flat sides sit at x = +-R*cos(30deg). The table is
// R_TABLE 254, so its sides are at +-220 — DISABLE clears them by 16 — and
// they run straight from y = -127 to +127, well past the caption's +-87.
// buyBonusLabelSizeRatio in src/game/uiTheme.ts and R_TABLE here are one
// decision in two files.
const CX = BS / 2;
const CY = BS / 2;
const R_OUT = 306; // the crystal's outline
const R_TABLE = 254; // the flat face the caption sits on

const hexPts = (r, dy = 0) =>
	Array.from({ length: 6 }, (_, k) => {
		const a = ((-90 + 60 * k) * Math.PI) / 180;
		return [CX + Math.cos(a) * r, CY + dy + Math.sin(a) * r];
	});
const poly = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

// Light from the upper left. Each bevel face's brightness is the dot product of
// its outward normal with that direction, mapped onto the ice ramp.
const LIGHT = [-0.62, -0.78];
const RAMP = ['#1e6fa8', '#3f8ec4', '#5fa8d8', '#8fd9ff', '#c9ecff', '#eaf7ff'];
const facetColour = (k) => {
	const mid = ((-60 + 60 * k) * Math.PI) / 180; // the face between vertex k and k+1
	const d = Math.cos(mid) * LIGHT[0] + Math.sin(mid) * LIGHT[1]; // -1..1
	const t = (d + 1) / 2;
	return RAMP[Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1)))];
};

const O = hexPts(R_OUT);
const T = hexPts(R_TABLE);
const facets = Array.from({ length: 6 }, (_, k) => {
	const k2 = (k + 1) % 6;
	return `<polygon points="${poly([O[k], O[k2], T[k2], T[k]])}" fill="${facetColour(k)}"/>`;
}).join('\n');
// the ridges between faces: a dark hairline, so each face reads as a separate
// plane rather than as one gradient
const ridges = Array.from(
	{ length: 6 },
	(_, k) =>
		`<line x1="${O[k][0].toFixed(1)}" y1="${O[k][1].toFixed(1)}" x2="${T[k][0].toFixed(1)}" y2="${T[k][1].toFixed(1)}"/>`,
).join('');

// A four-point glint: the one sharp highlight a cut stone throws.
const glint = (x, y, r, fill, opacity) =>
	`<path d="M ${x} ${y - r} Q ${x + r * 0.14} ${y - r * 0.14} ${x + r} ${y} Q ${x + r * 0.14} ${y + r * 0.14} ${x} ${y + r} Q ${x - r * 0.14} ${y + r * 0.14} ${x - r} ${y} Q ${x - r * 0.14} ${y - r * 0.14} ${x} ${y - r} Z" fill="${fill}" opacity="${opacity}"/>`;

const buyBonusIce = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<!-- the table: DARK ice, deep enough that a white caption reads on it -->
	<linearGradient id="table" x1="0.2" y1="0" x2="0.8" y2="1">
		<stop offset="0" stop-color="#2c5878"/>
		<stop offset="0.5" stop-color="#173650"/>
		<stop offset="1" stop-color="#0c1f31"/>
	</linearGradient>
	<radialGradient id="depth" cx="0.3" cy="0.22" r="0.7">
		<stop offset="0" stop-color="#8fd9ff" stop-opacity="0.28"/>
		<stop offset="1" stop-color="#8fd9ff" stop-opacity="0"/>
	</radialGradient>
</defs>
<!-- the shadow the crystal casts, then its dark outline -->
<polygon points="${poly(hexPts(R_OUT, 8))}" fill="#000000" opacity="0.45"/>
<polygon points="${poly(O)}" fill="#0a1420"/>
${facets}
<g stroke="#0a1420" stroke-width="4" opacity="0.55">${ridges}</g>
<polygon points="${poly(T)}" fill="url(#table)" stroke="#0a1420" stroke-width="5" stroke-opacity="0.6"/>
<polygon points="${poly(T)}" fill="url(#depth)"/>
<!-- the inner reflection: the upper-left edges seen again through the table,
     a little way in. This replaced two drawn "fractures", which at button size
     came out as tick marks — a symbol, not depth. -->
<polyline points="${poly([hexPts(R_TABLE - 24)[3], hexPts(R_TABLE - 24)[4], hexPts(R_TABLE - 24)[5], hexPts(R_TABLE - 24)[0]])}" fill="none" stroke="#8fd9ff" stroke-width="3" opacity="0.3" stroke-linejoin="round"/>
<!-- the outline's own lit edge, upper-left faces only -->
<polyline points="${poly([O[3], O[4], O[5], O[0]])}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.5" stroke-linejoin="round"/>
${glint(O[5][0] + 14, O[5][1] + 26, 22, '#ffffff', 0.85)}
</svg>`;

// ── the same crystal, CATCHING LIGHT — drawn for ADDITIVE blending ─────────
//
// Transparent everywhere else, bloom baked in (an additive child inside a
// filtered or masked container composites into an empty target and arrives as
// a faint film). No table fill: the caption lives there and a lit table would
// wash the words out — which is exactly what took Boat's caption with it.
const litEdges = (stroke, w) => `<g fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">
	<polygon points="${poly(O)}"/>
	<polygon points="${poly(T)}"/>
	${Array.from({ length: 6 }, (_, k) => `<line x1="${O[k][0].toFixed(1)}" y1="${O[k][1].toFixed(1)}" x2="${T[k][0].toFixed(1)}" y2="${T[k][1].toFixed(1)}"/>`).join('')}
</g>`;
const buyBonusIceLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<filter id="litSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="11"/></filter>
	<filter id="litCore" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter>
</defs>
<!-- the upper-left faces themselves brighten; the lower-right ones stay dark,
     so the light has a direction instead of the whole stone switching on -->
<g opacity="0.35">${[3, 4, 5].map((k) => `<polygon points="${poly([O[k], O[(k + 1) % 6], T[(k + 1) % 6], T[k]])}" fill="#8fd9ff"/>`).join('')}</g>
<g filter="url(#litSoft)" opacity="0.6">${litEdges('#8fd9ff', 16)}</g>
<g filter="url(#litCore)">${litEdges('#eaf7ff', 5)}</g>
<g filter="url(#litSoft)">${glint(O[5][0] + 14, O[5][1] + 26, 60, '#eaf7ff', 0.9)}</g>
${glint(O[5][0] + 14, O[5][1] + 26, 40, '#ffffff', 1)}
</svg>`;

// ── VARIANT: the snowball ──────────────────────────────────────────────────
//
// Offered alongside, not shipped. `--variants <dir>` writes it; nothing reads it
// unless it is swapped in by name.
//
// The catch with a snowball is the caption. The shared button draws its text
// with no stroke and no shadow, and a snowball is the one object in this game
// that is LIGHTER than white type. Choosing it means buyBonusLabelFill goes to a
// deep ice blue in uiTheme.ts (both skins), which the preview renders.
const SB_R = 292;
const lumps = (() => {
	// deterministic, so a re-run does not reshuffle the silhouette
	let seed = 7;
	const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
	const out = [];
	// FEW, FLAT AND UNEVEN. The first pass put 22 even lumps right on the edge
	// and the ball read as a cog. Packed snow is only slightly irregular: a
	// dozen shallow bulges of different sizes, set well inside the outline so
	// each one only nudges it.
	for (let k = 0; k < 12; k++) {
		const a = (k / 12) * Math.PI * 2 + rnd() * 0.35;
		const size = 26 + rnd() * 30;
		const r = SB_R - size + 6 + rnd() * 5;
		out.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r, size]);
	}
	return out;
})();
const specks = (() => {
	let seed = 11;
	const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
	const out = [];
	for (let k = 0; k < 90; k++) {
		const a = rnd() * Math.PI * 2;
		const r = Math.sqrt(rnd()) * (SB_R - 20);
		out.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r, 2 + rnd() * 5, rnd() < 0.5]);
	}
	return out;
})();
const snowball = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs>
	<radialGradient id="snow" cx="0.36" cy="0.3" r="0.78">
		<stop offset="0" stop-color="#ffffff"/>
		<stop offset="0.45" stop-color="#e6f4ff"/>
		<stop offset="0.8" stop-color="#a9d0ec"/>
		<stop offset="1" stop-color="#5f8fb8"/>
	</radialGradient>
</defs>
<circle cx="${CX}" cy="${CY + 10}" r="${SB_R}" fill="#000000" opacity="0.4"/>
<g fill="#0a1420">${lumps.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 5).toFixed(1)}"/>`).join('')}<circle cx="${CX}" cy="${CY}" r="${SB_R + 5}"/></g>
<g fill="url(#snow)">${lumps.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`).join('')}<circle cx="${CX}" cy="${CY}" r="${SB_R}"/></g>
${specks.map(([x, y, r, light]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${light ? '#ffffff' : '#7fa9cc'}" opacity="${light ? 0.7 : 0.35}"/>`).join('')}
${glint(CX - 150, CY - 170, 26, '#ffffff', 0.95)}
</svg>`;
const snowballLit = `<svg xmlns="http://www.w3.org/2000/svg" width="${BS}" height="${BS}" viewBox="0 0 ${BS} ${BS}">
<defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter></defs>
<circle cx="${CX}" cy="${CY}" r="${SB_R + 6}" fill="none" stroke="#8fd9ff" stroke-width="18" opacity="0.6" filter="url(#s)"/>
${[[-150, -170, 56], [140, -120, 30], [-60, 190, 26]].map(([dx, dy, r]) => `<g filter="url(#s)">${glint(CX + dx, CY + dy, r * 1.4, '#eaf7ff', 0.8)}</g>${glint(CX + dx, CY + dy, r, '#ffffff', 1)}`).join('')}
</svg>`;

const variantIdx = process.argv.indexOf('--variants');
if (variantIdx > -1 && process.argv[variantIdx + 1]) {
	const dir = process.argv[variantIdx + 1];
	fs.mkdirSync(dir, { recursive: true });
	for (const [name, svg] of [
		['buybonus_snowball.png', snowball],
		['buybonus_snowball_lit.png', snowballLit],
	]) {
		const r = new Resvg(svg, { fitTo: { mode: 'width', value: BS }, font: { loadSystemFonts: false } });
		fs.writeFileSync(path.join(dir, name), r.render().asPng());
		console.log('variant', name);
	}
}

render(ticker, 'ticker_plate.png', TW);
render(buyBonus, 'buybonus_plate.png', BS);
render(buyBonusIce, 'buybonus_ice.png', BS);
render(buyBonusIceLit, 'buybonus_ice_lit.png', BS);
console.log('ui plates written to', OUT);
