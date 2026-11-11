// Turn the kit's arm IK into rigid shoulder swings on the installed rigs.
//
// The kit animates fists through two-bone IK, so every jab opens the elbow and
// twists the wrist. These arms are painted (bunched sleeves, wraps), and any
// elbow/wrist change tears them: cuffs swing out, wraps split from the fist
// (「出拳之類的手肘肉會跑出來」 2026-10-23). Here the same IK fist path is
// kept as TIMING and AIM only: each frame the whole arm turns about the shoulder
// by the change in shoulder->fist angle, elbow and wrist stay as drawn, and the
// arm IK is switched off. Legs keep their IK (feet stay planted).
//
// Run after install_kit_cast.py, before measure_kit_cast.mjs:
//   node design/rebuild_20261023/rigid_arms_kit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnimationState, AnimationStateData, Physics } from '@esotericsoftware/spine-core';
import { readCastSkeleton } from '../../src/game/spineCastData.ts';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ARMS = [
  { ik: 'arm-front', upper: 'upperArmF', target: 'ik-fist-front' },
  { ik: 'arm-back', upper: 'upperArmB', target: 'ik-fist-back' },
];
const FPS = 30;
const deg = (r) => (r * 180) / Math.PI;
const wrap = (a) => ((a + 540) % 360) - 180;

for (const variant of ['base', 'fg']) {
  const file = path.join(app, 'static/assets/castLayers/turf/v4', variant, 'cast.spine.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (json.turf.rigidArms) { console.log(variant, 'already rigid'); continue; }
  const withIk = readCastSkeleton(json);
  const noIkJson = structuredClone(json);
  for (const c of noIkJson.constraints) if (ARMS.some((a) => a.ik === c.name)) c.mix = 0;
  const noIk = readCastSkeleton(noIkJson);

  const aim = (sk, arm) => {
    const s = sk.findBone(arm.upper).appliedPose, t = sk.findBone(arm.target).appliedPose;
    return deg(Math.atan2(t.worldY - s.worldY, t.worldX - s.worldX));
  };
  withIk.setupPose(); withIk.updateWorldTransform(Physics.none);
  const rest = Object.fromEntries(ARMS.map((a) => [a.upper, {
    aim: aim(withIk, a), world: withIk.findBone(a.upper).appliedPose.getWorldRotationX() }]));

  for (const [name, anim] of Object.entries(json.animations)) {
    const duration = withIk.data.findAnimation(name).duration;
    const sA = new AnimationState(new AnimationStateData(withIk.data));
    const sB = new AnimationState(new AnimationStateData(noIk.data));
    sA.setAnimation(0, name, false); sB.setAnimation(0, name, false);
    const keys = Object.fromEntries(ARMS.map((a) => [a.upper, []]));
    for (let f = 0; f <= Math.round(duration * FPS); f++) {
      const t = Math.min(duration, f / FPS);
      for (const [sk, st] of [[withIk, sA], [noIk, sB]]) {
        sk.setupPose(); st.tracks[0].trackTime = t; st.apply(sk); sk.updateWorldTransform(Physics.none);
      }
      for (const arm of ARMS) {
        const want = rest[arm.upper].world + wrap(aim(withIk, arm) - rest[arm.upper].aim);
        const bone = noIk.findBone(arm.upper);
        const local = bone.parent.appliedPose.worldToLocalRotation(want);
        keys[arm.upper].push({ time: +t.toFixed(4), value: +wrap(local - bone.data.setupPose.rotation).toFixed(3) });
      }
    }
    anim.bones ??= {};
    for (const arm of ARMS) {
      // Rotate values are offsets from the setup rotation; linear between frames.
      anim.bones[arm.upper] = { ...(anim.bones[arm.upper] ?? {}), rotate: keys[arm.upper] };
    }
  }
  for (const c of json.constraints) if (ARMS.some((a) => a.ik === c.name)) c.mix = 0;
  json.turf.rigidArms = true;
  fs.writeFileSync(file, JSON.stringify(json));
  const swing = Object.fromEntries(Object.entries(json.animations).map(([n, a]) =>
    [n, ARMS.map((arm) => Math.round(Math.max(...a.bones[arm.upper].rotate.map((k) => Math.abs(k.value))))).join('/')]));
  console.log(variant, 'max shoulder swing F/B (deg)', swing);
}
