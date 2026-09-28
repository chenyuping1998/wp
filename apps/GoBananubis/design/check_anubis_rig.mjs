// The gate for the mascot's weighted meshes (design/generate_anubis_spine.mjs).
//
// Runs the REAL Spine runtime — spine-core, the same one spine-pixi-v8 renders
// with — including the physics constraints, which nothing offline can predict:
// every animation on track 0 with `flutter` looping on track 1, the way
// Mascot.svelte plays them, stepped at 60fps through the clip and a second of
// settling after it. Every visible triangle of every mesh (its centre lands on
// ink in the atlas) must keep its sign, stay >= 50% of its setup area and grow
// <= 1.6x. Boat's captain needed exactly this: a physics swing crushed his
// lapel corner to 31% with every keyed pose looking fine.
//
// Usage: node design/check_anubis_rig.mjs [toolsDir]   (pngjs; default E:/stake/tools/gen)

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const args = process.argv.slice(2);
const noFlutter = args.includes('--no-flutter');
const toolsDir = args.find((a) => !a.startsWith('--')) ?? 'E:/stake/tools/gen';
const { PNG } = createRequire(path.join(toolsDir, 'noop.js'))('pngjs');
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// spine-core as the game gets it: through pixi-svelte -> spine-pixi-v8
const fromPixiSvelte = createRequire(path.join(appRoot, '../../packages/pixi-svelte/package.json'));
const spinePixi = fs.realpathSync(path.dirname(fromPixiSvelte.resolve('@esotericsoftware/spine-pixi-v8')));
const core = await import(pathToFileURL(createRequire(path.join(spinePixi, 'x.js')).resolve('@esotericsoftware/spine-core')).href);

const DIR = path.join(appRoot, 'static/assets/spines/goBananubisAnubis');
const atlasText = fs.readFileSync(path.join(DIR, 'anubis.atlas'), 'utf8');
const page = PNG.sync.read(fs.readFileSync(path.join(DIR, 'anubis.png')));
const atlas = new core.TextureAtlas(atlasText);
for (const p of atlas.pages)
	p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: page.width, height: page.height }) });
const raw = JSON.parse(fs.readFileSync(path.join(DIR, 'anubis.json'), 'utf8'));
const data = new core.SkeletonJson(new core.AtlasAttachmentLoader(atlas)).readSkeletonData(raw);

// the atlas bounds of each region, to test a triangle's centre for ink
const bounds = {};
{
	let name = null;
	for (const line of atlasText.split(/\r?\n/)) {
		if (line && !line.includes(':')) name = line.trim();
		else if (name && line.startsWith('bounds:')) {
			const [x, y, w, h] = line.slice(7).split(',').map(Number);
			bounds[name] = { x, y, w, h };
		}
	}
}
const inked = (region, u, v) => {
	const b = bounds[region];
	const x = Math.min(b.x + b.w - 1, Math.floor(b.x + u * b.w));
	const y = Math.min(b.y + b.h - 1, Math.floor(b.y + v * b.h));
	return page.data[(y * page.width + x) * 4 + 3] > 128;
};

const MESHES = Object.entries(raw.skins[0].attachments)
	.filter(([, a]) => Object.values(a)[0].type === 'mesh')
	.map(([slot]) => slot);

const skeleton = new core.Skeleton(data);
const meshInfo = MESHES.map((slotName) => {
	const slot = skeleton.findSlot(slotName);
	const att = slot.getAttachment();
	const tris = att.triangles;
	const uv = raw.skins[0].attachments[slotName][slotName].uvs;
	const keep = [];
	for (let t = 0; t < tris.length; t += 3) {
		const [a, b, c] = [tris[t], tris[t + 1], tris[t + 2]];
		const u = (uv[a * 2] + uv[b * 2] + uv[c * 2]) / 3, v = (uv[a * 2 + 1] + uv[b * 2 + 1] + uv[c * 2 + 1]) / 3;
		if (inked(slotName, u, v)) keep.push(t);
	}
	return { slotName, att, tris, keep };
});

const worldOf = (info, s) => {
	const slot = s.findSlot(info.slotName);
	const out = new Float32Array(info.att.worldVerticesLength);
	info.att.computeWorldVertices(slot, 0, out.length, out, 0, 2);
	return out;
};
const area = (w, tris, t) => {
	const [a, b, c] = [tris[t], tris[t + 1], tris[t + 2]];
	return (w[b * 2] - w[a * 2]) * (w[c * 2 + 1] - w[a * 2 + 1]) - (w[b * 2 + 1] - w[a * 2 + 1]) * (w[c * 2] - w[a * 2]);
};

// setup-pose areas
skeleton.setToSetupPose();
skeleton.updateWorldTransform(core.Physics.pose);
const restArea = meshInfo.map((info) => {
	const w = worldOf(info, skeleton);
	return Float64Array.from({ length: info.tris.length / 3 }, (_, i) => area(w, info.tris, i * 3));
});

let failures = 0;
const anims = data.animations.map((a) => a.name).filter((n) => n !== 'flutter' && !n.startsWith('sweep'));
for (const name of anims) {
	const s = new core.Skeleton(data);
	const state = new core.AnimationState(new core.AnimationStateData(data));
	state.setAnimation(0, name, name === 'idle');
	if (!noFlutter) state.setAnimation(1, 'flutter', true);
	s.setToSetupPose();
	s.updateWorldTransform(core.Physics.reset);
	const dur = data.findAnimation(name).duration + 1;
	const dt = 1 / 60;
	let lo = Infinity, hi = -Infinity, flips = 0, worst = '';
	for (let t = 0; t <= dur; t += dt) {
		state.update(dt);
		state.apply(s);
		s.update(dt);
		s.updateWorldTransform(core.Physics.update);
		meshInfo.forEach((info, m) => {
			const w = worldOf(info, s);
			for (const tri of info.keep) {
				const r = area(w, info.tris, tri) / restArea[m][tri / 3];
				if (r <= 0) flips++;
				if (r < lo || r > hi) {
					// name the triangle by where it sits in the PSD piece (uv x size)
					const uvs = raw.skins[0].attachments[info.slotName][info.slotName].uvs;
					const a = info.tris[tri];
					const layer = bounds[info.slotName];
					worst = `${info.slotName} uv(${uvs[a * 2].toFixed(2)},${uvs[a * 2 + 1].toFixed(2)}) ${(r * 100).toFixed(0)}% at ${t.toFixed(2)}s`;
					void layer;
				}
				if (r < lo) lo = r;
				if (r > hi) hi = r;
			}
		});
	}
	const line = `${name.padEnd(10)} area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions (worst ${worst})`;
	if (flips || lo < 0.5 || hi > 1.6) {
		console.log(`  !! ${line}`);
		failures++;
	} else console.log(`  ok ${line}`);
}
console.log(`meshes: ${meshInfo.map((i) => `${i.slotName} (${i.keep.length} inked tris)`).join(', ')}`);
if (failures) {
	console.log(`check_anubis_rig: ${failures} animation(s) FAILED`);
	process.exit(1);
}
console.log('check_anubis_rig: all animations pass');
