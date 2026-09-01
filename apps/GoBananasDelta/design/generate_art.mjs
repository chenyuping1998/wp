// GoBananas 中國風 (Journey-to-the-West) art generator — renders SVG sources to PNG assets.
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
const FRAME_DIR = path.join(appRoot, 'static/assets/sprites/goBananasFrame');
fs.mkdirSync(SYM_DIR, { recursive: true });
fs.mkdirSync(BG_DIR, { recursive: true });
fs.mkdirSync(FRAME_DIR, { recursive: true });

// ─── shared bits ────────────────────────────────────────────────────────────
const OUTLINE = '#4a2317'; // warm dark red-brown used for all outlines
const CJK_FONT = `'Microsoft YaHei', 'SimHei', 'Noto Sans SC', sans-serif`;

// kawaii face: two glossy eyes + smile + blush (kept from the jungle set so the
// 中國風 symbols stay in the same Q版 family as the reference paytable art)
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

// 祥雲 auspicious cloud — spiral curl with a puffy tail
const cloud = (x, y, s, color, opacity = 1) => `
	<g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}">
		<path d="M -34 8 Q -40 -8 -24 -12 Q -22 -26 -6 -22 Q 2 -34 16 -26 Q 32 -30 34 -14 Q 46 -10 42 4 Q 44 12 32 12 L -26 12 Q -36 12 -34 8 Z" fill="${color}"/>
		<path d="M 8 -8 Q 20 -12 22 -2 Q 30 -4 28 6" stroke="${color === '#fff' ? '#dee2e6' : 'rgba(255,255,255,0.5)'}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
	</g>`;

const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

// 金箍棒 golden cudgel drawn along the local x axis, centered at (0,0).
// length = full tip-to-tip length, r = shaft half-thickness.
const cudgelH = (length, r) => {
	const half = length / 2;
	const band = r * 2.6; // gold end-band length
	return `
	<g stroke-linejoin="round">
		<!-- shaft -->
		<rect x="${-half + band}" y="${-r}" width="${length - band * 2}" height="${r * 2}" rx="${r * 0.6}"
			fill="url(#cudgelShaft)" stroke="${OUTLINE}" stroke-width="${r * 0.55}"/>
		<!-- red collars inside the gold end bands -->
		<rect x="${-half + band}" y="${-r * 0.92}" width="${band * 0.85}" height="${r * 1.84}" fill="#c92a2a"/>
		<rect x="${half - band * 1.85}" y="${-r * 0.92}" width="${band * 0.85}" height="${r * 1.84}" fill="#c92a2a"/>
		<!-- gold end caps -->
		<rect x="${-half}" y="${-r * 1.25}" width="${band}" height="${r * 2.5}" rx="${r * 0.7}"
			fill="url(#cudgelCap)" stroke="${OUTLINE}" stroke-width="${r * 0.5}"/>
		<rect x="${half - band}" y="${-r * 1.25}" width="${band}" height="${r * 2.5}" rx="${r * 0.7}"
			fill="url(#cudgelCap)" stroke="${OUTLINE}" stroke-width="${r * 0.5}"/>
		<!-- highlight -->
		<rect x="${-half + band * 1.3}" y="${-r * 0.55}" width="${(length - band * 2.6) * 0.9}" height="${r * 0.5}" rx="${r * 0.25}" fill="#fff3bf" opacity="0.75"/>
	</g>`;
};

const cudgelDefs = `
	<linearGradient id="cudgelShaft" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe066"/><stop offset="0.5" stop-color="#fab005"/><stop offset="1" stop-color="#e67700"/>
	</linearGradient>
	<linearGradient id="cudgelCap" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#fff3bf"/><stop offset="0.5" stop-color="#ffd43b"/><stop offset="1" stop-color="#e8a33d"/>
	</linearGradient>`;

// chunky gold letter on a lacquer tile with gold trim + corner cloud curl
const royal = (letter, lacq0, lacq1) =>
	svgWrap(
		256,
		256,
		`
	<rect x="34" y="34" width="188" height="188" rx="30" fill="url(#lacq)" stroke="${OUTLINE}" stroke-width="9"/>
	<rect x="46" y="46" width="164" height="164" rx="22" fill="none" stroke="url(#trim)" stroke-width="6"/>
	<!-- corner 雲紋 curls -->
	<path d="M 58 78 Q 54 62 70 60 Q 82 58 82 68 Q 82 76 74 74" stroke="#ffd43b" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>
	<path d="M 198 178 Q 202 194 186 196 Q 174 198 174 188 Q 174 180 182 182" stroke="#ffd43b" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>
	<text x="128" y="182" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="140"
		text-anchor="middle" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="13" paint-order="stroke">${letter}</text>
	<text x="128" y="182" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="140"
		text-anchor="middle" fill="url(#royalShine)">${letter}</text>
	${sparkle(202, 62, 1.1)}
	`,
		`<linearGradient id="lacq" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${lacq0}"/><stop offset="1" stop-color="${lacq1}"/>
		</linearGradient>
		<linearGradient id="trim" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffe8a8"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="1" stop-color="#b8791a"/>
		</linearGradient>
		<linearGradient id="royalShine" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#fff9db" stop-opacity="0.9"/>
			<stop offset="0.45" stop-color="#ffd43b" stop-opacity="0"/>
			<stop offset="1" stop-color="#b8791a" stop-opacity="0.75"/>
		</linearGradient>`,
	);

// ─── symbols ────────────────────────────────────────────────────────────────
const symbols = {};

