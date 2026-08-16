// Margin Call theme art: reel housing, UI plates, bet-bar icons and particles.
//
// Same trading-terminal language as the symbols (design/generate_symbols.mjs):
// graphite panels, chamfered corners, a thin phosphor edge light, and colour
// carrying the meaning. Everything is emitted at the dimensions the layout maths
// already assumes - the housing is 1280x1280 with the board occupying the centred
// 1000x1000 (BoardFrame's FRAME_SCALE) - so the art can be swapped without
// touching a single number in the components.
//
// Type is Titan One, the same self-hosted face the live Text nodes use
// (game/fonts.ts). Baked headline art and live Text have to be the same face or
// the join between them is visible.
//
// Usage: node design/generate_theme.mjs <dir containing node_modules with @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_theme.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(appRoot, 'static/fonts');
const FRAME_DIR = path.join(appRoot, 'static/assets/sprites/marginCallFrame');
const UI_DIR = path.join(appRoot, 'static/assets/sprites/marginCallUi');
const BANNER_DIR = path.join(appRoot, 'static/assets/sprites/marginCallWinBanners');
const ICON_DIR = path.join(appRoot, 'static/assets/sprites/marginCallUiIcons');
const FX_DIR = path.join(appRoot, 'static/assets/sprites/marginCallFx');
for (const dir of [FRAME_DIR, UI_DIR, BANNER_DIR, ICON_DIR, FX_DIR]) {
	fs.mkdirSync(dir, { recursive: true });
}

const FONT = 'Titan One';

// ─── palette (shared with generate_symbols.mjs) ─────────────────────────────
const BULL = '#4bd67f';
const BEAR = '#ff5566';
const AMBER = '#f7a83a';
const VIOLET = '#9b7bff';
const TEAL = '#3fd0d4';
const PANEL_HI = '#1b2721';
const PANEL_LO = '#080f0c';
const INK = '#050908';

const svg = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

const render = (source, outPath, width) => {
	const resvg = new Resvg(source, {
		fitTo: { mode: 'width', value: width },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: FONT },
	});
	fs.writeFileSync(outPath, resvg.render().asPng());
	console.log(`  ${path.basename(path.dirname(outPath))}/${path.basename(outPath)}  ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
};

// A chamfered rectangle - the corner cut is what makes a panel read as milled
// hardware rather than as a rounded-rect UI card.
const chamfer = (x, y, w, h, c) =>
	`M ${x + c} ${y} L ${x + w - c} ${y} L ${x + w} ${y + c} L ${x + w} ${y + h - c} ` +
	`L ${x + w - c} ${y + h} L ${x + c} ${y + h} L ${x} ${y + h - c} L ${x} ${y + c} Z`;

const panelDefs = (accent, id) => `
	<linearGradient id="face${id}" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="${PANEL_HI}"/><stop offset="1" stop-color="${PANEL_LO}"/>
	</linearGradient>
	<linearGradient id="edge${id}" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="${accent}" stop-opacity="0.95"/>
		<stop offset="1" stop-color="${accent}" stop-opacity="0.35"/>
	</linearGradient>`;

// Rivet ticks along an edge; hardware detail that survives being scaled down.
const rivets = (x0, x1, y, step, color) => {
	let out = '';
	for (let x = x0; x <= x1; x += step) {
		out += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" opacity="0.5"/>`;
	}
	return out;
};

// ─── reel housing ───────────────────────────────────────────────────────────
// frame_bg is what sits BEHIND the reels: the well the symbols fall into.
const F = 1280;
const WELL = 1000;
const WELL_X = (F - WELL) / 2;

