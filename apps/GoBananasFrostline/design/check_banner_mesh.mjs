// The large prize plaque must keep its outside edge glued to the painted art.
import { register } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e}}`));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core = await import(pathToFileURL(path.join(root, 'src/game/meshWin/meshRig.ts')).href);
const { bannerMesh } = await import(pathToFileURL(path.join(root, 'src/game/meshWin/banner.ts')).href);
const spec = bannerMesh('gbWinBannerEpic');
const rig = core.buildRig(spec.rig);
const out = new Float32Array(rig.rest.length);
const area = (p, a, b, c) => (p[b * 2] - p[a * 2]) * (p[c * 2 + 1] - p[a * 2 + 1]) - (p[b * 2 + 1] - p[a * 2 + 1]) * (p[c * 2] - p[a * 2]);
let edge = 0, minArea = Infinity, maxArea = 0, travel = 0;
for (let t = 0; t <= 2200; t += 20) {
	core.skin(rig, spec.drive(rig, { t, landT: t < 1000 ? -1 : t - 1000, blink: 0 }), spec.feetY, out);
	for (let v = 0; v < rig.rest.length / 2; v++) {
		const x = rig.rest[v * 2], y = rig.rest[v * 2 + 1];
		const move = Math.hypot(out[v * 2] - x, out[v * 2 + 1] - y);
		travel = Math.max(travel, move);
		if (x === 0 || x === 256 || y === 0 || y === 256) edge = Math.max(edge, move);
	}
	for (let i = 0; i < rig.indices.length; i += 3) {
		const a = rig.indices[i], b = rig.indices[i + 1], c = rig.indices[i + 2];
		const ratio = area(out, a, b, c) / area(rig.rest, a, b, c);
		minArea = Math.min(minArea, ratio); maxArea = Math.max(maxArea, ratio);
	}
}
if (edge > 0.08 || minArea < 0.55 || maxArea > 1.5 || travel < 1.5)
	throw new Error(`banner: edge ${edge.toFixed(3)}, area ${minArea.toFixed(2)}..${maxArea.toFixed(2)}, move ${travel.toFixed(2)}`);
console.log(`banner: edge ${edge.toFixed(3)}px, area ${minArea.toFixed(2)}..${maxArea.toFixed(2)}, motion ${travel.toFixed(2)}px`);
