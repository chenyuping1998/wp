// THE NINJA'S BUY BONUS: a throwing star (2026-10-16, user: 重新設計 buybonus
// 按鈕，參考船長、boomana 的設計標準).
//
// What Boat and Boomana have in common, and so what this follows:
//   · the button IS an object from the game, not a coloured rounded box —
//     Boat's ship's wheel, Boomana's slab of the royals' stone;
//   · the caption is painted straight onto it, no placard behind the words;
//   · the art is drawn LARGER than the button box (buyBonusPlateScale), on a
//     canvas with transparent margin, so the object can reach past the box
//     while the hit area stays the same;
//   · the hover does the object's own obvious thing — the wheel turns, the
//     stone splits. A shuriken spins: buyBonusHoverRotate turns the plate and
//     this lit layer together (one clock in ButtonBuyBonus), the caption stays
//     level.
//
// The old plate was a lacquer card with a small shuriken stamped at the top —
// a picture of a throwing star on a box. This is the star.
//
// GEOMETRY, in the 800 canvas. The button box is 150 units; plateScale 1.25
// makes the canvas 187.5 units, so 1 unit = 4.267px — the same px-per-unit
// as Boat's 640 canvas at scale 1, so its caption arithmetic carries over:
// two lines of BUY BONUS at buyBonusLabelSizeRatio 0.58 stand +-119px about the
// centre and measure ~+-167px wide, i.e. the words need r <= ~205px clear.
// The hub's inner ring is at HUB_IN = 212. Raise the label ratio or the wrap
// width (94) in uiTheme.ts and this has to grow with it.
//
// The four blades point at the CORNERS at rest, so the star fills the square
// box the bar lays out (tips at r 378 < the box's half-diagonal 452), and they
// are SWEPT — each tip leads its base by 14 deg — so the spin has a direction
// you can read at a glance instead of a symmetric cross flickering.
//
//   node design/generate_buy_shuriken.mjs E:/stake/tools/gen
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const resvgDir = process.argv[2];
if (!resvgDir) throw new Error('usage: node design/generate_buy_shuriken.mjs <dir with node_modules/@resvg/resvg-js>');
const require = createRequire(path.join(path.resolve(resvgDir), 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'static/assets/sprites/goBananasUi');

const S = 800;
const C = S / 2;
const HUB_IN = 212; // the caption's clear zone ends here
const HUB = 236; // outer edge of the brass ring
const TIP = 378;
const HALF = 31; // a blade's half-width at its root, degrees
const SWEEP = 14; // how far the tip leads the root, degrees

const rad = (d) => (d * Math.PI) / 180;
// angle 0 = up, clockwise (screen)
const at = (r, a) => [C + r * Math.sin(rad(a)), C - r * Math.cos(rad(a))];
const pt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

const blade = (a) => {
	const root0 = at(HUB - 6, a - HALF);
	const root1 = at(HUB - 6, a + HALF);
	const tip = at(TIP, a + SWEEP);
	// concave edges: the control points sit inside the straight line, which is
	// what makes it a blade and not a triangle. The leading edge (the side the
	// tip sweeps toward) is cut deeper.
	const lead = at(HUB + 46, a + HALF * 0.55 + SWEEP * 0.4);
	const trail = at(HUB + 70, a - HALF * 0.25 + SWEEP * 0.7);
	const ridgeRoot = at(HUB - 6, a + SWEEP * 0.15);
	return {
		outline: `M ${pt(root0)} Q ${pt(trail)} ${pt(tip)} Q ${pt(lead)} ${pt(root1)} Z`,
		// the two facets either side of the ridge
		light: `M ${pt(ridgeRoot)} L ${pt(tip)} Q ${pt(lead)} ${pt(root1)} Z`,
		dark: `M ${pt(root0)} Q ${pt(trail)} ${pt(tip)} L ${pt(ridgeRoot)} Z`,
		edge: `M ${pt(at(HUB + 20, a + HALF * 0.82))} Q ${pt(lead)} ${pt(tip)}`,
		ridge: `M ${pt(ridgeRoot)} L ${pt(tip)}`,
		tip,
	};
};
const ANGLES = [45, 135, 225, 315];
const blades = ANGLES.map(blade);

const defs = `<defs>
	<linearGradient id="steelLight" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#e3eaec"/>
		<stop offset="0.45" stop-color="#9eabb1"/>
		<stop offset="1" stop-color="#5d6a71"/>
	</linearGradient>
	<linearGradient id="steelDark" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#6c7a82"/>
		<stop offset="0.55" stop-color="#36424a"/>
		<stop offset="1" stop-color="#1c252b"/>
	</linearGradient>
	<radialGradient id="lacquer" cx="0.42" cy="0.36" r="0.75">
		<stop offset="0" stop-color="#2b404c"/>
		<stop offset="0.55" stop-color="#15252e"/>
		<stop offset="1" stop-color="#071017"/>
	</radialGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#f6e2a6"/>
		<stop offset="0.5" stop-color="#b8873a"/>
		<stop offset="1" stop-color="#4f3716"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="0.9">
		<stop offset="0" stop-color="#f7e3a9"/>
		<stop offset="0.65" stop-color="#a87932"/>
		<stop offset="1" stop-color="#3e2b10"/>
	</radialGradient>
	<pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse">
		<path d="M0 18L18 0M-5 5L5 -5M13 23L23 13" stroke="#70828b" opacity=".12" stroke-width="2"/>
	</pattern>
	<filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
		<feGaussianBlur stdDeviation="9"/>
	</filter>
	<filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
		<feGaussianBlur stdDeviation="10"/>
	</filter>
	<filter id="bloomWide" x="-40%" y="-40%" width="180%" height="180%">
		<feGaussianBlur stdDeviation="22"/>
	</filter>
	<clipPath id="hubClip"><circle cx="${C}" cy="${C}" r="${HUB_IN}"/></clipPath>
</defs>`;

const star = (body) => `${blades.map((b) => body(b)).join('\n')}`;

// rivets where each blade is seated in the ring
const rivets = ANGLES.map((a) => {
	const [x, y] = at((HUB_IN + HUB) / 2 + 1, a + SWEEP * 0.15);
	return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="url(#rivet)" stroke="#20190d" stroke-width="3"/>
	<circle cx="${(x - 3).toFixed(1)}" cy="${(y - 3).toFixed(1)}" r="3" fill="#fff4c8" opacity=".85"/>`;
}).join('\n');

const plate = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${defs}
<!-- the drop shadow, so the star stands off the bar rather than printed on it -->
<g transform="translate(0 12)" opacity=".55" filter="url(#drop)">
	${star((b) => `<path d="${b.outline}" fill="#000"/>`)}
	<circle cx="${C}" cy="${C}" r="${HUB + 4}" fill="#000"/>
</g>
<!-- the blades: a dark outline, then two facets about the ridge -->
${star((b) => `<path d="${b.outline}" fill="#0b1218" stroke="#0b1218" stroke-width="14" stroke-linejoin="round"/>`)}
${star((b) => `<path d="${b.dark}" fill="url(#steelDark)"/>
	<path d="${b.light}" fill="url(#steelLight)"/>
	<path d="${b.ridge}" stroke="#f2f6f7" stroke-width="2.5" opacity=".55"/>
	<path d="${b.edge}" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`)}
<!-- the hub: lacquer, the game's weave, a crimson hairline, the brass ring -->
<circle cx="${C}" cy="${C}" r="${HUB}" fill="#0b1218"/>
<circle cx="${C}" cy="${C}" r="${HUB_IN}" fill="url(#lacquer)"/>
<circle cx="${C}" cy="${C}" r="${HUB_IN}" fill="url(#weave)"/>
<g clip-path="url(#hubClip)">
	<!-- a soft top light so the hub reads as domed -->
	<ellipse cx="${C - 40}" cy="${C - 120}" rx="170" ry="90" fill="#9fc0cc" opacity=".08"/>
</g>
<circle cx="${C}" cy="${C}" r="${HUB_IN - 10}" fill="none" stroke="#b72f3d" stroke-width="4" opacity=".9"/>
<circle cx="${C}" cy="${C}" r="${(HUB_IN + HUB) / 2}" fill="none" stroke="url(#brass)" stroke-width="${HUB - HUB_IN - 4}"/>
<circle cx="${C}" cy="${C}" r="${HUB_IN + 2}" fill="none" stroke="#f7e3a9" stroke-width="1.6" opacity=".55"/>
<circle cx="${C}" cy="${C}" r="${HUB}" fill="none" stroke="#0b1218" stroke-width="4"/>
${rivets}
</svg>`;

// THE LIT LAYER, for ADDITIVE blending and the same rotation as the plate:
// the edges catch the light as it spins and the tips flare. Transparent in the
// hub, so the caption never sits under a glow. Bloom baked in (an additive
// child inside a filtered container adds to nothing — see Boat's note).
const lit = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${defs}
<g filter="url(#bloomWide)" opacity=".4">
	${star((b) => `<path d="${b.outline}" fill="#7e5bd6"/>`)}
</g>
<g filter="url(#bloom)">
	${star((b) => `<path d="${b.edge}" fill="none" stroke="#e6dcff" stroke-width="14" stroke-linecap="round" opacity=".8"/>`)}
	${star((b) => `<circle cx="${b.tip[0].toFixed(1)}" cy="${b.tip[1].toFixed(1)}" r="22" fill="#ffffff" opacity=".7"/>`)}
</g>
${star((b) => `<path d="${b.edge}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
	<path d="${b.ridge}" stroke="#ffffff" stroke-width="2" opacity=".6"/>`)}
<circle cx="${C}" cy="${C}" r="${(HUB_IN + HUB) / 2}" fill="none" stroke="#ffe7a8" stroke-width="5" opacity=".75"/>
<circle cx="${C}" cy="${C}" r="${(HUB_IN + HUB) / 2}" fill="none" stroke="#ffd27a" stroke-width="18" opacity=".35" filter="url(#bloom)"/>
</svg>`;

const save = (name, svg) => {
	fs.writeFileSync(path.join(out, name), new Resvg(svg, { fitTo: { mode: 'width', value: S }, font: { loadSystemFonts: false } }).render().asPng());
	console.log('rendered', name);
};
save('buybonus_shuriken.png', plate);
save('buybonus_shuriken_lit.png', lit);
