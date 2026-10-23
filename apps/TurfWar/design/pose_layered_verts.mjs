// @ts-nocheck -- standalone Node helper outside the browser TS config.
// Skin every shipped cast layer with the game's own castMotion at a rest pose
// and print the posed vertices as JSON (used by build_street_brand.py so the
// loading / tile / cover figure is the pose the game shows, elbows included).
//   node design/pose_layered_verts.mjs <manifest> <castMotion.ts> <tiers.ts#EXPORT> '<rest json>'
import fs from 'node:fs'; import path from 'node:path';
const [manifestPath, motionPath, tiersSpec, restJson, stateJson = '{}'] = process.argv.slice(2);
const motion = await import(path.resolve(motionPath));
const [tf, te] = tiersSpec.split('#'); const TIERS = (await import(path.resolve(tf)))[te];
const m = JSON.parse(fs.readFileSync(manifestPath));
const rig0 = m.layers[0].rig;
const mats = rig0.bones.map(() => new Float32Array(6)), chain = rig0.bones.map(() => new Float32Array(6));
const state = JSON.parse(stateJson);
motion.composeBoneMatrices(rig0, { pose: 'layered', rest: JSON.parse(restJson), timeMs: 0, tier: TIERS[state.kind ?? 'win'], reactionAge: null, durationMs: TIERS[state.kind ?? 'win'].durationMs, speed: 1, motionScale: 0, ...state }, mats, chain);
const res = {};
for (const l of m.layers) {
  const rest = new Float32Array(l.rig.verts.flat()); const pos = new Float32Array(rest.length);
  motion.skinVertices(rest, motion.buildWeightIndex(l.rig), mats, pos);
  res[l.name] = { src: l.rig.verts, dst: Array.from(pos), tris: l.rig.tris, crop: l.crop };
}
process.stdout.write(JSON.stringify({ order: m.order, layers: res }));
