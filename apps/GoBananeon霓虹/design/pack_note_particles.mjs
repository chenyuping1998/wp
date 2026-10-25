// The win spray's particles: neon-tube music notes instead of bananas
// (2026-10-25, user: 「把 gb 霓虹的得分時噴香蕉效果改成噴其他符合這款風格的東西」).
//
// The game is a synthwave night street whose top symbol is a boombox, so a
// win plays music: eighth notes and beamed pairs bent out of neon tube, in
// the four high symbols' colours (H1 magenta, H2 cyan, H3 lime, H4 orange;
// gold stays the Scatter's). Each is drawn the way a neon sign is: a soft
// halo, the coloured tube, and a thin hot core — the glow is baked into the
// texture because the spray draws with a normal blend.
//
// Ten frames in the banana sheet's format and 256px cells
// (design/pack_banana_particles.mjs), so the shared fountain config draws
// them at the bananas' size; the emitter gives each particle one at random.
//
//   node design/pack_note_particles.mjs E:/stake/tools/gen
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/pack_note_particles.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananeonWinNotes');
const CELL = 256;
const COLS = 5;

const MAGENTA = '#ff3ad0';
const CYAN = '#3ee8ff';
const LIME = '#b8ff3a';
const ORANGE = '#ff9a2e';

// the two note shapes, in a 200x200 box, as tube centre-lines
// eighth note: an oval head, a stem up its right side, a flag curling down
const EIGHTH = `
	<ellipse cx="78" cy="152" rx="30" ry="21" transform="rotate(-22 78 152)"/>
	<path d="M106 146 L106 34"/>
	<path d="M106 34 C122 52 150 62 148 98 C147 112 140 120 132 126"/>`;
// beamed pair: two heads, two stems and a slanted beam
const BEAMED = `
	<ellipse cx="52" cy="160" rx="25" ry="18" transform="rotate(-22 52 160)"/>
	<ellipse cx="142" cy="140" rx="25" ry="18" transform="rotate(-22 142 140)"/>
	<path d="M75 155 L75 52"/>
	<path d="M165 135 L165 32"/>
	<path d="M75 52 L165 32"/>
	<path d="M75 74 L165 54"/>`;

// (shape, colour, turn deg)
const VIEWS = [
	[EIGHTH, MAGENTA, -8], [BEAMED, CYAN, 6], [EIGHTH, LIME, 14], [BEAMED, ORANGE, -12], [EIGHTH, CYAN, -20],
	[BEAMED, MAGENTA, -4], [EIGHTH, ORANGE, 10], [BEAMED, LIME, 16], [EIGHTH, MAGENTA, 22], [BEAMED, CYAN, -16],
];

const note = (shape, colour, turn, id) => `
<g transform="translate(${CELL / 2} ${CELL / 2}) rotate(${turn}) scale(1.18) translate(-100 -100)" fill="none" stroke-linecap="round" stroke-linejoin="round">
	<g stroke="${colour}" stroke-width="30" opacity="0.35" filter="url(#halo${id})">${shape}</g>
	<g stroke="#0a0614" stroke-width="20" opacity="0.55">${shape}</g>
	<g stroke="${colour}" stroke-width="14">${shape}</g>
	<g stroke="#ffffff" stroke-width="4.5" opacity="0.9">${shape}</g>
</g>`;

const W = CELL * COLS;
const H = CELL * Math.ceil(VIEWS.length / COLS);
let body = '';
let defs = '';
const frames = {};
const files = [];
VIEWS.forEach(([shape, colour, turn], i) => {
	const x = (i % COLS) * CELL;
	const y = Math.floor(i / COLS) * CELL;
	defs += `<filter id="halo${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>`;
	body += `<g transform="translate(${x} ${y})">${note(shape, colour, turn, i)}</g>`;
	const name = `note_${String(i + 1).padStart(2, '0')}.png`;
	files.push(name);
	frames[name] = {
		frame: { x, y, w: CELL, h: CELL }, rotated: false, trimmed: false,
		spriteSourceSize: { x: 0, y: 0, w: CELL, h: CELL }, sourceSize: { w: CELL, h: CELL },
	};
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'notes.png'), new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
fs.writeFileSync(
	path.join(OUT, 'notes.json'),
	JSON.stringify({ frames, animations: { note: files }, meta: { app: 'design/pack_note_particles.mjs', version: '1.0', image: 'notes.png', format: 'RGBA8888', size: { w: W, h: H }, scale: '1' } }, null, '\t'),
);
console.log(`packed ${files.length} frames -> ${path.relative(appRoot, OUT)} (${W}x${H})`);
