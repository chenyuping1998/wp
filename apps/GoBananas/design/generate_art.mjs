// GoBananas Q版 jungle art generator — renders SVG sources to PNG assets.
// Usage: node design/generate_art.mjs <path-to-node_modules-containing-@resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_art.mjs <dir containing node_modules with @resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYM_DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbols');
const BG_DIR = path.join(appRoot, 'static/assets/sprites/goBananasBackground');
fs.mkdirSync(SYM_DIR, { recursive: true });
fs.mkdirSync(BG_DIR, { recursive: true });

// ─── shared bits ────────────────────────────────────────────────────────────
const OUTLINE = '#4a2c17'; // warm dark brown used for all outlines

// kawaii face: two glossy eyes + smile + blush
const face = (cx, cy, s = 1, mood = 'happy') => {
	const smile =
		mood === 'cheeky'
			? `<path d="M ${cx - 14 * s} ${cy + 10 * s} Q ${cx} ${cy + 22 * s} ${cx + 14 * s} ${cy + 10 * s} Q ${cx + 6 * s} ${cy + 14 * s} ${cx - 14 * s} ${cy + 10 * s} Z" fill="${OUTLINE}"/>`
			: `<path d="M ${cx - 12 * s} ${cy + 10 * s} Q ${cx} ${cy + 20 * s} ${cx + 12 * s} ${cy + 10 * s}" stroke="${OUTLINE}" stroke-width="${4 * s}" fill="none" stroke-linecap="round"/>`;
	const wink =
		mood === 'cheeky'
			? `<path d="M ${cx + 10 * s} ${cy - 6 * s} Q ${cx + 17 * s} ${cy - 12 * s} ${cx + 24 * s} ${cy - 6 * s}" stroke="${OUTLINE}" stroke-width="${4.5 * s}" fill="none" stroke-linecap="round"/>`
			: `<ellipse cx="${cx + 17 * s}" cy="${cy - 4 * s}" rx="${6.5 * s}" ry="${8.5 * s}" fill="${OUTLINE}"/>
			   <circle cx="${cx + 19.5 * s}" cy="${cy - 7 * s}" r="${2.4 * s}" fill="#fff"/>`;
	return `
	<ellipse cx="${cx - 17 * s}" cy="${cy - 4 * s}" rx="${6.5 * s}" ry="${8.5 * s}" fill="${OUTLINE}"/>
	<circle cx="${cx - 14.5 * s}" cy="${cy - 7 * s}" r="${2.4 * s}" fill="#fff"/>
	${wink}
	${smile}
	<ellipse cx="${cx - 26 * s}" cy="${cy + 7 * s}" rx="${7 * s}" ry="${4.5 * s}" fill="#ff9d9d" opacity="0.55"/>
	<ellipse cx="${cx + 26 * s}" cy="${cy + 7 * s}" rx="${7 * s}" ry="${4.5 * s}" fill="#ff9d9d" opacity="0.55"/>`;
};

const sparkle = (x, y, s, color = '#fff8d0') =>
	`<path d="M ${x} ${y - 7 * s} Q ${x + 1.5 * s} ${y - 1.5 * s} ${x + 7 * s} ${y} Q ${x + 1.5 * s} ${y + 1.5 * s} ${x} ${y + 7 * s} Q ${x - 1.5 * s} ${y + 1.5 * s} ${x - 7 * s} ${y} Q ${x - 1.5 * s} ${y - 1.5 * s} ${x} ${y - 7 * s} Z" fill="${color}" opacity="0.95"/>`;

const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

// chunky royal letter tile on a leaf
const royal = (letter, main, dark, leaf) =>
	svgWrap(
		256,
		256,
		`
	<path d="M 40 200 Q 20 140 60 110 Q 40 60 95 55 Q 100 20 145 30 Q 200 20 205 75 Q 240 95 225 145 Q 245 195 195 210 Q 150 240 105 220 Q 60 235 40 200 Z"
		fill="${leaf}" opacity="0.5"/>
	<text x="128" y="188" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="164"
		text-anchor="middle" fill="${main}" stroke="${OUTLINE}" stroke-width="14" paint-order="stroke">${letter}</text>
	<text x="128" y="188" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="164"
		text-anchor="middle" fill="url(#royalShine)" >${letter}</text>
	${sparkle(200, 70, 1.1)}
	`,
		`<linearGradient id="royalShine" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
			<stop offset="0.45" stop-color="${main}" stop-opacity="0"/>
			<stop offset="1" stop-color="${dark}" stop-opacity="0.65"/>
		</linearGradient>`,
	);

