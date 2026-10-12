// The dynamite sticks of the blast ladder, as PNGs for the free-spin counter
// (FreeSpinCounter.svelte draws the ladder in pixi, so it cannot use the SVG
// the buy menu draws inline).
//
// The drawing is the SAME stick as the buy menu's (ModalBuyBonus.svelte,
// `stick`), so the ladder the player chose on the card is the one they watch
// fill in the feature. Keep the two in step.
//
// No spark in either file: the counter animates its own on the fuse tip (it
// flickers, flashes on a new rung and breathes on the next one to light), at
// FUSE_TIP below — the same point in the 28 x 48 drawing.
//
//   node design/generate_ladder_sticks.mjs [toolsDir]   (default E:/stake/tools/gen)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2] ?? 'E:/stake/tools/gen';
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');

const DEFS = `<defs>
	<linearGradient id="lit" x1="0" x2="1">
		<stop offset="0" stop-color="#5a0c04"/><stop offset=".22" stop-color="#b3200f"/>
		<stop offset=".42" stop-color="#ff6a4a"/><stop offset=".55" stop-color="#e2412a"/>
		<stop offset="1" stop-color="#6a1006"/>
	</linearGradient>
	<linearGradient id="off" x1="0" x2="1">
		<stop offset="0" stop-color="#101114"/><stop offset=".45" stop-color="#3a3d45"/><stop offset="1" stop-color="#15171b"/>
	</linearGradient>
	<linearGradient id="band" x1="0" x2="1">
		<stop offset="0" stop-color="#6e5230"/><stop offset=".45" stop-color="#e8cf9a"/><stop offset="1" stop-color="#6e5230"/>
	</linearGradient>
	<linearGradient id="bandoff" x1="0" x2="1">
		<stop offset="0" stop-color="#1e2024"/><stop offset=".45" stop-color="#4a4d55"/><stop offset="1" stop-color="#1e2024"/>
	</linearGradient>
</defs>`;

const LIT = `
	<path d="M14 11 C14 5 17 2 21 3" fill="none" stroke="#3a2a18" stroke-width="2.4" stroke-linecap="round"/>
	<path d="M14 11 C14 5 17 2 21 3" fill="none" stroke="#b8976a" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="1.6 1"/>
	<rect x="6" y="11" width="16" height="34" rx="3" fill="url(#lit)" stroke="#3a0802" stroke-width=".8"/>
	<rect x="9.2" y="14" width="2.2" height="28" rx="1.1" fill="#fff" opacity=".35"/>
	<rect x="6" y="29" width="16" height="6" fill="url(#band)" stroke="#4a3418" stroke-width=".5"/>
	<line x1="6" y1="31" x2="22" y2="31" stroke="#8a6a3a" stroke-width=".4"/>
	<line x1="6" y1="33" x2="22" y2="33" stroke="#8a6a3a" stroke-width=".4"/>
	<ellipse cx="14" cy="11.2" rx="8" ry="2.6" fill="#ecd9b2" stroke="#7a5a30" stroke-width=".6"/>
	<ellipse cx="14" cy="11.2" rx="3" ry="1" fill="#a88a5a"/>`;

const OFF = `
	<path d="M14 11 C14 6 16 4 19 4.5" fill="none" stroke="#2a2c32" stroke-width="2" stroke-linecap="round"/>
	<rect x="6" y="11" width="16" height="34" rx="3" fill="url(#off)" stroke="#07080a" stroke-width=".8"/>
	<rect x="9.2" y="14" width="2.2" height="28" rx="1.1" fill="#fff" opacity=".06"/>
	<rect x="6" y="29" width="16" height="6" fill="url(#bandoff)"/>
	<ellipse cx="14" cy="11.2" rx="8" ry="2.6" fill="#4a4d55" stroke="#15171b" stroke-width=".6"/>
	<ellipse cx="14" cy="11.2" rx="3" ry="1" fill="#2a2c32"/>`;

// 28 x 48 drawing at 4x: sharp at the counter's size on a 2x screen
const SCALE = 4;
for (const [name, body] of [
	['ladder_stick_lit', LIT],
	['ladder_stick_off', OFF],
]) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${28 * SCALE}" height="${48 * SCALE}" viewBox="0 0 28 48">${DEFS}${body}</svg>`;
	const png = new Resvg(svg, { background: 'rgba(0,0,0,0)' }).render().asPng();
	fs.writeFileSync(path.join(OUT, `${name}.png`), png);
	console.log(`${name}.png ${28 * SCALE}x${48 * SCALE} ${png.length} bytes`);
}
