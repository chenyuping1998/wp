// GoBananas jungle-commando backgrounds + reel frame — PAINTERLY edition,
// matched to the realistic AI-painted symbol set (w_expand.png golden-hour
// palette). Supersedes the earlier comic-flat version (git history has it).
// Layered soft gradients + feTurbulence texture stand in for brushwork:
//   bg_base      golden dawn over the jungle savanna (basegame)
//   bg_feature   blazing sunset assault (freegame)
//   bg_superspin night ops under the moon, gold fireflies (superspin)
//   frame_bg     dark-olive canvas plate behind the reels
//   frame_edge   brass-trimmed military frame with rivets
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

import { surfaceDefs, finishRect, CANVAS_FINISH, BACKDROP_FINISH, STEEL_FINISH, BRASS_FINISH } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BG_DIR = path.join(appRoot, 'static/assets/sprites/goBananasBackground');
const FRAME_DIR = path.join(appRoot, 'static/assets/sprites/goBananasFrame');
fs.mkdirSync(BG_DIR, { recursive: true });
fs.mkdirSync(FRAME_DIR, { recursive: true });

// surfaceDefs is injected into every document so the shared finish filters
// (grain / brushed / scratch / mottle / specular / edge / AO) are always
// available without each caller remembering to include them.
const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${surfaceDefs('sf')}${defs}</defs>${body}</svg>`;

// deterministic PRNG
let seed = 77;
const rand = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};

// ─── painterly building blocks ───────────────────────────────────────────────
// canvas grain — subtle brush-tooth so the flats don't read as vector
const grainDef = (id, freq = 0.9, dark = 0.05) => `
<filter id="${id}" x="0" y="0" width="100%" height="100%">
	<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="31" result="t"/>
	<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${dark} ${dark} ${dark} 0 0"/>
</filter>`;

// drooping painted palm: curved trunk + hanging fronds (quadratic ribs)
const palm = (x, groundY, height, lean, color, scale = 1) => {
	const topX = x + lean;
	const topY = groundY - height;
	let out = `<path d="M ${x} ${groundY} Q ${x + lean * 0.3} ${groundY - height * 0.55} ${topX} ${topY}"
		fill="none" stroke="${color}" stroke-width="${16 * scale}" stroke-linecap="round"/>`;
	// trunk ring nicks
	for (let i = 1; i < 6; i++) {
		const t = i / 6;
		const rx = x + lean * 0.3 * 2 * t * (1 - t) + lean * t * t;
		const ry = groundY - height * t;
		out += `<line x1="${rx - 7 * scale}" y1="${ry}" x2="${rx + 7 * scale}" y2="${ry - 3}" stroke="${color}" stroke-width="${3 * scale}" opacity="0.7"/>`;
	}
	const fronds = 7;
	for (let i = 0; i < fronds; i++) {
		const a = -160 + (320 / (fronds - 1)) * i; // degrees, fan over the top
		const rad = (a * Math.PI) / 180;
		const len = height * (0.42 + rand() * 0.1) * scale;
		const midX = topX + Math.cos(rad) * len * 0.55;
		const midY = topY + Math.sin(rad) * len * 0.28 - len * 0.18;
		const tipX = topX + Math.cos(rad) * len;
		const tipY = topY + Math.abs(Math.sin(rad)) * len * 0.42 + len * 0.1;
		out += `<path d="M ${topX} ${topY} Q ${midX} ${midY} ${tipX} ${tipY}"
			fill="none" stroke="${color}" stroke-width="${9 * scale}" stroke-linecap="round"/>`;
		// leaflets hanging off the frond spine
		for (let k = 1; k <= 4; k++) {
			const t = k / 5;
			const px = topX + (midX - topX) * 2 * t * (1 - t) + (tipX - topX) * t * t;
			const py = topY + (midY - topY) * 2 * t * (1 - t) + (tipY - topY) * t * t;
			const drop = 10 + 16 * t;
			out += `<path d="M ${px} ${py} q ${6 * Math.sign(Math.cos(rad))} ${drop} ${2 * Math.sign(Math.cos(rad))} ${drop + 8}" fill="none" stroke="${color}" stroke-width="${3.5 * scale}" stroke-linecap="round" opacity="0.9"/>`;
		}
	}
	return out;
};

// god rays fanning down from (sx, sy)
const rays = (sx, sy, color, count = 7, alpha = 0.1) => {
	let out = '';
	for (let i = 0; i < count; i++) {
		const a = -90 + (i - (count - 1) / 2) * 16 + (rand() - 0.5) * 6;
		const rad = (a * Math.PI) / 180;
		const len = 1400;
		const halfW = 24 + rand() * 42;
		const perp = rad + Math.PI / 2;
		const x1 = sx + Math.cos(perp) * halfW * 0.25, y1 = sy + Math.sin(perp) * halfW * 0.25;
		const x2 = sx - Math.cos(perp) * halfW * 0.25, y2 = sy - Math.sin(perp) * halfW * 0.25;
		const x3 = sx + Math.cos(rad) * len - Math.cos(perp) * halfW, y3 = sy + Math.sin(rad) * len - Math.sin(perp) * halfW;
		const x4 = sx + Math.cos(rad) * len + Math.cos(perp) * halfW, y4 = sy + Math.sin(rad) * len + Math.sin(perp) * halfW;
		out += `<polygon points="${x1.toFixed(0)},${y1.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)} ${x3.toFixed(0)},${y3.toFixed(0)} ${x4.toFixed(0)},${y4.toFixed(0)}" fill="${color}" opacity="${(alpha * (0.6 + rand() * 0.8)).toFixed(3)}"/>`;
	}
	return out;
};

// scattered glow dots (dust motes / fireflies / embers)
const motes = (count, color, w, yMin, yMax, rMin = 2, rMax = 5) => {
	let out = '';
	for (let i = 0; i < count; i++) {
		const x = rand() * w;
		const y = yMin + rand() * (yMax - yMin);
		const r = rMin + rand() * (rMax - rMin);
		out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(0.25 + rand() * 0.5).toFixed(2)}"/>`;
	}
	return out;
};

