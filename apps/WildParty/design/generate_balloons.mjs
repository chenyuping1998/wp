// Glossy balloon sprites matching the bg art's rendered look (gold metallic,
// magenta, purple, leopard print, foil star — same cast as the club scene).
// Usage: node design/generate_balloons.mjs <dir containing node_modules with @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_balloons.mjs <dir containing node_modules with @resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(appRoot, 'static/assets/sprites/wildPartyBalloons');
fs.mkdirSync(OUT, { recursive: true });

const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

const render = (svg, name) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 256 }, font: { loadSystemFonts: false } });
	fs.writeFileSync(path.join(OUT, name), resvg.render().asPng());
	console.log('rendered', name);
};

// glossy latex balloon: radial body gradient + soft sheen + sharp specular + rim
const balloon = ({ bright, main, dark, rim, extras = '' }) =>
	svgWrap(
		256,
		330,
		`
	<ellipse cx="128" cy="140" rx="100" ry="122" fill="url(#body)"/>
	${extras}
	<!-- soft sheen band top-left -->
	<ellipse cx="92" cy="84" rx="52" ry="34" fill="url(#sheen)" transform="rotate(-24 92 84)"/>
	<!-- sharp specular -->
	<ellipse cx="86" cy="74" rx="16" ry="22" fill="#ffffff" opacity="0.95" transform="rotate(-18 86 74)"/>
	<ellipse cx="108" cy="52" rx="24" ry="9" fill="#ffffff" opacity="0.5" transform="rotate(-12 108 52)"/>
	<!-- rim bounce light bottom-right -->
	<path d="M 186 210 Q 214 170 212 118 Q 228 176 196 232 Q 186 244 178 236 Q 176 224 186 210 Z" fill="${rim}" opacity="0.5"/>
	<!-- knot -->
	<path d="M 118 258 L 138 258 L 128 244 Z" fill="${dark}"/>
	<path d="M 116 258 Q 128 276 140 258 Q 128 266 116 258 Z" fill="${main}"/>
	`,
		`<radialGradient id="body" cx="0.36" cy="0.28" r="0.95">
			<stop offset="0" stop-color="${bright}"/>
			<stop offset="0.38" stop-color="${main}"/>
			<stop offset="0.8" stop-color="${dark}"/>
			<stop offset="1" stop-color="${dark}"/>
		</radialGradient>
		<radialGradient id="sheen" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
			<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
		</radialGradient>`,
	);

// leopard-print spots clipped to the balloon body
const leopardSpots = () => {
	let seed = 77;
	const rand = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};
	let out = '<g clip-path="url(#bodyClip)">';
	for (let i = 0; i < 26; i++) {
		const cx = 30 + rand() * 196;
		const cy = 30 + rand() * 220;
		const r = 9 + rand() * 8;
		const a = rand() * 360;
		out += `<g transform="rotate(${a.toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})">
			<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${r.toFixed(0)}" ry="${(r * 0.78).toFixed(0)}" fill="#3d2413" opacity="0.85"/>
			<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${(r * 0.55).toFixed(0)}" ry="${(r * 0.42).toFixed(0)}" fill="#a3611f" opacity="0.9"/>
		</g>`;
	}
	return out + '</g>';
};

// foil star balloon: faceted 5-point star with metallic shading
const starBalloon = ({ bright, main, dark }) => {
	const pts = [];
	for (let i = 0; i < 10; i++) {
		const a = -Math.PI / 2 + (i * Math.PI) / 5;
		const r = i % 2 === 0 ? 118 : 52;
		pts.push([128 + Math.cos(a) * r, 148 + Math.sin(a) * r]);
	}
	const d = `M ${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L ')} Z`;
	// facet shading: light triangles from center to alternating points
	let facets = '';
	for (let i = 0; i < 10; i++) {
		const [x1, y1] = pts[i];
		const [x2, y2] = pts[(i + 1) % 10];
		facets += `<path d="M 128 148 L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${i % 2 ? '#ffffff' : '#000000'}" opacity="${i % 2 ? 0.16 : 0.14}"/>`;
	}
	return svgWrap(
		256,
		330,
		`
	<path d="${d}" fill="url(#body)"/>
	${facets}
	<ellipse cx="94" cy="86" rx="26" ry="14" fill="#ffffff" opacity="0.75" transform="rotate(-24 94 86)"/>
	<ellipse cx="84" cy="102" rx="10" ry="6" fill="#ffffff" opacity="0.9" transform="rotate(-20 84 102)"/>
	<path d="M 118 272 L 138 272 L 128 258 Z" fill="${dark}"/>
	`,
		`<radialGradient id="body" cx="0.36" cy="0.3" r="0.95">
			<stop offset="0" stop-color="${bright}"/>
			<stop offset="0.4" stop-color="${main}"/>
			<stop offset="1" stop-color="${dark}"/>
		</radialGradient>`,
	);
};

render(
	balloon({ bright: '#ffe9a0', main: '#f2a93b', dark: '#8a5410', rim: '#ffd875' }),
	'balloon_gold.png',
);
render(
	balloon({ bright: '#ff9ed6', main: '#e0218a', dark: '#7a0e4d', rim: '#ff7ec2' }),
	'balloon_magenta.png',
);
render(
	balloon({ bright: '#c99af5', main: '#8a2be2', dark: '#3d1170', rim: '#b07af0' }),
	'balloon_purple.png',
);
render(
	balloon({
		bright: '#ffdf95',
		main: '#e8a33d',
		dark: '#7a4a10',
		rim: '#ffd875',
		extras: `<clipPath id="bodyClip"><ellipse cx="128" cy="140" rx="100" ry="122"/></clipPath>${leopardSpots()}`,
	}),
	'balloon_leopard.png',
);
render(starBalloon({ bright: '#ffb3dd', main: '#e0218a', dark: '#8a0e55' }), 'balloon_star.png');

console.log('balloons written to', OUT);