// H1 金元寶 gold ingot
symbols.h1 = svgWrap(
	256,
	256,
	`
	<ellipse cx="128" cy="210" rx="86" ry="16" fill="#8a5a3c" opacity="0.25"/>
	<g transform="rotate(-4 128 128)">
	<!-- boat body -->
	<path d="M 34 138 Q 30 108 62 104 L 194 104 Q 226 108 222 138 Q 214 196 128 200 Q 42 196 34 138 Z"
		fill="url(#ingotBody)" stroke="${OUTLINE}" stroke-width="9"/>
	<!-- upturned ends -->
	<path d="M 34 136 Q 14 118 30 96 Q 44 82 62 104 Q 44 116 40 138 Z" fill="url(#ingotEnd)" stroke="${OUTLINE}" stroke-width="8" stroke-linejoin="round"/>
	<path d="M 222 136 Q 242 118 226 96 Q 212 82 194 104 Q 212 116 216 138 Z" fill="url(#ingotEnd)" stroke="${OUTLINE}" stroke-width="8" stroke-linejoin="round"/>
	<!-- dome bump -->
	<ellipse cx="128" cy="104" rx="62" ry="42" fill="url(#ingotDome)" stroke="${OUTLINE}" stroke-width="9"/>
	<path d="M 84 88 Q 104 68 138 72" stroke="#fff9db" stroke-width="10" fill="none" opacity="0.7" stroke-linecap="round"/>
	${face(128, 106, 0.95)}
	<path d="M 78 168 Q 128 184 178 168" stroke="#b8791a" stroke-width="5" fill="none" opacity="0.6" stroke-linecap="round"/>
	</g>
	${sparkle(210, 70, 1.2)}
	${sparkle(48, 190, 0.9)}`,
	`<linearGradient id="ingotBody" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffd43b"/><stop offset="1" stop-color="#e8a33d"/>
	</linearGradient>
	<linearGradient id="ingotEnd" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#eeb63e"/>
	</linearGradient>
	<radialGradient id="ingotDome" cx="0.4" cy="0.3" r="1">
		<stop offset="0" stop-color="#fff3bf"/><stop offset="0.55" stop-color="#ffd43b"/><stop offset="1" stop-color="#e8a33d"/>
	</radialGradient>`,
);

// H2 紅燈籠 red lantern
symbols.h2 = svgWrap(
	256,
	256,
	`
	<!-- hanger string -->
	<path d="M 128 6 L 128 30" stroke="${OUTLINE}" stroke-width="6" stroke-linecap="round"/>
	<!-- top cap -->
	<rect x="96" y="28" width="64" height="20" rx="8" fill="url(#lanternCap)" stroke="${OUTLINE}" stroke-width="7"/>
	<!-- body -->
	<ellipse cx="128" cy="118" rx="88" ry="72" fill="url(#lanternBody)" stroke="${OUTLINE}" stroke-width="9"/>
	<!-- vertical gold ribs -->
	<g stroke="#ffb84d" stroke-width="4.5" fill="none" opacity="0.85">
		<path d="M 62 66 Q 44 118 62 170"/>
		<path d="M 95 52 Q 84 118 95 184"/>
		<path d="M 161 52 Q 172 118 161 184"/>
		<path d="M 194 66 Q 212 118 194 170"/>
	</g>
	<ellipse cx="94" cy="80" rx="26" ry="14" fill="#fff" opacity="0.35" transform="rotate(-18 94 80)"/>
	<!-- bottom cap + tassel -->
	<rect x="102" y="182" width="52" height="16" rx="7" fill="url(#lanternCap)" stroke="${OUTLINE}" stroke-width="7"/>
	<path d="M 128 198 L 128 216" stroke="#e8a33d" stroke-width="6" stroke-linecap="round"/>
	<path d="M 120 216 Q 128 246 136 216 Q 132 212 124 216 Z" fill="#e03131" stroke="${OUTLINE}" stroke-width="5" stroke-linejoin="round"/>
	<circle cx="128" cy="216" r="7" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="4"/>
	${face(128, 118, 1)}
	${sparkle(206, 62, 1.1)}
	${sparkle(44, 178, 0.85)}`,
	`<radialGradient id="lanternBody" cx="0.42" cy="0.36" r="1">
		<stop offset="0" stop-color="#ff8787"/><stop offset="0.55" stop-color="#f03e3e"/><stop offset="1" stop-color="#c92a2a"/>
	</radialGradient>
	<linearGradient id="lanternCap" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#e8a33d"/>
	</linearGradient>`,
);

// H3 蟠桃 immortality peach
symbols.h3 = svgWrap(
	256,
	256,
	`
	<!-- stem + leaves -->
	<path d="M 128 58 Q 126 38 112 30" stroke="#5c940d" stroke-width="9" fill="none" stroke-linecap="round"/>
	<path d="M 126 52 Q 92 24 56 44 Q 88 62 110 58 Z" fill="#74b816" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<path d="M 130 52 Q 166 26 200 48 Q 168 64 146 58 Z" fill="#5c940d" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<!-- peach body with cleft -->
	<path d="M 128 62 Q 196 54 216 118 Q 230 178 178 204 Q 146 220 128 206 Q 110 220 78 204 Q 26 178 40 118 Q 60 54 128 62 Z"
		fill="url(#peach)" stroke="${OUTLINE}" stroke-width="9" stroke-linejoin="round"/>
	<path d="M 128 66 Q 118 120 128 200" stroke="#e8590c" stroke-width="5" fill="none" opacity="0.45" stroke-linecap="round"/>
	<ellipse cx="88" cy="104" rx="24" ry="15" fill="#fff" opacity="0.45" transform="rotate(-22 88 104)"/>
	${face(128, 140, 1.05)}
	${sparkle(208, 84, 1.1)}
	${sparkle(46, 66, 0.9)}`,
	`<radialGradient id="peach" cx="0.42" cy="0.34" r="1">
		<stop offset="0" stop-color="#ffc9c9"/><stop offset="0.5" stop-color="#ff8787"/><stop offset="1" stop-color="#f03e3e"/>
	</radialGradient>`,
);

