// QA: one triangle's area ratio frame by frame through a director run.
//   node design/cast_v6/tri_time.mjs <rigDir> <slot> <tri> <kind> [phase]
import fs from 'node:fs'; import path from 'node:path';
import {Physics} from '@esotericsoftware/spine-core';
import {readCastSkeleton} from '../../src/game/spineCastData.ts';
import {CastDirector} from '../../src/game/castDirector.ts';
const [dir, slotName, tri, kind, phase = '0.7'] = process.argv.slice(2);
const json = JSON.parse(fs.readFileSync(path.join(dir, 'cast.spine.json')));
const sk = readCastSkeleton(json); sk.setupPose(); sk.updateWorldTransform(Physics.none);
const slot = sk.slots.find((s) => s.data.name === slotName); const a = slot.getAppliedPose().attachment;
const [i, j, k] = a.triangles.slice(tri * 3, tri * 3 + 3);
const pose = () => { const o = new Float32Array(a.worldVerticesLength); a.computeWorldVertices(sk, slot, 0, o.length, o, 0, 2); return o; };
const area = (p) => (p[2*j]-p[2*i])*(p[2*k+1]-p[2*i+1])-(p[2*j+1]-p[2*i+1])*(p[2*k]-p[2*i]);
const rest = area(pose());
const d = new CastDirector(sk, json.turf, () => 0.5);
for (let t = 0; t < Number(phase); t += 1 / 60) d.step(1 / 60);
d.react(kind, 1);
const rows = [];
for (let f = 0; f < 140; f++) { d.step(1 / 60); const r = area(pose()) / rest; if (r < 0.4 || r > 3) rows.push(`${f}:${r.toFixed(2)}`); }
console.log(rows.join(' ') || 'never below 0.4');
