// Placeholder art for Soul Seal.
//
// These exist so the game boots and the collect mechanic can be developed
// before any real art is made. They are deliberately ugly: flat fills, hazard
// stripes and a visible label on every asset. That is the point — a placeholder
// that looks finished is a placeholder that ships by accident.
//
// The palette is the real one from design/art-bible.md, so the composition
// reads roughly correctly (dark environment, symbols popping off a dimmed
// mid-layer, money in yellow/cinnabar). Nothing else here is final.
//
// Usage: node design/generate_placeholders.mjs <dir with node_modules for @resvg/resvg-js>
//   DUMP_SVG=1 writes the raw SVG next to each PNG.
//
// resvg note: keep filter regions within about ±200% or it panics rather than
// clipping. Nothing here uses filters, so this is only a warning for whoever
// replaces this file with the real generators.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/generate_placeholders.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = path.join(appRoot, 'static/assets/sprites');

// ── palette (design/art-bible.md §2) ────────────────────────────────────────
const P = {
	nightDeep: '#0B1420',
	nightMist: '#16283A',
	jadeWall: '#1E3A3C',
	jadeLit: '#2E5654',
	spiritCyan: '#4FD1C5',
	woodDark: '#3A2418',
	woodMid: '#6B4226',
	brass: '#A8763E',
	brassHi: '#D9A85C',
	candle: '#FFCB6B',
	talisman: '#F2D544',
	cinnabar: '#C8102E',
	cinnabarHi: '#FF3B4E',
};

const render = (svg, rel, width) => {
	const out = path.join(SPRITES, rel);
	fs.mkdirSync(path.dirname(out), { recursive: true });
	if (process.env.DUMP_SVG) fs.writeFileSync(out.replace(/\.png$/, '.svg'), svg);
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } });
	fs.writeFileSync(out, resvg.render().asPng());
	count += 1;
};
let count = 0;

/** Diagonal hazard stripes. Every placeholder carries these so none of them can
 *  be mistaken for finished art at a glance. */
const stripes = (id, colour, opacity = 0.16) => `
<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect width="12" height="24" fill="${colour}" opacity="${opacity}"/>
</pattern>`;

const label = (text, x, y, size, fill = '#FFFFFF') =>
	`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="bold"
	 text-anchor="middle" dominant-baseline="central" fill="${fill}"
	 stroke="#000000" stroke-width="${Math.max(1, size * 0.06)}" paint-order="stroke">${text}</text>`;

const svg = (w, h, body) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

// ═══════════════════════════════════════════════════════════════════════════
// Symbols — 200×200, 12px safe margin (art-bible §5.5)
// ═══════════════════════════════════════════════════════════════════════════

/** One symbol tile. `tone` fills the body, `text` names it, `badge` is the
 *  optional container that marks a special symbol's higher class. */
const symbol = (file, tone, text, opts = {}) => {
	const { badge = null, badgeTone = P.talisman, badgeText = '', sub = '' } = opts;
	const body = `
<defs>${stripes('hz', '#000000', 0.22)}</defs>
<rect x="12" y="12" width="176" height="176" rx="18" fill="${tone}"/>
<rect x="12" y="12" width="176" height="176" rx="18" fill="url(#hz)"/>
<rect x="12" y="12" width="176" height="176" rx="18" fill="none" stroke="#1A1008" stroke-width="8"/>
<rect x="18" y="18" width="164" height="164" rx="14" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.25"/>
${label(text, 100, sub ? 88 : 100, sub ? 46 : 54)}
${sub ? label(sub, 100, 132, 22, '#FFFFFF') : ''}
${
	badge
		? `<rect x="34" y="140" width="132" height="38" rx="6" fill="${badgeTone}" stroke="#1A1008" stroke-width="4"/>
		   ${label(badgeText, 100, 159, 22, P.cinnabar)}`
		: ''
}
<text x="100" y="192" font-family="Arial, sans-serif" font-size="11" text-anchor="middle"
 fill="#FFFFFF" opacity="0.65">PLACEHOLDER</text>`;
	render(svg(200, 200, body), `soulSealSymbols/${file}.png`, 200);
};

