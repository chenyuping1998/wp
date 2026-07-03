// GoBananas jungle-commando backgrounds + reel frame (comic flat style to
// match the sticker symbol set). Supersedes the 中國風 sections of the old
// generate_art.mjs (kept in git history at 7b5de6a).
// Usage: node design/generate_theme_jungle.mjs <dir containing node_modules with @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_theme_jungle.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BG_DIR = path.join(appRoot, 'static/assets/sprites/goBananasBackground');
const FRAME_DIR = path.join(appRoot, 'static/assets/sprites/goBananasFrame');
fs.mkdirSync(BG_DIR, { recursive: true });
fs.mkdirSync(FRAME_DIR, { recursive: true });

const INK = '#211a12';

const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

// deterministic PRNG
let seed = 77;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};

// angular comic palm frond fanning from (x,y)
const frond = (x, y, r, angle, color, blades = 5, spread = 110) => {
	let out = '';
	for (let i = 0; i < blades; i++) {
		const a = ((angle - spread / 2 + (spread / (blades - 1)) * i) * Math.PI) / 180;
		const tipX = x + Math.cos(a) * r;
		const tipY = y + Math.sin(a) * r;
		const perp = a + Math.PI / 2;
		const wx = Math.cos(perp) * r * 0.13;
		const wy = Math.sin(perp) * r * 0.13;
		out += `<path d="M ${x} ${y} L ${x + wx + Math.cos(a) * r * 0.4} ${y + wy + Math.sin(a) * r * 0.4} L ${tipX} ${tipY} L ${x - wx + Math.cos(a) * r * 0.4} ${y - wy + Math.sin(a) * r * 0.4} Z" fill="${color}"/>`;
	}
	return out;
};

// scattered angular leaves
const leafScatter = (count, color, w, h, yMin, yMax) => {
	let out = '';
	for (let i = 0; i < count; i++) {
		const x = rand() * w;
		const y = yMin + rand() * (yMax - yMin);
		const s = 14 + rand() * 26;
		const a = rand() * 360;
		out += `<path d="M 0 ${-s} L ${s * 0.5} 0 L 0 ${s} L ${-s * 0.5} 0 Z" fill="${color}" opacity="${0.5 + rand() * 0.4}" transform="translate(${x} ${y}) rotate(${a})"/>`;
	}
	return out;
};

const jungleScene = ({ sky0, sky1, sun, far, mid, near, accent, sunY = 330, extra = '' }) =>
	svgWrap(
		1920,
		1080,
		`
	<rect width="1920" height="1080" fill="url(#sky)"/>
	<circle cx="960" cy="${sunY}" r="300" fill="${sun}" opacity="0.5"/>
	<circle cx="960" cy="${sunY}" r="210" fill="${sun}" opacity="0.7"/>
	<!-- far canopy band -->
	<path d="M 0 560 Q 160 480 320 540 Q 480 470 640 530 Q 800 460 960 525 Q 1120 465 1280 530 Q 1440 470 1600 540 Q 1760 480 1920 550 L 1920 1080 L 0 1080 Z" fill="${far}"/>
	<!-- mid hills -->
	<path d="M 0 720 Q 320 630 640 700 Q 960 630 1280 700 Q 1600 640 1920 710 L 1920 1080 L 0 1080 Z" fill="${mid}"/>
	<!-- near ground -->
	<path d="M 0 900 Q 480 830 960 880 Q 1440 830 1920 890 L 1920 1080 L 0 1080 Z" fill="${near}"/>
	<!-- corner palms -->
	<g>
		<path d="M 150 1080 Q 130 800 190 640" stroke="${near}" stroke-width="42" fill="none" stroke-linecap="round"/>
		${frond(195, 630, 260, -90, mid, 6, 150)}
		<path d="M 1770 1080 Q 1795 820 1735 660" stroke="${near}" stroke-width="42" fill="none" stroke-linecap="round"/>
		${frond(1730, 650, 260, -90, mid, 6, 150)}
	</g>
	<!-- big corner fronds framing the board -->
	${frond(-30, 90, 330, 55, far, 6, 120)}
	${frond(1950, 90, 330, 125, far, 6, 120)}
	${leafScatter(26, accent, 1920, 1080, 520, 1060)}
	${extra}
	<rect width="1920" height="1080" fill="url(#vign)"/>`,
		`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${sky0}"/><stop offset="1" stop-color="${sky1}"/>
		</linearGradient>
		<radialGradient id="vign" cx="0.5" cy="0.46" r="0.85">
			<stop offset="0.6" stop-color="#000" stop-opacity="0"/>
			<stop offset="1" stop-color="#06180b" stop-opacity="0.55"/>
		</radialGradient>`,
	);

