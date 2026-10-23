// @ts-nocheck -- standalone Node geometry gate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AnimationState, AnimationStateData, Physics } from '@esotericsoftware/spine-core';
import { readCastSkeleton } from '../src/game/spineCastData.ts';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modern = fs.existsSync(path.join(app,'static/assets/castLayers/turf/v3/fg/cast.spine.json'));
const signedArea = (p, a, b, c) => (p[2*b]-p[2*a])*(p[2*c+1]-p[2*a+1]) - (p[2*b+1]-p[2*a+1])*(p[2*c]-p[2*a]);
const results = [];
for (const variant of ['base', 'fg']) {
  const directory=path.join(app,'static/assets/castLayers/turf',modern?'v3':'',variant);
  const json = JSON.parse(fs.readFileSync(path.join(directory,'cast.spine.json')));
  const manifest = JSON.parse(fs.readFileSync(path.join(directory,'layers.manifest.json')));
  const skeleton = readCastSkeleton(json);
  const state = new AnimationState(new AnimationStateData(skeleton.data));
  const parts = skeleton.slots.map(slot => {
    const attachment = slot.getAppliedPose().attachment;
    const rig = manifest.layers.find(l => l.name === slot.data.name).rig;
    const rest = new Float32Array(rig.verts.flatMap(([x,y]) => [x,-y]));
    const visible = rig.visibleTriangles ? new Set(rig.visibleTriangles) : null;
    return { slot, attachment, rest, visible, posed: new Float32Array(rest.length) };
  });
  let poses = 0, minArea = Infinity, maxArea = 0, maxFootDrift = 0, maxBindError = 0;
  let lo = Infinity, hi = -Infinity;
  function measure(bind = false) {
    skeleton.updateWorldTransform(Physics.none);
    for (const {slot, attachment, rest, visible, posed} of parts) {
      attachment.computeWorldVertices(skeleton, slot, 0, posed.length, posed, 0, 2);
      for (let i = 0; i < posed.length; i += 2) {
        assert(Number.isFinite(posed[i]) && Number.isFinite(posed[i+1]), `${variant}: nonfinite vertex`);
        lo = Math.min(lo, posed[i]); hi = Math.max(hi, posed[i]);
        if (bind) maxBindError = Math.max(maxBindError, Math.abs(posed[i]-rest[i]), Math.abs(posed[i+1]-rest[i+1]));
        if (-rest[i+1] >= (modern ? 1420 : 1600)) maxFootDrift = Math.max(maxFootDrift, Math.hypot(posed[i]-rest[i],posed[i+1]-rest[i+1]));
      }
      const triangles = attachment.triangles;
      for (let i = 0; i < triangles.length; i += 3) {
        if (visible && !visible.has(i/3)) continue;
        const [a,b,c] = triangles.slice(i,i+3);
        const before = signedArea(rest,a,b,c);
        if (Math.abs(before) < 0.001) continue;
        const ratio = signedArea(posed,a,b,c)/before;
        minArea = Math.min(minArea, ratio); maxArea = Math.max(maxArea, ratio);
        assert(ratio > 0.55 && ratio < 1.55, `${variant}/${slot.data.name}: flipped/stretched triangle ${i/3}: ${ratio}, pose ${poses}`);
      }
    }
    poses++;
  }
  measure(true);
  assert(maxBindError < 0.001, `${variant}: setup pose changed`);
  // Different idle phases, repeated interrupts, and the same additive mixing
  // and speed controls used by SpineCastFigure, rather than isolated clips.
  for (const phase of [0, 0.7, 1.8, 3.1]) for (const speed of [1,2,4]) for (const kind of ['idle','win','winBig','trigger']) {
    state.clearTracks(); skeleton.setupPose();
    state.setAnimation(0, 'idle', true).trackTime = phase;
    state.apply(skeleton);
    const startReaction = () => {
      const e = state.setAnimation(1, kind, false);
      e.additive = true; e.mixDuration = 0.06; e.timeScale = speed;
      state.addEmptyAnimation(1, 0.14/speed, 0);
    };
    if (kind !== 'idle') startReaction();
    for (let frame = 0; frame < 180; frame++) {
      if (kind !== 'idle' && frame === 19) startReaction();
      state.update(1/60); state.apply(skeleton); measure();
    }
    assert(kind === 'idle' || !state.tracks[1] || state.tracks[1].animation.name === '<empty>', 'reaction failed to return to idle');
  }
  assert(maxFootDrift < 0.01, `${variant}: shoes moved ${maxFootDrift}px`);
  assert(lo >= json.turf.envelope[0] && hi <= json.turf.envelope[1], `${variant}: layout envelope too small ${lo}..${hi}`);
  results.push({ variant, poses, maxBindError, maxFootDrift, triangleAreaRatio: [minArea,maxArea], xEnvelope: [lo,hi] });
  console.log(`${variant}: ${poses} poses, area ${minArea.toFixed(3)}..${maxArea.toFixed(3)}, feet ${maxFootDrift.toFixed(6)}px, x ${lo.toFixed(1)}..${hi.toFixed(1)}`);
}
fs.writeFileSync(path.join(app, modern ? 'design/rebuild_20261023/spine/geometry-check.json' : 'design/spine_motion_cast/geometry-check.json'), JSON.stringify(results,null,2));
