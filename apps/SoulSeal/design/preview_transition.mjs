// Render the transition's talisman storm as a filmstrip.
//
//   node design/preview_transition.mjs <dir with node_modules for @resvg/resvg-js>
//
// The transition is four beats long and every one of them is drawn by a pixi
// Graphics callback, which no static check can look at. Three versions of this
// effect have now shipped wearing a previous game's theme - a bomb, then a stock
// market crash - and each survived because "the build passed" and nobody could
// see it without running the game.
//
// ── this is a MIRROR, and that is a real limitation ──
//
// The geometry below is copied from TransitionAnimation.svelte, not imported
// from it: the component is Svelte with pixi types and cannot be executed here.
// So this can go stale, and a stale preview is worse than none - it would show a
// storm the game does not draw. The talisman constants are the ones that matter
// and they are named identically in both files; if you change them there, change
// them here and re-render.
//
// What it CAN settle is the thing that keeps being wrong: whether the effect
// reads as the right object. What it cannot settle is timing, layering, or how it
// looks over a live board.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/preview_transition.mjs <dir with node_modules>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'design/preview_transition.png');

// ── mirrored from TransitionAnimation.svelte ────────────────────────────────
const CINNABAR = '#c8102e';
const CINNABAR_HI = '#ff3b4e';
const TALISMAN = '#f2d544';
const BRASS_HI = '#d9a85c';
const FIRE = ['#c8102e', '#ff7a1a', '#ffcb6b', '#fff3dc'];
const FIRE_ALPHA = [0.34, 0.5, 0.66, 0.9];
const SHUTTER = '#0b1420';
const SPOKES = 8;
const RING_REACH = 1.15;
const TALISMAN_COUNT = 44;

const clamp01 = (t) => Math.min(Math.max(t, 0), 1);
const easeOutCubic = (t) => 1 - (1 - clamp01(t)) ** 3;

const talismans = Array.from({ length: TALISMAN_COUNT }, (_, i) => {
	const noise = (k) => (((Math.sin(i * k) * 43758.5453) % 1) + 1) % 1;
	return {
		angle: (Math.PI * 2 * i) / TALISMAN_COUNT + (noise(12.9898) - 0.5) * 0.5,
		reach: 0.55 + noise(78.233) * 0.85,
		size: 0.7 + noise(37.719) * 0.7,
		spin: 2.4 + noise(93.989) * 4.2,
		delay: noise(11.137) * 0.55,
		sense: i % 2 === 0 ? 1 : -1,
		drag: 1.6 + noise(24.611) * 2.2,
		sink: 0.04 + noise(24.611) * 0.1,
		flutter: 0.5 + noise(58.317) * 0.9,
	};
});

// One frame of the canvas.
const W = 420;
const H = 236;
const CX = W / 2;
const CY = H / 2;
const DIAGONAL = Math.sqrt(W * W + H * H);

const storm = (t, alpha) =>
	talismans
		.map((slip) => {
			const local = clamp01((t - slip.delay) / (1 - slip.delay));
			if (local <= 0) return '';
			const travelled = (1 - Math.exp(-slip.drag * local)) / (1 - Math.exp(-slip.drag));
			const distance = DIAGONAL * 0.5 * slip.reach * travelled;
			const cx = CX + Math.cos(slip.angle) * distance;
			const cy = CY + Math.sin(slip.angle) * distance + DIAGONAL * slip.sink * local * local;
			const theta = local * slip.spin * Math.PI * 2 * slip.sense;
			const halfW = DIAGONAL * 0.016 * slip.size * Math.abs(Math.cos(theta));
			const halfH = DIAGONAL * 0.034 * slip.size;
			const lean =
				slip.angle + Math.PI / 2 + Math.sin(theta * 0.7) * slip.flutter * (1 - travelled * 0.5);
			const cos = Math.cos(lean);
			const sin = Math.sin(lean);
			const at = (u, v) => [cx + u * halfW * cos - v * halfH * sin, cy + u * halfW * sin + v * halfH * cos];
			// the trailing flame - mirrors drawStorm in TransitionAnimation.svelte
			const speed = (slip.drag * Math.exp(-slip.drag * local)) / (1 - Math.exp(-slip.drag));
			const tongue = DIAGONAL * 0.055 * slip.size * Math.min(1, speed * 0.55);
			let fire = '';
			if (tongue > 1) {
				const backX = -Math.cos(slip.angle);
				const backY = -Math.sin(slip.angle);
				FIRE.forEach((colour, pass) => {
					const reach = tongue * [1, 0.72, 0.46, 0.22][pass];
					const wdt = halfH * [0.9, 0.66, 0.42, 0.2][pass];
					fire +=
						`<path d="M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${(cx + backX * reach).toFixed(1)} ${(cy + backY * reach).toFixed(1)}" ` +
						`stroke="${colour}" stroke-width="${Math.max(1, wdt).toFixed(1)}" stroke-linecap="round" ` +
						`opacity="${(FIRE_ALPHA[pass] * alpha * (1 - local * 0.3)).toFixed(3)}" fill="none"/>`;
				});
			}
			const corners = [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)];
			const face = Math.abs(Math.cos(theta));
			const fill = face > 0.25 ? TALISMAN : BRASS_HI;
			const opacity = alpha * (0.55 + 0.4 * face) * (1 - local * 0.15);
			const [m0, m1] = [at(0, -0.6), at(0, 0.6)];
			return (
				fire +
				`<polygon points="${corners.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" ` +
				`fill="${fill}" opacity="${opacity.toFixed(3)}"/>` +
				(face > 0.4
					? `<path d="M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)} L ${m1[0].toFixed(1)} ${m1[1].toFixed(1)}" ` +
						`stroke="${CINNABAR}" stroke-width="${Math.max(1, halfW * 0.5).toFixed(1)}" ` +
						`stroke-linecap="round" opacity="${(alpha * 0.85).toFixed(3)}"/>`
					: '')
			);
		})
		.join('');

