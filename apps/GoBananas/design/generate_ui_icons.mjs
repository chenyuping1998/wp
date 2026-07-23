// Bet-bar button icons for GoBananas.
//
// The shared UiButton renders its icons as text/emoji glyphs (≡ ⚙ 🔊 🔇 ▤ …).
// Emoji glyphs render as the viewer's system emoji — different on every OS, and
// they ignore canvas fill so they cannot be themed — which is exactly the kind
// of thing a certification pass flags as a "poor bet UI bar". These replace them
// with proper drawn icons: brass metallic fill, dark outline, a top highlight
// and a soft drop shadow, matched to the reel housing so the bar reads as one
// piece of kit.
//
// Usage: node design/generate_ui_icons.mjs <dir with node_modules/@resvg/resvg-js>
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

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUiIcons');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 256;

// shared brass look + depth, applied to every icon shape
const DEFS = `
	<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#fff3bd"/>
		<stop offset="0.45" stop-color="#ffd75e"/>
		<stop offset="0.75" stop-color="#e0a838"/>
		<stop offset="1" stop-color="#a5711c"/>
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
		<g stroke="#3a2508" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" fill="#3a2508">${shape}</g>
		<g fill="url(#brass)" stroke="#7a5214" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${shape}</g>
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
		return `${d}<circle cx="128" cy="128" r="66"/><circle cx="128" cy="128" r="30" fill="#3a2508" stroke="none"/>`;
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

	// lightning bolt
	turbo: `<path d="M 150 40 L 78 140 L 118 140 L 100 216 L 178 108 L 134 108 Z"/>`,
};

for (const [name, shape] of Object.entries(shapes)) {
	const svg = icon(shape);
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, `${name}.png`), resvg.render().asPng());
	console.log('rendered', name);
}
console.log('done →', OUT);