// H4 鞭炮 firecrackers
symbols.h4 = svgWrap(
	256,
	256,
	`
	<!-- hanging knot -->
	<path d="M 128 8 L 128 34" stroke="#c92a2a" stroke-width="7" stroke-linecap="round"/>
	<path d="M 116 30 L 140 30 L 134 48 L 122 48 Z" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="6" stroke-linejoin="round"/>
	<!-- back crackers -->
	<g transform="rotate(-18 88 130)">
		<rect x="62" y="72" width="52" height="116" rx="14" fill="url(#cracker2)" stroke="${OUTLINE}" stroke-width="8"/>
		<rect x="62" y="88" width="52" height="14" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="4"/>
		<rect x="62" y="148" width="52" height="14" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="4"/>
	</g>
	<g transform="rotate(16 172 130)">
		<rect x="146" y="72" width="52" height="116" rx="14" fill="url(#cracker2)" stroke="${OUTLINE}" stroke-width="8"/>
		<rect x="146" y="88" width="52" height="14" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="4"/>
		<rect x="146" y="148" width="52" height="14" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="4"/>
	</g>
	<!-- front cracker with face -->
	<rect x="96" y="58" width="64" height="150" rx="16" fill="url(#cracker1)" stroke="${OUTLINE}" stroke-width="9"/>
	<rect x="96" y="76" width="64" height="16" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="5"/>
	<rect x="96" y="176" width="64" height="16" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="5"/>
	<ellipse cx="112" cy="108" rx="12" ry="20" fill="#fff" opacity="0.3" transform="rotate(-8 112 108)"/>
	${face(128, 134, 0.92)}
	<!-- sparking fuse -->
	<path d="M 128 58 Q 138 42 156 40" stroke="#846b4d" stroke-width="6" fill="none" stroke-linecap="round"/>
	<circle cx="160" cy="38" r="7" fill="#ffe066"/>
	${sparkle(160, 38, 1.6, '#fff59b')}
	${sparkle(182, 24, 0.9, '#ffc078')}
	${sparkle(178, 58, 0.8, '#ffc078')}
	${sparkle(52, 208, 0.9)}`,
	`<linearGradient id="cracker1" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#ff6b6b"/><stop offset="0.5" stop-color="#e03131"/><stop offset="1" stop-color="#c92a2a"/>
	</linearGradient>
	<linearGradient id="cracker2" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#e03131"/><stop offset="1" stop-color="#a61e1e"/>
	</linearGradient>`,
);

// royals — lacquer tiles
symbols.l1 = royal('A', '#e03131', '#8f1414');
symbols.l2 = royal('K', '#0ca678', '#05543c');
symbols.l3 = royal('Q', '#ae3ec9', '#6b1a80');
symbols.l4 = royal('J', '#3b5bdb', '#1d2f80');
symbols.l5 = royal('10', '#f76707', '#a63c06');

// S 金蟠桃 golden peach (scatter)
symbols.s = svgWrap(
	256,
	256,
	`
	<!-- radiant glow -->
	<circle cx="128" cy="134" r="112" fill="url(#peachGlow)"/>
	<!-- stem + gold leaves -->
	<path d="M 128 60 Q 126 42 114 34" stroke="#b8791a" stroke-width="9" fill="none" stroke-linecap="round"/>
	<path d="M 126 54 Q 94 28 60 46 Q 90 64 110 60 Z" fill="url(#goldLeaf)" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<path d="M 130 54 Q 164 28 198 48 Q 168 64 146 60 Z" fill="url(#goldLeaf)" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	<!-- golden peach body -->
	<path d="M 128 64 Q 192 56 212 116 Q 226 174 176 200 Q 146 216 128 202 Q 110 216 80 200 Q 30 174 44 116 Q 64 56 128 64 Z"
		fill="url(#goldPeach)" stroke="${OUTLINE}" stroke-width="9" stroke-linejoin="round"/>
	<path d="M 128 68 Q 118 120 128 196" stroke="#b8791a" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round"/>
	<ellipse cx="90" cy="102" rx="24" ry="14" fill="#fff9db" opacity="0.65" transform="rotate(-22 90 102)"/>
	${face(128, 138, 1, 'cheeky')}
	${sparkle(52, 84, 1.2, '#fff59b')}
	${sparkle(212, 96, 1, '#fff59b')}
	${sparkle(72, 196, 0.9, '#fff59b')}
	${sparkle(196, 186, 0.8, '#fff59b')}`,
	`<radialGradient id="peachGlow" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0.55" stop-color="#ffd43b" stop-opacity="0.4"/><stop offset="1" stop-color="#ffd43b" stop-opacity="0"/>
	</radialGradient>
	<radialGradient id="goldPeach" cx="0.42" cy="0.34" r="1">
		<stop offset="0" stop-color="#fff3bf"/><stop offset="0.5" stop-color="#ffd43b"/><stop offset="1" stop-color="#f08c00"/>
	</radialGradient>
	<linearGradient id="goldLeaf" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#e8a33d"/>
	</linearGradient>`,
);