// ─── symbols ────────────────────────────────────────────────────────────────
const symbols = {};

// H1 watermelon slice
symbols.h1 = svgWrap(
	256,
	256,
	`
	<g transform="rotate(-8 128 128)">
	<path d="M 26 96 A 102 102 0 0 0 230 96 L 128 96 Z" transform="rotate(180 128 121)"
		fill="#2f9e44" stroke="${OUTLINE}" stroke-width="9"/>
	<path d="M 40 104 A 88 88 0 0 1 216 104 Z" transform="rotate(180 128 125)"
		fill="#d3f9d8" />
	<path d="M 52 110 A 76 76 0 0 1 204 110 Z" transform="rotate(180 128 129)"
		fill="url(#melon)"/>
	<g fill="${OUTLINE}">
		<ellipse cx="95" cy="180" rx="5" ry="8" transform="rotate(15 95 180)"/>
		<ellipse cx="160" cy="178" rx="5" ry="8" transform="rotate(-15 160 178)"/>
		<ellipse cx="128" cy="205" rx="5" ry="8"/>
	</g>
	${face(128, 130, 1)}
	${sparkle(205, 90, 1)}
	</g>`,
	`<linearGradient id="melon" x1="0" y1="1" x2="0" y2="0">
		<stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#fa5252"/>
	</linearGradient>`,
);

// H2 pineapple
symbols.h2 = svgWrap(
	256,
	256,
	`
	<g transform="rotate(6 128 128)">
	<g stroke="${OUTLINE}" stroke-width="8" fill="#37b24d" stroke-linejoin="round">
		<path d="M 128 62 L 100 18 L 122 40 L 128 8 L 136 40 L 158 16 L 130 62 Z"/>
	</g>
	<ellipse cx="128" cy="152" rx="74" ry="90" fill="url(#pine)" stroke="${OUTLINE}" stroke-width="9"/>
	<g stroke="#e8a33d" stroke-width="4" opacity="0.8">
		<path d="M 70 100 L 190 210 M 60 130 L 175 232 M 62 168 L 150 246 M 96 76 L 198 172 M 130 68 L 200 132"/>
		<path d="M 186 100 L 66 210 M 196 130 L 81 232 M 194 168 L 106 246 M 160 76 L 58 172 M 126 68 L 56 132"/>
	</g>
	${face(128, 140, 1.05)}
	${sparkle(60, 70, 0.9)}
	</g>`,
	`<linearGradient id="pine" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffd43b"/><stop offset="1" stop-color="#f59f00"/>
	</linearGradient>`,
);

// H3 grapes
symbols.h3 = svgWrap(
	256,
	256,
	`
	<path d="M 128 52 Q 132 26 158 20 Q 148 42 150 56 Z" fill="#5c940d" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<path d="M 126 54 Q 92 30 58 48 Q 90 62 108 62 Z" fill="#74b816" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<g stroke="${OUTLINE}" stroke-width="8">
		<circle cx="86" cy="102" r="34" fill="#9775fa"/>
		<circle cx="170" cy="102" r="34" fill="#9775fa"/>
		<circle cx="62" cy="158" r="34" fill="#845ef7"/>
		<circle cx="194" cy="158" r="34" fill="#845ef7"/>
		<circle cx="128" cy="216" r="32" fill="#7048e8"/>
		<circle cx="128" cy="140" r="46" fill="url(#grape)"/>
	</g>
	<circle cx="74" cy="90" r="9" fill="#fff" opacity="0.5"/>
	<circle cx="158" cy="90" r="9" fill="#fff" opacity="0.5"/>
	${face(128, 138, 1)}
	${sparkle(212, 60, 1)}`,
	`<radialGradient id="grape" cx="0.4" cy="0.35" r="0.9">
		<stop offset="0" stop-color="#b197fc"/><stop offset="1" stop-color="#7950f2"/>
	</radialGradient>`,
);