const frameBg = () => {
	// The reel well. This used to be a flat fill with four hairlines across it and
	// a faint centre glow - the single largest area of the game and almost nothing
	// in it. Everything added here is about making the reels look like drums
	// sitting INSIDE a recess rather than symbols floating on a green square: a
	// cast shadow under the bezel lip, cylindrical shading per reel channel, and a
	// machined groove between them.
	const x0 = WELL_X - 10;
	const size = WELL + 20;
	const wellPath = chamfer(x0, x0, size, size, 34);
	const channel = WELL / 5;

	// grooves between reels: a dark cut with a lit lower lip, the way a milled
	// slot in a metal plate actually reads
	let grooves = '';
	for (let i = 1; i < 5; i++) {
		const x = WELL_X + channel * i;
		grooves +=
			`<path d="M ${x - 2} ${WELL_X + 6} L ${x - 2} ${WELL_X + WELL - 6}" stroke="#000000" stroke-width="5" opacity="0.55"/>` +
			`<path d="M ${x + 2.5} ${WELL_X + 6} L ${x + 2.5} ${WELL_X + WELL - 6}" stroke="${BULL}" stroke-width="1.6" opacity="0.16"/>`;
	}

	// each reel is a drum: darker at its edges, brightest down its centre line
	let drums = '';
	for (let i = 0; i < 5; i++) {
		const x = WELL_X + channel * i;
		drums += `<rect x="${x}" y="${WELL_X}" width="${channel}" height="${WELL}" fill="url(#drum)"/>`;
	}

	// fine scanlines - it is a terminal, and a bare gradient reads as paper
	let scan = '';
	for (let y = WELL_X; y < WELL_X + WELL; y += 4) {
		scan += `<rect x="${WELL_X}" y="${y}" width="${WELL}" height="1" fill="${BULL}" opacity="0.035"/>`;
	}

	const defs = `
	<linearGradient id="well" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0c1512"/><stop offset="1" stop-color="#050b09"/>
	</linearGradient>
	<radialGradient id="wellGlow" cx="0.5" cy="0.5" r="0.62">
		<stop offset="0" stop-color="${BULL}" stop-opacity="0.10"/>
		<stop offset="1" stop-color="${BULL}" stop-opacity="0"/>
	</radialGradient>
	<linearGradient id="drum" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#000000" stop-opacity="0.42"/>
		<stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.42"/>
	</linearGradient>
	<linearGradient id="lipTop" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#000000" stop-opacity="0.8"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0"/>
	</linearGradient>
	<linearGradient id="lipBottom" x1="0" y1="1" x2="0" y2="0">
		<stop offset="0" stop-color="#000000" stop-opacity="0.5"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0"/>
	</linearGradient>
	<linearGradient id="lipLeft" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#000000" stop-opacity="0.6"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0"/>
	</linearGradient>
	<linearGradient id="lipRight" x1="1" y1="0" x2="0" y2="0">
		<stop offset="0" stop-color="#000000" stop-opacity="0.6"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0"/>
	</linearGradient>
	<clipPath id="wellClip"><path d="${wellPath}"/></clipPath>`;

	const body = `
	<path d="${wellPath}" fill="url(#well)"/>
	<g clip-path="url(#wellClip)">
		${scan}
		${drums}
		<path d="${wellPath}" fill="url(#wellGlow)"/>
		${grooves}
		<!-- the bezel casts into the well: heaviest from above -->
		<rect x="${x0}" y="${x0}" width="${size}" height="90" fill="url(#lipTop)"/>
		<rect x="${x0}" y="${x0 + size - 60}" width="${size}" height="60" fill="url(#lipBottom)"/>
		<rect x="${x0}" y="${x0}" width="70" height="${size}" fill="url(#lipLeft)"/>
		<rect x="${x0 + size - 70}" y="${x0}" width="70" height="${size}" fill="url(#lipRight)"/>
	</g>`;
	return svg(F, F, body, defs);
};

// frame_edge is the bezel drawn OVER the reels: a ring, transparent in the
// middle, so it has to cover the well's rim without covering the symbols.
//
// Given the same treatment as the win plaques, and for the same reason: it was a
// flat plate with a thin stroke and flat dots for rivets. Brushed face, a lit top
// edge and a shadowed bottom one, domed rivets, corner bolts, and a glowing
// channel around the opening.
const frameEdge = () => {
	const outer = chamfer(30, 30, F - 60, F - 60, 56);
	const inner = chamfer(WELL_X - 6, WELL_X - 6, WELL + 12, WELL + 12, 32);

	let brushed = '';
	for (let y = 34; y < F - 34; y += 3) {
		const a = (y % 9 === 0 ? 0.05 : y % 6 === 0 ? 0.022 : 0.032).toFixed(3);
		brushed += `<rect x="30" y="${y}" width="${F - 60}" height="1.2" fill="#ffffff" opacity="${a}"/>`;
	}

	let rivetRow = '';
	for (let x = 90; x <= F - 90; x += 74) {
		rivetRow += rivetDome(x, 62, 9, BULL, 'E');
		rivetRow += rivetDome(x, F - 62, 9, BULL, 'E');
	}
	// bolts at the four chamfered corners, larger than the rivets
	let bolts = '';
	// Inboard of the chamfer. At 74 they straddled the corner cut and hung half
	// off the plate, which reads as a rendering error rather than as hardware.
	for (const [bx, by] of [[112, 112], [F - 112, 112], [112, F - 112], [F - 112, F - 112]]) {
		bolts += rivetDome(bx, by, 15, BULL, 'E');
	}

	const defs = `
	${panelDefs(BULL, 'E')}
	<linearGradient id="edgeFace" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#243530"/>
		<stop offset="0.4" stop-color="#131e1a"/>
		<stop offset="1" stop-color="#060c0a"/>
	</linearGradient>
	<linearGradient id="edgeSpec" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.12"/>
		<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.02"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</linearGradient>
	<radialGradient id="rivetE" cx="0.36" cy="0.32" r="0.75">
		<stop offset="0" stop-color="#cfe9da"/>
		<stop offset="0.55" stop-color="#5d7168"/>
		<stop offset="1" stop-color="#131c18"/>
	</radialGradient>
	<filter id="edgeBloom" x="-20%" y="-20%" width="140%" height="140%">
		<feGaussianBlur stdDeviation="10"/>
	</filter>
	<clipPath id="edgeClip"><path d="${outer} ${inner}" clip-rule="evenodd"/></clipPath>`;

	const body = `
	<path d="${outer} ${inner}" fill-rule="evenodd" fill="url(#edgeFace)"/>
	<g clip-path="url(#edgeClip)">
		${brushed}
		<rect x="30" y="30" width="${F - 60}" height="${F - 60}" fill="url(#edgeSpec)"/>
		<!-- bevel: light rolls over the top edge, shadow sits under the bottom -->
		<path d="${outer}" fill="none" stroke="#ffffff" stroke-width="7" opacity="0.14" transform="translate(0 6)"/>
		<path d="${outer}" fill="none" stroke="#000000" stroke-width="8" opacity="0.5" transform="translate(0 -7)"/>
		<path d="${inner}" fill="none" stroke="#000000" stroke-width="9" opacity="0.55" transform="translate(0 6)"/>
		<path d="${inner}" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.12" transform="translate(0 -6)"/>
	</g>
	<path d="${outer} ${inner}" fill-rule="evenodd" fill="none" stroke="${INK}" stroke-width="6"/>
	<!-- lit channel around the opening -->
	<path d="${inner}" fill="none" stroke="${BULL}" stroke-width="11" opacity="0.38" filter="url(#edgeBloom)"/>
	<path d="${inner}" fill="none" stroke="url(#edgeE)" stroke-width="7"/>
	<path d="${outer}" fill="none" stroke="${BULL}" stroke-width="3" opacity="0.45"/>
	${rivetRow}
	${bolts}
	<g fill="none" stroke="${BULL}" stroke-width="8" stroke-linecap="round" opacity="0.9">
		<path d="M ${WELL_X - 6} ${WELL_X + 70} L ${WELL_X - 6} ${WELL_X - 6} L ${WELL_X + 70} ${WELL_X - 6}"/>
		<path d="M ${WELL_X + WELL + 6} ${WELL_X + 70} L ${WELL_X + WELL + 6} ${WELL_X - 6} L ${WELL_X + WELL - 70} ${WELL_X - 6}"/>
		<path d="M ${WELL_X - 6} ${WELL_X + WELL - 70} L ${WELL_X - 6} ${WELL_X + WELL + 6} L ${WELL_X + 70} ${WELL_X + WELL + 6}"/>
		<path d="M ${WELL_X + WELL + 6} ${WELL_X + WELL - 70} L ${WELL_X + WELL + 6} ${WELL_X + WELL + 6} L ${WELL_X + WELL - 70} ${WELL_X + WELL + 6}"/>
	</g>`;
	return svg(F, F, body, defs);
};

