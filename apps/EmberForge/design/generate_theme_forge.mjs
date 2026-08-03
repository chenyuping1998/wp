// Ember Forge environment art: backgrounds, the reel housing, and the two
// hanging iron panels the free game uses.
//
// The governing constraint is that this game paints information onto the board
// itself — the heat grid runs the whole warm end of the palette, from dark red
// to white. So the room around the board is built almost entirely out of cold
// greys and browns, and its only warm light is the furnace, which sits low and
// off-centre where it cannot be confused with a hot cell. The base scene is
// deliberately dim: the free game brightening the room IS the feature's
// announcement.
//
// Usage: node design/generate_theme_forge.mjs <dir with node_modules for @resvg/resvg-js>
//   DUMP_SVG=1 writes the raw SVG next to the PNG for debugging.
//
// resvg note: keep every filter region within about ±200%. Larger regions make
// it panic outright rather than clip.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { surfaceDefs, finishRect, BRASS_FINISH, BACKDROP_FINISH } from './surface.mjs';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_theme_forge.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BG_OUT = path.join(appRoot, 'static/assets/sprites/emberForgeBackground');
const FRAME_OUT = path.join(appRoot, 'static/assets/sprites/emberForgeFrame');
fs.mkdirSync(BG_OUT, { recursive: true });
fs.mkdirSync(FRAME_OUT, { recursive: true });

const render = (svg, dir, name, width) => {
	if (process.env.DUMP_SVG) fs.writeFileSync(path.join(dir, `${name}.svg`), svg);
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: width },
		font: { loadSystemFonts: true },
	});
	fs.writeFileSync(path.join(dir, `${name}.png`), resvg.render().asPng());
	console.log('rendered', path.basename(dir) + '/' + name + '.png');
};

// ── deterministic jitter ────────────────────────────────────────────────────
// Seeded rather than Math.random so re-running the generator produces the same
// art; an asset that changes every build is impossible to review.
let seed = 20260802;
const rnd = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
};
const between = (a, b) => a + rnd() * (b - a);

// ═══════════════════════════════════════════════════════════════════════════
// Backgrounds — 1920x1080
// ═══════════════════════════════════════════════════════════════════════════

const BG_W = 1920;
const BG_H = 1080;

/** Rough stone block wall. Courses are offset and each block is jittered, so it
 *  never reads as a tiled pattern. */
const stoneWall = (yTop, yBottom, blockW, blockH, tone) => {
	const out = [];
	let row = 0;
	for (let y = yTop; y < yBottom; y += blockH, row += 1) {
		const offset = row % 2 === 0 ? 0 : blockW / 2;
		for (let x = -blockW; x < BG_W + blockW; x += blockW) {
			const w = blockW - between(6, 16);
			const h = blockH - between(5, 12);
			const shade = between(-0.06, 0.06);
			out.push(
				`<rect x="${(x + offset + between(-3, 3)).toFixed(1)}" y="${(y + between(-2, 2)).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${tone}" opacity="${(0.55 + shade).toFixed(2)}"/>`,
			);
		}
	}
	return out.join('');
};

/** Floating embers. Sparse in the base scene, dense in the feature. */
const embers = (count, maxR, opacity) => {
	const out = [];
	for (let i = 0; i < count; i += 1) {
		const x = between(0, BG_W);
		const y = between(BG_H * 0.15, BG_H);
		const r = between(1.5, maxR);
		out.push(
			`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#ffb04a" opacity="${(opacity * between(0.35, 1)).toFixed(2)}"/>`,
		);
	}
	return out.join('');
};

