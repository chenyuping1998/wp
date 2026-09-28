// The free-spin counter's plate: an ice-framed slate panel with a snowdrift on
// its top edge and icicles hanging off the bottom.
//
//   node design/generate_fs_counter_frost.mjs <toolsDir>
//
// Writes static/assets/sprites/goBananasFrame/fs_counter_panel.png.
//
// ── Why this is drawn from scratch rather than re-coloured ──────────────────
//
// The panel used to come out of retheme_frame_frost.mjs, which takes Go Bananas
// 100's brass plaque and shifts its hues to ice. That makes a jungle object in
// ice colours: the same bevelled rectangle, the same four rivets, and the same
// three-banana emblem stamped at the top centre. It looked like the plaque had
// been painted blue, because it had.
//
// What says SNOWFIELD rather than "blue" is what snow and cold DO to an object
// left outside, not its colour:
//
//   · snow SETTLES on top — a drift along the upper edge, lumpy, overhanging a
//     little at the ends and slumping over the front in a couple of places
//   · meltwater FREEZES underneath — icicles off the bottom edge, uneven lengths
//   · frost GROWS in the corners — a small six-armed crystal where the rivets
//     were, the same crystal as the Buy Bonus button, so the two read as a set
//
// The emblem is gone rather than replaced: the title and the count say what the
// panel is, and a mark between them and the top edge was only ever filling space.
//
// ── The clear zone ──────────────────────────────────────────────────────────
//
// FreeSpinCounter.svelte places its text at fixed fractions of this canvas, so
// the frame has to stay outside the band they use. On this 1280x966 canvas:
//
//     title (0.33, font 0.115w)        y ~266..372
//     free-game count (0.58, 0.19w)    y ~473..647
//     superspin number (0.55, 0.3w)    y ~390..700
//     superspin pips (0.78, r 0.035w)  y ~708..798
//
// So everything drawn here stays above y 240 or below y 810, or outside the
// plate's inner edge. The drift's lowest slump reaches y ~205.
//
// The canvas and the plate's placement inside it are kept exactly as the old
// art had them (1280x966, plate at y 87..878), so PANEL_RATIO in the component
// and every text fraction stay valid without touching the component.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node design/generate_fs_counter_frost.mjs <toolsDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(APP, 'static/assets/sprites/goBananasFrame/fs_counter_panel.png');

const W = 1280;
const H = 966;
// the plate, where the old art had it
const PX = 52;
const PY = 112;
const PW = W - PX * 2;
const PH = 870 - PY;
const RX = 44;

// seeded, so a re-run does not reshuffle the drift or the icicles
let seed = 20260919;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ── the snowdrift along the top edge ────────────────────────────────────────
//
// Built as one closed path: along the plate's top edge from left to right (the
// drift's base, tucked just under the rim so there is no gap), then back over
// the top as a run of arcs of varying height. The ends overhang the corners a
// little, as settled snow does.
const drift = (() => {
	const left = PX - 18;
	const right = PX + PW + 18;
	const base = PY + 26;
	// SIX MOUNDS OF VERY DIFFERENT WIDTH, not thirteen even scallops. The first
	// render used thirteen, and at the 248px the panel is drawn at it read as
	// lace trim along the top — a decoration, not snow that had settled. A drift
	// is a few broad, uneven heaps, deepest at one end.
	const widths = [1.6, 0.8, 1.25, 0.7, 1.05, 1.4];
	const heights = [78, 40, 62, 34, 52, 70];
	const unit = (right - left) / widths.reduce((a, b) => a + b, 0);
	let d = `M ${left} ${base} `;
	// the underside: along the rim, with two slumps where it hangs over the front
	const slumps = [0.24, 0.71];
	const under = [];
	for (let i = 0; i <= 40; i++) {
		const x = left + ((right - left) * i) / 40;
		let y = base;
		for (const s of slumps) {
			const sx = left + (right - left) * s;
			const k = Math.exp(-(((x - sx) / 46) ** 2));
			y += k * 62;
		}
		under.push([x, y]);
	}
	d += under.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
	// the top: lumps, back from right to left
	let x = right;
	for (let i = widths.length - 1; i >= 0; i--) {
		const nx = Math.max(left, x - widths[i] * unit);
		const h = heights[i] * (0.9 + rand() * 0.2);
		// the crest leans a little, so no mound is a symmetric bump
		const lean = (rand() - 0.5) * (x - nx) * 0.35;
		const cx = (x + nx) / 2 + lean;
		// valleys between mounds do not drop to the base: the snow is continuous
		const valley = i === 0 ? base : base - 14 - rand() * 10;
		d += ` C ${(x - (x - nx) * 0.1).toFixed(1)} ${(base - h * 1.2).toFixed(1)} ${cx.toFixed(1)} ${(base - h * 1.35).toFixed(1)} ${cx.toFixed(1)} ${(base - h * 1.35).toFixed(1)}`;
		d += ` S ${(nx + (x - nx) * 0.1).toFixed(1)} ${(valley - h * 0.2).toFixed(1)} ${nx.toFixed(1)} ${valley.toFixed(1)}`;
		x = nx;
	}
	d += ` L ${left} ${base} Z`;
	return d;
})();