// ─── free-spin plates ───────────────────────────────────────────────────────
// Deliberately textless. FreeSpinIntro draws FREE SPINS, the spin count and
// AWARDED on top of this, and a feature name baked into the plate sat straight
// under the number. The panel also fills most of the image now - it used to
// occupy 40% of the height while the text was laid out across 75% of it, so the
// words fell outside the plate they were supposed to be inside.
const FS_PANEL = { x: 40, y: 150, w: 1200, h: 700, r: 56 };

const fsSign = () => {
	const w = 1280;
	const h = 1002;
	const { x, y, w: pw, h: ph, r } = FS_PANEL;
	const panelPath = chamfer(x, y, pw, ph, r);

	// The readout the award is printed into. Sized to the text area
	// FreeSpinAnimation lays its children out in (0.84 x 0.58 of the sprite), so
	// the number lands inside a recess rather than on bare plate.
	const wellW = w * 0.84;
	const wellH = h * 0.58;
	const wellX = (w - wellW) / 2;
	const wellY = (h - wellH) / 2;
	const wellPath = chamfer(wellX, wellY, wellW, wellH, 34);

	let brushed = '';
	for (let by = y + 4; by < y + ph - 4; by += 3) {
		const a = (by % 9 === 0 ? 0.05 : by % 6 === 0 ? 0.022 : 0.032).toFixed(3);
		brushed += `<rect x="${x}" y="${by}" width="${pw}" height="1.2" fill="#ffffff" opacity="${a}"/>`;
	}

	let rivetRow = '';
	for (let rx = x + 70; rx <= x + pw - 70; rx += 96) {
		rivetRow += rivetDome(rx, y + 34, 11, BULL, 'S');
		rivetRow += rivetDome(rx, y + ph - 34, 11, BULL, 'S');
	}

	const defs = `
	${panelDefs(BULL, 'S')}
	<linearGradient id="fsFace" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#243530"/>
		<stop offset="0.42" stop-color="#131e1a"/>
		<stop offset="1" stop-color="#060c0a"/>
	</linearGradient>
	<linearGradient id="fsWell" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#000000"/>
		<stop offset="0.35" stop-color="#040907"/>
		<stop offset="1" stop-color="#0a1410"/>
	</linearGradient>
	<linearGradient id="fsSpec" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.13"/>
		<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.03"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</linearGradient>
	<radialGradient id="rivetS" cx="0.36" cy="0.32" r="0.75">
		<stop offset="0" stop-color="#cfe9da"/>
		<stop offset="0.55" stop-color="#5d7168"/>
		<stop offset="1" stop-color="#131c18"/>
	</radialGradient>
	<filter id="fsShadow" x="-25%" y="-25%" width="150%" height="150%">
		<feGaussianBlur stdDeviation="16"/>
	</filter>
	<filter id="fsBloom" x="-30%" y="-30%" width="160%" height="160%">
		<feGaussianBlur stdDeviation="11"/>
	</filter>
	<clipPath id="fsPanelClip"><path d="${panelPath}"/></clipPath>
	<clipPath id="fsWellClip"><path d="${wellPath}"/></clipPath>`;

	const body = `
	<path d="${panelPath}" fill="#000000" opacity="0.6" filter="url(#fsShadow)" transform="translate(0 12)"/>
	<path d="${panelPath}" fill="none" stroke="${BULL}" stroke-width="15" opacity="0.45" filter="url(#fsBloom)"/>
	<path d="${panelPath}" fill="url(#fsFace)"/>
	<g clip-path="url(#fsPanelClip)">
		${brushed}
		<rect x="${x}" y="${y}" width="${pw}" height="${ph}" fill="url(#fsSpec)"/>
		<path d="${panelPath}" fill="none" stroke="#ffffff" stroke-width="7" opacity="0.15" transform="translate(0 6)"/>
		<path d="${panelPath}" fill="none" stroke="#000000" stroke-width="8" opacity="0.5" transform="translate(0 -7)"/>
	</g>
	<path d="${panelPath}" fill="none" stroke="${INK}" stroke-width="8"/>
	<path d="${panelPath}" fill="none" stroke="${BULL}" stroke-width="6" opacity="0.9"/>
	<path d="M ${x + 50} ${y + 66} L ${x + pw - 50} ${y + 66}" stroke="${BULL}" stroke-width="3" opacity="0.3"/>
	<path d="M ${x + 50} ${y + ph - 66} L ${x + pw - 50} ${y + ph - 66}" stroke="${BULL}" stroke-width="3" opacity="0.3"/>

	<path d="${wellPath}" fill="url(#fsWell)"/>
	<g clip-path="url(#fsWellClip)">
		<rect x="${wellX}" y="${wellY}" width="${wellW}" height="18" fill="#000000" opacity="0.75"/>
		<rect x="${wellX}" y="${wellY + wellH - 6}" width="${wellW}" height="6" fill="${BULL}" opacity="0.28"/>
	</g>
	<path d="${wellPath}" fill="none" stroke="#000000" stroke-width="7" opacity="0.55"/>
	<path d="${wellPath}" fill="none" stroke="${BULL}" stroke-width="3" opacity="0.7"/>

	${rivetRow}`;
	return svg(w, h, body, defs);
};


