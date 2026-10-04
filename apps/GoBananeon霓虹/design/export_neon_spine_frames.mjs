// Export posed Spine triangles for an offline contact sheet, using the real runtime.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((name) => name.startsWith('@esotericsoftware+spine-core@'));
const corePath = path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js');
const { TextureAtlas, AtlasAttachmentLoader, SkeletonJson, Skeleton, AnimationStateData, AnimationState, Physics } = await import(pathToFileURL(corePath).href);
const dir = path.join(root, 'static/assets/spines/goBananasMonkey');
const atlas = new TextureAtlas(fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8'));
const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(fs.readFileSync(path.join(dir, 'monkey.json'), 'utf8'));
const animation = process.argv[2] ?? 'chestbeat';
const times = (process.argv[3] ?? '0,0.4,0.48,0.78,1.08,1.38,1.68,1.98,2.3').split(',').map(Number);
const page = fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8').match(/size:(\d+),(\d+)/);
const width = Number(page[1]), height = Number(page[2]);
const frames = [];
for (const time of times) {
	const skeleton = new Skeleton(data);
	const state = new AnimationState(new AnimationStateData(data));
	state.setAnimation(0, animation, false);
	state.update(time);
	state.apply(skeleton);
	skeleton.updateWorldTransform(Physics.update);
	const parts = [];
	for (const slot of skeleton.drawOrder) {
		const attachment = slot.getAttachment();
		if (!attachment?.uvs) continue;
		const mesh = Boolean(attachment.triangles);
		const xy = new Float32Array(mesh ? attachment.worldVerticesLength : 8);
		if (mesh) attachment.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
		else attachment.computeWorldVertices(slot, xy, 0, 2);
		parts.push({ name: slot.data.name, xy: Array.from(xy),
			uv: Array.from(attachment.uvs).map((v, i) => v * (i % 2 ? height : width)),
			triangles: mesh ? attachment.triangles : [0, 1, 2, 2, 3, 0] });
	}
	frames.push({ time, parts });
}
const output = path.join(root, 'design/source/monkey_neon/_posed_frames.json');
fs.writeFileSync(output, JSON.stringify({ animation, width, height, frames }));
console.log(`${animation}: ${frames.length} Spine frames -> ${output}`);