// W 悟空 monkey head with 金箍 headband (+ shared for wx)
const monkeyHead = (cx, cy, s) => `
	<circle cx="${cx - 62 * s}" cy="${cy - 22 * s}" r="${26 * s}" fill="#a9745b" stroke="${OUTLINE}" stroke-width="${8 * s}"/>
	<circle cx="${cx + 62 * s}" cy="${cy - 22 * s}" r="${26 * s}" fill="#a9745b" stroke="${OUTLINE}" stroke-width="${8 * s}"/>
	<circle cx="${cx - 62 * s}" cy="${cy - 22 * s}" r="${13 * s}" fill="#e8b795"/>
	<circle cx="${cx + 62 * s}" cy="${cy - 22 * s}" r="${13 * s}" fill="#e8b795"/>
	<circle cx="${cx}" cy="${cy}" r="${64 * s}" fill="#8a5a3c" stroke="${OUTLINE}" stroke-width="${8 * s}"/>
	<path d="M ${cx - 44 * s} ${cy + 6 * s} Q ${cx - 44 * s} ${cy - 34 * s} ${cx} ${cy - 34 * s} Q ${cx + 44 * s} ${cy - 34 * s} ${cx + 44 * s} ${cy + 6 * s} Q ${cx + 44 * s} ${cy + 40 * s} ${cx} ${cy + 40 * s} Q ${cx - 44 * s} ${cy + 40 * s} ${cx - 44 * s} ${cy + 6 * s} Z" fill="#e8b795"/>
	<!-- 金箍 golden headband with curled ends -->
	<path d="M ${cx - 58 * s} ${cy - 40 * s} Q ${cx} ${cy - 66 * s} ${cx + 58 * s} ${cy - 40 * s}"
		stroke="url(#headband)" stroke-width="${13 * s}" fill="none" stroke-linecap="round"/>
	<path d="M ${cx - 58 * s} ${cy - 40 * s} Q ${cx - 70 * s} ${cy - 48 * s} ${cx - 62 * s} ${cy - 58 * s}"
		stroke="url(#headband)" stroke-width="${9 * s}" fill="none" stroke-linecap="round"/>
	<path d="M ${cx + 58 * s} ${cy - 40 * s} Q ${cx + 70 * s} ${cy - 48 * s} ${cx + 62 * s} ${cy - 58 * s}"
		stroke="url(#headband)" stroke-width="${9 * s}" fill="none" stroke-linecap="round"/>
	${face(cx, cy + 2 * s, s)}`;

const headbandDef = `
	<linearGradient id="headband" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#fff3bf"/><stop offset="0.5" stop-color="#ffd43b"/><stop offset="1" stop-color="#b8791a"/>
	</linearGradient>`;

symbols.w = svgWrap(
	256,
	256,
	`
	${monkeyHead(128, 96, 0.92)}
	<!-- 金箍棒 held diagonally in front -->
	<g transform="translate(128 172) rotate(-28)">
		${cudgelH(228, 9)}
	</g>
	<!-- paw gripping the cudgel -->
	<circle cx="128" cy="172" r="17" fill="#8a5a3c" stroke="${OUTLINE}" stroke-width="7"/>
	<!-- 百搭 banner -->
	<path d="M 40 200 L 26 242 L 56 232 L 200 232 L 230 242 L 216 200 Q 128 216 40 200 Z"
		fill="url(#wildBanner)" stroke="${OUTLINE}" stroke-width="8" stroke-linejoin="round"/>
	<text x="128" y="234" font-family="${CJK_FONT}" font-weight="900" font-size="30"
		text-anchor="middle" fill="#ffd43b" stroke="#5c1a0e" stroke-width="2">百搭</text>
	${sparkle(216, 60, 1.1)}
	${sparkle(40, 96, 0.9)}`,
	`${headbandDef}${cudgelDefs}
	<linearGradient id="wildBanner" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#e03131"/><stop offset="1" stop-color="#8f1414"/>
	</linearGradient>`,
);

// cudgel — standalone 金箍棒 for the spinning-expansion spine (diagonal, centered)
symbols.cudgel = svgWrap(
	256,
	256,
	`<g transform="translate(128 128) rotate(-45)">${cudgelH(320, 11)}</g>`,
	cudgelDefs,
);