// H4 orange
symbols.h4 = svgWrap(
	256,
	256,
	`
	<path d="M 128 58 Q 122 34 100 30" stroke="#5c940d" stroke-width="10" fill="none" stroke-linecap="round"/>
	<path d="M 128 52 Q 160 20 196 42 Q 166 66 136 62 Z" fill="#74b816" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<circle cx="128" cy="148" r="86" fill="url(#orange)" stroke="${OUTLINE}" stroke-width="9"/>
	<ellipse cx="94" cy="106" rx="26" ry="16" fill="#fff" opacity="0.4" transform="rotate(-24 94 106)"/>
	<g fill="#e8590c" opacity="0.5">
		<circle cx="66" cy="170" r="3"/><circle cx="84" cy="196" r="3"/><circle cx="176" cy="188" r="3"/>
		<circle cx="192" cy="150" r="3"/><circle cx="160" cy="212" r="3"/>
	</g>
	${face(128, 148, 1.05)}
	${sparkle(206, 82, 1)}`,
	`<radialGradient id="orange" cx="0.38" cy="0.32" r="1">
		<stop offset="0" stop-color="#ffa94d"/><stop offset="1" stop-color="#f76707"/>
	</radialGradient>`,
);

// royals
symbols.l1 = royal('A', '#ff6b6b', '#c92a2a', '#96f2d7');
symbols.l2 = royal('K', '#4dabf7', '#1864ab', '#ffe8a8');
symbols.l3 = royal('Q', '#da77f2', '#862e9c', '#d8f5a2');
symbols.l4 = royal('J', '#69db7c', '#2b8a3e', '#ffd8a8');
symbols.l5 = royal('10', '#3bc9db', '#0b7285', '#fcc2d7');

// S banana bunch (scatter)
symbols.s = svgWrap(
	256,
	256,
	`
	<g transform="rotate(-6 128 128)">
	<path d="M 96 42 Q 88 30 100 24 L 118 30 Q 116 44 108 50 Z" fill="#846b4d" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<path d="M 178 60 Q 226 120 186 190 Q 166 222 130 228 Q 176 180 172 118 Q 170 84 158 64 Z"
		fill="url(#ban2)" stroke="${OUTLINE}" stroke-width="8" stroke-linejoin="round"/>
	<path d="M 104 44 Q 60 130 108 200 Q 140 240 196 228 Q 210 226 208 216 Q 150 210 124 150 Q 104 100 128 48 Z"
		fill="url(#ban1)" stroke="${OUTLINE}" stroke-width="9" stroke-linejoin="round"/>
	<path d="M 118 62 Q 100 120 122 168" stroke="#fff3bf" stroke-width="10" fill="none" opacity="0.7" stroke-linecap="round"/>
	<ellipse cx="204" cy="222" rx="10" ry="7" fill="#846b4d" stroke="${OUTLINE}" stroke-width="6"/>
	${face(150, 120, 1, 'cheeky')}
	${sparkle(58, 78, 1.2, '#fff59b')}
	${sparkle(214, 96, 0.9, '#fff59b')}
	${sparkle(70, 190, 0.8, '#fff59b')}
	</g>`,
	`<linearGradient id="ban1" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#fab005"/>
	</linearGradient>
	<linearGradient id="ban2" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffd43b"/><stop offset="1" stop-color="#f59f00"/>
	</linearGradient>`,
);