/** Tools hanging on the back wall — silhouettes only, no detail. Depth cue. */
const hangingTools = (baseY) => {
	const out = [];
	const xs = [180, 268, 352, 1580, 1666, 1748];
	for (const x of xs) {
		const len = between(150, 260);
		out.push(
			`<rect x="${x - 7}" y="${baseY}" width="14" height="${len.toFixed(0)}" rx="6" fill="#0d0f12" opacity="0.75"/>
			 <circle cx="${x}" cy="${baseY}" r="13" fill="none" stroke="#0d0f12" stroke-width="8" opacity="0.75"/>
			 <rect x="${x - 30}" y="${(baseY + len - 34).toFixed(0)}" width="60" height="34" rx="8" fill="#0d0f12" opacity="0.75"/>`,
		);
	}
	return out.join('');
};

const backgroundSvg = ({ feature }) => {
	seed = feature ? 991733 : 20260802;
	const furnaceGlow = feature ? 1 : 0.42;
	const roomTint = feature ? '#3a1c0e' : '#171a1f';

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${BG_W}" height="${BG_H}" viewBox="0 0 ${BG_W} ${BG_H}">
	<defs>
		${surfaceDefs('sf')}
		<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${feature ? '#241009' : '#0d0f13'}"/>
			<stop offset="0.55" stop-color="${feature ? '#3d1a0b' : '#161a20'}"/>
			<stop offset="1" stop-color="${feature ? '#160903' : '#0a0c10'}"/>
		</linearGradient>
		<radialGradient id="furnace" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#fff0c0" stop-opacity="${(0.95 * furnaceGlow).toFixed(2)}"/>
			<stop offset="0.25" stop-color="#ff9b32" stop-opacity="${(0.75 * furnaceGlow).toFixed(2)}"/>
			<stop offset="0.6" stop-color="#c23a12" stop-opacity="${(0.35 * furnaceGlow).toFixed(2)}"/>
			<stop offset="1" stop-color="#6e1f0c" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${feature ? '#2a1c14' : '#1b1d22'}"/>
			<stop offset="1" stop-color="#08090c"/>
		</linearGradient>
		<radialGradient id="spill" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#ff8c22" stop-opacity="${(0.3 * furnaceGlow).toFixed(2)}"/>
			<stop offset="0.5" stop-color="#ff7a18" stop-opacity="${(0.12 * furnaceGlow).toFixed(2)}"/>
			<stop offset="1" stop-color="#ff7a18" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
			<stop offset="0.35" stop-color="#000000" stop-opacity="0"/>
			<stop offset="0.78" stop-color="#000000" stop-opacity="0"/>
			<stop offset="1" stop-color="#000000" stop-opacity="0.7"/>
		</linearGradient>
	</defs>

	<rect width="${BG_W}" height="${BG_H}" fill="url(#sky)"/>

	<!-- back wall -->
	<g opacity="0.9">${stoneWall(0, 760, 150, 92, roomTint)}</g>
	<rect width="${BG_W}" height="760" filter="url(#sfGrain)" opacity="0.5"/>
	<rect width="${BG_W}" height="760" filter="url(#sfMottle)" opacity="0.45"/>

	<!-- furnace mouth, low and to the right: the only warm light in the room,
	     kept away from centre so it never reads as a hot board cell -->
	<ellipse cx="1560" cy="720" rx="${feature ? 620 : 470}" ry="${feature ? 470 : 350}" fill="url(#furnace)"/>
	<path d="M 1428 760 L 1450 560 Q 1560 500 1670 560 L 1692 760 Z" fill="#0a0b0e" opacity="0.92"/>
	<path d="M 1452 742 L 1470 585 Q 1560 536 1650 585 L 1668 742 Z" fill="url(#furnace)"/>
	<path d="M 1452 742 L 1470 585 Q 1560 536 1650 585 L 1668 742 Z" filter="url(#sfMottle)" opacity="0.5"/>

	<!-- a second, dimmer glow far left balances the frame without competing -->
	<ellipse cx="250" cy="820" rx="${feature ? 330 : 220}" ry="${feature ? 230 : 160}" fill="url(#furnace)" opacity="0.5"/>

	${hangingTools(120)}

	<!-- floor -->
	<rect y="760" width="${BG_W}" height="${BG_H - 760}" fill="url(#floor)"/>
	<rect y="760" width="${BG_W}" height="${BG_H - 760}" filter="url(#sfGrain)" opacity="0.6"/>
	<!-- Firelight spilling onto the floor. A soft radial, not a flat ellipse: the
	     flat version drew a hard pale disc with a visible edge cutting across the
	     floor line, which read as a mistake rather than as light. -->
	<ellipse cx="1560" cy="880" rx="820" ry="260" fill="url(#spill)"/>

	<!-- anvil silhouette, drawn AFTER the floor so it stands on it. Centre-left
	     and low, well clear of where the board sits. -->
	<g opacity="0.9" transform="translate(560 946)">
		<path d="M -150 0 L 150 0 L 120 44 L 62 60 L 62 128 L 104 150 L 104 176 L -104 176 L -104 150 L -62 128 L -62 60 L -120 44 Z" fill="#080a0d" transform="translate(0 -176)"/>
	</g>

	${embers(feature ? 150 : 55, feature ? 5 : 3.2, feature ? 0.9 : 0.55)}

	<rect width="${BG_W}" height="${BG_H}" fill="url(#vig)"/>
</svg>`;
};

render(backgroundSvg({ feature: false }), BG_OUT, 'bg_base', BG_W);
render(backgroundSvg({ feature: true }), BG_OUT, 'bg_feature', BG_W);

// ═══════════════════════════════════════════════════════════════════════════
// Reel housing — 1280x1280, board occupies the centred 1000x1000
// ═══════════════════════════════════════════════════════════════════════════

const F = 1280;
const INNER = 1000;
const BORDER = (F - INNER) / 2; // 140

const rivets = (inset, step) => {
	const out = [];
	const put = (x, y) =>
		out.push(
			`<circle cx="${x}" cy="${y}" r="11" fill="#20262e"/>
			 <circle cx="${x}" cy="${y}" r="11" fill="url(#sfEdge)"/>
			 <circle cx="${x - 3}" cy="${y - 3}" r="3.5" fill="#c9d4df" opacity="0.5"/>
			 <circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#0c1014" stroke-width="2.5"/>`,
		);
	for (let x = inset; x <= F - inset; x += step) {
		put(x, inset);
		put(x, F - inset);
	}
	for (let y = inset + step; y <= F - inset - step; y += step) {
		put(inset, y);
		put(F - inset, y);
	}
	return out.join('');
};