// WX expanded full-reel 悟空 (256 x 1280 — covers 5 rows)
symbols.wx = svgWrap(
	256,
	1280,
	`
	<!-- golden aura column -->
	<rect x="24" y="16" width="208" height="1248" rx="100" fill="url(#auraCol)"/>
	<!-- vertical 金箍棒 spanning the reel -->
	<g transform="translate(178 640) rotate(90)">
		${cudgelH(1216, 13)}
	</g>
	<!-- 筋斗雲 somersault cloud at the feet -->
	${cloud(96, 1150, 2.4, '#ffd43b')}
	${cloud(180, 1190, 1.8, '#ffe680')}
	${cloud(60, 1210, 1.6, '#ffe680')}
	<!-- tail -->
	<path d="M 74 1080 Q 6 1030 30 950 Q 44 900 84 912" stroke="#8a5a3c" stroke-width="24" fill="none" stroke-linecap="round"/>
	<!-- legs -->
	<path d="M 96 1060 Q 88 1108 106 1124 M 168 1060 Q 178 1108 158 1124" stroke="${OUTLINE}" stroke-width="42" stroke-linecap="round"/>
	<path d="M 96 1058 Q 88 1104 106 1120 M 168 1058 Q 178 1104 158 1120" stroke="#8a5a3c" stroke-width="30" stroke-linecap="round"/>
	<!-- body -->
	<ellipse cx="130" cy="900" rx="84" ry="170" fill="url(#wukongRobe)" stroke="${OUTLINE}" stroke-width="10"/>
	<!-- tiger-skin skirt -->
	<path d="M 58 940 Q 130 970 202 940 L 196 1030 Q 130 1056 64 1030 Z" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="8" stroke-linejoin="round"/>
	<g stroke="#8a5a3c" stroke-width="7" stroke-linecap="round">
		<path d="M 84 952 L 78 1020 M 130 962 L 130 1040 M 176 952 L 182 1020"/>
	</g>
	<!-- chest wrap -->
	<path d="M 62 812 Q 130 852 198 812 L 198 872 Q 130 908 62 872 Z" fill="#ffe066" stroke="${OUTLINE}" stroke-width="8" stroke-linejoin="round"/>
	<!-- sash knot -->
	<circle cx="130" cy="880" r="14" fill="#ffd43b" stroke="${OUTLINE}" stroke-width="6"/>
	<!-- left arm raised in a fist -->
	<path d="M 66 830 Q 18 760 40 690" stroke="${OUTLINE}" stroke-width="42" stroke-linecap="round"/>
	<path d="M 66 828 Q 22 760 44 696" stroke="#8a5a3c" stroke-width="30" stroke-linecap="round"/>
	<circle cx="42" cy="678" r="22" fill="#8a5a3c" stroke="${OUTLINE}" stroke-width="8"/>
	<!-- right arm gripping the vertical cudgel -->
	<path d="M 192 830 Q 218 800 202 748" stroke="${OUTLINE}" stroke-width="42" stroke-linecap="round"/>
	<path d="M 192 828 Q 214 800 200 752" stroke="#8a5a3c" stroke-width="30" stroke-linecap="round"/>
	<circle cx="178" cy="736" r="23" fill="#8a5a3c" stroke="${OUTLINE}" stroke-width="8"/>
	<!-- head -->
	${monkeyHead(128, 560, 1.5)}
	<!-- red neck scarf tails -->
	<path d="M 96 660 Q 74 700 92 736 L 122 700 Z" fill="#e03131" stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
	${sparkle(40, 460, 1.4, '#fff59b')}
	${sparkle(216, 500, 1.1, '#fff59b')}
	${sparkle(52, 1130, 1.2, '#fff59b')}
	${sparkle(206, 300, 1.1, '#fff59b')}
	${sparkle(60, 200, 0.9, '#fff59b')}`,
	`${headbandDef}${cudgelDefs}
	<radialGradient id="auraCol" cx="0.5" cy="0.5" r="0.72">
		<stop offset="0.5" stop-color="#ffd43b" stop-opacity="0.22"/><stop offset="1" stop-color="#ffd43b" stop-opacity="0"/>
	</radialGradient>
	<linearGradient id="wukongRobe" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#f03e3e"/><stop offset="1" stop-color="#a61e1e"/>
	</linearGradient>`,
);

// X dead tile (superspin blank) — worn wooden plaque with a faint cloud carving
symbols.x = svgWrap(
	256,
	256,
	`
	<rect x="46" y="46" width="164" height="164" rx="24" fill="#6b4d3a" stroke="#472e1e" stroke-width="9" opacity="0.9"/>
	<rect x="62" y="62" width="132" height="132" rx="16" fill="#7d5c44" opacity="0.9"/>
	<path d="M 88 140 Q 82 122 100 118 Q 102 104 120 108 Q 130 96 144 106 Q 160 102 162 118 Q 176 122 170 138 Q 172 146 158 146 L 96 146 Q 86 146 88 140 Z"
		fill="none" stroke="#5d4030" stroke-width="5" opacity="0.75"/>
	<g stroke="#5d4030" stroke-width="4" opacity="0.5">
		<path d="M 70 176 Q 128 168 186 176 M 70 88 Q 110 82 150 86"/>
	</g>`,
);

// P prize — 銅錢 gold coin with square hole
symbols.p = svgWrap(
	256,
	256,
	`
	<circle cx="128" cy="128" r="98" fill="url(#coinRim)" stroke="${OUTLINE}" stroke-width="9"/>
	<circle cx="128" cy="128" r="78" fill="url(#coinFace)" stroke="#a8720a" stroke-width="6"/>
	<!-- square hole -->
	<rect x="103" y="103" width="50" height="50" rx="6" fill="#8f5f0a" stroke="#a8720a" stroke-width="5"/>
	<rect x="111" y="111" width="34" height="34" rx="4" fill="url(#coinHole)"/>
	<!-- four dots as stylized characters -->
	<circle cx="128" cy="70" r="8" fill="#a8720a"/>
	<circle cx="128" cy="186" r="8" fill="#a8720a"/>
	<circle cx="70" cy="128" r="8" fill="#a8720a"/>
	<circle cx="186" cy="128" r="8" fill="#a8720a"/>
	<path d="M 62 74 Q 100 40 150 52" stroke="#fff" stroke-width="12" fill="none" opacity="0.55" stroke-linecap="round"/>
	${sparkle(196, 76, 1.3)}
	${sparkle(58, 176, 1)}`,
	`<radialGradient id="coinRim" cx="0.4" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#e8a33d"/>
	</radialGradient>
	<radialGradient id="coinFace" cx="0.42" cy="0.38" r="1">
		<stop offset="0" stop-color="#ffd43b"/><stop offset="1" stop-color="#f6b21b"/>
	</radialGradient>
	<linearGradient id="coinHole" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#5c3d05"/><stop offset="1" stop-color="#7a5208"/>
	</linearGradient>`,
);

