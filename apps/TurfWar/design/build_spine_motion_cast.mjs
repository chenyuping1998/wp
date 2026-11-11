// @ts-nocheck -- offline Node design tool, outside the game's TS environment.
/** Reuse the delivered artwork, mesh weights and measured bind joints.
 * Only convert the existing rig format; spine-motion-kit authors every timeline.
 * Run: node design/build_spine_motion_cast.mjs [--kit /path/to/spine-generator]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { Physics } from '@esotericsoftware/spine-core';
import { readCastSkeleton } from '../src/game/spineCastData.ts';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kitArg = process.argv.indexOf('--kit');
const kit = kitArg < 0 ? path.join(os.homedir(), 'tools/spine-generator') : process.argv[kitArg + 1];
const { compileRecipe } = await import(pathToFileURL(path.join(kit, 'src/recipe.ts')).href);
const { checkSkeleton, reportMarkdown } = await import(pathToFileURL(path.join(kit, 'src/check.ts')).href);
const modern = fs.existsSync(path.join(app,'static/assets/castLayers/turf/v3/base/layers.manifest.json'));
const out = path.join(app, modern ? 'design/rebuild_20261023/spine' : 'design/spine_motion_cast');
fs.mkdirSync(out, { recursive: true });
const round = n => Math.round(n * 1e6) / 1e6;
const wave = (bone, channel, amplitude, period, peakAt) => ({ bone, channel, type: 'wave', amplitude, period, peakAt });
const beat = (bone, channel, value, duration, lag = 0) => ({ bone, channel, type: 'poses', points: [
  { time: 0, value: 0 },
  ...(lag ? [{ time: lag, value: 0 }] : []),
  { time: lag + duration * 0.15, value: -value * 0.18, ease: 'sineInOut' },
  { time: lag + duration * 0.32, value, ease: 'cubicInOut' },
  { time: lag + duration * 0.57, value: value * 0.55, ease: 'sineInOut' },
  { time: lag + duration, value: 0, ease: 'sineInOut' },
] });

for (const variant of ['base', 'fg']) {
  const dir = path.join(app, 'static/assets/castLayers/turf', modern ? 'v3' : '', variant);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'layers.manifest.json')));
  const bones = manifest.layers[0].rig.bones;
  const attachments = {};
  for (const layer of manifest.layers) {
    const [cx, cy, cw, ch] = layer.crop;
    const { rig } = layer;
    const vertices = [];
    rig.verts.forEach(([x, y], vi) => {
      const influences = rig.weights[vi].map((w, bi) => [w, bi]).filter(([w]) => w > 0);
      const total = influences.reduce((s, [w]) => s + w, 0);
      vertices.push(influences.length);
      for (const [w, bi] of influences) vertices.push(bi, round(x - bones[bi].x), round(bones[bi].y - y), w / total);
    });
    attachments[layer.name] = { [layer.name]: {
      type: 'mesh', path: layer.name, width: cw, height: ch,
      uvs: rig.verts.flatMap(([x, y]) => [round((x - cx) / cw), round((y - cy) / ch)]),
      triangles: rig.tris.flat(), vertices,
    } };
  }
  const skeleton = {
    skeleton: { spine: '4.3.13', images: './images/' },
    bones: bones.map(b => {
      const p = bones[b.parent];
      return { name: b.name, ...(p ? { parent: p.name } : {}), x: round(b.x - (p?.x ?? 0)), y: round((p?.y ?? 0) - b.y) };
    }),
    slots: manifest.order.map(name => ({ name, bone: 'root', attachment: name })),
    skins: [{ name: 'default', attachments }],
    turf: { figureBox: manifest.figure_box, envelope: modern ? [-45, 1100] : [55, 980], generator: 'spine-motion-kit 0.1.0 / Spine 4.3.13' },
  };
  // A format conversion must reproduce EVERY delivered vertex in setup pose.
  const check = readCastSkeleton(skeleton);
  check.updateWorldTransform(Physics.none);
  let maxBindError = 0;
  for (const slot of check.slots) {
    const a = slot.getAppliedPose().attachment;
    const positions = new Float32Array(a.worldVerticesLength);
    a.computeWorldVertices(check, slot, 0, positions.length, positions, 0, 2);
    const original = manifest.layers.find(l => l.name === slot.data.name).rig.verts;
    original.forEach(([x, y], i) => { maxBindError = Math.max(maxBindError, Math.abs(positions[2*i] - x), Math.abs(-positions[2*i+1] - y)); });
  }
  assert(maxBindError < 0.001, `Bind pose changed: ${maxBindError}px`);
  const boss = variant === 'fg';
  const period = boss ? 4.2 : 3.6;
  const accessories = modern ? [] : boss ? ['dangle_smoke'] : ['dangle_chain', 'dangle_mask'];
  const reaction = (name, strength, duration) => ({ name, duration: duration + 0.1, tracks: [
    beat('waist', 'rotate', -0.7 * strength, duration),
    beat('chest', 'rotate', 1.8 * strength, duration),
    beat('chest', 'y', 7 * strength, duration),
    beat('neck', 'rotate', -0.6 * strength, duration, 0.035),
    beat('head', 'rotate', (modern ? -4 : -2.4) * strength, duration, 0.07),
    ...(modern ? [
      beat('arm_l', 'rotate', 8 * strength, duration),
      beat('fore_l', 'rotate', 5 * strength, duration, 0.035),
      beat('arm_r', 'rotate', -5 * strength, duration, 0.05),
      beat('fore_r', 'rotate', -4 * strength, duration, 0.08),
    ] : []),
    ...accessories.map((b, i) => beat(b, 'rotate', (boss ? 6 : 8 + i * 2) * strength, duration, 0.1)),
  ] });
  const recipe = {
    fps: 30, facing: -1, size: 2.57,
    roles: { hip: 'waist', chest: 'chest', head: 'head' },
    animations: [
      { name: 'idle', preset: 'breathe', params: { period, intensity: boss ? 0.38 : 0.48 }, tracks: [
        wave('waist', 'rotate', boss ? 0.25 : 0.4, period, period * 0.4),
        wave('neck', 'rotate', -0.35, period, period * 0.51),
        ...(modern ? [
          wave('arm_l','rotate',0.8,period,period*.53),
          wave('fore_l','rotate',-1.4,period,period*.6),
          wave('arm_r','rotate',-0.65,period,period*.58),
          wave('fore_r','rotate',1.1,period,period*.65),
        ] : []),
        ...accessories.map((b, i) => wave(b, 'rotate', boss ? 2.8 : 1.8 + i * 0.8, period, period * (0.62 + i * 0.05))),
      ] },
      reaction('win', boss ? 0.55 : 0.7, 0.8),
      reaction('winBig', boss ? 0.85 : 1.05, 1.05),
      reaction('trigger', boss ? 1.1 : 1.3, 1.25),
    ],
  };
  fs.writeFileSync(path.join(out, `${variant}.setup.json`), JSON.stringify(skeleton));
  fs.writeFileSync(path.join(out, `${variant}.recipe.json`), JSON.stringify(recipe, null, 2));
  const result = compileRecipe(skeleton, recipe);
  const reports = checkSkeleton(result.json, { loops: ['idle'] });
  fs.writeFileSync(path.join(out, `${variant}.check.md`), reportMarkdown(variant, reports));
  fs.writeFileSync(path.join(dir, 'cast.spine.json'), JSON.stringify(result.json));
  // A complete Import Data delivery alongside the compact runtime payload.
  const delivery = path.join(out, variant);
  fs.mkdirSync(path.join(delivery, 'images'), { recursive: true });
  fs.writeFileSync(path.join(delivery, `${variant}.json`), JSON.stringify(result.json));
  for (const layer of manifest.layers) fs.copyFileSync(path.join(dir, layer.texture), path.join(delivery, 'images', `${layer.name}.png`));
  console.log(`${variant}: ${bones.length} bones, ${manifest.layers.length} weighted meshes; bind error ${maxBindError.toFixed(6)}px`);
  console.log(reports.map(r => `${r.name}: ${r.score}`).join(', '));
}
