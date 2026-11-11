// Posed mesh vertices (canvas px) of an installed v5 rig at anim:time list.
//   node design/rebuild_20261023/dump_mesh_poses.mjs <base|fg> anim:t,... > poses.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnimationState, AnimationStateData, Physics } from '@esotericsoftware/spine-core';
import { readCastSkeleton } from '../../src/game/spineCastData.ts';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [variant, spec] = process.argv.slice(2);
const json = JSON.parse(fs.readFileSync(path.join(app, 'static/assets/castLayers/turf/v5', variant, 'cast.spine.json'), 'utf8'));
const [ox, oy] = json.turf.origin;
const sk = readCastSkeleton(json);
const frames = spec.split(',').map((s) => {
  const [anim, t] = s.split(':');
  const st = new AnimationState(new AnimationStateData(sk.data));
  st.setAnimation(0, anim, true);
  sk.setupPose(); st.update(Number(t)); st.apply(sk); sk.updateWorldTransform(Physics.none);
  return { label: s, slots: sk.slots.map((slot) => {
    const a = slot.getAppliedPose().attachment;
    const out = new Float32Array(a.worldVerticesLength);
    a.computeWorldVertices(sk, slot, 0, out.length, out, 0, 2);
    const v = []; for (let i = 0; i < out.length; i += 2) v.push([+(out[i] + ox).toFixed(2), +(oy - out[i + 1]).toFixed(2)]);
    return { name: slot.data.name, verts: v, uvs: Array.from(a.regionUVs), tris: Array.from(a.triangles) };
  }) };
});
process.stdout.write(JSON.stringify(frames));
