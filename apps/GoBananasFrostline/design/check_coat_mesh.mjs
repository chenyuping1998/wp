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
