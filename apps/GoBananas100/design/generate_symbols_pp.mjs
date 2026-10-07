// Go Bananas 100 — 仿 Pragmatic Play「Out of the Woods」畫風的獎圖 h1–h4 / l1–l5
//
// 參考畫風的構成（從 demo 盤面與賠付表觀察）：
//   高賠：正方卡片，外圈是「彩色上漆的木板框」（四根木條、角落交疊、釘子），
//         框色＝階層色；框內是暗色帶色光的場景底，主體是彩繪卡通插畫。
//   低賠：無框。粗圓胖的字（每個字一個飽和色），有厚度（下緣擠出一層暗色）、
//         上半有光澤；每個字都跟一個主題道具組在一起。
//   上色：細而穩的深棕墨線（不是漫畫那種粗黑框）、漸層底色＋硬邊暗部、
//         背光側一道暖色／冷色輪廓光（rim light）、筆刷顆粒質感。
//
// 題材沿用 GEN2_ART_SPEC.md：h1 鋼盔 / h2 鳳梨手榴彈 / h3 香蕉彈藥箱 / h4 指北針；
// l1–l5 = A K Q J 10，道具換成叢林軍事系（彈鏈、狗牌、叢林葉、繩圈、沙包）。
//
// 輸出：design/source/pp_symbols/*.png（1024×1024，框外透明）
//       design/pp_contact_sheet.png
//
// Usage: node design/generate_symbols_pp.mjs "E:/stake/tools/gen"
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_symbols_pp.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'design/source/pp_symbols');
const FONT_DIR = path.join(appRoot, 'static/fonts'); // Titan One（OFL），跟 PP 的圓胖字很接近
fs.mkdirSync(OUT_DIR, { recursive: true });

const INK = '#23140C'; // 深棕墨線
const LW = 4.5; // 主輪廓線寬

let seq = 0;
const uid = (p = 'u') => `${p}${seq++}`;

