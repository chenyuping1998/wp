// Margin Call symbol + background art.
//
// Trading-terminal aesthetic: every symbol sits on the same dark key-cap tile
// with a coloured bevel, so the set reads as one system and rank is carried by
// the accent colour and the mark rather than by wildly different silhouettes.
// Shapes are drawn as paths rather than glyphs so nothing depends on a font
// being installed where this runs.
//
// Usage: node design/generate_symbols.mjs <dir containing node_modules with @resvg/resvg-js>
//   e.g. node design/generate_symbols.mjs E:/stake/tools/gen
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_symbols.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYM_DIR = path.join(appRoot, 'static/assets/sprites/marginCallSymbols');
const BG_DIR = path.join(appRoot, 'static/assets/sprites/marginCallBackground');
fs.mkdirSync(SYM_DIR, { recursive: true });
fs.mkdirSync(BG_DIR, { recursive: true });

const S = 256; // symbol canvas

// ─── palette ────────────────────────────────────────────────────────────────
const BULL = '#4bd67f';
const BEAR = '#ff5566';
const AMBER = '#f7a83a';
const VIOLET = '#9b7bff';
const TEAL = '#3fd0d4';
const INK = '#060b09';
const CAP_TOP = '#16211c';
const CAP_BOT = '#0a110e';

const svg = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

// The shared key cap. `accent` tints the bevel and the inner glow, which is what
// separates a premium from a low pay at a glance.
const cap = (accent, inner) => {
	const defs = `
	<linearGradient id="capFace" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="${CAP_TOP}"/><stop offset="1" stop-color="${CAP_BOT}"/>
	</linearGradient>
	<radialGradient id="capGlow" cx="0.5" cy="0.42" r="0.62">
		<stop offset="0" stop-color="${accent}" stop-opacity="0.30"/>
		<stop offset="1" stop-color="${accent}" stop-opacity="0"/>
	</radialGradient>`;
	const body = `
	<rect x="16" y="16" width="224" height="224" rx="34" fill="${INK}" opacity="0.9"/>
	<rect x="20" y="20" width="216" height="216" rx="30" fill="url(#capFace)"/>
	<rect x="20" y="20" width="216" height="216" rx="30" fill="url(#capGlow)"/>
	<rect x="20" y="20" width="216" height="216" rx="30" fill="none" stroke="${accent}" stroke-width="4" opacity="0.85"/>
	<path d="M 34 46 Q 34 34 46 34 L 210 34" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.10"/>
	${inner}`;
	return { defs, body };
};

const build = (accent, inner) => {
	const { defs, body } = cap(accent, inner);
	return svg(S, S, body, defs);
};

// ─── marks ──────────────────────────────────────────────────────────────────
// Bull: blunt head, horns sweeping up and out. Bear: rounded head, small ears,
// heavy muzzle. Both are read at 104px on the board, so detail below ~6px is
// wasted and deliberately absent.
const bull = `
	<g fill="none" stroke="${BULL}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
		<path d="M 74 104 Q 56 74 74 62 Q 92 58 100 84"/>
		<path d="M 182 104 Q 200 74 182 62 Q 164 58 156 84"/>
		<path d="M 98 92 Q 128 80 158 92 L 168 140 Q 128 176 88 140 Z"/>
	</g>
	<circle cx="110" cy="118" r="7" fill="${BULL}"/>
	<circle cx="146" cy="118" r="7" fill="${BULL}"/>
	<path d="M 118 150 Q 128 158 138 150" fill="none" stroke="${BULL}" stroke-width="8" stroke-linecap="round"/>
	<path d="M 96 186 L 128 208 L 160 186" fill="none" stroke="${BULL}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>`;

const bear = `
	<g fill="none" stroke="${BEAR}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="86" cy="80" r="20"/>
		<circle cx="170" cy="80" r="20"/>
		<path d="M 82 112 Q 128 84 174 112 Q 186 150 152 168 L 104 168 Q 70 150 82 112 Z"/>
	</g>
	<circle cx="108" cy="126" r="7" fill="${BEAR}"/>
	<circle cx="148" cy="126" r="7" fill="${BEAR}"/>
	<ellipse cx="128" cy="150" rx="13" ry="9" fill="${BEAR}"/>
	<path d="M 96 190 L 128 212 L 160 190" fill="none" stroke="${BEAR}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.55" transform="rotate(180 128 201)"/>`;