const fsCounterPanel = () => {
	const w = 1280;
	const h = 966;
	const defs = panelDefs(BULL, 'C');
	const body = `
	<path d="${chamfer(120, 150, w - 240, h - 300, 54)}" fill="url(#faceC)" stroke="${INK}" stroke-width="10"/>
	<path d="${chamfer(120, 150, w - 240, h - 300, 54)}" fill="none" stroke="${BULL}" stroke-width="5" opacity="0.8"/>
	<path d="${chamfer(180, 400, w - 360, 300, 32)}" fill="#050b09" opacity="0.75"/>
	${rivets(190, w - 190, 200, 96, BULL)}`;
	return svg(w, h, body, defs);
};

// ─── bet-bar plates ─────────────────────────────────────────────────────────
const tickerPlate = () => {
	const w = 652;
	const h = 146;
	const defs = panelDefs(BULL, 'T');
	const body = `
	<path d="${chamfer(6, 10, w - 12, h - 20, 22)}" fill="url(#faceT)" stroke="${INK}" stroke-width="5"/>
	<path d="${chamfer(6, 10, w - 12, h - 20, 22)}" fill="none" stroke="${BULL}" stroke-width="3" opacity="0.75"/>
	<path d="M 26 ${h / 2} L ${w - 26} ${h / 2}" stroke="${BULL}" stroke-width="1.5" opacity="0.14"/>`;
	return svg(w, h, body, defs);
};

const buyBonusPlate = () => {
	const s = 640;
	const defs = panelDefs(AMBER, 'B');
	const body = `
	<path d="${chamfer(24, 24, s - 48, s - 48, 44)}" fill="url(#faceB)" stroke="${INK}" stroke-width="8"/>
	<path d="${chamfer(24, 24, s - 48, s - 48, 44)}" fill="none" stroke="${AMBER}" stroke-width="5" opacity="0.9"/>
	<path d="${chamfer(58, 58, s - 116, s - 116, 30)}" fill="none" stroke="${AMBER}" stroke-width="2" opacity="0.35"/>
	${rivets(90, s - 90, 74, 92, AMBER)}
	${rivets(90, s - 90, s - 74, 92, AMBER)}`;
	return svg(s, s, body, defs);
};

// ─── win banners ────────────────────────────────────────────────────────────
// Not generated. The five tier frames in static/assets/sprites/marginCallWinBanners
// are supplied art; their inner wells are measured by design/measure_banner_wells.mjs
// and the numbers live in constants.ts (WIN_BANNERS). A generator here would
// overwrite them on the next run.

// ─── win banners ────────────────────────────────────────────────────────────
// Five escalating alert plaques in the game's own language: a graphite panel
// with a dark readout well, phosphor edge light, rivets, and progressively more
// hardware bolted to it as the tier climbs. The top tier is the MARGIN CALL
// itself - klaxon lamps and alert bars, in the same red as the scatter.
//
// Nothing is baked in. Win.svelte draws the tier label and the amount live into
// the well, so the wells are declared here and mirrored in constants.ts
// (WIN_BANNERS). design/measure_banner_wells.mjs re-derives them from the PNGs
// and is the check that the two have not drifted.
//
// The well shrinks as a fraction of the image as the tier climbs, which is what
// makes the higher tiers physically bigger on screen: Win.svelte draws every
// well at the same width, so more decoration around the same readout means a
// larger plaque.
const BANNER_TIERS = [
	{ name: 'tier1', w: 1000, h: 360, well: { w: 0.76, h: 0.5 }, accent: BULL, wings: 0, lamps: 0 },
	{ name: 'tier2', w: 1000, h: 380, well: { w: 0.72, h: 0.46 }, accent: TEAL, wings: 1, lamps: 0 },
	{ name: 'tier3', w: 1000, h: 420, well: { w: 0.68, h: 0.42 }, accent: AMBER, wings: 2, lamps: 0 },
	{ name: 'tier4', w: 1000, h: 450, well: { w: 0.64, h: 0.38 }, accent: VIOLET, wings: 3, lamps: 2 },
	{ name: 'tier5', w: 1000, h: 500, well: { w: 0.6, h: 0.34 }, accent: BEAR, wings: 4, lamps: 4 },
];

