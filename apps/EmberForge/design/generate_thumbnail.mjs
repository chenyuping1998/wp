// Ember Forge store thumbnail — composed from the game's own generated art, so
// the cover cannot drift away from what the game actually looks like.
//
// 408x546 portrait, matching the size the platform lists games at. The layout is
// the one thing a thumbnail has to get right at ~120px wide in a grid: one clear
// focal object, the title, and enough of the board to say what kind of game this
// is. Everything else is atmosphere.
//
// Usage: node design/generate_thumbnail.mjs <dir with node_modules for @resvg/resvg-js>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_thumbnail.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sprite = (...parts) => path.join(appRoot, 'static/assets/sprites', ...parts);

const dataUri = (file) => `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;

const W = 408;
const H = 546;

const bg = dataUri(sprite('emberForgeBackground', 'bg_feature.png'));
const sym = (name) => dataUri(sprite('emberForgeSymbols', `${name}.png`));

// A small board fragment rather than the whole 7x7: at thumbnail size a full
// board is 49 illegible specks, whereas a 3x3 corner still reads as "grid of
// symbols" while leaving the individual art recognisable.
const CELL = 78;
const GRID_X = (W - CELL * 3) / 2;
const GRID_Y = 188;
const layout = [
	['h1', 'h2', 'h1'],
	['h2', 'w', 'h2'],
	['h3', 'h1', 'h4'],
];
// The heat ladder is the game's signature, so the fragment shows it mid-feature:
// cold plates at the edges, hot ones where the cluster has been working.
const heat = [
	[0, 3, 0],
	[6, 24, 6],
	[0, 8, 2],
];
const TIER = [
	{ from: 1, fill: '#6e1f0c', glow: '#c23a12' },
	{ from: 3, fill: '#a8330d', glow: '#f06a15' },
	{ from: 6, fill: '#d4641a', glow: '#ffa32c' },
	{ from: 10, fill: '#f0a63a', glow: '#ffe6a0' },
	{ from: 20, fill: '#fff0c8', glow: '#dcefff' },
];
const tierFor = (v) => {
	if (v <= 0) return null;
	let t = TIER[0];
	for (const c of TIER) if (v >= c.from) t = c;
	return t;
};

const cells = layout
	.flatMap((row, r) =>
		row.map((name, c) => {
			const x = GRID_X + c * CELL;
			const y = GRID_Y + r * CELL;
			const tier = tierFor(heat[r][c]);
			const plate = tier
				? `<rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="7" fill="${tier.fill}" opacity="0.9"/>
				   <rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="7" fill="none" stroke="${tier.glow}" stroke-width="3" opacity="0.85"/>`
				: `<rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="7" fill="#241d1a" opacity="0.75"/>`;
			return `${plate}<image x="${x + 8}" y="${y + 8}" width="${CELL - 16}" height="${CELL - 16}" href="${sym(name)}"/>`;
		}),
	)
	.join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<defs>
		<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
		<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
			<stop offset="0.3" stop-color="#000000" stop-opacity="0.1"/>
			<stop offset="0.62" stop-color="#000000" stop-opacity="0.2"/>
			<stop offset="1" stop-color="#000000" stop-opacity="0.85"/>
		</linearGradient>
		<linearGradient id="title" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#fff6d2"/>
			<stop offset="0.5" stop-color="#ffb03a"/>
			<stop offset="1" stop-color="#d4500a"/>
		</linearGradient>
		<radialGradient id="bloom" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#ff9b32" stop-opacity="0.5"/>
			<stop offset="1" stop-color="#ff7a18" stop-opacity="0"/>
		</radialGradient>
	</defs>

	<g clip-path="url(#frame)">
		<!-- background cropped to portrait from the centre-right, where the furnace is -->
		<image x="-330" y="-40" width="1092" height="614" href="${bg}" preserveAspectRatio="xMidYMid slice"/>
		<ellipse cx="${W / 2}" cy="${GRID_Y + CELL * 1.5}" rx="230" ry="190" fill="url(#bloom)"/>

		${cells}

		<rect width="${W}" height="${H}" fill="url(#shade)"/>

		<text x="${W / 2}" y="118" text-anchor="middle" font-family="Georgia, serif" font-size="52"
			font-weight="bold" letter-spacing="2"
			fill="url(#title)" stroke="#3a1006" stroke-width="8" paint-order="stroke">EMBER</text>
		<text x="${W / 2}" y="168" text-anchor="middle" font-family="Georgia, serif" font-size="52"
			font-weight="bold" letter-spacing="6"
			fill="url(#title)" stroke="#3a1006" stroke-width="8" paint-order="stroke">FORGE</text>

		<text x="${W / 2}" y="${H - 62}" text-anchor="middle" font-family="Georgia, serif" font-size="21"
			letter-spacing="3" fill="#ffd7a0" stroke="#2a0d03" stroke-width="4" paint-order="stroke">CLUSTER PAYS</text>
		<text x="${W / 2}" y="${H - 30}" text-anchor="middle" font-family="Georgia, serif" font-size="26"
			font-weight="bold" letter-spacing="2" fill="#fff0c8" stroke="#2a0d03" stroke-width="5" paint-order="stroke">10,000x MAX WIN</text>

		<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="18" fill="none" stroke="#c9922f" stroke-width="3" opacity="0.8"/>
	</g>
</svg>`;

const out = path.join(appRoot, 'Thumbnail_EmberForge.png');
fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true } }).render().asPng());
console.log('wrote', path.relative(appRoot, out));