// Bitcoin: coin disc plus a B built from two lobes and the two stems, drawn as
// paths so no font is required.
const btc = `
	<circle cx="128" cy="128" r="66" fill="none" stroke="${AMBER}" stroke-width="11"/>
	<g stroke="${AMBER}" stroke-width="12" stroke-linecap="round">
		<path d="M 116 72 L 116 90"/><path d="M 140 72 L 140 90"/>
		<path d="M 116 166 L 116 184"/><path d="M 140 166 L 140 184"/>
	</g>
	<path d="M 104 92 L 104 164 L 142 164 Q 166 164 166 146 Q 166 130 146 128 Q 164 126 164 110 Q 164 92 142 92 Z"
		fill="none" stroke="${AMBER}" stroke-width="12" stroke-linejoin="round"/>`;

// Ethereum: the octahedron, upper and lower halves.
const eth = `
	<g fill="none" stroke="${VIOLET}" stroke-width="10" stroke-linejoin="round">
		<path d="M 128 46 L 182 130 L 128 160 L 74 130 Z"/>
		<path d="M 128 176 L 182 144 L 128 212 L 74 144 Z"/>
	</g>
	<path d="M 128 46 L 128 160" stroke="${VIOLET}" stroke-width="6" opacity="0.6"/>`;

// A banded bundle of notes.
const bundle = `
	<g stroke="${TEAL}" stroke-width="9" fill="none" stroke-linejoin="round">
		<rect x="52" y="150" width="152" height="46" rx="8"/>
		<rect x="60" y="116" width="136" height="42" rx="8"/>
		<rect x="68" y="84" width="120" height="40" rx="8"/>
	</g>
	<rect x="112" y="76" width="32" height="128" rx="6" fill="${TEAL}" opacity="0.28"/>
	<circle cx="128" cy="104" r="13" fill="none" stroke="${TEAL}" stroke-width="7"/>`;

// Candlesticks. The low pays are the bulk of every board, so they stay simple
// enough to read instantly at speed.
const candle = (color, up) => {
	const bodyY = up ? 96 : 120;
	const wickTop = up ? 56 : 48;
	const wickBot = up ? 208 : 200;
	return `
	<path d="M 128 ${wickTop} L 128 ${wickBot}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
	<rect x="88" y="${bodyY}" width="80" height="64" rx="8" fill="${color}" opacity="0.30"/>
	<rect x="88" y="${bodyY}" width="80" height="64" rx="8" fill="none" stroke="${color}" stroke-width="10"/>`;
};

const arrow = (color, up) => {
	const trend = up
		? 'M 58 178 L 100 142 L 132 162 L 196 84'
		: 'M 58 84 L 100 122 L 132 100 L 196 178';
	const head = up
		? 'M 164 84 L 200 84 L 200 120'
		: 'M 164 178 L 200 178 L 200 142';
	return `
	<path d="${trend}" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
	<path d="${head}" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>`;
};

// LEVERAGE (Wild): a multiplier cross inside a hex badge, with the slider that
// gives the mechanic its name running under it.
const leverage = `
	<path d="M 128 40 L 200 82 L 200 166 L 128 208 L 56 166 L 56 82 Z"
		fill="none" stroke="${BULL}" stroke-width="10" stroke-linejoin="round"/>
	<path d="M 128 40 L 200 82 L 200 166 L 128 208 L 56 166 L 56 82 Z" fill="${BULL}" opacity="0.12"/>
	<g stroke="${BULL}" stroke-width="16" stroke-linecap="round">
		<path d="M 100 100 L 156 152"/><path d="M 156 100 L 100 152"/>
	</g>
	<path d="M 74 178 L 182 178" stroke="${BULL}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
	<circle cx="160" cy="178" r="12" fill="${BULL}"/>`;

// MARGIN CALL (Scatter): the alarm. Radiating arcs so it reads as an alert even
// in peripheral vision when two are already on the board.
const alarm = `
	<path d="M 84 156 Q 84 82 128 82 Q 172 82 172 156 L 182 172 L 74 172 Z"
		fill="${BEAR}" opacity="0.16"/>
	<path d="M 84 156 Q 84 82 128 82 Q 172 82 172 156 L 182 172 L 74 172 Z"
		fill="none" stroke="${BEAR}" stroke-width="11" stroke-linejoin="round"/>
	<path d="M 128 62 L 128 82" stroke="${BEAR}" stroke-width="10" stroke-linecap="round"/>
	<path d="M 112 186 Q 128 202 144 186" fill="none" stroke="${BEAR}" stroke-width="11" stroke-linecap="round"/>
	<g fill="none" stroke="${BEAR}" stroke-width="8" stroke-linecap="round" opacity="0.75">
		<path d="M 48 118 Q 40 96 50 78"/>
		<path d="M 208 118 Q 216 96 206 78"/>
	</g>`;