// ── icicles off the bottom edge ─────────────────────────────────────────────
//
// Uneven on purpose: evenly spaced, even-length icicles are a fringe on a
// curtain. Longer toward the middle of each run, where meltwater collects, and
// none right at the corners, where it runs off the sides instead.
const icicles = (() => {
	const out = [];
	const y0 = PY + PH - 6;
	// SEVEN, WIDER AND LONGER. Eleven thin ones read as a row of teeth at game
	// size. Lengths are set rather than rolled so the run has a shape: two long
	// ones off-centre, short ones between, as real icicles hang.
	const lens = [36, 72, 28, 52, 90, 32, 60];
	const count = lens.length;
	for (let i = 0; i < count; i++) {
		const t = (i + 0.5) / count;
		const x = PX + 90 + t * (PW - 180) + (rand() - 0.5) * 40;
		const len = lens[i] * (0.9 + rand() * 0.2);
		const w = 19 + rand() * 9;
		out.push({ x, y0, len, w });
	}
	return out;
})();
const iciclePath = ({ x, y0, len, w }) =>
	`M ${(x - w).toFixed(1)} ${y0} Q ${(x - w * 0.35).toFixed(1)} ${(y0 + len * 0.55).toFixed(1)} ${x.toFixed(1)} ${(y0 + len).toFixed(1)} Q ${(x + w * 0.35).toFixed(1)} ${(y0 + len * 0.55).toFixed(1)} ${(x + w).toFixed(1)} ${y0} Z`;

