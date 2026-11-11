// QA: horizontal ink extent (canvas px) reached by each reaction over the idle.
//   node design/cast_v6/envelope_by_clip.mjs <rigDir>
import fs from 'node:fs'; import path from 'node:path';
import {readCastSkeleton} from '../../src/game/spineCastData.ts';
import {CastDirector} from '../../src/game/castDirector.ts';
const dir = process.argv[2];
const json = JSON.parse(fs.readFileSync(path.join(dir, 'cast.spine.json')));
const [ox] = json.turf.origin; const L = json.turf.layers;
for (const kind of [null, ...Object.keys(json.turf.reactions)]) {
  let lo = Infinity, hi = -Infinity, at = 0;
  for (const phase of [0, 0.5, 1, 1.5]) {
    const sk = readCastSkeleton(json); const d = new CastDirector(sk, { ...json.turf, variants: [] });
    for (let t = 0; t < phase; t += 1 / 60) d.step(1 / 60);
    if (kind) d.react(kind, 1);
    for (let f = 0; f < 156; f++) {
      d.step(1 / 60);
      sk.slots.forEach((slot, si) => { const a = slot.getAppliedPose().attachment; const o = new Float32Array(a.worldVerticesLength); a.computeWorldVertices(sk, slot, 0, o.length, o, 0, 2);
        const box = L[si].inkBox; const uv = a.regionUVs; const [cx, cy, cw, ch] = L[si].crop;
        for (let i = 0; i < o.length; i += 2) { const rx = cx + uv[i] * cw, ry = cy + uv[i + 1] * ch; if (rx < box[0] - 2 || rx > box[2] + 2 || ry < box[1] - 2 || ry > box[3] + 2) continue; const x = o[i] + ox; if (x < lo) lo = x; if (x > hi) { hi = x; at = f / 60; } } });
    }
  }
  console.log((kind ?? 'idle').padEnd(8), 'x', Math.floor(lo), '..', Math.ceil(hi), ' width', Math.ceil(hi - lo), ' max at', at.toFixed(2) + 's');
}
