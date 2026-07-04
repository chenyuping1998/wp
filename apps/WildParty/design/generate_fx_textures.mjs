// Soft-falloff FX textures — replaces hard-edged Graphics particles so bursts
// and ambient motes read as rendered light, not vector shapes.
// Usage: node design/generate_fx_textures.mjs <dir containing node_modules with @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_fx_textures.mjs <dir containing node_modules with @resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/wildPartyFx');
fs.mkdirSync(OUT, { recursive: true });

const svgWrap = (size, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs>${defs}</defs>${body}</svg>`;

const render = (svg, name, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, name), resvg.render().asPng());
	console.log('rendered', name);
};

// soft radial glow — the workhorse: white core fading to nothing
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

// 4-point star sparkle with soft glow behind it
const star = svgWrap(
	128,
	`<circle cx="64" cy="64" r="56" fill="url(#g)"/>
	<path d="M 64 8 Q 70 52 76 58 Q 82 62 120 64 Q 82 66 76 70 Q 70 76 64 120 Q 58 76 52 70 Q 46 66 8 64 Q 46 62 52 58 Q 58 52 64 8 Z" fill="url(#s)"/>
	<path d="M 40 40 Q 62 58 88 88 M 88 40 Q 66 58 40 88" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3" fill="none"/>`,
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

// motion streak — soft-ended horizontal line for fast sparks
const streak = svgWrap(
	128,
	`<ellipse cx="64" cy="64" rx="60" ry="10" fill="url(#l)"/>`,
	`<radialGradient id="l" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
		<stop offset="0.45" stop-color="#ffffff" stop-opacity="0.6"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</radialGradient>`,
);

render(glow, 'fx_glow.png', 128);
render(star, 'fx_star.png', 128);
render(streak, 'fx_streak.png', 128);
console.log('fx textures written to', OUT);
