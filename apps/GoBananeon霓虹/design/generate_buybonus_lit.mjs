// The Buy Bonus plate's HOVER layer (buybonus_plate_lit.png), drawn over the
// neon plate (buybonus_plate.png) only while the cursor is on it — the
// uiTheme `buyBonusHoverSprite` slot, GoBoomana's mechanism.
//
// GoBoomana's slab SPLIT under the cursor: cracks opened with amber light
// leaking out, the same thing its reels did in the blast's CHARGE beat. Here
// the plate CHARGES UP the same way this game's reels do before a Pulse Bomb
// goes (ReelBlast.svelte): violet lightning forks out of the banana emblem
// across the panel, the emblem blazes, and the neon rim flares cyan and pink.
//
// Composited ADDITIVELY (the theme default): the plate is dark navy, so light
// added to it reads as the same plate lighting up, not as a sticker on top.
// Same 1254 square canvas as the plate, so it lines up at any size.
//
//   node design/generate_buybonus_lit.mjs [toolsDir]   (default E:/stake/tools/gen)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2] ?? 'E:/stake/tools/gen';
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi/buybonus_plate_lit.png');

const S = 1254;
// measured on buybonus_plate.png: the rim's centre line and the emblem
const RIM = { x: 44, y: 70, w: S - 88, h: S - 110, r: 150 };
const EMBLEM = { x: 627, y: 150, r: 92 };

// deterministic jagged bolts out of the emblem, each with a fork or two
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const bolt = (x0, y0, angle, length, steps) => {
	const pts = [[x0, y0]];
	let x = x0, y = y0, a = angle;
	for (let i = 0; i < steps; i++) {
		a += (rand() - 0.5) * 0.9;
		const seg = length / steps;
		x += Math.cos(a) * seg;
		y += Math.sin(a) * seg;
		// stay inside the panel
		x = Math.max(RIM.x + 70, Math.min(RIM.x + RIM.w - 70, x));
		y = Math.max(EMBLEM.y + 40, Math.min(RIM.y + RIM.h - 70, y));
		pts.push([x, y]);
	}
	return pts;
};
const bolts = [];
const ANGLES = [100, 125, 150, 80, 55, 30, 90];
for (const deg of ANGLES) {
	const main = bolt(EMBLEM.x, EMBLEM.y + EMBLEM.r * 0.6, (deg * Math.PI) / 180, 520 + rand() * 300, 9);
	bolts.push({ pts: main, w: 1 });
	// a fork off part-way along
	const at = main[3 + Math.floor(rand() * 3)];
	bolts.push({ pts: bolt(at[0], at[1], ((deg + (rand() < 0.5 ? -35 : 35)) * Math.PI) / 180, 220 + rand() * 160, 5), w: 0.6 });
}
const d = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');

const boltSvg = bolts
	.map(
		({ pts, w }) => `
	<path d="${d(pts)}" fill="none" stroke="#b143ec" stroke-width="${34 * w}" stroke-linejoin="round" stroke-linecap="round" opacity=".35" filter="url(#soft)"/>
	<path d="${d(pts)}" fill="none" stroke="#d98bff" stroke-width="${12 * w}" stroke-linejoin="round" stroke-linecap="round" opacity=".8"/>
	<path d="${d(pts)}" fill="none" stroke="#ffffff" stroke-width="${4.5 * w}" stroke-linejoin="round" stroke-linecap="round"/>`,
	)
	.join('');

const rim = (stroke, width, opacity, filter = '') =>
	`<rect x="${RIM.x}" y="${RIM.y}" width="${RIM.w}" height="${RIM.h}" rx="${RIM.r}" fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" ${filter}/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<defs>
	<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
	<filter id="wide" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26"/></filter>
	<radialGradient id="core" cx="50%" cy="38%" r="55%">
		<stop offset="0" stop-color="#7a2cc8" stop-opacity=".45"/>
		<stop offset="1" stop-color="#7a2cc8" stop-opacity="0"/>
	</radialGradient>
	<radialGradient id="halo">
		<stop offset="0" stop-color="#ffffff" stop-opacity=".9"/>
		<stop offset=".35" stop-color="#ff7ae0" stop-opacity=".6"/>
		<stop offset="1" stop-color="#ff3fd0" stop-opacity="0"/>
	</radialGradient>
</defs>
	<!-- the panel fills with violet charge, strongest under the emblem -->
	<rect x="${RIM.x}" y="${RIM.y}" width="${RIM.w}" height="${RIM.h}" rx="${RIM.r}" fill="url(#core)"/>
	${boltSvg}
	<!-- the rim flares: a wide cyan bloom, a pink tube, a white-hot core -->
	${rim('#35e9ff', 60, 0.45, 'filter="url(#wide)"')}
	${rim('#ff3fd0', 18, 0.7, 'filter="url(#soft)"')}
	${rim('#9ff4ff', 7, 0.9)}
	<!-- the emblem blazes -->
	<circle cx="${EMBLEM.x}" cy="${EMBLEM.y}" r="${EMBLEM.r * 2.1}" fill="url(#halo)"/>
</svg>`;

// drawn on the plate's 1254 grid, shipped at 800 (the button is ~120px on
// screen; the plate's own size is only what it was delivered at)
const png = new Resvg(svg, { background: 'rgba(0,0,0,0)', fitTo: { mode: 'width', value: 800 } }).render().asPng();
fs.writeFileSync(OUT, png);
console.log(`buybonus_plate_lit.png 800x800 ${png.length} bytes`);
