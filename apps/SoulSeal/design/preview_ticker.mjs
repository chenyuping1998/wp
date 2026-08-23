// Offline preview of the ticker backdrop.
//
// This exists because the ticker's motion is rAF-driven, and rAF is throttled to
// zero in a hidden tab - so the levels cannot be judged by driving the page from
// a headless check. This renders the same walk, at the same alphas, in the same
// two gutter panels, composited over the real bg_base.png.
//
// Keep the constants below in sync with src/components/TickerChart.svelte and
// src/game/constants.ts. They are duplicated rather than imported because those
// are a Svelte component with runes in it and a module that pulls in half the
// app; neither loads from plain Node.
//
// The board geometry is the DESKTOP preset, measured off the running game:
// canvas 1280x720, reels 687px wide centred, housing 1.32x that.
//
// Usage: node design/preview_ticker.mjs <dir containing node_modules with @resvg/resvg-js>
//   e.g. node design/preview_ticker.mjs E:/stake/tools/gen
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/preview_ticker.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BG = path.join(appRoot, 'static/assets/sprites/soulSealBackground/bg_base.png');
const OUT = path.join(appRoot, 'design/preview/ticker.png');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// ─── mirrored from TickerChart.svelte ───────────────────────────────────────
const WIDTH = 1280;
const HEIGHT = 720;
const COLUMNS = 26;
const RISE = '#4bd67f';
const FALL = '#ff5566';
const MIN_PANEL_WIDTH = 96;
const BOARD_GAP = 0.018;
const EDGE_PAD = 0.012;

// ─── board footprint, desktop preset ────────────────────────────────────────
const BOARD_WIDTH = 687;
const BOARD_HOUSING_CLEARANCE = 1.32;
const boardHalf = (BOARD_WIDTH * BOARD_HOUSING_CLEARANCE) / 2;
const board = { left: WIDTH / 2 - boardHalf, right: WIDTH / 2 + boardHalf };

const makeRandom = (seed) => () => {
	seed = (seed * 1103515245 + 12345) % 2147483648;
	return seed / 2147483648;
};

const bands = [
	{ speed: 0.34, alpha: 0.3, width: 2, band: { top: 0.08, height: 0.36 }, volatility: 0.34 },
	{ speed: 0.55, alpha: 0.42, width: 2.5, band: { top: 0.3, height: 0.34 }, volatility: 0.42 },
	{ speed: 0.85, alpha: 0.55, width: 3, band: { top: 0.54, height: 0.34 }, volatility: 0.5 },
];

const makeSeries = (config) => {
	const random = makeRandom(config.seed);
	const values = [];
	let value = 0.5;
	for (let i = 0; i < COLUMNS + 2; i++) {
		value = Math.min(1, Math.max(0, value + (random() - 0.5) * config.volatility));
		values.push(value);
	}
	return { ...config, values, offset: 0 };
};

const makePanel = (seeds) => bands.map((config, i) => makeSeries({ ...config, seed: seeds[i] }));
const panels = [makePanel([7, 4021, 90210]), makePanel([1301, 55, 733331])];

// ─── the same draw, as SVG ──────────────────────────────────────────────────
const gap = WIDTH * BOARD_GAP;
const pad = WIDTH * EDGE_PAD;
const rects = [
	{ x: pad, width: board.left - gap - pad },
	{ x: board.right + gap, width: WIDTH - pad - (board.right + gap) },
];

let body = '';
rects.forEach((rect, index) => {
	if (rect.width < MIN_PANEL_WIDTH) return;
	const columnWidth = rect.width / (COLUMNS - 2);
	for (const s of panels[index]) {
		const top = HEIGHT * s.band.top;
		const bandHeight = HEIGHT * s.band.height;
		const yOf = (v) => top + (1 - v) * bandHeight;

		for (const rising of [true, false]) {
			let d = '';
			for (let i = 0; i < s.values.length - 1; i++) {
				if ((s.values[i + 1] >= s.values[i]) !== rising) continue;
				const x0 = rect.x + (i - s.offset) * columnWidth;
				const x1 = rect.x + (i + 1 - s.offset) * columnWidth;
				if (x1 < rect.x || x0 > rect.x + rect.width) continue;
				d += `M${x0.toFixed(1)} ${yOf(s.values[i]).toFixed(1)}L${x1.toFixed(1)} ${yOf(s.values[i + 1]).toFixed(1)}`;
			}
			if (d) {
				body +=
					`<path d="${d}" fill="none" stroke="${rising ? RISE : FALL}" ` +
					`stroke-width="${s.width}" stroke-opacity="${s.alpha}" stroke-linecap="round"/>`;
			}
		}
	}
});

// The board's own footprint, drawn as a guide so the clearance is checkable at a
// glance. Not part of the game - it is the thing the panels have to stay out of.
const guide =
	`<rect x="${board.left}" y="${HEIGHT * 0.14}" width="${board.right - board.left}" ` +
	`height="${HEIGHT * 0.74}" fill="#000000" fill-opacity="0.45" ` +
	`stroke="#4bd67f" stroke-opacity="0.25" stroke-dasharray="8 8"/>`;

const bg = fs.readFileSync(BG).toString('base64');
const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
	`width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
	`<rect width="${WIDTH}" height="${HEIGHT}" fill="#060b09"/>` +
	`<image x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="none" ` +
	`xlink:href="data:image/png;base64,${bg}"/>` +
	body +
	guide +
	`</svg>`;

fs.writeFileSync(OUT, new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng());
console.log('wrote', path.relative(appRoot, OUT));
console.log(
	`panels: left ${rects[0].x.toFixed(0)}..${(rects[0].x + rects[0].width).toFixed(0)}, ` +
		`right ${rects[1].x.toFixed(0)}..${(rects[1].x + rects[1].width).toFixed(0)}, ` +
		`board ${board.left.toFixed(0)}..${board.right.toFixed(0)}`,
);
