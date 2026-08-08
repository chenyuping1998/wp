// The Crusher Yard room: one painting that holds both the scrapyard and the
// press housing, with a dark opening the board shows through.
//
//   node design/generate_scene_yard.mjs <dir with node_modules/@resvg/resvg-js>
//   DUMP_SVG=1 also writes the raw SVG next to the PNG.
//
// WHY ONE IMAGE
//
// It replaces the background/frame pair the earlier generator emitted. Keeping
// them apart means the seam between room and housing has to be re-registered at
// every aspect ratio; fusing them means the housing is drawn in the room's own
// light and the seam cannot open. The cost is that the image can no longer be
// positioned by the screen — BoardFrame anchors it to the BOARD so that OPENING
// below lands exactly on the playfield. Those numbers are the contract: change
// them here and change them in BoardFrame.svelte.
//
// THE OPENING IS 6:5, NOT SQUARE
//
// This is the whole reason the file exists. The supplied forge painting this
// replaces had a 628x586 opening cut for a 7x7 board. BoardFrame scales the
// scene by the opening's HEIGHT, so on a 588x490 board that painting scaled to
// 525 wide — and the housing sat over the first and last reel. An opening that
// is slightly WIDER than the board is safe (it just shows more dark recess); one
// that is narrower is not.
//
// PALETTE
//
// The board is where the player has to look, and during a tumble it is covered
// in amber win marks with a green-to-red pressure gauge sitting directly above
// it. So the room is built almost entirely from cold steel greys and blue-greys,
// and its only warm light is a sodium lamp placed low and far to one side where
// it cannot be mistaken for a win. Hazard yellow is rationed to two thin bands
// on the jaw faces — enough to say "machine", not enough to compete with the
// gauge.
//
// resvg note: keep every filter region within about +/-200%. Larger regions make
// it panic outright rather than clip.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_scene_yard.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/crusherYardBackground');
fs.mkdirSync(OUT, { recursive: true });

// ── the contract with BoardFrame.svelte ─────────────────────────────────────
const W = 1536;
const H = 1024;
// 6:5 board plus a little horizontal slack. Centred across, sat slightly above
// the vertical middle so the yard floor and the sodium lamp have room beneath.
const OPEN_W = 812;
const OPEN_H = 650;
const OPEN_X = Math.round((W - OPEN_W) / 2); // 362
const OPEN_Y = 196;

// Seeded, so re-running produces the same picture and a diff means someone
// changed the drawing rather than the noise.
let seed = 0x5f3a71;
const rnd = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const between = (a, b) => a + rnd() * (b - a);

