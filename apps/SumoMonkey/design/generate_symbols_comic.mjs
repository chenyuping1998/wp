// GoBananas comic-sticker symbol set (方案B 美式漫畫貼紙風).
// Concepts follow the jungle-commando reference in design/reference/ but are
// redrawn from scratch: bold ink, flat fills, halftone shading, white sticker
// rim, attitude faces. Backgrounds/frame keep their own generator.
// Usage: node design/generate_symbols_comic.mjs <dir containing node_modules with @resvg/resvg-js>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node generate_symbols_comic.mjs <dir with node_modules/@resvg/resvg-js>');
	process.exit(1);
}
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYM_DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbols');
fs.mkdirSync(SYM_DIR, { recursive: true });

// ─── style constants ─────────────────────────────────────────────────────────
const INK = '#211a12'; // warm near-black comic ink
const RIM = 14; // white sticker rim width

const svgWrap = (w, h, body, defs = '') =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;

// white sticker rim: paint the silhouette paths fat-stroked white underneath
const sticker = (paths, rim = RIM) =>
	`<g fill="#fff" stroke="#fff" stroke-width="${rim}" stroke-linejoin="round" stroke-linecap="round">${paths}</g>`;

// staggered halftone dot patch clipped to a region
let clipSeq = 0;
const halftone = (clipPathBody, x0, y0, x1, y1, dotFill, r = 3.2, step = 11, opacity = 0.85) => {
	const id = `ht${clipSeq++}`;
	let dots = '';
	let rowIndex = 0;
	for (let y = y0; y <= y1; y += step) {
		const offset = rowIndex % 2 === 0 ? 0 : step / 2;
		for (let x = x0 + offset; x <= x1; x += step) {
			dots += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
		}
		rowIndex++;
	}
	return `<clipPath id="${id}">${clipPathBody}</clipPath><g clip-path="url(#${id})" fill="${dotFill}" opacity="${opacity}">${dots}</g>`;
};

// attitude face: slanted brows, glinty eyes, cocky grin
const face = (cx, cy, s = 1, mood = 'grin') => {
	const brows = `
	<path d="M ${cx - 26 * s} ${cy - 16 * s} L ${cx - 8 * s} ${cy - 9 * s}" stroke="${INK}" stroke-width="${6 * s}" stroke-linecap="round"/>
	<path d="M ${cx + 26 * s} ${cy - 16 * s} L ${cx + 8 * s} ${cy - 9 * s}" stroke="${INK}" stroke-width="${6 * s}" stroke-linecap="round"/>`;
	const eyes = `
	<ellipse cx="${cx - 15 * s}" cy="${cy} " rx="${6 * s}" ry="${7 * s}" fill="${INK}"/>
	<circle cx="${cx - 13 * s}" cy="${cy - 2.5 * s}" r="${2.2 * s}" fill="#fff"/>
	<ellipse cx="${cx + 15 * s}" cy="${cy}" rx="${6 * s}" ry="${7 * s}" fill="${INK}"/>
	<circle cx="${cx + 17 * s}" cy="${cy - 2.5 * s}" r="${2.2 * s}" fill="#fff"/>`;
	const mouth =
		mood === 'grit'
			? `<g>
				<path d="M ${cx - 16 * s} ${cy + 12 * s} Q ${cx} ${cy + 20 * s} ${cx + 16 * s} ${cy + 12 * s} L ${cx + 14 * s} ${cy + 22 * s} Q ${cx} ${cy + 28 * s} ${cx - 14 * s} ${cy + 22 * s} Z" fill="#fff" stroke="${INK}" stroke-width="${4 * s}" stroke-linejoin="round"/>
				<path d="M ${cx - 7 * s} ${cy + 15 * s} L ${cx - 7 * s} ${cy + 23 * s} M ${cx} ${cy + 16.5 * s} L ${cx} ${cy + 24.5 * s} M ${cx + 7 * s} ${cy + 15 * s} L ${cx + 7 * s} ${cy + 23 * s}" stroke="${INK}" stroke-width="${2.6 * s}"/>
			</g>`
			: `<path d="M ${cx - 12 * s} ${cy + 14 * s} Q ${cx + 2 * s} ${cy + 24 * s} ${cx + 16 * s} ${cy + 12 * s} L ${cx + 12 * s} ${cy + 19 * s} Q ${cx} ${cy + 26 * s} ${cx - 12 * s} ${cy + 14 * s} Z" fill="${INK}"/>`;
	return brows + eyes + mouth;
};

