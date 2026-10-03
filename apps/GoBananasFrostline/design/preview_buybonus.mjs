// Render the Buy Bonus button the way the bet bar actually shows it, so the plate
// is judged at its real size with its real caption rather than as a 640px PNG.
//
//   node design/preview_buybonus.mjs <toolsDir> [out.png]
//
// Four frames side by side on the platform bar's #2a2a2a with its ICE_EDGE
// casing line: idle, hover, then PLAY BONUS in social play
// and DISABLE while a bought mode is active. DISABLE is one seven-letter word
// that does not wrap, so it is the widest thing the hub ever has to hold.
//
// The numbers are ButtonBuyBonus's, copied rather than imported for the same
// reason generate_ui_plates.mjs copies them: a node script has no business
// loading a Svelte package to read four constants.
//   plate      150 units * buyBonusButtonScale 0.88 = 132px
//   caption    UI_BASE_FONT_SIZE 45 * buyBonusLabelSizeRatio * 0.88, two lines
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node design/preview_buybonus.mjs <toolsDir> [out.png]');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI = path.join(APP, 'static/assets/sprites/goBananasUi');
const out = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : path.join(os.tmpdir(), 'frostline-buybonus-preview.png');

const PLATE = 132;
const LABEL_RATIO = 0.5; // keep equal to buyBonusLabelSizeRatio in uiTheme.ts
const FONT = 45 * LABEL_RATIO * 0.88;
const CELL = 185;
const W = CELL * 4;
const H = CELL;

// --plate=<png> --lit=<png> --ink=<#hex> preview a candidate that is not wired
// in yet (generate_ui_plates.mjs --variants writes them), with the caption
// colour it would need.
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const b64 = (f) => fs.readFileSync(path.isAbsolute(f) ? f : path.join(UI, f)).toString('base64');
const plate = b64(arg('plate') ?? 'buybonus_ice.png');
const lit = b64(arg('lit') ?? 'buybonus_ice_lit.png');
const INK = arg('ink') ?? '#ffeaa6';

const frame = (i, spinDeg, hover, lines = ['BUY', 'BONUS'], note = hover ? 'hover' : 'idle') => {
	const cx = CELL * i + CELL / 2;
	const cy = H / 2;
	const x = cx - PLATE / 2;
	const y = cy - PLATE / 2;
	return `
	<image href="data:image/png;base64,${plate}" x="${x}" y="${y}" width="${PLATE}" height="${PLATE}"/>
	${!hover ? `<image href="data:image/png;base64,${lit}" x="${x}" y="${y}" width="${PLATE}" height="${PLATE}" opacity="0.18" style="mix-blend-mode:plus-lighter"/>` : ''}
	${
		hover
			? `<image href="data:image/png;base64,${lit}" x="${x}" y="${y}" width="${PLATE}" height="${PLATE}"
		   transform="rotate(${spinDeg} ${cx} ${cy})" style="mix-blend-mode:plus-lighter"/>`
			: ''
	}
	${caption(cx, cy, lines)}
	<text x="${cx}" y="${H - 8}" font-size="11" fill="#bfbfbf" text-anchor="middle" font-family="Titan One">${note}</text>`;
};

// One or two lines, centred as a block the way the shared button centres them.
const caption = (cx, cy, lines) => {
	const lh = 45 * (LABEL_RATIO + 0.04) * 0.88;
	const top = cy - (lh * lines.length) / 2;
	return lines
		.map(
			(t, k) =>
				`<text x="${cx}" y="${(top + lh * (k + 0.78)).toFixed(1)}" font-size="${FONT}" fill="${INK}" text-anchor="middle" font-family="Titan One">${t}</text>`,
		)
		.join('');
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="4" fill="#2a2a2a" stroke="#5fa8d8" stroke-width="1"/>
${frame(0, 0, false)}
${frame(1, 0, true)}
${frame(2, 0, false, ['PLAY', 'BONUS'], 'social')}
${frame(3, 0, false, ['DISABLE'], 'active')}
</svg>`;

const r = new Resvg(svg, {
	fitTo: { mode: 'width', value: W * 2 },
	font: {
		fontFiles: [path.join(APP, 'static/fonts/TitanOne.ttf')],
		defaultFontFamily: 'Titan One',
		loadSystemFonts: false,
	},
});
fs.writeFileSync(out, r.render().asPng());
console.log('preview written to', out, '(2x)');
