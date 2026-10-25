// Poses the Saucer cast (copied from Putt's design/swing/, 2026-10-23) with the game's own runtime (spine-core 4.2, as
// spine-pixi-v8 does: the clip on track 0, `flutter` on track 1) and writes
// every visible triangle of every frame asked for, for render_frames.py to
// paint into a contact sheet. Nothing here is shipped.
//
//   node design/swing/dump_frames.mjs out.json clip:t1,t2,... [clip:...]

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fromPixiSvelte = createRequire(path.join(appRoot, '../../packages/pixi-svelte/package.json'));
const spinePixi = fs.realpathSync(path.dirname(fromPixiSvelte.resolve('@esotericsoftware/spine-pixi-v8')));
const core = await import(pathToFileURL(createRequire(path.join(spinePixi, 'x.js')).resolve('@esotericsoftware/spine-core')).href);

// CAST=fg poses the caddie instead of the golfer
const DIR = path.join(appRoot, 'static/assets/spines', process.env.CAST === 'fg' ? 'sushiApprentice' : 'sushiMaster');
const atlasText = fs.readFileSync(path.join(DIR, 'monkey.atlas'), 'utf8');
const size = atlasText.match(/size:(\d+),(\d+)/).slice(1).map(Number);
const atlas = new core.TextureAtlas(atlasText);
for (const p of atlas.pages) p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: size[0], height: size[1] }) });
const data = new core.SkeletonJson(new core.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(path.join(DIR, 'monkey.json'), 'utf8')));

const [outFile, ...asks] = process.argv.slice(2);
const frames = [];
for (const ask of asks) {
	const [clip, ts] = ask.split(':');
	for (const t of ts.split(',').map(Number)) {
		const sk = new core.Skeleton(data);
		const st = new core.AnimationState(new core.AnimationStateData(data));
		st.setAnimation(0, clip, false);
		st.setAnimation(1, 'flutter', true);
		sk.setToSetupPose();
		// step at 60fps so physics (none here) and mixing behave as in game
		const dt = 1 / 60;
		let now = 0;
		st.apply(sk);
		sk.updateWorldTransform(core.Physics.update);
		while (now + 1e-9 < t) {
			const h = Math.min(dt, t - now);
			st.update(h);
			sk.update(h);
			st.apply(sk);
			sk.updateWorldTransform(core.Physics.update);
			now += h;
		}
		const draws = [];
		for (const slot of sk.drawOrder) {
			const att = slot.getAttachment();
			if (!att || !slot.bone.active) continue;
			const a = slot.color.a;
			if (a <= 0.001) continue;
			if (att instanceof core.RegionAttachment) {
				const v = new Float32Array(8);
				att.computeWorldVertices(slot, v, 0, 2);
				draws.push({ slot: slot.data.name, a, xy: Array.from(v), uv: Array.from(att.uvs), tri: [0, 1, 2, 2, 3, 0] });
			} else if (att instanceof core.MeshAttachment) {
				const v = new Float32Array(att.worldVerticesLength);
				att.computeWorldVertices(slot, 0, att.worldVerticesLength, v, 0, 2);
				draws.push({ slot: slot.data.name, a, xy: Array.from(v), uv: Array.from(att.uvs), tri: Array.from(att.triangles) });
			}
		}
		frames.push({ clip, t, draws });
	}
}
fs.writeFileSync(outFile, JSON.stringify({ page: path.join(DIR, 'monkey.png'), size, frames }));