// A candlestick, the game's own motif, used as the decoration that grows with
// the tier rather than a generic spike or flame.
const candle = (x, cy, h, color, up) => `
	<path d="M ${x} ${cy - h * 0.78} L ${x} ${cy + h * 0.78}" stroke="${color}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
	<rect x="${x - 13}" y="${cy - h * 0.42}" width="26" height="${h * 0.84}" rx="5"
		fill="${color}" opacity="${up ? 0.34 : 0.2}"/>
	<rect x="${x - 13}" y="${cy - h * 0.42}" width="26" height="${h * 0.84}" rx="5"
		fill="none" stroke="${color}" stroke-width="5"/>`;

// A rivet drawn as a dome rather than a disc: a lit cap offset up-left, a
// shadowed underside, and a seated ring. At plaque size this is the difference
// between "a circle" and "a piece of hardware".
const rivetDome = (cx, cy, r, accent, id) => `
	<circle cx="${cx}" cy="${cy + r * 0.16}" r="${r}" fill="#000000" opacity="0.55"/>
	<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rivet${id})"/>
	<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>
	<circle cx="${cx - r * 0.3}" cy="${cy - r * 0.34}" r="${r * 0.34}" fill="#ffffff" opacity="0.5"/>`;

const winBanner = (tier) => {
	const { w, h, accent } = tier;
	const wellW = w * tier.well.w;
	const wellH = h * tier.well.h;
	const wellX = (w - wellW) / 2;
	const wellY = (h - wellH) / 2;

	// Panel geometry is UNCHANGED from the flat version, and deliberately so:
	// src/game/constants.ts WIN_BANNERS carries the measured well for each tier
	// and Win.svelte lays the label and the amount out inside it. Re-proportioning
	// the plaque here would silently push that text over its own border.
	const padX = 46;
	const padY = 34;
	const panelX = wellX - padX;
	const panelY = wellY - padY;
	const panelW = wellW + padX * 2;
	const panelH = wellH + padY * 2;
	const chamferR = 40;
	const panelPath = chamfer(panelX, panelY, panelW, panelH, chamferR);
	const wellPath = chamfer(wellX, wellY, wellW, wellH, 24);

	let wings = '';
	for (let i = 0; i < tier.wings; i++) {
		const gap = 34;
		const height = panelH * (0.86 - i * 0.13);
		const left = panelX - gap * (i + 1) - 18 * i;
		const right = panelX + panelW + gap * (i + 1) + 18 * i;
		wings += candle(left, h / 2, height, accent, i % 2 === 0);
		wings += candle(right, h / 2, height, accent, i % 2 === 1);
	}

	// Lamps live on the LEFT and RIGHT edges, not along the top and bottom.
	// They used to share those edges with the rivet rows and merged into them:
	// on tier5 the result was a line of hardware with four indeterminate white
	// blobs in it. The side edges are empty, so a lamp there reads as a lamp.
	let lamps = '';
	const perSide = Math.max(1, Math.round(tier.lamps / 2));
	for (let i = 0; i < perSide; i++) {
		const ly =
			perSide === 1
				? panelY + panelH / 2
				: panelY + panelH * (0.3 + 0.4 * (i / (perSide - 1)));
		for (const lx of [panelX + 15, panelX + panelW - 15]) {
			lamps += `<circle cx="${lx}" cy="${ly}" r="26" fill="${accent}" opacity="0.18"/>`;
			lamps += `<circle cx="${lx}" cy="${ly}" r="12" fill="${accent}" opacity="0.6"/>`;
			lamps += `<circle cx="${lx}" cy="${ly}" r="6" fill="#ffffff" opacity="0.92"/>`;
		}
	}

	// Brushed metal. Fine horizontal streaks at very low alpha, clipped to the
	// panel: the face used to be a plain two-stop gradient, which is the single
	// biggest reason it read as a vector shape rather than as a milled plate.
	let brushed = '';
	for (let y = panelY + 4; y < panelY + panelH - 4; y += 3) {
		const a = (y % 9 === 0 ? 0.045 : y % 6 === 0 ? 0.02 : 0.03).toFixed(3);
		brushed += `<rect x="${panelX}" y="${y}" width="${panelW}" height="1.2" fill="#ffffff" opacity="${a}"/>`;
	}

	let rivets = '';
	for (let x = panelX + 56; x <= panelX + panelW - 56; x += 78) {
		rivets += rivetDome(x, panelY + 17, 7, accent, 'B');
		rivets += rivetDome(x, panelY + panelH - 17, 7, accent, 'B');
	}

	const defs = `
	${panelDefs(accent, 'B')}
	<radialGradient id="bHalo" cx="0.5" cy="0.5" r="0.6">
		<stop offset="0" stop-color="${accent}" stop-opacity="0.4"/>
		<stop offset="1" stop-color="${accent}" stop-opacity="0"/>
	</radialGradient>
	<!-- face: lit from above, so the top of the plate is the light one -->
	<linearGradient id="bFace" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#2b3c34"/>
		<stop offset="0.42" stop-color="#16211c"/>
		<stop offset="1" stop-color="#070d0a"/>
	</linearGradient>
	<!-- the well is a recess: dark at the top where the lip shades it -->
	<linearGradient id="bWell" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#000000"/>
		<stop offset="0.35" stop-color="#040907"/>
		<stop offset="1" stop-color="#0a1410"/>
	</linearGradient>
	<linearGradient id="bSpec" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
		<stop offset="0.45" stop-color="#ffffff" stop-opacity="0.03"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</linearGradient>
	<radialGradient id="rivetB" cx="0.36" cy="0.32" r="0.75">
		<stop offset="0" stop-color="#cfe9da"/>
		<stop offset="0.55" stop-color="#5d7168"/>
		<stop offset="1" stop-color="#131c18"/>
	</radialGradient>
	<filter id="bShadow" x="-25%" y="-25%" width="150%" height="150%">
		<feGaussianBlur stdDeviation="14"/>
	</filter>
	<filter id="bBloom" x="-40%" y="-40%" width="180%" height="180%">
		<feGaussianBlur stdDeviation="9"/>
	</filter>
	<clipPath id="bPanelClip"><path d="${panelPath}"/></clipPath>
	<clipPath id="bWellClip"><path d="${wellPath}"/></clipPath>`;

	const body = `
	<rect width="${w}" height="${h}" fill="url(#bHalo)"/>
	${wings}

	<!-- the plate casts a shadow, which is what seats it in front of the halo -->
	<path d="${panelPath}" fill="#000000" opacity="0.65" filter="url(#bShadow)" transform="translate(0 10)"/>

	<!-- accent bloom bleeding off the edge, under the plate -->
	<path d="${panelPath}" fill="none" stroke="${accent}" stroke-width="14" opacity="0.5" filter="url(#bBloom)"/>

	<path d="${panelPath}" fill="url(#bFace)"/>
	<g clip-path="url(#bPanelClip)">
		${brushed}
		<!-- broad specular across the upper left -->
		<rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" fill="url(#bSpec)"/>
		<!-- inner bevel: light along the top lip, dark along the bottom -->
		<path d="${panelPath}" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.16" transform="translate(0 5)"/>
		<path d="${panelPath}" fill="none" stroke="#000000" stroke-width="7" opacity="0.5" transform="translate(0 -6)"/>
	</g>
	<path d="${panelPath}" fill="none" stroke="${INK}" stroke-width="9"/>
	<path d="${panelPath}" fill="none" stroke="${accent}" stroke-width="5" opacity="0.95"/>
	<!-- rim light on the top edge only, so the plate has a lit side -->
	<path d="${panelPath}" fill="none" stroke="#eafff2" stroke-width="2" opacity="0.5"
		stroke-dasharray="${panelW * 0.62} ${panelW * 4}" stroke-dashoffset="${-chamferR - panelW * 0.19}"/>

	${lamps}

	<!-- the well, cut INTO the plate: lip shadow inside the top, light at the foot -->
	<path d="${wellPath}" fill="url(#bWell)"/>
	<g clip-path="url(#bWellClip)">
		<rect x="${wellX}" y="${wellY}" width="${wellW}" height="16" fill="#000000" opacity="0.75"/>
		<rect x="${wellX}" y="${wellY + wellH - 5}" width="${wellW}" height="5" fill="${accent}" opacity="0.3"/>
	</g>
	<path d="${wellPath}" fill="none" stroke="#000000" stroke-width="7" opacity="0.6"/>
	<path d="${wellPath}" fill="none" stroke="${accent}" stroke-width="3.5" opacity="0.8"/>

	${rivets}

	<g fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round">
		<path d="M ${wellX - 14} ${wellY + 34} L ${wellX - 14} ${wellY - 14} L ${wellX + 34} ${wellY - 14}"/>
		<path d="M ${wellX + wellW + 14} ${wellY + 34} L ${wellX + wellW + 14} ${wellY - 14} L ${wellX + wellW - 34} ${wellY - 14}"/>
		<path d="M ${wellX - 14} ${wellY + wellH - 34} L ${wellX - 14} ${wellY + wellH + 14} L ${wellX + 34} ${wellY + wellH + 14}"/>
		<path d="M ${wellX + wellW + 14} ${wellY + wellH - 34} L ${wellX + wellW + 14} ${wellY + wellH + 14} L ${wellX + wellW - 34} ${wellY + wellH + 14}"/>
	</g>`;

	return svg(w, h, body, defs);
};