const backgrounds = {};

// base game — sunny jungle patrol
backgrounds.bg_base = jungleScene({
	sky0: '#8ee3f5',
	sky1: '#d8f5c8',
	sun: '#fff9c4',
	far: '#4d9e3f',
	mid: '#37812e',
	near: '#245c22',
	accent: '#69db7c',
});

// free game — sunset firefight energy
backgrounds.bg_feature = jungleScene({
	sky0: '#f76707',
	sky1: '#ffd43b',
	sun: '#fff3bf',
	far: '#7a4415',
	mid: '#5b3110',
	near: '#3c200b',
	accent: '#ffa94d',
	sunY: 420,
	extra: `<g fill="#2b1a08" opacity="0.85">
		<path d="M 320 620 L 336 560 L 352 620 Z"/>
		<path d="M 1560 640 L 1576 580 L 1592 640 Z"/>
	</g>`,
});

// superspin — night ops with searchlights
backgrounds.bg_superspin = jungleScene({
	sky0: '#0e2038',
	sky1: '#1d3d4f',
	sun: '#dbe9f4',
	far: '#173c2c',
	mid: '#102b20',
	near: '#0a1d15',
	accent: '#2f9e44',
	sunY: 240,
	extra: `
	<g fill="#fff" opacity="0.75">
		<circle cx="240" cy="150" r="3"/><circle cx="480" cy="90" r="2"/><circle cx="720" cy="200" r="2.5"/>
		<circle cx="1180" cy="120" r="2"/><circle cx="1420" cy="180" r="3"/><circle cx="1680" cy="100" r="2"/>
	</g>
	<g fill="#ffe066" opacity="0.1">
		<path d="M 340 1080 L 480 0 L 700 0 L 480 1080 Z"/>
		<path d="M 1580 1080 L 1440 0 L 1220 0 L 1440 1080 Z"/>
	</g>`,
});

// ─── reel frame (1280×1280, board occupies the centered 1000×1000) ──────────
const frames = {};

// olive metal panel behind the reels
frames.frame_bg = svgWrap(
	1280,
	1280,
	`
	<rect x="104" y="104" width="1072" height="1072" rx="36" fill="url(#panel)"/>
	<rect x="126" y="126" width="1028" height="1028" rx="26" fill="none" stroke="#5a6b3a" stroke-width="4" opacity="0.6"/>
	<g stroke="#141d10" stroke-width="4" opacity="0.6">
		<path d="M 344 130 L 344 1150 M 558 130 L 558 1150 M 772 130 L 772 1150 M 986 130 L 986 1150"/>
	</g>`,
	`<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#22301a"/><stop offset="0.5" stop-color="#2b3c21"/><stop offset="1" stop-color="#1b2715"/>
	</linearGradient>`,
);

