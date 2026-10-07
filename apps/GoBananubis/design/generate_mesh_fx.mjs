// Art drawn through a mesh that replaces template motion (see the component).
// (The pay frame that used to be made here was taken out: it pulled the eye off
// the symbols' own win acts.)
//
//   line_ribbon.png      the win line's cross-section (WinLineRibbon.svelte): a
//                        white-hot core in a soft falloff, tinted per line; drawn
//                        a second time dark and wider as the scorch under it
//
// Usage: node design/generate_mesh_fx.mjs <dir with node_modules/@resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_mesh_fx.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasFx');
fs.mkdirSync(OUT, { recursive: true });

const render = (svg, name, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, name), resvg.render().asPng());
	console.log('rendered', name);
};

// ── the win line's cross-section ───────────────────────────────────────────
const ribbon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
	<defs>
		<linearGradient id="r" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
			<stop offset="0.22" stop-color="#ffffff" stop-opacity="0.16"/>
			<stop offset="0.4" stop-color="#ffffff" stop-opacity="0.55"/>
			<stop offset="0.47" stop-color="#ffffff" stop-opacity="1"/>
			<stop offset="0.53" stop-color="#ffffff" stop-opacity="1"/>
			<stop offset="0.6" stop-color="#ffffff" stop-opacity="0.55"/>
			<stop offset="0.78" stop-color="#ffffff" stop-opacity="0.16"/>
			<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
		</linearGradient>
	</defs>
	<rect x="0" y="0" width="64" height="64" fill="url(#r)"/>
</svg>`;
render(ribbon, 'line_ribbon.png', 64);
