// QA scratch: simulate runtime sequence (idle -> reaction -> idle) at 30fps like SpineCastFigure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnimationState, AnimationStateData, Physics } from '@esotericsoftware/spine-core';
import { readCastSkeleton } from '../../src/game/spineCastData.ts';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [variant, reaction, every, total, startAt] = process.argv.slice(2);
const rigDir = process.env.RIG ?? path.join(app, 'static/assets/castLayers/turf/v5');
const json = JSON.parse(fs.readFileSync(path.join(rigDir, variant, 'cast.spine.json'), 'utf8'));
const [ox, oy] = json.turf.origin; const sp = json.turf.speed;
const sk = readCastSkeleton(json);
const sd = new AnimationStateData(sk.data); sd.defaultMix = 0.18;
const st = new AnimationState(sd);
sk.setupPose();
st.setAnimation(0, 'idle', true).timeScale = sp.idle;
const dt = 1 / 30; const frames = []; let t = 0;
const fire = Number(startAt);
for (let i = 0; t < Number(total); i++, t += dt) {
  if (reaction !== 'none' && Math.abs(t - fire) < dt / 2) {
    const e = st.setAnimation(0, reaction, false); e.timeScale = sp[reaction] ?? 1; e.mixDuration = 0.15;
    const b = st.addAnimation(0, 'idle', true, 0); b.mixDuration = 0.35; b.timeScale = sp.idle;
  }
  st.update(i === 0 ? 0 : dt); st.apply(sk); sk.update(dt); sk.updateWorldTransform(Physics.update);
  if (i % Number(every) !== 0) continue;
  frames.push({ label: `${reaction}@${t.toFixed(2)}`, slots: sk.slots.map((slot) => {
    const a = slot.getAppliedPose().attachment;
    const out = new Float32Array(a.worldVerticesLength);
    a.computeWorldVertices(sk, slot, 0, out.length, out, 0, 2);
    const v = []; for (let k = 0; k < out.length; k += 2) v.push([+(out[k] + ox).toFixed(2), +(oy - out[k + 1]).toFixed(2)]);
    return { name: slot.data.name, verts: v, uvs: Array.from(a.regionUVs), tris: Array.from(a.triangles) };
  }) });
}
process.stdout.write(JSON.stringify(frames));
