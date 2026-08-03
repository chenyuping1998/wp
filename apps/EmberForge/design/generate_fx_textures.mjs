// Soft-falloff FX textures for Ember Forge — additive sprites instead of vector
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
const OUT = path.join(appRoot, 'static/assets/sprites/emberForgeFx');
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

// metal shard — debris thrown by a cluster burning out. Kept under the fx_leaf
// name because it is tinted per use at runtime and every call site already
// references that key; only the silhouette changed (soft blade, not a leaf).
const leaf = svgWrap(
	128,
	`<path d="M 64 4 L 88 52 L 78 122 L 64 96 L 50 122 L 40 52 Z" fill="url(#lf)"/>
	<path d="M 64 14 L 64 104" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3"/>`,
	`<linearGradient id="lf" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0.45"/>
	</linearGradient>`,
);

// dark-edge / clear-centre vignette — depth without hiding the board
const vignette = svgWrap(
	256,
	`<rect width="256" height="256" fill="url(#v)"/>`,
	`<radialGradient id="v" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#000000" stop-opacity="0"/>
		<stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
		<stop offset="0.8" stop-color="#0c1404" stop-opacity="0.5"/>
		<stop offset="1" stop-color="#060a02" stop-opacity="0.88"/>
	</radialGradient>`,
);

render(glow, 'fx_glow.png', 128);
render(star, 'fx_star.png', 128);
render(streak, 'fx_streak.png', 128);
render(leaf, 'fx_leaf.png', 128);
render(vignette, 'fx_vignette.png', 256);
console.log('fx textures written to', OUT);
