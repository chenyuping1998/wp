// Mockup of the three-panel feature intro shown once loading hits 100%.
//
// This is a DESIGN MOCKUP, not the shipping screen. It renders at the real
// canvas size in the real palette so the layout and the copy can be judged
// before any of it is built in Svelte — the panels in the game would be drawn
// with pixi Graphics and Text, not as a flat PNG.
//
// Usage: node design/preview_intro_panels.mjs <dir with node_modules/@resvg/resvg-js> [variant]
//   variant: a (default) | b | c
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/preview_intro_panels.mjs <dir with node_modules/@resvg/resvg-js> [a|b|c]');
	process.exit(1);
}
const variant = (process.argv[3] || 'a').toLowerCase();
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(appRoot, 'static/fonts');
const SPRITES = path.join(appRoot, 'static/assets/sprites');
const OUT = path.join(appRoot, `design/preview/intro_panels_${variant}.png`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const FONT = 'Titan One';
const BODY = 'Trebuchet MS';
const BULL = '#4bd67f';
const BEAR = '#ff5566';
const AMBER = '#f7a83a';
const TEAL = '#3fd0d4';
const PANEL_HI = '#1b2721';
const PANEL_LO = '#080f0c';
const INK = '#050908';

const W = 1280;
const H = 720;

const dataUri = (rel) =>
	`data:image/png;base64,${fs.readFileSync(path.join(SPRITES, rel)).toString('base64')}`;

const bg = fs
	.readFileSync(path.join(SPRITES, 'marginCallBackground/bg_base.png'))
	.toString('base64');
const wordmark = fs
	.readFileSync(path.join(SPRITES, 'marginCallUi/wordmark.png'))
	.toString('base64');

const chamfer = (x, y, w, h, c) =>
	`M ${x + c} ${y} L ${x + w - c} ${y} L ${x + w} ${y + c} L ${x + w} ${y + h - c} ` +
	`L ${x + w - c} ${y + h} L ${x + c} ${y + h} L ${x} ${y + h - c} L ${x} ${y + c} Z`;

/** Word-wrap body copy by character budget; resvg has no automatic wrapping. */
const wrap = (text, perLine) => {
	const words = text.split(' ');
	const lines = [];
	let line = '';
	for (const word of words) {
		if ((line + ' ' + word).trim().length > perLine && line) {
			lines.push(line.trim());
			line = word;
		} else line = (line + ' ' + word).trim();
	}
	if (line) lines.push(line);
	return lines;
};

// ─── illustrations ──────────────────────────────────────────────────────────
// Each is drawn into a 300x170 box at the top of its panel.

/** 5x3 board growing to 5x5: the bottom three rows solid, two more opening above. */
const artExpand = () => {
	const cell = 30;
	const gap = 4;
	const cols = 5;
	const x0 = 150 - (cols * (cell + gap) - gap) / 2;
	const y0 = 26;
	let out = '';
	for (let r = 0; r < 5; r++) {
		for (let c = 0; c < cols; c++) {
			const x = x0 + c * (cell + gap);
			const y = y0 + r * (cell + gap);
			const opening = r < 2; // the two new rows
			out +=
				`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="4" ` +
				`fill="${opening ? 'none' : BULL}" fill-opacity="${opening ? 0 : 0.22}" ` +
				`stroke="${opening ? TEAL : BULL}" stroke-width="2" ` +
				`stroke-opacity="${opening ? 0.95 : 0.55}" ${opening ? 'stroke-dasharray="5 4"' : ''}/>`;
		}
	}
	// growth arrows pointing up through the new rows
	for (let c = 0; c < cols; c++) {
		const x = x0 + c * (cell + gap) + cell / 2;
		out +=
			`<path d="M ${x} ${y0 + 62} L ${x} ${y0 + 14} M ${x - 7} ${y0 + 24} L ${x} ${y0 + 12} L ${x + 7} ${y0 + 24}" ` +
			`fill="none" stroke="${TEAL}" stroke-width="3" stroke-linecap="round" opacity="0.9"/>`;
	}
	return out;
};

/** The LEVERAGE wild feeding a meter that only climbs. */
const artLeverage = () => {
	let out = `<image href="${dataUri('marginCallSymbols/w.png')}" x="34" y="14" width="96" height="96"/>`;
	// value chips flying into the meter
	const chips = [
		['+2', 162, 14],
		['+5', 162, 50],
		['+10', 162, 86],
	];
	for (const [label, x, y] of chips) {
		out +=
			`<rect x="${x}" y="${y}" width="46" height="26" rx="13" fill="${AMBER}" fill-opacity="0.16" stroke="${AMBER}" stroke-width="2"/>` +
			`<text x="${x + 23}" y="${y + 19}" font-family="${FONT}" font-size="15" fill="${AMBER}" text-anchor="middle">${label}</text>`;
	}
	// the meter itself
	out += `<rect x="34" y="126" width="232" height="18" rx="9" fill="${INK}" stroke="${BULL}" stroke-width="2" stroke-opacity="0.5"/>`;
	out += `<rect x="37" y="129" width="170" height="12" rx="6" fill="${BULL}" fill-opacity="0.8"/>`;
	out += `<text x="34" y="164" font-family="${BODY}" font-size="14" font-weight="700" fill="#7f9d8c">1&#215;</text>`;
	out += `<text x="266" y="164" font-family="${FONT}" font-size="20" fill="${BULL}" text-anchor="end">24&#215;</text>`;
	return out;
};

/** A rising candle run topping out at the cap. */
const artMaxWin = () => {
	// Lifted clear of the readout below it — the tallest candle used to run
	// straight through the "12,000x".
	let out = '<g transform="translate(0,-24)">';
	const bars = [
		[24, 118, 26],
		[54, 104, 34],
		[84, 108, 22],
		[114, 84, 40],
		[144, 90, 30],
		[174, 58, 48],
		[204, 64, 36],
		[234, 26, 62],
	];
	for (const [x, y, h] of bars) {
		const rising = h >= 30;
		const color = rising ? BULL : BEAR;
		out += `<rect x="${x}" y="${y}" width="18" height="${h}" rx="3" fill="${color}" fill-opacity="0.55" stroke="${color}" stroke-width="2"/>`;
		out += `<path d="M ${x + 9} ${y - 9} L ${x + 9} ${y + h + 9}" stroke="${color}" stroke-width="2" opacity="0.6"/>`;
	}
	out += '</g>';
	out += `<text x="150" y="166" font-family="${FONT}" font-size="36" fill="${BULL}" text-anchor="middle">12,000&#215;</text>`;
	return out;
};

// ─── panel content, per variant ─────────────────────────────────────────────
const VARIANTS = {
	// Mechanics: what the game DOES. Recommended — it is the only one that
	// explains the two features the game is actually built around.
	a: [
		{
			accent: TEAL,
			title: 'THE DESK OPENS UP',
			body: 'Free spins add two rows to every reel. 243 ways become 3,125 for the whole feature.',
			art: artExpand,
		},
		{
			accent: BEAR,
			title: 'LEVERAGE STACKS',
			body: 'Every LEVERAGE symbol adds to the meter. It applies to every win and never drops until the feature ends.',
			art: artLeverage,
			hero: true,
		},
		{
			accent: BULL,
			title: 'MAX WIN',
			body: 'The cap on a single round. Reach it and the round ends and pays.',
			art: artMaxWin,
		},
	],
	// Player-facing: how you GET there. Leads with the trigger instead of the
	// board, which is the more familiar shape for a slot intro.
	// SHIPPED. This is the layout built in src/components/FeatureIntro.svelte —
	// the trigger takes the middle slot because it is the one thing a player can
	// act on. Keep this variant in step with that component if the copy changes;
	// a and c below were never built.
	b: [
		{
			accent: TEAL,
			title: 'BIGGER BOARD',
			body: 'Free spins add two rows to every reel: 243 ways become 3,125.',
			art: artExpand,
		},
		{
			accent: BEAR,
			title: 'FREE SPINS',
			body: 'Land 3 or more MARGIN CALL symbols to win 8, 10 or 12 free spins.',
			art: () =>
				`<circle cx="150" cy="60" r="62" fill="${BEAR}" fill-opacity="0.12"/>` +
				`<image href="${dataUri('marginCallSymbols/s.png')}" x="100" y="10" width="100" height="100"/>` +
				`<text x="150" y="158" font-family="${FONT}" font-size="34" fill="${BEAR}" text-anchor="middle">3+</text>`,
			hero: true,
		},
		{
			accent: BULL,
			title: 'MAX WIN',
			body: 'Win up to 12,000× your bet in a single round.',
			art: artMaxWin,
		},
	],
	// Narrative: the three beats of a blow-up. Strongest character, weakest
	// information — a player learns nothing they can act on.
	c: [
		{ accent: BULL, title: 'THE RUN', body: 'Ride 243 ways while the book is green.', art: artMaxWin },
		{ accent: BEAR, title: 'THE CALL', body: 'The desk calls it in. The board opens to 5×5.', art: artExpand, hero: true },
		{ accent: AMBER, title: 'LIQUIDATION', body: 'Leverage stacks until the feature ends. 12,000× max.', art: artLeverage },
	],
};

const panels = VARIANTS[variant];
if (!panels) {
	console.error(`unknown variant "${variant}" — use a, b or c`);
	process.exit(1);
}

// ─── layout ─────────────────────────────────────────────────────────────────
// Mirrors src/components/FeatureIntro.svelte's AREA on the desktop preset:
// 0.135..0.865 of the width, 0.32..0.835 of the height, scaled to this canvas.
const PANEL_W = 296;
const GAP = 27;
const PANEL_H = 322;
const PANEL_Y = 250;
const X0 = (W - (PANEL_W * 3 + GAP * 2)) / 2;

let defs = '';
let body = '';

panels.forEach((panel, i) => {
	const x = X0 + i * (PANEL_W + GAP);
	// The hero panel sits slightly taller and prouder, the way the reference
	// screen gives its signature feature the middle slot and the biggest icon.
	const y = panel.hero ? PANEL_Y - 18 : PANEL_Y;
	const h = panel.hero ? PANEL_H + 36 : PANEL_H;

	defs +=
		`<linearGradient id="face${i}" x1="0" y1="0" x2="0" y2="1">` +
		`<stop offset="0" stop-color="${PANEL_HI}"/><stop offset="1" stop-color="${PANEL_LO}"/></linearGradient>`;

	body +=
		`<path d="${chamfer(x, y, PANEL_W, h, 22)}" fill="url(#face${i})" stroke="${INK}" stroke-width="5"/>` +
		`<path d="${chamfer(x, y, PANEL_W, h, 22)}" fill="none" stroke="${panel.accent}" stroke-width="3" stroke-opacity="0.85"/>` +
		// accent bar across the head of the panel
		`<rect x="${x + 22}" y="${y + 18}" width="${PANEL_W - 44}" height="4" rx="2" fill="${panel.accent}" fill-opacity="0.9"/>`;

	// illustration, drawn in its own 300x170 space
	body += `<g transform="translate(${x + (PANEL_W - 300) / 2}, ${y + h * 0.07}) scale(${(PANEL_W * 0.8) / 300})">${panel.art()}</g>`;

	// title
	body +=
		`<text x="${x + PANEL_W / 2}" y="${y + h * 0.52 + 24}" font-family="${FONT}" font-size="25" ` +
		`fill="${panel.accent}" text-anchor="middle" letter-spacing="1.5">${panel.title}</text>`;

	// body copy
	wrap(panel.body, 32).forEach((line, li) => {
		body +=
			`<text x="${x + PANEL_W / 2}" y="${y + h * 0.52 + 78 + li * 23}" font-family="${BODY}" font-size="15" ` +
			`font-weight="600" fill="#cfe9da" text-anchor="middle">${line}</text>`;
	});
});

// title, volatility badge, prompt
const volatility = '▮'.repeat(5);
body =
	`<image x="${W / 2 - 245}" y="${112 - 59}" width="490" height="118" ` +
	`href="data:image/png;base64,${wordmark}"/>` +
	`<rect x="${W / 2 - 148}" y="178" width="296" height="34" rx="17" fill="${INK}" stroke="${AMBER}" stroke-width="2" stroke-opacity="0.7"/>` +
	`<text x="${W / 2}" y="202" font-family="${BODY}" font-size="15" font-weight="700" fill="${AMBER}" text-anchor="middle" letter-spacing="3">VOLATILITY ${volatility}</text>` +
	body +
	`<text x="${W / 2}" y="668" font-family="${FONT}" font-size="26" fill="#cfe9da" text-anchor="middle" letter-spacing="3">CLICK TO CONTINUE</text>`;


const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>` +
	`<rect width="${W}" height="${H}" fill="${INK}"/>` +
	`<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" href="data:image/png;base64,${bg}" opacity="0.85"/>` +
	`<rect width="${W}" height="${H}" fill="#040807" opacity="0.55"/>` +
	body +
	`</svg>`;

const resvg = new Resvg(svg, {
	fitTo: { mode: 'width', value: W },
	font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: FONT },
});
fs.writeFileSync(OUT, resvg.render().asPng());
console.log('wrote', path.relative(appRoot, OUT));