// The plate the symbols sit on. No specular sweep — a highlight band here would
// compete with the heat grid drawn directly on top of it, which is the one thing
// this surface must not do.
const frameBg = `<svg xmlns="http://www.w3.org/2000/svg" width="${INNER}" height="${INNER}" viewBox="0 0 ${INNER} ${INNER}">
	<defs>${surfaceDefs('sf')}
		<linearGradient id="plate" x1="0" y1="0" x2="0.3" y2="1">
			<stop offset="0" stop-color="#2a2420"/>
			<stop offset="0.5" stop-color="#1e1a17"/>
			<stop offset="1" stop-color="#141210"/>
		</linearGradient>
	</defs>
	<rect width="${INNER}" height="${INNER}" rx="18" fill="url(#plate)"/>
	${finishRect(0, 0, INNER, INNER, 18, 'sf', BACKDROP_FINISH)}
	<!-- faint forge-scale mottling so the plate is not a flat field -->
	<rect width="${INNER}" height="${INNER}" rx="18" filter="url(#sfMottle)" opacity="0.35"/>
</svg>`;
render(frameBg, FRAME_OUT, 'frame_bg', INNER);

const frameEdge = `<svg xmlns="http://www.w3.org/2000/svg" width="${F}" height="${F}" viewBox="0 0 ${F} ${F}">
	<defs>${surfaceDefs('sf')}
		<linearGradient id="cast" x1="0" y1="0" x2="0.2" y2="1">
			<stop offset="0" stop-color="#4a545f"/>
			<stop offset="0.3" stop-color="#2c343d"/>
			<stop offset="0.75" stop-color="#1a2027"/>
			<stop offset="1" stop-color="#10151a"/>
		</linearGradient>
		<linearGradient id="brass" x1="0" y1="0" x2="0.4" y2="1">
			<stop offset="0" stop-color="#f2d18a"/>
			<stop offset="0.35" stop-color="#c9922f"/>
			<stop offset="0.72" stop-color="#8a5c14"/>
			<stop offset="1" stop-color="#5a3a0a"/>
		</linearGradient>
		<!-- knocks out the centre so the board shows through -->
		<mask id="hollow">
			<rect width="${F}" height="${F}" fill="#ffffff"/>
			<rect x="${BORDER}" y="${BORDER}" width="${INNER}" height="${INNER}" rx="18" fill="#000000"/>
		</mask>
	</defs>

	<g mask="url(#hollow)">
		<rect x="6" y="6" width="${F - 12}" height="${F - 12}" rx="34" fill="url(#cast)"/>
		${finishRect(6, 6, F - 12, F - 12, 34, 'sf', { grain: 0.4, brushed: 0.35, scratch: 0.4, mottle: 0.5, spec: 0.55, edge: 1, ao: 0.3 })}

		<!-- brass inlay band, set in from the outer edge -->
		<rect x="${BORDER - 46}" y="${BORDER - 46}" width="${INNER + 92}" height="${INNER + 92}" rx="26"
			fill="none" stroke="url(#brass)" stroke-width="22"/>
		<rect x="${BORDER - 46}" y="${BORDER - 46}" width="${INNER + 92}" height="${INNER + 92}" rx="26"
			fill="none" stroke="#2a1c05" stroke-width="3" opacity="0.7"/>

		${rivets(46, 118)}
	</g>

	<!-- inner lip: a bright brass edge right at the opening, so the board reads
	     as recessed into the housing rather than pasted over it -->
	<rect x="${BORDER - 9}" y="${BORDER - 9}" width="${INNER + 18}" height="${INNER + 18}" rx="22"
		fill="none" stroke="url(#brass)" stroke-width="18"/>
	<rect x="${BORDER - 1}" y="${BORDER - 1}" width="${INNER + 2}" height="${INNER + 2}" rx="18"
		fill="none" stroke="#000000" stroke-width="8" opacity="0.55"/>

	<!-- corner brackets -->
	${[
		[BORDER - 46, BORDER - 46, 1, 1],
		[F - BORDER + 46, BORDER - 46, -1, 1],
		[BORDER - 46, F - BORDER + 46, 1, -1],
		[F - BORDER + 46, F - BORDER + 46, -1, -1],
	]
		.map(
			([x, y, sx, sy]) =>
				`<g transform="translate(${x} ${y}) scale(${sx} ${sy})">
					<path d="M -34 -34 L 122 -34 L 122 12 L 12 12 L 12 122 L -34 122 Z" fill="url(#brass)"/>
					<path d="M -34 -34 L 122 -34 L 122 12 L 12 12 L 12 122 L -34 122 Z" fill="url(#sfSpec)" opacity="0.6"/>
					<path d="M -34 -34 L 122 -34 L 122 12 L 12 12 L 12 122 L -34 122 Z" filter="url(#sfScratch)" opacity="0.5"/>
					<path d="M -34 -34 L 122 -34 L 122 12 L 12 12 L 12 122 L -34 122 Z" fill="none" stroke="#2a1c05" stroke-width="4"/>
					<circle cx="62" cy="-11" r="10" fill="#20262e" stroke="#0c1014" stroke-width="3"/>
					<circle cx="-11" cy="62" r="10" fill="#20262e" stroke="#0c1014" stroke-width="3"/>
				</g>`,
		)
		.join('')}
</svg>`;
render(frameEdge, FRAME_OUT, 'frame_edge', F);

