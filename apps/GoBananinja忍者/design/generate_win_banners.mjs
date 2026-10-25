// Win-tier plaques for Go Bananinja, one per win level, tier name baked in.
// The amount is drawn by the frontend inside the plaque's dark well (see
// Win.svelte: centre at y = 0.16 of the height, so the well stays at
// 286..456 of the 560 canvas).
//
// 2026-10-23: redrawn in the game's flat print (the bet bar and the modals,
// Modals.svelte "FLAT PRINT"): a lacquer-navy panel on a hard ink rim with a
// solid brass offset shadow, no gradients, no rivets. The tier name sits on a
// swallow-tailed cloth band — the mascot's headband — whose colour is the
// only thing that changes from tier to tier. The old plaques were the
// template's jungle brass plates with rivets round the rim.
//
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

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasWinBanners');

// The game's display face, the same one the amount and the bet bar use.
// Titan One is single-weight: no font-weight, or resvg may substitute a face.
const FONT_DIR = path.join(appRoot, 'static/fonts');
const BANNER_FONT = 'Titan One';
// SUPER WIN, the widest name, inks ~636px at 112 against ~780px of band.
const TIER_SIZE = 112;
fs.mkdirSync(OUT, { recursive: true });

const W = 1000;
const H = 560;

// the game's three colours (game/uiTheme.ts, Modals.svelte)
const NAVY = '#13222c';
const WELL = '#0a1720';
const INK = '#05090d';
const BRASS = '#d9b56b';
const WASHI = '#efe4ca';

// tier -> the band's cloth
const TIERS = {
	big: { text: 'BIG WIN', band: '#4f7a52' },
	superwin: { text: 'SUPER WIN', band: '#b8913f' },
	mega: { text: 'MEGA WIN', band: '#c4612c' },
	epic: { text: 'EPIC WIN', band: '#962e38' },
	max: { text: 'MAX WIN', band: '#5e3577' },
};

// panel
const P = { x: 70, y: 84, w: 846, h: 410, r: 18 };
const SHADOW = 14;
// the band: across the panel's top, overhanging both sides, swallow-tailed
const B = { x0: 26, x1: 960, y: 122, h: 116, notch: 34 };

const band = ({ band: cloth }) => {
	const { x0, x1, y, h, notch } = B;
	const m = y + h / 2;
	const cloth0 = `M ${x0} ${y} L ${x1} ${y} L ${x1 - notch} ${m} L ${x1} ${y + h} L ${x0} ${y + h} L ${x0 + notch} ${m} Z`;
	return `
	<path d="${cloth0}" fill="${cloth}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
	<line x1="${x0 + notch + 30}" y1="${y + 14}" x2="${x1 - notch - 30}" y2="${y + 14}" stroke="${WASHI}" stroke-opacity="0.22" stroke-width="3"/>`;
};

const banner = (tier) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<!-- solid brass offset shadow, then the panel on its ink rim -->
<rect x="${P.x + SHADOW}" y="${P.y + SHADOW}" width="${P.w}" height="${P.h}" rx="${P.r}" fill="${BRASS}" stroke="${INK}" stroke-width="6"/>
<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="${P.r}" fill="${NAVY}" stroke="${INK}" stroke-width="6"/>
<rect x="${P.x + 16}" y="${P.y + 16}" width="${P.w - 32}" height="${P.h - 32}" rx="${P.r - 8}" fill="none" stroke="${BRASS}" stroke-opacity="0.5" stroke-width="2"/>
<!-- the well the amount counts up in -->
<rect x="140" y="286" width="${W - 280}" height="170" rx="12" fill="${WELL}" stroke="${BRASS}" stroke-width="2"/>
${band(tier)}
<!-- tier name: washi on an ink edge, with a flat ink drop -->
<text x="${W / 2 - 3 + 6}" y="${B.y + B.h / 2 + 40 + 6}" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="${INK}" stroke="${INK}" stroke-width="10" stroke-linejoin="round">${tier.text}</text>
<text x="${W / 2 - 3}" y="${B.y + B.h / 2 + 40}" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="${WASHI}" stroke="${INK}" stroke-width="10" stroke-linejoin="round" paint-order="stroke">${tier.text}</text>
</svg>`;

for (const [alias, tier] of Object.entries(TIERS)) {
	const resvg = new Resvg(banner(tier), {
		fitTo: { mode: 'width', value: W },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: false, defaultFontFamily: BANNER_FONT },
	});
	fs.writeFileSync(path.join(OUT, `${alias}.png`), resvg.render().asPng());
	console.log('rendered', `${alias}.png`);
}
console.log('win banners written to', OUT);
