// WildParty party-styled reel/counter/multiplier frames — replaces the plain
// dark-wood + gunmetal-steel Mining Madness frame atlas with the gold-trim /
// deep-plum / bunting-and-disco-ball look already established by
// generate_presentation.mjs (fsPanel, number_ring, banners).
//
// reels_frame.png is rebuilt from scratch keeping only the 3 sprites that are
// actually referenced in src/ (frame_bg, frame_edge, Frame_FSCounter) — the
// rest of the old TexturePacker sheet (frame_fade, Frame_Multiplier,
// Frame_Tumble, Frame_TumbleWin, pressanywhere_fade) is dead weight, unused
// anywhere in the codebase, and dropped.
//
// multiframe.png (globalMultiplier spine) is patched surgically: only the
// Frame_Multiplier / Frame_Multiplier_glow pixel regions are repainted in
// place, at their existing atlas coordinates, so the sparkle-particle regions
// elsewhere on the same sheet are left untouched and the .atlas file needs no
// changes.
//
// Usage: node design/generate_frames_party.mjs <dir with node_modules for @resvg/resvg-js and pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node generate_frames_party.mjs <dir with node_modules/@resvg+pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REELS_DIR = path.join(appRoot, 'static/assets/sprites/reelsFrame');
const MULTI_DIR = path.join(appRoot, 'static/assets/spines/globalMultiplier');

const INK = '#2a0a20';
const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

const sparkle = (x, y, s, color = '#fff8d0') =>
	`<path d="M ${x} ${y - 8 * s} Q ${x + 2 * s} ${y - 2 * s} ${x + 8 * s} ${y} Q ${x + 2 * s} ${y + 2 * s} ${x} ${y + 8 * s} Q ${x - 2 * s} ${y + 2 * s} ${x - 8 * s} ${y} Q ${x - 2 * s} ${y - 2 * s} ${x} ${y - 8 * s} Z" fill="${color}" opacity="0.95"/>`;

const discoBallCharm = (x, y, r) => `
	<circle cx="${x}" cy="${y}" r="${r}" fill="url(#ball)" stroke="${INK}" stroke-width="${r * 0.22}"/>
	<path d="M ${x - r} ${y - r * 0.35} Q ${x} ${y - r * 0.6} ${x + r} ${y - r * 0.35} M ${x - r * 0.3} ${y - r * 1.15} L ${x - r * 0.3} ${y + r * 1.15} M ${x + r * 0.3} ${y - r * 1.15} L ${x + r * 0.3} ${y + r * 1.15}"
		stroke="#7a7f9e" stroke-width="${r * 0.1}" fill="none" opacity="0.8"/>
	<ellipse cx="${x - r * 0.35}" cy="${y - r * 0.3}" rx="${r * 0.32}" ry="${r * 0.18}" fill="#ffffff" opacity="0.75"/>`;

const defs = `
	<linearGradient id="panelBg" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3d1245"/><stop offset="0.55" stop-color="#251035"/><stop offset="1" stop-color="#180a28"/>
	</linearGradient>
	<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="1" stop-color="#b8791a"/>
	</linearGradient>
	<radialGradient id="ball" cx="0.38" cy="0.32" r="1">
		<stop offset="0" stop-color="#f4f6ff"/><stop offset="0.6" stop-color="#c3c9e8"/><stop offset="1" stop-color="#8b91b5"/>
	</radialGradient>`;

const render = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } }).render().asPng();