// W chibi monkey with WILD banner
const monkeyHead = (cx, cy, s) => `
	<circle cx="${cx - 62 * s}" cy="${cy - 26 * s}" r="${26 * s}" fill="#a9745b" stroke="${OUTLINE}" stroke-width="${8 * s}"/>
	<circle cx="${cx + 62 * s}" cy="${cy - 26 * s}" r="${26 * s}" fill="#a9745b" stroke="${OUTLINE}" stroke-width="${8 * s}"/>
	<circle cx="${cx - 62 * s}" cy="${cy - 26 * s}" r="${13 * s}" fill="#e8b795"/>
	<circle cx="${cx + 62 * s}" cy="${cy - 26 * s}" r="${13 * s}" fill="#e8b795"/>
	<circle cx="${cx}" cy="${cy}" r="${64 * s}" fill="#8a5a3c" stroke="${OUTLINE}" stroke-width="${8 * s}"/>
	<path d="M ${cx - 44 * s} ${cy + 6 * s} Q ${cx - 44 * s} ${cy - 34 * s} ${cx} ${cy - 34 * s} Q ${cx + 44 * s} ${cy - 34 * s} ${cx + 44 * s} ${cy + 6 * s} Q ${cx + 44 * s} ${cy + 40 * s} ${cx} ${cy + 40 * s} Q ${cx - 44 * s} ${cy + 40 * s} ${cx - 44 * s} ${cy + 6 * s} Z" fill="#e8b795"/>
	<path d="M ${cx - 30 * s} ${cy - 46 * s} Q ${cx} ${cy - 62 * s} ${cx + 30 * s} ${cy - 46 * s}" stroke="#6f4022" stroke-width="${7 * s}" fill="none" stroke-linecap="round"/>
	${face(cx, cy + 2 * s, s)}`;

symbols.w = svgWrap(
	256,
	256,
	`
	${monkeyHead(128, 104, 1)}
	<!-- little banana in paw -->
	<g transform="rotate(24 208 176)">
		<path d="M 192 168 Q 204 190 228 186 Q 210 202 192 192 Q 182 182 192 168 Z" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round"/>
	</g>
	<!-- WILD banner -->
	<path d="M 34 190 L 20 236 L 52 226 L 204 226 L 236 236 L 222 190 Q 128 208 34 190 Z"
		fill="url(#wildBanner)" stroke="${OUTLINE}" stroke-width="8" stroke-linejoin="round"/>
	<text x="128" y="228" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="34"
		text-anchor="middle" fill="#fff8db" stroke="#7a4a12" stroke-width="2">WILD</text>`,
	`<linearGradient id="wildBanner" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffd43b"/><stop offset="1" stop-color="#f08c00"/>
	</linearGradient>`,
);

// WX expanded full-reel monkey (256 x 1280 — covers 5 rows)
symbols.wx = svgWrap(
	256,
	1280,
	`
	<!-- vine backdrop -->
	<path d="M 128 0 Q 80 160 140 320 Q 200 480 100 640 Q 30 800 128 960 Q 210 1120 128 1280"
		stroke="#2f9e44" stroke-width="26" fill="none" opacity="0.5"/>
	<g stroke="#37b24d" stroke-width="6" fill="#69db7c" opacity="0.6">
		<ellipse cx="52" cy="120" rx="34" ry="18" transform="rotate(-28 52 120)"/>
		<ellipse cx="206" cy="420" rx="34" ry="18" transform="rotate(24 206 420)"/>
		<ellipse cx="48" cy="760" rx="34" ry="18" transform="rotate(-20 48 760)"/>
		<ellipse cx="204" cy="1100" rx="34" ry="18" transform="rotate(26 204 1100)"/>
	</g>
	<!-- tail -->
	<path d="M 176 1130 Q 250 1080 228 990 Q 214 940 176 950" stroke="#8a5a3c" stroke-width="24" fill="none" stroke-linecap="round"/>
	<!-- legs -->
	<path d="M 84 1180 Q 74 1230 96 1244 M 172 1180 Q 182 1230 160 1244" stroke="${OUTLINE}" stroke-width="42" stroke-linecap="round"/>
	<path d="M 84 1178 Q 74 1226 96 1240 M 172 1178 Q 182 1226 160 1240" stroke="#8a5a3c" stroke-width="30" stroke-linecap="round"/>
	<!-- body -->
	<ellipse cx="128" cy="1010" rx="86" ry="180" fill="#8a5a3c" stroke="${OUTLINE}" stroke-width="10"/>
	<ellipse cx="128" cy="1040" rx="56" ry="130" fill="#e8b795"/>
	<!-- arms raised holding bananas -->
	<path d="M 62 900 Q 10 800 34 700 M 194 900 Q 246 800 222 700" stroke="${OUTLINE}" stroke-width="42" stroke-linecap="round"/>
	<path d="M 62 898 Q 14 800 38 706 M 194 898 Q 242 800 218 706" stroke="#8a5a3c" stroke-width="30" stroke-linecap="round"/>
	<g transform="rotate(-30 36 668)">
		<path d="M 10 668 Q 30 700 66 692 Q 40 716 14 700 Q 0 686 10 668 Z" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	</g>
	<g transform="rotate(210 220 668)">
		<path d="M 194 668 Q 214 700 250 692 Q 224 716 198 700 Q 184 686 194 668 Z" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	</g>
	<!-- belly button -->
	<path d="M 120 1096 Q 128 1102 136 1096" stroke="#c99b76" stroke-width="6" fill="none" stroke-linecap="round"/>
	<!-- head -->
	${monkeyHead(128, 560, 1.5)}
	<!-- crown of leaves -->
	<path d="M 128 428 L 104 380 L 124 402 L 128 372 L 134 402 L 154 378 L 132 428 Z" fill="#37b24d" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	${sparkle(40, 480, 1.4, '#fff59b')}
	${sparkle(218, 520, 1.1, '#fff59b')}
	${sparkle(50, 1180, 1.2, '#fff59b')}`,
);

