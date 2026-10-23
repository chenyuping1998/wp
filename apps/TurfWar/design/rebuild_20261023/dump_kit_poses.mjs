// Dump every slot's posed quad (canvas px) for chosen animation times so
// render_kit_poses.py can composite full-resolution QA frames.
//   node design/rebuild_20261023/dump_kit_poses.mjs <base|fg> anim:t,anim:t ... > poses.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnimationState, AnimationStateData, Physics } from '@esotericsoftware/spine-core';
import { readCastSkeleton } from '../../src/game/spineCastData.ts';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [variant, spec] = process.argv.slice(2);
const json = JSON.parse(fs.readFileSync(path.join(app, 'static/assets/castLayers/turf/v4', variant, 'cast.spine.json'), 'utf8'));
const [ox, oy] = json.turf.origin;
const skeleton = readCastSkeleton(json);
const out = new Float32Array(8);
const frames = spec.split(',').map((s) => {
  const [anim, t] = s.split(':');
  const state = new AnimationState(new AnimationStateData(skeleton.data));
  state.setAnimation(0, anim, true);
  skeleton.setupPose();
  state.update(Number(t));
  state.apply(skeleton);
  skeleton.updateWorldTransform(Physics.none);
  return { label: s, slots: skeleton.slots.map((slot) => {
    const a = slot.getAppliedPose().attachment;
    a.updateSequence();
    a.computeWorldVertices(slot, a.getOffsets(slot.getAppliedPose()), out, 0, 2);
    return { name: slot.data.name, quad: Array.from({ length: 4 }, (_, i) => [out[2 * i] + ox, oy - out[2 * i + 1]]) };
  }) };
});
process.stdout.write(JSON.stringify(frames));
