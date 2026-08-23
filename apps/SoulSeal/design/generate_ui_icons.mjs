// Soul Seal bet-bar icons.
//
// Adapted from GoBananas, which is the same generator at a different palette.
// The shapes are that game's - they are plain UI iconography (a cog, a speaker,
// a hamburger) and redrawing them would produce the same shapes less well.
//
// What changed is the colour. GoBananas is a jungle game: warm brass on olive.
// Soul Seal is a night shrine, so the metal is the altar's brass over the wall's
// jade rather than over green, and the deepest shadow is the night blue the rest
// of the game sits in. Palette tokens are art-bible.md section 2.
//
// Usage: node design/generate_ui_icons.mjs <dir with node_modules for @resvg/resvg-js>

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_ui_icons.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

import { surfaceDefs } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/soulSealUiIcons');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 256;

// shared brass look + depth, applied to every icon shape
const DEFS = surfaceDefs('sf') + `
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#FFF0C4"/>
		<stop offset="0.45" stop-color="#D9A85C"/>
		<stop offset="0.75" stop-color="#A8763E"/>
		<stop offset="1" stop-color="#6B4226"/>
	</linearGradient>
	<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
		<stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
	</linearGradient>
	<filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
		<feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000000" flood-opacity="0.55"/>
	</filter>`;

// wrap: dark outline underlay for weight, brass fill on top, a soft top sheen.
// `shape` is drawn 3x — a fat dark stroke (outline), the brass body, then the
// same body clipped to a top-half sheen — which gives a cheap bevel.
const icon = (shape, { sheen = true } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
	<defs>${DEFS}</defs>
	<g filter="url(#drop)">
		<g stroke="#12202B" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" fill="#12202B">${shape}</g>
		<g fill="url(#brass)" stroke="#5A3A1E" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" filter="url(#sfEmboss)">${shape}</g>
		${sheen ? `<g fill="url(#sheen)" opacity="0.55">${shape}</g>` : ''}
	</g>
</svg>`;

// ── icon shapes (256 viewBox, ~34px padding) ─────────────────────────────────
const bar = (y) => `<rect x="46" y="${y}" width="164" height="30" rx="15"/>`;
const shapes = {
	// three stacked bars
	menu: `${bar(70)}${bar(113)}${bar(156)}`,

	// X
	menuExit: `<path d="M 74 74 L 182 182 M 182 74 L 74 182"/>`,

	// cog: a gear ring with eight teeth and a hub
	settings: (() => {
		const cx = 128,
			cy = 128,
			teeth = 8;
		let d = '';
		for (let i = 0; i < teeth; i++) {
			const a = (i / teeth) * Math.PI * 2;
			const tx = cx + Math.cos(a) * 96,
				ty = cy + Math.sin(a) * 96;
			d += `<rect x="${(tx - 20).toFixed(1)}" y="${(ty - 20).toFixed(1)}" width="40" height="40" rx="8" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})"/>`;
		}
		return `${d}<circle cx="128" cy="128" r="66"/><circle cx="128" cy="128" r="30" fill="#12202B" stroke="none"/>`;
	})(),

	// lowercase i in a ring
	info: `<circle cx="128" cy="128" r="86" fill="none" stroke-width="24"/><circle cx="128" cy="86" r="15"/><rect x="113" y="112" width="30" height="72" rx="14"/>`,

	// pay-table: a document with three lines and a coin
	payTable: `<rect x="54" y="46" width="148" height="164" rx="18" fill="none" stroke-width="20"/><rect x="82" y="84" width="92" height="16" rx="8"/><rect x="82" y="120" width="92" height="16" rx="8"/><rect x="82" y="156" width="60" height="16" rx="8"/><circle cx="164" cy="164" r="22"/>`,

	// speaker + two waves
	soundOn: `<path d="M 58 100 L 96 100 L 140 62 L 140 194 L 96 156 L 58 156 Z"/><path d="M 164 96 A 44 44 0 0 1 164 160" fill="none" stroke-width="22"/><path d="M 186 74 A 76 76 0 0 1 186 182" fill="none" stroke-width="22"/>`,

	// speaker + X
	soundOff: `<path d="M 58 100 L 96 100 L 140 62 L 140 194 L 96 156 L 58 156 Z"/><path d="M 168 106 L 210 148 M 210 106 L 168 148" stroke-width="22"/>`,

	// circular arrow with a play triangle (autoplay)
	autoSpin: `<path d="M 196 128 A 68 68 0 1 1 158 66" fill="none" stroke-width="26"/><path d="M 150 42 L 196 66 L 150 92 Z"/><path d="M 108 100 L 152 128 L 108 156 Z"/>`,

	// replay: autoSpin's arc mirrored (so it reads anticlockwise, "go back") and
	// without the play triangle — the triangle is what makes autoSpin mean "keep
	// going", and these two sit close enough together that they must not be
	// mistaken for each other.
	replay: `<path d="M 60 128 A 68 68 0 1 0 98 66" fill="none" stroke-width="26"/><path d="M 106 42 L 60 66 L 106 92 Z"/>`,

	// ── icons below exist only for the Controls guide in the rules panel ──────
	// The bet bar draws these as vectors inside UiButton rather than from a
	// sprite (turbo has to switch between hollow and filled, the steppers are
	// glyphs), so there was no asset to illustrate them with. These match those
	// shapes in the same brass language as the rest of the set.

	// two chasing arrows — the spin button's rotating mark
	spin: `<path d="M 206 128 A 78 78 0 0 1 128 206" fill="none" stroke-width="28"/><path d="M 50 128 A 78 78 0 0 1 128 50" fill="none" stroke-width="28"/><path d="M 104 26 L 152 50 L 104 74 Z"/><path d="M 152 230 L 104 206 L 152 182 Z"/>`,

	// lightning bolt (turbo)
	turbo: `<path d="M 150 26 L 74 140 L 118 140 L 106 230 L 182 116 L 138 116 Z"/>`,

	// plus / minus, drawn inside a ring so they read as the round stepper keys
	increase: `<circle cx="128" cy="128" r="86" fill="none" stroke-width="22"/><rect x="112" y="76" width="32" height="104" rx="16"/><rect x="76" y="112" width="104" height="32" rx="16"/>`,

	decrease: `<circle cx="128" cy="128" r="86" fill="none" stroke-width="22"/><rect x="76" y="112" width="104" height="32" rx="16"/>`,


};

for (const [name, shape] of Object.entries(shapes)) {
	const svg = icon(shape);
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, `${name}.png`), resvg.render().asPng());
	console.log('rendered', name);
}
console.log('done →', OUT);