// rolling grass field with hand-placed blades
const grassField = (topY, cTop, cBot, blades, bladeColor) => {
	let strokes = '';
	for (let i = 0; i < blades; i++) {
		const x = rand() * 1920;
		const y = topY + 40 + rand() * (1080 - topY - 60);
		const h = 20 + rand() * 46;
		const swayX = (rand() - 0.5) * 26;
		strokes += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} Q ${(x + swayX * 0.4).toFixed(0)} ${(y - h * 0.6).toFixed(0)} ${(x + swayX).toFixed(0)} ${(y - h).toFixed(0)}" fill="none" stroke="${bladeColor}" stroke-width="${(2 + rand() * 2.4).toFixed(1)}" stroke-linecap="round" opacity="${(0.3 + rand() * 0.45).toFixed(2)}"/>`;
	}
	return `<path d="M 0 ${topY + 30} Q 480 ${topY - 20} 960 ${topY + 16} Q 1440 ${topY - 14} 1920 ${topY + 22} L 1920 1080 L 0 1080 Z" fill="url(#grass_${topY})"/>
	${strokes}`;
};
const grassDef = (topY, cTop, cBot) => `<linearGradient id="grass_${topY}" x1="0" y1="0" x2="0" y2="1">
	<stop offset="0" stop-color="${cTop}"/><stop offset="1" stop-color="${cBot}"/>
</linearGradient>`;



// ─── lush-jungle building blocks (trees WITH leaves) ─────────────────────────
// scalloped canopy band: overlapping foliage blobs along a wavy treeline with
// a sunlit rim on top, then a solid fill below
const canopyBand = (baseY, amp, color, rimColor, blobR, w = 1920) => {
	let blobs = '';
	let rims = '';
	for (let x = -blobR; x < w + blobR; x += blobR * 0.9) {
		const cy = baseY + Math.sin(x * 0.008) * amp + (rand() - 0.5) * amp * 0.7;
		const r = blobR * (0.75 + rand() * 0.5);
		blobs += `<circle cx="${x.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${color}"/>`;
		if (rimColor) {
			rims += `<circle cx="${(x - r * 0.2).toFixed(0)}" cy="${(cy - r * 0.35).toFixed(0)}" r="${(r * 0.62).toFixed(0)}" fill="${rimColor}" opacity="${(0.25 + rand() * 0.25).toFixed(2)}"/>`;
		}
	}
	return `${blobs}${rims}<rect x="0" y="${baseY + blobR * 0.4}" width="${w}" height="${1080 - baseY - blobR * 0.4}" fill="${color}"/>`;
};

// leafy palm: curved trunk + fronds carrying little leaf blades on both sides
const leafyPalm = (x, groundY, height, lean, trunkColor, leafColor, scale = 1) => {
	const topX = x + lean;
	const topY = groundY - height;
	let out = `<path d="M ${x} ${groundY} Q ${x + lean * 0.3} ${groundY - height * 0.55} ${topX} ${topY}"
		fill="none" stroke="${trunkColor}" stroke-width="${15 * scale}" stroke-linecap="round"/>`;
	const fronds = 8;
	for (let i = 0; i < fronds; i++) {
		const a = -165 + (330 / (fronds - 1)) * i;
		const rad = (a * Math.PI) / 180;
		const len = height * (0.44 + rand() * 0.1) * scale;
		const midX = topX + Math.cos(rad) * len * 0.55;
		const midY = topY + Math.sin(rad) * len * 0.28 - len * 0.16;
		const tipX = topX + Math.cos(rad) * len;
		const tipY = topY + Math.abs(Math.sin(rad)) * len * 0.4 + len * 0.14;
		out += `<path d="M ${topX} ${topY} Q ${midX} ${midY} ${tipX} ${tipY}" fill="none" stroke="${leafColor}" stroke-width="${5 * scale}" stroke-linecap="round"/>`;
		// leaf blades on BOTH sides of the spine, tapering to the tip
		for (let k = 1; k <= 7; k++) {
			const t = k / 8;
			const px = topX + (midX - topX) * 2 * t * (1 - t) + (tipX - topX) * t * t;
			const py = topY + (midY - topY) * 2 * t * (1 - t) + (tipY - topY) * t * t;
			const bladeLen = (26 - t * 16) * scale;
			const dirX = tipX - topX, dirY = tipY - topY;
			const dl = Math.hypot(dirX, dirY) || 1;
			const perpX = (-dirY / dl) * bladeLen, perpY = (dirX / dl) * bladeLen;
			const alongX = (dirX / dl) * bladeLen * 0.45, alongY = (dirY / dl) * bladeLen * 0.45;
			for (const side of [1, -1]) {
				out += `<path d="M ${px} ${py} Q ${px + side * perpX * 0.7 + alongX * 0.4} ${py + side * perpY * 0.7 + alongY * 0.4 + bladeLen * 0.35} ${px + side * perpX * 0.25 + alongX} ${py + side * perpY * 0.25 + alongY + bladeLen * 0.8} Q ${px + alongX * 0.5} ${py + alongY * 0.5 + bladeLen * 0.4} ${px} ${py} Z" fill="${leafColor}"/>`;
			}
		}
	}
	return out;
};

