// Go Bananas 100 — 美式漫畫（Silver Age 四色印刷）風格獎圖 h1–h4 / l1–l5
//
// 題材沿用 GEN2_ART_SPEC.md：
//   h1 鋼盔＋護目鏡＋紅星 / h2 鳳梨手榴彈 / h3 香蕉彈藥箱 / h4 指北針
//   l1–l5 = A K Q J 10
//
// 畫風要素（全部程序化）：
//   1. 報紙米黃紙底 + 紙張雜點，不是乾淨的深色鐵板
//   2. Ben-Day 網點：點半徑沿方向漸變，當印刷網目的濃淡
//   3. 硬邊分色陰影（cel shading）：平塗底色 + 一塊硬邊暗色 + 一塊硬邊亮色
//   4. 交叉排線（cross-hatch）壓在最深的陰影裡
//   5. 套色偏移（misregistration）：主體剪影墊洋紅／青色錯位色版
//   6. 粗細分明的墨線：外輪廓粗、內部細節細
//   7. 黑框分格 + 放射速度線
//
// 輸出：design/source/comic_symbols/*.png（1024×1024）
//       design/comic100_contact_sheet.png
//
// Usage: node design/generate_symbols_comic100.mjs "E:/stake/tools/gen"
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_symbols_comic100.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'design/source/comic_symbols');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── 風格常數 ────────────────────────────────────────────────────────────────
const INK = '#16120E'; // 印刷黑（帶暖，不是純黑）
const PAPER = '#F4E7CB'; // 報紙米黃
const PAPER_D = '#E2CFA6';
const MAGENTA = '#E6398B'; // 套色偏移用
const CYAN = '#3BB9E8';

const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

let seq = 0;
const uid = (p) => `${p}${seq++}`;

// 決定性偽亂數（紙張雜點用，每次輸出要一樣）
let rndState = 0x2f6e2b1;
const rnd = () => {
	rndState = (rndState * 1103515245 + 12345) & 0x7fffffff;
	return rndState / 0x7fffffff;
};

