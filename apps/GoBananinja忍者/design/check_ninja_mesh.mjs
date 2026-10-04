// Parse the shipped rig in the game Spine runtime and sweep every animation.
// A folded triangle means the head/shoulder/waist weights need adjustment.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((name) => name.startsWith('@esotericsoftware+spine-core@'));
if (!coreDir) throw new Error('Spine runtime package missing');
const corePath = path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js');
const { TextureAtlas, AtlasAttachmentLoader, SkeletonJson, Skeleton, AnimationStateData, AnimationState, Physics } = await import(pathToFileURL(corePath).href);
const dir = path.join(root, 'static/assets/spines/goBananinjaMascot');
const atlas = new TextureAtlas(fs.readFileSync(path.join(dir, 'ninja.atlas'), 'utf8'));
const json = JSON.parse(fs.readFileSync(path.join(dir, 'ninja.json'), 'utf8'));
const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);
const skeleton = new Skeleton(data);
const state = new AnimationState(new AnimationStateData(data));
const slot = skeleton.findSlot('body');
const mesh = slot.getAttachment();
if (!mesh?.triangles) throw new Error('Ninja body is not a weighted mesh');
const xy = new Float32Array(mesh.worldVerticesLength);
const areas = () => {
	mesh.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
	const result = [];
	for (let i = 0; i < mesh.triangles.length; i += 3) {
		const a = mesh.triangles[i] * 2, b = mesh.triangles[i + 1] * 2, c = mesh.triangles[i + 2] * 2;
		result.push((xy[b] - xy[a]) * (xy[c + 1] - xy[a + 1]) - (xy[b + 1] - xy[a + 1]) * (xy[c] - xy[a]));
	}
	return result;
};
skeleton.updateWorldTransform(Physics.update);
const rest = areas();
let maxRestError = 0;
for (let v = 0; v < mesh.worldVerticesLength / 2; v++) {
	const expectedX = 82 + 877 * json.skins[0].attachments.body.body.uvs[v * 2] - 512;
	const expectedY = 1510 - (12 + 1496 * json.skins[0].attachments.body.body.uvs[v * 2 + 1]);
	maxRestError = Math.max(maxRestError, Math.hypot(xy[v * 2] - expectedX, xy[v * 2 + 1] - expectedY));
}
if (maxRestError > 0.02) throw new Error(`Body mesh shifts source art by ${maxRestError}px at rest`);
let minimum = Infinity, worst = '';
for (const animation of data.animations) {
	skeleton.setToSetupPose();
	state.clearTracks();
	state.setAnimation(0, animation.name, false);
	for (let frame = 0; frame <= 90; frame++) {
		state.update(1 / 60);
		state.apply(skeleton);
		skeleton.updateWorldTransform(Physics.update);
		const posed = areas();
		for (let i = 0; i < posed.length; i++) {
			const ratio = posed[i] / rest[i];
			if (ratio < minimum) { minimum = ratio; worst = `${animation.name} frame ${frame} triangle ${i}`; }
		}
	}
}
if (!(minimum > 0)) throw new Error(`Body triangle folded: ${worst}, ${minimum}`);
console.log(`OK: ${data.animations.length} animations, ${mesh.worldVerticesLength / 2} vertices, rest error ${maxRestError.toFixed(3)}px, minimum triangle area ${Math.round(minimum * 100)}% at ${worst}`);
