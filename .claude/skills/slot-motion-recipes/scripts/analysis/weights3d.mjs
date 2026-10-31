// How the fake-3D head turn is weighted: for every mesh vertex bound to the control bone ("3d" / "face_25d"),
// the weight it gets vs. where it sits on the head. Also renders a heat map (red = follows the control bone).
//   node weights3d.mjs <skeleton> <controlBone> [headBone=head] [backBone]
import fs from 'node:fs';
import { PNG } from 'file:///E:/stake/tools/gen/node_modules/pngjs/lib/png.js';
import { load, poser, spine, r2, ROOT } from './lib.mjs';

const [name, ctrl, headName = 'head', backName] = process.argv.slice(2);
const { data } = load(name);
const s = poser(data).pose(null, 0);
const bi = (n) => data.bones.findIndex((b) => b.name === n);
const C = bi(ctrl), B = backName ? bi(backName) : -1;
const head = s.findBone(headName);

// Head reference frame: centre and radius from the bounds of every vertex that moves with the head at all.
const pts = [];
for (const slot of s.drawOrder) {
	const a = slot.getAttachment();
	if (!(a instanceof spine.MeshAttachment) || !a.bones) continue;
	const world = []; a.computeWorldVertices(slot, 0, a.worldVerticesLength, world, 0, 2);
	let v = 0;
	for (let i = 0, w = 0; i < a.bones.length; v++) {
		const n = a.bones[i++];
		let wc = 0, wb = 0, wsum = 0;
		const infl = [];
		for (let k = 0; k < n; k++, i++, w += 3) {
			const bone = a.bones[i], weight = a.vertices[w + 2];
			infl.push(data.bones[bone].name);
			if (bone === C) wc += weight;
			if (bone === B) wb += weight;
			wsum += weight;
		}
		pts.push({ slot: slot.data.name, x: world[v * 2], y: world[v * 2 + 1], wc, wb, n, infl });
	}
}
const onHead = pts.filter((p) => p.infl.includes(ctrl) || (B >= 0 && p.infl.includes(backName)));
const xs = onHead.map((p) => p.x), ys = onHead.map((p) => p.y);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
const R = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2;

// Per slot: weight range and mean.
const bySlot = new Map();
for (const p of onHead) {
	const e = bySlot.get(p.slot) ?? { slot: p.slot, n: 0, sum: 0, min: 1, max: 0, back: 0, others: new Set() };
	e.n++; e.sum += p.wc; e.min = Math.min(e.min, p.wc); e.max = Math.max(e.max, p.wc); e.back += p.wb;
	p.infl.forEach((b) => b !== ctrl && e.others.add(b));
	bySlot.set(p.slot, e);
}
console.log(`# ${name}: ${ctrl} 權重（頭中心 ${r2(cx)},${r2(cy)}，半徑 R=${r2(R)}）\n`);
console.log('| slot | 頂點 | ctrl 權重 平均 | 最小 | 最大 | back 權重平均 | 其他影響骨 |');
console.log('|---|---|---|---|---|---|---|');
for (const e of [...bySlot.values()].filter((e) => !/2$|3$|_add/.test(e.slot)).sort((a, b) => b.sum / b.n - a.sum / a.n)) {
	console.log(`| ${e.slot} | ${e.n} | ${r2(e.sum / e.n)} | ${r2(e.min)} | ${r2(e.max)} | ${r2(e.back / e.n)} | ${[...e.others].join(',')} |`);
}

// Weight vs normalised distance from the head centre (rings of 0.2R).
console.log('\n距頭中心 (×R) → ctrl 權重平均（頂點數）');
for (let r = 0; r < 1.2; r += 0.2) {
	const ring = onHead.filter((p) => { const d = Math.hypot(p.x - cx, p.y - cy) / R; return d >= r && d < r + 0.2; });
	if (ring.length) console.log(`  ${r2(r)}–${r2(r + 0.2)}: ${r2(ring.reduce((a, p) => a + p.wc, 0) / ring.length)}  (${ring.length})`);
}
// And vs height on the head (top → bottom), since a turn also reads in how the jaw lags the brow.
console.log('\n頭內高度 (上→下，×R) → ctrl 權重平均');
for (let y = 1; y > -1.2; y -= 0.4) {
	const band = onHead.filter((p) => { const d = (p.y - cy) / R; return d <= y && d > y - 0.4; });
	if (band.length) console.log(`  ${r2(y)}..${r2(y - 0.4)}: ${r2(band.reduce((a, p) => a + p.wc, 0) / band.length)}  (${band.length})`);
}

// Heat map: every weighted vertex as a dot, colour = ctrl weight (blue 0 → red 1), green = back bone.
const all = pts;
const ax = all.map((p) => p.x), ay = all.map((p) => p.y);
const minX = Math.min(...ax), maxX = Math.max(...ax), minY = Math.min(...ay), maxY = Math.max(...ay);
const W = 640, H = Math.round(W * (maxY - minY) / (maxX - minX)) || 640;
const png = new PNG({ width: W, height: H });
png.data.fill(18);
for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255;
const dot = (x, y, r, g, b) => {
	for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
		const px = Math.round(x) + dx, py = Math.round(y) + dy;
		if (px < 0 || py < 0 || px >= W || py >= H) continue;
		const o = (py * W + px) * 4; png.data[o] = r; png.data[o + 1] = g; png.data[o + 2] = b;
	}
};
for (const p of all.sort((a, b) => a.wc - b.wc)) {
	const x = (p.x - minX) / (maxX - minX) * (W - 8) + 4, y = (maxY - p.y) / (maxY - minY) * (H - 8) + 4;
	if (p.wb > 0.01) dot(x, y, 40, Math.round(80 + 175 * p.wb), 60);
	else dot(x, y, Math.round(40 + 215 * p.wc), 50, Math.round(220 - 200 * p.wc));
}
const out = `${ROOT}/analysis/weights3d_${name}_${ctrl}.png`;
fs.writeFileSync(out, PNG.sync.write(png));
console.log(`\nheat map: ${out}`);
