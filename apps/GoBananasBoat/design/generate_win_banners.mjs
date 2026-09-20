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

// The game's display face, self-hosted alongside the runtime copy the bet bar
// uses (game/fonts.ts). Baked headline art and live Text have to be the same
// typeface or the banner reads as a different game to the amount inside it.
const FONT_DIR = path.join(appRoot, 'static/fonts');
const BANNER_FONT = 'Titan One';
// Measured rather than assumed: the widest tier name (SUPER WIN) inks 727px at
// this size against 876px of clear space inside the brass frame, so 128 carries
// over from the previous face unchanged.
const TIER_SIZE = 128;
fs.mkdirSync(OUT, { recursive: true });

const W = 1000;
const H = 560;

// Each tier is a different MATERIAL, climbing from the everyday to the treasure,
// inside one shared brass setting: teak deck plank, polished brass, verdigris
// copper, storm-night iron, and finally solid gold with navy lettering. The
// plates used to be one brass plate recoloured (and BIG was jungle green, the
// commonest win in the game wearing another game's colour). A player reading the
// plaque should be able to tell how big the win is from the stuff it is made of,
// before the words.
const TIERS = {
	big: { text: 'BIG WIN', a: '#8a5a2c', b: '#3e2410', rim: '#e0a860', planks: true },
	superwin: { text: 'SUPER WIN', a: '#b0812a', b: '#4e3208', rim: '#ffd75e', brushed: true },
	mega: { text: 'MEGA WIN', a: '#2e9a86', b: '#0a4a42', rim: '#7ef0d4', patina: true },
	epic: { text: 'EPIC WIN', a: '#2c3a4a', b: '#080d14', rim: '#9fd8ff', stars: true },
	max: { text: 'MAX WIN', a: '#ffe08a', b: '#a8761a', rim: '#fff3c4', gold: true },
};

// international signal flag colours, cycled along the setting
const INLAY = ['#d8402c', '#f4f0e2', '#2f5fb8', '#f0c030'];

const flagBand = () => {
	let out = '';
	const cell = 34;
	const gap = 6;
	const t = 16;
	for (let x = 104; x + cell <= W - 104; x += cell + gap) {
		const i = Math.round((x - 104) / (cell + gap));
		for (const y of [59, H - 59 - t]) {
			out += `<rect x="${x}" y="${y}" width="${cell}" height="${t}" rx="3" fill="${INLAY[i % 4]}" stroke="#2a1a04" stroke-width="1.5"/>`;
		}
	}
	for (let y = 104; y + cell <= H - 104; y += cell + gap) {
		const i = Math.round((y - 104) / (cell + gap));
		for (const x of [59, W - 59 - t]) {
			out += `<rect x="${x}" y="${y}" width="${t}" height="${cell}" rx="3" fill="${INLAY[(i + 2) % 4]}" stroke="#2a1a04" stroke-width="1.5"/>`;
		}
	}
	return out;
};

// the anchor over the top edge: ring, stock, shaft, curved arms with flukes
const anchor = () => {
	const cx = W / 2;
	const shape = (stroke, w, color) => `
	<g fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="${cx}" cy="15" r="8"/>
		<path d="M ${cx - 24} 33 L ${cx + 24} 33"/>
		<path d="M ${cx} 23 L ${cx} 76"/>
		<path d="M ${cx - 38} 56 Q ${cx - 34} 78 ${cx} 80 Q ${cx + 34} 78 ${cx + 38} 56"/>
	</g>
	<path d="M ${cx - 46} 54 L ${cx - 30} 50 L ${cx - 38} 64 Z M ${cx + 46} 54 L ${cx + 30} 50 L ${cx + 38} 64 Z" fill="${color}" stroke="${stroke}" stroke-width="${w > 8 ? 4 : 0}" stroke-linejoin="round"/>`;
	return shape('#4a3008', 13, '#4a3008') + shape('url(#gold)', 7, 'url(#gold)');
};

// mooring-bollard studs in the corners: brass cap over a dark neck
const studs = () =>
	[
		[66, 66],
		[W - 66, 66],
		[66, H - 66],
		[W - 66, H - 66],
	]
		.map(
			([x, y]) => `<circle cx="${x}" cy="${y}" r="23" fill="url(#gold)" stroke="#5e4210" stroke-width="3"/>
	<circle cx="${x}" cy="${y}" r="13" fill="#2a1a04" stroke="#6b470c" stroke-width="2"/>
	<circle cx="${x - 4}" cy="${y - 4}" r="4" fill="#ffffff" opacity="0.4"/>`,
		)
		.join('');

// four-point compass sparkles on the storm plate, clear of the name and the well
const plateStars = () => {
	let out = '';
	for (const [x, y] of [
		[160, 140], [240, 118], [770, 118], [850, 140], [150, 250], [860, 250],
	]) {
		const p = Array.from({ length: 8 }, (_, k) => {
			const ang = (k / 8) * Math.PI * 2;
			const r = k % 2 === 0 ? 13 : 3.5;
			return `${(x + Math.sin(ang) * r).toFixed(1)},${(y - Math.cos(ang) * r).toFixed(1)}`;
		});
		out += `<polygon points="${p.join(' ')}" fill="#bfe6ff" opacity="0.7"/>`;
	}
	return out;
};

