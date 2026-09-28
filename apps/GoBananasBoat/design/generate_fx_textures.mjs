// Soft-falloff FX textures for GoBananas — additive sprites instead of vector
// Graphics particles, so bursts, dust and ambient motes read as rendered light
// rather than flat circles. Tinted per use at runtime, so every texture is
// pure white here.
// Usage: node design/generate_fx_textures.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_fx_textures.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasFx');
fs.mkdirSync(OUT, { recursive: true });

const svgWrap = (size, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs>${defs}</defs>${body}</svg>`;

const render = (svg, name, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, name), resvg.render().asPng());
	console.log('rendered', name);
};

// soft radial glow — the workhorse behind flashes, dust puffs and bokeh
const glow = svgWrap(
	128,
	`<circle cx="64" cy="64" r="62" fill="url(#g)"/>`,
	`<radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
		<stop offset="0.25" stop-color="#ffffff" stop-opacity="0.85"/>
		<stop offset="0.55" stop-color="#ffffff" stop-opacity="0.3"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</radialGradient>`,
);

// 4-point sparkle with a soft bed — win twinkles, scatter sparks
const star = svgWrap(
	128,
	`<circle cx="64" cy="64" r="56" fill="url(#g)"/>
	<path d="M 64 8 Q 70 52 76 58 Q 82 62 120 64 Q 82 66 76 70 Q 70 76 64 120 Q 58 76 52 70 Q 46 66 8 64 Q 46 62 52 58 Q 58 52 64 8 Z" fill="url(#s)"/>`,
	`<radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
		<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.12"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</radialGradient>
	<radialGradient id="s" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
		<stop offset="0.6" stop-color="#ffffff" stop-opacity="0.9"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0.4"/>
	</radialGradient>`,
);

// motion streak — soft-ended ellipse for fast debris and shockwave shards
const streak = svgWrap(
	128,
	`<ellipse cx="64" cy="64" rx="60" ry="10" fill="url(#l)"/>`,
	`<radialGradient id="l" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
		<stop offset="0.45" stop-color="#ffffff" stop-opacity="0.6"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</radialGradient>`,
);

// TORN CANVAS SCRAP — the debris this game actually makes.
//
// This was a banana leaf, and it was thrown by both of the game's biggest
// moments: the burst that opens every round and the burst behind a big win.
// There is no foliage anywhere in a container port, so a third of the sparks in
// the two most-seen celebrations were from the previous generation's jungle.
//
// A scrap of tarpaulin is what comes off a crate here, and it is the one piece
// of debris a player has already watched being pulled (see MysteryReveal). Drawn
// as a rough quadrilateral with ONE ragged edge rather than four: at the ten-odd
// pixels these are on screen, detail on every side turns into a blob, and a
// single torn edge against three straight ones is what reads as "torn".
//
// White, like the star, because FxBurst tints it.
const scrap = svgWrap(
	128,
	`<path d="M 30 16 L 98 8 L 104 92 Q 86 84 72 100 Q 58 116 44 102 Q 34 92 30 16 Z" fill="url(#sc)"/>
	<path d="M 44 22 Q 56 62 50 98" stroke="#ffffff" stroke-opacity="0.4" stroke-width="3" fill="none"/>`,
	`<linearGradient id="sc" x1="0" y1="0" x2="0.3" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0.5"/>
	</linearGradient>`,
);

// dark-edge / clear-centre vignette — depth without hiding the board
const vignette = svgWrap(
	256,
	`<rect width="256" height="256" fill="url(#v)"/>`,
	`<radialGradient id="v" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#000000" stop-opacity="0"/>
		<stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
		<!-- was #0C1404 / #060A02, a dark GREEN — and this vignette is drawn over
		     the whole game (Game.svelte), so every background in the ship was
		     being tinted towards the jungle it came from. -->
		<stop offset="0.8" stop-color="#0b141a" stop-opacity="0.5"/>
		<stop offset="1" stop-color="#05090c" stop-opacity="0.88"/>
	</radialGradient>`,
);


// AIR BUBBLE — the diving helmet's trail (meshWin/fx.ts). A thin bright rim, a
// nearly clear middle and one highlight: drawn with a normal blend, so on dark
// steel it reads as a bubble and not as a light.
const bubble = svgWrap(
	128,
	`<circle cx="64" cy="64" r="54" fill="url(#b)" stroke="#ffffff" stroke-opacity="0.9" stroke-width="7"/>
	<ellipse cx="46" cy="42" rx="15" ry="10" transform="rotate(-35 46 42)" fill="#ffffff" fill-opacity="0.95"/>
	<circle cx="84" cy="88" r="5" fill="#ffffff" fill-opacity="0.6"/>`,
	`<radialGradient id="b" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.08"/>
		<stop offset="0.8" stop-color="#ffffff" stop-opacity="0.22"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0.5"/>
	</radialGradient>`,
);

// SMOKE / MIST PUFF — lumpy, not a disc: five soft lobes, so a puff that turns
// as it grows reads as smoke rather than a growing circle
const puff = svgWrap(
	128,
	[
		[64, 70, 36],
		[42, 58, 26],
		[86, 56, 24],
		[52, 84, 24],
		[80, 86, 26],
	]
		.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#p)"/>`)
		.join(''),
	`<radialGradient id="p" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/>
		<stop offset="0.6" stop-color="#ffffff" stop-opacity="0.35"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</radialGradient>`,
);

// WATER DROPLET — the helmet's splash. Round head to the RIGHT, tail to the
// left: fx.ts stretches it along its velocity, so it flies head first.
const drop = svgWrap(
	128,
	`<path d="M 8 64 Q 60 46 92 44 A 20 20 0 1 1 92 84 Q 60 82 8 64 Z" fill="url(#d)"/>
	<circle cx="100" cy="56" r="6" fill="#ffffff"/>`,
	`<linearGradient id="d" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
		<stop offset="0.6" stop-color="#ffffff" stop-opacity="0.7"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="1"/>
	</linearGradient>`,
);

render(glow, 'fx_glow.png', 128);
render(star, 'fx_star.png', 128);
render(streak, 'fx_streak.png', 128);
render(scrap, 'fx_scrap.png', 128);
render(vignette, 'fx_vignette.png', 256);
render(bubble, 'fx_bubble.png', 128);
render(puff, 'fx_puff.png', 128);
render(drop, 'fx_drop.png', 128);
console.log('fx textures written to', OUT);
