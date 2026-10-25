// Code-native typography keeps the low pays consistent with the game's own face.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../../tools/gen/package.json', import.meta.url));
const { Resvg } = require('@resvg/resvg-js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'design/source/neon_premium/symbols');
fs.mkdirSync(out, { recursive: true });
const symbols = [
	['l1', 'A', '#82eeff', '#29adce', '#153b59'],
	['l2', 'K', '#ff9dda', '#db438e', '#602442'],
	['l3', 'Q', '#ffe79b', '#dba638', '#63451a'],
	['l4', 'J', '#9befcf', '#36b68e', '#174d43'],
	['l5', '10', '#d7b7ff', '#9064d2', '#39275d'],
];
for (const [name, label, light, mid, dark] of symbols) {
	const size = label === '10' ? 112 : 148;
	const base = label === '10' ? 176 : 184;
	const glyph = `<text x="128" y="${base}" text-anchor="middle" font-family="Titan One" font-size="${size}" letter-spacing="-6">${label}</text>`;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256">
	<defs>
	<linearGradient id="face" x1="0" y1="0" x2="0.15" y2="1"><stop stop-color="${light}"/><stop offset=".42" stop-color="${mid}"/><stop offset=".47" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
	<linearGradient id="edge" x2=".6" y2="1"><stop stop-color="${light}"/><stop offset=".44" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
	<clipPath id="letter">${glyph}</clipPath>
	</defs>
	<g stroke-linejoin="round">
	<g transform="translate(0 9)" fill="${dark}" stroke="#080e24" stroke-width="10">${glyph}</g>
	<g fill="url(#edge)" stroke="#0b142b" stroke-width="9">${glyph}</g>
	<g fill="url(#edge)" stroke="url(#edge)" stroke-width="4">${glyph}</g>
	<g fill="url(#face)" stroke="${light}" stroke-width=".7">${glyph}</g>
	</g>
	<g clip-path="url(#letter)" fill="#ffffff" opacity=".15"><path d="M22 63L216 38L226 66L20 97Z"/><path d="M20 102L233 73L233 78L20 109Z"/></g>
	</svg>`;
	fs.writeFileSync(path.join(out, `${name}.svg`), svg);
	const png = new Resvg(svg, { font: { fontFiles: [path.join(root, 'static/fonts/TitanOne.ttf')], loadSystemFonts: false, defaultFontFamily: 'Titan One' } }).render().asPng();
	fs.writeFileSync(path.join(out, `${name}.png`), png);
}
console.log('Premium A/K/Q/J/10: transparent enamel typography generated');

// Hold-and-spin values are drawn at runtime: keep the medal's centre dark and
// quiet, with the craft concentrated on its machined rim.
const marks = Array.from({ length: 36 }, (_, i) => `<path d="M128 27V${i % 3 ? 31 : 35}" transform="rotate(${i * 10} 128 128)"/>`).join('');
const medal = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256"><defs>
<linearGradient id="steel" x2=".75" y2="1"><stop stop-color="#eefaff"/><stop offset=".18" stop-color="#8da6c3"/><stop offset=".38" stop-color="#253650"/><stop offset=".54" stop-color="#e4f5ff"/><stop offset=".76" stop-color="#607892"/><stop offset="1" stop-color="#19263c"/></linearGradient>
<radialGradient id="inset" cx=".38" cy=".28" r=".8"><stop stop-color="#24375e"/><stop offset=".6" stop-color="#101b39"/><stop offset="1" stop-color="#070d21"/></radialGradient>
</defs><circle cx="128" cy="133" r="112" fill="#060a18"/><circle cx="128" cy="128" r="112" fill="url(#steel)" stroke="#080e21" stroke-width="3"/><circle cx="128" cy="128" r="104" fill="#0e1c34" stroke="#b8d4e7" stroke-width="1.2"/><g stroke="#7696af" stroke-width="1.7" opacity=".85">${marks}</g><circle cx="128" cy="128" r="93" fill="url(#inset)" stroke="#23d5ec" stroke-width="4"/><circle cx="128" cy="128" r="88" fill="none" stroke="#6aecf7" stroke-width=".7"/><path d="M54 76A89 89 0 0 1 147 41" fill="none" stroke="#d5fcff" stroke-width="2.5" stroke-linecap="round"/><path d="M84 207A88 88 0 0 0 193 184" fill="none" stroke="#be46ce" stroke-width="1.5" opacity=".8"/></svg>`;
const cross = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 256 256"><defs><linearGradient id="x" x2="0" y2="1"><stop stop-color="#c0d5df"/><stop offset=".5" stop-color="#6990a8"/><stop offset="1" stop-color="#39536d"/></linearGradient></defs><path d="M85 75L128 118L171 75L187 91L144 134L187 177L171 193L128 150L85 193L69 177L112 134L69 91Z" fill="#071125" stroke="#071125" stroke-width="5"/><path d="M85 69L128 112L171 69L187 85L144 128L187 171L171 187L128 144L85 187L69 171L112 128L69 85Z" fill="url(#x)" stroke="#b6d5de" stroke-width="1"/></svg>`;
for (const [name, svg] of [['p', medal], ['x', cross]]) {
	fs.writeFileSync(path.join(out, `${name}.svg`), svg);
	fs.writeFileSync(path.join(out, `${name}.png`), new Resvg(svg).render().asPng());
}
console.log('Premium prize medal and empty marker generated');
