// Pose the shipped mascot rig in spine-core exactly as the game plays it — the
// animation on track 0, `flutter` looping on track 1, physics stepped at 60fps
// — and dump every visible attachment's world vertices, atlas UVs and
// triangles at the asked times, for design/render_ninja_frames.py to draw.
//
// (preview_monkey_spine.mjs jumps straight to a time, so physics never shows,
// and it cannot draw meshes; this steps.)
//
//   node design/dump_ninja_frames.mjs <animation> <s,s,...> <out.json> [--wire]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((n) => n.startsWith('@esotericsoftware+spine-core@'));
const S = await import(pathToFileURL(path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js')).href);
const dir = path.join(root, 'static/assets/spines/goBananinjaMascot');
const atlas = new S.TextureAtlas(fs.readFileSync(path.join(dir, 'ninja.atlas'), 'utf8'));
const data = new S.SkeletonJson(new S.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(path.join(dir, 'ninja.json'), 'utf8')));
const sk = new S.Skeleton(data);
const st = new S.AnimationState(new S.AnimationStateData(data));

const [anim, timesArg, out] = process.argv.slice(2);
const times = timesArg.split(',').map(Number);
st.setAnimation(0, anim, anim === 'idle' || anim === 'dance');
if (data.findAnimation('flutter')) st.setAnimation(1, 'flutter', true);
if (data.findAnimation('blink')) st.setAnimation(2, 'blink', true);
if (data.findAnimation('glint')) st.setAnimation(3, 'glint', true);
sk.updateWorldTransform(S.Physics.reset);

const frames = [];
let t = 0;
const last = Math.max(...times);
for (let f = 0; t <= last + 1e-6; f++) {
	const dt = 1 / 60;
	st.update(dt);
	st.apply(sk);
	sk.update(dt);
	sk.updateWorldTransform(S.Physics.update);
	t = (f + 1) / 60;
	for (const want of times) {
		if (Math.abs(t - want) > 0.5 / 60) continue;
		const slots = [];
		for (const slot of sk.drawOrder) {
			const a = slot.getAttachment();
			if (!a || slot.color.a < 0.02) continue; // a slot faded out (the shuriken glint at rest)
			if (a.triangles) {
				const xy = new Float32Array(a.worldVerticesLength);
				a.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
				slots.push({ name: slot.data.name, verts: Array.from(xy), uvs: Array.from(a.uvs), tris: Array.from(a.triangles) });
			} else if (a.computeWorldVertices && a.uvs) {
				const xy = new Float32Array(8);
				a.computeWorldVertices(slot, xy, 0, 2);
				slots.push({ name: slot.data.name, verts: Array.from(xy), uvs: Array.from(a.uvs), tris: [0, 1, 2, 0, 2, 3] });
			}
		}
		frames.push({ t: want, slots });
	}
}
fs.writeFileSync(out, JSON.stringify({ anim, page: path.join(dir, 'ninja.png'), frames }));
console.log(`${anim}: ${frames.length} frames -> ${out}`);