// material surface details, drawn over the plate under the frame
const material = ({ planks, brushed, patina }) => {
	let out = '';
	if (planks) {
		for (const y of [128, 222, 316, 410]) {
			out += `<rect x="40" y="${y}" width="${W - 80}" height="3" fill="#1c0e04" opacity="0.4"/>`;
			const x = y % 2 ? 320 : 660;
			out += `<rect x="${x}" y="${y - 94}" width="3" height="94" fill="#1c0e04" opacity="0.3"/>`;
		}
	}
	if (brushed) {
		for (let y = 44; y < H - 44; y += 7) {
			out += `<rect x="40" y="${y}" width="${W - 80}" height="1.5" fill="#ffffff" opacity="${(0.04 + (0.05 * ((y * 7) % 5)) / 5).toFixed(3)}"/>`;
		}
	}
	if (patina) {
		for (const [x, y, r] of [
			[190, 150, 90], [800, 210, 110], [330, 420, 90], [850, 400, 70], [520, 120, 70],
		]) {
			out += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#verd)"/>`;
		}
	}
	return out;
};

const banner = ({ text, a, b, rim, stars, gold, planks, brushed, patina }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
${surfaceDefs('sf')}
	<linearGradient id="plate" x1="0" y1="0" x2="0.3" y2="1">
		<stop offset="0" stop-color="${a}"/>
		<stop offset="1" stop-color="${b}"/>
	</linearGradient>
	<linearGradient id="gold" x1="0.15" y1="0" x2="0.6" y2="1">
		<stop offset="0" stop-color="#fff8d2"/>
		<stop offset="0.3" stop-color="#ffd86a"/>
		<stop offset="0.65" stop-color="#e8ae3c"/>
		<stop offset="1" stop-color="#9a6a14"/>
	</linearGradient>
	<radialGradient id="verd" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#9af0d8" stop-opacity="0.32"/>
		<stop offset="1" stop-color="#9af0d8" stop-opacity="0"/>
	</radialGradient>
	<linearGradient id="tierFace" x1="0" y1="0" x2="0" y2="1">
		${gold
			? '<stop offset="0" stop-color="#5a8ad8"/><stop offset="0.5" stop-color="#1f4a9a"/><stop offset="1" stop-color="#0a1f52"/>'
			: '<stop offset="0" stop-color="#fffbe8"/><stop offset="0.45" stop-color="#ffd75e"/><stop offset="1" stop-color="#c9821a"/>'}
	</linearGradient>
	<radialGradient id="inner" cx="0.5" cy="0.62" r="0.7">
		<stop offset="0" stop-color="#000000" stop-opacity="${gold ? 0.72 : 0.6}"/>
		<stop offset="1" stop-color="#000000" stop-opacity="${gold ? 0.5 : 0.2}"/>
	</radialGradient>
	<radialGradient id="sheen" cx="0.35" cy="0.2" r="0.8">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
	</radialGradient>
</defs>
<!-- the material -->
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="30" fill="url(#plate)" stroke="#17120a" stroke-width="8"/>
${finishRect(34, 34, W - 68, H - 68, 30, 'sf', CANVAS_FINISH)}
${material({ planks, brushed, patina })}
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="30" fill="url(#sheen)"/>
${stars ? plateStars() : ''}
<!-- brass setting, the channel the flags sit in, inner brass line -->
<rect x="44" y="44" width="${W - 88}" height="${H - 88}" rx="24" fill="none" stroke="url(#gold)" stroke-width="10"/>
<rect x="56" y="56" width="${W - 112}" height="${H - 112}" rx="14" fill="none" stroke="#3a2608" stroke-width="22"/>
${flagBand()}
<rect x="78" y="78" width="${W - 156}" height="${H - 156}" rx="10" fill="none" stroke="url(#gold)" stroke-width="5"/>
<rect x="86" y="86" width="${W - 172}" height="${H - 172}" rx="8" fill="none" stroke="${rim}" stroke-width="2" opacity="0.6"/>
${studs()}
${anchor()}
<!-- dark centre well where the amount rolls -->
<rect x="120" y="286" width="${W - 240}" height="170" rx="20" fill="url(#inner)"/>
<rect x="120" y="286" width="${W - 240}" height="170" rx="20" fill="none" stroke="url(#gold)" stroke-width="4"/>
<!-- Tier name in the game's display face. Titan One is single-weight, so no
     font-weight is requested — asking for 900 risks resvg failing the match and
     silently substituting a system face. -->
<text x="${W / 2 + 5}" y="235" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="#1a0e02" opacity="0.55">${text}</text>
<text x="${W / 2}" y="230" font-family="${BANNER_FONT}" font-size="${TIER_SIZE}" text-anchor="middle" fill="url(#tierFace)" stroke="${gold ? '#fff3c4' : '#54330a'}" stroke-width="7" paint-order="stroke">${text}</text>
</svg>`;

for (const [alias, tier] of Object.entries(TIERS)) {
	const resvg = new Resvg(banner(tier), {
		fitTo: { mode: 'width', value: W },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Titan One' },
	});
	fs.writeFileSync(path.join(OUT, `${alias}.png`), resvg.render().asPng());
	console.log('rendered', `${alias}.png`);
}
console.log('win banners written to', OUT);
