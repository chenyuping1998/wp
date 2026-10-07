// Offline preview of the loading-screen title lockup.
//
// The loading screen is the one surface nobody on this project sees before
// upload, and its title is pure geometry plus type — so it can be rendered here
// instead of guessed at. Usage:
//
//   node design/preview_title.mjs <dir with node_modules/@resvg/resvg-js>
//
// Writes title_cold.png and title_warm.png into design/. Warm is the brown
// backdrop the screen still has (Go Bananas 100's jungle art); cold is what it
// should look like once the Frostline background lands.
//
// This is an APPROXIMATION of LoadingScreen.svelte, not the component. It
// restates the same constants in SVG, so the two can drift — if you change the
// lockup, change both. What it is good for is answering "does this fit" and
// "does this read as ice", which are the two questions that kept being answered
// by guessing.
//
// ── TWO THINGS THIS SCRIPT EXISTS TO GET RIGHT ──────────────────────────────
//
// 1. @resvg IGNORES font-family when the face is supplied via `fontBuffers`, and
//    it does not warn. It silently substitutes a narrow default, and a
//    measurement taken that way reported "GO BANANAS" at 233px when the real
//    figure is 368 — 35% out, which was enough to size the subtitle wrongly
//    twice in a row. Load the face with `fontFiles` + `defaultFontFamily`, which
//    does work. An @font-face data URI inside <style> does not work either: the
//    text silently disappears and only the decorations draw.
//
// 2. Widths used for LAYOUT decisions come from the TTF's own tables below
//    (cmap -> glyph id, hmtx -> advance, unitsPerEm), never from a render. That
//    is the only measurement here that cannot be wrong about which font it used.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/preview_title.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const DESIGN = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(DESIGN, '..');
const FONT = path.join(APP, 'static/fonts/TitanOne.ttf');

// ── real advances, straight out of the font ────────────────────────────────
const b = fs.readFileSync(FONT);
const tables = {};
const tableCount = b.readUInt16BE(4);
for (let i = 0; i < tableCount; i++) {
	const p = 12 + i * 16;
	tables[b.toString('ascii', p, p + 4).trim()] = { off: b.readUInt32BE(p + 8) };
}
const unitsPerEm = b.readUInt16BE(tables.head.off + 18);
const numHMetrics = b.readUInt16BE(tables.hhea.off + 34);

const cmap = tables.cmap.off;
let sub = 0;
const subtableCount = b.readUInt16BE(cmap + 2);
for (let i = 0; i < subtableCount; i++) {
	const p = cmap + 4 + i * 8;
	const pid = b.readUInt16BE(p);
	const eid = b.readUInt16BE(p + 2);
	if ((pid === 3 && (eid === 1 || eid === 0)) || pid === 0) sub = cmap + b.readUInt32BE(p + 4);
}
const segX2 = b.readUInt16BE(sub + 6);
const segCount = segX2 / 2;
const endO = sub + 14;
const startO = endO + segX2 + 2;
const deltaO = startO + segX2;
const rangeO = deltaO + segX2;
const glyphFor = (cp) => {
	for (let i = 0; i < segCount; i++) {
		const end = b.readUInt16BE(endO + i * 2);
		if (cp > end) continue;
		const start = b.readUInt16BE(startO + i * 2);
		if (cp < start) return 0;
		const delta = b.readInt16BE(deltaO + i * 2);
		const range = b.readUInt16BE(rangeO + i * 2);
		if (range === 0) return (cp + delta) & 0xffff;
		const g = b.readUInt16BE(rangeO + i * 2 + range + (cp - start) * 2);
		return g === 0 ? 0 : (g + delta) & 0xffff;
	}
	return 0;
};
const advance = (gid) => b.readUInt16BE(tables.hmtx.off + Math.min(gid, numHMetrics - 1) * 4);
const widthOf = (text, size, spacing) => {
	let w = 0;
	for (const ch of text) w += (advance(glyphFor(ch.codePointAt(0))) / unitsPerEm) * size + spacing;
	return w;
};

// ── the lockup, restating LoadingScreen.svelte's constants ─────────────────
const TITLE_SIZE = 46;
const SUBTITLE_SIZE = Math.round(TITLE_SIZE * 1.75);
const TITLE_GAP = Math.round(TITLE_SIZE * 0.18);
const BEVEL = Math.max(2, Math.round(SUBTITLE_SIZE * 0.07));
const SPACING = 6;
const UNDER = '#0d3a5c';
const OUTLINE = '#0a2438';
const LINE_Y = { name: -(SUBTITLE_SIZE * 0.5 + TITLE_GAP), subtitle: TITLE_SIZE * 0.35 };

const NAME_W = widthOf('GO BANANAS', TITLE_SIZE, SPACING);
const SUB_W = widthOf('FROSTLINE', SUBTITLE_SIZE, SPACING);