// ─── reels_frame_v2.png (fresh 3-sprite atlas: frame_bg, frame_edge, Frame_FSCounter) ─
const FRAME_BG_W = 1080, FRAME_BG_H = 900;
// deterministic dot scatter for the low-contrast disco-light texture
let bgSeed = 24601;
const bgRand = () => {
	bgSeed = (bgSeed * 1103515245 + 12345) & 0x7fffffff;
	return bgSeed / 0x7fffffff;
};
const bgDots = Array.from({ length: 42 }, () => {
	const x = 60 + bgRand() * (FRAME_BG_W - 120);
	const y = 60 + bgRand() * (FRAME_BG_H - 120);
	const r = 3 + bgRand() * 7;
	return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${(0.02 + bgRand() * 0.025).toFixed(3)}"/>`;
}).join('');
const frameBgSvg = svgWrap(
	FRAME_BG_W, FRAME_BG_H,
	`
	<defs>
		<pattern id="pinstripe" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
			<line x1="0" y1="0" x2="0" y2="46" stroke="#ff8ede" stroke-width="9" opacity="0.045"/>
		</pattern>
		<clipPath id="bgClip">
			<rect x="24" y="24" width="${FRAME_BG_W - 48}" height="${FRAME_BG_H - 48}" rx="56"/>
		</clipPath>
	</defs>
	<rect x="24" y="24" width="${FRAME_BG_W - 48}" height="${FRAME_BG_H - 48}" rx="56" fill="url(#panelBg)"/>
	<g clip-path="url(#bgClip)">
		<rect x="24" y="24" width="${FRAME_BG_W - 48}" height="${FRAME_BG_H - 48}" fill="url(#pinstripe)"/>
		${bgDots}
		<ellipse cx="${FRAME_BG_W / 2}" cy="120" rx="${FRAME_BG_W * 0.42}" ry="150" fill="#ff8ede" opacity="0.05"/>
	</g>`,
	defs,
);

const FRAME_EDGE_W = 1080, FRAME_EDGE_H = 900;
const frameEdgeSvg = svgWrap(
	FRAME_EDGE_W, FRAME_EDGE_H,
	`
	<defs><mask id="hollow"><rect width="${FRAME_EDGE_W}" height="${FRAME_EDGE_H}" fill="#fff"/>
		<rect x="86" y="86" width="${FRAME_EDGE_W - 172}" height="${FRAME_EDGE_H - 172}" rx="34" fill="#000"/></mask></defs>
	<g mask="url(#hollow)">
		<rect x="24" y="24" width="${FRAME_EDGE_W - 48}" height="${FRAME_EDGE_H - 48}" rx="56" fill="url(#gold)" stroke="${INK}" stroke-width="14"/>
	</g>
	<rect x="86" y="86" width="${FRAME_EDGE_W - 172}" height="${FRAME_EDGE_H - 172}" rx="34" fill="none" stroke="${INK}" stroke-width="6" opacity="0.85"/>
	<rect x="98" y="98" width="${FRAME_EDGE_W - 196}" height="${FRAME_EDGE_H - 196}" rx="28" fill="none" stroke="#ff8ede" stroke-width="3" opacity="0.5"/>
	${sparkle(56, FRAME_EDGE_H - 56, 1.3)}
	${sparkle(FRAME_EDGE_W - 56, FRAME_EDGE_H - 56, 1.3)}
	`,
	defs,
);