// ─── bet-bar icons ──────────────────────────────────────────────────────────
// Line glyphs on a transparent ground, drawn at 256 so they stay crisp on a
// retina bar. Stroke-only: a filled icon at bar size turns into a blob.
const I = 256;
const icon = (body, color = BULL) =>
	svg(
		I,
		I,
		`<g fill="none" stroke="${color}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">${body}</g>`,
	);

const ICONS = {
	// circular arrow: the spin
	spin: icon(`
		<path d="M 204 128 A 76 76 0 1 1 172 66"/>
		<path d="M 176 34 L 176 74 L 136 74"/>`),
	decrease: icon(`
		<path d="M 44 60 L 212 60 L 212 196 L 44 196 Z"/>
		<path d="M 88 128 L 168 128"/>`),
	increase: icon(`
		<path d="M 44 60 L 212 60 L 212 196 L 44 196 Z"/>
		<path d="M 88 128 L 168 128"/><path d="M 128 88 L 128 168"/>`),
	menu: icon(`
		<path d="M 52 84 L 204 84"/><path d="M 52 128 L 204 128"/><path d="M 52 172 L 204 172"/>`),
	menuExit: icon(`<path d="M 72 72 L 184 184"/><path d="M 184 72 L 72 184"/>`),
	settings: icon(`
		<circle cx="128" cy="128" r="38"/>
		<path d="M 128 40 L 128 66"/><path d="M 128 190 L 128 216"/>
		<path d="M 40 128 L 66 128"/><path d="M 190 128 L 216 128"/>
		<path d="M 66 66 L 84 84"/><path d="M 172 172 L 190 190"/>
		<path d="M 190 66 L 172 84"/><path d="M 84 172 L 66 190"/>`),
	info: icon(`
		<circle cx="128" cy="128" r="86"/>
		<path d="M 128 116 L 128 176"/><path d="M 128 80 L 128 88"/>`),
	// stacked rows: the pay table
	payTable: icon(`
		<path d="M 48 56 L 208 56 L 208 200 L 48 200 Z"/>
		<path d="M 48 104 L 208 104"/><path d="M 48 152 L 208 152"/>
		<path d="M 128 56 L 128 200"/>`),
	soundOn: icon(`
		<path d="M 60 100 L 100 100 L 144 60 L 144 196 L 100 156 L 60 156 Z"/>
		<path d="M 176 96 A 48 48 0 0 1 176 160"/>
		<path d="M 202 72 A 84 84 0 0 1 202 184"/>`),
	soundOff: icon(`
		<path d="M 60 100 L 100 100 L 144 60 L 144 196 L 100 156 L 60 156 Z"/>
		<path d="M 176 100 L 224 156"/><path d="M 224 100 L 176 156"/>`),
	// circular arrow with a count dot: auto spin
	autoSpin: icon(`
		<path d="M 204 128 A 76 76 0 1 1 172 66"/>
		<path d="M 176 34 L 176 74 L 136 74"/>
		<circle cx="128" cy="128" r="14"/>`),
	// counter-clockwise arrow: replay
	replay: icon(`
		<path d="M 52 128 A 76 76 0 1 0 84 66"/>
		<path d="M 80 34 L 80 74 L 120 74"/>`),
	turbo: icon(`<path d="M 148 36 L 84 138 L 128 138 L 108 220 L 176 114 L 130 114 Z"/>`, AMBER),
};

