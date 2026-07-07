// WildParty party-themed presentation assets — replaces the Money Mine template
// spines (mm_bigwin / fs_screen) with SVG-generated banners, panels and radials
// plus pixi-spine 4.1 JSON skeletons exposing the SAME animation/slot interface.
// Usage: node design/generate_presentation.mjs <dir containing node_modules with @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_presentation.mjs <dir containing node_modules with @resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIGWIN_DIR = path.join(appRoot, 'static/assets/spines/bigwinParty');
const FS_DIR = path.join(appRoot, 'static/assets/spines/fsIntroParty');
fs.mkdirSync(BIGWIN_DIR, { recursive: true });
fs.mkdirSync(FS_DIR, { recursive: true });

const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

const render = (svg, outPath, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } });
	fs.writeFileSync(outPath, resvg.render().asPng());
	console.log('rendered', path.basename(outPath));
};

const sparkle = (x, y, s, color = '#fff8d0') =>
	`<path d="M ${x} ${y - 8 * s} Q ${x + 2 * s} ${y - 2 * s} ${x + 8 * s} ${y} Q ${x + 2 * s} ${y + 2 * s} ${x} ${y + 8 * s} Q ${x - 2 * s} ${y + 2 * s} ${x - 8 * s} ${y} Q ${x - 2 * s} ${y - 2 * s} ${x} ${y - 8 * s} Z" fill="${color}" opacity="0.95"/>`;

// ─── big win banners (1080×300) ─────────────────────────────────────────────
const banner = ({ label, rib0, rib1, text0, text1, sparkles }) => {
	const clipId = `capclip_${text0.replace('#', '')}`;
	return svgWrap(
		1080,
		300,
		`
	<!-- ribbon tails -->
	<path d="M 60 92 L 6 150 L 60 208 L 96 208 L 96 92 Z" fill="${rib1}" stroke="#2a0a20" stroke-width="8" stroke-linejoin="round"/>
	<path d="M 1020 92 L 1074 150 L 1020 208 L 984 208 L 984 92 Z" fill="${rib1}" stroke="#2a0a20" stroke-width="8" stroke-linejoin="round"/>
	<!-- ribbon body with a gentle arc -->
	<path d="M 84 84 Q 540 44 996 84 L 996 216 Q 540 256 84 216 Z"
		fill="url(#rib)" stroke="#2a0a20" stroke-width="10" stroke-linejoin="round"/>
	<path d="M 100 98 Q 540 62 980 98" stroke="#ffffff" stroke-width="6" fill="none" opacity="0.35" stroke-linecap="round"/>
	<path d="M 96 92 Q 540 52 984 92 L 984 104 Q 540 64 96 104 Z" fill="url(#trimTop)" opacity="0.9"/>
	<path d="M 96 196 Q 540 236 984 196 L 984 208 Q 540 248 96 208 Z" fill="url(#trimTop)" opacity="0.9"/>
	<!-- deep drop shadow, offset further for more lift off the ribbon -->
	<text x="540" y="203" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="132"
		text-anchor="middle" letter-spacing="1" fill="#150510" opacity="0.5">${label}</text>
	<!-- wide dark halo sitting behind the glyph, reads as embossed thickness -->
	<text x="540" y="196" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="132"
		text-anchor="middle" letter-spacing="1" fill="none" stroke="#180614" stroke-width="17" stroke-linejoin="round" opacity="0.9">${label}</text>
	<!-- art text -->
	<text x="540" y="196" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="132"
		text-anchor="middle" letter-spacing="1" fill="url(#txt)" stroke="#2a0a20" stroke-width="9" paint-order="stroke">${label}</text>
	<text x="540" y="196" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="132"
		text-anchor="middle" letter-spacing="1" fill="url(#txtShine)">${label}</text>
	<!-- crisp catch-light band clipped to the glyphs' cap-height, for a pillowy emboss -->
	<g clip-path="url(#${clipId})">
		<text x="540" y="196" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="132"
			text-anchor="middle" letter-spacing="1" fill="#ffffff" opacity="0.5">${label}</text>
	</g>
	${sparkles}
	`,
		`<linearGradient id="rib" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${rib0}"/><stop offset="1" stop-color="${rib1}"/>
		</linearGradient>
		<linearGradient id="trimTop" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffe98a"/><stop offset="1" stop-color="#d99b23"/>
		</linearGradient>
		<linearGradient id="txt" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="${text0}"/><stop offset="1" stop-color="${text1}"/>
		</linearGradient>
		<linearGradient id="txtShine" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffffff" stop-opacity="0.7"/>
			<stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
			<stop offset="1" stop-color="#000000" stop-opacity="0.15"/>
		</linearGradient>
		<clipPath id="${clipId}">
			<rect x="0" y="90" width="1080" height="48"/>
		</clipPath>`,
	);
};