const FS_W = 450, FS_H = 338;
const fsCounterSvg = svgWrap(
	FS_W, FS_H,
	`
	<rect x="14" y="14" width="${FS_W - 28}" height="${FS_H - 28}" rx="40" fill="url(#panelBg)" stroke="${INK}" stroke-width="9"/>
	<rect x="26" y="26" width="${FS_W - 52}" height="${FS_H - 52}" rx="32" fill="none" stroke="url(#gold)" stroke-width="7"/>
	<rect x="36" y="36" width="${FS_W - 72}" height="${FS_H - 72}" rx="26" fill="none" stroke="#ff8ede" stroke-width="2" opacity="0.5"/>
	<path d="M 40 34 Q ${FS_W / 2} 66 ${FS_W - 40} 34" stroke="${INK}" stroke-width="3" fill="none"/>
	${[0, 1, 2, 3, 4]
		.map((i) => {
			const t = i / 4;
			const x = 60 + t * (FS_W - 120);
			const y = 36 + Math.sin(Math.PI * t) * 24;
			const colors = ['#ffd75e', '#ff8ede', '#9ef3ff', '#c59bff', '#9effb0'];
			return `<path d="M ${x - 11} ${y} L ${x + 11} ${y} L ${x} ${y + 19} Z" fill="${colors[i]}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
		})
		.join('')}
	${discoBallCharm(38, FS_H - 30, 13)}
	${discoBallCharm(FS_W - 38, FS_H - 30, 13)}
	${sparkle(38, 40, 1)}
	${sparkle(FS_W - 38, 40, 1, '#ff8ede')}
	`,
	defs,
);

// pack the 3 live sprites onto one sheet, non-rotated, non-trimmed (simplest
// possible TexturePacker-style manifest — no reverse-engineering old bounds)
const PAD = 8;
const sheetW = FRAME_BG_W + FRAME_EDGE_W + FS_W + PAD * 4;
const sheetH = Math.max(FRAME_BG_H, FRAME_EDGE_H, FS_H) + PAD * 2;
const bgB64 = render(frameBgSvg, FRAME_BG_W).toString('base64');
const edgeB64 = render(frameEdgeSvg, FRAME_EDGE_W).toString('base64');
const fsB64 = render(fsCounterSvg, FS_W).toString('base64');

const bgX = PAD, edgeX = bgX + FRAME_BG_W + PAD, fsX = edgeX + FRAME_EDGE_W + PAD;
const sheetSvg = svgWrap(
	sheetW, sheetH,
	`
	<image href="data:image/png;base64,${bgB64}" x="${bgX}" y="${PAD}" width="${FRAME_BG_W}" height="${FRAME_BG_H}"/>
	<image href="data:image/png;base64,${edgeB64}" x="${edgeX}" y="${PAD}" width="${FRAME_EDGE_W}" height="${FRAME_EDGE_H}"/>
	<image href="data:image/png;base64,${fsB64}" x="${fsX}" y="${PAD}" width="${FS_W}" height="${FS_H}"/>
	`,
);
// v2 filename: cache-bust after the frame_bg texture change (§4.27 lesson)
fs.writeFileSync(path.join(REELS_DIR, 'reels_frame_v2.png'), render(sheetSvg, sheetW));
console.log('rendered reels_frame_v2.png', sheetW, 'x', sheetH);

const frameJson = {
	frames: {
		'frame_bg.png': {
			frame: { x: bgX, y: PAD, w: FRAME_BG_W, h: FRAME_BG_H },
			rotated: false,
			trimmed: false,
			spriteSourceSize: { x: 0, y: 0, w: FRAME_BG_W, h: FRAME_BG_H },
			sourceSize: { w: FRAME_BG_W, h: FRAME_BG_H },
		},
		'frame_edge.png': {
			frame: { x: edgeX, y: PAD, w: FRAME_EDGE_W, h: FRAME_EDGE_H },
			rotated: false,
			trimmed: false,
			spriteSourceSize: { x: 0, y: 0, w: FRAME_EDGE_W, h: FRAME_EDGE_H },
			sourceSize: { w: FRAME_EDGE_W, h: FRAME_EDGE_H },
		},
		'Frame_FSCounter.png': {
			frame: { x: fsX, y: PAD, w: FS_W, h: FS_H },
			rotated: false,
			trimmed: false,
			spriteSourceSize: { x: 0, y: 0, w: FS_W, h: FS_H },
			sourceSize: { w: FS_W, h: FS_H },
		},
	},
	meta: {
		app: 'design/generate_frames_party.mjs',
		version: '1.0',
		image: 'reels_frame_v2.png',
		format: 'RGBA8888',
		size: { w: sheetW, h: sheetH },
		scale: '1',
	},
};
fs.writeFileSync(path.join(REELS_DIR, 'reels_frame_v2.json'), JSON.stringify(frameJson, null, '\t') + '\n');
console.log('wrote reels_frame_v2.json (frame_bg, frame_edge, Frame_FSCounter only)');

// ─── vignette.png — soft corner-darkening overlay stretched over the canvas ─
const VIG_W = 640, VIG_H = 360;
const vignetteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VIG_W}" height="${VIG_H}" viewBox="0 0 ${VIG_W} ${VIG_H}">
<defs>
	<radialGradient id="vig" cx="0.5" cy="0.5" r="0.72">
		<stop offset="0" stop-color="#0a0212" stop-opacity="0"/>
		<stop offset="0.6" stop-color="#0a0212" stop-opacity="0"/>
		<stop offset="1" stop-color="#0a0212" stop-opacity="0.5"/>
	</radialGradient>
</defs>
<rect width="${VIG_W}" height="${VIG_H}" fill="url(#vig)"/>
</svg>`;
const MISC_DIR = path.join(appRoot, 'static/assets/sprites/misc');
fs.mkdirSync(MISC_DIR, { recursive: true });
fs.writeFileSync(path.join(MISC_DIR, 'vignette.png'), render(vignetteSvg, VIG_W));
console.log('rendered vignette.png', VIG_W, 'x', VIG_H);

