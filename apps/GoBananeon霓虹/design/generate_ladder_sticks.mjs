// The neon charge cells of the blast ladder, as PNGs for the free-spin counter
// (FreeSpinCounter.svelte draws the ladder in pixi, so it cannot use the SVG
// the buy menu draws inline).
//
// The drawing is the SAME cell as the buy menu's (ModalBuyBonus.svelte,
// `stick`), so the ladder the player chose on the card is the one they watch
// fill in the feature. Keep the two in step. (Gen-1 of this file drew
// GoBoomana's dynamite sticks.)
//
// No glow in either file: the counter animates its own round the plasma orb
// (it pulses, flashes on a new rung and breathes on the next one to light), at
// ORB below — the same point in the 28 x 48 drawing.
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

const DEFS = '';

// ModalBuyBonus.svelte's `stick` snippet, lit and unlit
const LIT = `
	<rect x="3" y="10" width="22" height="28" rx="10" fill="#17265a" stroke="#59e3ff" stroke-width="2"/>
	<circle cx="14" cy="24" r="7" fill="#b143ec"/>
	<path d="M16 15 L10 25 H14 L12 33 L19 22 H15 Z" fill="#fff4fb"/>`;

const OFF = `
	<rect x="3" y="10" width="22" height="28" rx="10" fill="#10172d" stroke="#465071" stroke-width="2"/>
	<circle cx="14" cy="24" r="5" fill="#28345c"/>`;

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