// ─── 小工具：每張符號各自收集 defs ─────────────────────────────────────────────
class Sym {
	constructor() {
		this.defs = '';
	}
	lg(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
		const id = uid('lg');
		this.defs += `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
			.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
			.join('')}</linearGradient>`;
		return `url(#${id})`;
	}
	lgUser(stops, x1, y1, x2, y2) {
		const id = uid('lu');
		this.defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
			.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
			.join('')}</linearGradient>`;
		return `url(#${id})`;
	}
	rg(stops, cx = 0.5, cy = 0.5, r = 0.6) {
		const id = uid('rg');
		this.defs += `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
			.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
			.join('')}</radialGradient>`;
		return `url(#${id})`;
	}
	// 形狀減去自己位移後的副本 → 只留下邊緣一彎（用來畫輪廓光和硬邊暗部）
	crescent(shapes, color, dx, dy, opacity = 1) {
		const id = uid('cr');
		this.defs += `<mask id="${id}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="360" height="360"><g fill="#fff">${shapes}</g><g fill="#000" transform="translate(${-dx} ${-dy})">${shapes}</g></mask>`;
		return `<rect x="-50" y="-50" width="360" height="360" fill="${color}" opacity="${opacity}" mask="url(#${id})"/>`;
	}
	clip(shapes, body) {
		const id = uid('cp');
		this.defs += `<clipPath id="${id}">${shapes}</clipPath>`;
		return `<g clip-path="url(#${id})">${body}</g>`;
	}
	// 筆刷顆粒：黑色雜訊裁進形狀
	grain(shapes, { freq = 0.85, strength = 0.22, seed = 7 } = {}) {
		const id = uid('gn');
		this.defs += `<filter id="${id}" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox">
			<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" result="n"/>
			<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -0.62" result="a"/>
			<feComposite in="a" in2="SourceGraphic" operator="in"/>
		</filter>`;
		return `<g opacity="${strength}" filter="url(#${id})"><g fill="#000">${shapes}</g></g>`;
	}
	// 木紋：拉長的雜訊
	woodGrain(shapes, horizontal, { strength = 0.45, seed = 3 } = {}) {
		const id = uid('wg');
		this.defs += `<filter id="${id}" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox">
			<feTurbulence type="fractalNoise" baseFrequency="${horizontal ? '0.011 0.32' : '0.32 0.011'}" numOctaves="3" seed="${seed}" result="n"/>
			<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -0.95" result="a"/>
			<feComposite in="a" in2="SourceGraphic" operator="in"/>
		</filter>`;
		return `<g opacity="${strength}" filter="url(#${id})"><g fill="#1a0c05">${shapes}</g></g>`;
	}
	svg(body, w = 256, h = 256) {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${this.defs}</defs>${body}</svg>`;
	}
}

// ─── 高賠卡框：彩色上漆木板框 ───────────────────────────────────────────────
// hue: { light, mid, dark, bgIn, bgOut, leaf }
const cardFrame = (S, hue, seed) => {
	const bg = S.rg(
		[
			[0, hue.bgIn],
			[1, hue.bgOut],
		],
		0.5,
		0.42,
		0.72,
	);
	// 框內背景：帶色光的暗場景＋幾片叢林葉剪影
	const leaves = `
		<path d="M 22 90 C 50 70 70 90 76 120 C 52 118 34 108 22 90 Z"/>
		<path d="M 22 170 C 44 140 76 150 86 180 C 60 190 36 186 22 170 Z"/>
		<path d="M 234 70 C 206 60 184 78 180 106 C 204 106 224 94 234 70 Z"/>
		<path d="M 234 160 C 212 136 178 146 170 176 C 196 184 222 180 234 160 Z"/>
		<path d="M 60 234 C 70 206 100 200 120 216 C 104 230 84 236 60 234 Z"/>
		<path d="M 150 234 C 164 210 196 206 212 222 C 196 234 172 238 150 234 Z"/>`;
	const inner = `
		<rect x="24" y="24" width="208" height="208" fill="${bg}"/>
		<g fill="${hue.leaf}" opacity="0.55">${leaves}</g>
		<rect x="30" y="30" width="196" height="196" fill="none" stroke="#000" stroke-width="12" opacity="0.4"/>`;

	// 四根木條：左右直條先畫，上下橫條壓在上面；邊緣帶一點缺角
	const vL = 'M 3 18 L 33 15 L 35 241 L 5 244 Z';
	const vR = 'M 223 15 L 253 18 L 251 244 L 221 241 Z';
	const hT = 'M 0 4 L 128 1 L 256 4 L 255 33 L 196 35 L 191 31 L 118 34 L 1 32 Z';
	const hB = 'M 1 223 L 64 222 L 69 226 L 255 223 L 256 252 L 128 255 L 0 252 Z';
	const plankV = S.lg(
		[
			[0, hue.light],
			[0.45, hue.mid],
			[1, hue.dark],
		],
		0,
		0,
		1,
		0,
	);
	const plankH = S.lg([
		[0, hue.light],
		[0.5, hue.mid],
		[1, hue.dark],
	]);
	const plank = (d, fill, horizontal, s) => `
		<path d="${d}" fill="${fill}"/>
		${S.woodGrain(`<path d="${d}"/>`, horizontal, { seed: s })}
		${S.crescent(`<path d="${d}"/>`, '#fff', -3, -3, 0.35)}
		<path d="${d}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>`;
	const nail = (x, y) => `
		<circle cx="${x}" cy="${y}" r="4.2" fill="${S.lg([
			[0, '#F2F2EE'],
			[1, '#6E6A64'],
		])}" stroke="${INK}" stroke-width="2"/>
		<circle cx="${x - 1.2}" cy="${y - 1.4}" r="1.3" fill="#fff"/>`;
	const frame = `
		${plank(vL, plankV, false, seed)}
		${plank(vR, plankV, false, seed + 1)}
		${plank(hT, plankH, true, seed + 2)}
		${plank(hB, plankH, true, seed + 3)}
		${nail(18, 18)}${nail(238, 18)}${nail(18, 238)}${nail(238, 238)}
		${nail(128, 17)}${nail(128, 239)}`;
	return { inner, frame };
};

const symbols = {};

// 主體縮進卡框內
const fitCard = (body) => `<g transform="translate(128 131) scale(0.84) translate(-128 -128)">${body}</g>`;

// ─── h1 鋼盔（紅框） ─────────────────────────────────────────────────────────
{
	const S = new Sym();
	const { inner, frame } = cardFrame(
		S,
		{ light: '#F0645A', mid: '#C4282A', dark: '#6E0F14', bgIn: '#6A2320', bgOut: '#1A0909', leaf: '#0E0505' },
		11,
	);
	const dome = 'M 34 168 C 34 84 80 40 128 40 C 176 40 222 84 222 168 Z';
	const brim = 'M 22 166 C 60 160 196 160 234 166 L 226 196 C 180 190 76 190 30 196 Z';
	const strap = 'M 36 88 C 70 58 186 58 220 88 L 214 114 C 180 86 76 86 42 114 Z';
	const lensL = 'M 58 78 C 74 64 104 60 120 68 L 118 104 C 100 96 74 100 60 110 Z';
	const lensR = 'M 198 78 C 182 64 152 60 136 68 L 138 104 C 156 96 182 100 196 110 Z';
	const star = (() => {
		const cx = 128;
		const cy = 138;
		const R = 36;
		const r = R * 0.42;
		const pts = [];
		for (let i = 0; i < 10; i++) {
			const a = ((-90 + i * 36) * Math.PI) / 180;
			const rr = i % 2 === 0 ? R : r;
			pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
		}
		let facets = '';
		for (let i = 0; i < 10; i++) {
			const [ax, ay] = pts[i];
			const [bx, by] = pts[(i + 1) % 10];
			// 每個尖角左右兩面一亮一暗 → 立體星
			const lit = i % 2 === 0 ? (i < 5 ? '#FF8A78' : '#E23A30') : i < 5 ? '#C21E1E' : '#8E1014';
			facets += `<path d="M ${cx} ${cy} L ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)} Z" fill="${lit}"/>`;
		}
		const outline = `M ${pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L ')} Z`;
		return `${facets}<path d="${outline}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>`;
	})();

	const body = `
		<!-- 盔體 -->
		<path d="${dome}" fill="${S.lg(
			[
				[0, '#9CC460'],
				[0.5, '#5E8A2C'],
				[1, '#2F4C16'],
			],
			0.15,
			0,
			0.85,
			1,
		)}"/>
		${S.crescent(`<path d="${dome}"/>`, '#1B2E0C', -34, -18, 0.55)}
		${S.crescent(`<path d="${dome}"/>`, '#FF9C6A', 6, 3, 0.85)}
		<ellipse cx="86" cy="70" rx="30" ry="14" transform="rotate(-28 86 70)" fill="#fff" opacity="0.28"/>
		<path d="M 70 58 C 80 50 92 46 102 45" fill="none" stroke="#F4FFD8" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
		<path d="M 170 120 L 186 128 M 64 132 L 76 140 M 190 96 L 198 106" stroke="#C9E39A" stroke-width="1.6" opacity="0.6"/>
		${S.grain(`<path d="${dome}"/>`, { seed: 21 })}
		<path d="${dome}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
		<!-- 紅星（畫在盔前） -->
		${star}
		<!-- 護目鏡 -->
		<path d="${strap}" fill="${S.lg([
			[0, '#6B4630'],
			[1, '#2C1A10'],
		])}" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
		${[lensL, lensR]
			.map(
				(d) => `
			<path d="${d}" fill="${S.lg(
				[
					[0, '#EAF0F2'],
					[1, '#747F85'],
				],
				0,
				0,
				0.4,
				1,
			)}" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
			<g transform="translate(128 86) scale(0.8) translate(-128 -86)">
				<path d="${d}" fill="${S.lg(
					[
						[0, '#CDF6FF'],
						[0.55, '#4FA6C8'],
						[1, '#1A4E6A'],
					],
					0,
					0,
					0.3,
					1,
				)}" stroke="${INK}" stroke-width="2.4"/>
			</g>`,
			)
			.join('')}
		<path d="M 72 80 L 92 72 M 150 72 L 168 78" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
		<path d="M 78 92 L 86 88 M 158 86 L 164 88" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
		<rect x="119" y="70" width="18" height="30" rx="5" fill="${S.lg([
			[0, '#B9C0C4'],
			[1, '#4D555A'],
		])}" stroke="${INK}" stroke-width="3"/>
		<!-- 帽簷 -->
		<path d="${brim}" fill="${S.lg([
			[0, '#7FA84A'],
			[0.45, '#4B7222'],
			[1, '#243B0F'],
		])}"/>
		${S.crescent(`<path d="${brim}"/>`, '#FF9C6A', 5, 2, 0.75)}
		${S.grain(`<path d="${brim}"/>`, { seed: 22 })}
		<path d="${brim}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
		<path d="M 34 172 C 80 166 176 166 222 172" fill="none" stroke="#B9DA86" stroke-width="2.4" opacity="0.8"/>
		<!-- 頦帶 -->
		<path d="M 52 194 C 70 232 186 232 204 194" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
		<path d="M 52 194 C 70 229 186 229 204 194" fill="none" stroke="${S.lgUser(
			[
				[0, '#A9754A'],
				[1, '#5A3520'],
			],
			0,
			196,
			0,
			232,
		)}" stroke-width="8.5" stroke-linecap="round"/>
		<rect x="114" y="212" width="28" height="18" rx="4" fill="${S.lg([
			[0, '#F1E3A0'],
			[1, '#9A7A2A'],
		])}" stroke="${INK}" stroke-width="3"/>`;

	symbols.h1 = S.svg(`${inner}${fitCard(body)}${frame}`);
}

