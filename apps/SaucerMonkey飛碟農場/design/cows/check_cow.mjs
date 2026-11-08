// The field cow's gate (BgCows.svelte / src/game/meshWin/bgCows.ts): every stride, the stand and the graze,
// judged on the triangles whose centre is DRAWN (alpha >= 128). Fails on any drawn triangle folded past -25% or
// squashed below 30% in more than 6 places in one pose. (check_mesh_wins counts any triangle touching ink —
// the cow's legs swing across transparent gaps, where a fold shows nothing.)
//   node design/cows/check_cow.mjs
import { register } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
  try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');
const { PNG } = createRequire('E:/stake/tools/gen/')('pngjs');
const png = PNG.sync.read(fs.readFileSync(path.join(app, 'static/assets/sprites/saucerNight/cow_walk.png')));
const alpha = (x, y) => png.data[(Math.min(319, Math.max(0, Math.round(y))) * 320 + Math.min(319, Math.max(0, Math.round(x)))) * 4 + 3];
const mw = path.join(app, 'src/game/meshWin');
const { COW, cowPose } = await import(pathToFileURL(path.join(mw, 'bgCows.ts')).href);
const core = await import(pathToFileURL(path.join(mw, 'meshRig.ts')).href);
const rig = core.buildRig(COW.rig);
const pos = new Float32Array(rig.rest.length);
const T = rig.indices.length / 3;
const ar = (P, t) => { const [a, b, c] = [0, 1, 2].map((k) => rig.indices[t * 3 + k]); return ((P[b*2]-P[a*2])*(P[c*2+1]-P[a*2+1])-(P[c*2]-P[a*2])*(P[b*2+1]-P[a*2+1])) / 2; };
let failed = false;
const probe = (label, env) => {
  core.skin(rig, cowPose(rig, env), COW.feetY, pos);
  let n = 0, worst = null;
  for (let t = 0; t < T; t++) {
    const r0 = ar(rig.rest, t), r1 = ar(pos, t);
    if (Math.abs(r0) < 1e-6) continue;
    const k = r1 / r0;
    const [a, b, c] = [0, 1, 2].map((q) => rig.indices[t * 3 + q]);
    const cx = (rig.rest[a*2]+rig.rest[b*2]+rig.rest[c*2])/3, cy = (rig.rest[a*2+1]+rig.rest[b*2+1]+rig.rest[c*2+1])/3;
    if (alpha(cx, cy) < 128) continue;
    if (k < 0.3) { n++; if (!worst || k < worst.k) worst = { k: +k.toFixed(2), at: [Math.round(cx), Math.round(cy)] }; }
  }
  const bad = n > 6 || (worst && worst.k < -0.25);
  if (bad) failed = true;
  console.log(`${bad ? '  !!' : '  ok'} ${label.padEnd(12)} squashed<30%: ${n}`, worst ? JSON.stringify(worst) : '');
};
probe('stand', { t: 0, phase: 0, walk: 0, graze: 0 });
for (let i = 0; i < 8; i++) probe(`walk ${i}/8`, { t: 0, phase: (i / 8) * Math.PI * 2, walk: 1, graze: 0 });
for (let i = 0; i < 4; i++) probe(`graze ${i}/4`, { t: i * 200, phase: 0, walk: 0, graze: 1 });
for (let i = 0; i < 4; i++) probe(`walk+graze ${i}`, { t: i * 300, phase: (i / 4) * Math.PI * 2, walk: 0.5, graze: 0.5 });
console.log(failed ? 'check_cow: FAILED' : 'check_cow: ok');
if (failed) process.exit(1);