// riveted olive border with hazard-stripe corners and a star badge
const rivets = () => {
	let out = '';
	const pos = [];
	for (let i = 0; i < 9; i++) pos.push(150 + i * 122.5);
	for (const p of pos) {
		out += `<circle cx="${p}" cy="70" r="9"/><circle cx="${p}" cy="1210" r="9"/><circle cx="70" cy="${p}" r="9"/><circle cx="1210" cy="${p}" r="9"/>`;
	}
	return `<g fill="#c8d6a2" stroke="${INK}" stroke-width="3">${out}</g>`;
};

const hazardCorner = (x, y, rot) => `
	<g transform="translate(${x} ${y}) rotate(${rot})">
		<path d="M 0 0 L 150 0 L 150 34 L 0 34 Z" fill="#FAC775" stroke="${INK}" stroke-width="5"/>
		<g fill="${INK}">
			<path d="M 8 0 L 40 0 L 8 34 L -8 34 Z" transform="translate(16 0)"/>
			<path d="M 8 0 L 40 0 L 8 34 L -8 34 Z" transform="translate(72 0)"/>
			<path d="M 8 0 L 40 0 L 8 34 L -8 34 Z" transform="translate(128 0)"/>
		</g>
	</g>`;

frames.frame_edge = svgWrap(
	1280,
	1280,
	`
	<rect x="70" y="70" width="1140" height="1140" rx="48" fill="none" stroke="url(#olive)" stroke-width="64"/>
	<rect x="42" y="42" width="1196" height="1196" rx="60" fill="none" stroke="${INK}" stroke-width="10"/>
	<rect x="99" y="99" width="1082" height="1082" rx="38" fill="none" stroke="#141d10" stroke-width="8"/>
	<rect x="90" y="90" width="1100" height="1100" rx="42" fill="none" stroke="#8fae5b" stroke-width="5" opacity="0.8"/>
	${rivets()}
	${hazardCorner(96, 54, 0)}
	${hazardCorner(1184, 54, 90)}
	${hazardCorner(1184, 1226, 180)}
	${hazardCorner(96, 1226, 270)}
	<!-- top-center star badge -->
	<g transform="translate(640 66)">
		<circle r="52" fill="url(#badge)" stroke="${INK}" stroke-width="8"/>
		<circle r="38" fill="#2b3c21" stroke="#141d10" stroke-width="4"/>
		<path d="M 0 -26 L 8 -8 L 27 -8 L 12 4 L 18 23 L 0 12 L -18 23 L -12 4 L -27 -8 L -8 -8 Z"
			fill="#FAC775" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
	</g>
	<!-- bottom-center dog tags -->
	<g transform="translate(640 1210)">
		<rect x="-44" y="-24" width="52" height="34" rx="12" transform="rotate(-10)" fill="#c8d6a2" stroke="${INK}" stroke-width="5"/>
		<rect x="-6" y="-20" width="52" height="34" rx="12" transform="rotate(8)" fill="#8fae5b" stroke="${INK}" stroke-width="5"/>
		<path d="M -30 -30 Q 0 -46 34 -28" stroke="#c8d6a2" stroke-width="5" fill="none"/>
	</g>`,
	`<linearGradient id="olive" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#66803c"/><stop offset="0.3" stop-color="#4d6330"/><stop offset="0.7" stop-color="#3f5228"/><stop offset="1" stop-color="#2e3d1e"/>
	</linearGradient>
	<radialGradient id="badge" cx="0.4" cy="0.35" r="1">
		<stop offset="0" stop-color="#8fae5b"/><stop offset="1" stop-color="#4d6330"/>
	</radialGradient>`,
);

// ─── render ──────────────────────────────────────────────────────────────────
const render = (svg, outPath, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } });
	fs.writeFileSync(outPath, resvg.render().asPng());
	console.log('rendered', path.basename(outPath));
};

for (const [name, svg] of Object.entries(backgrounds)) {
	render(svg, path.join(BG_DIR, `${name}.png`), 1920);
}
for (const [name, svg] of Object.entries(frames)) {
	render(svg, path.join(FRAME_DIR, `${name}.png`), 1280);
}
console.log('done');
