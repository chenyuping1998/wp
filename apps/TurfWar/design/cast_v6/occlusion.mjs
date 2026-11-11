// QA: is a flipped/collapsed triangle actually visible? Poses the rig at the
// flagged frame (clip alone or director run) and prints each bad triangle's
// posed centroid, for render.py --tex to check against the layers above it.
//   node design/cast_v6/occlusion.mjs <rigDir> <clip> <frame> <slot> <tri...>
import fs from 'node:fs'; import path from 'node:path';
import {AnimationState,AnimationStateData,Physics} from '@esotericsoftware/spine-core';
import {readCastSkeleton} from '../../src/game/spineCastData.ts';
const [dir, clip, frame, slotName, ...tris] = process.argv.slice(2);
const json = JSON.parse(fs.readFileSync(path.join(dir, 'cast.spine.json')));
const [ox, oy] = json.turf.origin; const sk = readCastSkeleton(json);
sk.setupPose(); const st = new AnimationState(new AnimationStateData(sk.data)); st.setAnimation(0, clip, false);
for (let f = 0; f <= Number(frame); f++) { st.update(f ? 1 / 60 : 0); st.apply(sk); }
sk.updateWorldTransform(Physics.none);
const slot = sk.slots.find((s) => s.data.name === slotName); const a = slot.getAppliedPose().attachment;
const o = new Float32Array(a.worldVerticesLength); a.computeWorldVertices(sk, slot, 0, o.length, o, 0, 2);
const out = { frames: [{ t: 0, slots: sk.slots.map((s) => { const at = s.getAppliedPose().attachment; const p = new Float32Array(at.worldVerticesLength); at.computeWorldVertices(sk, s, 0, p.length, p, 0, 2); const v = []; for (let k = 0; k < p.length; k += 2) v.push(+(p[k] + ox).toFixed(2), +(oy - p[k + 1]).toFixed(2)); return v; }) }],
  dir, header: sk.slots.map((s) => { const at = s.getAppliedPose().attachment; return { name: s.data.name, uvs: Array.from(at.regionUVs), tris: Array.from(at.triangles) }; }) };
for (const t of tris.map(Number)) { const [i, j, k] = a.triangles.slice(t * 3, t * 3 + 3); const cx = (o[2 * i] + o[2 * j] + o[2 * k]) / 3 + ox, cy = oy - (o[2 * i + 1] + o[2 * j + 1] + o[2 * k + 1]) / 3; console.log(`tri ${t} posed at ${cx.toFixed(0)},${cy.toFixed(0)}`); }
if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