// broad banana leaf: fat blade with a midrib, drooping from (x,y)
const bananaLeaf = (x, y, len, angleDeg, color, midColor) => {
	const rad = (angleDeg * Math.PI) / 180;
	const tipX = x + Math.cos(rad) * len;
	const tipY = y + Math.sin(rad) * len + len * 0.22;
	const perp = rad + Math.PI / 2;
	const w = len * 0.3;
	const c1x = x + Math.cos(rad) * len * 0.45 + Math.cos(perp) * w;
	const c1y = y + Math.sin(rad) * len * 0.45 + Math.sin(perp) * w;
	const c2x = x + Math.cos(rad) * len * 0.45 - Math.cos(perp) * w;
	const c2y = y + Math.sin(rad) * len * 0.45 - Math.sin(perp) * w;
	return `<path d="M ${x} ${y} Q ${c1x} ${c1y} ${tipX} ${tipY} Q ${c2x} ${c2y} ${x} ${y} Z" fill="${color}"/>
	<path d="M ${x} ${y} Q ${(x + tipX) / 2 + Math.cos(perp) * 4} ${(y + tipY) / 2 + Math.sin(perp) * 4} ${tipX} ${tipY}" fill="none" stroke="${midColor}" stroke-width="${len * 0.03}" opacity="0.8"/>`;
};

// dark foreground foliage fanning out of a bottom corner
const cornerFoliage = (x, y, flip, color, midColor, s = 1) => {
	let out = '';
	for (const a of [-88, -64, -40, -18]) {
		out += bananaLeaf(x, y, (260 + rand() * 90) * s, flip ? -180 - a : a, color, midColor);
	}
	return out;
};

const backgrounds = {};

// ─── bg_base: golden morning over a lush jungle ─────────────────────────────
seed = 77;
backgrounds.bg_base = svgWrap(
	1920,
	1080,
	`
	<rect width="1920" height="1080" fill="url(#skyBase)"/>
	<circle cx="960" cy="430" r="300" fill="#fff7d6" opacity="0.5" filter="url(#glowBig)"/>
	<circle cx="960" cy="430" r="150" fill="#fffbe8" opacity="0.85" filter="url(#glowSmall)"/>
	${rays(960, 430, '#fff3c0', 9, 0.08)}
	<!-- hazy far canopy -->
	<g filter="url(#hazeBlur)" opacity="0.8">${canopyBand(600, 26, '#8a7a30', '#c2a648', 60)}</g>
	<!-- mid canopy: sunlit green treetops -->
	${canopyBand(700, 34, '#4a6b22', '#7c9c3e', 78)}
	<!-- leafy palms breaking the canopy line -->
	${leafyPalm(150, 812, 330, 48, '#3a2c12', '#35521a', 1.05)}
	${leafyPalm(1780, 806, 350, -55, '#3a2c12', '#35521a', 1.1)}
	${leafyPalm(420, 780, 230, -30, '#443414', '#3e5c1e', 0.8)}
	${leafyPalm(1530, 776, 240, 34, '#443414', '#3e5c1e', 0.82)}
	<!-- near canopy: deep green -->
	${canopyBand(830, 30, '#2c4614', '#4a6b22', 64)}
	${grassField(930, '#243d10', '#101f06', 80, '#0c1804')}
	<!-- foreground framing leaves -->
	${cornerFoliage(-30, 1110, false, '#16260a', '#233c10', 1.15)}
	${cornerFoliage(1950, 1110, true, '#16260a', '#233c10', 1.15)}
	<g filter="url(#dotSoft)">${motes(26, '#ffe98a', 1920, 380, 900, 2, 5)}</g>
	<rect width="1920" height="1080" filter="url(#grain)" opacity="0.5"/>
	<rect width="1920" height="1080" fill="url(#vign)"/>`,
	`
	<radialGradient id="skyBase" cx="0.5" cy="0.4" r="0.95">
		<stop offset="0" stop-color="#fff3c0"/>
		<stop offset="0.34" stop-color="#ffdd82"/>
		<stop offset="0.66" stop-color="#e8a94c"/>
		<stop offset="1" stop-color="#8a6b28"/>
	</radialGradient>
	<radialGradient id="vign" cx="0.5" cy="0.5" r="0.78">
		<stop offset="0.62" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#0c1404" stop-opacity="0.5"/>
	</radialGradient>
	${grassDef(930, '#243d10', '#101f06')}
	<filter id="glowBig" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="70"/></filter>
	<filter id="glowSmall" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="26"/></filter>
	<filter id="hazeBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
	<filter id="dotSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
	${grainDef('grain')}`,
);

