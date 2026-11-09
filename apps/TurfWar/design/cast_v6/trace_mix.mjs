// QA: bone offsets + one triangle's ratio through an interrupted reaction.
//   node design/cast_v6/trace_mix.mjs <rigDir> <slot> <tri> <kind> <interrupt> <speed> [phase]
import fs from 'node:fs'; import path from 'node:path';
import {Physics} from '@esotericsoftware/spine-core';
import {readCastSkeleton} from '../../src/game/spineCastData.ts';
import {CastDirector} from '../../src/game/castDirector.ts';
const [dir, slotName, tri, kind, intr, speed, phase = '0'] = process.argv.slice(2);
const json = JSON.parse(fs.readFileSync(path.join(dir, 'cast.spine.json')));
const sk = readCastSkeleton(json); sk.setupPose(); sk.updateWorldTransform(Physics.none);
const setup = Object.fromEntries(sk.bones.map((b) => [b.data.name, b.data.setupPose.rotation]));
const slot = sk.slots.find((s) => s.data.name === slotName); const a = slot.getAppliedPose().attachment;
const [i, j, k] = a.triangles.slice(tri * 3, tri * 3 + 3);
const pose = () => { const o = new Float32Array(a.worldVerticesLength); a.computeWorldVertices(sk, slot, 0, o.length, o, 0, 2); return o; };
const area = (p) => (p[2*j]-p[2*i])*(p[2*k+1]-p[2*i+1])-(p[2*j+1]-p[2*i+1])*(p[2*k]-p[2*i]);
const rest = area(pose());
let seed = 7; const d = new CastDirector(sk, json.turf, () => ((seed = (seed * 16807) % 2147483647) / 2147483647));
for (let t = 0; t < Number(phase); t += 1 / 60) d.step(1 / 60);
d.react(kind, Number(speed));
for (let f = 0; f < 60; f++) {
  if (f === 19) d.react(intr, Number(speed));
  d.step(1 / 60);
  const r = area(pose()) / rest;
  const off = (n) => (sk.findBone(n).appliedPose.rotation - setup[n]).toFixed(1);
  if (f >= 20 && f <= 40) console.log(f, 'ratio', r.toFixed(2), 'upper', off('upperArmF'), 'delt', off('deltF'), 'fore', off('foreArmF'), 'clav', off('clavF'));
}