// ─── shared win-amount readout plaque (940×210) — sits behind the count-up ──
const countPlaque = svgWrap(
	940,
	210,
	`
	<rect x="20" y="20" width="900" height="170" rx="85" fill="url(#plaqBg2)" stroke="#2a0a20" stroke-width="9"/>
	<rect x="34" y="34" width="872" height="142" rx="71" fill="none" stroke="url(#plaqGold2)" stroke-width="8"/>
	<rect x="46" y="45" width="848" height="120" rx="60" fill="none" stroke="#ff8ede" stroke-width="2" opacity="0.4"/>
	<path d="M 46 50 Q 470 20 894 50" stroke="#ffffff" stroke-width="4" fill="none" opacity="0.25" stroke-linecap="round"/>
	${sparkle(70, 105, 1.1)}
	${sparkle(870, 105, 1.1, '#ff8ede')}
	`,
	`<linearGradient id="plaqBg2" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3d1245"/><stop offset="1" stop-color="#1d0b30"/>
	</linearGradient>
	<linearGradient id="plaqGold2" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="1" stop-color="#b8791a"/>
	</linearGradient>`,
);

// ─── shared "opulence" pile (1200×420) — gifts/confetti/balloons peeking out
// from behind the banner, standing in for the reference jackpot art's coin pile
const pileDecoration = svgWrap(
	1200,
	420,
	`
	<path d="M 40 340 Q 140 200 60 80" stroke="#ffd75e" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.85"/>
	<path d="M 1160 340 Q 1060 200 1140 80" stroke="#ff8ede" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.85"/>
	<g>
		<ellipse cx="120" cy="150" rx="46" ry="58" fill="url(#balloonA)" stroke="#2a0a20" stroke-width="6"/>
		<path d="M 120 208 L 120 250" stroke="#2a0a20" stroke-width="4"/>
		<ellipse cx="104" cy="128" rx="12" ry="18" fill="#ffffff" opacity="0.35" transform="rotate(-20 104 128)"/>
	</g>
	<g>
		<ellipse cx="1080" cy="150" rx="46" ry="58" fill="url(#balloonB)" stroke="#2a0a20" stroke-width="6"/>
		<path d="M 1080 208 L 1080 250" stroke="#2a0a20" stroke-width="4"/>
		<ellipse cx="1064" cy="128" rx="12" ry="18" fill="#ffffff" opacity="0.35" transform="rotate(-20 1064 128)"/>
	</g>
	<!-- confetti dots kept in the top margin strip (pile-y < ~95), well clear
	     of the ribbon's silhouette (which reaches up to pile-y 104 at center)
	     so nothing floats over the "WIN" label -->
	${[
		[180, 45, '#9ef3ff'],
		[1020, 40, '#ffd75e'],
		[420, 55, '#ff8ede'],
		[780, 42, '#c59bff'],
		[600, 30, '#9effb0'],
		[300, 50, '#ffb64d'],
	]
		.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#2a0a20" stroke-width="2.5"/>`)
		.join('')}
	`,
	`<linearGradient id="balloonA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ede"/><stop offset="1" stop-color="#d02f8f"/></linearGradient>
	<linearGradient id="balloonB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ef3ff"/><stop offset="1" stop-color="#2f7bd0"/></linearGradient>
	`,
);

const sparklesFor = (n, seedInit) => {
	let seed = seedInit;
	const rand = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};
	let out = '';
	for (let i = 0; i < n; i++) {
		out += sparkle(70 + rand() * 940, 50 + rand() * 200, 0.9 + rand() * 1.4, i % 2 ? '#fff8d0' : '#ffd0ef');
	}
	return out;
};

const BANNERS = {
	banner_big: banner({ label: 'BIG WIN', rib0: '#e2679b', rib1: '#8f2555', text0: '#ffe066', text1: '#e8930c', sparkles: sparklesFor(4, 11) }),
	banner_super: banner({ label: 'SUPER WIN', rib0: '#d84fd4', rib1: '#6d1a8f', text0: '#ffd43b', text1: '#f0640c', sparkles: sparklesFor(5, 23) }),
	banner_mega: banner({ label: 'MEGA WIN', rib0: '#9a4fe0', rib1: '#3c1a8f', text0: '#ff9ede', text1: '#d02f8f', sparkles: sparklesFor(6, 37) }),
	banner_epic: banner({ label: 'EPIC WIN!', rib0: '#4f64e0', rib1: '#1a2a8f', text0: '#9ef3ff', text1: '#2f7bd0', sparkles: sparklesFor(7, 51) }),
	banner_max: banner({ label: 'MAX WIN', rib0: '#3a2a52', rib1: '#160a28', text0: '#fff7d1', text1: '#f0a90c', sparkles: sparklesFor(9, 67) }),
};

// ─── fs intro art ───────────────────────────────────────────────────────────
// radial burst (1024×1024) — alternating wedges + soft core, tinted per variant
const radialBurst = (c0, c1) => {
	let wedges = '';
	const count = 16;
	for (let i = 0; i < count; i++) {
		const a0 = (i / count) * Math.PI * 2;
		const a1 = a0 + Math.PI / count;
		const r = 500;
		wedges += `<path d="M 512 512 L ${512 + Math.cos(a0) * r} ${512 + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${512 + Math.cos(a1) * r} ${512 + Math.sin(a1) * r} Z" fill="${i % 2 ? c0 : c1}" opacity="${i % 2 ? 0.55 : 0.3}"/>`;
	}
	return svgWrap(
		1024,
		1024,
		`${wedges}
		<circle cx="512" cy="512" r="360" fill="url(#core)"/>`,
		`<radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="${c0}" stop-opacity="0.9"/>
			<stop offset="0.6" stop-color="${c0}" stop-opacity="0.25"/>
			<stop offset="1" stop-color="${c0}" stop-opacity="0"/>
		</radialGradient>`,
	);
};

// party panel (920×720) — dark stage panel, gold trim, bunting + disco balls
const fsPanel = svgWrap(
	920,
	720,
	`
	<rect x="40" y="40" width="840" height="640" rx="46" fill="url(#panelBg)" stroke="#2a0a20" stroke-width="12"/>
	<rect x="58" y="58" width="804" height="604" rx="36" fill="none" stroke="url(#gold)" stroke-width="10"/>
	<rect x="76" y="76" width="768" height="568" rx="28" fill="none" stroke="#ff8ede" stroke-width="3" opacity="0.5"/>
	<!-- bunting across the top -->
	<path d="M 80 78 Q 460 148 840 78" stroke="#2a0a20" stroke-width="6" fill="none"/>
	${[0, 1, 2, 3, 4, 5, 6]
		.map((i) => {
			const t = i / 6;
			const x = 110 + t * 700;
			const y = 84 + Math.sin(Math.PI * t) * 62;
			const colors = ['#ffd75e', '#ff8ede', '#9ef3ff', '#c59bff', '#9effb0', '#ffb64d', '#ff7a7a'];
			return `<path d="M ${x - 26} ${y} L ${x + 26} ${y} L ${x} ${y + 44} Z" fill="${colors[i]}" stroke="#2a0a20" stroke-width="5" stroke-linejoin="round"/>`;
		})
		.join('')}
	<!-- disco balls hanging in the top corners -->
	${[150, 770]
		.map(
			(x) => `
		<path d="M ${x} 40 L ${x} 92" stroke="#2a0a20" stroke-width="6"/>
		<circle cx="${x}" cy="128" r="40" fill="url(#ball)" stroke="#2a0a20" stroke-width="7"/>
		<path d="M ${x - 40} 116 Q ${x} 104 ${x + 40} 116 M ${x - 40} 140 Q ${x} 152 ${x + 40} 140 M ${x - 13} 90 L ${x - 13} 166 M ${x + 13} 90 L ${x + 13} 166"
			stroke="#7a7f9e" stroke-width="3.5" fill="none" opacity="0.8"/>
		<ellipse cx="${x - 14}" cy="112" rx="12" ry="7" fill="#ffffff" opacity="0.75" transform="rotate(-18 ${x - 14} 112)"/>`,
		)
		.join('')}
	<!-- footer stars -->
	${sparkle(140, 620, 1.4)}
	${sparkle(780, 620, 1.4)}
	${sparkle(460, 646, 1.1, '#ff8ede')}
	`,
	`<linearGradient id="panelBg" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#3d1245"/><stop offset="0.55" stop-color="#251035"/><stop offset="1" stop-color="#180a28"/>
	</linearGradient>
	<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="1" stop-color="#b8791a"/>
	</linearGradient>
	<radialGradient id="ball" cx="0.38" cy="0.32" r="1">
		<stop offset="0" stop-color="#f4f6ff"/><stop offset="0.6" stop-color="#c3c9e8"/><stop offset="1" stop-color="#8b91b5"/>
	</radialGradient>`,
);

// number plaque (520×390) — gold-trimmed badge behind the free-spin counter.
// Carries the same bunting-string motif as fsPanel (scaled down) so the two
// layers read as one matched set instead of two different production passes.
const numberRing = svgWrap(
	520,
	390,
	`
	<rect x="30" y="40" width="460" height="310" rx="60" fill="url(#plaqBg)" stroke="#2a0a20" stroke-width="12"/>
	<rect x="48" y="58" width="424" height="274" rx="48" fill="none" stroke="url(#plaqGold)" stroke-width="10"/>
	<rect x="62" y="72" width="396" height="246" rx="38" fill="none" stroke="#ff8ede" stroke-width="2.5" opacity="0.5"/>
	<!-- bunting across the top, same palette/hand as fsPanel -->
	<path d="M 70 62 Q 260 100 450 62" stroke="#2a0a20" stroke-width="4" fill="none"/>
	${[0, 1, 2, 3, 4]
		.map((i) => {
			const t = i / 4;
			const x = 90 + t * 340;
			const y = 66 + Math.sin(Math.PI * t) * 32;
			const colors = ['#ffd75e', '#ff8ede', '#9ef3ff', '#c59bff', '#9effb0'];
			return `<path d="M ${x - 15} ${y} L ${x + 15} ${y} L ${x} ${y + 26} Z" fill="${colors[i]}" stroke="#2a0a20" stroke-width="3.5" stroke-linejoin="round"/>`;
		})
		.join('')}
	<!-- mini disco ball charms bottom corners, echoing fsPanel's hanging balls -->
	${[80, 440]
		.map(
			(x) => `
		<circle cx="${x}" cy="336" r="16" fill="url(#ball)" stroke="#2a0a20" stroke-width="3.5"/>
		<path d="M ${x - 16} 330 Q ${x} 324 ${x + 16} 330 M ${x - 5} 320 L ${x - 5} 352 M ${x + 5} 320 L ${x + 5} 352"
			stroke="#7a7f9e" stroke-width="1.6" fill="none" opacity="0.8"/>
		<ellipse cx="${x - 6}" cy="328" rx="5" ry="3" fill="#ffffff" opacity="0.75"/>`,
		)
		.join('')}
	${sparkle(70, 70, 1.3)}
	${sparkle(452, 320, 1.3)}
	${sparkle(452, 72, 1, '#ff8ede')}
	${sparkle(72, 318, 1, '#ff8ede')}`,
	`<linearGradient id="plaqBg" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#47164f"/><stop offset="1" stop-color="#1d0b30"/>
	</linearGradient>
	<linearGradient id="plaqGold" x1="0" y1="0" x2="0" y2="1">
		<stop offset="0" stop-color="#ffe98a"/><stop offset="0.5" stop-color="#e8a33d"/><stop offset="1" stop-color="#b8791a"/>
	</linearGradient>
	<radialGradient id="ball" cx="0.38" cy="0.32" r="1">
		<stop offset="0" stop-color="#f4f6ff"/><stop offset="0.6" stop-color="#c3c9e8"/><stop offset="1" stop-color="#8b91b5"/>
	</radialGradient>`,
);

// 8×8 fully transparent anchor for slot-object placeholders
const anchor = svgWrap(8, 8, '<rect width="8" height="8" fill="#000000" fill-opacity="0"/>');

// ─── render art ─────────────────────────────────────────────────────────────
for (const [name, svg] of Object.entries(BANNERS)) render(svg, path.join(BIGWIN_DIR, `${name}.png`), 1080);
render(anchor, path.join(BIGWIN_DIR, 'anchor.png'), 8);
render(countPlaque, path.join(BIGWIN_DIR, 'count_plaque.png'), 940);
render(pileDecoration, path.join(BIGWIN_DIR, 'pile.png'), 1200);
render(radialBurst('#ff5ec4', '#8f3ce0'), path.join(FS_DIR, 'radial_pink.png'), 1024);
render(radialBurst('#ffd75e', '#4fd0e0'), path.join(FS_DIR, 'radial_gold.png'), 1024);
render(fsPanel, path.join(FS_DIR, 'fs_panel.png'), 920);
render(numberRing, path.join(FS_DIR, 'number_ring.png'), 520);
render(anchor, path.join(FS_DIR, 'anchor.png'), 8);

// ─── atlas helpers ──────────────────────────────────────────────────────────
const atlasPage = (png, w, h, region) => `${png}
size:${w},${h}
format:RGBA8888
filter:Linear,Linear
repeat:none
${region}
bounds:0,0,${w},${h}
offsets:0,0,${w},${h}
index:-1
`;

// ─── bigwin spine (animation/slot interface matches mm_bigwin) ──────────────
const ALIASES = ['big', 'super', 'mega', 'epic', 'max'];

const bigwinAnimations = {};
for (const alias of ALIASES) {
	const att = `banner_${alias}`;
	bigwinAnimations[`${alias}_win_intro`] = {
		slots: {
			banner: {
				attachment: [{ time: 0, name: att }],
				rgba: [
					{ time: 0, color: 'ffffff00' },
					{ time: 0.12, color: 'ffffffff' },
				],
			},
			pile: {
				attachment: [{ time: 0, name: 'pile' }],
				rgba: [
					{ time: 0, color: 'ffffff00' },
					{ time: 0.16, color: 'ffffffff' },
				],
			},
		},
		bones: {
			banner: {
				scale: [
					{ time: 0, x: 0.01, y: 0.01 },
					{ time: 0.24, x: 1.16, y: 1.16 },
					{ time: 0.4, x: 0.94, y: 0.94 },
					{ time: 0.52, x: 1.04, y: 1.04 },
					{ time: 0.6667, x: 1, y: 1 },
				],
				rotate: [
					{ time: 0, value: -6 },
					{ time: 0.3, value: 3 },
					{ time: 0.6667, value: 0 },
				],
			},
			slot_win_count: {
				scale: [
					{ time: 0, x: 0.01, y: 0.01 },
					{ time: 0.3, x: 0.01, y: 0.01 },
					{ time: 0.5, x: 1.12, y: 1.12 },
					{ time: 0.6667, x: 1, y: 1 },
				],
			},
		},
	};
	bigwinAnimations[`${alias}_win_idle`] = {
		slots: {
			banner: { attachment: [{ time: 0, name: att }] },
			pile: { attachment: [{ time: 0, name: 'pile' }] },
		},
		bones: {
			banner: {
				translate: [
					{ time: 0, x: 0, y: 0 },
					{ time: 1.3, x: 0, y: 14 },
					{ time: 2.6, x: 0, y: 0 },
				],
				rotate: [
					{ time: 0, value: -1.4 },
					{ time: 1.3, value: 1.4 },
					{ time: 2.6, value: -1.4 },
				],
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 1.3, x: 1.025, y: 1.025 },
					{ time: 2.6, x: 1, y: 1 },
				],
			},
			slot_win_count: {
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 1.3, x: 1.04, y: 1.04 },
					{ time: 2.6, x: 1, y: 1 },
				],
			},
		},
	};
	bigwinAnimations[`${alias}_win_exit`] = {
		slots: {
			banner: {
				attachment: [{ time: 0, name: att }],
				rgba: [
					{ time: 0, color: 'ffffffff' },
					{ time: 0.35, color: 'ffffff00' },
				],
			},
			pile: {
				attachment: [{ time: 0, name: 'pile' }],
				rgba: [
					{ time: 0, color: 'ffffffff' },
					{ time: 0.35, color: 'ffffff00' },
				],
			},
		},
		bones: {
			banner: {
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.35, x: 1.3, y: 1.3 },
				],
			},
			slot_win_count: {
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.35, x: 0.01, y: 0.01 },
				],
			},
		},
	};
}

const bannerSkin = {};
for (const alias of ALIASES) {
	bannerSkin[`banner_${alias}`] = { x: 0, y: 0, width: 1080, height: 300 };
}

const bigwinSpine = {
	skeleton: { hash: 'wp-bigwin-party', spine: '4.1.20', x: -600, y: -400, width: 1200, height: 800, images: './' },
	bones: [
		{ name: 'root' },
		// banner sits at screen center; the symbol scene floats well above it and
		// the count-up lands below (slot_win_count children are provider-scaled 0.5)
		{ name: 'banner', parent: 'root', y: 0 },
		// opulence pile shares the banner's center so its taller/wider art peeks
		// out from behind the banner's edges instead of needing separate tuning
		{ name: 'pile', parent: 'root', y: 0 },
		{ name: 'slot_win_count', parent: 'root', y: -140 },
	],
	slots: [
		{ name: 'pile', bone: 'pile' },
		{ name: 'banner', bone: 'banner' },
		{ name: 'slot_win_count', bone: 'slot_win_count', attachment: 'anchor' },
	],
	skins: [
		{
			name: 'default',
			attachments: {
				pile: { pile: { x: 0, y: 0, width: 1200, height: 420 } },
				banner: bannerSkin,
				slot_win_count: { anchor: { x: 0, y: 0, width: 8, height: 8 } },
			},
		},
	],
	animations: bigwinAnimations,
};

let bigwinAtlas = '';
for (const alias of ALIASES) bigwinAtlas += atlasPage(`banner_${alias}.png`, 1080, 300, `banner_${alias}`) + '\n';
bigwinAtlas += atlasPage('pile.png', 1200, 420, 'pile') + '\n';
bigwinAtlas += atlasPage('anchor.png', 8, 8, 'anchor');
fs.writeFileSync(path.join(BIGWIN_DIR, 'bigwin_party.atlas'), bigwinAtlas);
fs.writeFileSync(path.join(BIGWIN_DIR, 'bigwin_party.json'), JSON.stringify(bigwinSpine, null, 2) + '\n');

// ─── fs_screen spine (interface: intro/idle + slot_text_placeholder) ────────
const fsScreenSpine = {
	skeleton: { hash: 'wp-fs-party', spine: '4.1.20', x: -927, y: -931, width: 1854, height: 1862, images: './' },
	bones: [
		{ name: 'root' },
		{ name: 'radialA', parent: 'root' },
		{ name: 'radialB', parent: 'root' },
		{ name: 'fs_popup', parent: 'root', scaleX: 1.3, scaleY: 1.3 },
		{ name: 'FS_Frame_A', parent: 'fs_popup' },
	],
	slots: [
		{ name: 'radialA', bone: 'radialA', attachment: 'radial_pink', blend: 'additive' },
		{ name: 'radialB', bone: 'radialB', attachment: 'radial_gold', blend: 'additive' },
		{ name: 'panel', bone: 'FS_Frame_A', attachment: 'fs_panel' },
		{ name: 'slot_text_placeholder', bone: 'FS_Frame_A', attachment: 'anchor' },
	],
	skins: [
		{
			name: 'default',
			attachments: {
				radialA: { radial_pink: { scaleX: 1.8, scaleY: 1.8, width: 1024, height: 1024 } },
				radialB: { radial_gold: { scaleX: 1.5, scaleY: 1.5, width: 1024, height: 1024 } },
				panel: { fs_panel: { scaleX: 0.7, scaleY: 0.7, width: 920, height: 720 } },
				slot_text_placeholder: { anchor: { x: 1.6, y: -1.9, width: 8, height: 8 } },
			},
		},
	],
	animations: {
		intro: {
			slots: {
				radialA: {
					rgba: [
						{ time: 0, color: 'ffffff00' },
						{ time: 0.6667, color: 'ffffff96' },
					],
				},
				radialB: {
					rgba: [
						{ time: 0, color: 'ffffff00' },
						{ time: 0.6667, color: 'ffffff64' },
					],
				},
				panel: {
					rgba: [
						{ time: 0, color: 'ffffff00' },
						{ time: 0.2333, color: 'ffffffff' },
					],
				},
			},
			bones: {
				radialA: {
					scale: [
						{ time: 0, x: 0.3, y: 0.3 },
						{ time: 0.6667, x: 1, y: 1 },
					],
					rotate: [
						{ time: 0, value: -8 },
						{ time: 0.6667, value: 0 },
					],
				},
				radialB: {
					scale: [
						{ time: 0, x: 0.3, y: 0.3 },
						{ time: 0.6667, x: 1, y: 1 },
					],
					rotate: [
						{ time: 0, value: 6 },
						{ time: 0.6667, value: 0 },
					],
				},
				FS_Frame_A: {
					scale: [
						{ time: 0, x: 0.03, y: 0.03 },
						{ time: 0.2667, x: 1.1, y: 1.1 },
						{ time: 0.5333, x: 0.96, y: 0.96 },
						{ time: 0.6667, x: 1, y: 1 },
					],
				},
			},
		},
		idle: {
			slots: {
				radialA: {
					rgba: [
						{ time: 0, color: 'ffffff96' },
						{ time: 1.4, color: 'ffffff50' },
						{ time: 2.8, color: 'ffffff96' },
					],
				},
				radialB: {
					rgba: [
						{ time: 0, color: 'ffffff32' },
						{ time: 1.4, color: 'ffffff78' },
						{ time: 2.8, color: 'ffffff32' },
					],
				},
			},
			bones: {
				radialA: {
					rotate: [
						{ time: 0, value: 0 },
						{ time: 1.4, value: 7 },
						{ time: 2.8, value: 0 },
					],
				},
				radialB: {
					rotate: [
						{ time: 0, value: 0 },
						{ time: 1.4, value: -5 },
						{ time: 2.8, value: 0 },
					],
				},
				FS_Frame_A: {
					scale: [
						{ time: 0, x: 1, y: 1 },
						{ time: 1.4, x: 1.02, y: 1.02 },
						{ time: 2.8, x: 1, y: 1 },
					],
				},
			},
		},
	},
};

// ─── fs number spines (plaque + count / count only) ─────────────────────────
const numberIntroScale = [
	{ time: 0, x: 0.005, y: 0.005 },
	{ time: 0.3333, x: 1.5, y: 1.5 },
	{ time: 0.5333, x: 1.2, y: 1.2 },
	{ time: 0.6667, x: 1, y: 1 },
];
const numberIdle = {
	translate: [
		{ time: 0, x: 0, y: 0 },
		{ time: 1.4667, x: 0, y: 4.5 },
		{ time: 2.8, x: 0, y: 0 },
	],
	scale: [
		{ time: 0, x: 1, y: 1 },
		{ time: 1.4667, x: 1.2, y: 1.2 },
		{ time: 2.8, x: 1, y: 1 },
	],
};

const fsNumberSpine = {
	skeleton: { hash: 'wp-fsnum-party', spine: '4.1.20', x: -130, y: -141, width: 260, height: 195, images: './' },
	bones: [
		{ name: 'root' },
		{ name: 'fs_popup', parent: 'root', scaleX: 1.3, scaleY: 1.3 },
		{ name: 'plaque', parent: 'fs_popup', y: -33 },
		// y nudged from the original -30 so the number clears the plaque's
		// bunting decoration (see FreeSpinIntro.svelte fontSize comment)
		{ name: 'bone_number', parent: 'fs_popup', y: -22, scaleX: 2, scaleY: 2 },
	],
	slots: [
		{ name: 'plaque', bone: 'plaque', attachment: 'number_ring' },
		{ name: 'slot_number', bone: 'bone_number', attachment: 'anchor' },
	],
	skins: [
		{
			name: 'default',
			attachments: {
				plaque: { number_ring: { scaleX: 0.5, scaleY: 0.5, width: 520, height: 390 } },
				slot_number: { anchor: { width: 8, height: 8 } },
			},
		},
	],
	animations: {
		intro: {
			slots: {
				plaque: {
					rgba: [
						{ time: 0, color: 'ffffff00' },
						{ time: 0.2333, color: 'ffffffff' },
					],
				},
			},
			bones: {
				bone_number: { scale: numberIntroScale.map((k) => ({ ...k, x: k.x * 2, y: k.y * 2 })) },
				plaque: {
					scale: [
						{ time: 0, x: 0.03, y: 0.03 },
						{ time: 0.2667, x: 1.1, y: 1.1 },
						{ time: 0.5333, x: 0.96, y: 0.96 },
						{ time: 0.6667, x: 1, y: 1 },
					],
				},
			},
		},
		idle: {
			bones: {
				bone_number: {
					translate: numberIdle.translate,
					scale: numberIdle.scale.map((k) => ({ ...k, x: k.x * 2, y: k.y * 2 })),
				},
				plaque: {
					scale: [
						{ time: 0, x: 1, y: 1 },
						{ time: 1.4, x: 1.03, y: 1.03 },
						{ time: 2.8, x: 1, y: 1 },
					],
				},
			},
		},
	},
};

const fsTotalSpine = {
	skeleton: { hash: 'wp-fstotal-party', spine: '4.1.20', x: -130, y: -141, width: 260, height: 195, images: './' },
	bones: [
		{ name: 'root' },
		{ name: 'fs_popup', parent: 'root', scaleX: 1.3, scaleY: 1.3 },
		{ name: 'bone_number', parent: 'fs_popup', y: -30, scaleX: 2, scaleY: 2 },
	],
	slots: [{ name: 'slot_number', bone: 'bone_number', attachment: 'anchor' }],
	skins: [{ name: 'default', attachments: { slot_number: { anchor: { width: 8, height: 8 } } } }],
	animations: {
		intro: {
			bones: { bone_number: { scale: numberIntroScale.map((k) => ({ ...k, x: k.x * 2, y: k.y * 2 })) } },
		},
		idle: {
			bones: {
				bone_number: {
					translate: numberIdle.translate,
					scale: numberIdle.scale.map((k) => ({ ...k, x: k.x * 2, y: k.y * 2 })),
				},
			},
		},
	},
};

let fsAtlas = '';
fsAtlas += atlasPage('radial_pink.png', 1024, 1024, 'radial_pink') + '\n';
fsAtlas += atlasPage('radial_gold.png', 1024, 1024, 'radial_gold') + '\n';
fsAtlas += atlasPage('fs_panel.png', 920, 720, 'fs_panel') + '\n';
fsAtlas += atlasPage('number_ring.png', 520, 390, 'number_ring') + '\n';
fsAtlas += atlasPage('anchor.png', 8, 8, 'anchor');
fs.writeFileSync(path.join(FS_DIR, 'fs_party.atlas'), fsAtlas);
fs.writeFileSync(path.join(FS_DIR, 'fs_screen_party.json'), JSON.stringify(fsScreenSpine, null, 2) + '\n');
fs.writeFileSync(path.join(FS_DIR, 'fs_number_party.json'), JSON.stringify(fsNumberSpine, null, 2) + '\n');
fs.writeFileSync(path.join(FS_DIR, 'fs_total_party.json'), JSON.stringify(fsTotalSpine, null, 2) + '\n');

console.log('presentation assets written');