// ─── bg_feature: blazing sunset jungle ───────────────────────────────────────
seed = 4242;
backgrounds.bg_feature = svgWrap(
	1920,
	1080,
	`
	<rect width="1920" height="1080" fill="url(#skyFeat)"/>
	<circle cx="960" cy="520" r="330" fill="#ffce6e" opacity="0.55" filter="url(#glowBig)"/>
	<circle cx="960" cy="520" r="160" fill="#ffedb8" opacity="0.9" filter="url(#glowSmall)"/>
	${rays(960, 520, '#ffd977', 11, 0.12)}
	<g filter="url(#hazeBlur)" opacity="0.85">${canopyBand(580, 26, '#7a4418', '#b8742e', 60)}</g>
	${canopyBand(690, 34, '#4d3814', '#8a5c1e', 78)}
	${leafyPalm(140, 806, 340, 55, '#2a160a', '#3c2810', 1.12)}
	${leafyPalm(1790, 800, 355, -60, '#2a160a', '#3c2810', 1.15)}
	${leafyPalm(430, 776, 235, -32, '#331d0c', '#4a3312', 0.82)}
	${leafyPalm(1510, 772, 245, 36, '#331d0c', '#4a3312', 0.84)}
	${canopyBand(824, 30, '#2c1c0a', '#553a12', 64)}
	${grassField(926, '#241606', '#120a02', 70, '#0e0802')}
	${cornerFoliage(-30, 1110, false, '#140c04', '#241608', 1.15)}
	${cornerFoliage(1950, 1110, true, '#140c04', '#241608', 1.15)}
	<g filter="url(#dotSoft)">${motes(34, '#ffb04a', 1920, 420, 980, 2, 6)}</g>
	<rect width="1920" height="1080" filter="url(#grain)" opacity="0.5"/>
	<rect width="1920" height="1080" fill="url(#vignFeat)"/>`,
	`
	<radialGradient id="skyFeat" cx="0.5" cy="0.48" r="1">
		<stop offset="0" stop-color="#ffe9a0"/>
		<stop offset="0.3" stop-color="#ffb054"/>
		<stop offset="0.62" stop-color="#e05e24"/>
		<stop offset="1" stop-color="#5e1a0c"/>
	</radialGradient>
	<radialGradient id="vignFeat" cx="0.5" cy="0.5" r="0.78">
		<stop offset="0.6" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#180602" stop-opacity="0.55"/>
	</radialGradient>
	${grassDef(926, '#241606', '#120a02')}
	<filter id="glowBig" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="80"/></filter>
	<filter id="glowSmall" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="28"/></filter>
	<filter id="hazeBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
	<filter id="dotSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
	${grainDef('grain')}`,
);