// ─── backgrounds (1920x1080) ────────────────────────────────────────────────
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

// layered ink-wash mountain ridge
const ridge = (baseY, amp, color, opacity = 1) =>
	`<path d="M 0 ${baseY} Q 240 ${baseY - amp} 480 ${baseY - amp * 0.3} T 960 ${baseY - amp * 0.8} T 1440 ${baseY - amp * 0.2} T 1920 ${baseY - amp * 0.9} L 1920 1080 L 0 1080 Z" fill="${color}" opacity="${opacity}"/>`;

// pagoda silhouette (3 tiers), anchored at base center (x, y), height ~ s*220
const pagoda = (x, y, s, color) => `
	<g transform="translate(${x} ${y}) scale(${s})" fill="${color}">
		<rect x="-14" y="-30" width="28" height="30"/>
		<path d="M -52 -30 Q 0 -46 52 -30 L 34 -58 L -34 -58 Z"/>
		<rect x="-11" y="-84" width="22" height="26"/>
		<path d="M -42 -84 Q 0 -98 42 -84 L 27 -108 L -27 -108 Z"/>
		<rect x="-8" y="-130" width="16" height="22"/>
		<path d="M -32 -130 Q 0 -142 32 -130 L 20 -150 L -20 -150 Z"/>
		<path d="M 0 -150 L 0 -170 M -6 -164 L 6 -164" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
	</g>`;

// hanging red lantern with gold caps + tassel
const lantern = (x, y, s, ropeLen) => `
	<g transform="translate(${x} ${y})">
		<path d="M 0 ${-ropeLen} L 0 0" stroke="#5c1a0e" stroke-width="${4 * s}"/>
		<g transform="scale(${s})">
			<rect x="-16" y="0" width="32" height="10" rx="4" fill="#e8a33d"/>
			<ellipse cx="0" cy="46" rx="42" ry="38" fill="url(#lanternBgGrad)"/>
			<path d="M -28 18 Q -38 46 -28 74 M 0 12 Q -4 46 0 80 M 28 18 Q 38 46 28 74" stroke="#ffb84d" stroke-width="3" fill="none" opacity="0.8"/>
			<rect x="-13" y="82" width="26" height="9" rx="4" fill="#e8a33d"/>
			<path d="M 0 91 L 0 104" stroke="#e8a33d" stroke-width="4"/>
			<path d="M -5 104 Q 0 126 5 104 Z" fill="#e03131"/>
		</g>
	</g>`;

const lanternBgDefs = `
	<radialGradient id="lanternBgGrad" cx="0.42" cy="0.36" r="1">
		<stop offset="0" stop-color="#ff8787"/><stop offset="0.6" stop-color="#f03e3e"/><stop offset="1" stop-color="#b02525"/>
	</radialGradient>`;

// bamboo stalk
const bamboo = (x, s, color, h = 1080) => {
	let segs = '';
	const segH = 130 * s;
	for (let y = h; y > -segH; y -= segH) {
		segs += `<rect x="${x - 14 * s}" y="${y - segH + 6}" width="${28 * s}" height="${segH - 8}" rx="${10 * s}" fill="${color}"/>`;
	}
	return `<g opacity="0.9">${segs}
		<ellipse cx="${x + 46 * s}" cy="${h * 0.28}" rx="${44 * s}" ry="${13 * s}" fill="${color}" transform="rotate(-24 ${x + 46 * s} ${h * 0.28})"/>
		<ellipse cx="${x - 40 * s}" cy="${h * 0.44}" rx="${40 * s}" ry="${12 * s}" fill="${color}" transform="rotate(18 ${x - 40 * s} ${h * 0.44})"/>
	</g>`;
};

const backgrounds = {};

// 白日青綠山水 base game
backgrounds.bg_base = svgWrap(
	1920,
	1080,
	`
	<rect width="1920" height="1080" fill="url(#skyBase)"/>
	<circle cx="960" cy="330" r="430" fill="#fff9c4" opacity="0.3"/>
	<circle cx="960" cy="330" r="280" fill="#fff9c4" opacity="0.25"/>
	<!-- distant ink-wash ridges -->
	${ridge(560, 150, '#9ecfbf', 0.75)}
	${ridge(660, 190, '#6fb59e', 0.85)}
	${pagoda(1520, 640, 1.5, '#3c7a66')}
	${ridge(780, 170, '#4f9a80')}
	${ridge(900, 150, '#37806a')}
	<!-- bamboo edges -->
	${bamboo(56, 1.15, '#2f9e6e')}
	${bamboo(1868, 1.3, '#2b8a61')}
	<!-- 祥雲 drifting clouds -->
	${cloud(380, 220, 1.6, '#fff', 0.8)}
	${cloud(1460, 160, 2.0, '#fff', 0.7)}
	${cloud(900, 120, 1.2, '#fff', 0.6)}
	${cloud(240, 420, 1.1, '#fff', 0.4)}
	${cloud(1700, 380, 1.3, '#fff', 0.45)}
	<!-- hanging lanterns -->
	${lantern(180, 40, 1.0, 60)}
	${lantern(320, -6, 0.72, 40)}
	${lantern(1740, 46, 1.05, 66)}
	${lantern(1600, -2, 0.7, 40)}
	${bokeh(7, 22, '#fff9db', 1920, 1080)}
	<rect width="1920" height="1080" fill="url(#vignBase)"/>`,
	`<linearGradient id="skyBase" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#9ee2e8"/><stop offset="0.55" stop-color="#cff5e8"/><stop offset="1" stop-color="#e9fbf0"/>
	</linearGradient>
	${lanternBgDefs}
	<radialGradient id="vignBase" cx="0.5" cy="0.46" r="0.85">
		<stop offset="0.62" stop-color="#000" stop-opacity="0"/>
		<stop offset="1" stop-color="#0c2b1d" stop-opacity="0.5"/>
	</radialGradient>`,
);