// Symbols.
//
// SUPPLIED ART WINS. design/import_symbols.mjs writes w, h1-h4 and l1-l4 from
// design/source/symbols, and this script must never write over them - a
// placeholder overwriting real art is silent and only shows up as "the art I
// added disappeared". So the supplied set is listed here and skipped.
//
// No CJK glyphs anywhere: the game does not use Chinese characters, and a
// placeholder that does teaches the wrong thing about what the final art is.
// The labels are the symbol's own code, which is what a placeholder is for.
const SUPPLIED = new Set([
	'w', 'h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 'm', 's',
]);

const skipped = [];
const place = (file, ...args) => {
	if (SUPPLIED.has(file)) {
		skipped.push(file);
		return;
	}
	symbol(file, ...args);
};

// Low pay. The supplied set is A K Q J; L5 completes the ladder as 10, which is
// the conventional fifth royal and the one still missing.
place('l1', '#8A6D3B', 'A', { sub: 'L1' });
place('l2', '#4A6B3A', 'K', { sub: 'L2' });
place('l3', '#2E4A6B', 'Q', { sub: 'L3' });
place('l4', '#6B3028', 'J', { sub: 'L4' });
place('l5', '#5A4A38', '10', { sub: 'L5' });

// Mid pay.
place('h1', '#B0654A', 'H1', { sub: '10x' });
place('h2', '#3E7C6B', 'H2', { sub: '4x' });
place('h3', '#9C9078', 'H3', { sub: '4x' });
place('h4', '#6B5A47', 'H4', { sub: '2x' });

// Special — these get a container, which is what marks their class (art-bible §5.1).
place('m', P.jadeLit, 'M', { sub: 'CARRIER', badge: true, badgeTone: P.talisman, badgeText: '0.5x' });
place('s', P.cinnabar, 'S', { sub: 'SCATTER' });
place('w', '#7A3A8A', 'W', { sub: 'WILD' });

// ═══════════════════════════════════════════════════════════════════════════
// Backgrounds — three depth layers flattened (art-bible §3)
// ═══════════════════════════════════════════════════════════════════════════