// X dead tile (superspin blank)
symbols.x = svgWrap(
	256,
	256,
	`
	<rect x="46" y="46" width="164" height="164" rx="28" fill="#6b5744" stroke="#4a3a2b" stroke-width="9" opacity="0.85"/>
	<rect x="62" y="62" width="132" height="132" rx="18" fill="#7d6650" opacity="0.9"/>
	<g stroke="#5d4b39" stroke-width="5" opacity="0.7">
		<path d="M 70 100 Q 128 92 186 100 M 70 132 Q 128 124 186 132 M 70 164 Q 128 156 186 164"/>
	</g>
	<ellipse cx="170" cy="86" rx="22" ry="11" fill="#8a7258" transform="rotate(-18 170 86)" opacity="0.8"/>`,
);

// P prize — golden banana coin
symbols.p = svgWrap(
	256,
	256,
	`
	<circle cx="128" cy="128" r="98" fill="url(#coinRim)" stroke="${OUTLINE}" stroke-width="9"/>
	<circle cx="128" cy="128" r="76" fill="url(#coinFace)" stroke="#a8720a" stroke-width="6"/>
	<g transform="rotate(-14 128 128)">
		<path d="M 92 96 Q 66 156 116 192 Q 148 214 182 198 Q 190 194 186 188 Q 140 190 116 148 Q 100 118 112 96 Z"
			fill="#fff3bf" stroke="#a8720a" stroke-width="7" stroke-linejoin="round"/>
	</g>
	<path d="M 62 74 Q 100 40 150 52" stroke="#fff" stroke-width="12" fill="none" opacity="0.55" stroke-linecap="round"/>
	${sparkle(196, 76, 1.3)}
	${sparkle(58, 176, 1)}`,
	`<radialGradient id="coinRim" cx="0.4" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#e8a33d"/>
	</radialGradient>
	<radialGradient id="coinFace" cx="0.42" cy="0.38" r="1">
		<stop offset="0" stop-color="#ffd43b"/><stop offset="1" stop-color="#f6b21b"/>
	</radialGradient>`,
);

// ─── backgrounds (1920x1080) ────────────────────────────────────────────────
const leafArc = (x, y, r, color, n = 7, spread = 150, baseAngle = 0) => {
	let out = '';
	for (let i = 0; i < n; i++) {
		const a = baseAngle - spread / 2 + (spread / (n - 1)) * i;
		out += `<ellipse cx="${x}" cy="${y - r * 0.62}" rx="${r * 0.16}" ry="${r * 0.62}" fill="${color}" transform="rotate(${a} ${x} ${y})"/>`;
	}
	return out;
};

const bokeh = (seedInit, count, color, w, h) => {
	let seed = seedInit;
	const rand = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};
	let out = '';
	for (let i = 0; i < count; i++) {
		out += `<circle cx="${(rand() * w) | 0}" cy="${(rand() * h) | 0}" r="${3 + rand() * 9}" fill="${color}" opacity="${0.12 + rand() * 0.2}"/>`;
	}
	return out;
};

