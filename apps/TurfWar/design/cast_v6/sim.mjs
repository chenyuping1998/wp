// Simulate the in-game cast playback (src/game/castDirector.ts, the class the
// game itself runs) and dump posed mesh vertices for the renderer.
//   node design/cast_v6/sim.mjs <rigDir/variant> <out.json> --fps 30 --dur 6
//        --events "punch@1.0,celebrate@3.5" [--speed 1] [--seed 7] [--from 0]
// Events: <reactionKind|animName>@<seconds>. A kind (win/winBig/trigger) goes
// through director.react; a raw animation name is forced on the overlay.
import fs from 'node:fs';
import path from 'node:path';
import { readCastSkeleton } from '../../src/game/spineCastData.ts';
import { CastDirector } from '../../src/game/castDirector.ts';

const [dir, out, ...rest] = process.argv.slice(2);
const opt = (n, d) => { const i = rest.indexOf('--' + n); return i < 0 ? d : rest[i + 1]; };
const fps = Number(opt('fps', 30)), dur = Number(opt('dur', 4)), speed = Number(opt('speed', 1));
const from = Number(opt('from', 0)), simFps = 60;
let seed = Number(opt('seed', 7));
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const events = (opt('events', '') || '').split(',').filter(Boolean).map((e) => { const [k, t] = e.split('@'); return { k, t: Number(t), done: false }; });
const json = JSON.parse(fs.readFileSync(path.join(dir, opt('file', 'cast.spine.json')), 'utf8'));
const [ox, oy] = json.turf.origin;
const sk = readCastSkeleton(json);
const director = new CastDirector(sk, json.turf, random);
const kinds = new Set(['win', 'winBig', 'trigger', 'wild']);
const header = sk.slots.map((slot) => { const a = slot.getAppliedPose().attachment; return { name: slot.data.name, uvs: Array.from(a.regionUVs), tris: Array.from(a.triangles) }; });
const frames = [];
let nextSample = from;
const dt = 1 / simFps;
for (let i = 0, t = 0; t <= dur + 1e-9; i++, t = i * dt) {
  for (const e of events) if (!e.done && t >= e.t - 1e-9) {
    e.done = true;
    if (kinds.has(e.k)) director.react(e.k, speed);
    else director.overlayPlay(e.k, speed);
  }
  director.step(i === 0 ? 0 : dt);
  if (t + 1e-9 < nextSample) continue;
  nextSample += 1 / fps;
  frames.push({ t: +t.toFixed(4), slots: sk.slots.map((slot) => {
    const a = slot.getAppliedPose().attachment;
    const o = new Float32Array(a.worldVerticesLength);
    a.computeWorldVertices(sk, slot, 0, o.length, o, 0, 2);
    const v = new Array(o.length);
    for (let k = 0; k < o.length; k += 2) { v[k] = +(o[k] + ox).toFixed(2); v[k + 1] = +(oy - o[k + 1]).toFixed(2); }
    return v;
  }) });
}
fs.writeFileSync(out, JSON.stringify({ dir, header, frames }));
console.log(out, frames.length, 'frames');