// ─── Ben-Day 網點：點半徑沿著一個方向漸變 ───────────────────────────────────
const benday = (clipBody, opts) => {
	const {
		x0 = 0,
		y0 = 0,
		x1 = 256,
		y1 = 256,
		step = 9,
		r0 = 0.6,
		r1 = 3.8,
		from = [0, 0],
		to = [256, 256],
		fill = INK,
		opacity = 0.85,
	} = opts;
	const id = uid('bd');
	const ax = to[0] - from[0];
	const ay = to[1] - from[1];
	const len2 = ax * ax + ay * ay || 1;
	let dots = '';
	let row = 0;
	for (let y = y0; y <= y1; y += step) {
		const off = row % 2 === 0 ? 0 : step / 2;
		for (let x = x0 + off; x <= x1; x += step) {
			let t = ((x - from[0]) * ax + (y - from[1]) * ay) / len2;
			t = t < 0 ? 0 : t > 1 ? 1 : t;
			const r = r0 + (r1 - r0) * t;
			if (r > 0.25) dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`;
		}
		row++;
	}
	return `<clipPath id="${id}">${clipBody}</clipPath><g clip-path="url(#${id})" fill="${fill}" opacity="${opacity}">${dots}</g>`;
};

// ─── 交叉排線 ────────────────────────────────────────────────────────────────
const hatch = (clipBody, { step = 8, width = 2, color = INK, opacity = 0.55, cross = true } = {}) => {
	const id = uid('hx');
	let lines = '';
	for (let i = -300; i <= 300; i += step) lines += `<path d="M ${i} -40 L ${i + 340} 300"/>`;
	if (cross) for (let i = -300; i <= 300; i += step * 1.6) lines += `<path d="M ${i} 300 L ${i + 340} -40"/>`;
	return `<clipPath id="${id}">${clipBody}</clipPath><g clip-path="url(#${id})" stroke="${color}" stroke-width="${width}" opacity="${opacity}" fill="none">${lines}</g>`;
};

// ─── 套色偏移：主體剪影往左上壓洋紅、往右下壓青，模擬印刷沒對準 ─────────────
const misregister = (silhouette) => `
	<g opacity="0.55" transform="translate(-3.5 -3)"><g fill="${MAGENTA}">${silhouette}</g></g>
	<g opacity="0.45" transform="translate(3.5 3)"><g fill="${CYAN}">${silhouette}</g></g>`;

// 五角星
const star5 = (cx, cy, R, rot = -90, fill = '#E8332B', stroke = INK, sw = 7) => {
	const r = R * 0.42;
	let d = '';
	for (let i = 0; i < 10; i++) {
		const rad = ((rot + i * 36) * Math.PI) / 180;
		const rr = i % 2 === 0 ? R : r;
		d += `${i === 0 ? 'M' : 'L'} ${(cx + rr * Math.cos(rad)).toFixed(1)} ${(cy + rr * Math.sin(rad)).toFixed(1)} `;
	}
	return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
};

// ─── 分格底板 ────────────────────────────────────────────────────────────────
// tier 'h'：彩色網點場 + 放射速度線（高賠）
// tier 'l'：素紙 + 稀疏灰網點，無速度線（低賠）
const panel = (tier, accent) => {
	const clip = uid('pn');
	const inner = `<rect x="14" y="14" width="228" height="228" rx="8"/>`;

	let rays = '';
	if (tier === 'h') {
		const wedges = Array.from({ length: 24 }, (_, i) => {
			const a0 = ((i * 15 - 3.2) * Math.PI) / 180;
			const a1 = ((i * 15 + 3.2) * Math.PI) / 180;
			const R = 330;
			return `M 128 130 L ${(128 + R * Math.cos(a0)).toFixed(1)} ${(130 + R * Math.sin(a0)).toFixed(1)} L ${(128 + R * Math.cos(a1)).toFixed(1)} ${(130 + R * Math.sin(a1)).toFixed(1)} Z`;
		}).join(' ');
		rays = `<path d="${wedges}" fill="${INK}" opacity="0.14"/>`;
	}

	let speck = '';
	for (let i = 0; i < 190; i++) {
		const x = 10 + rnd() * 236;
		const y = 10 + rnd() * 236;
		speck += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5 + rnd() * 1.1).toFixed(2)}"/>`;
	}

	return `
	<rect x="8" y="8" width="240" height="240" rx="10" fill="${PAPER}"/>
	<clipPath id="${clip}">${inner}</clipPath>
	<g clip-path="url(#${clip})">
		<rect x="14" y="14" width="228" height="228" fill="${PAPER}"/>
		${benday(inner, {
			step: tier === 'h' ? 8 : 10,
			r0: tier === 'h' ? 0.8 : 0.5,
			r1: tier === 'h' ? 3.6 : 2.3,
			from: [128, 96],
			to: [20, 250],
			fill: accent,
			opacity: tier === 'h' ? 0.9 : 0.55,
		})}
		${rays}
		<g fill="${PAPER_D}" opacity="0.5">${speck}</g>
	</g>
	<rect x="14" y="14" width="228" height="228" rx="8" fill="none" stroke="${INK}" stroke-width="4"/>
	<rect x="8" y="8" width="240" height="240" rx="10" fill="none" stroke="${INK}" stroke-width="13"/>`;
};

const symbols = {};

// ─── h1 鋼盔＋護目鏡＋紅星 ───────────────────────────────────────────────────
const helmet = (opts) => {
	const { dome, domeLit, domeDark, brim, brimLit, brimHatch, accent, star } = opts;
	const domePath = 'M 34 168 C 34 84 80 40 128 40 C 176 40 222 84 222 168 Z';
	const brimPath = 'M 26 168 L 230 168 L 222 196 L 34 196 Z';
	const shadow = 'M 128 40 C 176 40 222 84 222 168 L 150 168 C 150 96 142 58 128 40 Z';
	const sil = `<path d="${domePath}"/><path d="${brimPath}"/>`;
	return `
	${panel('h', accent)}
	${misregister(sil)}
	<g>
		<path d="${domePath}" fill="${dome}" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<path d="M 46 164 C 46 96 82 54 128 48 C 102 68 74 104 70 164 Z" fill="${domeLit}"/>
		<path d="${shadow}" fill="${domeDark}"/>
		${benday(`<path d="${shadow}"/>`, { step: 8, r0: 0.8, r1: 3.4, from: [150, 90], to: [226, 176], fill: INK, opacity: 0.5 })}
		${hatch(`<path d="M 186 92 C 214 116 222 146 222 168 L 188 168 C 188 138 186 112 186 92 Z"/>`, { step: 9, width: 1.8, opacity: 0.4 })}
		<!-- 護目鏡 -->
		<path d="M 36 88 C 70 58 186 58 220 88 L 214 112 C 180 84 76 84 42 112 Z" fill="#221F1C" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<path d="M 60 78 C 76 66 104 62 118 68 L 116 102 C 100 94 74 98 62 108 Z" fill="#CFE2E6" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
		<path d="M 196 78 C 180 66 152 62 138 68 L 140 102 C 156 94 182 98 194 108 Z" fill="#9FBFC7" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
		<path d="M 68 82 L 94 74 M 148 74 L 172 82" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
		<rect x="118" y="72" width="20" height="28" rx="6" fill="#3A3733" stroke="${INK}" stroke-width="5"/>
		<!-- 紅星 -->
		${star5(128, 140, 40, -90, star, INK, 8)}
		<path d="M 128 106 L 137 128 L 128 140 L 119 128 Z" fill="#FFB0A8" opacity="0.9"/>
		${benday(star5(128, 140, 40, -90, '#000', 'none', 0), { step: 7, r0: 0.5, r1: 2.6, from: [112, 124], to: [156, 168], fill: '#7C120D', opacity: 0.8 })}
		<!-- 帽簷 -->
		<path d="${brimPath}" fill="${brim}" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<path d="M 34 174 L 214 174" stroke="${brimLit}" stroke-width="6" stroke-linecap="round"/>
		${hatch(`<path d="M 150 168 L 230 168 L 222 196 L 150 196 Z"/>`, { step: 7, width: 1.8, opacity: 0.38, color: brimHatch })}
		<!-- 頦帶 -->
		<path d="M 52 196 C 70 232 186 232 204 196" fill="none" stroke="${INK}" stroke-width="21" stroke-linecap="round"/>
		<path d="M 52 196 C 70 228 186 228 204 196" fill="none" stroke="#8A5A2B" stroke-width="12" stroke-linecap="round"/>
		<rect x="112" y="210" width="32" height="20" rx="5" fill="#B9C2C6" stroke="${INK}" stroke-width="5"/>
		<path d="M 60 56 L 84 46" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>
	</g>`;
};

symbols.h1 = svgWrap(
	256,
	256,
	helmet({
		dome: '#4E7A22',
		domeLit: '#7FAA3C',
		domeDark: '#2F5112',
		brim: '#3B6011',
		brimLit: '#6E9A33',
		brimHatch: INK,
		accent: '#E8332B',
		star: '#E8332B',
	}),
);

// h1b 備選：盔體壓暗、帽圈轉紅，讓 h1 真的由紅色主導
symbols.h1b = svgWrap(
	256,
	256,
	helmet({
		dome: '#39413A',
		domeLit: '#5C6659',
		domeDark: '#232A25',
		brim: '#C62A24',
		brimLit: '#F0776E',
		brimHatch: '#6E0F0B',
		accent: '#E8332B',
		star: '#E8332B',
	}),
);

// ─── h2 鳳梨手榴彈（綠） ─────────────────────────────────────────────────────
{
	const body =
		'M 128 104 C 174 104 186 138 186 168 C 186 206 160 228 128 228 C 96 228 70 206 70 168 C 70 138 82 104 128 104 Z';
	const shadow =
		'M 150 108 C 180 122 186 146 186 170 C 186 208 160 228 128 228 C 154 212 162 184 160 156 C 158 132 154 116 150 108 Z';
	const leaves = `
		<path d="M 128 106 L 56 62 L 82 112 Z" fill="#2E5A10"/>
		<path d="M 128 106 L 200 58 L 188 112 Z" fill="#2E5A10"/>
		<path d="M 128 106 L 86 22 L 106 108 Z" fill="#4C8A18"/>
		<path d="M 128 106 L 172 20 L 184 104 Z" fill="#4C8A18"/>
		<path d="M 128 106 L 130 8 L 152 100 Z" fill="#7FBE33"/>`;
	const grid = (() => {
		let g = '';
		for (let i = -3; i <= 5; i++) g += `<path d="M ${50 + i * 30} 90 L ${140 + i * 30} 240"/>`;
		for (let i = -3; i <= 5; i++) g += `<path d="M ${210 - i * 30} 90 L ${120 - i * 30} 240"/>`;
		return g;
	})();
	const clip = uid('gr');
	const sil = `<path d="${body}"/><path d="M 128 106 L 56 62 L 82 112 Z"/><path d="M 128 106 L 200 58 L 188 112 Z"/><path d="M 128 106 L 86 22 L 106 108 Z"/><path d="M 128 106 L 172 20 L 184 104 Z"/><path d="M 128 106 L 130 8 L 152 100 Z"/><rect x="98" y="76" width="72" height="38" rx="9"/>`;
	symbols.h2 = svgWrap(
		256,
		256,
		`
	${panel('h', '#3FA535')}
	${misregister(sil)}
	<g>
		<g stroke="${INK}" stroke-width="7" stroke-linejoin="round">${leaves}</g>
		<path d="${body}" fill="#57912B" stroke="${INK}" stroke-width="11" stroke-linejoin="round"/>
		<clipPath id="${clip}"><path d="${body}"/></clipPath>
		<g clip-path="url(#${clip})"><path d="M 88 112 C 74 146 74 194 90 220 L 60 220 L 60 104 Z" fill="#82BE3C"/></g>
		<path d="${shadow}" fill="#2F5A10"/>
		${benday(`<path d="${shadow}"/>`, { step: 8, r0: 0.7, r1: 3.4, from: [150, 120], to: [190, 224], fill: INK, opacity: 0.5 })}
		<g clip-path="url(#${clip})" stroke="${INK}" stroke-width="5" opacity="0.6" fill="none">${grid}</g>
		${hatch(`<path d="M 156 176 C 172 184 178 206 166 220 C 150 230 132 228 128 228 C 150 220 156 198 156 176 Z"/>`, { step: 7, width: 1.8, opacity: 0.45 })}
		<!-- 擊發桿 -->
		<path d="M 166 92 L 190 100 L 184 206 L 166 202 Z" fill="#B9C2C6" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<path d="M 171 104 L 179 106 L 175 196 L 169 194 Z" fill="#F2F7F8"/>
		<!-- 引信座 -->
		<rect x="98" y="76" width="72" height="38" rx="9" fill="#9AA3A7" stroke="${INK}" stroke-width="8"/>
		<path d="M 106 84 L 162 84" stroke="#E4EAEC" stroke-width="7" stroke-linecap="round"/>
		${hatch(`<rect x="98" y="96" width="72" height="18" rx="6"/>`, { step: 6, width: 1.6, opacity: 0.4, cross: false })}
		<!-- 拉環 -->
		<circle cx="62" cy="76" r="26" fill="none" stroke="${INK}" stroke-width="18"/>
		<circle cx="62" cy="76" r="26" fill="none" stroke="#B9C2C6" stroke-width="10"/>
		<path d="M 48 60 L 56 54" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
		<path d="M 86 82 L 100 90" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
		<path d="M 86 82 L 100 90" stroke="#B9C2C6" stroke-width="7" stroke-linecap="round"/>
		<path d="M 96 128 C 86 142 84 158 86 170" fill="none" stroke="#C7E58A" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
	</g>`,
	);
}

// ─── h3 香蕉彈藥箱（木棕＋自然黃） ───────────────────────────────────────────
{
	const front = 'M 46 130 L 210 130 L 200 224 L 56 224 Z';
	const frontShadow = 'M 150 130 L 210 130 L 200 224 L 142 224 Z';
	const lid = 'M 30 112 L 96 56 L 218 74 L 156 124 Z';
	const banana = (x, y, rot, s, fill, lit, shade) => `
		<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
			<path d="M -6 -54 C 22 -34 34 6 20 44 C 14 58 -4 62 -14 52 C -2 40 6 4 -4 -26 C -8 -40 -10 -48 -6 -54 Z"
				fill="${fill}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
			<path d="M -6 -54 C 14 -36 24 -4 18 28 C 14 44 6 52 -2 54 C 8 34 12 2 -2 -30 C -6 -42 -8 -48 -6 -54 Z" fill="${shade}"/>
			<path d="M -2 -46 C 10 -30 16 -8 12 14" fill="none" stroke="${lit}" stroke-width="6" stroke-linecap="round"/>
			<path d="M -6 -54 L -4 -66" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
		</g>`;
	const sil = `<path d="${front}"/><path d="${lid}"/>`;
	symbols.h3 = svgWrap(
		256,
		256,
		`
	${panel('h', '#D98A2B')}
	${misregister(sil)}
	<g>
		<path d="${lid}" fill="#6E4520" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<path d="M 46 106 L 100 66 L 198 80 L 148 114 Z" fill="#8E5C2B"/>
		${hatch(`<path d="M 148 114 L 198 80 L 218 74 L 156 124 Z"/>`, { step: 6, width: 1.8, opacity: 0.45, cross: false })}
		${banana(92, 122, -20, 1.06, '#F2C22F', '#FFE79A', '#C7920F')}
		${banana(128, 112, 2, 1.18, '#FFD447', '#FFF0B0', '#D6A013')}
		${banana(164, 124, 22, 1.04, '#E8B622', '#FFE08A', '#B07E08')}
		<path d="${front}" fill="#8A5A2B" stroke="${INK}" stroke-width="11" stroke-linejoin="round"/>
		<path d="M 56 138 C 66 172 64 202 60 216 L 46 216 L 46 134 Z" fill="#A87438"/>
		<path d="${frontShadow}" fill="#5F3A16"/>
		${benday(`<path d="${frontShadow}"/>`, { step: 8, r0: 0.8, r1: 3.2, from: [150, 140], to: [210, 226], fill: INK, opacity: 0.45 })}
		<path d="M 50 160 L 206 160 M 48 192 L 203 192" stroke="${INK}" stroke-width="5" opacity="0.55"/>
		<g fill="#33383B" stroke="${INK}" stroke-width="7" stroke-linejoin="round">
			<path d="M 46 130 L 82 130 L 80 152 L 46 152 Z"/>
			<path d="M 174 130 L 210 130 L 208 152 L 176 152 Z"/>
			<path d="M 46 202 L 78 202 L 76 224 L 56 224 Z"/>
			<path d="M 178 202 L 210 202 L 200 224 L 180 224 Z"/>
		</g>
		<g fill="#C9CFD2"><circle cx="56" cy="140" r="3.4"/><circle cx="72" cy="140" r="3.4"/><circle cx="184" cy="140" r="3.4"/><circle cx="200" cy="140" r="3.4"/></g>
		<text x="128" y="186" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="30" letter-spacing="2"
			text-anchor="middle" fill="#3A2408" opacity="0.9">AMMO</text>
	</g>`,
	);
}

// ─── h4 指北針（青藍） ───────────────────────────────────────────────────────
{
	const rose = (() => {
		let d = '';
		for (let i = 0; i < 16; i++) {
			const a = ((i * 22.5 - 90) * Math.PI) / 180;
			const R = i % 2 === 0 ? 58 : 34;
			const w = i % 2 === 0 ? 0.16 : 0.1;
			d += `M 128 128 L ${(128 + R * Math.cos(a - w)).toFixed(1)} ${(128 + R * Math.sin(a - w)).toFixed(1)} L ${(128 + R * Math.cos(a)).toFixed(1)} ${(128 + R * Math.sin(a)).toFixed(1)} Z `;
			d += `M 128 128 L ${(128 + R * Math.cos(a)).toFixed(1)} ${(128 + R * Math.sin(a)).toFixed(1)} L ${(128 + R * Math.cos(a + w)).toFixed(1)} ${(128 + R * Math.sin(a + w)).toFixed(1)} Z `;
		}
		return d;
	})();
	const sil = `<circle cx="128" cy="134" r="92"/>`;
	symbols.h4 = svgWrap(
		256,
		256,
		`
	${panel('h', '#2BA8D8')}
	${misregister(sil)}
	<g>
		<circle cx="128" cy="34" r="17" fill="none" stroke="${INK}" stroke-width="17"/>
		<circle cx="128" cy="34" r="17" fill="none" stroke="#B9C2C6" stroke-width="9"/>
		<circle cx="128" cy="134" r="92" fill="#94A0A6" stroke="${INK}" stroke-width="11"/>
		<path d="M 128 42 A 92 92 0 0 1 218 152 L 182 148 A 56 56 0 0 0 128 78 Z" fill="#D7E1E4"/>
		<path d="M 128 226 A 92 92 0 0 1 44 176 L 80 160 A 56 56 0 0 0 128 190 Z" fill="#5E6A71"/>
		${benday(`<circle cx="128" cy="134" r="92"/>`, { step: 7, r0: 0.4, r1: 3.0, from: [110, 110], to: [200, 216], fill: INK, opacity: 0.4 })}
		<circle cx="128" cy="134" r="74" fill="#3E4A50" stroke="${INK}" stroke-width="7"/>
		<circle cx="128" cy="134" r="66" fill="#0E7B86" stroke="${INK}" stroke-width="6"/>
		<path d="M 128 68 A 66 66 0 0 1 194 134 L 128 134 Z" fill="#17A0A8"/>
		${benday(`<circle cx="128" cy="134" r="66"/>`, { step: 7, r0: 0.4, r1: 3.2, from: [128, 100], to: [176, 198], fill: '#053940', opacity: 0.75 })}
		<g transform="translate(0 6)">
			<path d="${rose}" fill="#8CF0E6" stroke="${INK}" stroke-width="3" stroke-linejoin="round" opacity="0.92"/>
		</g>
		<g transform="rotate(-28 128 134)">
			<path d="M 128 134 L 142 148 L 128 68 L 114 148 Z" fill="#E8332B" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
			<path d="M 128 134 L 128 68 L 114 148 Z" fill="#F4837C"/>
			<path d="M 128 134 L 142 120 L 128 200 L 114 120 Z" fill="#F0C63C" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
			<path d="M 128 134 L 128 200 L 142 120 Z" fill="#B88A12"/>
		</g>
		<circle cx="128" cy="134" r="11" fill="#221F1C" stroke="${INK}" stroke-width="5"/>
		<g font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="24" text-anchor="middle" fill="#EAFFFB" stroke="${INK}" stroke-width="4.5" paint-order="stroke">
			<text x="128" y="88">N</text><text x="128" y="196">S</text>
			<text x="76" y="146">W</text><text x="180" y="146">E</text>
		</g>
		<path d="M 72 82 C 94 58 126 48 152 52" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
	</g>`,
	);
}

// ─── l1–l5 漫畫標題字（冷灰，靠字形分辨） ────────────────────────────────────
const FONT = "Arial Black, Arial, 'Segoe UI', sans-serif";
const letter = (glyph, fontSize = 172, y = 198) => {
	const clip = uid('lt');
	const t = (extra) =>
		`<text x="128" y="${y}" font-family="${FONT}" font-weight="900" font-size="${fontSize}" text-anchor="middle" ${extra}>${glyph}</text>`;
	return svgWrap(
		256,
		256,
		`
	${panel('l', '#7E8C95')}
	<g opacity="0.5" transform="translate(-3.5 -3)">${t(`fill="${MAGENTA}"`)}</g>
	<g opacity="0.42" transform="translate(3.5 3)">${t(`fill="${CYAN}"`)}</g>
	<g>
		${t(`fill="#B3BDC3" stroke="${INK}" stroke-width="16" paint-order="stroke" stroke-linejoin="round"`)}
		<clipPath id="${clip}">${t('')}</clipPath>
		<g clip-path="url(#${clip})">
			<path d="M 0 0 L 256 0 L 256 112 L 0 140 Z" fill="#E1E8EC"/>
			<path d="M 0 176 L 256 150 L 256 256 L 0 256 Z" fill="#6B767D"/>
			<path d="M 30 0 L 104 256 L 72 256 L 4 0 Z" fill="#ffffff" opacity="0.55"/>
			${benday(`<rect width="256" height="256"/>`, { step: 7, r0: 0.5, r1: 3.0, from: [90, 120], to: [210, 240], fill: '#3E4A50', opacity: 0.85 })}
		</g>
		${t(`fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"`)}
	</g>`,
	);
};

symbols.l1 = letter('A');
symbols.l2 = letter('K');
symbols.l3 = letter('Q');
symbols.l4 = letter('J');
symbols.l5 = letter('10', 118, 182);

// ─── 輸出 ────────────────────────────────────────────────────────────────────
const render = (svg, outPath, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } });
	fs.writeFileSync(outPath, resvg.render().asPng());
};

const order = ['h1', 'h1b', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5'];
for (const name of order) {
	render(symbols[name], path.join(OUT_DIR, `${name}.png`), 1024);
	console.log('rendered', name, '1024x1024');
}

// 聯絡表
let sheet = `<rect width="1330" height="620" fill="#14171A"/>`;
order.forEach((name, i) => {
	const col = i % 5;
	const row = Math.floor(i / 5);
	const inner = symbols[name].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
	sheet += `<g transform="translate(${30 + col * 260} ${30 + row * 290}) scale(0.9)">${inner}</g>`;
	sheet += `<text x="${30 + col * 260 + 115}" y="${30 + row * 290 + 262}" font-family="Arial, sans-serif" font-size="22" fill="#8a949b" text-anchor="middle">${name}</text>`;
});
render(svgWrap(1330, 620, sheet), path.join(appRoot, 'design/comic100_contact_sheet.png'), 1330);
console.log('contact sheet -> design/comic100_contact_sheet.png');
