// Check the exported Spine coat mesh over its full cloth loop.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skel = JSON.parse(fs.readFileSync(path.join(root, 'static/assets/spines/goBananasMonkey/monkey.json'), 'utf8'));
const coat = skel.skins[0].attachments.torso_1_coat.torso_1_coat;
if (coat.type !== 'mesh') throw new Error('coat is not a mesh');
const at = new Map();
for (const bone of skel.bones) {
	const parent = at.get(bone.parent) ?? [0, 0];
	at.set(bone.name, [parent[0] + (bone.x ?? 0), parent[1] + (bone.y ?? 0)]);
}
const frame = (time) => {
	const rot = {};
	for (const name of ['coatHemL', 'coatHemR']) {
		const keys = skel.animations.clothFlutter.bones[name].rotate;
		let i = 0;
		while (i < keys.length - 2 && keys[i + 1].time < time) i++;
		const a = keys[i], b = keys[i + 1], u = (time - a.time) / (b.time - a.time);
		rot[name] = (a.value + (b.value - a.value) * u) * Math.PI / 180;
	}
	const pts = [];
	let k = 0;
	for (let v = 0; v < coat.uvs.length / 2; v++) {
		const n = coat.vertices[k++];
		let x = 0, y = 0;
		for (let j = 0; j < n; j++) {
			const bone = skel.bones[coat.vertices[k++]];
			const bx = coat.vertices[k++], by = coat.vertices[k++], weight = coat.vertices[k++];
			const [ox, oy] = at.get(bone.name), th = rot[bone.name] ?? 0;
			x += weight * (ox + bx * Math.cos(th) - by * Math.sin(th));
			y += weight * (oy + bx * Math.sin(th) + by * Math.cos(th));
		}
		pts.push([x, y]);
	}
	return pts;
};
const area = (p, a, b, c) => (p[b][0] - p[a][0]) * (p[c][1] - p[a][1]) - (p[b][1] - p[a][1]) * (p[c][0] - p[a][0]);
const base = frame(0);
let minArea = Infinity, maxArea = 0, upper = 0, hem = 0;
for (let t = 0; t <= 4.8; t += 0.04) {
	const pts = frame(t);
	for (let v = 0; v < pts.length; v++) {
		const move = Math.hypot(pts[v][0] - base[v][0], pts[v][1] - base[v][1]);
		if (coat.uvs[v * 2 + 1] < 0.45) upper = Math.max(upper, move);
		if (coat.uvs[v * 2 + 1] > 0.8) hem = Math.max(hem, move);
	}
	for (let i = 0; i < coat.triangles.length; i += 3) {
		const a = coat.triangles[i], b = coat.triangles[i + 1], c = coat.triangles[i + 2];
		const ratio = area(pts, a, b, c) / area(base, a, b, c);
		minArea = Math.min(minArea, ratio); maxArea = Math.max(maxArea, ratio);
	}
}
if (upper > 0.2 || hem < 5 || minArea < 0.55 || maxArea > 1.5)
	throw new Error(`coat: upper ${upper.toFixed(2)}, hem ${hem.toFixed(2)}, area ${minArea.toFixed(2)}..${maxArea.toFixed(2)}`);
console.log(`coat: upper ${upper.toFixed(2)}px, hem ${hem.toFixed(2)}px, area ${minArea.toFixed(2)}..${maxArea.toFixed(2)}`);