// three short action ticks at a corner
const ticks = (x, y, angleDeg, s = 1, color = INK) => `
	<g transform="translate(${x} ${y}) rotate(${angleDeg}) scale(${s})" stroke="${color}" stroke-width="5" stroke-linecap="round">
		<path d="M 0 0 L 14 0 M 4 -12 L 16 -7 M 4 12 L 16 7"/>
	</g>`;

const star4 = (x, y, s, fill = '#FAC775') =>
	`<path d="M ${x} ${y - 9 * s} Q ${x + 2 * s} ${y - 2 * s} ${x + 9 * s} ${y} Q ${x + 2 * s} ${y + 2 * s} ${x} ${y + 9 * s} Q ${x - 2 * s} ${y + 2 * s} ${x - 9 * s} ${y} Q ${x - 2 * s} ${y - 2 * s} ${x} ${y - 9 * s} Z" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;

const symbols = {};

// ─── H1 army helmet + goggles ────────────────────────────────────────────────
{
	const dome = `M 36 128 L 42 88 L 66 56 L 108 40 L 152 42 L 192 62 L 212 94 L 216 128 L 128 138 Z`;
	const brimPath = `M 26 128 L 230 128 L 222 150 L 34 150 Z`;
	symbols.h1 = svgWrap(
		256,
		256,
		`
		${sticker(`<path d="${dome}"/><path d="${brimPath}"/><rect x="60" y="140" width="136" height="52" rx="20"/>`)}
		<path d="${dome}" fill="#639922" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<path d="M 66 56 L 108 40 L 122 62 L 84 84 Z" fill="#97C459"/>
		<path d="M 150 44 L 190 62 L 172 84 L 140 66 Z" fill="#3B6D11"/>
		<path d="M 58 96 L 92 84 L 104 108 L 70 118 Z" fill="#3B6D11"/>
		${halftone(`<path d="${dome}"/>`, 130, 90, 220, 140, '#27500A', 3.4, 12)}
		<path d="${brimPath}" fill="#4d7a19" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<rect x="60" y="140" width="136" height="50" rx="18" fill="#D4537E" stroke="${INK}" stroke-width="8"/>
		<rect x="74" y="150" width="44" height="30" rx="12" fill="#ED93B1" stroke="${INK}" stroke-width="6"/>
		<rect x="138" y="150" width="44" height="30" rx="12" fill="#ED93B1" stroke="${INK}" stroke-width="6"/>
		<path d="M 80 156 L 96 152 M 144 156 L 160 152" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
		<rect x="118" y="156" width="20" height="16" rx="5" fill="#993556" stroke="${INK}" stroke-width="5"/>
		<path d="M 40 160 L 60 164 M 196 164 L 216 160" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
		${star4(220, 52, 1.1)}
		${ticks(20, 70, -160, 0.9)}
		`,
	);
}

// ─── H2 flame fruit ──────────────────────────────────────────────────────────
{
	const berry = `M 128 96 L 168 108 L 186 148 L 172 192 L 128 208 L 84 192 L 70 148 L 88 108 Z`;
	const flame = `M 128 10 L 148 44 L 170 28 L 164 66 L 196 62 L 172 94 L 146 88 L 128 96 L 108 88 L 84 96 L 60 64 L 94 66 L 86 30 L 110 46 Z`;
	symbols.h2 = svgWrap(
		256,
		256,
		`
		${sticker(`<path d="${flame}"/><path d="${berry}"/>`)}
		<path d="${flame}" fill="#EF9F27" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<path d="M 128 34 L 140 56 L 156 48 L 150 74 L 128 88 L 106 74 L 102 50 L 116 58 Z" fill="#E24B4A"/>
		<path d="M 128 52 L 136 68 L 128 82 L 118 68 Z" fill="#FAC775"/>
		<path d="${berry}" fill="#E24B4A" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
		<path d="M 88 110 L 128 98 L 148 106 L 108 122 Z" fill="#F09595"/>
		${halftone(`<path d="${berry}"/>`, 130, 150, 200, 212, '#A32D2D', 3.4, 12)}
		${face(128, 152, 1.05, 'grit')}
		${ticks(212, 120, 20, 0.9)}
		${star4(52, 118, 0.9)}
		`,
	);
}

// ─── H3 pineapple grenade ────────────────────────────────────────────────────
{
	const body = `M 84 92 L 172 92 L 190 132 L 176 196 L 128 214 L 80 196 L 66 132 Z`;
	const leaves = `M 128 88 L 100 44 L 122 62 L 128 30 L 136 62 L 158 42 L 132 88 Z`;
	symbols.h3 = svgWrap(
		256,
		256,
		`
		${sticker(
			`<path d="${leaves}"/><path d="${body}"/><circle cx="56" cy="74" r="20"/><rect x="66" y="62" width="26" height="22" rx="5"/>`,
		)}
		<path d="${leaves}" fill="#639922" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<path d="M 112 60 L 128 38 L 132 62 L 122 76 Z" fill="#97C459"/>
		<path d="${body}" fill="#EF9F27" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
		<path d="M 84 94 L 170 94 L 182 128 L 74 128 Z" fill="#FAC775" opacity="0.85"/>
		<g stroke="#BA7517" stroke-width="4" opacity="0.9">
			<path d="M 74 112 L 176 202 M 66 142 L 148 212 M 92 96 L 190 178 M 130 96 L 192 148"/>
			<path d="M 182 112 L 82 202 M 190 142 L 110 212 M 164 96 L 68 178 M 128 96 L 66 148"/>
		</g>
		${halftone(`<path d="${body}"/>`, 130, 160, 200, 218, '#854F0B', 3.2, 11)}
		<circle cx="56" cy="74" r="17" fill="none" stroke="#B4B2A9" stroke-width="9"/>
		<circle cx="56" cy="74" r="17" fill="none" stroke="${INK}" stroke-width="3.5"/>
		<rect x="68" y="63" width="24" height="20" rx="4" fill="#888780" stroke="${INK}" stroke-width="5"/>
		${face(128, 152, 1, 'grin')}
		${ticks(210, 78, 15, 0.95)}
		`,
	);
}

// ─── H4 grape TNT bomb ───────────────────────────────────────────────────────
{
	const cluster = `M 128 78 L 176 96 L 196 140 L 178 190 L 128 210 L 78 190 L 60 140 L 80 96 Z`;
	symbols.h4 = svgWrap(
		256,
		256,
		`
		${sticker(`<path d="${cluster}"/><path d="M 122 78 L 134 78 L 138 44 L 118 44 Z"/>`)}
		<path d="M 122 80 L 134 80 L 138 44 L 118 44 Z" fill="${INK}"/>
		<path d="M 128 10 L 136 26 L 152 20 L 144 38 L 128 44 L 112 36 L 106 20 L 120 26 Z" fill="#EF9F27" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
		<circle cx="128" cy="30" r="7" fill="#FAC775"/>
		<path d="${cluster}" fill="#7F77DD" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
		<g stroke="${INK}" stroke-width="6">
			<circle cx="96" cy="118" r="26" fill="#AFA9EC"/>
			<circle cx="160" cy="118" r="26" fill="#AFA9EC"/>
			<circle cx="76" cy="162" r="24" fill="#7F77DD"/>
			<circle cx="180" cy="162" r="24" fill="#7F77DD"/>
			<circle cx="128" cy="182" r="26" fill="#534AB7"/>
			<circle cx="128" cy="132" r="34" fill="#9b93ea"/>
		</g>
		${halftone(`<path d="${cluster}"/>`, 130, 156, 208, 214, '#3C3489', 3.4, 12)}
		<path d="M 56 128 L 200 128 L 194 156 L 62 156 Z" fill="#E24B4A" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
		<text x="128" y="151" font-family="Arial, sans-serif" font-weight="900" font-size="26" text-anchor="middle" fill="#fff" stroke="${INK}" stroke-width="1.5">TNT</text>
		<circle cx="88" cy="104" r="8" fill="#fff" opacity="0.5"/>
		<circle cx="152" cy="104" r="8" fill="#fff" opacity="0.5"/>
		${ticks(214, 88, 25, 0.9)}
		`,
	);
}

// ─── royal gem letters ───────────────────────────────────────────────────────
const gemLetter = (glyph, bright, mid, dark, fontSize = 150) =>
	svgWrap(
		256,
		256,
		`
		<text x="128" y="192" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="${fontSize}"
			text-anchor="middle" fill="#fff" stroke="#fff" stroke-width="34" stroke-linejoin="round">${glyph}</text>
		<text x="128" y="192" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="${fontSize}"
			text-anchor="middle" fill="${mid}" stroke="${INK}" stroke-width="14" paint-order="stroke" stroke-linejoin="round">${glyph}</text>
		<clipPath id="glyph${glyph}"><text x="128" y="192" font-family="Arial, 'Segoe UI', sans-serif" font-weight="900" font-size="${fontSize}" text-anchor="middle">${glyph}</text></clipPath>
		<g clip-path="url(#glyph${glyph})">
			<path d="M 20 20 L 236 20 L 236 96 L 20 132 Z" fill="${bright}"/>
			<path d="M 20 176 L 236 148 L 236 236 L 20 236 Z" fill="${dark}"/>
			<path d="M 30 20 L 96 236 L 76 236 L 14 20 Z" fill="#ffffff" opacity="0.45"/>
		</g>
		${star4(206, 60, 1, '#fff')}
		${ticks(34, 200, 150, 0.75)}
		`,
	);

symbols.l1 = gemLetter('A', '#F09595', '#E24B4A', '#A32D2D');
symbols.l2 = gemLetter('K', '#9FE1CB', '#5DCAA5', '#1D9E75');
symbols.l3 = gemLetter('Q', '#CECBF6', '#AFA9EC', '#7F77DD');
symbols.l4 = gemLetter('J', '#C0DD97', '#97C459', '#639922');
symbols.l5 = gemLetter('10', '#B5D4F4', '#85B7EB', '#378ADD', 128);

// ─── S golden banana bunch (scatter) ─────────────────────────────────────────
{
	// three solid crescents fanning out from a shared stem, angular comic cuts
	const banana1 = `M 92 62 Q 52 110 66 168 Q 76 208 122 220 L 138 204 Q 100 192 90 156 Q 82 116 112 74 Z`;
	const banana2 = `M 116 58 Q 100 120 122 172 Q 138 206 182 210 L 190 190 Q 156 182 142 148 Q 128 110 138 66 Z`;
	const banana3 = `M 142 62 Q 156 116 192 148 Q 214 166 232 164 L 230 142 Q 206 138 186 110 Q 168 86 164 58 Z`;
	const stem = `M 96 46 L 168 42 L 174 68 L 102 74 Z`;
	symbols.s = svgWrap(
		256,
		256,
		`
		${sticker(`<path d="${banana1}"/><path d="${banana2}"/><path d="${banana3}"/><path d="${stem}"/>`)}
		<path d="${banana3}" fill="#EF9F27" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<path d="${banana2}" fill="#FAC775" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<path d="${banana1}" fill="#FAC775" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
		<path d="M 96 78 Q 70 120 80 162 L 92 158 Q 84 120 106 82 Z" fill="#fff" opacity="0.65"/>
		${halftone(`<path d="${banana2}"/>`, 118, 150, 190, 212, '#BA7517', 3, 11)}
		<path d="${stem}" fill="#854F0B" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
		<path d="M 112 216 L 130 226 L 116 232 Z" fill="#854F0B" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
		${star4(216, 78, 1.2)}
		${star4(44, 100, 0.9)}
		${star4(210, 220, 0.8)}
		`,
	);
}

// ─── W commando monkey ───────────────────────────────────────────────────────
const monkeyHeadComic = (cx, cy, s) => `
	<circle cx="${cx - 58 * s}" cy="${cy - 6 * s}" r="${22 * s}" fill="#a9745b" stroke="${INK}" stroke-width="${7 * s}"/>
	<circle cx="${cx + 58 * s}" cy="${cy - 6 * s}" r="${22 * s}" fill="#a9745b" stroke="${INK}" stroke-width="${7 * s}"/>
	<circle cx="${cx - 58 * s}" cy="${cy - 6 * s}" r="${10 * s}" fill="#e8b795"/>
	<circle cx="${cx + 58 * s}" cy="${cy - 6 * s}" r="${10 * s}" fill="#e8b795"/>
	<path d="M ${cx - 54 * s} ${cy - 36 * s} L ${cx - 60 * s} ${cy + 26 * s} L ${cx - 28 * s} ${cy + 52 * s} L ${cx + 28 * s} ${cy + 52 * s} L ${cx + 60 * s} ${cy + 26 * s} L ${cx + 54 * s} ${cy - 36 * s} Z"
		fill="#8a5a3c" stroke="${INK}" stroke-width="${8 * s}" stroke-linejoin="round"/>
	<path d="M ${cx - 38 * s} ${cy - 8 * s} L ${cx - 40 * s} ${cy + 22 * s} L ${cx - 18 * s} ${cy + 42 * s} L ${cx + 18 * s} ${cy + 42 * s} L ${cx + 40 * s} ${cy + 22 * s} L ${cx + 38 * s} ${cy - 8 * s} L ${cx} ${cy - 18 * s} Z" fill="#e8b795"/>
	<path d="M ${cx - 30 * s} ${cy - 12 * s} L ${cx - 10 * s} ${cy - 4 * s}" stroke="${INK}" stroke-width="${6 * s}" stroke-linecap="round"/>
	<path d="M ${cx + 30 * s} ${cy - 18 * s} L ${cx + 10 * s} ${cy - 6 * s}" stroke="${INK}" stroke-width="${6 * s}" stroke-linecap="round"/>
	<ellipse cx="${cx - 16 * s}" cy="${cy + 4 * s}" rx="${6 * s}" ry="${7 * s}" fill="${INK}"/>
	<circle cx="${cx - 14 * s}" cy="${cy + 1.5 * s}" r="${2.2 * s}" fill="#fff"/>
	<ellipse cx="${cx + 16 * s}" cy="${cy + 2 * s}" rx="${6 * s}" ry="${7 * s}" fill="${INK}"/>
	<circle cx="${cx + 18 * s}" cy="${cy - 0.5 * s}" r="${2.2 * s}" fill="#fff"/>
	<path d="M ${cx - 12 * s} ${cy + 22 * s} Q ${cx + 4 * s} ${cy + 32 * s} ${cx + 20 * s} ${cy + 20 * s} L ${cx + 15 * s} ${cy + 28 * s} Q ${cx + 2 * s} ${cy + 34 * s} ${cx - 12 * s} ${cy + 22 * s} Z" fill="${INK}"/>
	<path d="M ${cx - 60 * s} ${cy - 30 * s} L ${cx - 66 * s} ${cy - 48 * s} L ${cx - 30 * s} ${cy - 62 * s} L ${cx + 30 * s} ${cy - 62 * s} L ${cx + 66 * s} ${cy - 48 * s} L ${cx + 60 * s} ${cy - 30 * s} L ${cx + 50 * s} ${cy - 24 * s} L ${cx - 50 * s} ${cy - 24 * s} Z"
		fill="#639922" stroke="${INK}" stroke-width="${8 * s}" stroke-linejoin="round"/>
	<path d="M ${cx - 30 * s} ${cy - 60 * s} L ${cx - 6 * s} ${cy - 62 * s} L ${cx - 14 * s} ${cy - 42 * s} L ${cx - 36 * s} ${cy - 44 * s} Z" fill="#97C459"/>
	<path d="M ${cx + 12 * s} ${cy - 56 * s} L ${cx + 40 * s} ${cy - 52 * s} L ${cx + 30 * s} ${cy - 36 * s} L ${cx + 6 * s} ${cy - 40 * s} Z" fill="#3B6D11"/>`;

{
	// sticker silhouette hugs the helmet + face + ears (no slab above the helmet)
	const headSil = `M 68 74 L 62 56 L 98 42 L 158 42 L 194 56 L 188 74 L 190 130 L 156 156 L 100 156 L 66 130 Z`;
	symbols.w = svgWrap(
		256,
		256,
		`
		${sticker(`<path d="${headSil}"/><circle cx="70" cy="98" r="24"/><circle cx="186" cy="98" r="24"/><path d="M 20 186 L 236 186 L 244 216 L 12 216 Z"/>`)}
		${monkeyHeadComic(128, 104, 1)}
		<path d="M 30 176 L 226 176 L 214 166 L 196 172 L 42 172 Z" fill="#5F5E5A" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
		<path d="M 20 186 L 236 186 L 244 214 L 12 214 Z" fill="#EF9F27" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
		<text x="128" y="209" font-family="Arial, sans-serif" font-weight="900" font-size="30" text-anchor="middle" fill="#fff" stroke="${INK}" stroke-width="2">WILD</text>
		${ticks(224, 44, 25, 1)}
		${star4(34, 52, 1)}
		`,
	);
}

// ─── WX full-body commando monkey (256 × 1280, fills the reel) ───────────────
{
	symbols.wx = svgWrap(
		256,
		1280,
		`
		<g stroke="#2b8a3e" stroke-width="18" fill="none" opacity="0.5">
			<path d="M 60 0 L 40 220 L 90 430 M 200 860 L 226 1060 L 190 1280"/>
		</g>
		<g fill="#37b24d" opacity="0.6" stroke="${INK}" stroke-width="4">
			<path d="M 40 200 L 86 176 L 76 216 Z"/>
			<path d="M 210 1040 L 168 1020 L 186 1062 Z"/>
		</g>
		${ticks(30, 500, 170, 1.3)}
		${ticks(226, 560, 10, 1.3)}
		${star4(38, 420, 1.4)}
		${star4(218, 470, 1.1)}
		${star4(44, 1150, 1.2)}
		<path d="M 168 1105 L 232 1062 L 224 972 L 186 950 L 196 986 L 206 1044 L 158 1082 Z"
			fill="#8a5a3c" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
		<path d="M 86 1160 L 74 1226 L 100 1252 L 116 1244 L 100 1220 L 108 1168 Z" fill="#8a5a3c" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<path d="M 170 1160 L 182 1226 L 156 1252 L 140 1244 L 156 1220 L 148 1168 Z" fill="#8a5a3c" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<path d="M 66 1240 L 118 1240 L 112 1268 L 62 1268 Z" fill="#444441" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
		<path d="M 190 1240 L 138 1240 L 144 1268 L 194 1268 Z" fill="#444441" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
		<path d="M 128 700 L 196 752 L 212 960 L 188 1130 L 128 1168 L 68 1130 L 44 960 L 60 752 Z"
			fill="#639922" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<path d="M 128 740 L 172 782 L 184 960 L 166 1104 L 128 1132 L 90 1104 L 72 960 L 84 782 Z" fill="#e8b795" stroke="${INK}" stroke-width="6"/>
		<path d="M 58 790 L 196 974 L 196 1014 L 58 830 Z" fill="#854F0B" stroke="${INK}" stroke-width="6"/>
		<g fill="#FAC775" stroke="${INK}" stroke-width="4">
			<rect x="84" y="830" width="16" height="26" rx="4" transform="rotate(50 92 843)"/>
			<rect x="120" y="878" width="16" height="26" rx="4" transform="rotate(50 128 891)"/>
			<rect x="156" y="926" width="16" height="26" rx="4" transform="rotate(50 164 939)"/>
		</g>
		${halftone(`<path d="M 128 700 L 196 752 L 212 960 L 188 1130 L 128 1168 L 68 1130 L 44 960 L 60 752 Z"/>`, 150, 1000, 208, 1160, '#3B6D11', 4, 15)}
		<path d="M 62 880 L 20 780 L 30 700 L 62 690 L 48 724 L 44 780 L 84 862 Z" fill="#8a5a3c" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<path d="M 194 880 L 236 780 L 226 700 L 194 690 L 208 724 L 212 780 L 172 862 Z" fill="#8a5a3c" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
		<g transform="rotate(-24 44 678)">
			<path d="M 20 678 L 44 664 L 68 678 L 60 696 L 28 696 Z" fill="#FAC775" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
		</g>
		<g transform="rotate(24 212 678)">
			<path d="M 188 678 L 212 664 L 236 678 L 228 696 L 196 696 Z" fill="#FAC775" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
		</g>
		${monkeyHeadComic(128, 600, 1.45)}
		`,
	);
}

// ─── cudgel replacement: giant banana the monkey twirls while expanding ──────
// Drawn along the 45° diagonal, centered — the wx spine attachment rotates it
// back so the twirl reads cleanly (same convention as the old 金箍棒 sprite).
{
	const blade = `M 34 222 Q 96 208 160 144 Q 208 96 222 36 L 196 40 Q 178 100 132 142 Q 84 186 40 196 Z`;
	symbols.cudgel = svgWrap(
		256,
		256,
		`
		${sticker(`<path d="${blade}"/>`)}
		<path d="${blade}" fill="#FAC775" stroke="${INK}" stroke-width="9" stroke-linejoin="round"/>
		<path d="M 52 204 Q 100 192 148 148 L 156 158 Q 106 200 60 210 Z" fill="#fff" opacity="0.6"/>
		${halftone(`<path d="${blade}"/>`, 130, 60, 230, 140, '#BA7517', 3, 11)}
		<path d="M 214 30 L 234 24 L 228 48 Z" fill="#854F0B" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
		<path d="M 30 226 L 44 232 L 34 240 Z" fill="#854F0B" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
		`,
	);
}

// ─── X dead crate tile (superspin) ───────────────────────────────────────────
{
	symbols.x = svgWrap(
		256,
		256,
		`
		<path d="M 48 48 L 208 48 L 214 208 L 42 208 Z" fill="#888780" stroke="#444441" stroke-width="8" stroke-linejoin="round" opacity="0.92"/>
		<path d="M 62 62 L 194 62 L 198 194 L 58 194 Z" fill="#B4B2A9" opacity="0.9"/>
		<path d="M 62 62 L 198 194 M 194 62 L 58 194" stroke="#5F5E5A" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
		<g fill="#444441" opacity="0.85">
			<circle cx="56" cy="56" r="5"/><circle cx="200" cy="56" r="5"/><circle cx="52" cy="200" r="5"/><circle cx="204" cy="200" r="5"/>
		</g>
		`,
	);
}

// ─── P prize coin (superspin) ────────────────────────────────────────────────
{
	symbols.p = svgWrap(
		256,
		256,
		`
		${sticker(`<circle cx="128" cy="128" r="100"/>`)}
		<circle cx="128" cy="128" r="98" fill="#EF9F27" stroke="${INK}" stroke-width="9"/>
		<g stroke="${INK}" stroke-width="4" opacity="0.9">
			<path d="M 128 32 L 128 48 M 128 208 L 128 224 M 32 128 L 48 128 M 208 128 L 224 128 M 60 60 L 72 72 M 184 184 L 196 196 M 196 60 L 184 72 M 72 184 L 60 196"/>
		</g>
		<circle cx="128" cy="128" r="72" fill="#FAC775" stroke="#854F0B" stroke-width="6"/>
		<g transform="rotate(-16 128 128)">
			<path d="M 96 100 L 84 150 L 108 186 L 146 196 L 170 184 L 158 176 L 126 168 L 108 138 L 106 108 Z"
				fill="#FFE8A8" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
		</g>
		${halftone(`<circle cx="128" cy="128" r="72"/>`, 130, 150, 205, 205, '#BA7517', 3.4, 12)}
		<path d="M 70 74 L 106 52" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
		${star4(196, 70, 1.2)}
		`,
	);
}

// ─── render all + contact sheet ──────────────────────────────────────────────
const render = (svg, outPath, width) => {
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: true } });
	fs.writeFileSync(outPath, resvg.render().asPng());
	console.log('rendered', path.basename(outPath));
};

for (const [name, svg] of Object.entries(symbols)) {
	render(svg, path.join(SYM_DIR, `${name}.png`), 256);
}

// contact sheet for quick review (design/ only, not shipped)
const order = ['h1', 'h2', 'h3', 'h4', 's', 'w', 'l1', 'l2', 'l3', 'l4', 'l5', 'x', 'p'];
let sheet = `<rect width="1300" height="560" fill="#2a4d3a"/>`;
order.forEach((name, i) => {
	const x = (i % 7) * 180 + 20;
	const y = Math.floor(i / 7) * 260 + 20;
	const inner = symbols[name].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
	sheet += `<g transform="translate(${x} ${y}) scale(0.63)">${inner}</g>`;
});
render(svgWrap(1300, 560, sheet), path.join(appRoot, 'design/comic_contact_sheet.png'), 1300);
console.log('done');
