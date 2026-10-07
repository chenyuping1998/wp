// Build a technical cutout from the approved transparent Frostline character.
// The source painting stays intact; these pieces are for the existing Spine rig.
//
//   node design/slice_frostline_monkey.mjs E:/stake/tools/gen
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) throw new Error('usage: node design/slice_frostline_monkey.mjs <dir with node_modules/pngjs>');
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(appRoot, 'design/source/character_concepts/frostline_monkey_fullbody_cutout_v2.png');
const outDir = path.join(appRoot, 'design/source/monkey_frostline');
const image = PNG.sync.read(fs.readFileSync(source));
if (image.width !== 1024 || image.height !== 1536) throw new Error('Frostline source size changed; review cut coordinates');
fs.mkdirSync(outDir, { recursive: true });

// A uniform reduction keeps the new character close to the old 560x912 rig.
const SCALE = 0.56;
const canvas = [Math.round(image.width * SCALE), Math.round(image.height * SCALE)];
const lerp = (points, y) => {
	if (y <= points[0][0]) return points[0][1];
	for (let i = 1; i < points.length; i++) {
		if (y <= points[i][0]) {
			const [y0, x0] = points[i - 1];
			const [y1, x1] = points[i];
			return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
		}
	}
	return points.at(-1)[1];
};
// Follow the sleeve/coat seams; the lower coat flares outward behind the
// hands, so the sleeve mask must narrow there or loose coat triangles swing.
const bodyLeft = (y) => lerp([[300, 330], [450, 320], [620, 300], [800, 255], [950, 260], [1080, 235]], y);
const bodyRight = (y) => lerp([[300, 690], [450, 730], [620, 755], [800, 795], [950, 785], [1080, 815]], y);
const headLeft = (y) => lerp([[0, 340], [320, 365], [360, 400], [420, 440], [460, 468]], y);
const headRight = (y) => lerp([[0, 745], [320, 720], [360, 630], [420, 590], [460, 550]], y);
const head = (x, y) => y < 455 && x >= headLeft(y) && x <= headRight(y);
const leftArm = (x, y) => y >= 300 && y <= 1080 && x <= (y < 835 ? bodyLeft(y) + 18 : lerp([[835, 260], [950, 255], [1080, 235]], y));
const rightArm = (x, y) => y >= 300 && y <= 1080 && x >= (y < 835 ? bodyRight(y) - 18 : lerp([[835, 790], [950, 795], [1080, 815]], y));
const torso = (x, y) => y >= 290 && y <= 1075 && x >= (y < 835 ? bodyLeft(y) - 12 : 280) && x <= (y < 835 ? bodyRight(y) + 12 : 775) && !head(x, y);
// The hands hang beside the coat hem at y≈1010. A plain horizontal leg cut
// would copy their fingertips into the thigh slots as detached fragments.
const leftLeg = (x, y) => y >= 1010 && y <= 1510 && x >= lerp([[1010, 265], [1100, 230], [1250, 130], [1510, 0]], y) && x <= 522;
const rightLeg = (x, y) => y >= 1010 && y <= 1510 && x >= 502 && x <= lerp([[1010, 785], [1100, 820], [1250, 920], [1510, 1024]], y);

const specs = [
	['left_leg_0_thigh', 0, (x, y) => leftLeg(x, y) && y <= 1225],
	['left_leg_1_calf', 1, (x, y) => leftLeg(x, y) && y >= 1190 && y <= 1355],
	['left_leg_2_foot', 2, (x, y) => leftLeg(x, y) && y >= 1325],
	['right_leg_0_thigh', 3, (x, y) => rightLeg(x, y) && y <= 1225],
	['right_leg_1_calf', 4, (x, y) => rightLeg(x, y) && y >= 1190 && y <= 1355],
	['right_leg_2_foot', 5, (x, y) => rightLeg(x, y) && y >= 1325],
	['torso_1_coat', 6, torso],
	['right_arm_0_upper_arm', 7, (x, y) => rightArm(x, y) && y <= 650],
	['right_arm_1_forearm', 8, (x, y) => rightArm(x, y) && y >= 620 && y <= 865],
	['right_arm_2_hand', 9, (x, y) => rightArm(x, y) && y >= 835],
	['left_arm_0_upper_arm', 10, (x, y) => leftArm(x, y) && y <= 650],
	['left_arm_1_forearm', 11, (x, y) => leftArm(x, y) && y >= 620 && y <= 865],
	['left_arm_2_hand', 12, (x, y) => leftArm(x, y) && y >= 835],
	['head_0_face', 13, head],
];

