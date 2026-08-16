// Win particles: a trade chip flipping between profit and loss.
//
// The game currently rains the template's gold coins (static/assets/sprites/coin,
// "SD2_Coin") over every big win. That art belongs to another game and it is the
// single most obviously borrowed asset on screen: a trading terminal in green
// phosphor showering the player in cartoon gold doubloons.
//
// The replacement keeps the same shape of motion — a spinning token, twelve
// frames, drop-in compatible with the same spritesheet format — but flips about
// its vertical axis between a GREEN face and a RED face. Green when you see one
// side, red when you see the other, a bright edge in between. Money turning over
// between profit and loss is the whole subject of the game, and at particle size
// the colour flip is what reads; the glyph is detail for the frames that are
// nearly face-on.
//
// Usage: node design/generate_particles.mjs <dir with node_modules/@resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/generate_particles.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/marginCallFx');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BULL = '#4bd67f';
const BULL_HI = '#a8f0c4';
const BEAR = '#ff5566';
const BEAR_HI = '#ffa8b4';
const INK = '#08110c';
const PALE = '#eafff2';

const FRAMES = 12;
const CELL = 256;
const COLS = 4;
const ROWS = FRAMES / COLS;
const R = 104; // chip radius inside the cell

/** One frame of the flip. */
const chip = (i) => {
	const angle = (i / FRAMES) * Math.PI * 2;
	const cos = Math.cos(angle);
	const bull = cos >= 0;
	const face = bull ? BULL : BEAR;
	const hi = bull ? BULL_HI : BEAR_HI;
	const c = CELL / 2;

	// Edge-on frames: the chip is a lit sliver. Clamped so it never disappears
	// entirely — a particle that vanishes for two frames of twelve flickers.
	const sx = Math.max(0.07, Math.abs(cos));
	const w = R * sx;

	if (sx < 0.16) {
		return (
			`<rect x="${(c - w).toFixed(1)}" y="${c - R}" width="${(w * 2).toFixed(1)}" height="${R * 2}" ` +
			`rx="${(w * 0.9).toFixed(1)}" fill="${PALE}"/>` +
			`<rect x="${(c - w * 0.45).toFixed(1)}" y="${c - R + 6}" width="${(w * 0.9).toFixed(1)}" ` +
			`height="${R * 2 - 12}" rx="${(w * 0.45).toFixed(1)}" fill="${face}"/>`
		);
	}

	// Face-on. Everything is drawn at full width and squeezed by a transform, so
	// the glyph foreshortens with the chip instead of sliding across it.
	const inner = [
		// body
		`<rect x="${c - R}" y="${c - R}" width="${R * 2}" height="${R * 2}" rx="${R * 0.34}" fill="${INK}"/>`,
		`<rect x="${c - R}" y="${c - R}" width="${R * 2}" height="${R * 2}" rx="${R * 0.34}" ` +
			`fill="none" stroke="${face}" stroke-width="11"/>`,
		`<rect x="${c - R + 17}" y="${c - R + 17}" width="${R * 2 - 34}" height="${R * 2 - 34}" ` +
			`rx="${R * 0.24}" fill="none" stroke="${hi}" stroke-width="3.5" opacity="0.7"/>`,
		// candlestick glyph: up-candle on the green face, down-candle on the red
		`<path d="M ${c} ${c - R * 0.56} L ${c} ${c + R * 0.56}" stroke="${hi}" stroke-width="7" stroke-linecap="round"/>`,
		bull
			? `<rect x="${c - R * 0.3}" y="${c - R * 0.34}" width="${R * 0.6}" height="${R * 0.62}" rx="6" fill="${face}"/>`
			: `<rect x="${c - R * 0.3}" y="${c - R * 0.28}" width="${R * 0.6}" height="${R * 0.62}" rx="6" ` +
				`fill="none" stroke="${face}" stroke-width="9"/>`,
		// specular sweep across the upper left, so the chip reads as a solid object
		`<path d="M ${c - R * 0.82} ${c - R * 0.2} L ${c - R * 0.1} ${c - R * 0.92} ` +
			`L ${c + R * 0.2} ${c - R * 0.92} L ${c - R * 0.55} ${c + R * 0.1} Z" fill="${PALE}" opacity="0.16"/>`,
	].join('');

	return `<g transform="translate(${c} ${c}) scale(${sx.toFixed(4)} 1) translate(${-c} ${-c})">${inner}</g>`;
};

// ── render each frame, then pack by direct placement ───────────────────────
// Packed as one SVG of <rect>/<path> primitives rather than by re-rendering
// embedded PNGs: that second route corrupted colour when it was tried for the
// symbol animation sheet (see design/generate_symbol_anim.mjs), and here there
// is no need for it at all — the frames are vector, so they can simply be drawn
// into their cells in one pass.
let body = '';
for (let i = 0; i < FRAMES; i++) {
	const x = (i % COLS) * CELL;
	const y = Math.floor(i / COLS) * CELL;
	body += `<g transform="translate(${x} ${y})">${chip(i)}</g>`;
}

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${CELL * COLS}" height="${CELL * ROWS}" ` +
	`viewBox="0 0 ${CELL * COLS} ${CELL * ROWS}">${body}</svg>`;

const pngPath = path.join(OUT_DIR, 'trade_chip.png');
fs.writeFileSync(
	pngPath,
	new Resvg(svg, { fitTo: { mode: 'width', value: CELL * COLS } }).render().asPng(),
);

// ── spritesheet manifest, same shape as the coin sheet it replaces ─────────
const frames = {};
for (let i = 0; i < FRAMES; i++) {
	const x = (i % COLS) * CELL;
	const y = Math.floor(i / COLS) * CELL;
	frames[`${i + 1}.png`] = {
		frame: { x, y, w: CELL, h: CELL },
		rotated: false,
		trimmed: false,
		spriteSourceSize: { x: 0, y: 0, w: CELL, h: CELL },
		sourceSize: { w: CELL, h: CELL },
	};
}
const sheet = {
	frames,
	animations: { chip: Array.from({ length: FRAMES }, (_, i) => `${i + 1}.png`) },
	meta: {
		app: 'design/generate_particles.mjs',
		version: '1.0',
		image: 'trade_chip.png',
		format: 'RGBA8888',
		size: { w: CELL * COLS, h: CELL * ROWS },
		scale: '1',
	},
};
const jsonPath = path.join(OUT_DIR, 'trade_chip.json');
fs.writeFileSync(jsonPath, JSON.stringify(sheet));

console.log(
	`wrote ${path.relative(appRoot, pngPath)}  ${(fs.statSync(pngPath).size / 1024).toFixed(1)} KB  ` +
		`(${CELL * COLS}x${CELL * ROWS}, ${FRAMES} frames)`,
);
console.log(`wrote ${path.relative(appRoot, jsonPath)}`);