// ─── particle textures ──────────────────────────────────────────────────────
// Every particle in the game is one of these, tinted and (mostly) drawn
// additively, so they are painted white with a soft falloff and carry no colour
// of their own. Hard-edged vector shapes read as stamped stickers once they are
// scaled up; a gradient falloff is what makes them look like light.
const FX = {
	fx_glow: svg(
		256,
		256,
		'<circle cx="128" cy="128" r="128" fill="url(#g)"/>',
		`<radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#fff" stop-opacity="1"/>
			<stop offset="0.45" stop-color="#fff" stop-opacity="0.35"/>
			<stop offset="1" stop-color="#fff" stop-opacity="0"/>
		</radialGradient>`,
	),
	fx_star: svg(
		256,
		256,
		`<path d="M 128 8 Q 140 116 248 128 Q 140 140 128 248 Q 116 140 8 128 Q 116 116 128 8 Z" fill="url(#g)"/>`,
		`<radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#fff" stop-opacity="1"/>
			<stop offset="0.6" stop-color="#fff" stop-opacity="0.6"/>
			<stop offset="1" stop-color="#fff" stop-opacity="0"/>
		</radialGradient>`,
	),
	fx_streak: svg(
		256,
		64,
		'<rect width="256" height="64" fill="url(#g)"/>',
		`<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#fff" stop-opacity="0"/>
			<stop offset="0.5" stop-color="#fff" stop-opacity="0.95"/>
			<stop offset="1" stop-color="#fff" stop-opacity="0"/>
		</linearGradient>`,
	),
	// A candlestick shard, so the debris thrown by a blast belongs to this game
	// rather than being generic sparks.
	fx_tick: svg(
		256,
		256,
		`<g fill="#fff">
			<rect x="112" y="20" width="32" height="216" rx="14" opacity="0.55"/>
			<rect x="64" y="76" width="128" height="104" rx="22"/>
		</g>`,
	),
	fx_vignette: svg(
		512,
		512,
		'<rect width="512" height="512" fill="url(#g)"/>',
		`<radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0.55" stop-color="#000" stop-opacity="0"/>
			<stop offset="1" stop-color="#000" stop-opacity="0.85"/>
		</radialGradient>`,
	),
};