// ═══════════════════════════════════════════════════════════════════════════
// Free-game panels — text is drawn by the client, so these stay language-neutral
// ═══════════════════════════════════════════════════════════════════════════

const ironPanel = (w, h, { hooks = false, brand = false } = {}) => `
	<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
	<defs>${surfaceDefs('sf')}
		<linearGradient id="cast" x1="0" y1="0" x2="0.2" y2="1">
			<stop offset="0" stop-color="#454f5a"/>
			<stop offset="0.35" stop-color="#282f38"/>
			<stop offset="1" stop-color="#141a20"/>
		</linearGradient>
		<linearGradient id="brass" x1="0" y1="0" x2="0.4" y2="1">
			<stop offset="0" stop-color="#f2d18a"/>
			<stop offset="0.4" stop-color="#c9922f"/>
			<stop offset="1" stop-color="#6b4510"/>
		</linearGradient>
		<radialGradient id="heat" cx="0.5" cy="1" r="0.9">
			<stop offset="0" stop-color="#ff7a18" stop-opacity="0.4"/>
			<stop offset="1" stop-color="#ff7a18" stop-opacity="0"/>
		</radialGradient>
	</defs>
	${
		hooks
			? `<g stroke="#1a1f26" stroke-width="14" fill="none" stroke-linecap="round">
					<path d="M ${w * 0.24} 8 L ${w * 0.24} ${h * 0.16}"/>
					<path d="M ${w * 0.76} 8 L ${w * 0.76} ${h * 0.16}"/>
				</g>`
			: ''
	}
	<rect x="${w * 0.04}" y="${h * 0.14}" width="${w * 0.92}" height="${h * 0.8}" rx="${h * 0.09}" fill="url(#cast)"/>
	${finishRect(w * 0.04, h * 0.14, w * 0.92, h * 0.8, h * 0.09, 'sf', { grain: 0.4, brushed: 0.4, scratch: 0.4, mottle: 0.5, spec: 0.5, edge: 1, ao: 0.4 })}
	<rect x="${w * 0.04}" y="${h * 0.14}" width="${w * 0.92}" height="${h * 0.8}" rx="${h * 0.09}" fill="url(#heat)"/>
	<rect x="${w * 0.065}" y="${h * 0.185}" width="${w * 0.87}" height="${h * 0.71}" rx="${h * 0.07}"
		fill="none" stroke="url(#brass)" stroke-width="${h * 0.035}"/>
	<rect x="${w * 0.04}" y="${h * 0.14}" width="${w * 0.92}" height="${h * 0.8}" rx="${h * 0.09}"
		fill="none" stroke="#0c1014" stroke-width="${h * 0.02}"/>
	${[
		[w * 0.105, h * 0.245],
		[w * 0.895, h * 0.245],
		[w * 0.105, h * 0.845],
		[w * 0.895, h * 0.845],
	]
		.map(
			([x, y]) =>
				`<circle cx="${x}" cy="${y}" r="${h * 0.028}" fill="#20262e" stroke="#0c1014" stroke-width="3"/>`,
		)
		.join('')}
	${
		brand
			? `<g fill="none" stroke="url(#brass)" stroke-width="${h * 0.028}" stroke-linecap="round" opacity="0.8">
					<path d="M ${w * 0.44} ${h * 0.3} L ${w * 0.5} ${h * 0.24} L ${w * 0.56} ${h * 0.3}"/>
				</g>`
			: ''
	}
</svg>`;

render(ironPanel(1024, 512, { hooks: true, brand: true }), FRAME_OUT, 'fs_sign', 1024);
render(ironPanel(512, 320), FRAME_OUT, 'fs_counter_panel', 512);

console.log('\ntheme art complete');
