// spine_motion_probe.mjs <who> [anim] [seconds] — headless Spine 4.2 run at 60 fps
// (the real runtime: IK, physics, mixing), printing each probe bone's motion:
// range, peak speed, and "jerk events" — frames where the acceleration flips
// sharply, which read on screen as a twitch. Design tooling, 2026-10-21.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const core = path.resolve(here, '../../../../node_modules/.pnpm/@esotericsoftware+spine-core@4.2.74/node_modules/@esotericsoftware/spine-core/dist/index.js');
const S = await import(core);
const who = process.argv[2] || 'prisoner', anim = process.argv[3] || 'idle', secs = +(process.argv[4] || 4);
const dir = path.resolve(here, '../../static/assets/spines/htCast');
const atlas = new S.TextureAtlas(fs.readFileSync(path.join(dir, who + '.atlas'), 'utf8'));
for (const p of atlas.pages) p.setTexture({ setFilters() {}, setWraps() {}, dispose() {} });
const data = new S.SkeletonJson(new S.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(path.join(dir, who + '.json'), 'utf8')));
const sk = new S.Skeleton(data); const st = new S.AnimationState(new S.AnimationStateData(data));
st.setAnimation(0, 'idle', true);
if (anim !== 'idle') { st.setEmptyAnimation(1, 0); const e = st.addAnimation(1, anim, false, 1.0); e.mixDuration = 0.2; st.addEmptyAnimation(1, 0.2, 0); }
sk.setToSetupPose(); sk.updateWorldTransform(S.Physics.reset);
const dt = 1 / 60, N = Math.round(secs / dt);
const probes = data.bones.map(b => b.name).filter(n => n !== 'root');
const rec = Object.fromEntries(probes.map(n => [n, []]));
for (let i = 0; i < N; i++) {
  st.update(dt); st.apply(sk); sk.update(dt); sk.updateWorldTransform(S.Physics.update);
  for (const n of probes) { const b = sk.findBone(n); const L = b.data.length || 40; rec[n].push([b.worldX + b.a * L, b.worldY + b.c * L]); }
}
const rows = [];
for (const n of probes) {
  const p = rec[n].slice(60); // skip warm-up
  const v = p.slice(1).map((q, i) => [(q[0] - p[i][0]) / dt, (q[1] - p[i][1]) / dt]);
  const a = v.slice(1).map((q, i) => [(q[0] - v[i][0]) / dt, (q[1] - v[i][1]) / dt]);
  const sp = v.map(q => Math.hypot(...q)); const ac = a.map(q => Math.hypot(...q));
  const xs = p.map(q => q[0]), ys = p.map(q => q[1]);
  const med = [...ac].sort((x, y) => x - y)[Math.floor(ac.length / 2)] || 1;
  const jerks = ac.filter(x => x > Math.max(6 * med, 400)).length;
  rows.push({ bone: n, rangeX: +(Math.max(...xs) - Math.min(...xs)).toFixed(1), rangeY: +(Math.max(...ys) - Math.min(...ys)).toFixed(1),
    peakSpeed: +Math.max(...sp).toFixed(0), medAcc: +med.toFixed(0), maxAcc: +Math.max(...ac).toFixed(0), jerkFrames: jerks });
}
console.table(rows);
