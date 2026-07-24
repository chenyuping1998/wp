// Win-tier plaques for GoBananas: brass-framed jungle plates with the tier name
// baked in, one per win level. The amount is drawn by the frontend inside the
// plate's dark centre (see Win.svelte), so these stay language-neutral apart
// from the tier name, which is the standard English slot vocabulary.
// Usage: node design/generate_win_banners.mjs <dir with node_modules for @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_win_banners.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

import { surfaceDefs, finishRect, CANVAS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasWinBanners');
fs.mkdirSync(OUT, { recursive: true });

const W = 1000;
const H = 560;

// tier → ribbon colours; the frame stays brass across the set so the plaques
// read as one family, only the ribbon and glow shift with intensity
const TIERS = {
	big: { text: 'BIG WIN', a: '#5c7a1e', b: '#2c4614', rim: '#9ec44a' },
	superwin: { text: 'SUPER WIN', a: '#a8791a', b: '#6b4a0c', rim: '#ffd75e' },
	mega: { text: 'MEGA WIN', a: '#b8541a', b: '#70300c', rim: '#ffa347' },
	epic: { text: 'EPIC WIN', a: '#a8281a', b: '#66160c', rim: '#ff7a4a' },
	max: { text: 'MAX WIN', a: '#7a1a5c', b: '#4a0c38', rim: '#ff8ede' },
};

const rivets = () => {
	let out = '';
	for (let i = 0; i < 9; i++) {
		const x = 120 + i * 95;
		out += `<circle cx="${x}" cy="66" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
		<circle cx="${x}" cy="${H - 66}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>`;
	}
	for (let i = 0; i < 3; i++) {
		const y = 150 + i * 130;
		out += `<circle cx="66" cy="${y}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
		<circle cx="${W - 66}" cy="${y}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>`;
	}
	return out;
};

const banner = ({ text, a, b, rim }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
${surfaceDefs('sf')}
	<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="${a}"/>
		<stop offset="1" stop-color="${b}"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe282"/>
		<stop offset="0.45" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<linearGradient id="tierFace" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#fffbe8"/>
		<stop offset="0.45" stop-color="#ffd75e"/>
		<stop offset="1" stop-color="#c9821a"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.7" stop-color="#c08a20"/>
		<stop offset="1" stop-color="#6d4a08"/>
	</radialGradient>
	<radialGradient id="inner" cx="0.5" cy="0.62" r="0.7">
		<stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.1"/>
	</radialGradient>
	<filter id="grain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="17" result="t"/>
		<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.05 0.05 0.05 0 0"/>
	</filter>
</defs>
<!-- plate -->
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="46" fill="url(#plate)" stroke="#17120a" stroke-width="8"/>
${finishRect(34, 34, W - 68, H - 68, 46, 'sf', CANVAS_FINISH)}
<!-- brass frame -->
<rect x="48" y="48" width="${W - 96}" height="${H - 96}" rx="36" fill="none" stroke="url(#brass)" stroke-width="14"/>
<rect x="64" y="64" width="${W - 128}" height="${H - 128}" rx="26" fill="none" stroke="${rim}" stroke-width="3" opacity="0.8"/>
${rivets()}
<!-- dark centre well where the amount rolls -->
<rect x="120" y="286" width="${W - 240}" height="170" rx="26" fill="url(#inner)"/>
<rect x="120" y="286" width="${W - 240}" height="170" rx="26" fill="none" stroke="${rim}" stroke-width="3" opacity="0.55"/>
<!-- tier name -->
<text x="${W / 2 + 5}" y="235" font-family="Arial Black, Arial" font-size="128" font-weight="900" text-anchor="middle" fill="#3a2408" opacity="0.55">${text}</text>
<text x="${W / 2}" y="230" font-family="Arial Black, Arial" font-size="128" font-weight="900" text-anchor="middle" fill="url(#tierFace)" stroke="#54330a" stroke-width="7" paint-order="stroke">${text}</text>
</svg>`;

for (const [alias, tier] of Object.entries(TIERS)) {
	const resvg = new Resvg(banner(tier), { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true } });
	fs.writeFileSync(path.join(OUT, `${alias}.png`), resvg.render().asPng());
	console.log('rendered', `${alias}.png`);
}
console.log('win banners written to', OUT);
