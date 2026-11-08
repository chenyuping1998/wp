// Pose the field cow's real rig at the frames given and dump the vertices:
//   node design/cows/dump_cow.mjs out.json
import { register } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
  try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
const here = path.dirname(fileURLToPath(import.meta.url));
const mw = path.resolve(here, '../../src/game/meshWin');
const { COW, cowPose } = await import(pathToFileURL(path.join(mw, 'bgCows.ts')).href);
const core = await import(pathToFileURL(path.join(mw, 'meshRig.ts')).href);
const rig = core.buildRig(COW.rig);
const pos = new Float32Array(rig.rest.length);
const frames = [];
const add = (label, env) => {
  core.skin(rig, cowPose(rig, env), COW.feetY, pos);
  frames.push({ label, verts: Array.from(pos) });
};
add('art (rest)', { t: 0, phase: 0, walk: 0, graze: 0 });
add('stand', { t: 600, phase: 0, walk: 0, graze: 0 });
for (let i = 0; i < 8; i++) add(`walk ${i}/8`, { t: 1000 + i * 137, phase: (i / 8) * Math.PI * 2, walk: 1, graze: 0 });
add('graze', { t: 400, phase: 0, walk: 0, graze: 1 });
add('graze crop', { t: 408, phase: 0, walk: 0, graze: 1 });
fs.writeFileSync(process.argv[2], JSON.stringify({ uvs: Array.from(rig.uvs), indices: Array.from(rig.indices), rest: Array.from(rig.rest), canvas: COW.rig.canvas, ground: COW.feetY, frames }));
console.log(`${frames.length} frames, ${rig.indices.length / 3} triangles`);
