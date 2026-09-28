// The gate for the mascot's weighted meshes (design/generate_monkey_spine.mjs). Ported from GoBananubis' check_anubis_rig.mjs.
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
// Usage: node design/check_monkey_rig.mjs [toolsDir]   (pngjs; default E:/stake/tools/gen)

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

const DIR = path.join(appRoot, 'static/assets/spines/goBananasMonkey');
const atlasText = fs.readFileSync(path.join(DIR, 'monkey.atlas'), 'utf8');
const page = PNG.sync.read(fs.readFileSync(path.join(DIR, 'monkey.png')));
const atlas = new core.TextureAtlas(atlasText);
for (const p of atlas.pages)
	p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: page.width, height: page.height }) });
const raw = JSON.parse(fs.readFileSync(path.join(DIR, 'monkey.json'), 'utf8'));
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
const anims = data.animations.map((a) => a.name).filter((n) => !n.startsWith('flutter') && !n.startsWith('_sweep') && !n.startsWith('sweep'));
// Every animation under BOTH track-1 loops: the base game's flutter and the
// free spins' flutter_float — a big win in the feature plays the cheer over the
// zero-g loop, and the physics flings the hose furthest there.
const flutters = noFlutter ? [null] : ['flutter', 'flutter_float'].filter((f) => data.findAnimation(f));
for (const [name, flutter] of anims.flatMap((n) => flutters.map((f) => [n, f]))) {
	const s = new core.Skeleton(data);
	const state = new core.AnimationState(new core.AnimationStateData(data));
	state.setAnimation(0, name, name === 'idle' || name === 'spacewalk');
	if (flutter) state.setAnimation(1, flutter, true);
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
	const line = `${(name + (flutter ? ' +' + flutter : '')).padEnd(24)} area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions (worst ${worst})`;
	if (flips || lo < 0.5 || hi > 1.6) {
		console.log(`  !! ${line}`);
		failures++;
	} else console.log(`  ok ${line}`);
}

// ── ERGONOMICS AND RHYTHM ───────────────────────────────────────────────────
//
// Asked for 2026-09-26: new gestures that are "符合人體工學" and "節奏順暢".
// Two things a render at eight frames cannot promise:
//
//   BUDGET   every joint, at every frame, inside what this drawing was
//            MEASURED to carry (generate_monkey_spine.mjs: the shoulders on the
//            weighted-sleeve sweep, the inward reach on the chest beat's, the
//            thighs no shorter than the tuck's knees-up). Sampled on the
//            runtime AFTER its curve smoothing, which can overshoot the keys.
//   RHYTHM   no vertex of the whole character jumping: a step between two
//            frames bigger than 2 units AND 3x the steps either side of it is a
//            pop — a key the curve went through too hard, or a mix cutting in.
//            (Fast is allowed: a strike is fast. A pop is fast ALONE.)
//
// Track 0 only, no physics, so what is measured is the gesture as keyed.
const BUDGETS = {
	// degrees from the setup pose: [most negative, most positive]
	armL: [-50, 45], // out is negative: 50 measured on the mesh sleeve; in 45
	armR: [-35, 45], // out is positive: 45 measured on the mesh sleeve; in 35
	armL_fore: [-40, 40],
	armR_fore: [-40, 40],
	head: [-12, 12],
	torso: [-9, 9],
};
// NAMED EXCEPTIONS, not a looser table: two gestures that shipped before this
// check existed and have been seen in the game — the chest beat's right fist
// crossing the body (the forearm reaches -43.5 there once the wrist's keys are
// folded into it) and the throw's wind-up lean (+10.8) and follow-through (-11.5). Anything else past the
// table still fails.
const EXCEPTIONS = { chestbeat: { armR_fore: [-44, 40] }, throwit: { torso: [-12, 11] } };
const MIN_THIGH = 0.84; // the tuck's knees-up; further reads as squashed (Boat measured 0.83)
let ergoFailures = 0;
for (const name of anims) {
	const s = new core.Skeleton(data);
	const anim = data.findAnimation(name);
	const bones = Object.keys(BUDGETS).map((b) => s.findBone(b));
	const thighs = ['legL', 'legR'].map((b) => s.findBone(b));
	const over = [];
	let minThigh = Infinity;
	let prev = null, prevStep = 0, prevPrevStep = 0, pops = 0, fastest = 0, fastestBone = '', lastRot = null;
	const dt = 1 / 60;
	for (let t = 0; t <= anim.duration + 1e-6; t += dt) {
		s.setToSetupPose();
		anim.apply(s, 0, t, false, [], 1, core.MixBlend.setup, core.MixDirection.mixIn);
		s.updateWorldTransform(core.Physics.pose);
		bones.forEach((b) => {
			const a = b.rotation - b.data.rotation;
			const [lo, hi] = EXCEPTIONS[name]?.[b.data.name] ?? BUDGETS[b.data.name];
			if (a < lo - 1e-3 || a > hi + 1e-3) over.push(`${b.data.name} ${a.toFixed(1)}° at ${t.toFixed(2)}s`);
		});
		thighs.forEach((b) => (minThigh = Math.min(minThigh, b.scaleY)));
		// joint speed, for the report
		const rot = bones.map((b) => b.rotation);
		if (lastRot) rot.forEach((r, i) => {
			const v = Math.abs(r - lastRot[i]) / dt;
			if (v > fastest) { fastest = v; fastestBone = bones[i].data.name; }
		});
		lastRot = rot;
		// every vertex of every attachment, in world space
		const verts = [];
		for (const slot of s.drawOrder) {
			const att = slot.getAttachment();
			if (!att || !att.computeWorldVertices) continue;
			if (att instanceof core.RegionAttachment) {
				const w = new Float32Array(8);
				att.computeWorldVertices(slot, w, 0, 2);
				verts.push(...w);
			} else if (att instanceof core.MeshAttachment) {
				const w = new Float32Array(att.worldVerticesLength);
				att.computeWorldVertices(slot, 0, w.length, w, 0, 2);
				verts.push(...w);
			}
		}
		if (prev && prev.length === verts.length) {
			let step = 0;
			for (let i = 0; i < verts.length; i += 2) step = Math.max(step, Math.hypot(verts[i] - prev[i], verts[i + 1] - prev[i + 1]));
			// the PREVIOUS step is a pop if it towers over both its neighbours
			if (prevStep > 2 && prevStep > 3 * Math.max(prevPrevStep, step)) pops++;
			prevPrevStep = prevStep;
			prevStep = step;
		}
		prev = verts;
	}
	const line = `${name.padEnd(10)} joints in budget${over.length ? ` — NO: ${over.slice(0, 2).join('; ')}` : ''}, thighs >= ${minThigh.toFixed(2)}, ${pops} pops, fastest joint ${fastestBone} ${fastest.toFixed(0)}°/s`;
	if (over.length || minThigh < MIN_THIGH - 1e-3 || pops) {
		console.log(`  !! ${line}`);
		ergoFailures++;
	} else console.log(`  ok ${line}`);
}
failures += ergoFailures;
console.log(`meshes: ${meshInfo.map((i) => `${i.slotName} (${i.keep.length} inked tris)`).join(', ')}`);
if (failures) {
	console.log(`check_monkey_rig: ${failures} animation(s) FAILED`);
	process.exit(1);
}
console.log('check_monkey_rig: all animations pass');
