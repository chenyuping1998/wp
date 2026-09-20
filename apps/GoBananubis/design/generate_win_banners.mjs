// Win-tier plaques for Go Bananubis: gold-framed tomb tablets with the tier name
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
// this size, and the clear space inside the inlay band is 840px.
const TIER_SIZE = 128;
fs.mkdirSync(OUT, { recursive: true });

const W = 1000;
const H = 560;

// THE PLAQUES ARE TOMB TABLETS NOW, not jungle ammo plates.
//
// They were olive drill canvas with a brass frame and a ring of rivets — Go
// Bananas 100's army look, and by then the last thing in this game still
// dressed for the jungle: the board frame, the free-spin sign and the Buy Bonus
// had all gone Egyptian, and the biggest moment of a session still arrived on a
// green metal plate.
//
// Each tier is one of the stones Egyptian jewellers worked, climbing in heat and
// rarity — lapis, turquoise faience, carnelian, obsidian — and MAX is the one
// plate made of gold itself, lettered in lapis. The frame is the same across the
// set: gold, with an inlay band of lapis / carnelian / turquoise cells (the Buy
// Bonus scarab's rim and wings), carnelian-set gold studs at the corners, and
// the winged sun spread across the top edge as it is over every temple doorway.
//
// Layout is unchanged, because Win.svelte draws the amount into it: tier name
// baseline at 230, the dark well at y 286..456.
const TIERS = {
	big: { text: 'BIG WIN', a: '#2f55a8', b: '#0d1a46', rim: '#8fb4ff', stars: true },
	superwin: { text: 'SUPER WIN', a: '#1f9a8c', b: '#0a4640', rim: '#8ff0e0' },
	mega: { text: 'MEGA WIN', a: '#c24a2a', b: '#5a160a', rim: '#ffab80' },
	epic: { text: 'EPIC WIN', a: '#3a3440', b: '#0a080c', rim: '#ffd75e', stars: true },
	max: { text: 'MAX WIN', a: '#ffe08a', b: '#a8761a', rim: '#fff3c4', gold: true },
};

const INLAY = ['#3f74de', '#e8643c', '#3fd0bd'];

// the inlay band: cells along the straight runs of the setting
const inlayBand = () => {
	let out = '';
	const cell = 34;
	const gap = 6;
	const t = 16;
	for (let x = 104; x + cell <= W - 104; x += cell + gap) {
		const i = Math.round((x - 104) / (cell + gap));
		for (const y of [59, H - 59 - t]) {
			out += `<rect x="${x}" y="${y}" width="${cell}" height="${t}" rx="3" fill="${INLAY[i % 3]}"/>`;
		}
	}
	for (let y = 104; y + cell <= H - 104; y += cell + gap) {
		const i = Math.round((y - 104) / (cell + gap));
		for (const x of [59, W - 59 - t]) {
			out += `<rect x="${x}" y="${y}" width="${t}" height="${cell}" rx="3" fill="${INLAY[(i + 1) % 3]}"/>`;
		}
	}
	return out;
};