const background = (file, sky, mist, note) => {
	const body = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${sky}"/><stop offset="100%" stop-color="${mist}"/>
  </linearGradient>
  <radialGradient id="candle" cx="0.45" cy="0.95" r="0.7">
    <stop offset="0%" stop-color="${P.candle}" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="${P.candle}" stop-opacity="0"/>
  </radialGradient>
  ${stripes('hzbg', '#FFFFFF', 0.05)}
</defs>
<rect width="1920" height="1080" fill="url(#sky)"/>
<!-- far: mountain silhouettes, desaturated and low contrast -->
<path d="M0 620 L280 470 L520 600 L760 430 L1020 610 L1300 450 L1600 590 L1920 480 L1920 1080 L0 1080Z"
      fill="${P.nightDeep}" opacity="0.75"/>
<!-- near: altar table edge, the darkest and highest-detail layer -->
<rect y="880" width="1920" height="200" fill="${P.woodDark}"/>
<rect y="880" width="1920" height="14" fill="${P.woodMid}" opacity="0.7"/>
<rect width="1920" height="1080" fill="url(#candle)"/>
<rect width="1920" height="1080" fill="url(#hzbg)"/>
${label(note, 960, 200, 64)}
${label('PLACEHOLDER — see design/art-bible.md §3', 960, 270, 28, '#FFFFFF')}`;
	render(svg(1920, 1080, body), `soulSealBackground/${file}.png`, 1920);
};

background('bg_base', P.nightDeep, P.nightMist, 'BASE — night, mist, candlelit altar');
background('bg_feature', '#0A1A22', '#12303A', 'FEATURE — mist clears, candle turns cyan');

// ═══════════════════════════════════════════════════════════════════════════
// Frame — the altar (art-bible §4). Flat rectangles standing in for the
// peachwood posts, banners and table.
// ═══════════════════════════════════════════════════════════════════════════

render(
	svg(
		1200,
		760,
		`<defs>${stripes('hzf', '#FFFFFF', 0.05)}</defs>
		 <rect width="1200" height="760" rx="12" fill="${P.jadeWall}"/>
		 <rect width="1200" height="760" rx="12" fill="url(#hzf)"/>
		 ${label('FRAME BG — brick wall behind the reels', 600, 380, 34)}`,
	),
	'soulSealFrame/frame_bg.png',
	1200,
);

render(
	svg(
		1200,
		760,
		`<rect x="6" y="6" width="1188" height="748" rx="12" fill="none" stroke="${P.woodMid}" stroke-width="28"/>
		 <rect x="6" y="6" width="1188" height="748" rx="12" fill="none" stroke="${P.brass}" stroke-width="6"/>
		 <rect x="40" y="10" width="1120" height="52" rx="8" fill="${P.woodDark}"/>
		 ${label('TALISMAN RAIL — 12 slots, milestones at 5 / 9 / 12', 600, 36, 22, P.talisman)}
		 ${label('FRAME EDGE — peachwood posts + banners', 600, 730, 24)}`,
	),
	'soulSealFrame/frame_edge.png',
	1200,
);

render(
	svg(
		420,
		200,
		`<rect x="8" y="8" width="404" height="184" rx="14" fill="${P.woodDark}" stroke="${P.brass}" stroke-width="6"/>
		 ${label('FS SIGN', 210, 80, 42, P.talisman)}${label('PLACEHOLDER', 210, 140, 20)}`,
	),
	420,
);

render(
	svg(
		320,
		140,
		`<rect x="6" y="6" width="308" height="128" rx="12" fill="${P.nightDeep}" stroke="${P.brass}" stroke-width="5"/>
		 ${label('FS COUNTER', 160, 56, 30, P.talisman)}${label('PLACEHOLDER', 160, 100, 18)}`,
	),
	'soulSealFrame/fs_counter_panel.png',
	320,
);

// ═══════════════════════════════════════════════════════════════════════════
// FX textures — soft falloff, drawn additively at runtime.
//
// NOTE for whoever writes the real ones: additive blending inside a mask or a
// filtered container draws nothing (Pixi v8 renders those into an isolated
// transparent target). Bake any confinement into the texture's alpha instead.
// ═══════════════════════════════════════════════════════════════════════════

const falloff = (file, w, h, inner) =>
	render(
		svg(
			w,
			h,
			`<defs><radialGradient id="g"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
			 <stop offset="${inner}%" stop-color="#FFFFFF" stop-opacity="0.5"/>
			 <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>
			 <rect width="${w}" height="${h}" fill="url(#g)"/>`,
		),
		`soulSealFx/${file}.png`,
		w,
	);

falloff('fx_glow.png'.replace('.png', ''), 256, 256, 45);
falloff('fx_star', 256, 256, 12);
falloff('fx_tick', 64, 64, 30);
falloff('fx_streak', 256, 64, 25);

render(
	svg(
		1920,
		1080,
		`<defs><radialGradient id="v" cx="0.5" cy="0.5" r="0.75">
		 <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
		 <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/></radialGradient></defs>
		 <rect width="1920" height="1080" fill="url(#v)"/>`,
	),
	'soulSealFx/fx_vignette.png',
	1920,
);

// ═══════════════════════════════════════════════════════════════════════════
// UI — the one part of the screen that deliberately does not blend into the
// scene (art-bible §8).
// ═══════════════════════════════════════════════════════════════════════════

render(
	svg(
		480,
		96,
		`<rect x="4" y="4" width="472" height="88" rx="10" fill="${P.nightDeep}" opacity="0.9"
		  stroke="${P.brass}" stroke-width="4"/>${label('TICKER PLATE', 240, 48, 26)}`,
	),
	'soulSealUi/ticker_plate.png',
	480,
);

render(
	svg(
		200,
		200,
		`<circle cx="100" cy="100" r="92" fill="${P.brassHi}" stroke="#1A1008" stroke-width="8"/>
		 <rect x="82" y="82" width="36" height="36" fill="${P.nightDeep}"/>
		 ${label('BUY', 100, 60, 26, P.nightDeep)}${label('PLACEHOLDER', 100, 156, 14, P.nightDeep)}`,
	),
	'soulSealUi/buybonus_plate.png',
	200,
);

render(
	svg(
		720,
		240,
		`<rect x="6" y="6" width="708" height="228" rx="14" fill="${P.cinnabar}" stroke="#1A1008" stroke-width="8"/>
		 ${label('SOUL SEAL', 360, 100, 64, P.talisman)}${label('placeholder wordmark', 360, 180, 24)}`,
	),
	'soulSealUi/wordmark.png',
	720,
);

// Icons. Simple glyphs drawn as shapes — never emoji, which render as the
// viewer's system font and ignore canvas fill (review-log, round 1).
const icon = (file, draw) =>
	render(
		svg(
			64,
			64,
			`<rect width="64" height="64" rx="10" fill="${P.nightMist}" stroke="${P.brass}" stroke-width="3"/>${draw}`,
		),
		`soulSealUiIcons/${file}.png`,
		64,
	);

const bar = (y) => `<rect x="16" y="${y}" width="32" height="4" rx="2" fill="#FFFFFF"/>`;
icon('menu', bar(22) + bar(30) + bar(38));
icon('menuExit', `<path d="M20 20 L44 44 M44 20 L20 44" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>`);
icon('info', label('i', 32, 32, 34));
icon('payTable', bar(20) + bar(30) + bar(40) + `<rect x="16" y="16" width="32" height="32" rx="3" fill="none" stroke="#FFFFFF" stroke-width="2"/>`);
icon('settings', `<circle cx="32" cy="32" r="11" fill="none" stroke="#FFFFFF" stroke-width="5"/>`);
icon('autoSpin', `<circle cx="32" cy="32" r="13" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="52 14"/>`);
icon('replay', `<circle cx="32" cy="32" r="13" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="60 22"/><path d="M42 18 L46 30 L34 28Z" fill="#FFFFFF"/>`);
icon('soundOn', `<path d="M20 26 h8 l10 -8 v28 l-10 -8 h-8Z" fill="#FFFFFF"/><path d="M44 24 q6 8 0 16" stroke="#FFFFFF" stroke-width="4" fill="none"/>`);
icon('soundOff', `<path d="M20 26 h8 l10 -8 v28 l-10 -8 h-8Z" fill="#FFFFFF"/><path d="M42 26 L54 38 M54 26 L42 38" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`);

// Win banners, five tiers. Real ones need their text wells measured — see
// design/measure_banner_wells.mjs.
['tier1', 'tier2', 'tier3', 'tier4', 'tier5'].forEach((t, i) => {
	const heat = [P.brass, P.brassHi, P.talisman, P.cinnabarHi, P.cinnabar][i];
	render(
		svg(
			900,
			320,
			`<rect x="8" y="8" width="884" height="304" rx="20" fill="${P.nightDeep}" stroke="${heat}" stroke-width="10"/>
			 ${label(`WIN BANNER ${t.toUpperCase()}`, 450, 120, 44, heat)}
			 ${label('PLACEHOLDER', 450, 200, 24)}`,
		),
		`soulSealWinBanners/${t}.png`,
		900,
	);
});

console.log(`rendered ${count} placeholder sprites into static/assets/sprites/`);
if (skipped.length) {
	console.log(`kept supplied art for: ${skipped.join(', ')}`);
}
