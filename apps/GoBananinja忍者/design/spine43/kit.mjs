// Shared bits for the ninja mascot's Spine 4.3 pass (2026-10-23).
//
// The game plays spine-core 4.2.74; spine-generator (E:/stake/spine-generator,
// override with SPINE_MOTION_KIT) speaks 4.3. Bone timelines and physics
// settings mean the same in both, so motion is solved and checked on a 4.3
// copy (ik + physics moved into the unified `constraints` list) and only the
// keys are copied back into the 4.2 file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const KIT = process.env.SPINE_MOTION_KIT ?? 'E:/stake/spine-generator';
export const kit = (f) => import(pathToFileURL(path.join(KIT, 'src', f)).href);
export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const APP = path.resolve(HERE, '../..');
export const RIG = path.join(APP, 'static/assets/spines/goBananinjaMascot/ninja.json');
export const readRig = () => JSON.parse(fs.readFileSync(RIG, 'utf8'));

export function to43(j) {
  const c = structuredClone(j);
  c.skeleton.spine = '4.3.13';
  const ik = (c.ik ?? []).map(({ order, ...k }) => ({ type: 'ik', order, ...k }));
  const ph = (c.physics ?? []).map(({ order, ...k }) => ({ type: 'physics', order, ...k }));
  // 4.3 orders constraints by their place in the list
  c.constraints = [...ik, ...ph].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(({ order: _o, ...k }) => k);
  delete c.ik;
  delete c.physics;
  return c;
}

export const LOOPS = ['idle', 'flutter', 'dance', 'blink', 'glint'];
