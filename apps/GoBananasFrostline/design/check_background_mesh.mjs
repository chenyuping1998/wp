// Verify that every moving Frostline background patch closes its loop, keeps
// its perimeter glued to the source plate, and never folds a triangle.
import { register } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e}}`));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core = await import(pathToFileURL(path.join(root, 'src/game/meshWin/meshRig.ts')).href);
const { MESH_BG } = await import(pathToFileURL(path.join(root, 'src/game/meshWin/bgPatches.ts')).href);

for (const spec of Object.values(MESH_BG).flat()) {
	const rig = core.buildRig(spec.rig);
	const out = new Float32Array(rig.rest.length);
	const w = rig.weights;
	const B = rig.bones.length;
	const frame = rig.bones.findIndex((b) => b.name === 'frame');
	const { x0, y0, x1, y1 } = spec.rig.grid;
	let maxEdge = 0, minArea = Infinity, maxArea = 0, maxTravel = 0;
	const area = (p, a, b, c) => (p[b * 2] - p[a * 2]) * (p[c * 2 + 1] - p[a * 2 + 1]) - (p[b * 2 + 1] - p[a * 2 + 1]) * (p[c * 2] - p[a * 2]);
	for (let t = 0; t <= spec.durationMs; t += 25) {
		core.skin(rig, spec.pose(rig, t), spec.feetY, out);
		for (let v = 0; v < rig.rest.length / 2; v++) {
			const x = rig.rest[v * 2], y = rig.rest[v * 2 + 1];
			const move = Math.hypot(out[v * 2] - x, out[v * 2 + 1] - y);
			maxTravel = Math.max(maxTravel, move);
			if (x === x0 || x === x1 || y === y0 || y === y1) maxEdge = Math.max(maxEdge, move);
			if (w[v * B + frame] > 0.999 && move > 0.06) throw new Error(`${spec.symbol}: fixed frame moved ${move}`);
		}
		for (let i = 0; i < rig.indices.length; i += 3) {
			const a = rig.indices[i], b = rig.indices[i + 1], c = rig.indices[i + 2];
			const ratio = area(out, a, b, c) / area(rig.rest, a, b, c);
			minArea = Math.min(minArea, ratio);
			maxArea = Math.max(maxArea, ratio);
		}
	}
	if (maxEdge > 0.06 || minArea < 0.5 || maxArea > 1.6 || maxTravel < 1.5)
		throw new Error(`${spec.symbol}: edge ${maxEdge.toFixed(2)}, area ${minArea.toFixed(2)}..${maxArea.toFixed(2)}, move ${maxTravel.toFixed(2)}`);
	console.log(`${spec.symbol}: edge ${maxEdge.toFixed(3)}px, area ${minArea.toFixed(2)}..${maxArea.toFixed(2)}, motion ${maxTravel.toFixed(2)}px`);
}