// 紅金慶典 free game
backgrounds.bg_feature = svgWrap(
	1920,
	1080,
	`
	<rect width="1920" height="1080" fill="url(#skyFeat)"/>
	<circle cx="960" cy="380" r="470" fill="#ffd43b" opacity="0.3"/>
	<circle cx="960" cy="380" r="300" fill="#ffe066" opacity="0.28"/>
	<!-- firework bursts -->
	<g stroke="#ffe066" stroke-width="4" opacity="0.85" stroke-linecap="round">
		<g transform="translate(420 220)">
			<path d="M 0 -70 L 0 -26 M 49 -49 L 18 -18 M 70 0 L 26 0 M 49 49 L 18 18 M 0 70 L 0 26 M -49 49 L -18 18 M -70 0 L -26 0 M -49 -49 L -18 -18"/>
		</g>
		<g transform="translate(1560 180) scale(1.25)">
			<path d="M 0 -70 L 0 -26 M 49 -49 L 18 -18 M 70 0 L 26 0 M 49 49 L 18 18 M 0 70 L 0 26 M -49 49 L -18 18 M -70 0 L -26 0 M -49 -49 L -18 -18"/>
		</g>
		<g transform="translate(1150 120) scale(0.8)" stroke="#ff922b">
			<path d="M 0 -70 L 0 -26 M 49 -49 L 18 -18 M 70 0 L 26 0 M 49 49 L 18 18 M 0 70 L 0 26 M -49 49 L -18 18 M -70 0 L -26 0 M -49 -49 L -18 -18"/>
		</g>
	</g>
	<!-- dark red ridges -->
	${ridge(640, 170, '#8f2020', 0.8)}
	${pagoda(340, 700, 1.7, '#5c1414')}
	${ridge(760, 190, '#701818')}
	${ridge(900, 150, '#521010')}
	<!-- golden clouds -->
	${cloud(300, 320, 1.7, '#ffd43b', 0.75)}
	${cloud(1620, 340, 1.9, '#ffd43b', 0.7)}
	${cloud(1000, 240, 1.2, '#ffe680', 0.6)}
	<!-- rising sky lanterns -->
	<g fill="#ffd43b">
		<g transform="translate(760 520)" opacity="0.9">
			<path d="M -16 0 Q 0 -34 16 0 Q 12 18 -12 18 Q -16 12 -16 0 Z"/>
			<circle cx="0" cy="4" r="26" fill="#ffe066" opacity="0.3"/>
		</g>
		<g transform="translate(1240 440) scale(0.8)" opacity="0.85">
			<path d="M -16 0 Q 0 -34 16 0 Q 12 18 -12 18 Q -16 12 -16 0 Z"/>
			<circle cx="0" cy="4" r="26" fill="#ffe066" opacity="0.3"/>
		</g>
		<g transform="translate(520 640) scale(0.6)" opacity="0.8">
			<path d="M -16 0 Q 0 -34 16 0 Q 12 18 -12 18 Q -16 12 -16 0 Z"/>
		</g>
	</g>
	<!-- hanging lanterns -->
	${lantern(150, 40, 1.1, 60)}
	${lantern(1770, 36, 1.1, 56)}
	${bokeh(11, 30, '#ffe066', 1920, 1080)}
	<rect width="1920" height="1080" fill="url(#vignFeat)"/>`,
	`<linearGradient id="skyFeat" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#5c0e0e"/><stop offset="0.5" stop-color="#a61e1e"/><stop offset="1" stop-color="#e8590c"/>
	</linearGradient>
	${lanternBgDefs}
	<radialGradient id="vignFeat" cx="0.5" cy="0.46" r="0.85">
		<stop offset="0.62" stop-color="#000" stop-opacity="0"/>
		<stop offset="1" stop-color="#2b0505" stop-opacity="0.55"/>
	</radialGradient>`,
);

// 月夜 superspin
backgrounds.bg_superspin = svgWrap(
	1920,
	1080,
	`
	<rect width="1920" height="1080" fill="url(#skyNight)"/>
	<!-- full moon -->
	<circle cx="1420" cy="260" r="150" fill="#fff9db" opacity="0.16"/>
	<circle cx="1420" cy="260" r="110" fill="url(#moon)"/>
	<circle cx="1385" cy="230" r="18" fill="#efe8c8" opacity="0.5"/>
	<circle cx="1450" cy="290" r="12" fill="#efe8c8" opacity="0.4"/>
	<!-- night ridges -->
	${ridge(620, 160, '#232752', 0.9)}
	${pagoda(430, 680, 1.6, '#171a3d')}
	${ridge(760, 190, '#1b1e45')}
	${ridge(900, 150, '#131538')}
	<!-- night clouds -->
	${cloud(320, 240, 1.6, '#3a3f78', 0.8)}
	${cloud(1000, 160, 1.2, '#3a3f78', 0.7)}
	${cloud(1660, 420, 1.4, '#2f3468', 0.8)}
	<!-- lanterns glowing in the dark -->
	${lantern(170, 40, 1.0, 60)}
	${lantern(1760, 44, 1.0, 62)}
	<circle cx="170" cy="86" r="60" fill="#ff8787" opacity="0.14"/>
	<circle cx="1760" cy="90" r="60" fill="#ff8787" opacity="0.14"/>
	${bokeh(23, 34, '#ffd43b', 1920, 1080)}
	<rect width="1920" height="1080" fill="url(#vignNight)"/>`,
	`<linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#14163a"/><stop offset="0.6" stop-color="#232866"/><stop offset="1" stop-color="#2c3178"/>
	</linearGradient>
	${lanternBgDefs}
	<radialGradient id="moon" cx="0.42" cy="0.38" r="1">
		<stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#f3e9b8"/>
	</radialGradient>
	<radialGradient id="vignNight" cx="0.5" cy="0.46" r="0.85">
		<stop offset="0.62" stop-color="#000" stop-opacity="0"/>
		<stop offset="1" stop-color="#05061a" stop-opacity="0.6"/>
	</radialGradient>`,
);