// ─── h2 鳳梨手榴彈（綠框） ───────────────────────────────────────────────────
{
	const S = new Sym();
	const { inner, frame } = cardFrame(
		S,
		{ light: '#8FD85A', mid: '#3E9A2A', dark: '#17511A', bgIn: '#28502A', bgOut: '#07140A', leaf: '#020803' },
		31,
	);
	const bodyP =
		'M 128 102 C 176 102 188 138 188 168 C 188 208 160 230 128 230 C 96 230 68 208 68 168 C 68 138 80 102 128 102 Z';
	const leafList = [
		['M 128 106 C 100 90 72 76 52 62 C 70 86 84 100 96 112 Z', 0],
		['M 128 106 C 156 88 184 74 204 58 C 190 84 176 100 162 112 Z', 1],
		['M 124 104 C 110 76 96 48 84 22 C 108 44 118 70 134 100 Z', 2],
		['M 132 104 C 146 76 160 46 174 20 C 176 50 164 76 150 104 Z', 3],
		['M 126 104 C 124 70 126 38 132 8 C 146 38 146 72 140 102 Z', 4],
	];
	const leafFill = S.lg(
		[
			[0, '#B6E35C'],
			[0.5, '#5DA02A'],
			[1, '#244E10'],
		],
		0,
		0,
		0.4,
		1,
	);
	const leaves = leafList
		.map(
			([d]) => `<path d="${d}" fill="${leafFill}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>`,
		)
		.join('');
	let grid = '';
	for (let i = -3; i <= 5; i++) grid += `M ${50 + i * 26} 90 L ${140 + i * 26} 240 `;
	for (let i = -3; i <= 5; i++) grid += `M ${210 - i * 26} 90 L ${120 - i * 26} 240 `;
	const bodyShape = `<path d="${bodyP}"/>`;
	const metal = (a = 0.3) =>
		S.lg(
			[
				[0, '#F4F6F7'],
				[0.5, '#A7B0B5'],
				[1, '#4A5358'],
			],
			0,
			0,
			a,
			1,
		);

	const body = `
		${leaves}
		<path d="${bodyP}" fill="${S.lg(
			[
				[0, '#A8D860'],
				[0.5, '#5A9A28'],
				[1, '#1F420C'],
			],
			0.2,
			0,
			0.8,
			1,
		)}"/>
		${S.clip(
			bodyShape,
			`
			<path d="${grid}" stroke="#16300A" stroke-width="3.4" fill="none"/>
			<path d="${grid}" stroke="#D6F29C" stroke-width="1.6" fill="none" opacity="0.7" transform="translate(-2.2 -1.4)"/>`,
		)}
		${S.crescent(bodyShape, '#122A06', -30, -22, 0.55)}
		${S.crescent(bodyShape, '#E6FFA0', 6, 3, 0.9)}
		<ellipse cx="96" cy="140" rx="16" ry="26" transform="rotate(20 96 140)" fill="#fff" opacity="0.22"/>
		${S.grain(bodyShape, { seed: 41 })}
		<path d="${bodyP}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
		<!-- 擊發桿 -->
		<path d="M 166 90 C 178 92 186 96 192 102 L 186 206 C 180 208 172 206 166 202 Z" fill="${metal(0.9)}" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
		<path d="M 172 104 L 180 108 L 176 196" fill="none" stroke="#fff" stroke-width="3" opacity="0.8"/>
		<!-- 引信座 -->
		<rect x="98" y="74" width="72" height="40" rx="8" fill="${metal()}" stroke="${INK}" stroke-width="${LW}"/>
		<rect x="98" y="100" width="72" height="14" rx="6" fill="#39424A" opacity="0.5"/>
		<path d="M 106 82 L 160 82" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.9"/>
		<!-- 拉環 -->
		<circle cx="62" cy="76" r="24" fill="none" stroke="${INK}" stroke-width="13"/>
		<circle cx="62" cy="76" r="24" fill="none" stroke="${S.lgUser(
			[
				[0, '#F6F8F9'],
				[1, '#59636A'],
			],
			40,
			52,
			84,
			100,
		)}" stroke-width="7"/>
		<path d="M 44 64 C 48 58 54 55 60 54" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
		<path d="M 84 82 L 100 90" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
		<path d="M 84 82 L 100 90" stroke="#C3CCD1" stroke-width="5" stroke-linecap="round"/>`;

	symbols.h2 = S.svg(`${inner}${fitCard(body)}${frame}`);
}

