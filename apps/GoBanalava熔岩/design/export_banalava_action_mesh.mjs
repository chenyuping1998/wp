// Export real Spine-runtime vertices for visual QA of the new PSD skin.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((name) => name.startsWith('@esotericsoftware+spine-core@'));
if (!coreDir) throw new Error('Spine runtime package missing');
const corePath = path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js');
const { TextureAtlas, AtlasAttachmentLoader, SkeletonJson, Skeleton, AnimationStateData, AnimationState, Physics } = await import(pathToFileURL(corePath).href);
const dir = path.join(root, 'static/assets/spines/goBananasMonkey');
const atlas = new TextureAtlas(fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8'));
const json = JSON.parse(fs.readFileSync(path.join(dir, 'monkey.json'), 'utf8'));
const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);
const skeleton = new Skeleton(data);
const state = new AnimationState(new AnimationStateData(data));
const slot = skeleton.findSlot('lava_body');
const mesh = slot.getAttachment();
const xy = new Float32Array(mesh.worldVerticesLength);
const samples = [];
for (const animation of data.animations) {
  for (const fraction of [0, 0.5, 0.9]) {
    skeleton.setToSetupPose();
    state.clearTracks();
    state.setAnimation(0, animation.name, false);
    const time = animation.duration * fraction;
    state.update(time);
    state.apply(skeleton);
    skeleton.updateWorldTransform(Physics.update);
    mesh.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
    samples.push({ animation: animation.name, fraction, time, xy: Array.from(xy) });
  }
}
const out = {
  uv: Array.from(mesh.regionUVs),
  triangles: Array.from(mesh.triangles),
  samples,
};
fs.writeFileSync(path.join(root, 'design/source/banalava_action_mesh.json'), JSON.stringify(out));
console.log(`Exported ${samples.length} real Spine poses`);