const DEFS = `
	<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#171d24"/>
		<stop offset="0.55" stop-color="#222a33"/>
		<stop offset="1" stop-color="#141920"/>
	</linearGradient>
	<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#5c666f"/>
		<stop offset="0.5" stop-color="#39424a"/>
		<stop offset="1" stop-color="#232a30"/>
	</linearGradient>
	<linearGradient id="jaw" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#6d7883"/>
		<stop offset="0.35" stop-color="#454f58"/>
		<stop offset="1" stop-color="#1b2126"/>
	</linearGradient>
	<linearGradient id="ram" x1="0" y1="0" x2="1" y2="0">
		<stop offset="0" stop-color="#2b3238"/>
		<stop offset="0.35" stop-color="#8d99a3"/>
		<stop offset="0.6" stop-color="#b8c3cb"/>
		<stop offset="1" stop-color="#333b42"/>
	</linearGradient>
	<radialGradient id="sodium" cx="0.5" cy="0.5" r="0.5">
		<stop offset="0" stop-color="#ffb457" stop-opacity="0.85"/>
		<stop offset="0.45" stop-color="#c9721d" stop-opacity="0.35"/>
		<stop offset="1" stop-color="#c9721d" stop-opacity="0"/>
	</radialGradient>
	<radialGradient id="recess" cx="0.5" cy="0.42" r="0.72">
		<stop offset="0" stop-color="#0b0d10"/>
		<stop offset="1" stop-color="#000000"/>
	</radialGradient>
	<filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
		<feGaussianBlur stdDeviation="14"/>
	</filter>
	<filter id="grain" x="0" y="0" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="7"/>
		<feColorMatrix type="saturate" values="0.15"/>
		<feComponentTransfer><feFuncA type="linear" slope="0.34"/></feComponentTransfer>
	</filter>
	<!-- Blotchy corrosion, used as an overlay on flat steel. A painted-on rust
	     SHAPE reads as a decal; modulating an existing surface with noise reads as
	     corrosion, and costs one filter instead of a hundred paths. -->
	<filter id="rust" x="-10%" y="-10%" width="120%" height="120%">
		<feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="4" seed="21"/>
		<!-- Dark iron-oxide brown, NOT the orange a first pass produced. At full
		     saturation this became the warmest thing in the picture and pulled the
		     eye off the board, straight into competition with the pressure gauge
		     sitting just above it. Rust in a dim shed is nearly black. -->
		<feColorMatrix type="matrix" values="0 0 0 0 0.26  0 0 0 0 0.15  0 0 0 0 0.09  1.1 0 0 0 -0.62"/>
	</filter>
	<!-- Rust runs DOWN. Masking the corrosion with a vertical ramp is what stops
	     it reading as an evenly applied texture (or as wood grain). -->
	<linearGradient id="rustFalloff" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffffff" stop-opacity="0.05"/>
		<stop offset="0.55" stop-color="#ffffff" stop-opacity="0.5"/>
		<stop offset="1" stop-color="#ffffff" stop-opacity="1"/>
	</linearGradient>
	<mask id="rustMask">
		<rect x="0" y="0" width="1536" height="1024" fill="url(#rustFalloff)"/>
	</mask>
	<linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
		<stop offset="0.45" stop-color="#000000" stop-opacity="0.05"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
	</linearGradient>
	<linearGradient id="wetFloor" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffb457" stop-opacity="0.26"/>
		<stop offset="1" stop-color="#ffb457" stop-opacity="0"/>
	</linearGradient>`;

// ── corrugated shed wall ────────────────────────────────────────────────────
const corrugation = (x, y, w, h, step) => {
	// Three passes per flute — deep shadow, mid, specular highlight — because two
	// passes read as stripes painted on a flat wall rather than as a profile.
	let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#steel)"/>`;
	for (let cx = x; cx < x + w; cx += step) {
		out += `<rect x="${cx}" y="${y}" width="${step * 0.34}" height="${h}" fill="#05080b" opacity="0.5"/>`;
		out += `<rect x="${cx + step * 0.34}" y="${y}" width="${step * 0.2}" height="${h}" fill="#000000" opacity="0.2"/>`;
		out += `<rect x="${cx + step * 0.62}" y="${y}" width="${step * 0.14}" height="${h}" fill="#c3ced6" opacity="0.16"/>`;
	}
	// Horizontal sheet joins, so the wall has a scale to read against.
	for (let sy = y + 150; sy < y + h; sy += 170) {
		out += `<rect x="${x}" y="${sy}" width="${w}" height="3" fill="#05080b" opacity="0.55"/>`;
		out += `<rect x="${x}" y="${sy + 3}" width="${w}" height="2" fill="#8d99a3" opacity="0.12"/>`;
	}
	out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#wallShade)"/>`;
	return out;
};

// ── scrap heaps: overlapping angular silhouettes, no readable objects ───────
// Deliberately abstract. A recognisable car door in the background competes with
// the symbols, which are recognisable objects at cell size and need to own that.
const scrapHeap = (baseY, spread, height, tone, edge, opacity) => {
	let out = '';
	for (let i = 0; i < 30; i += 1) {
		const cx = between(-60, W + 60);
		const w = between(70, 210) * spread;
		const h = between(40, height);
		const skew = between(-0.35, 0.35);
		const d = `M${cx} ${baseY} l${w * 0.2 + skew * 40} ${-h} l${w * 0.55} ${-h * between(0.05, 0.35)} l${w * 0.25} ${h * 1.1} z`;
		// A lit top edge on every piece. Without it the heaps merge into one flat
		// silhouette and stop reading as separate objects at all.
		out += `<path d="${d}" fill="${tone}" opacity="${opacity}"/>`;
		out += `<path d="${d}" fill="none" stroke="${edge}" stroke-width="2" opacity="0.42"/>`;
	}
	return out;
};

