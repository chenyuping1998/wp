// Margin Call background art.
//
// SYMBOLS ARE NOT GENERATED. They are supplied art: originals in
// design/source/symbols/, keyed into static/assets/sprites/marginCallSymbols/ by
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
const BG_DIR = path.join(appRoot, 'static/assets/sprites/marginCallBackground');
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
	// Where the floor meets the skyline. Every layer below is placed against this
	// one number, which is what lets the scene read as having a distance at all.
	const HORIZON = H * 0.44;

	// Deterministic - the same room every load, not a different one each time the
	// generator runs.
	let seed = 7;
	const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

	// ── 1. sky and the light the city throws up into it ──────────────────────
	const sky = `
	<rect width="${W}" height="${HORIZON + 40}" fill="url(#sky)"/>
	<ellipse cx="${W * 0.5}" cy="${HORIZON}" rx="${W * 0.62}" ry="${H * 0.3}" fill="url(#cityGlow)"/>`;

	// ── 2. skyline, two ranks so it has depth of its own ─────────────────────
	// The far rank is smaller, flatter and paler (haze); the near rank is taller,
	// darker and carries most of the lit windows.
	const rank = (count, baseTop, maxRise, fill, windowAlpha, windowStep) => {
		let out = '';
		let x = -60;
		while (x < W + 60) {
			const w = 60 + rand() * 130;
			const top = baseTop - rand() * maxRise;
			out += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${(HORIZON + 60 - top).toFixed(0)}" fill="${fill}"/>`;
			// lit windows, sparse and irregular - a fully lit grid reads as a
			// spreadsheet, not a building
			for (let wy = top + 16; wy < HORIZON; wy += windowStep) {
				for (let wx = x + 10; wx < x + w - 10; wx += windowStep) {
					if (rand() > 0.26) continue;
					const warm = rand() > 0.72;
					out +=
						`<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="7" ` +
						`fill="${warm ? AMBER : accent}" opacity="${(windowAlpha * (0.55 + rand() * 0.75)).toFixed(3)}"/>`;
				}
			}
			x += w + 6 + rand() * 26;
		}
		return out;
	};
	const skyline =
		`<g opacity="0.55">${rank(0, HORIZON - 30, 150, '#0a1310', 0.28 * intensity, 20)}</g>` +
		rank(0, HORIZON - 10, 300, '#050b09', 0.5 * intensity, 22);

	// ── 3. the floor, in perspective ─────────────────────────────────────────
	// Lines compress toward the horizon and the verticals converge on a vanishing
	// point. The old grid was a uniform 68px lattice over the whole image, which
	// is flat by construction - no amount of opacity tuning gives a flat lattice
	// a sense of distance.
	let floor = '';
	for (let i = 1; i <= 22; i++) {
		const y = HORIZON + (H - HORIZON) * (i / 22) ** 2.1;
		floor += `<path d="M 0 ${y.toFixed(1)} L ${W} ${y.toFixed(1)}" stroke="${accent}" stroke-width="1.2" opacity="${(0.05 * intensity * (0.35 + (i / 22) * 0.9)).toFixed(3)}"/>`;
	}
	const vpx = W * 0.5;
	for (let i = -14; i <= 14; i++) {
		const xBottom = vpx + i * (W / 12);
		floor += `<path d="M ${vpx + i * 26} ${HORIZON} L ${xBottom.toFixed(0)} ${H}" stroke="${accent}" stroke-width="1.2" opacity="${0.045 * intensity}"/>`;
	}

	// ── 4. quote series, two ranks at different depths ───────────────────────
	const series = (baseY, step, scale, alpha, band) => {
		let out = '';
		let level = baseY;
		for (let x = -20; x < W; x += step) {
			const delta = (rand() - 0.44) * 130 * scale;
			// The walk is kept inside its own band. Without this the far series
			// drifted below its lane within about three hundred pixels, got clamped
			// flat and simply stopped being visible for the rest of the width -
			// which is why only the left edge of the mid-distance had any quotes on
			// it at all.
			level = Math.max(band[0], Math.min(band[1], level));
			const top = Math.max(band[0] - 40, Math.min(band[1], level + Math.min(delta, 0)));
			const bot = Math.max(top + 14, Math.min(band[1] + 50, level + Math.max(delta, 0) + 40 * scale));
			const up = delta <= 0;
			const color = up ? accent : BEAR;
			const bw = 26 * scale;
			out += `<path d="M ${(x + bw / 2).toFixed(1)} ${(top - 26 * scale).toFixed(1)} L ${(x + bw / 2).toFixed(1)} ${(bot + 26 * scale).toFixed(1)}" stroke="${color}" stroke-width="${(3 * scale).toFixed(1)}" opacity="${(alpha * 1.3 * intensity).toFixed(3)}"/>`;
			out += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${(bot - top).toFixed(1)}" rx="${3 * scale}" fill="${color}" opacity="${(alpha * intensity).toFixed(3)}"/>`;
			level = (top + bot) / 2;
		}
		return out;
	};
	const quotes =
		series(H * 0.56, 30, 0.62, 0.07, [H * 0.5, H * 0.64]) +
		series(H * 0.76, 52, 1.15, 0.11, [H * 0.68, H * 0.86]);

	// ── 5. the desk this is all being watched from ───────────────────────────
	// Two monitor shells in the lower corners, catching a rim of screen light.
	// A foreground element is what turns a wallpaper into a place.
	const monitor = (cx, w, h, tilt) => `
	<g transform="translate(${cx} ${H}) rotate(${tilt})">
		<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="18" fill="#020504"/>
		<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="18" fill="none" stroke="${accent}" stroke-width="3" opacity="${0.22 * intensity}"/>
		<rect x="${-w / 2 + 14}" y="${-h + 14}" width="${w - 28}" height="${h - 20}" rx="10" fill="${accent}" opacity="${0.05 * intensity}"/>
	</g>`;
	const desk = `
	<rect y="${H - 120}" width="${W}" height="120" fill="#020504" opacity="0.8"/>
	${monitor(W * 0.08, 300, 165, -4)}
	${monitor(W * 0.92, 300, 165, 4)}`;

	const defs = `
	<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#020504"/>
		<stop offset="1" stop-color="#061009"/>
	</linearGradient>
	<radialGradient id="cityGlow" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="${accent}" stop-opacity="${0.14 * intensity}"/>
		<stop offset="1" stop-color="${accent}" stop-opacity="0"/>
	</radialGradient>
	<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#040a07"/>
		<stop offset="1" stop-color="#020504"/>
	</linearGradient>
	<radialGradient id="pool" cx="0.5" cy="0.46" r="0.68">
		<stop offset="0" stop-color="${accent}" stop-opacity="${0.13 * intensity}"/>
		<stop offset="1" stop-color="${accent}" stop-opacity="0"/>
	</radialGradient>
	<radialGradient id="vig" cx="0.5" cy="0.5" r="0.72">
		<stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.72"/>
	</radialGradient>`;

	const body = `
	<rect width="${W}" height="${H}" fill="#020504"/>
	${sky}
	${skyline}
	<rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#ground)"/>
	${floor}
	${quotes}
	<rect width="${W}" height="${H}" fill="url(#pool)"/>
	${desk}
	<rect width="${W}" height="${H}" fill="url(#vig)"/>`;

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
