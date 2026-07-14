// WildParty side sign — the "WILD PARTY" plaque that sits to the left of the
// reels (reference: Made Men's logo plaque). Renders only the plaque plate;
// the "WILD PARTY" lettering is laid on at runtime with the `gold` bitmap
// font so it stays crisp at any scale (see WildPartySign.svelte).
//
// Visual language mirrors generate_frames_party.mjs frame_edge: gold-gradient
// trim with ink outline, deep-plum panel, pink inner accent, corner sparkles.
//
// Usage: node design/generate_side_sign.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node generate_side_sign.mjs <dir with node_modules/@resvg>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/wpSign');
fs.mkdirSync(OUT_DIR, { recursive: true });

const INK = '#2a0a20';
const W = 420, H = 300;

const sparkle = (x, y, s, color = '#fff8d0') =>
	`<path d="M ${x} ${y - 8 * s} Q ${x + 2 * s} ${y - 2 * s} ${x + 8 * s} ${y} Q ${x + 2 * s} ${y + 2 * s} ${x} ${y + 8 * s} Q ${x - 2 * s} ${y + 2 * s} ${x - 8 * s} ${y} Q ${x - 2 * s} ${y - 2 * s} ${x} ${y - 8 * s} Z" fill="${color}" opacity="0.95"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
	<linearGradient id="panelBg" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3d1245"/><stop offset="0.55" stop-color="#251035"/><stop offset="1" stop-color="#180a28"/>
	</linearGradient>
	<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="1" stop-color="#b8791a"/>
	</linearGradient>
</defs>
<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="46" fill="url(#gold)" stroke="${INK}" stroke-width="10"/>
<rect x="38" y="38" width="${W - 76}" height="${H - 76}" rx="30" fill="url(#panelBg)" stroke="${INK}" stroke-width="5"/>
<rect x="48" y="48" width="${W - 96}" height="${H - 96}" rx="24" fill="none" stroke="#ff8ede" stroke-width="2.5" opacity="0.5"/>
${sparkle(34, 34, 1)}
${sparkle(W - 34, 34, 1, '#ff8ede')}
${sparkle(34, H - 34, 1, '#ff8ede')}
${sparkle(W - 34, H - 34, 1)}
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
fs.writeFileSync(path.join(OUT_DIR, 'wp_side_sign.png'), png);
console.log('rendered wp_side_sign.png', W, 'x', H);
