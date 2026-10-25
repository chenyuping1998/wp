// How far each loose part swings from follow-through alone (meshRig.withFollow),
// per win and per landing, against its measured limit. For tuning the `follow`
// gains in src/game/meshWin/puttWins.ts.   node design/swing/tune_follow.mjs
import { register } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
	try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/game/meshWin');
const rig = await import(pathToFileURL(path.join(dir, 'meshRig.ts')).href);
const wins = await import(pathToFileURL(path.join(dir, 'puttWins.ts')).href);
const acts = await import(pathToFileURL(path.join(dir, 'acts.ts')).href);
for (const sym of ['H1', 'H2', 'H3', 'H4', 'W', 'S']) {
	const spec = wins[sym];
	const r = rig.buildRig(spec.rig);
	const peak = (s) => {
		const out = {};
		for (let t = 0; t <= s.durationMs; t += 4) {
			const p = s.pose(r, t);
			for (const f of wins.FOLLOW[sym]) {
				const i = r.bones.findIndex((b) => b.name === f.part);
				out[f.part] = Math.max(out[f.part] ?? 0, Math.abs(p.bones[i].angle));
			}
		}
		return out;
	};
	const fmt = (o) => Object.entries(o).map(([k, v]) => `${k} ${v.toFixed(1)}/${spec.limits[k].pos}`).join('  ');
	console.log(sym.padEnd(3), 'win  ', fmt(peak(spec)));
	console.log('   ', 'land ', fmt(peak(acts.MESH_LANDS[sym])), '| idle', fmt(peak(acts.IDLES[sym])));
}
