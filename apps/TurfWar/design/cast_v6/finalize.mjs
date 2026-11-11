// out/<who>/rig.json -> checked Spine 4.3 rig. Picks each leg IK's bend
// direction (the one that keeps the drawn knee), proves the setup pose puts
// every vertex back on the drawing, measures the figure box and the motion
// envelope over every shipped clip (as the game plays them: over the idle),
// and writes out/<who>/cast.spine.json. With --install copies the rig and
// textures to static/assets/castLayers/turf/v6/<base|fg>/.
//   node design/cast_v6/finalize.mjs [--install]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Physics, Skeleton, SkeletonJson, Vector2 } from '@esotericsoftware/spine-core';
import { castAttachmentLoader, readCastSkeleton } from '../../src/game/spineCastData.ts';
import { CastDirector } from '../../src/game/castDirector.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');
const install = process.argv.includes('--install');

for (const [who, variant] of [['mg', 'base'], ['fg', 'fg']]) {
  const dir = path.join(here, 'out', who);
  const rig = JSON.parse(fs.readFileSync(path.join(dir, 'rig.json'), 'utf8'));
  const [ox, oy] = rig.turf.origin;
  const world = rig.turf.world;
  delete rig.turf.world;
  // IK bend: try both, keep the one that reproduces the drawn knee.
  for (const c of rig.constraints.filter((k) => k.type === 'ik')) {
    let best = null;
    for (const bendPositive of [true, false]) {
      c.bendPositive = bendPositive;
      const s = new Skeleton(new SkeletonJson(castAttachmentLoader).readSkeletonData({ ...rig, animations: {} }));
      s.setupPose(); s.updateWorldTransform(Physics.none);
      const shin = s.findBone(c.bones[1]).appliedPose;
      const want = world[c.bones[1]];
      const err = Math.hypot(shin.worldX - want.x, shin.worldY - want.y);
      if (!best || err < best.err) best = { bendPositive, err };
    }
    c.bendPositive = best.bendPositive;
    assert(best.err < 0.5, `${who}: ${c.name} moves the knee ${best.err}px`);
  }
  const ship = new Set(rig.turf.ship);
  const qaAnims = rig.animations;
  rig.animations = Object.fromEntries(Object.entries(qaAnims).filter(([n]) => ship.has(n)));
  delete rig.turf.ship;
  const sk = readCastSkeleton(rig);
  sk.setupPose(); sk.updateWorldTransform(Physics.none);
  const meshes = rig.turf.layers.map((l) => JSON.parse(fs.readFileSync(path.join(dir, `${l.name}.mesh.json`), 'utf8')));
  const pose = (fn) => sk.slots.forEach((slot, si) => {
    const a = slot.getAppliedPose().attachment;
    const o = new Float32Array(a.worldVerticesLength);
    a.computeWorldVertices(sk, slot, 0, o.length, o, 0, 2);
    for (let i = 0; i < o.length; i += 2) fn(si, i / 2, o[i] + ox, oy - o[i + 1]);
  });
  let bind = 0;
  pose((si, v, x, y) => { const [vx, vy] = meshes[si].verts[v]; bind = Math.max(bind, Math.hypot(x - vx, y - vy)); });
  assert(bind < 0.35, `${who}: setup pose moves vertices by ${bind}px`);
  rig.turf.figureBox = [
    Math.min(...rig.turf.layers.map((l) => l.inkBox[0])), Math.min(...rig.turf.layers.map((l) => l.inkBox[1])),
    Math.max(...rig.turf.layers.map((l) => l.inkBox[2])), Math.max(...rig.turf.layers.map((l) => l.inkBox[3]))];
  // visible vertices only (within a cell of ink) count toward the envelope
  const ink = meshes.map((m, si) => {
    const l = rig.turf.layers[si];
    return m.verts.map(([x, y]) => x >= l.inkBox[0] - 2 && x <= l.inkBox[2] + 2 && y >= l.inkBox[1] - 2 && y <= l.inkBox[3] + 2);
  });
  let lo = Infinity, hi = -Infinity, top = Infinity;
  const measure = () => pose((si, v, x, y) => { if (!ink[si][v]) return; lo = Math.min(lo, x); hi = Math.max(hi, x); top = Math.min(top, y); });
  const json = { ...rig };
  for (const reaction of [null, ...Object.keys(rig.turf.reactions)]) {
    for (const phase of [0, 0.5, 1.0, 1.5]) {
      const s2 = readCastSkeleton(json);
      const d = new CastDirector(s2, { ...rig.turf, variants: [] });
      for (let t = 0; t < phase; t += 1 / 60) d.step(1 / 60);
      if (reaction) d.react(reaction, 1);
      for (let f = 0; f < 60 * 2.6; f++) {
        d.step(1 / 60);
        s2.slots.forEach((slot, si) => {
          const a = slot.getAppliedPose().attachment;
          const o = new Float32Array(a.worldVerticesLength);
          a.computeWorldVertices(s2, slot, 0, o.length, o, 0, 2);
          for (let i = 0; i < o.length; i += 2) { if (!ink[si][i / 2]) continue; const x = o[i] + ox, y = oy - o[i + 1]; lo = Math.min(lo, x); hi = Math.max(hi, x); top = Math.min(top, y); }
        });
      }
    }
  }
  rig.turf.envelope = [Math.floor(lo), Math.ceil(hi)];
  rig.turf.generator = 'design/cast_v6 (build_v6.py harmonic weights + motions.py clips)';
  fs.writeFileSync(path.join(dir, 'cast.spine.json'), JSON.stringify(rig));
  // QA copy keeps the range-of-motion clip
  fs.writeFileSync(path.join(dir, 'cast.qa.spine.json'), JSON.stringify({ ...rig, animations: qaAnims }));
  console.log(who, 'bind', bind.toFixed(4), 'figureBox', rig.turf.figureBox, 'envelope', rig.turf.envelope, 'top', Math.round(top),
    'IK', rig.constraints.map((c) => `${c.name}:${c.bendPositive}`).join(' '));
  if (install) {
    const dest = path.join(app, 'static/assets/castLayers/turf/v6', variant);
    fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(dest, { recursive: true });
    for (const l of rig.turf.layers) fs.copyFileSync(path.join(dir, `${l.name}.png`), path.join(dest, `${l.name}.png`));
    fs.writeFileSync(path.join(dest, 'cast.spine.json'), JSON.stringify(rig));
    console.log('installed', dest);
  }
}