// ─── bg_superspin: moonlit night jungle, gold fireflies ──────────────────────
seed = 990;
const stars = (() => {
	let out = '';
	for (let i = 0; i < 90; i++) {
		const x = rand() * 1920, y = rand() * 430, r = 0.8 + rand() * 1.7;
		out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#dfeeff" opacity="${(0.25 + rand() * 0.6).toFixed(2)}"/>`;
	}
	return out;
})();
backgrounds.bg_superspin = svgWrap(
	1920,
	1080,
	`
	<rect width="1920" height="1080" fill="url(#skyNight)"/>
	${stars}
	<circle cx="1430" cy="230" r="210" fill="#bcd8f2" opacity="0.35" filter="url(#glowBig)"/>
	<circle cx="1430" cy="230" r="96" fill="url(#moon)"/>
	<circle cx="1398" cy="206" r="15" fill="#a9c4de" opacity="0.5"/>
	<circle cx="1452" cy="252" r="11" fill="#a9c4de" opacity="0.45"/>
	<circle cx="1462" cy="202" r="7" fill="#a9c4de" opacity="0.4"/>
	${rays(1430, 230, '#cfe4f8', 5, 0.05)}
	<g filter="url(#hazeBlur)" opacity="0.85">${canopyBand(590, 26, '#122a40', '#274a66', 60)}</g>
	${canopyBand(696, 34, '#0c2033', '#1e3c54', 78)}
	${leafyPalm(140, 810, 330, 50, '#050e18', '#0a1c2c', 1.1)}
	${leafyPalm(1790, 804, 345, -56, '#050e18', '#0a1c2c', 1.14)}
	${leafyPalm(430, 778, 230, -30, '#071220', '#0e2236', 0.8)}
	${leafyPalm(1520, 774, 240, 34, '#071220', '#0e2236', 0.82)}
	${canopyBand(828, 30, '#06121f', '#12283e', 64)}
	${grassField(928, '#081524', '#030a12', 70, '#020810')}
	${cornerFoliage(-30, 1110, false, '#030b14', '#0a1a2a', 1.15)}
	${cornerFoliage(1950, 1110, true, '#030b14', '#0a1a2a', 1.15)}
	<!-- gold fireflies: the superspin coin hunt -->
	<g filter="url(#dotSoft)">${motes(40, '#ffd75e', 1920, 430, 1020, 2, 6)}</g>
	<rect width="1920" height="1080" filter="url(#grain)" opacity="0.4"/>
	<rect width="1920" height="1080" fill="url(#vignNight)"/>`,
	`
	<radialGradient id="skyNight" cx="0.72" cy="0.2" r="1.15">
		<stop offset="0" stop-color="#2c4c6e"/>
		<stop offset="0.4" stop-color="#16324a"/>
		<stop offset="0.75" stop-color="#0a1c30"/>
		<stop offset="1" stop-color="#050e1c"/>
	</radialGradient>
	<radialGradient id="moon" cx="0.38" cy="0.34" r="1">
		<stop offset="0" stop-color="#f4f9ff"/>
		<stop offset="0.7" stop-color="#d5e6f5"/>
		<stop offset="1" stop-color="#9fbcd8"/>
	</radialGradient>
	<radialGradient id="vignNight" cx="0.5" cy="0.5" r="0.8">
		<stop offset="0.6" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#010409" stop-opacity="0.6"/>
	</radialGradient>
	${grassDef(928, '#081524', '#030a12')}
	<filter id="glowBig" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="60"/></filter>
	<filter id="hazeBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
	<filter id="dotSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
	${grainDef('grain', 0.9, 0.04)}`,
);


// ─── reel housing ───────────────────────────────────────────────────────────
//
// PARAMETRISED, and the old version's hardcoded geometry is why. It was authored
// as 1280x1280 with the opening a centred 1024x1024, i.e. one border thickness
// used on all four sides — fine while the board was roughly square, and wrong
// the moment it was not. The board is now 560 wide by 672 tall and the frontend
// draws the housing at FRAME_SCALE { x: 1.3, y: 1.06 }, so a uniform border
// stretches to 78px of art in a 20px slot and the reels overflow the opening by
// more than a cell.
//
// THE ASYMMETRY IS THE DESIGN, not a compromise. Height is the scarcest space in
// this game (see SYMBOL_SIZE) and width is free — the board is 560 inside 1422 of
// canvas. So the housing grips the reels at the SIDES, with heavy rails, and
// closes over the top and bottom with only a slim cap. That is also what the
// mechanic wants said: the reels are held at the sides and free vertically,
// which is exactly what they then do.
//
// Nine-slicing was the other way to solve it and is not needed here: pixi-svelte
// exposes no NineSliceSprite, and the board box is FIXED at six rows, so one
// asset only ever has to serve one size. Slicing buys flexibility nothing asks
// for, at the cost of a shared-package change.
const frames = {};

// The board's own aspect, at 2x the frontend's board space (560x672).
const BOARD_W = 1120;
const BOARD_H = 1344;
// Matches FRAME_SCALE in src/game/constants.ts. If one moves, the other must.
const BORDER_X = Math.round((BOARD_W * 1.3 - BOARD_W) / 2); // 168
const BORDER_Y = Math.round((BOARD_H * 1.06 - BOARD_H) / 2); // 40
const FRAME_W = BOARD_W + BORDER_X * 2;
const FRAME_H = BOARD_H + BORDER_Y * 2;
// the opening, in frame coordinates
const IN_X = BORDER_X;
const IN_Y = BORDER_Y;

// canvas plate behind the reels: deep olive drill-canvas
seed = 55;
frames.frame_bg = svgWrap(
	FRAME_W,
	FRAME_H,
	`
	<rect x="${IN_X}" y="${IN_Y}" width="${BOARD_W}" height="${BOARD_H}" rx="26" fill="url(#plate)"/>
	${finishRect(IN_X, IN_Y, BOARD_W, BOARD_H, 26, 'sf', BACKDROP_FINISH)}
	<!--
		No reel separators. The symbols are opaque plates that butt up against each
		other, so the grid is drawn by the symbols themselves; a separator line
		underneath would only ever be visible as a seam peeking out between two
		tiles during a spin. The plate is darkened for the same reason — it is a
		shadow gap, not a visible backdrop.

		It also has to stay dark ABOVE the reels. A four-row reel sits at the foot
		of a six-row opening, so a third of this plate is empty on most spins and it
		is the void the reels stretch into.
	-->
	<rect x="${IN_X}" y="${IN_Y}" width="${BOARD_W}" height="${BOARD_H}" rx="26" fill="#000000" opacity="0.45"/>
	<rect x="${IN_X}" y="${IN_Y}" width="${BOARD_W}" height="${BOARD_H}" rx="26" fill="url(#innerShadow)"/>
	<rect x="${IN_X + 8}" y="${IN_Y + 8}" width="${BOARD_W - 16}" height="${BOARD_H - 16}" rx="20" fill="none" stroke="#66782f" stroke-width="2" opacity="0.4"/>`,
	`
	<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#2c3812"/>
		<stop offset="0.5" stop-color="#1e2a0e"/>
		<stop offset="1" stop-color="#131c08"/>
	</linearGradient>
	<radialGradient id="innerShadow" cx="0.5" cy="0.5" r="0.72">
		<stop offset="0.72" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.42"/>
	</radialGradient>
	${grainDef('canvasGrain', 0.55, 0.06)}`,
);

