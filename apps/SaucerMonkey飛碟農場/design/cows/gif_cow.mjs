// Dump a walk → stop → graze → walk loop for a preview GIF:  node design/cows/gif_cow.mjs out.json
import { register } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
  try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
const mw = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/game/meshWin');
const { COW, cowPose } = await import(pathToFileURL(path.join(mw, 'bgCows.ts')).href);
const core = await import(pathToFileURL(path.join(mw, 'meshRig.ts')).href);
const rig = core.buildRig(COW.rig);
const pos = new Float32Array(rig.rest.length);
const ss = (v) => { const u = Math.max(0, Math.min(1, v)); return u * u * (3 - 2 * u); };
const frames = [];
let phase = 0, x = 0;
for (let ms = 0; ms <= 9000; ms += 50) {
  const walk = 1 - ss((ms - 3000) / 350) + ss((ms - 6500) / 350);
  const graze = ss((ms - 3400) / 550) * (1 - ss((ms - 6000) / 550));
  phase += (0.05 * Math.PI * 2 / 1.3) * Math.min(1, walk);
  x += 40 * 0.05 * Math.min(1, walk);
  core.skin(rig, cowPose(rig, { t: ms, phase, walk: Math.min(1, walk), graze }), COW.feetY, pos);
  frames.push({ label: '', x, verts: Array.from(pos) });
}
fs.writeFileSync(process.argv[2], JSON.stringify({ uvs: Array.from(rig.uvs), indices: Array.from(rig.indices), canvas: COW.rig.canvas, ground: COW.feetY, frames }));