// Pixel sampling uses premultiplied RGBA so the transparent edge cannot pick
// up the dark RGB values under the source's zero-alpha background pixels.
const sample = (x, y) => {
	const sx = x / SCALE;
	const sy = y / SCALE;
	const x0 = Math.floor(sx), y0 = Math.floor(sy);
	const fx = sx - x0, fy = sy - y0;
	let a = 0, r = 0, g = 0, b = 0;
	for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
		const px = Math.min(image.width - 1, x0 + dx);
		const py = Math.min(image.height - 1, y0 + dy);
		const i = (py * image.width + px) * 4;
		const w = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy);
		const aa = image.data[i + 3] * w;
		a += aa;
		r += image.data[i] * aa;
		g += image.data[i + 1] * aa;
		b += image.data[i + 2] * aa;
	}
	return a < 1 ? [0, 0, 0, 0] : [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round(a)];
};

// Spatial masks can leave a detached finger or coat fleck on the other side of
// a seam. Those become floating scraps when a bone turns. Keep only substantial
// connected islands of each piece; the small fringe pixels stay with the main
// component through their eight-neighbour connection.
const dropDetached = (png) => {
	const { width: w, height: h, data } = png;
	const seen = new Uint8Array(w * h);
	const groups = [];
	for (let start = 0; start < w * h; start++) {
		if (seen[start] || data[start * 4 + 3] < 8) continue;
		const queue = [start];
		seen[start] = 1;
		for (let i = 0; i < queue.length; i++) {
			const p = queue[i], x = p % w, y = (p / w) | 0;
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const nx = x + dx, ny = y + dy;
				if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
				const n = ny * w + nx;
				if (seen[n] || data[n * 4 + 3] < 8) continue;
				seen[n] = 1;
				queue.push(n);
			}
		}
		groups.push(queue);
	}
	const largest = Math.max(0, ...groups.map((g) => g.length));
	for (const group of groups) {
		if (group.length >= Math.max(80, largest * 0.04)) continue;
		for (const p of group) data[p * 4 + 3] = 0;
	}
};

const layers = [];
for (const [name, z, keep] of specs) {
	const full = new PNG({ width: canvas[0], height: canvas[1] });
	let minX = canvas[0], minY = canvas[1], maxX = -1, maxY = -1;
	for (let y = 0; y < canvas[1]; y++) for (let x = 0; x < canvas[0]; x++) {
		if (!keep(x / SCALE, y / SCALE)) continue;
		const rgba = sample(x, y);
		if (rgba[3] < 4) continue;
		const i = (y * canvas[0] + x) * 4;
		for (let c = 0; c < 4; c++) full.data[i + c] = rgba[c];
		minX = Math.min(minX, x); minY = Math.min(minY, y);
		maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
	}
	dropDetached(full);
	if (maxX < minX) throw new Error(`empty piece: ${name}`);
	const w = maxX - minX + 1, h = maxY - minY + 1;
	const piece = new PNG({ width: w, height: h });
	for (let y = 0; y < h; y++) {
		const from = ((minY + y) * canvas[0] + minX) * 4;
		full.data.copy(piece.data, y * w * 4, from, from + w * 4);
	}
	fs.writeFileSync(path.join(outDir, `${name}.png`), PNG.sync.write(piece));
	layers.push({ z, name, file: `${name}.png`, x: minX, y: minY, w, h });
}
fs.writeFileSync(path.join(outDir, 'layers.json'), JSON.stringify({ canvas, source: path.relative(appRoot, source), layers }, null, 2) + '\n');
console.log(`${layers.length} parts -> ${path.relative(appRoot, outDir)} (${canvas.join('x')})`);