// the housing itself: two heavy side rails, slim caps, transparent middle
seed = 91;

// Rivets run DOWN THE RAILS, where there is room for them, and only a few sit on
// the caps. The old version spaced them evenly around a square perimeter, which
// on this shape would crowd forty rivets into a 40px band.
const RAIL_MID_L = BORDER_X / 2;
const RAIL_MID_R = FRAME_W - BORDER_X / 2;
const rivet = (x, y, r = 11) =>
	`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
	<circle cx="${x - r * 0.27}" cy="${y - r * 0.27}" r="${r * 0.31}" fill="#fff3bd" opacity="0.8"/>`;

const rivets = (() => {
	let out = '';
	const count = 9;
	for (let i = 0; i < count; i++) {
		const y = IN_Y + (BOARD_H * (i + 0.5)) / count;
		out += rivet(RAIL_MID_L, y);
		out += rivet(RAIL_MID_R, y);
	}
	// caps get a sparse row, sized down to fit the band
	for (let i = 0; i < 5; i++) {
		const x = IN_X + (BOARD_W * (i + 0.5)) / 5;
		out += rivet(x, BORDER_Y / 2, 7);
		out += rivet(x, FRAME_H - BORDER_Y / 2, 7);
	}
	return out;
})();

frames.frame_edge = svgWrap(
	FRAME_W,
	FRAME_H,
	`
	<!-- the two side rails, drawn as filled slabs rather than a stroked ring:
	     a ring of uniform width cannot be 168 on one axis and 40 on the other -->
	<rect x="0" y="0" width="${BORDER_X}" height="${FRAME_H}" rx="22" fill="url(#bandOuter)"/>
	<rect x="${FRAME_W - BORDER_X}" y="0" width="${BORDER_X}" height="${FRAME_H}" rx="22" fill="url(#bandOuter)"/>
	<!-- caps -->
	<rect x="0" y="0" width="${FRAME_W}" height="${BORDER_Y}" rx="14" fill="url(#bandOuter)"/>
	<rect x="0" y="${FRAME_H - BORDER_Y}" width="${FRAME_W}" height="${BORDER_Y}" rx="14" fill="url(#bandOuter)"/>

	<!-- surface wear, masked to the housing so it never crosses the opening -->
	<g clip-path="url(#railClip)">
		<rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" filter="url(#sfBrushed)" fill="#000000" opacity="0.5"/>
		<rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" filter="url(#sfScratch)" fill="#000000" opacity="0.4"/>
		<rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" filter="url(#sfMottle)" fill="#000000" opacity="0.45"/>
		<rect x="0" y="0" width="${FRAME_W}" height="${FRAME_H}" fill="url(#bandLight)" opacity="0.5"/>
	</g>

	<!-- outer lip and the brass line that reads as the housing's edge -->
	<rect x="4" y="4" width="${FRAME_W - 8}" height="${FRAME_H - 8}" rx="26" fill="none" stroke="#0c1206" stroke-width="9"/>
	<rect x="${IN_X - 16}" y="${IN_Y - 16}" width="${BOARD_W + 32}" height="${BOARD_H + 32}" rx="30" fill="none" stroke="url(#brass)" stroke-width="12"/>
	<rect x="${IN_X - 16}" y="${IN_Y - 16}" width="${BOARD_W + 32}" height="${BOARD_H + 32}" rx="30" fill="none" stroke="#000000" stroke-width="12" filter="url(#sfBrushed)" opacity="0.45"/>
	<rect x="${IN_X - 5}" y="${IN_Y - 5}" width="${BOARD_W + 10}" height="${BOARD_H + 10}" rx="22" fill="none" stroke="#7a5a14" stroke-width="4"/>
	<rect x="${IN_X - 24}" y="${IN_Y - 24}" width="${BOARD_W + 48}" height="${BOARD_H + 48}" rx="34" fill="none" stroke="#ffe98a" stroke-width="2.5" opacity="0.75"/>

	${rivets}

	<!-- rail cap plates: brass shoulders at the four corners of the side rails,
	     which is where a rack-mounted housing carries its load -->
	${[
		[0, 0, 0],
		[FRAME_W, 0, 90],
		[FRAME_W, FRAME_H, 180],
		[0, FRAME_H, 270],
	]
		.map(
			([cx, cy, rot]) => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
		<path d="M 6 6 L ${BORDER_X - 6} 6 L ${BORDER_X - 6} ${BORDER_Y * 2.6} Q ${BORDER_X - 6} ${BORDER_Y * 3.2} ${BORDER_X - 26} ${BORDER_Y * 3.2} L 6 ${BORDER_Y * 3.2} Z" fill="url(#cornerBrass)" stroke="#3a2c08" stroke-width="5"/>
		${rivet(BORDER_X / 2, BORDER_Y * 1.6, 9)}
	</g>`,
		)
		.join('')}`,
	`
	<clipPath id="railClip">
		<rect x="0" y="0" width="${BORDER_X}" height="${FRAME_H}"/>
		<rect x="${FRAME_W - BORDER_X}" y="0" width="${BORDER_X}" height="${FRAME_H}"/>
		<rect x="0" y="0" width="${FRAME_W}" height="${BORDER_Y}"/>
		<rect x="0" y="${FRAME_H - BORDER_Y}" width="${FRAME_W}" height="${BORDER_Y}"/>
	</clipPath>
	<linearGradient id="bandOuter" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#20240f"/>
		<stop offset="0.35" stop-color="#4a4a26"/>
		<stop offset="0.7" stop-color="#33361a"/>
		<stop offset="1" stop-color="#20240f"/>
	</linearGradient>
	<linearGradient id="bandLight" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#8a8a52" stop-opacity="0.8"/>
		<stop offset="0.18" stop-color="#8a8a52" stop-opacity="0"/>
		<stop offset="0.85" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.6"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe282"/>
		<stop offset="0.45" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<linearGradient id="cornerBrass" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#e8bc4e"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.7" stop-color="#c08a20"/>
		<stop offset="1" stop-color="#6d4a08"/>
	</radialGradient>
	${grainDef('bandGrain', 0.6, 0.1)}`,
);

// ─── free-spin sign + counter plaque (replaces the MM template boards) ──────
// hanging military plank sign, 920×720: brass-framed olive planks, rivets,
// banana-bunch emblem, rope hangers — text is rendered by the frontend so the
// panel stays language-neutral
seed = 33;
const signRivets = (() => {
	let out = '';
	for (const [x, y] of [[150, 180], [770, 180], [150, 620], [770, 620], [460, 180], [460, 620], [150, 400], [770, 400]]) {
		out += `<circle cx="${x}" cy="${y}" r="9" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
		<circle cx="${x - 2.5}" cy="${y - 2.5}" r="2.8" fill="#fff3bd" opacity="0.8"/>`;
	}
	return out;
})();
const bananaEmblem = (cx, cy, s) => `
<g transform="translate(${cx} ${cy}) scale(${s})">
	<path d="M -34 6 Q -20 -18 6 -24 Q 12 -20 9 -12 Q -6 6 -26 12 Q -34 12 -34 6 Z" fill="url(#embGold)" stroke="#6d4a08" stroke-width="3"/>
	<path d="M -26 14 Q -12 -8 14 -16 Q 20 -12 17 -4 Q 2 12 -18 20 Q -26 20 -26 14 Z" fill="url(#embGold)" stroke="#6d4a08" stroke-width="3" transform="translate(6 6)"/>
	<path d="M -18 22 Q -4 2 22 -8 Q 28 -4 25 4 Q 10 20 -10 28 Q -18 28 -18 22 Z" fill="url(#embGold)" stroke="#6d4a08" stroke-width="3" transform="translate(12 12)"/>
