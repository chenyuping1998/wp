// Parse and pose the shipped, PSD-derived costume with the game's Spine runtime.
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
const names = ['idle', 'cheer', 'chestbeat', 'nod', 'throwit', 'flinch', 'alert', 'glance', 'flutter'];
for (const name of names) if (!data.findAnimation(name)) throw new Error(`Missing animation: ${name}`);

const meshSlots = skeleton.slots.filter((slot) => slot.getAttachment()?.triangles);
const area = (xy, a, b, c) => {
	a *= 2; b *= 2; c *= 2;
	return (xy[b] - xy[a]) * (xy[c+1] - xy[a+1]) - (xy[b+1] - xy[a+1]) * (xy[c] - xy[a]);
};
const poseAreas = (slot, attachment) => {
	const xy = new Float32Array(attachment.worldVerticesLength);
	attachment.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
	const out = [];
	const indices = attachment.triangles;
	for (let i = 0; i < indices.length; i += 3) out.push(area(xy, indices[i], indices[i+1], indices[i+2]));
	return out;
};
skeleton.updateWorldTransform(Physics.update);
const baselines = new Map(meshSlots.map((slot) => [slot.data.name, {
	attachment: slot.getAttachment(), areas: poseAreas(slot, slot.getAttachment()),
}]));
let minimumRatio = Infinity;
let worst = '';
for (const name of names) {
	state.setAnimation(0, name, name === 'idle' || name === 'flutter');
	for (let frame = 0; frame < 90; frame++) {
		state.update(1/30);
		state.apply(skeleton);
		skeleton.updateWorldTransform(Physics.update);
		for (const slot of meshSlots) {
			const base = baselines.get(slot.data.name);
			if (slot.getAttachment() !== base.attachment) continue;
			const posed = poseAreas(slot, base.attachment);
			for (let j = 0; j < posed.length; j++) {
				const ratio = posed[j] / base.areas[j];
				if (ratio < minimumRatio) { minimumRatio = ratio; worst = `${name}, ${slot.data.name}, frame ${frame}, triangle ${j}`; }
			}
		}
	}
}
if (!(minimumRatio > 0)) throw new Error(`Spine mesh inverted at ${worst}: ${minimumRatio}`);
console.log(`OK: ${data.bones.length} PSD bones, ${data.animations.length} animations; ${meshSlots.length} mesh attachments, minimum area ${Math.round(minimumRatio*100)}% at ${worst}`);
