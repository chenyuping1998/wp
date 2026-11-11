// Setup-pose bone origins (canvas px) of a kit skeleton, for mesh weighting.
//   node design/rebuild_20261023/dump_kit_bones.mjs <kit json> > bones.json
import fs from 'node:fs';
import { Physics, Skeleton, SkeletonJson } from '@esotericsoftware/spine-core';
import { castAttachmentLoader } from '../../src/game/spineCastData.ts';
const json = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const sk = new Skeleton(new SkeletonJson(castAttachmentLoader).readSkeletonData(json));
sk.setupPose(); sk.updateWorldTransform(Physics.none);
const ox = -json.skeleton.x, oy = json.skeleton.y + json.skeleton.height;
process.stdout.write(JSON.stringify(sk.bones.map((b) => ({ name: b.data.name, parent: b.parent?.data.name ?? null,
  length: b.data.length, x: b.appliedPose.worldX + ox, y: oy - b.appliedPose.worldY,
  // bone tip (x along the bone by its length)
  tx: b.appliedPose.worldX + b.appliedPose.a * b.data.length + ox, ty: oy - (b.appliedPose.worldY + b.appliedPose.c * b.data.length) }))));