// ─── store thumbnail ────────────────────────────────────────────────────────
// The LEVERAGE mark, duplicated from generate_symbols.mjs rather than imported.
// That file does its rendering at module scope and exits if it is not handed a
// resvg directory, so importing it here would run the whole symbol set as a side
// effect. Twelve lines of path data is the cheaper problem — but if the W symbol
// is redesigned, this has to follow it.
const LEVERAGE_MARK = `
	<path d="M 128 40 L 200 82 L 200 166 L 128 208 L 56 166 L 56 82 Z"
		fill="none" stroke="${BULL}" stroke-width="10" stroke-linejoin="round"/>
	<path d="M 128 40 L 200 82 L 200 166 L 128 208 L 56 166 L 56 82 Z" fill="${BULL}" opacity="0.12"/>
	<g stroke="${BULL}" stroke-width="16" stroke-linecap="round">
		<path d="M 100 100 L 156 152"/><path d="M 156 100 L 100 152"/>
	</g>
	<path d="M 74 178 L 182 178" stroke="${BULL}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
	<circle cx="160" cy="178" r="12" fill="${BULL}"/>`;

// 408x546 portrait, matching the other games in the repo. This is the only
// image most players ever see before deciding whether to open the game, so it
// states the three things that decide that: what it is called, how wide the
// board gets, and what the cap is.
const thumbnail = () => {
	const w = 408;
	const h = 546;
	const defs = `
	${panelDefs(BULL, 'TH')}
	<linearGradient id="thBg" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0b1512"/>
		<stop offset="0.6" stop-color="#060d0a"/>
		<stop offset="1" stop-color="#030706"/>
	</linearGradient>
	<radialGradient id="thPool" cx="0.5" cy="0.36" r="0.62">
		<stop offset="0" stop-color="${BULL}" stop-opacity="0.30"/>
		<stop offset="1" stop-color="${BULL}" stop-opacity="0"/>
	</radialGradient>
	<linearGradient id="thTitle" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff"/>
		<stop offset="0.5" stop-color="${BULL}"/>
		<stop offset="1" stop-color="#1f8f52"/>
	</linearGradient>`;

	// A small candle series behind the mark, same construction as the in-game
	// backdrop so the store art and the game agree.
	let seed2 = 11;
	const r = () => ((seed2 = (seed2 * 1103515245 + 12345) % 2147483648) / 2147483648);
	let candles = '';
	let level = 250;
	for (let x = 10; x < w; x += 26) {
		const delta = (r() - 0.45) * 90;
		const top = Math.max(70, Math.min(330, level + Math.min(delta, 0)));
		const bot = Math.max(110, Math.min(370, level + Math.max(delta, 0) + 24));
		const color = delta <= 0 ? BULL : BEAR;
		candles += `<path d="M ${x + 7} ${top - 14} L ${x + 7} ${bot + 14}" stroke="${color}" stroke-width="2" opacity="0.22"/>`;
		candles += `<rect x="${x}" y="${top}" width="14" height="${Math.max(10, bot - top)}" rx="3" fill="${color}" opacity="0.18"/>`;
		level = (top + bot) / 2;
	}

	const body = `
	<rect width="${w}" height="${h}" fill="url(#thBg)"/>
	${candles}
	<rect width="${w}" height="${h}" fill="url(#thPool)"/>

	<g transform="translate(${w / 2 - 88} 96) scale(0.69)">
		${LEVERAGE_MARK}
	</g>

	<text x="${w / 2}" y="392" font-family="${FONT}" font-size="46" text-anchor="middle"
		fill="url(#thTitle)" stroke="${INK}" stroke-width="5" paint-order="stroke">MARGIN</text>
	<text x="${w / 2}" y="440" font-family="${FONT}" font-size="46" text-anchor="middle"
		fill="url(#thTitle)" stroke="${INK}" stroke-width="5" paint-order="stroke">CALL</text>

	<path d="${chamfer(48, 464, w - 96, 52, 14)}" fill="url(#faceTH)" stroke="${BULL}" stroke-width="2.5"/>
	<text x="${w / 2}" y="490" font-family="${FONT}" font-size="19" text-anchor="middle" fill="${BULL}">3,125 WAYS</text>
	<text x="${w / 2}" y="509" font-family="${FONT}" font-size="15" text-anchor="middle" fill="#a8f0c4">MAX 12,000x</text>`;

	return svg(w, h, body, defs);
};

// ─── render everything ──────────────────────────────────────────────────────
console.log('housing');
render(frameBg(), path.join(FRAME_DIR, 'frame_bg.png'), F);
render(frameEdge(), path.join(FRAME_DIR, 'frame_edge.png'), F);
render(fsSign(), path.join(FRAME_DIR, 'fs_sign.png'), 1280);
render(fsCounterPanel(), path.join(FRAME_DIR, 'fs_counter_panel.png'), 1280);

console.log('bet bar');
render(tickerPlate(), path.join(UI_DIR, 'ticker_plate.png'), 652);
render(buyBonusPlate(), path.join(UI_DIR, 'buybonus_plate.png'), 640);

console.log('win banners');
for (const tier of BANNER_TIERS) {
	render(winBanner(tier), path.join(BANNER_DIR, `${tier.name}.png`), tier.w);
}

console.log('icons');
for (const [name, source] of Object.entries(ICONS)) {
	render(source, path.join(ICON_DIR, `${name}.png`), I);
}

console.log('particles');
for (const [name, source] of Object.entries(FX)) {
	render(source, path.join(FX_DIR, `${name}.png`), name === 'fx_vignette' ? 512 : 256);
}

console.log('thumbnail');
render(thumbnail(), path.join(appRoot, 'Thumbnail_MarginCall.png'), 408);
