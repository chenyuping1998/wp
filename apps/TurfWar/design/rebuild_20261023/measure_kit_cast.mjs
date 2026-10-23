// Fill in the installed kit rigs' motion envelope + reaction map, and prove the
// setup pose lands every cropped image exactly where it sits in the delivered
// canvas. Run after install_kit_cast.py:
//   node design/rebuild_20261023/measure_kit_cast.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AnimationState, AnimationStateData, Physics, RegionAttachment } from '@esotericsoftware/spine-core';
import { readCastSkeleton } from '../../src/game/spineCastData.ts';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Game reaction -> kit move. Guard loop is idle_weave: the bounce idle's IK
// forearm scored 60/70 on the kit's smoothness check, the weave 95/90.
// jump clears the side strip (~290 px up); celebrate lifts the guard forearm
// across the face on this drawing. Big moments throw the harder jab.
const REACTIONS = { win: 'punch', winBig: 'punch_big', trigger: 'punch_big' };
const IDLE = 'idle_weave';

for (const variant of ['base', 'fg']) {
  const file = path.join(app, 'static/assets/castLayers/turf/v4', variant, 'cast.spine.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  json.turf.reactions = REACTIONS;
  json.turf.idle = IDLE;
  const [ox, oy] = json.turf.origin;
  const skeleton = readCastSkeleton(json);
  const out = new Float32Array(8);
  const outline = JSON.parse(fs.readFileSync(path.join(app, 'design/rebuild_20261023/kit',
    variant === 'base' ? 'mg' : 'fg', 'outline.json'), 'utf8'));
  // Region corners are BL, TL, TR, BR in (u, v) = (0,1), (0,0), (1,0), (1,1).
  const ink = (slot) => {
    const [bl, tl, tr] = quad(slot);
    return outline[slot.data.name].map(([u, v]) => [
      tl[0] + u * (tr[0] - tl[0]) + v * (bl[0] - tl[0]), tl[1] + u * (tr[1] - tl[1]) + v * (bl[1] - tl[1])]);
  };
  const quad = (slot) => {
    const a = slot.getAppliedPose().attachment;
    if (!(a instanceof RegionAttachment)) return null;
    a.updateSequence();
    a.computeWorldVertices(slot, a.getOffsets(slot.getAppliedPose()), out, 0, 2);
    return Array.from({ length: 4 }, (_, i) => [out[2 * i] + ox, oy - out[2 * i + 1]]);
  };

  // Setup pose: each quad must be the axis-aligned crop box (registration kept).
  skeleton.setupPose();
  skeleton.updateWorldTransform(Physics.none);
  let bind = 0;
  for (const slot of skeleton.slots) {
    const q = quad(slot);
    const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const a = slot.getAppliedPose().attachment;
    bind = Math.max(bind, Math.abs(w - a.width), Math.abs(h - a.height));
  }
  assert(bind < 0.5, `${variant}: setup quads rotated/scaled off the crop (${bind}px)`);

  // Envelope: canvas x of the posed silhouette over every move at 30 fps.
  let lo = Infinity, hi = -Infinity, top = Infinity;
  for (const anim of [IDLE, ...new Set(Object.values(REACTIONS))].map((n) => skeleton.data.findAnimation(n))) {
    const state = new AnimationState(new AnimationStateData(skeleton.data));
    state.setAnimation(0, anim.name, false);
    for (let t = 0; t <= anim.duration + 1e-6; t += 1 / 30) {
      skeleton.setupPose();
      state.apply(skeleton);
      skeleton.updateWorldTransform(Physics.none);
      for (const slot of skeleton.slots) for (const [x, y] of ink(slot)) {
        lo = Math.min(lo, x); hi = Math.max(hi, x); top = Math.min(top, y);
      }
      state.update(1 / 30);
    }
  }
  json.turf.envelope = [Math.floor(lo), Math.ceil(hi)];
  for (const name of [IDLE, ...Object.values(REACTIONS)]) assert(skeleton.data.findAnimation(name), name);
  fs.writeFileSync(file, JSON.stringify(json));
  console.log(variant, 'envelope', json.turf.envelope, 'highest y', Math.round(top), 'bind', bind.toFixed(3));
}