// ── a frost crystal: six arms, one barb pair — the Buy Bonus button's mark ──
const crystal = (cx, cy, r) => {
	const seg = [];
	for (let i = 0; i < 6; i++) {
		const a = (i / 6) * Math.PI * 2;
		const s = Math.sin(a);
		const c = Math.cos(a);
		const at = (d) => [cx + s * d, cy - c * d];
		const [x1, y1] = at(r);
		seg.push(`M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)}`);
		const [bx, by] = at(r * 0.55);
		for (const side of [-1, 1]) {
			const f = Math.PI / 3;
			const len = r * 0.38;
			const ex = bx + (s * Math.cos(f) - c * side * Math.sin(f)) * len;
			const ey = by + (-c * Math.cos(f) - s * side * Math.sin(f)) * len;
			seg.push(`M ${bx.toFixed(1)} ${by.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`);
		}
	}
	const d = seg.join(' ');
	return `<path d="${d}" fill="none" stroke="#0a1420" stroke-width="${(r * 0.34).toFixed(1)}" stroke-linecap="round" opacity="0.8"/>
	<path d="${d}" fill="none" stroke="#bfe8ff" stroke-width="${(r * 0.17).toFixed(1)}" stroke-linecap="round"/>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
	<linearGradient id="slate" x1="0.2" y1="0" x2="0.8" y2="1">
		<stop offset="0" stop-color="#22334a"/>
		<stop offset="0.55" stop-color="#162232"/>
		<stop offset="1" stop-color="#0e1724"/>
	</linearGradient>
	<!-- the ice rim, lit from the upper left like every plate in the game -->
	<linearGradient id="rim" x1="0.1" y1="0" x2="0.8" y2="1">
		<stop offset="0" stop-color="#eaf7ff"/>
		<stop offset="0.3" stop-color="#8fd9ff"/>
		<stop offset="0.7" stop-color="#5fa8d8"/>
		<stop offset="1" stop-color="#1e6fa8"/>
	</linearGradient>
	<linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff"/>
		<stop offset="0.6" stop-color="#eef7ff"/>
		<stop offset="1" stop-color="#b9d6ea"/>
	</linearGradient>
	<linearGradient id="icicle" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#eaf7ff"/>
		<stop offset="0.45" stop-color="#9fdcff"/>
		<stop offset="1" stop-color="#3f8ec4"/>
	</linearGradient>
	<!-- a breath of cold light inside the top of the plate, so the drift above it
	     reads as sitting on something lit rather than on a hole -->
	<radialGradient id="chill" cx="0.5" cy="0" r="0.8">
		<stop offset="0" stop-color="#8fd9ff" stop-opacity="0.16"/>
		<stop offset="1" stop-color="#8fd9ff" stop-opacity="0"/>
	</radialGradient>
</defs>

<!-- the icicles go first so the rim overlaps their roots -->
${icicles.map((ic) => `<path d="${iciclePath({ ...ic, w: ic.w + 4, len: ic.len + 5 })}" fill="#0a1420" opacity="0.85"/>`).join('\n')}
${icicles.map((ic) => `<path d="${iciclePath(ic)}" fill="url(#icicle)"/>`).join('\n')}
${icicles.map((ic) => `<path d="M ${(ic.x - ic.w * 0.45).toFixed(1)} ${ic.y0 + 4} L ${(ic.x - ic.w * 0.1).toFixed(1)} ${(ic.y0 + ic.len * 0.7).toFixed(1)}" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`).join('\n')}

<!-- the plate: shadow, ink outline, ice rim, slate face -->
<rect x="${PX}" y="${PY + 10}" width="${PW}" height="${PH}" rx="${RX}" fill="#000000" opacity="0.4"/>
<rect x="${PX - 6}" y="${PY - 6}" width="${PW + 12}" height="${PH + 12}" rx="${RX + 6}" fill="#0a1420"/>
<rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="${RX}" fill="url(#rim)"/>
<rect x="${PX + 22}" y="${PY + 22}" width="${PW - 44}" height="${PH - 44}" rx="${RX - 18}" fill="#0a1420"/>
<rect x="${PX + 27}" y="${PY + 27}" width="${PW - 54}" height="${PH - 54}" rx="${RX - 22}" fill="url(#slate)"/>
<rect x="${PX + 27}" y="${PY + 27}" width="${PW - 54}" height="${PH - 54}" rx="${RX - 22}" fill="url(#chill)"/>
<rect x="${PX + 36}" y="${PY + 36}" width="${PW - 72}" height="${PH - 72}" rx="${RX - 28}" fill="none" stroke="#8fd9ff" stroke-width="2.5" opacity="0.45"/>
<!-- the rim's own lit edge, upper-left -->
<path d="M ${PX + 6} ${PY + PH * 0.6} L ${PX + 6} ${PY + RX} Q ${PX + 6} ${PY + 6} ${PX + RX} ${PY + 6} L ${PX + PW * 0.55} ${PY + 6}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.55" stroke-linecap="round"/>

<!-- frost in the lower corners, where the rivets were; the upper two are under
     the drift -->
${crystal(PX + 78, PY + PH - 78, 36)}
${crystal(PX + PW - 78, PY + PH - 78, 36)}

<!-- the drift: shadow on the plate, ink outline, snow, a hard highlight -->
<path d="${drift}" transform="translate(0 10)" fill="#000000" opacity="0.35"/>
<path d="${drift}" fill="url(#snow)" stroke="#0a1420" stroke-width="7" stroke-linejoin="round"/>
<path d="${drift}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6" transform="translate(-3 -4)" clip-path="none"/>
${Array.from({ length: 26 }, () => {
	const x = PX + 30 + rand() * (PW - 60);
	const y = PY - 10 + rand() * 30;
	return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2 + rand() * 3).toFixed(1)}" fill="#a9c7de" opacity="0.5"/>`;
}).join('')}
</svg>`;

// the text clear-zone check: nothing drawn may reach into y 240..810 inside the
// plate's inner edge. The drift's slumps are the only thing that comes down, so
// they are the thing measured.
{
	const lowest = Number(
		Math.max(
			...drift
				.match(/L [\d.]+ ([\d.]+)/g)
				.map((s) => Number(s.split(' ')[2])),
		).toFixed(1),
	);
	if (lowest > 240) {
		console.error(`the drift slumps to y ${lowest}, into the title's band (starts ~250). Lower the slump depth.`);
		process.exit(1);
	}
	console.log(`drift reaches down to y ${lowest} (title band starts ~250)`);
}

const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
fs.writeFileSync(OUT, png);
console.log('wrote', path.relative(APP, OUT), `${W}x${H}`);
