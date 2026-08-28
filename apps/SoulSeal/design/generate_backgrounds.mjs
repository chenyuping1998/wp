// Soul Seal background art.
//
// SYMBOLS ARE NOT GENERATED. They are supplied art: originals in
// design/source/symbols/, keyed into static/assets/sprites/soulSealSymbols/ by
// design/dekey_supplied_art.mjs. This script used to draw them too, and that made
// it one careless run away from overwriting artwork it did not create - so the
// symbol half was removed rather than left behind a flag.
//
// Usage: node design/generate_backgrounds.mjs <dir containing node_modules with @resvg/resvg-js>
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
const BG_DIR = path.join(appRoot, 'static/assets/sprites/soulSealBackground');
fs.mkdirSync(BG_DIR, { recursive: true });


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


console.log(`backgrounds -> ${path.relative(appRoot, BG_DIR)}`);
render(backdrop(BULL, 1), path.join(BG_DIR, 'bg_base.png'), 2039);
render(backdrop(BULL, 1.9), path.join(BG_DIR, 'bg_feature.png'), 2039);
