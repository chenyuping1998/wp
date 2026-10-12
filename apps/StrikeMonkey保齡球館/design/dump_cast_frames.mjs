// Dumps the cast figure's REAL posed geometry (spine-core, physics included,
// `flutter` on track 1 as Mascot.svelte plays it) for design/render_cast_frames.py
// to rasterize — the only way to SEE seams and tears offline, which
// check_cast_flow's area numbers cannot show.
//
//   node design/dump_cast_frames.mjs <mg|fg> <anim> <out.json> [fps=20]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const [cast, anim, outFile, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg ?? 20);
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fromPixiSvelte = createRequire(path.join(appRoot, '../../packages/pixi-svelte/package.json'));
const spinePixi = fs.realpathSync(path.dirname(fromPixiSvelte.resolve('@esotericsoftware/spine-pixi-v8')));
const core = await import(pathToFileURL(createRequire(path.join(spinePixi, 'x.js')).resolve('@esotericsoftware/spine-core')).href);

const dir = process.env.SPINE_DIR ?? path.join(appRoot, 'static/assets/spines', cast === 'mg' ? 'sushiMaster' : 'sushiApprentice');
const atlasText = fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8');
const atlas = new core.TextureAtlas(atlasText);
let pageSize = [1, 1];
{
	const m = atlasText.match(/size:\s*(\d+),\s*(\d+)/);
	if (m) pageSize = [+m[1], +m[2]];
}
for (const p of atlas.pages) p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: pageSize[0], height: pageSize[1] }) });
const raw = JSON.parse(fs.readFileSync(path.join(dir, 'monkey.json'), 'utf8'));
const data = new core.SkeletonJson(new core.AtlasAttachmentLoader(atlas)).readSkeletonData(raw);

const s = new core.Skeleton(data);
const state = new core.AnimationState(new core.AnimationStateData(data));
// anim 'setup': the setup pose alone, one frame (the rest-pose regression check)
const setup = anim === 'setup';
if (!setup) {
	state.setAnimation(0, anim, anim === 'idle');
	state.setAnimation(1, 'flutter', true);
}
s.setToSetupPose();
s.updateWorldTransform(core.Physics.reset);
const dur = setup ? 0 : data.findAnimation(anim).duration + 0.5;
const dt = 1 / 60;
const every = Math.round(60 / fps);
const frames = [];
let i = 0;
for (let t = 0; t <= dur; t += dt, i++) {
	if (!setup) {
		state.update(dt);
		state.apply(s);
		s.update(dt);
		s.updateWorldTransform(core.Physics.update);
	}
	if (i % every) continue;
	const slots = [];
	for (const slot of s.drawOrder) {
		const att = slot.getAttachment();
		if (!att || slot.color.a <= 0) continue;
		if (att instanceof core.MeshAttachment) {
			const w = new Float32Array(att.worldVerticesLength);
			att.computeWorldVertices(slot, 0, w.length, w, 0, 2);
			slots.push({ slot: slot.data.name, att: att.name, v: Array.from(w, (x) => +x.toFixed(2)), uv: Array.from(att.uvs, (x) => +x.toFixed(5)), tri: Array.from(att.triangles) });
		} else if (att instanceof core.RegionAttachment) {
			const w = new Float32Array(8);
			att.computeWorldVertices(slot, w, 0, 2);
			slots.push({ slot: slot.data.name, att: att.name, v: Array.from(w, (x) => +x.toFixed(2)), uv: Array.from(att.uvs, (x) => +x.toFixed(5)), tri: [0, 1, 2, 2, 3, 0] });
		}
	}
	frames.push({ t: +t.toFixed(3), slots });
}
fs.writeFileSync(outFile, JSON.stringify({ page: pageSize, frames }));
console.log(`${cast} ${anim}: ${frames.length} frames, ${frames[0].slots.length} slots`);