const jungleBg = ({ sky0, sky1, hillFar, hillNear, canopy, glow, fireflies }) =>
	svgWrap(
		1920,
		1080,
		`
	<rect width="1920" height="1080" fill="url(#sky)"/>
	<circle cx="960" cy="330" r="430" fill="${glow}" opacity="0.35"/>
	<circle cx="960" cy="330" r="280" fill="${glow}" opacity="0.3"/>
	<path d="M 0 640 Q 480 520 960 610 Q 1440 700 1920 580 L 1920 1080 L 0 1080 Z" fill="${hillFar}"/>
	<path d="M 0 780 Q 480 680 960 760 Q 1440 840 1920 720 L 1920 1080 L 0 1080 Z" fill="${hillNear}"/>
	<!-- canopy corners -->
	${leafArc(-40, 60, 420, canopy, 8, 170, 100)}
	${leafArc(1960, 60, 420, canopy, 8, 170, -100)}
	${leafArc(-60, 1140, 460, hillNear, 8, 160, 80)}
	${leafArc(1980, 1140, 460, hillNear, 8, 160, -80)}
	<!-- hanging vines -->
	<g stroke="${canopy}" stroke-width="14" fill="none" opacity="0.85">
		<path d="M 240 0 Q 220 140 260 260"/>
		<path d="M 1680 0 Q 1700 160 1650 300"/>
		<path d="M 520 0 Q 540 90 510 170"/>
		<path d="M 1400 0 Q 1380 100 1420 190"/>
	</g>
	<g fill="${canopy}">
		<ellipse cx="262" cy="268" rx="34" ry="18" transform="rotate(30 262 268)"/>
		<ellipse cx="1648" cy="308" rx="34" ry="18" transform="rotate(-24 1648 308)"/>
		<ellipse cx="508" cy="178" rx="26" ry="14" transform="rotate(24 508 178)"/>
		<ellipse cx="1422" cy="198" rx="26" ry="14" transform="rotate(-28 1422 198)"/>
	</g>
	${bokeh(7, 26, fireflies, 1920, 1080)}
	<rect width="1920" height="1080" fill="url(#vign)"/>`,
		`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${sky0}"/><stop offset="1" stop-color="${sky1}"/>
		</linearGradient>
		<radialGradient id="vign" cx="0.5" cy="0.46" r="0.85">
			<stop offset="0.62" stop-color="#000" stop-opacity="0"/>
			<stop offset="1" stop-color="#08210d" stop-opacity="0.5"/>
		</radialGradient>`,
	);

const backgrounds = {
	bg_base: jungleBg({
		sky0: '#8ee3f5',
		sky1: '#d3f9d8',
		hillFar: '#69db7c',
		hillNear: '#37b24d',
		canopy: '#2b8a3e',
		glow: '#fff9c4',
		fireflies: '#ffffff',
	}),
	bg_feature: jungleBg({
		sky0: '#845ef7',
		sky1: '#ff922b',
		hillFar: '#5f3dc4',
		hillNear: '#364fc7',
		canopy: '#2b8a3e',
		glow: '#ffd43b',
		fireflies: '#ffe066',
	}),
	bg_superspin: jungleBg({
		sky0: '#1a2f4b',
		sky1: '#274690',
		hillFar: '#1d3557',
		hillNear: '#14213d',
		canopy: '#2b4c3f',
		glow: '#ffd43b',
		fireflies: '#ffd43b',
	}),
};

// ─── render ─────────────────────────────────────────────────────────────────
const render = (svg, outPath, width) => {
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: width },
		font: { loadSystemFonts: true },
	});
	fs.writeFileSync(outPath, resvg.render().asPng());
	console.log('rendered', path.basename(outPath));
};

for (const [name, svg] of Object.entries(symbols)) {
	render(svg, path.join(SYM_DIR, `${name}.png`), 256);
}
for (const [name, svg] of Object.entries(backgrounds)) {
	render(svg, path.join(BG_DIR, `${name}.png`), 1920);
}
console.log('done');