// ── THE HEAD, over the same loop ────────────────────────────────────────────
//
// The head is a weighted mesh too now (generate_monkey_spine.mjs): the banana
// and the two hat flaps on their own bones, the face on `head`. Three things
// must hold across the whole cloth loop:
//   · the FACE does not move — a vertex the head owns outright stays put, or
//     the eyes slide against the goggles
//   · each loose part visibly moves (>= 3px), or the bone is decoration
//   · no triangle folds under 55% or grows past 1.5x, the coat's own bounds
{
	const head = skel.skins[0].attachments.head_0_face.head_0_face;
	if (head.type !== 'mesh') throw new Error('head is not a mesh');
	const PARTS = ['banana', 'earL', 'earR'];
	const pose = (time) => {
		const rot = {};
		for (const name of PARTS) {
			const keys = skel.animations.clothFlutter.bones[name].rotate;
			let i = 0;
			while (i < keys.length - 2 && keys[i + 1].time < time) i++;
			const a = keys[i], b = keys[i + 1], u = (time - a.time) / (b.time - a.time);
			rot[name] = (a.value + (b.value - a.value) * u) * Math.PI / 180;
		}
		const pts = [], owner = [];
		let k = 0;
		for (let v = 0; v < head.uvs.length / 2; v++) {
			const n = head.vertices[k++];
			let x = 0, y = 0, own = 0;
			for (let j = 0; j < n; j++) {
				const bone = skel.bones[head.vertices[k++]];
				const bx = head.vertices[k++], by = head.vertices[k++], weight = head.vertices[k++];
				const [ox, oy] = at.get(bone.name), th = rot[bone.name] ?? 0;
				x += weight * (ox + bx * Math.cos(th) - by * Math.sin(th));
				y += weight * (oy + bx * Math.sin(th) + by * Math.cos(th));
				if (bone.name === 'head') own = weight;
			}
			pts.push([x, y]);
			owner.push(own);
		}
		return { pts, owner };
	};
	const rest = pose(0);
	const moved = Object.fromEntries(PARTS.map((p) => [p, 0]));
	let face = 0, lo = Infinity, hi = 0, worst = null;
	// which part dominates each vertex, by its own weight
	const dominant = [];
	{
		let k = 0;
		for (let v = 0; v < head.uvs.length / 2; v++) {
			const n = head.vertices[k++];
			let best = 'head', bw = -1;
			for (let j = 0; j < n; j++) {
				const name = skel.bones[head.vertices[k]].name, w = head.vertices[k + 3];
				if (w > bw) { bw = w; best = name; }
				k += 4;
			}
			dominant.push(best);
		}
	}
	for (let t = 0; t <= 4.8; t += 0.04) {
		const { pts } = pose(t);
		for (let v = 0; v < pts.length; v++) {
			const d = Math.hypot(pts[v][0] - rest.pts[v][0], pts[v][1] - rest.pts[v][1]);
			if (rest.owner[v] > 0.999) face = Math.max(face, d);
			if (dominant[v] in moved) moved[dominant[v]] = Math.max(moved[dominant[v]], d);
		}
		for (let i = 0; i < head.triangles.length; i += 3) {
			const a = head.triangles[i], b = head.triangles[i + 1], c = head.triangles[i + 2];
			const ratio = area(pts, a, b, c) / area(rest.pts, a, b, c);
			if (ratio > hi || ratio < lo) worst = { ratio, at: [head.uvs[a * 2], head.uvs[a * 2 + 1]], by: dominant[a] };
			lo = Math.min(lo, ratio); hi = Math.max(hi, ratio);
		}
	}
	const still = PARTS.filter((p) => moved[p] < 3);
	if (face > 0.05 || still.length || lo < 0.55 || hi > 1.5)
		throw new Error(`head: worst triangle ${worst ? `${worst.ratio.toFixed(2)}x at uv ${worst.at.map((v) => v.toFixed(2))} (${worst.by})` : '-'}; face ${face.toFixed(2)}px, ${PARTS.map((p) => `${p} ${moved[p].toFixed(1)}px`).join(', ')}, area ${lo.toFixed(2)}..${hi.toFixed(2)}`);
	console.log(`head: face ${face.toFixed(2)}px, ${PARTS.map((p) => `${p} ${moved[p].toFixed(1)}px`).join(', ')}, area ${lo.toFixed(2)}..${hi.toFixed(2)}`);
}
