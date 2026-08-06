// Win-tier plaques for Ember Forge: brass-framed iron plates with the tier name
// baked in, one per win level. The amount is drawn by the frontend inside the
// plate's dark centre (see Win.svelte), so these stay language-neutral apart
// from the tier name, which is the standard English slot vocabulary.
// Usage: node design/generate_win_banners.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_win_banners.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

import { surfaceDefs, finishRect, CANVAS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/emberForgeWinBanners');

// The game's display face, self-hosted alongside the runtime copy the bet bar
// uses (game/fonts.ts). Baked headline art and live Text have to be the same
// typeface or the banner reads as a different game to the amount inside it.
const FONT_DIR = path.join(appRoot, 'static/fonts');
const BANNER_FONT = 'Titan One';
// Measured rather than assumed: the widest tier name (SUPER WIN) inks 727px at
// this size against 876px of clear space inside the brass frame, so 128 carries
// over from the previous face unchanged.
const TIER_SIZE = 128;
fs.mkdirSync(OUT, { recursive: true });

// The PLATE is still 1000x560. The canvas is larger so the flames around it have
// somewhere to burn — a tongue drawn inside the old bounds would be clipped flat
// at the edge, which reads as a printed border rather than as fire.
//
// Win.svelte compensates: it scales the sprite up by CANVAS/PLATE so the plate
// itself lands at exactly the size it did before, with the flames extending past
// it. Change one of these and that factor has to move with it.
const PLATE_W = 1000;
const PLATE_H = 560;
const MARGIN = 140;
const W = PLATE_W + MARGIN * 2;
const H = PLATE_H + MARGIN * 2;
// every plate coordinate below was authored against the un-margined canvas
const OX = MARGIN;
const OY = MARGIN;

// ── flames around the frame ─────────────────────────────────────────────────
// Deterministic, so a regeneration does not reshuffle art that is already signed
// off. Tongues are authored pointing UP in local space and placed with a
// rotation, which is what lets the same shape serve all four edges.
let flameSeed = 990911;
const frand = () => {
	flameSeed = (flameSeed * 1103515245 + 12345) & 0x7fffffff;
	return flameSeed / 0x7fffffff;
};

const tongue = (height, width, lean) => {
	const tipX = lean * height * 0.28;
	return (
		`M ${-width} 0 ` +
		`C ${-width * 0.75} ${-height * 0.42}, ${tipX - width * 0.5} ${-height * 0.72}, ${tipX} ${-height} ` +
		`C ${tipX + width * 0.5} ${-height * 0.72}, ${width * 0.75} ${-height * 0.42}, ${width} 0 Z`
	);
};

/**
 * Fire hugging the plate. Everything here is about NOT looking like a border.
 *
 * The first cut placed evenly spaced tongues of near-equal size all the way
 * round and it came out as a sawtooth collar — the eye reads regular repetition
 * as ornament, never as flame. Three things fix that and all three matter:
 *   · positions are jittered off the even spacing, so no two gaps match
 *   · heights vary by more than 3:1, so the silhouette is ragged
 *   · nothing exceeds the margin, because a tongue cut off flat by the canvas
 *     edge is the most border-like thing of all
 *
 * The bottom edge gets almost nothing. Fire rises; tongues hanging off the
 * underside read as teeth.
 */
const flames = () => {
	const spots = [];
	const push = (x, y, rotate, scale) => spots.push({ x, y, rotate, scale });
	const clamp01 = (v) => Math.max(0, Math.min(1, v));

	// Every tongue is anchored ON the plate's edge, not in the margin beside it.
	// Anchoring them outside left a gap between the frame and the fire, and a
	// flame with daylight under it reads as a separate object floating there.
	const EDGE = 34; // the plate rect's own inset

	// top edge: the run that carries it, ragged and irregular
	for (let i = 0; i <= 19; i++) {
		const t = clamp01((i + (frand() - 0.5) * 0.75) / 19);
		push(OX + PLATE_W * t, OY + EDGE + 6, 0, 0.45 + frand() * 0.95);
	}
	// sides: fewer, smaller, leaning up and out from the frame itself
	for (let i = 0; i <= 6; i++) {
		const t = clamp01((i + (frand() - 0.5) * 0.6) / 6);
		const y = OY + PLATE_H * (0.12 + 0.78 * t);
		push(OX + EDGE + 4, y, -74, 0.34 + frand() * 0.5);
		push(OX + PLATE_W - EDGE - 4, y, 74, 0.34 + frand() * 0.5);
	}
	// No bottom run. Short stubs hanging under the plate read as specks, not as
	// fire — and fire does not gather under a thing it is climbing.

	// Base height is set so the tallest tongue at the widest layer still lands
	// inside MARGIN: 78 * 1.4 (max scale) * 1.25 (deep layer) = 137 < 140.
	const BASE_H = 78;
	const BASE_W = 17;

	const layer = (gradient, sizeScale, opacity) =>
		spots
			.map(({ x, y, rotate, scale }) => {
				const height = BASE_H * scale * sizeScale;
				const width = BASE_W * scale * sizeScale;
				const lean = frand() * 2 - 1;
				return `<path d="${tongue(height, width, lean)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rotate})" fill="url(#${gradient})" opacity="${opacity}"/>`;
			})
			.join('');

	// Two passes inside one glow: the flame body, then bright cores up its
	// middle. Fire has no outline, so depth comes from stacked translucent
	// shapes rather than from anything drawn round the edge.
	return (
		`<g filter="url(#flameGlow)">` +
		`<g>${layer('flameMid', 1, 0.72)}</g>` +
		`<g>${layer('flameHot', 0.5, 0.7)}</g>` +
		`</g>`
	);
};

// tier → ribbon colours; the frame stays brass across the set so the plaques
// read as one family, only the ribbon and glow shift with intensity
const TIERS = {
	big: { text: 'BIG WIN', a: '#6e1f0c', b: '#3a1006', rim: '#c23a12' },
	superwin: { text: 'SUPER WIN', a: '#a8330d', b: '#5c1c06', rim: '#f06a15' },
	mega: { text: 'MEGA WIN', a: '#d4641a', b: '#7a340c', rim: '#ffa32c' },
	epic: { text: 'EPIC WIN', a: '#f0a63a', b: '#9a5c12', rim: '#ffe6a0' },
	max: { text: 'MAX WIN', a: '#fff0c8', b: '#c98a2a', rim: '#dcefff' },
};

const rivets = () => {
	let out = '';
	for (let i = 0; i < 9; i++) {
		const x = OX + 120 + i * 95;
		out += `<circle cx="${x}" cy="${OY + 66}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
		<circle cx="${x}" cy="${OY + PLATE_H - 66}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>`;
	}
	for (let i = 0; i < 3; i++) {
		const y = OY + 150 + i * 130;
		out += `<circle cx="${OX + 66}" cy="${y}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
		<circle cx="${OX + PLATE_W - 66}" cy="${y}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>`;
	}
	return out;
};

const banner = ({ text, a, b, rim }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
${surfaceDefs('sf')}
	<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="${a}"/>
		<stop offset="1" stop-color="${b}"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe282"/>
		<stop offset="0.45" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<linearGradient id="tierFace" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#fffbe8"/>
		<stop offset="0.45" stop-color="#ffd75e"/>
		<stop offset="1" stop-color="#c9821a"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.7" stop-color="#c08a20"/>
		<stop offset="1" stop-color="#6d4a08"/>
	</radialGradient>
	<radialGradient id="inner" cx="0.5" cy="0.62" r="0.7">
		<stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.1"/>
	</radialGradient>
	<linearGradient id="flameMid" x1="0" y1="1" x2="0" y2="0">
		<stop offset="0" stop-color="#ff5a0f"/>
		<stop offset="0.55" stop-color="#ff9b2a" stop-opacity="0.85"/>
		<stop offset="1" stop-color="${rim}" stop-opacity="0"/>
	</linearGradient>
	<linearGradient id="flameHot" x1="0" y1="1" x2="0" y2="0">
		<stop offset="0" stop-color="#ffd75e"/>
		<stop offset="0.6" stop-color="#fff3bd" stop-opacity="0.8"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</linearGradient>
	<!-- Glow applied to the WHOLE flame run at once, not per tongue.
	     Blurring each tongue separately gave a row of discrete red lobes — a
	     scalloped outline around the plaque, which is the border look this was
	     supposed to get away from. Blurring the union spreads one continuous
	     glow along the edge, which is what a line of fire actually casts. -->
	<filter id="flameGlow" x="-45%" y="-45%" width="190%" height="190%">
		<feGaussianBlur stdDeviation="16" result="blur"/>
		<feComponentTransfer in="blur" result="soft">
			<feFuncA type="linear" slope="0.5"/>
		</feComponentTransfer>
		<feMerge>
			<feMergeNode in="soft"/>
			<feMergeNode in="SourceGraphic"/>
		</feMerge>
	</filter>
	<filter id="grain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="17" result="t"/>
		<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.05 0.05 0.05 0 0"/>
	</filter>
</defs>
<!-- No halo behind the plate. A canvas-sized warm ellipse was tried at two
     strengths and both times it was the first thing the eye found: a solid
     orange field with the plaque cut out of it, which is not "flames around the
     border", it is a coloured background. The blurred deep flame layer already
     supplies the glow, and it supplies it where the fire actually is. -->
<!-- fire around the frame; behind the plate so it licks past the edges -->
${flames()}
<!-- plate -->
<rect x="${OX + 34}" y="${OY + 34}" width="${PLATE_W - 68}" height="${PLATE_H - 68}" rx="46" fill="url(#plate)" stroke="#17120a" stroke-width="8"/>
${finishRect(OX + 34, OY + 34, PLATE_W - 68, PLATE_H - 68, 46, 'sf', CANVAS_FINISH)}
<!-- brass frame -->
<rect x="${OX + 48}" y="${OY + 48}" width="${PLATE_W - 96}" height="${PLATE_H - 96}" rx="36" fill="none" stroke="url(#brass)" stroke-width="14"/>
<rect x="${OX + 64}" y="${OY + 64}" width="${PLATE_W - 128}" height="${PLATE_H - 128}" rx="26" fill="none" stroke="${rim}" stroke-width="3" opacity="0.8"/>
${rivets()}
<!-- dark centre well where the amount rolls -->
<rect x="${OX + 120}" y="${OY + 286}" width="${PLATE_W - 240}" height="170" rx="26" fill="url(#inner)"/>
<rect x="${OX + 120}" y="${OY + 286}" width="${PLATE_W - 240}" height="170" rx="26" fill="none" stroke="${rim}" stroke-width="3" opacity="0.55"/>
<!-- Tier name in the game's display face, matching the live Text on the bet bar
     and the amount that rolls in the well below. Titan One is single-weight, so
     no font-weight is requested — asking for 900 risks resvg failing the match
     and silently substituting a system face. -->
<text x="${OX + PLATE_W / 2 + 5}" y="${OY + 235}" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="#3a2408" opacity="0.55">${text}</text>
<text x="${OX + PLATE_W / 2}" y="${OY + 230}" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="url(#tierFace)" stroke="#54330a" stroke-width="7" paint-order="stroke">${text}</text>
</svg>`;

for (const [alias, tier] of Object.entries(TIERS)) {
	const resvg = new Resvg(banner(tier), {
		fitTo: { mode: 'width', value: W },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Titan One' },
	});
	fs.writeFileSync(path.join(OUT, `${alias}.png`), resvg.render().asPng());
	console.log('rendered', `${alias}.png`);
}
console.log('win banners written to', OUT);