const SYMBOLS = {
	h1: build(BULL, bull),
	h2: build(BEAR, bear),
	h3: build(AMBER, btc),
	h4: build(VIOLET, eth),
	h5: build(TEAL, bundle),
	l1: build(BULL, candle(BULL, true)),
	l2: build(BEAR, candle(BEAR, false)),
	l3: build(BULL, arrow(BULL, true)),
	l4: build(BEAR, arrow(BEAR, false)),
	w: build(BULL, leverage),
	s: build(BEAR, alarm),
};

// ─── backgrounds ────────────────────────────────────────────────────────────
// A trading desk after hours: dark room, a price grid, and a candle series
// receding behind the reels. The feature version is the same room with the
// leverage green pushed up.
const backdrop = (accent, intensity) => {
	const W = 2039;
	const H = 1000;
	let grid = '';
	for (let x = 0; x <= W; x += 68) {
		grid += `<path d="M ${x} 0 L ${x} ${H}" stroke="${accent}" stroke-width="1" opacity="${0.05 * intensity}"/>`;
	}
	for (let y = 0; y <= H; y += 68) {
		grid += `<path d="M 0 ${y} L ${W} ${y}" stroke="${accent}" stroke-width="1" opacity="${0.05 * intensity}"/>`;
	}

	// Deterministic series - the same room every load, not a different one each
	// time the generator runs.
	let seed = 7;
	const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
	let candles = '';
	let level = H * 0.62;
	for (let x = 40; x < W; x += 46) {
		const delta = (rand() - 0.44) * 130;
		const top = Math.max(120, Math.min(H - 160, level + Math.min(delta, 0)));
		const bot = Math.max(160, Math.min(H - 100, level + Math.max(delta, 0) + 40));
		const up = delta <= 0;
		const color = up ? accent : '#ff5566';
		candles += `<path d="M ${x + 13} ${top - 26} L ${x + 13} ${bot + 26}" stroke="${color}" stroke-width="3" opacity="${0.18 * intensity}"/>`;
		candles += `<rect x="${x}" y="${top}" width="26" height="${Math.max(14, bot - top)}" rx="4" fill="${color}" opacity="${0.14 * intensity}"/>`;
		level = (top + bot) / 2;
	}

	const defs = `
	<linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#050a08"/>
		<stop offset="0.55" stop-color="#08110d"/>
		<stop offset="1" stop-color="#030705"/>
	</linearGradient>
	<radialGradient id="pool" cx="0.5" cy="0.46" r="0.68">
		<stop offset="0" stop-color="${accent}" stop-opacity="${0.16 * intensity}"/>
		<stop offset="1" stop-color="${accent}" stop-opacity="0"/>
	</radialGradient>`;

	const body = `
	<rect width="${W}" height="${H}" fill="url(#room)"/>
	${grid}
	${candles}
	<rect width="${W}" height="${H}" fill="url(#pool)"/>
	<rect y="${H - 150}" width="${W}" height="150" fill="#030705" opacity="0.65"/>`;

	return svg(W, H, body, defs);
};

// ─── render ─────────────────────────────────────────────────────────────────
const render = (source, outPath, width) => {
	const resvg = new Resvg(source, { fitTo: { mode: 'width', value: width } });
	fs.writeFileSync(outPath, resvg.render().asPng());
	const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
	console.log(`  ${path.basename(outPath)}  ${kb} KB`);
};

console.log(`symbols -> ${path.relative(appRoot, SYM_DIR)}`);
for (const [name, source] of Object.entries(SYMBOLS)) {
	render(source, path.join(SYM_DIR, `${name}.png`), 256);
}

console.log(`backgrounds -> ${path.relative(appRoot, BG_DIR)}`);
render(backdrop(BULL, 1), path.join(BG_DIR, 'bg_base.png'), 2039);
render(backdrop(BULL, 1.9), path.join(BG_DIR, 'bg_feature.png'), 2039);