// the winged sun over the top edge: a carnelian disc, two uraei, and wings of
// three feather rows each side, the middle row inlaid
const wingedSun = () => {
	const cx = W / 2;
	const cy = 46;
	let out = '';
	for (const d of [-1, 1]) {
		for (let row = 0; row < 3; row++) {
			const len = [170, 140, 108][row];
			const y0 = cy - 16 + row * 11;
			const n = 9;
			for (let i = 0; i < n; i++) {
				const x0 = cx + d * (32 + (i / n) * len);
				const x1 = cx + d * (32 + ((i + 1) / n) * len);
				const drop = (i / n) * 12;
				const fill = row === 1 ? INLAY[(i + (d > 0 ? 0 : 1)) % 3] : 'url(#gold)';
				out += `<path d="M ${x0.toFixed(1)} ${(y0 + drop).toFixed(1)} L ${x1.toFixed(1)} ${(y0 + drop + 1.3).toFixed(1)} L ${x1.toFixed(1)} ${(y0 + drop + 12.3).toFixed(1)} L ${x0.toFixed(1)} ${(y0 + drop + 11).toFixed(1)} Z" fill="${fill}" stroke="#5e4210" stroke-width="2"/>`;
			}
		}
		// the uraeus, rearing beside the disc
		out += `<path d="M ${cx + d * 24} ${cy + 18} q ${d * 12} -18 ${d * 2} -36 q ${d * -8} -10 ${d * 2} -14 q ${d * 10} 6 ${d * 6} 16 q ${d * -6} 14 ${d * 4} 34 Z" fill="url(#gold)" stroke="#5e4210" stroke-width="2.5"/>`;
	}
	out += `<circle cx="${cx}" cy="${cy}" r="27" fill="url(#gold)" stroke="#5e4210" stroke-width="3"/>
	<circle cx="${cx}" cy="${cy}" r="19" fill="url(#carnelian)" stroke="#6b470c" stroke-width="2"/>
	<ellipse cx="${cx - 6}" cy="${cy - 7}" rx="6" ry="4" fill="#ffffff" opacity="0.5"/>`;
	return out;
};

const studs = () =>
	[
		[66, 66],
		[W - 66, 66],
		[66, H - 66],
		[W - 66, H - 66],
	]
		.map(
			([x, y]) => `<rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="5" fill="url(#gold)" stroke="#5e4210" stroke-width="3"/>
	<rect x="${x - 10}" y="${y - 10}" width="20" height="20" rx="2" fill="url(#carnelian)" stroke="#6b470c" stroke-width="2"/>`,
		)
		.join('');

// ceiling stars on the dark stones, clear of the name and the well
const plateStars = () => {
	let out = '';
	for (const [x, y] of [
		[160, 140], [240, 118], [770, 118], [850, 140], [150, 250], [860, 250],
	]) {
		const p = Array.from({ length: 10 }, (_, k) => {
			const a = (k / 10) * Math.PI * 2;
			const r = k % 2 === 0 ? 11 : 4;
			return `${(x + Math.sin(a) * r).toFixed(1)},${(y - Math.cos(a) * r).toFixed(1)}`;
		});
		out += `<polygon points="${p.join(' ')}" fill="#e8b84a" opacity="0.7"/>`;
	}
	return out;
};

const banner = ({ text, a, b, rim, stars, gold }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
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
	<radialGradient id="carnelian" cx="0.35" cy="0.3" r="0.8">
		<stop offset="0" stop-color="#ff9a6a"/>
		<stop offset="0.45" stop-color="#d8452a"/>
		<stop offset="1" stop-color="#7e1c0c"/>
	</radialGradient>
	<linearGradient id="tierFace" x1="0" y1="0" x2="0" y2="1">
		${gold
			? '<stop offset="0" stop-color="#6c98ee"/><stop offset="0.5" stop-color="#2d56b8"/><stop offset="1" stop-color="#132c70"/>'
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
<!-- the stone -->
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="30" fill="url(#plate)" stroke="#1a1206" stroke-width="8"/>
${finishRect(34, 34, W - 68, H - 68, 30, 'sf', CANVAS_FINISH)}
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="30" fill="url(#sheen)"/>
${stars ? plateStars() : ''}
<!-- gold setting, the channel the inlay sits in, inner gold line -->
<rect x="44" y="44" width="${W - 88}" height="${H - 88}" rx="24" fill="none" stroke="url(#gold)" stroke-width="10"/>
<rect x="56" y="56" width="${W - 112}" height="${H - 112}" rx="14" fill="none" stroke="#6b470c" stroke-width="22"/>
${inlayBand()}
<rect x="78" y="78" width="${W - 156}" height="${H - 156}" rx="10" fill="none" stroke="url(#gold)" stroke-width="5"/>
<rect x="86" y="86" width="${W - 172}" height="${H - 172}" rx="8" fill="none" stroke="${rim}" stroke-width="2" opacity="0.6"/>
${studs()}
${wingedSun()}
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
