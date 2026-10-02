// Bet-bar button icons for GoBananas.
//
// The shared UiButton renders its icons as text/emoji glyphs (≡ ⚙ 🔊 🔇 ▤ …).
// Emoji glyphs render as the viewer's system emoji — different on every OS, and
// they ignore canvas fill so they cannot be themed — which is exactly the kind
// of thing a certification pass flags as a "poor bet UI bar". These replace them
// with proper drawn icons.
//
// TWO SETS ARE WRITTEN, from one set of shapes:
//
//   goBananasUiIcons      brass metallic fill, dark outline, top highlight and a
//                         soft drop shadow, matched to the reel housing so the
//                         bar reads as one piece of kit. This is the 'bananaut'
//                         skin's set and what the rules panel's Controls guide
//                         illustrates itself with.
//   goBananasUiIconsMono  flat white with a thin dark contour, for the platform
//                         skin's grey strip and dark discs.
//
// THE MONO SET EXISTS BECAUSE UiButton DOES NOT TINT SPRITE ICONS. It draws
// uiTheme.icons entries as a plain Sprite with no tint (see
// components-ui-pixi/src/components/UiButton.svelte), so uiTheme.buttonIconFill
// reaches only the vector-drawn turbo bolt. Pointing the platform skin at a
// white PNG is the only way its icons stop being gold.
//
// The contour is kept in the mono set rather than dropped. On the dark disc a
// bare white shape would be fine, but a toggle that is ON draws its disc in the
// platform green (0x4ace4a) and white on green needs the separation.
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

import { surfaceDefs } from './surface.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIZE = 256;

// ── palettes ────────────────────────────────────────────────────────────────
//
// `contour` is both the underlay colour and the colour of any punched hole (the
// cog's hub), so a set only has to name it once.
//
// `underlay` is the width of the dark contour, and it is a SHAPE control rather
// than a colour one: it is a stroke around a filled shape, so it fattens every
// mark by half its width on all sides. The brass set's 26 is what makes those
// icons look heavy — a 30-unit bar renders 56 wide. The mono set halves it,
// which is most of what makes the same shapes read as lighter.
const PALETTES = {
	brass: {
		dir: 'goBananasUiIcons',
		contour: '#3a2508',
		underlay: 26,
		body: 'url(#brass)',
		bodyStroke: '#7a5214',
		bodyStrokeWidth: 6,
		emboss: true,
		sheen: true,
		shadow: true,
	},
	mono: {
		dir: 'goBananasUiIconsMono',
		contour: '#0f0f0f',
		underlay: 12,
		body: '#ffffff',
		bodyStroke: '#ffffff',
		bodyStrokeWidth: 0,
		// No emboss, no sheen, no drop shadow. The platform strip is flat casing;
		// a bevelled, lit, shadowed glyph on it reads as a control borrowed from a
		// different bar — which is exactly what the brass set looks like there now.
		emboss: false,
		sheen: false,
		shadow: false,
	},
};

// shared brass look + depth, applied to every icon shape
const DEFS = surfaceDefs('sf') + `
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

// wrap: dark contour underlay for weight, the body fill on top, a soft top
// sheen. `shape` is drawn up to 3x — a dark stroke (contour), the body, then the
// same body clipped to a top-half sheen, which gives a cheap bevel.
const icon = (shape, palette) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
	<defs>${DEFS}</defs>
	<g${palette.shadow ? ' filter="url(#drop)"' : ''}>
		<g stroke="${palette.contour}" stroke-width="${palette.underlay}" stroke-linejoin="round" stroke-linecap="round" fill="${palette.contour}">${shape}</g>
		<g fill="${palette.body}" stroke="${palette.bodyStroke}" stroke-width="${palette.bodyStrokeWidth}" stroke-linejoin="round" stroke-linecap="round"${palette.emboss ? ' filter="url(#sfEmboss)"' : ''}>${shape}</g>
		${palette.sheen ? `<g fill="url(#sheen)" opacity="0.55">${shape}</g>` : ''}
	</g>
</svg>`;

// ── icon shapes (256 viewBox, ~34px padding) ─────────────────────────────────
//
// A shape is a function of the palette wherever it has to punch a hole, since a
// hole is drawn in the contour colour. Everything else ignores the argument.
//
// THE MENU BARS ARE 14 UNITS, not 30. At 30 with the brass set's 26-unit contour
// each bar rendered 56 units of a 256 box — three of those is more than two
// thirds of the icon in ink, which is why it read as a solid block rather than
// as stripes. 14 with the pitch opened to 48 gives 26 units of bar against 22 of
// gap in the mono set, near enough 1:1, and the brass set is lighter too.
//
// It is deliberately changed in BOTH sets. The two skins should not disagree
// about what the menu button looks like, and the rules panel's Controls guide
// illustrates itself from the brass files.
const bar = (y) => `<rect x="46" y="${y}" width="164" height="14" rx="7"/>`;
const shapes = {
	// three stacked bars
	menu: `${bar(66)}${bar(114)}${bar(162)}`,

	// X
	//
	// The stroke-width is EXPLICIT, and it has to be. Every other shape here
	// either has a fill or names its own width; this one was a bare stroked path
	// relying on whatever the wrapping group set — which was 6 in the brass set
	// and, in the mono set, 0. It rendered as nothing but its dark contour: an
	// invisible close button on the platform skin.
	menuExit: `<path d="M 74 74 L 182 182 M 182 74 L 74 182" stroke-width="26"/>`,

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
		return (p) =>
			`${d}<circle cx="128" cy="128" r="66"/>` +
			`<circle cx="128" cy="128" r="30" fill="${p.contour}" stroke="none"/>`;
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

for (const palette of Object.values(PALETTES)) {
	const out = path.join(appRoot, 'static/assets/sprites', palette.dir);
	fs.mkdirSync(out, { recursive: true });
	for (const [name, shape] of Object.entries(shapes)) {
		const svg = icon(typeof shape === 'function' ? shape(palette) : shape, palette);
		const resvg = new Resvg(svg, {
			fitTo: { mode: 'width', value: SIZE },
			font: { loadSystemFonts: false },
		});
		fs.writeFileSync(path.join(out, `${name}.png`), resvg.render().asPng());
	}
	console.log('rendered', Object.keys(shapes).length, 'icons →', palette.dir);
}