// ─── h3 香蕉彈藥箱（琥珀框） ─────────────────────────────────────────────────
{
	const S = new Sym();
	const { inner, frame } = cardFrame(
		S,
		{ light: '#FFC766', mid: '#D98A1F', dark: '#7A4108', bgIn: '#5E3A18', bgOut: '#140A04', leaf: '#070301' },
		51,
	);
	const front = 'M 44 132 L 212 132 L 202 226 L 54 226 Z';
	const lid = 'M 28 114 L 94 56 L 220 74 L 158 126 Z';
	const wood = (horizontal = true) =>
		S.lg(
			[
				[0, '#C99052'],
				[0.5, '#94602C'],
				[1, '#5A3614'],
			],
			0,
			0,
			horizontal ? 0.3 : 1,
			1,
		);
	const banana = (x, y, rot, s) => {
		const d = 'M -6 -54 C 22 -34 34 6 20 44 C 14 58 -4 62 -14 52 C -2 40 6 4 -4 -26 C -8 -40 -10 -48 -6 -54 Z';
		return `
		<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
			<path d="${d}" fill="${S.lg(
				[
					[0, '#FFF1A0'],
					[0.45, '#FFD23A'],
					[1, '#C98A0C'],
				],
				0,
				0,
				1,
				0.3,
			)}"/>
			${S.crescent(`<path d="${d}"/>`, '#A0620A', -10, 4, 0.6)}
			<path d="M -1 -44 C 11 -28 16 -6 12 16" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>
			<path d="${d}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/>
			<path d="M -6 -54 L -4 -66" stroke="#4A2E12" stroke-width="7" stroke-linecap="round"/>
			<path d="M -14 52 L -18 56" stroke="#3A220C" stroke-width="6" stroke-linecap="round"/>
		</g>`;
	};
	const corner = (d) =>
		`<path d="${d}" fill="${S.lg([
			[0, '#8D979C'],
			[1, '#2E3437'],
		])}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
	const body = `
		<path d="${lid}" fill="${wood()}"/>
		${S.woodGrain(`<path d="${lid}"/>`, true, { seed: 61, strength: 0.5 })}
		${S.crescent(`<path d="${lid}"/>`, '#2A1606', -16, -12, 0.45)}
		<path d="M 52 96 L 176 112 M 76 76 L 200 92" stroke="${INK}" stroke-width="2.4" opacity="0.6"/>
		<path d="${lid}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
		${banana(92, 122, -20, 1.06)}
		${banana(164, 124, 22, 1.04)}
		${banana(128, 112, 2, 1.18)}
		<path d="${front}" fill="${wood()}"/>
		${S.woodGrain(`<path d="${front}"/>`, true, { seed: 62, strength: 0.55 })}
		${S.crescent(`<path d="${front}"/>`, '#2A1606', -40, -10, 0.5)}
		${S.crescent(`<path d="${front}"/>`, '#FFD27A', 5, 3, 0.8)}
		<path d="M 48 164 L 208 164 M 50 196 L 205 196" stroke="${INK}" stroke-width="2.6" opacity="0.75"/>
		<path d="M 48 166 L 208 166 M 50 198 L 205 198" stroke="#E3B070" stroke-width="1.4" opacity="0.6"/>
		<text x="128" y="190" font-family="Titan One, Arial Black, sans-serif" font-size="30" letter-spacing="3"
			text-anchor="middle" fill="#2E1A08" opacity="0.8">AMMO</text>
		${S.grain(`<path d="${front}"/>`, { seed: 63, strength: 0.18 })}
		<path d="${front}" fill="none" stroke="${INK}" stroke-width="${LW}" stroke-linejoin="round"/>
		${corner('M 44 132 L 80 132 L 79 154 L 45 154 Z')}
		${corner('M 176 132 L 212 132 L 210 154 L 177 154 Z')}
		${corner('M 50 204 L 80 204 L 80 226 L 54 226 Z')}
		${corner('M 176 204 L 206 204 L 202 226 L 176 226 Z')}
		<g fill="#E9EDEF" stroke="${INK}" stroke-width="1.4">
			<circle cx="54" cy="142" r="3"/><circle cx="70" cy="142" r="3"/><circle cx="186" cy="142" r="3"/><circle cx="202" cy="142" r="3"/>
			<circle cx="62" cy="216" r="3"/><circle cx="192" cy="216" r="3"/>
		</g>`;

	symbols.h3 = S.svg(`${inner}${fitCard(body)}${frame}`);
}

// ─── h4 指北針（青藍框） ─────────────────────────────────────────────────────
{
	const S = new Sym();
	const { inner, frame } = cardFrame(
		S,
		{ light: '#6BE3EE', mid: '#1A93A8', dark: '#0B4656', bgIn: '#154A56', bgOut: '#03101A', leaf: '#01070C' },
		71,
	);
	const rose = (() => {
		let d = '';
		for (let i = 0; i < 16; i++) {
			const a = ((i * 22.5 - 90) * Math.PI) / 180;
			const R = i % 2 === 0 ? 54 : 32;
			const w = i % 2 === 0 ? 0.16 : 0.1;
			d += `M 128 134 L ${(128 + R * Math.cos(a - w)).toFixed(1)} ${(134 + R * Math.sin(a - w)).toFixed(1)} L ${(128 + R * Math.cos(a)).toFixed(1)} ${(134 + R * Math.sin(a)).toFixed(1)} Z `;
		}
		return d;
	})();
	const caseShape = `<circle cx="128" cy="136" r="92"/>`;
	const body = `
		<circle cx="128" cy="34" r="16" fill="none" stroke="${INK}" stroke-width="12"/>
		<circle cx="128" cy="34" r="16" fill="none" stroke="${S.lgUser(
			[
				[0, '#F4F7F8'],
				[1, '#56616A'],
			],
			112,
			18,
			144,
			50,
		)}" stroke-width="6"/>
		<rect x="118" y="44" width="20" height="14" rx="4" fill="${S.lg([
			[0, '#DDE3E6'],
			[1, '#5A646B'],
		])}" stroke="${INK}" stroke-width="3"/>
		<circle cx="128" cy="136" r="92" fill="${S.lg(
			[
				[0, '#F1F5F6'],
				[0.45, '#9EAAB1'],
				[1, '#3C464C'],
			],
			0.2,
			0,
			0.8,
			1,
		)}"/>
		${S.crescent(caseShape, '#9FF6FF', 6, 4, 0.85)}
		${S.grain(caseShape, { seed: 81, strength: 0.15 })}
		<circle cx="128" cy="136" r="92" fill="none" stroke="${INK}" stroke-width="${LW}"/>
		<circle cx="128" cy="136" r="76" fill="${S.lg([
			[0, '#2A3338'],
			[1, '#687680'],
		])}" stroke="${INK}" stroke-width="3.4"/>
		<circle cx="128" cy="136" r="68" fill="${S.rg(
			[
				[0, '#3FE0E6'],
				[0.55, '#11909C'],
				[1, '#063E48'],
			],
			0.45,
			0.4,
			0.65,
		)}" stroke="${INK}" stroke-width="3"/>
		<circle cx="128" cy="136" r="60" fill="none" stroke="#A8FBF6" stroke-width="1.2" stroke-dasharray="1.5 5.2" opacity="0.8"/>
		<path d="${rose}" fill="#C9FFF9" stroke="#063A42" stroke-width="1.6" stroke-linejoin="round" opacity="0.9"/>
		<g transform="rotate(-28 128 136)">
			<path d="M 128 136 L 142 150 L 128 70 Z" fill="#B7141C"/>
			<path d="M 128 136 L 114 150 L 128 70 Z" fill="#FF6A5A"/>
			<path d="M 128 136 L 142 122 L 128 202 Z" fill="#B8870F"/>
			<path d="M 128 136 L 114 122 L 128 202 Z" fill="#FFE17A"/>
			<path d="M 128 70 L 142 150 L 128 136 L 114 150 Z M 128 202 L 142 122 L 128 136 L 114 122 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
		</g>
		<circle cx="128" cy="136" r="9" fill="${S.lg([
			[0, '#F2F4F5'],
			[1, '#4A5358'],
		])}" stroke="${INK}" stroke-width="3"/>
		<g font-family="Titan One, Arial Black, sans-serif" font-size="21" text-anchor="middle" fill="#F4FFFD" stroke="#052E35" stroke-width="3.5" paint-order="stroke">
			<text x="128" y="93">N</text><text x="128" y="197">S</text>
			<text x="75" y="144">W</text><text x="181" y="144">E</text>
		</g>
		<!-- 玻璃反光 -->
		<path d="M 76 104 C 90 80 116 70 140 70 C 118 78 100 92 90 112 Z" fill="#fff" opacity="0.35"/>
		<circle cx="166" cy="178" r="4" fill="#fff" opacity="0.6"/>`;

	symbols.h4 = S.svg(`${inner}${fitCard(body)}${frame}`);
}

// ─── 低賠：圓胖立體字＋主題道具（無框） ───────────────────────────────────────
const FONT = "Titan One, Arial Black, sans-serif";
const letter = (glyph, c, propBack, propFront, { size = 184, y = 190, dx = 0 } = {}) => {
	const S = new Sym();
	const X = 128 + dx;
	const DEPTH = 7;
	const t = (yy, extra) =>
		`<text x="${X}" y="${yy}" font-family="${FONT}" font-size="${size}" text-anchor="middle" ${extra}>${glyph}</text>`;
	const face = S.lgUser(
		[
			[0, c.light],
			[0.38, c.mid],
			[1, c.dark],
		],
		0,
		y - size * 0.72,
		0,
		y,
	);
	const glyphShape = t(y - DEPTH, '');
	const body = `
		${propBack(S)}
		<!-- 落影 -->
		${t(y + 6, `fill="#000" opacity="0.35" transform="translate(5 0)"`)}
		<!-- 外輪廓（正面＋擠出層一起包） -->
		${t(y, `fill="${INK}" stroke="${INK}" stroke-width="11" stroke-linejoin="round"`)}
		${t(y - DEPTH, `fill="${INK}" stroke="${INK}" stroke-width="11" stroke-linejoin="round"`)}
		<!-- 擠出厚度 -->
		${t(y, `fill="${c.deep}"`)}
		<!-- 正面 -->
		${t(y - DEPTH, `fill="${face}"`)}
		${S.clip(
			glyphShape,
			`
			${t(y - DEPTH + 5, `fill="${c.dark}" opacity="0.55"`)}
			${t(y - DEPTH, `fill="${face}"`)}
			<ellipse cx="${X - 10}" cy="${y - size * 0.62}" rx="${size * 0.55}" ry="${size * 0.2}" fill="#fff" opacity="0.28"/>
			${t(y - DEPTH, `fill="none" stroke="#fff" stroke-width="2" opacity="0.45" transform="translate(-1.5 -1.5)"`)}
			${t(y - DEPTH, `fill="none" stroke="${c.deep}" stroke-width="3" opacity="0.5" transform="translate(2 2)"`)}`,
		)}
		${S.grain(glyphShape, { seed: 90 + glyph.charCodeAt(0), strength: 0.2 })}
		${t(y - DEPTH, `fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`)}
		${propFront(S)}
		<path d="M ${X + size * 0.32} ${y - size * 0.66} l 4 -12 l 4 12 l 12 4 l -12 4 l -4 12 l -4 -12 l -12 -4 Z" fill="#fff" opacity="0.9"/>`;
	return S.svg(body);
};

// 道具：彈鏈（A）
const ammoBelt = (S) => {
	let bullets = '';
	for (let i = 0; i < 8; i++) {
		const x = 42 + i * 24;
		const yb = 208 + Math.sin(i * 0.8) * 3;
		bullets += `
			<g transform="translate(${x} ${yb}) rotate(${-8 + i * 2})">
				<rect x="-7" y="-26" width="14" height="30" rx="3" fill="${S.lg(
					[
						[0, '#FFE9A0'],
						[0.5, '#D9A62C'],
						[1, '#8A5E0C'],
					],
					0,
					0,
					1,
					0,
				)}" stroke="${INK}" stroke-width="2.6"/>
				<path d="M -7 -26 C -7 -40 7 -40 7 -26 Z" fill="${S.lg(
					[
						[0, '#F5B48A'],
						[1, '#9A4A22'],
					],
					0,
					0,
					1,
					0,
				)}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
				<path d="M -3 -22 L -3 0" stroke="#fff" stroke-width="2" opacity="0.7"/>
			</g>`;
	}
	return `
		${bullets}
		<path d="M 26 212 C 80 220 176 220 230 208 L 232 226 C 176 238 80 238 24 230 Z" fill="${S.lg([
			[0, '#6F7A3A'],
			[1, '#2F3514'],
		])}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
		<path d="M 30 218 C 80 226 176 226 228 214" fill="none" stroke="#A8B468" stroke-width="1.6" opacity="0.8"/>`;
};

// 道具：狗牌（K）
const dogTags = (S) => {
	const tag = (x, y, r) => `
		<g transform="translate(${x} ${y}) rotate(${r})">
			<rect x="-15" y="-22" width="30" height="44" rx="11" fill="${S.lg(
				[
					[0, '#F4F6F7'],
					[0.5, '#AAB3B8'],
					[1, '#555F65'],
				],
				0,
				0,
				1,
				1,
			)}" stroke="${INK}" stroke-width="2.8"/>
			<circle cx="0" cy="-14" r="3" fill="${INK}"/>
			<path d="M -8 -2 L 8 -2 M -8 5 L 6 5 M -8 12 L 4 12" stroke="#5B656B" stroke-width="2" stroke-linecap="round"/>
			<path d="M -10 -16 C -10 -20 -6 -21 -2 -21" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
		</g>`;
	return `
		<path d="M 74 40 C 110 70 150 78 196 150" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round" stroke-dasharray="0.1 7.2"/>
		<path d="M 74 40 C 110 70 150 78 196 150" fill="none" stroke="#D4DADD" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="0.1 7.2"/>
		${tag(206, 176, -8)}${tag(186, 186, 14)}`;
};

// 道具：叢林大葉（Q）
const jungleLeaves = (S) => {
	const leaf = (tf, a, b) => {
		const d = 'M 0 0 C 30 -30 80 -34 120 -6 C 80 20 30 22 0 0 Z';
		return `
		<g transform="${tf}">
			<path d="${d}" fill="${S.lg(
				[
					[0, a],
					[1, b],
				],
				0,
				0,
				0,
				1,
			)}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
			<path d="M 4 0 C 40 -6 80 -8 116 -6" fill="none" stroke="#D8F59A" stroke-width="2" opacity="0.8"/>
			<path d="M 36 -3 L 48 -18 M 62 -5 L 76 -22 M 88 -6 L 100 -18 M 36 -2 L 50 12 M 62 -4 L 76 14" stroke="#244E10" stroke-width="1.6" opacity="0.7"/>
		</g>`;
	};
	return `
		${leaf('translate(40 214) rotate(-18)', '#7FC43C', '#2C5A12')}
		${leaf('translate(222 222) rotate(200) scale(1 -1)', '#6DB432', '#234A0E')}
		${leaf('translate(92 232) rotate(-4) scale(0.8)', '#94D24E', '#2F6414')}`;
};

// 道具：繩圈（J）
const ropeCoil = (S) => {
	const rope = S.lgUser(
		[
			[0, '#F2D79A'],
			[1, '#9C7438'],
		],
		0,
		180,
		0,
		240,
	);
	let loops = '';
	for (let i = 0; i < 3; i++) {
		const ry = 18 - i * 2;
		const cy = 214 - i * 9;
		loops += `
			<ellipse cx="96" cy="${cy}" rx="${56 - i * 6}" ry="${ry}" fill="none" stroke="${INK}" stroke-width="11"/>
			<ellipse cx="96" cy="${cy}" rx="${56 - i * 6}" ry="${ry}" fill="none" stroke="${rope}" stroke-width="6.5"/>
			<ellipse cx="96" cy="${cy}" rx="${56 - i * 6}" ry="${ry}" fill="none" stroke="#6E4E1E" stroke-width="6.5" stroke-dasharray="2 5" opacity="0.6"/>`;
	}
	return `${loops}
		<path d="M 150 206 C 186 214 206 196 224 170" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
		<path d="M 150 206 C 186 214 206 196 224 170" fill="none" stroke="${rope}" stroke-width="6.5" stroke-linecap="round"/>
		<path d="M 150 206 C 186 214 206 196 224 170" fill="none" stroke="#6E4E1E" stroke-width="6.5" stroke-dasharray="2 5" opacity="0.6"/>`;
};

// 道具：沙包（10）
const sandbags = (S) => {
	const bag = (x, y, w, r) => {
		const d = `M ${-w / 2} -6 C ${-w / 2} -22 ${w / 2} -22 ${w / 2} -6 C ${w / 2 + 6} 4 ${w / 2} 18 ${w / 2 - 6} 18 L ${-w / 2 + 6} 18 C ${-w / 2} 18 ${-w / 2 - 6} 4 ${-w / 2} -6 Z`;
		return `
		<g transform="translate(${x} ${y}) rotate(${r})">
			<path d="${d}" fill="${S.lg([
				[0, '#E9D29A'],
				[0.55, '#BF9E5A'],
				[1, '#77592A'],
			])}"/>
			${S.grain(`<path d="${d}"/>`, { freq: 1.2, strength: 0.25, seed: Math.round(x) })}
			<path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
			<path d="M ${-w / 2 + 6} -2 L ${w / 2 - 6} -2" stroke="#6A4E22" stroke-width="1.8" stroke-dasharray="4 3"/>
			<path d="M ${-w / 2 + 8} -12 C ${-w / 4} -17 0 -17 ${w / 6} -15" fill="none" stroke="#FFF3CC" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>
		</g>`;
	};
	return `${bag(70, 222, 92, -3)}${bag(178, 222, 92, 3)}${bag(124, 204, 84, 0)}`;
};

const none = () => '';
symbols.l1 = letter('A', { light: '#E3B6FF', mid: '#A65BEA', dark: '#6A22B0', deep: '#3C0E6C' }, none, ammoBelt, { y: 186 });
symbols.l2 = letter('K', { light: '#FFD29A', mid: '#F5821E', dark: '#B4500A', deep: '#6E2E04' }, none, dogTags, { y: 190, dx: -10 });
symbols.l3 = letter('Q', { light: '#FFF0A6', mid: '#F7BC20', dark: '#B87D06', deep: '#6E4802' }, jungleLeaves, none, { y: 184 });
symbols.l4 = letter('J', { light: '#AFD0FF', mid: '#3D7CEB', dark: '#1B45A6', deep: '#0C2562' }, none, ropeCoil, { y: 184, dx: 22 });
symbols.l5 = letter('10', { light: '#FFB0A2', mid: '#E0352E', dark: '#98151A', deep: '#5A080C' }, none, sandbags, { size: 160, y: 182 });

// ─── 輸出 ────────────────────────────────────────────────────────────────────
const render = (svg, outPath, width) => {
	const resvg = new Resvg(svg, {
		fitTo: { mode: 'width', value: width },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Titan One' },
	});
	fs.writeFileSync(outPath, resvg.render().asPng());
};

const order = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5'];
for (const name of order) {
	render(symbols[name], path.join(OUT_DIR, `${name}.png`), 1024);
	console.log('rendered', name);
}

// 聯絡表（底色仿 PP 盤面的暗紫）
let sheet = `<rect width="1330" height="620" fill="#2A1822"/>`;
order.forEach((name, i) => {
	const col = i % 5;
	const row = Math.floor(i / 5);
	const inner = symbols[name].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
	sheet += `<g transform="translate(${30 + col * 260} ${30 + row * 290}) scale(0.9)">${inner}</g>`;
	sheet += `<text x="${30 + col * 260 + 115}" y="${30 + row * 290 + 262}" font-family="Arial, sans-serif" font-size="22" fill="#9a8a94" text-anchor="middle">${name}</text>`;
});
render(
	`<svg xmlns="http://www.w3.org/2000/svg" width="1330" height="620" viewBox="0 0 1330 620">${sheet}</svg>`,
	path.join(appRoot, 'design/pp_contact_sheet.png'),
	1330,
);
console.log('contact sheet -> design/pp_contact_sheet.png');