// ─── reel frame (1280x1280, board occupies the centered 1000x1000) ──────────
// frame_bg: opaque lacquer panel behind the reels; frame_edge: ornate gold
// border with transparent center drawn above the symbols.
const frames = {};

frames.frame_bg = svgWrap(
	1280,
	1280,
	`
	<rect x="104" y="104" width="1072" height="1072" rx="36" fill="url(#panel)"/>
	<rect x="126" y="126" width="1028" height="1028" rx="26" fill="none" stroke="#e8a33d" stroke-width="4" opacity="0.5"/>
	<!-- faint column separators for the 5 reels -->
	<g stroke="#5c1a0e" stroke-width="4" opacity="0.55">
		<path d="M 344 130 L 344 1150 M 558 130 L 558 1150 M 772 130 L 772 1150 M 986 130 L 986 1150"/>
	</g>`,
	`<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#43101c"/><stop offset="0.5" stop-color="#571523"/><stop offset="1" stop-color="#3a0d18"/>
	</linearGradient>`,
);

// 回紋 meander strip along an edge — repeated key pattern
const meanderH = (x0, y, count, step, color, sw = 7) => {
	let d = '';
	for (let i = 0; i < count; i++) {
		const x = x0 + i * step;
		d += `M ${x} ${y} h ${step * 0.72} v ${-step * 0.34} h ${-step * 0.44} v ${step * 0.18} h ${step * 0.22} `;
	}
	return `<path d="${d}" stroke="${color}" stroke-width="${sw}" fill="none"/>`;
};

frames.frame_edge = svgWrap(
	1280,
	1280,
	`
	<!-- main gold border -->
	<rect x="70" y="70" width="1140" height="1140" rx="52" fill="none" stroke="url(#gold0)" stroke-width="64"/>
	<rect x="42" y="42" width="1196" height="1196" rx="66" fill="none" stroke="${OUTLINE}" stroke-width="10"/>
	<rect x="99" y="99" width="1082" height="1082" rx="40" fill="none" stroke="#8a5a12" stroke-width="8"/>
	<!-- red inner lining -->
	<rect x="90" y="90" width="1100" height="1100" rx="44" fill="none" stroke="#a61e1e" stroke-width="7" opacity="0.8"/>
	<!-- 回紋 meander bands top & bottom -->
	<g opacity="0.65">
		${meanderH(180, 74, 13, 72, '#8a5a12')}
		<g transform="translate(0 1280) scale(1 -1)">${meanderH(180, 74, 13, 72, '#8a5a12')}</g>
	</g>
	<!-- corner 雲紋 gold clouds -->
	${cloud(96, 92, 1.9, '#ffe066')}
	${cloud(1184, 92, 1.9, '#ffe066')}
	${cloud(96, 1198, 1.9, '#ffe066')}
	${cloud(1184, 1198, 1.9, '#ffe066')}
	<g stroke="${OUTLINE}" stroke-width="5" fill="none" opacity="0.9">
		<path d="M 60 104 Q 52 76 78 70 M 1220 104 Q 1228 76 1202 70 M 60 1186 Q 52 1212 78 1218 M 1220 1186 Q 1228 1212 1202 1218"/>
	</g>
	<!-- top-center gold medallion -->
	<g transform="translate(640 66)">
		<circle r="52" fill="url(#gold1)" stroke="${OUTLINE}" stroke-width="8"/>
		<circle r="34" fill="#a61e1e" stroke="#8a5a12" stroke-width="5"/>
		<text x="0" y="13" font-family="${CJK_FONT}" font-weight="900" font-size="38" text-anchor="middle" fill="#ffd43b">福</text>
	</g>
	<!-- bottom-center knot tassel -->
	<g transform="translate(640 1210)">
		<rect x="-26" y="-26" width="52" height="52" rx="10" transform="rotate(45)" fill="url(#gold1)" stroke="${OUTLINE}" stroke-width="7"/>
		<rect x="-14" y="-14" width="28" height="28" rx="6" transform="rotate(45)" fill="#a61e1e"/>
		<path d="M -12 34 Q -14 62 -8 66 M 12 34 Q 14 62 8 66" stroke="#e03131" stroke-width="8" stroke-linecap="round"/>
	</g>`,
	`<linearGradient id="gold0" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe680"/><stop offset="0.25" stop-color="#e8a33d"/><stop offset="0.55" stop-color="#ffd43b"/><stop offset="1" stop-color="#b8791a"/>
	</linearGradient>
	<radialGradient id="gold1" cx="0.4" cy="0.35" r="1">
		<stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#d4901e"/>
	</radialGradient>`,
);

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
for (const [name, svg] of Object.entries(frames)) {
	render(svg, path.join(FRAME_DIR, `${name}.png`), 1280);
}
console.log('done');