const seal = (crashT) => {
	if (crashT < 0) return '';
	let out = '';
	const washSteps = 8;
	const wash = clamp01((crashT - 0.15) / 0.85);
	for (let i = washSteps; i >= 1; i--) {
		const q = i / washSteps;
		const r = DIAGONAL * 0.62 * wash * q;
		const colour = FIRE[Math.min(FIRE.length - 1, Math.floor((1 - q) * FIRE.length))];
		out += `<circle cx="${CX}" cy="${CY}" r="${r.toFixed(1)}" fill="${colour}" opacity="${(0.055 * wash).toFixed(3)}"/>`;
	}
	// No rings. They were removed from the component; a mirror that still draws
	// them is worse than no mirror, because it shows an effect the game does not.
	out += storm(clamp01((crashT - 0.05) / 0.95), 1);
	const strokeT = clamp01((crashT - 0.1) / 0.9);
	if (strokeT > 0) {
		const inner = DIAGONAL * 0.06;
		const outer = inner + DIAGONAL * 0.16 * easeOutCubic(strokeT);
		const spokes = Array.from({ length: SPOKES }, (_, i) => {
			const a = (Math.PI * 2 * i) / SPOKES;
			return `M ${(CX + Math.cos(a) * inner).toFixed(1)} ${(CY + Math.sin(a) * inner).toFixed(1)} L ${(CX + Math.cos(a) * outer).toFixed(1)} ${(CY + Math.sin(a) * outer).toFixed(1)}`;
		}).join(' ');
		for (const [pass, scale] of [[1, 1], [2, 0.58], [3, 0.26]]) {
			out += `<path d="${spokes}" stroke="${FIRE[pass]}" stroke-width="${(7 * scale * (1 - strokeT * 0.6)).toFixed(1)}" stroke-linecap="round" fill="none" opacity="${(0.8 * (1 - strokeT * 0.5)).toFixed(3)}"/>`;
		}
	}
	return out;
};

const flood = (floodT, washT) => {
	if (floodT <= 0 && washT <= 0) return '';
	return (
		`<rect x="0" y="0" width="${W}" height="${H}" fill="${SHUTTER}" opacity="${washT.toFixed(3)}"/>` +
		storm(0.35 + floodT * 0.65, Math.min(1, floodT * 1.6))
	);
};

// The beats, at the timings the component uses.
const FRAMES = [
	{ label: 'SEAL 30%', body: seal(0.3) },
	{ label: 'SEAL 70%', body: seal(0.7) },
	{ label: 'FLOOD 55%', body: seal(1) + flood(0.55, clamp01(0.55 / 0.6)) },
	{ label: 'COVERED', body: flood(1, 1) },
	{ label: 'OPEN 60%', body: flood(0.4, 0.4) },
];

const GAP = 10;
const stripW = FRAMES.length * W + (FRAMES.length + 1) * GAP;
const stripH = H + GAP * 2 + 18;
const cells = FRAMES.map(
	({ label, body }, i) => `
	<g transform="translate(${GAP + i * (W + GAP)} ${GAP})">
		<rect width="${W}" height="${H}" fill="#101820"/>
		<!-- a mock board, so the storm is judged over something rather than over nothing -->
		<rect x="${W * 0.16}" y="${H * 0.2}" width="${W * 0.68}" height="${H * 0.6}" rx="6"
		      fill="#1e3a3c" stroke="#6b4226" stroke-width="3"/>
		${body}
		<text x="${W / 2}" y="${H + 13}" text-anchor="middle" font-family="monospace"
		      font-size="11" fill="#d9a85c">${label}</text>
	</g>`,
).join('');

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${stripW}" height="${stripH}" viewBox="0 0 ${stripW} ${stripH}">` +
	`<rect width="${stripW}" height="${stripH}" fill="#080d12"/>${cells}</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: stripW } }).render().asPng();
fs.writeFileSync(OUT, png);
console.log(`wrote ${path.relative(appRoot, OUT)}  ${(png.length / 1024).toFixed(0)} KB`);
console.log(`  ${TALISMAN_COUNT} talismans, ${FRAMES.length} frames`);
console.log('  MIRROR of TransitionAnimation.svelte - see the header before trusting it');
