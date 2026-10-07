// THE ICE PANE THE GAME OPENS UNDER (gbEntryIce) — EntryReveal shatters it.
//
// Usage: node design/generate_entry_ice.mjs <dir with node_modules for @resvg/resvg-js>
//
// Go Bananas Boat opens on its board under a lashed tarp that is yanked off.
// Frostline opens on its board frozen over: a pane of frosted ice the reels
// are seen dimly through, which cracks from the middle and falls away in
// shards (EntryReveal / IcePaneShatter). This is the pane.
//
// Opaque enough that the board reads as UNDER it (the payoff is seeing it
// clear), translucent enough at the middle that it reads as ice over
// something rather than a lid: frosted white at the rim where the rime is
// thickest, clearer blue toward the centre, with frost ferns growing in from
// the edges and a grain of hoar over all of it. Deterministic (seeded), so
// regenerating does not change what shipped.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_entry_ice.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi/entry_ice.png');

// the board's own proportion: 5 reels x 3 rows
const W = 1000, H = 600;

let seed = 7;
const rand = () => {
	seed = (seed * 16807) % 2147483647;
	return (seed - 1) / 2147483646;
};

// A frost fern: a main stroke grown in from an edge, branching at a steady
// angle on alternate sides, each branch shorter — the way hoar grows on glass.
const fern = (x, y, angle, len, depth, out) => {
	let px = x, py = y, a = angle;
	const steps = 6 + depth * 2;
	const pts = [[px, py]];
	for (let i = 0; i < steps; i++) {
		a += (rand() - 0.5) * 0.12;
		px += Math.cos(a) * (len / steps);
		py += Math.sin(a) * (len / steps);
		pts.push([px, py]);
		if (depth > 0 && i > 0 && i < steps - 1) {
			const side = i % 2 ? 1 : -1;
			// frost branches at about 60 degrees, the angle ice crystals grow at
			fern(px, py, a + side * (1.0 + rand() * 0.1), len * (0.3 + rand() * 0.1) * (1 - i / steps * 0.5), depth - 1, out);
		}
	}
	out.push({ pts, w: 0.8 + depth * 0.9, o: 0.3 + depth * 0.12 });
};
const ferns = [];
for (let i = 0; i < 26; i++) {
	const edge = i % 4;
	const u = rand();
	const [x, y, a] =
		edge === 0 ? [u * W, 0, Math.PI / 2] : edge === 1 ? [W, u * H, Math.PI] : edge === 2 ? [u * W, H, -Math.PI / 2] : [0, u * H, 0];
	fern(x, y, a + (rand() - 0.5) * 1.1, 110 + rand() * 150, 3, ferns);
}
const fernSvg = ferns
	.map(
		(f) =>
			`<polyline points="${f.pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="none" stroke="#ffffff" stroke-width="${f.w.toFixed(1)}" stroke-opacity="${f.o.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`,
	)
	.join('\n');

// a scatter of hoar crystals: tiny four-point glints
const glints = Array.from({ length: 70 }, () => {
	const x = rand() * W, y = rand() * H, r = 2 + rand() * 5, o = 0.25 + rand() * 0.5;
	return `<path d="M ${x} ${y - r} L ${x + r * 0.18} ${y} L ${x} ${y + r} L ${x - r * 0.18} ${y} Z M ${x - r} ${y} L ${x} ${y - r * 0.18} L ${x + r} ${y} L ${x} ${y + r * 0.18} Z" fill="#ffffff" opacity="${o.toFixed(2)}"/>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
	<!-- the ice itself: clearer and bluer at the middle, frosted toward the rim -->
	<radialGradient id="body" cx="0.5" cy="0.5" r="0.62">
		<stop offset="0" stop-color="#3a78a8" stop-opacity="0.8"/>
		<stop offset="0.6" stop-color="#7db6de" stop-opacity="0.9"/>
		<stop offset="1" stop-color="#dff2ff" stop-opacity="0.97"/>
	</radialGradient>
	<!-- light from the upper left, as on every slate in this game -->
	<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/>
		<stop offset="0.45" stop-color="#ffffff" stop-opacity="0.04"/>
		<stop offset="1" stop-color="#0c2a44" stop-opacity="0.18"/>
	</linearGradient>
	<filter id="hoar" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="3" seed="11" result="n"/>
		<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.55"/>
	</filter>
	<filter id="soft"><feGaussianBlur stdDeviation="0.6"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#body)"/>
<rect width="${W}" height="${H}" filter="url(#hoar)" opacity="0.3"/>
<g filter="url(#soft)">${fernSvg}</g>
<rect width="${W}" height="${H}" fill="url(#sheen)"/>
<!-- two long glassy streaks: what tells the eye the surface is smooth and hard -->
<polygon points="${W * 0.08},${H} ${W * 0.2},${H} ${W * 0.58},0 ${W * 0.46},0" fill="#ffffff" opacity="0.08"/>
<polygon points="${W * 0.25},${H} ${W * 0.29},${H} ${W * 0.67},0 ${W * 0.63},0" fill="#ffffff" opacity="0.07"/>
${glints}
<!-- the pane's rim: a hard lit edge, so it reads as a sheet with a thickness -->
<rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="#f4fbff" stroke-width="6" stroke-opacity="0.85"/>
<rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="none" stroke="#2f6f9c" stroke-width="2" stroke-opacity="0.5"/>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: false } }).render().asPng();
fs.writeFileSync(OUT, png);
console.log('rendered', path.relative(appRoot, OUT), `${W}x${H}`);