const ICICLE_COUNT = 9;
const icicleAt = (i, width) => {
	const h = Math.abs(Math.sin(i * 78.233) * 43758.5453) % 1;
	const h2 = Math.abs(Math.sin(i * 12.9898 + 4.1) * 24634.6345) % 1;
	const t = (i + 0.5) / ICICLE_COUNT;
	return {
		x: -width / 2 + width * (0.06 + 0.88 * t),
		len: SUBTITLE_SIZE * (0.2 + 0.34 * h),
		halfWidth: SUBTITLE_SIZE * (0.07 + 0.06 * h2),
	};
};
const SPARKLES = [
	[-0.52, -0.42, 0.16],
	[0.44, -0.5, 0.12],
	[0.58, 0.3, 0.1],
	[-0.38, 0.46, 0.09],
	[0.08, -0.58, 0.08],
];

const W = 900;
const H = 340;
const CX = W / 2;
const CY = H / 2 + 14;

let icicles = '';
const top = CY + LINE_Y.subtitle + SUBTITLE_SIZE * 0.3;
for (let i = 0; i < ICICLE_COUNT; i++) {
	const k = icicleAt(i, SUB_W);
	const x = CX + k.x;
	icicles += `<polygon points="${x - k.halfWidth},${top} ${x + k.halfWidth},${top} ${x},${top + k.len}" fill="${UNDER}" opacity="0.95"/>`;
	icicles += `<polygon points="${x - k.halfWidth * 0.55},${top} ${x - k.halfWidth * 0.05},${top} ${x},${top + k.len * 0.92}" fill="#9fdcff" opacity="0.5"/>`;
}

let sparkles = '';
for (const [sx, sy, sr] of SPARKLES) {
	const r = SUBTITLE_SIZE * sr;
	const x = CX + SUB_W * sx;
	const y = CY + LINE_Y.subtitle + SUBTITLE_SIZE * sy;
	const w = r * 0.16;
	sparkles += `<polygon points="${x},${y - r} ${x + w},${y} ${x},${y + r} ${x - w},${y}" fill="#fff" opacity="0.9"/>`;
	sparkles += `<polygon points="${x - r},${y} ${x},${y - w} ${x + r},${y} ${x},${y + w}" fill="#fff" opacity="0.9"/>`;
}

const text = (y, size, fill, stroke, strokeWidth, opacity = 1) =>
	`<text x="${CX}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Titan One" font-size="${size}" letter-spacing="${SPACING}" fill="${fill}"` +
	(stroke
		? ` stroke="${stroke}" stroke-width="${strokeWidth}" paint-order="stroke" stroke-linejoin="round"`
		: '') +
	` opacity="${opacity}">`;

const svg = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
	<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2fbff"/><stop offset="0.5" stop-color="#b9e2ff"/><stop offset="1" stop-color="#6fa9d6"/></linearGradient>
	<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a8e4ff"/><stop offset="1" stop-color="#2f86c4"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${bg}"/>
${text(CY + LINE_Y.name, TITLE_SIZE, 'url(#t)', OUTLINE, 6)}GO BANANAS</text>
${text(CY + LINE_Y.subtitle + BEVEL, SUBTITLE_SIZE, UNDER, UNDER, 9)}FROSTLINE</text>
${icicles}
${text(CY + LINE_Y.subtitle, SUBTITLE_SIZE, 'url(#s)', OUTLINE, 7)}FROSTLINE</text>
${text(CY + LINE_Y.subtitle - BEVEL * 0.55, SUBTITLE_SIZE, '#ffffff', null, 0, 0.38)}FROSTLINE</text>
${sparkles}
</svg>`;

for (const [name, bg] of [
	['cold', '#131c26'],
	['warm', '#3a2a14'],
]) {
	const r = new Resvg(svg(bg), {
		font: { fontFiles: [FONT], defaultFontFamily: 'Titan One', loadSystemFonts: false },
		fitTo: { mode: 'width', value: W * 1.6 },
	});
	fs.writeFileSync(path.join(DESIGN, `title_${name}.png`), r.render().asPng());
	console.log('rendered', `title_${name}.png`);
}

// The number that decides the lockup: portrait is the narrowest layout at 800px
// (PORTRAIT_MAIN_SIZES in src/game/constants.ts).
console.log(
	`GO BANANAS @${TITLE_SIZE} = ${Math.round(NAME_W)}px | FROSTLINE @${SUBTITLE_SIZE} = ${Math.round(SUB_W)}px | portrait budget 800px`,
);
if (Math.max(NAME_W, SUB_W) > 800 - 40) {
	console.log('  !! the lockup does not clear the portrait layout with a sane margin');
	process.exit(1);
}
