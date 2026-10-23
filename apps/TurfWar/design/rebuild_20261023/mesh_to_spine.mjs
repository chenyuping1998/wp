// kit skeleton + kit/<who>/mesh.json -> Spine 4.3 rig with 4 weighted meshes,
// installed to static/assets/castLayers/turf/v5/<base|fg>/. Also measures the
// motion envelope over the moves the game plays and checks the setup pose puts
// every vertex back on the drawing.
//   node design/rebuild_20261023/mesh_to_spine.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AnimationState, AnimationStateData, Physics, Skeleton, SkeletonJson, Vector2 } from '@esotericsoftware/spine-core';
import { castAttachmentLoader, readCastSkeleton } from '../../src/game/spineCastData.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../..');
// The generator's own moves, as the user asked (「出拳 慶祝 等等」).
const IDLE = 'idle';
const REACTIONS = { win: 'punch', winBig: 'celebrate', trigger: 'celebrate' };
// Playback rate per move: at the generator's Iron Jaw timing the guard and jab
// read as twitching at side-strip size (「動作太快很像抽動」 2026-10-23).
const SPEED = { idle: 0.7, punch: 0.6, celebrate: 0.7 };
// The kit slides/turns the head on its own; in the hood that reads as the face
// separating from the neck. Keep the head riding the chest.
const HEAD_DAMP = { translate: 0.2, translatex: 0.2, translatey: 0.2, rotate: 0.5 };

for (const [who, variant] of [['mg', 'base'], ['fg', 'fg']]) {
  const kit = JSON.parse(fs.readFileSync(path.join(here, 'kit', who, 'spine', `turf_${who}.json`), 'utf8'));
  const mesh = JSON.parse(fs.readFileSync(path.join(here, 'kit', who, 'mesh.json'), 'utf8'));
  const ox = -kit.skeleton.x, oy = kit.skeleton.y + kit.skeleton.height;
  // During the jab / fist pump the guard (near) fist's IK target stays pinned
  // while the body lunges, folding that elbow until the wrap squashes. Hand the
  // guard arm to the chest instead (IK mix 0; AnimationState blends it in/out).
  for (const name of ['punch', 'celebrate']) {
    const c = kit.constraints.find((k) => k.name === 'arm-back');
    kit.animations[name].ik = { 'arm-back': [{ time: 0, mix: 0, bendPositive: c.bendPositive ?? true }] };
  }
  for (const anim of Object.values(kit.animations)) {
    for (const [prop, keys] of Object.entries(anim.bones?.head ?? {})) {
      const k = HEAD_DAMP[prop] ?? 1;
      for (const key of keys) {
        for (const f of ['value', 'x', 'y']) if (f in key) key[f] = +(key[f] * k).toFixed(3);
        if (key.curve) key.curve = key.curve.map((c, i) => (i % 2 ? c * k : c));
      }
    }
  }
  const bare = { ...kit, slots: [], skins: [{ name: 'default', attachments: {} }] };
  const sk = new Skeleton(new SkeletonJson(castAttachmentLoader).readSkeletonData(bare));
  sk.setupPose(); sk.updateWorldTransform(Physics.none);
  const boneIndex = Object.fromEntries(sk.bones.map((b, i) => [b.data.name, i]));
  const attachments = {};
  for (const layer of mesh) {
    const vertices = [];
    layer.verts.forEach(([x, y], v) => {
      const ws = layer.weights[v];
      vertices.push(ws.length);
      for (const [name, w] of ws) {
        const p = new Vector2(x - ox, oy - y);
        sk.bones[boneIndex[name]].appliedPose.worldToLocal(p);
        vertices.push(boneIndex[name], +p.x.toFixed(3), +p.y.toFixed(3), w);
      }
    });
    attachments[layer.name] = { [layer.name]: { type: 'mesh', path: layer.name,
      width: layer.crop[2], height: layer.crop[3], uvs: layer.uvs.flat(), triangles: layer.tris, vertices } };
  }
  const rig = { ...kit,
    slots: mesh.map((l) => ({ name: l.name, bone: 'root', attachment: l.name })),
    skins: [{ name: 'default', attachments }],
    turf: { figureBox: [0, 0, 0, 0], origin: [ox, oy], envelope: [0, 1024], idle: IDLE, reactions: REACTIONS, speed: SPEED,
      generator: `spine-motion-kit ${kit.skeleton.spine} bones + weighted meshes (build_mesh_cast.py)` } };

  // Setup pose must reproduce the drawing; collect posed verts for the envelope.
  const s = readCastSkeleton(rig);
  const posed = (fn) => {
    s.updateWorldTransform(Physics.none);
    for (const slot of s.slots) {
      const a = slot.getAppliedPose().attachment;
      const out = new Float32Array(a.worldVerticesLength);
      a.computeWorldVertices(s, slot, 0, out.length, out, 0, 2);
      for (let i = 0; i < out.length; i += 2) fn(slot.data.name, i / 2, out[i] + ox, oy - out[i + 1]);
    }
  };
  s.setupPose();
  let bind = 0, box = [Infinity, Infinity, -Infinity, -Infinity];
  const byName = Object.fromEntries(mesh.map((l) => [l.name, l]));
  posed((name, v, x, y) => {
    const [vx, vy] = byName[name].verts[v];
    bind = Math.max(bind, Math.abs(x - vx), Math.abs(y - vy));
    box = [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)];
  });
  assert(bind < 0.5, `${variant}: setup pose moved vertices by ${bind}px`);
  rig.turf.figureBox = box.map(Math.round);
  let lo = Infinity, hi = -Infinity, top = Infinity;
  for (const name of [IDLE, ...new Set(Object.values(REACTIONS))]) {
    const anim = s.data.findAnimation(name);
    assert(anim, name);
    const st = new AnimationState(new AnimationStateData(s.data));
    st.setAnimation(0, name, false);
    for (let t = 0; t <= anim.duration + 1e-6; t += 1 / 30) {
      s.setupPose(); st.tracks[0].trackTime = t; st.apply(s);
      posed((_n, _v, x, y) => { lo = Math.min(lo, x); hi = Math.max(hi, x); top = Math.min(top, y); });
    }
  }
  rig.turf.envelope = [Math.floor(lo), Math.ceil(hi)];
  const dest = path.join(app, 'static/assets/castLayers/turf/v5', variant);
  fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(dest, { recursive: true });
  for (const l of mesh) fs.copyFileSync(path.join(here, 'kit', who, `${l.name}.png`), path.join(dest, `${l.name}.png`));
  fs.writeFileSync(path.join(dest, 'cast.spine.json'), JSON.stringify(rig));
  console.log(variant, 'figureBox', rig.turf.figureBox, 'envelope', rig.turf.envelope, 'highest y', Math.round(top), 'bind', bind.toFixed(4));
}