</g>`;
frames.fs_sign = svgWrap(
	920,
	720,
	`
	<!-- No rope hangers. They used to run (190,96)->(250,12) and (730,96)->(670,12):
	     the lower ends stopped 34px short of the plank and the upper ends attached
	     to nothing at all, so the sign read as hanging from two loose offcuts.
	     The brass corners and frame carry it on their own. -->
	<!-- plank panel -->
	<rect x="100" y="130" width="720" height="540" rx="26" fill="url(#plankSign)" stroke="#17120a" stroke-width="8"/>
	<rect x="100" y="300" width="720" height="10" fill="#17120a" opacity="0.5"/>
	<rect x="100" y="490" width="720" height="10" fill="#17120a" opacity="0.5"/>
	<rect x="100" y="130" width="720" height="540" rx="26" filter="url(#signGrain)" opacity="0.5"/>
	<!-- brass frame -->
	<rect x="112" y="142" width="696" height="516" rx="20" fill="none" stroke="url(#brass)" stroke-width="10"/>
	<rect x="124" y="154" width="672" height="492" rx="14" fill="none" stroke="#ffe98a" stroke-width="2.5" opacity="0.6"/>
	${signRivets}
	<!-- corner brass plates -->
	${[[100, 130, 0], [820, 130, 90], [820, 670, 180], [100, 670, 270]]
		.map(
			([cx, cy, rot]) => `<g transform="translate(${cx} ${cy}) rotate(${rot})">
		<path d="M -10 -10 L 84 -10 Q 88 -10 88 -6 L 88 16 Q 62 18 42 38 Q 20 58 18 88 L -4 88 Q -10 88 -10 84 Z" fill="url(#cornerBrass)" stroke="#3a2c08" stroke-width="4"/>
	</g>`,
		)
		.join('')}
	<!-- Banana emblem removed too: at (460,205) it sat directly behind the title
	     the frontend draws at ~y=260, so its three overlapping banana shapes poked
	     out between "FREE" and "SPINS" as a pair of disconnected gold slivers. -->
	<!-- inner soft vignette so text pops -->
	<rect x="130" y="160" width="660" height="480" rx="14" fill="url(#signVign)"/>`,
	`
	<linearGradient id="plankSign" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3f4a1e"/>
		<stop offset="0.5" stop-color="#2c3812"/>
		<stop offset="1" stop-color="#1c260c"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe282"/>
		<stop offset="0.45" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<linearGradient id="cornerBrass" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#e8bc4e"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<linearGradient id="embGold" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#fff2ae"/>
		<stop offset="0.5" stop-color="#ffd75e"/>
		<stop offset="1" stop-color="#c1841a"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.7" stop-color="#c08a20"/>
		<stop offset="1" stop-color="#6d4a08"/>
	</radialGradient>
	<radialGradient id="signVign" cx="0.5" cy="0.45" r="0.85">
		<stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.35"/>
	</radialGradient>
	${grainDef('signGrain', 0.5, 0.07)}`,
);

// small brass-trimmed plaque for the free-spin counter (824×622 like the MM
// panel it replaces so the layout maths stay put)
frames.fs_counter_panel = svgWrap(
	824,
	622,
	`
	<rect x="30" y="60" width="764" height="502" rx="34" fill="url(#plankSign)" stroke="#17120a" stroke-width="8"/>
	<rect x="30" y="60" width="764" height="502" rx="34" filter="url(#signGrain)" opacity="0.5"/>
	<rect x="46" y="76" width="732" height="470" rx="26" fill="none" stroke="url(#brass)" stroke-width="9"/>
	<rect x="58" y="88" width="708" height="446" rx="20" fill="none" stroke="#ffe98a" stroke-width="2" opacity="0.55"/>
	${[[70, 100], [754, 100], [70, 522], [754, 522]]
		.map(
			([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="url(#rivet)" stroke="#3a2c08" stroke-width="2"/>
	<circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff3bd" opacity="0.8"/>`,
		)
		.join('')}
	${bananaEmblem(412, 122, 0.75)}
	<rect x="70" y="100" width="684" height="422" rx="18" fill="url(#signVign)"/>`,
	`
	<linearGradient id="plankSign" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3f4a1e"/>
		<stop offset="0.5" stop-color="#2c3812"/>
		<stop offset="1" stop-color="#1c260c"/>
	</linearGradient>
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe282"/>
		<stop offset="0.45" stop-color="#d8a334"/>
		<stop offset="1" stop-color="#8a5c14"/>
	</linearGradient>
	<linearGradient id="embGold" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#fff2ae"/>
		<stop offset="0.5" stop-color="#ffd75e"/>
		<stop offset="1" stop-color="#c1841a"/>
	</linearGradient>
	<radialGradient id="rivet" cx="0.35" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe98a"/>
		<stop offset="0.7" stop-color="#c08a20"/>
		<stop offset="1" stop-color="#6d4a08"/>
	</radialGradient>
	<radialGradient id="signVign" cx="0.5" cy="0.45" r="0.85">
		<stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.35"/>
	</radialGradient>
	${grainDef('signGrain', 0.5, 0.07)}`,
);

// ─── render ──────────────────────────────────────────────────────────────────
const render = (svg, outPath, width) => {
	if (process.env.DUMP_SVG) fs.writeFileSync(outPath.replace(/\.png$/, '.debug.svg'), svg);
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
	fs.writeFileSync(outPath, resvg.render().asPng());
	console.log('rendered', path.basename(outPath));
};
for (const [name, svg] of Object.entries(backgrounds)) {
	render(svg, path.join(BG_DIR, `${name}.png`), 1920);
}
// frame_edge is NOT emitted from here any more. The housing is now painted art,
// cut into parts and recomposited to this exact geometry by
// design/build_frame_capsule.py, and running this script used to quietly put the
// olive procedural rails back over it. The SVG below is kept because it is still
// where the geometry is derived and commented, and because the fs_* panels in
// the same object depend on the same definitions — it is simply not written out.
//
// frame_bg IS still emitted, and is still olive when it lands. Run
// build_frame_capsule.py --apply after this script: it retints the plate to
// gunmetal and rebuilds the edge. That ordering is the pipeline.
const NOT_EMITTED = new Set(['frame_edge']);
for (const [name, svg] of Object.entries(frames)) {
	if (NOT_EMITTED.has(name)) {
		console.log(`  skip ${name} — owned by design/build_frame_capsule.py`);
		continue;
	}
	// FRAME_W, not a fixed 1280: the housing is no longer square, and rendering it
	// to a width that does not match its authored aspect resamples every rivet.
	render(svg, path.join(FRAME_DIR, `${name}.png`), name.startsWith('frame_') ? FRAME_W : 1280);
}