// ─── multiframe.png — surgical patch of Frame_Multiplier / Frame_Multiplier_glow ─
const multiPath = path.join(MULTI_DIR, 'multiframe.png');
const multiPng = PNG.sync.read(fs.readFileSync(multiPath));

const blit = (destPng, srcPngBuffer, dx, dy) => {
	const src = PNG.sync.read(srcPngBuffer);
	for (let y = 0; y < src.height; y++) {
		for (let x = 0; x < src.width; x++) {
			const so = (y * src.width + x) * 4;
			const doX = dx + x, doY = dy + y;
			if (doX >= destPng.width || doY >= destPng.height) continue;
			const doff = (doY * destPng.width + doX) * 4;
			destPng.data[doff] = src.data[so];
			destPng.data[doff + 1] = src.data[so + 1];
			destPng.data[doff + 2] = src.data[so + 2];
			destPng.data[doff + 3] = src.data[so + 3];
		}
	}
};

// Frame_Multiplier region: bounds 2,2,211,135 (plank frame, hollow center for
// the ×N BitmapText slot to show through)
const FM_W = 211, FM_H = 135;
const frameMultSvg = svgWrap(
	FM_W, FM_H,
	`
	<defs><mask id="hollowM"><rect width="${FM_W}" height="${FM_H}" fill="#fff"/>
		<rect x="12" y="9" width="${FM_W - 24}" height="${FM_H - 18}" rx="14" fill="#000"/></mask></defs>
	<g mask="url(#hollowM)">
		<rect x="4" y="4" width="${FM_W - 8}" height="${FM_H - 8}" rx="22" fill="url(#gold)" stroke="${INK}" stroke-width="6"/>
	</g>
	<rect x="12" y="9" width="${FM_W - 24}" height="${FM_H - 18}" rx="14" fill="url(#panelBg)" stroke="${INK}" stroke-width="3"/>
	${sparkle(20, 18, 0.7)}
	${sparkle(FM_W - 20, FM_H - 18, 0.7, '#ff8ede')}
	`,
	defs,
);

// Frame_Multiplier_glow region: bounds 215,3,180,134 — a soft radial glow puck
const FG_W = 180, FG_H = 134;
const frameGlowSvg = svgWrap(
	FG_W, FG_H,
	`<ellipse cx="${FG_W / 2}" cy="${FG_H / 2}" rx="${FG_W / 2 - 6}" ry="${FG_H / 2 - 6}" fill="url(#glow)"/>`,
	`<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffe98a" stop-opacity="0.9"/>
		<stop offset="0.6" stop-color="#ff8ede" stop-opacity="0.4"/>
		<stop offset="1" stop-color="#ff8ede" stop-opacity="0"/>
	</radialGradient>`,
);

blit(multiPng, render(frameMultSvg, FM_W), 2, 2);
blit(multiPng, render(frameGlowSvg, FG_W), 215, 3);
fs.writeFileSync(multiPath, PNG.sync.write(multiPng));
console.log('patched multiframe.png (Frame_Multiplier + Frame_Multiplier_glow only, sparkles untouched)');

console.log('done');