// ── the press housing around the opening ────────────────────────────────────
const RIVET_STEP = 46;
const rivets = (x, y, w, h, inset) => {
	let out = '';
	for (let px = x + inset; px <= x + w - inset; px += RIVET_STEP) {
		out += `<circle cx="${px}" cy="${y + inset}" r="4.5" fill="#8e99a2" opacity="0.75"/>`;
		out += `<circle cx="${px}" cy="${y + h - inset}" r="4.5" fill="#8e99a2" opacity="0.75"/>`;
	}
	for (let py = y + inset; py <= y + h - inset; py += RIVET_STEP) {
		out += `<circle cx="${x + inset}" cy="${py}" r="4.5" fill="#8e99a2" opacity="0.75"/>`;
		out += `<circle cx="${x + w - inset}" cy="${py}" r="4.5" fill="#8e99a2" opacity="0.75"/>`;
	}
	return out;
};

// Hazard striping, drawn as a clipped band rather than individual quads so the
// diagonals stay parallel across the whole run.
const hazard = (id, x, y, w, h) => `
	<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
	<g clip-path="url(#${id})">
		<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1a1a17"/>
		${Array.from({ length: Math.ceil((w + h) / 46) }, (_, i) => {
			const sx = x - h + i * 46;
			return `<path d="M${sx} ${y + h} l${h} ${-h} l24 0 l${-h} ${h} z" fill="#c9a227" opacity="0.85"/>`;
		}).join('')}
	</g>`;

const BEZEL = 46;

const housing = () => {
	const ox = OPEN_X;
	const oy = OPEN_Y;
	const ow = OPEN_W;
	const oh = OPEN_H;
	const outer = { x: ox - 128, y: oy - 116, w: ow + 256, h: oh + 250 };

	return `
	<!-- machine body -->
	<rect x="${outer.x}" y="${outer.y}" width="${outer.w}" height="${outer.h}" rx="26" fill="url(#steel)"/>
	<!-- corrosion and weld seams, clipped to the body so nothing bleeds into the room -->
	<clipPath id="bodyClip"><rect x="${outer.x}" y="${outer.y}" width="${outer.w}" height="${outer.h}" rx="26"/></clipPath>
	<g clip-path="url(#bodyClip)">
		<g mask="url(#rustMask)">
			<rect x="${outer.x}" y="${outer.y}" width="${outer.w}" height="${outer.h}" filter="url(#rust)" opacity="0.55"/>
		</g>
		${[0.18, 0.82]
			.map((f) => {
				const sy = outer.y + outer.h * f;
				return `<rect x="${outer.x}" y="${sy}" width="${outer.w}" height="3" fill="#0b0f13" opacity="0.7"/><rect x="${outer.x}" y="${sy + 3}" width="${outer.w}" height="2" fill="#a3aeb7" opacity="0.2"/>`;
			})
			.join('')}
	</g>
	<!-- bevel, then a hard outline: light inside the edge, dark on it -->
	<rect x="${outer.x + 5}" y="${outer.y + 5}" width="${outer.w - 10}" height="${outer.h - 10}" rx="22" fill="none" stroke="#8d99a3" stroke-width="3" opacity="0.28"/>
	<rect x="${outer.x}" y="${outer.y}" width="${outer.w}" height="${outer.h}" rx="26" fill="none" stroke="#0b0f13" stroke-width="8"/>
	${rivets(outer.x, outer.y, outer.w, outer.h, 26)}

	<!-- hydraulic rams driving the top jaw, drawn behind the jaw itself -->
	${[0.26, 0.5, 0.74]
		.map((f) => {
			const cx = ox + ow * f;
			return `<rect x="${cx - 21}" y="${outer.y + 16}" width="42" height="104" rx="8" fill="url(#ram)"/>
			<rect x="${cx - 30}" y="${outer.y + 104}" width="60" height="22" rx="6" fill="#2a3138"/>`;
		})
		.join('')}

	<!-- the opening: a dark recess, which is what the board shows through -->
	<rect x="${ox}" y="${oy}" width="${ow}" height="${oh}" rx="10" fill="url(#recess)"/>

	<!-- jaw faces: heavy plates top and bottom, each with one hazard band -->
	<rect x="${ox - BEZEL}" y="${oy - BEZEL - 34}" width="${ow + BEZEL * 2}" height="${BEZEL + 34}" rx="8" fill="url(#jaw)"/>
	<rect x="${ox - BEZEL}" y="${oy + oh}" width="${ow + BEZEL * 2}" height="${BEZEL + 34}" rx="8" fill="url(#jaw)"/>
	${hazard('hzTop', ox - BEZEL + 12, oy - 26, ow + BEZEL * 2 - 24, 15)}
	${hazard('hzBot', ox - BEZEL + 12, oy + oh + 12, ow + BEZEL * 2 - 24, 15)}

	<!-- side rails, plain so the eye is not pulled sideways off the board -->
	<rect x="${ox - BEZEL}" y="${oy - BEZEL}" width="${BEZEL}" height="${oh + BEZEL * 2}" fill="url(#jaw)"/>
	<rect x="${ox + ow}" y="${oy - BEZEL}" width="${BEZEL}" height="${oh + BEZEL * 2}" fill="url(#jaw)"/>

	<!-- inner lip: a thin bright edge so the recess reads as depth, not as a hole -->
	<rect x="${ox - 3}" y="${oy - 3}" width="${ow + 6}" height="${oh + 6}" rx="10" fill="none" stroke="#79858f" stroke-width="3" opacity="0.7"/>
	<rect x="${ox + 3}" y="${oy + 3}" width="${ow - 6}" height="${oh - 6}" rx="8" fill="none" stroke="#000000" stroke-width="6" opacity="0.55"/>`;
};

const sceneSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<defs>${DEFS}</defs>

	<rect width="${W}" height="${H}" fill="url(#sky)"/>
	${corrugation(0, 0, W, 470, 38)}
	<rect x="0" y="452" width="${W}" height="26" fill="#12171c"/>

	<!-- gantry rail and a claw silhouette. Pushed to the far left: centred, the
	     machine body covers it completely, which is how the first pass shipped a
	     crane nobody could see. -->
	<rect x="0" y="96" width="${W}" height="20" fill="#0f151a"/>
	<rect x="0" y="116" width="${W}" height="4" fill="#8d99a3" opacity="0.12"/>
	<g opacity="0.92" fill="#0e141a">
		<rect x="112" y="116" width="14" height="120"/>
		<path d="M56 236 l63 -22 l63 22 l-25 86 l-18 -54 l-20 68 l-20 -68 l-18 54 z"/>
	</g>

	<!-- floor -->
	<rect x="0" y="${H - 300}" width="${W}" height="300" fill="#1b2026"/>
	${scrapHeap(H - 190, 1.15, 160, '#222931', '#5b656d', 0.95)}
	${scrapHeap(H - 96, 1.4, 200, '#10151a', '#3a4249', 0.95)}

	<!-- the one warm light: a sodium lamp low and far right, away from the board
	     and from the gauge that sits above it -->
	<ellipse cx="${W - 190}" cy="${H - 168}" rx="300" ry="200" fill="url(#sodium)"/>
	<g filter="url(#soft)"><circle cx="${W - 190}" cy="${H - 214}" r="34" fill="#ffcb7a" opacity="0.9"/></g>
	<!-- Its pool on the wet floor. An ellipse, and drawn BEFORE the housing: as a
	     rect after it, its hard left edge cut straight across the machine body. -->
	<g filter="url(#soft)">
		<ellipse cx="${W - 210}" cy="${H - 72}" rx="330" ry="62" fill="#ffb457" opacity="0.22"/>
	</g>

	${housing()}

	<!-- overall grain, last, so nothing looks vector-clean -->
	<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.85"/>
</svg>`;

const svg = sceneSvg();
if (process.env.DUMP_SVG) fs.writeFileSync(path.join(OUT, 'bg_background.svg'), svg);
const png = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true } })
	.render()
	.asPng();
fs.writeFileSync(path.join(OUT, 'bg_background.png'), png);

console.log(`wrote ${path.join(OUT, 'bg_background.png')}  ${W}x${H}`);
console.log(`  opening: x=${OPEN_X} y=${OPEN_Y} w=${OPEN_W} h=${OPEN_H}  (ratio ${(OPEN_W / OPEN_H).toFixed(3)})`);
console.log('  BoardFrame.svelte SCENE/OPENING must match these exactly.');
