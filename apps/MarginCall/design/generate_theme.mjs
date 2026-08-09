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
const ICON_DIR = path.join(appRoot, 'static/assets/sprites/marginCallUiIcons');
const FX_DIR = path.join(appRoot, 'static/assets/sprites/marginCallFx');
for (const dir of [FRAME_DIR, UI_DIR, ICON_DIR, FX_DIR]) {
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
	let grid = '';
	for (let i = 1; i < 5; i++) {
		const x = WELL_X + (WELL / 5) * i;
		grid += `<path d="M ${x} ${WELL_X + 12} L ${x} ${WELL_X + WELL - 12}" stroke="${BULL}" stroke-width="2" opacity="0.10"/>`;
	}
	const defs = `
	<linearGradient id="well" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#0c1512"/><stop offset="1" stop-color="#050b09"/>
	</linearGradient>
	<radialGradient id="wellGlow" cx="0.5" cy="0.5" r="0.62">
		<stop offset="0" stop-color="${BULL}" stop-opacity="0.10"/>
		<stop offset="1" stop-color="${BULL}" stop-opacity="0"/>
	</radialGradient>`;
	const body = `
	<path d="${chamfer(WELL_X - 10, WELL_X - 10, WELL + 20, WELL + 20, 34)}" fill="url(#well)"/>
	<path d="${chamfer(WELL_X - 10, WELL_X - 10, WELL + 20, WELL + 20, 34)}" fill="url(#wellGlow)"/>
	${grid}`;
	return svg(F, F, body, defs);
};

// frame_edge is the bezel drawn OVER the reels: a ring, transparent in the
// middle, so it has to cover the well's rim without covering the symbols.
const frameEdge = () => {
	const outer = chamfer(30, 30, F - 60, F - 60, 56);
	const inner = chamfer(WELL_X - 6, WELL_X - 6, WELL + 12, WELL + 12, 32);
	const defs = panelDefs(BULL, 'E');
	const body = `
	<path d="${outer} ${inner}" fill-rule="evenodd" fill="url(#faceE)"/>
	<path d="${outer} ${inner}" fill-rule="evenodd" fill="none" stroke="${INK}" stroke-width="6"/>
	<path d="${inner}" fill="none" stroke="url(#edgeE)" stroke-width="7"/>
	<path d="${outer}" fill="none" stroke="${BULL}" stroke-width="3" opacity="0.45"/>
	${rivets(90, F - 90, 62, 74, BULL)}
	${rivets(90, F - 90, F - 62, 74, BULL)}
	<g fill="none" stroke="${BULL}" stroke-width="8" stroke-linecap="round" opacity="0.9">
		<path d="M ${WELL_X - 6} ${WELL_X + 70} L ${WELL_X - 6} ${WELL_X - 6} L ${WELL_X + 70} ${WELL_X - 6}"/>
		<path d="M ${WELL_X + WELL + 6} ${WELL_X + 70} L ${WELL_X + WELL + 6} ${WELL_X - 6} L ${WELL_X + WELL - 70} ${WELL_X - 6}"/>
		<path d="M ${WELL_X - 6} ${WELL_X + WELL - 70} L ${WELL_X - 6} ${WELL_X + WELL + 6} L ${WELL_X + 70} ${WELL_X + WELL + 6}"/>
		<path d="M ${WELL_X + WELL + 6} ${WELL_X + WELL - 70} L ${WELL_X + WELL + 6} ${WELL_X + WELL + 6} L ${WELL_X + WELL - 70} ${WELL_X + WELL + 6}"/>
	</g>`;
	return svg(F, F, body, defs);
};

// ─── free-spin plates ───────────────────────────────────────────────────────
const fsSign = () => {
	const w = 1280;
	const h = 1002;
	const defs = panelDefs(BULL, 'S');
	const body = `
	<path d="${chamfer(90, 300, w - 180, 400, 48)}" fill="url(#faceS)" stroke="${INK}" stroke-width="8"/>
	<path d="${chamfer(90, 300, w - 180, 400, 48)}" fill="none" stroke="${BULL}" stroke-width="5" opacity="0.85"/>
	<path d="M 130 380 L ${w - 130} 380" stroke="${BULL}" stroke-width="3" opacity="0.35"/>
	<path d="M 130 ${300 + 400 - 80} L ${w - 130} ${300 + 400 - 80}" stroke="${BULL}" stroke-width="3" opacity="0.35"/>
	<text x="${w / 2}" y="560" font-family="${FONT}" font-size="96" text-anchor="middle"
		fill="${BULL}" stroke="${INK}" stroke-width="6" paint-order="stroke">LIQUIDATION RUN</text>
	${rivets(150, w - 150, 330, 90, BULL)}
	${rivets(150, w - 150, 670, 90, BULL)}`;
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
