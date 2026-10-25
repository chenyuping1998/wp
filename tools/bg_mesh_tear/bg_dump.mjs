// Pose every background mesh across 12s (+ worst-case events) and dump its
// rest and most-deformed frames:  node bg_dump.mjs <bgProps.ts> <putt|alc> out.json
import { register } from 'module';
import fs from 'fs';
import { pathToFileURL } from 'url';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
  try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
const [modPath, kind, out] = process.argv.slice(2);
const mod = await import(pathToFileURL(modPath).href);
const core = await import(pathToFileURL(modPath.replace(/bgProps\.ts$/, 'meshRig.ts')).href);
const specs = [];
for (const [k, v] of Object.entries(mod)) {
  if (Array.isArray(v)) { for (const s of v) if (s && s.drive) specs.push(s); }
  else if (v && v.drive) specs.push(v);
}
const seen = new Set();
const envs = (t) => kind === 'putt'
  ? [{ t, gustT: -1 }, { t, gustT: t - 1200 }, { t, gustT: t - 400 }]
  : [{ t, level: 1, quakeT: -1, blastT: -1, coinT: -1 }, { t, level: 5, quakeT: t - 2000, blastT: t - 2000, coinT: t - 2000 }, { t, level: 5, quakeT: t - 500, blastT: t - 700, coinT: t - 300 }];
const res = [];
for (const spec of specs) {
  if (seen.has(spec.symbol)) continue; seen.add(spec.symbol);
  const rig = core.buildRig(spec.rig);
  const pos = new Float32Array(rig.rest.length);
  let best = { d: -1 };
  for (let t = 0; t <= 12000; t += 20) for (const env of envs(t)) {
    if (kind === 'putt' && env.gustT >= 0 && env.gustT > 3000) continue;
    core.skin(rig, spec.drive(rig, env), spec.feetY, pos);
    let d = 0; for (let i = 0; i < pos.length; i++) d = Math.max(d, Math.abs(pos[i] - rig.rest[i]));
    if (d > best.d) best = { d, t, env, verts: Array.from(pos) };
  }
  res.push({ name: spec.symbol, plate: spec.sprite ?? spec.key, canvas: spec.rig.canvas, rect: spec.rect, uvs: Array.from(rig.uvs), indices: Array.from(rig.indices), rest: Array.from(rig.rest), peak: best.verts, maxd: best.d, at: best.t, env: best.env });
}
fs.writeFileSync(out, JSON.stringify(res));
console.log(res.map((r) => `${r.name}: max ${r.maxd.toFixed(1)} at ${r.at}ms`).join('\n'));
