// Parse the shipped rig in the game Spine runtime and sweep every animation.
// A folded triangle means the weights need adjustment.
//
// 2026-10-04: every MESH attachment is swept, not only the body — the headband
// tails, sash end, cord and charm (design/ninja_flow.py) — and the sweep plays
// what the game plays: the animation on track 0 with the `flutter` loop on
// track 1 (Mascot.svelte), stepping physics at 60fps, because physics can tear
// a mesh even when every keyed pose looks fine (mesh-cast-rig, "Spine physics").
//
//   1. the body mesh sits exactly on the source art at rest
//   2. no triangle of any mesh inverts, or falls under FOLD of its rest area,
//      in any animation, at any frame
//   3. every physics constraint has its own order (only the first runs otherwise)
//   4. the free ends actually move: the tail tips travel >= MIN_TIP_PX in flutter
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

const FOLD = 0.4;

// INKED triangles only: a chain mesh is a grid over its box, and the air
// between two tails folds harmlessly when they swing apart. The atlas page is
// read with pngjs (E:/stake/tools/gen) and each triangle is sampled at its
// corners and centroid through the mesh's own atlas UVs.
const { createRequire } = await import('node:module');
const requireTools = createRequire('E:/stake/tools/gen/noop.js');
const { PNG } = requireTools('pngjs');
const page = PNG.sync.read(fs.readFileSync(path.join(dir, 'ninja.png')));
const alphaAt = (u, v) => {
	const x = Math.max(0, Math.min(page.width - 1, Math.round(u * page.width)));
	const y = Math.max(0, Math.min(page.height - 1, Math.round(v * page.height)));
	return page.data[(y * page.width + x) * 4 + 3];
};
const MIN_TIP_PX = 12;
let failures = 0;
const fail = (m) => { console.log(`!! ${m}`); failures++; };

const meshes = skeleton.slots
	.map((slot) => ({ slot, mesh: slot.getAttachment() }))
	.filter(({ mesh }) => mesh?.triangles);
const boomRig = JSON.parse(fs.readFileSync(path.join(root, '../GoBoomana/static/assets/spines/goBananasMonkey/monkey.json'), 'utf8'));
if (JSON.stringify(json.bones.slice(0, boomRig.bones.length)) !== JSON.stringify(boomRig.bones)) throw new Error('Ninja reskin changed Boom body joints or setup transforms');
if (!meshes.length) throw new Error('Boom weighted body parts are missing');
const shoulder = skeleton.findSlot('shoulder_shuriken');
// on its own spring bones since 2026-10-23 (design/spine43/build_ninja_acting.mjs), still under armL
const underArmL = (bone) => !!bone && (bone.data.name === 'armL' || underArmL(bone.parent));
if (!shoulder?.getAttachment() || !underArmL(shoulder.bone)) throw new Error('Shuriken must be embedded in the left shoulder');
if (skeleton.findSlot('dynamite')?.getAttachment()) throw new Error('Old hand-held shuriken is still visible');
const order = json.slots.map((slot) => slot.name);
if (order.indexOf('torso_0_trunk') < Math.max(order.indexOf('left_leg_0_thigh'), order.indexOf('right_leg_0_thigh'))) throw new Error('Trouser layers cover the sash hem');
for (const name of ['head_5_decoration', 'mouth_grip']) {
	if (skeleton.findSlot(name)?.bone.data.name !== 'head') throw new Error(`${name} must stay registered to the new face`);
}
if (order.indexOf('mouth_grip') < order.indexOf('head_5_decoration')) throw new Error('Banana is painted over the biting lip');
console.log(`ok ${boomRig.bones.length} Boom body bones unchanged; ${json.bones.length - boomRig.bones.length} cloth bones; shoulder shuriken and banana bite registered`);
const head = json.skins[0].attachments.head_2_face.head_2_face;
if (head.width > 280 || head.height > 280) throw new Error('Head exceeds Boom proportion envelope');
const headArt = PNG.sync.read(fs.readFileSync(path.join(root, 'design/source/ninja_reskin/head_2_face.png')));
if (Math.abs(head.width / head.height - headArt.width / headArt.height) > 0.001) throw new Error('Head attachment stretches the source artwork');
console.log(`ok compact head ${head.width}x${head.height}; uniform artwork scale`);
for (const name of ['slash', 'slash_alt', 'split_finale', 'scatter_slash', 'dance']) {
	if (!data.findAnimation(name)) throw new Error(`Missing authored action ${name}`);
}
if (JSON.stringify(json.animations.slash) === JSON.stringify(json.animations.throwit)) throw new Error('Split action is still a copy of the throw');

const world = ({ slot, mesh }) => {
	const xy = new Float32Array(mesh.worldVerticesLength);
	mesh.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
	return xy;
};
const areas = (m, xy) => {
	const out = [];
	for (let i = 0; i < m.mesh.triangles.length; i += 3) {
		const a = m.mesh.triangles[i] * 2, b = m.mesh.triangles[i + 1] * 2, c = m.mesh.triangles[i + 2] * 2;
		out.push((xy[b] - xy[a]) * (xy[c + 1] - xy[a + 1]) - (xy[b + 1] - xy[a + 1]) * (xy[c] - xy[a]));
	}
	return out;
};

skeleton.setToSetupPose();
skeleton.updateWorldTransform(Physics.update);
const rest = meshes.map((m) => areas(m, world(m)));
const inked = meshes.map(({ mesh }) => {
	const uv = mesh.uvs;
	const out = [];
	for (let i = 0; i < mesh.triangles.length; i += 3) {
		const vs = [mesh.triangles[i], mesh.triangles[i + 1], mesh.triangles[i + 2]];
		const pts = vs.map((v) => [uv[v * 2], uv[v * 2 + 1]]);
		pts.push([(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3]);
		out.push(pts.some(([u, v]) => alphaAt(u, v) > 40));
	}
	return out;
});
const restXY = meshes.map((m) => world(m));
const clothIndex = meshes.findIndex(({ slot }) => slot.data.name === 'torso_0_trunk');
if (clothIndex < 0) throw new Error('Jacket hem and sash have no weighted mesh');
const cloth = meshes[clothIndex];
const uv = cloth.mesh.regionUVs;
let restError = 0;
for (let i = 0; i < uv.length; i += 2) {
	restError = Math.max(restError, Math.hypot(restXY[clothIndex][i] - (69 + 361 * uv[i] - 280), restXY[clothIndex][i + 1] - (884 - 146 - 441 * uv[i + 1])));
}
if (restError > 0.02) fail(`cloth mesh shifts source art by ${restError}px`);
else console.log(`ok cloth rest error ${restError.toFixed(5)}px`);
const relativeCloth = (xy) => {
	const torso = skeleton.findBone('torso');
	const out = [];
	for (let i = 0; i < xy.length; i += 2) {
		const p = torso.worldToLocal({ x: xy[i], y: xy[i + 1] });
		out.push(p.x, p.y);
	}
	return out;
};
const clothRest = relativeCloth(restXY[clothIndex]);
let clothTravel = 0;
const strapManifest = JSON.parse(fs.readFileSync(path.join(root, 'design/source/ninja_reskin/strap_manifest.json'), 'utf8'));
// A tie cut into its own mesh (design/cut_ninja_straps.py, listed in
// skeleton.strapsCut) is measured in that mesh rather than in the piece it was
// painted on — the piece no longer carries its weights at all.
const strapsCut = new Set(json.skeleton.strapsCut ?? []);
const straps = strapManifest.map((item) => {
	const slotName = strapsCut.has(item.name) ? `${item.name}_cut` : item.slot;
	const k = meshes.findIndex(({ slot }) => slot.data.name === slotName);
	if (k < 0) throw new Error(`${item.name}: strap is not skinned`);
	const attachment = json.skins[0].attachments[slotName][slotName];
	const owned = [], values = attachment.vertices;
	const boneIndices = [item.name, `${item.name}_tip`].map((name) => json.bones.findIndex((bone) => bone.name === name));
	let cursor = 0;
	for (let v = 0; v < attachment.uvs.length / 2; v++) {
		const count = values[cursor++];
		let weight = 0;
		for (let b = 0; b < count; b++) {
			if (boneIndices.includes(values[cursor])) weight += values[cursor + 3];
			cursor += 4;
		}
		if (weight > .035 && alphaAt(meshes[k].mesh.uvs[v * 2], meshes[k].mesh.uvs[v * 2 + 1]) > 64) owned.push(v);
	}
	if (owned.length < 2) throw new Error(`${item.name}: has no visible painted free end`);
	const parent = skeleton.findBone(item.parent);
	const local = (xy) => owned.map((v) => parent.worldToLocal({ x: xy[v * 2], y: xy[v * 2 + 1] }));
	return { ...item, k, owned, local, rest: local(restXY[k]), travel: 0 };
});
const sourceParts = JSON.parse(fs.readFileSync(path.join(root, 'design/source/ninja_reskin/layers.json'), 'utf8')).layers;
for (let k = 0; k < meshes.length; k++) {
	const part = sourceParts.find((part) => part.name === meshes[k].slot.data.name);
	if (!part) continue;
	const uv = meshes[k].mesh.regionUVs;
	let error = 0;
	for (let i = 0; i < uv.length; i += 2)
		error = Math.max(error, Math.hypot(restXY[k][i] - (part.x + part.w * uv[i] - 280), restXY[k][i + 1] - (884 - part.y - part.h * uv[i + 1])));
	if (error > .02) fail(`${part.name}: new tie mesh shifts the original drawing ${error.toFixed(3)}px`);
}

// 1. the body at rest is the art

if (meshes.some(({ slot }) => slot.data.name === 'body')) {
	const body = meshes.find(({ slot }) => slot.data.name === 'body');
	const xy = world(body);
	const uvs = json.skins[0].attachments.body.body.uvs;
	let err = 0;
	for (let v = 0; v < xy.length / 2; v++) {
		const ex = 82 + 877 * uvs[v * 2] - 512;
		const ey = 1510 - (12 + 1496 * uvs[v * 2 + 1]);
		err = Math.max(err, Math.hypot(xy[v * 2] - ex, xy[v * 2 + 1] - ey));
	}
	if (err > 0.02) fail(`body mesh shifts source art by ${err}px at rest`);
	else console.log(`ok body rest error ${err.toFixed(3)}px`);
}

// 3. physics orders
{
	const orders = (json.physics ?? []).map((p) => p.order ?? 0);
	if (new Set(orders).size !== orders.length) fail(`physics constraints share an order: ${orders.join(',')}`);
	else console.log(`ok ${orders.length} physics constraints, each its own order`);
}

// 2 + 4. sweep
const hasFlutter = data.animations.some((a) => a.name === 'flutter');
const travel = meshes.map(() => 0);
for (const animation of data.animations) {
	if (animation.name === 'flutter') continue;
	skeleton.setToSetupPose();
	state.clearTracks();
	state.setAnimation(0, animation.name, false);
	if (hasFlutter) state.setAnimation(1, 'flutter', true);
	skeleton.updateWorldTransform(Physics.reset);
	const frames = Math.ceil((animation.duration + 1) * 60);
	const worst = meshes.map(() => ({ r: Infinity, at: '' }));
	for (let frame = 0; frame <= frames; frame++) {
		state.update(1 / 60);
		state.apply(skeleton);
		skeleton.update(1 / 60);
		skeleton.updateWorldTransform(Physics.update);
		if (!shoulder.getAttachment()) fail(`${animation.name}: shoulder shuriken disappears`);
		meshes.forEach((m, k) => {
			const xy = world(m);
			const a = areas(m, xy);
			for (let i = 0; i < a.length; i++) {
				if (Math.abs(rest[k][i]) < 1e-6 || !inked[k][i]) continue;
				const r = a[i] / rest[k][i];
				if (r < worst[k].r) worst[k] = { r, at: `frame ${frame} triangle ${i}` };
			}
			if (animation.name === 'idle') {
				for (const strap of straps.filter((strap) => strap.k === k)) {
					const points = strap.local(xy);
					for (let i = 0; i < points.length; i++)
						strap.travel = Math.max(strap.travel, Math.hypot(points[i].x - strap.rest[i].x, points[i].y - strap.rest[i].y));
				}
				// the last vertex row of a chain mesh is its free end; take the max over all
				for (let v = 0; v < xy.length; v += 2)
					travel[k] = Math.max(travel[k], Math.hypot(xy[v] - restXY[k][v], xy[v + 1] - restXY[k][v + 1]));
				if (k === clothIndex) {
					const local = relativeCloth(xy);
					for (let v = 0; v < local.length; v += 2) if (uv[v + 1] > 0.8)
						clothTravel = Math.max(clothTravel, Math.hypot(local[v] - clothRest[v], local[v + 1] - clothRest[v + 1]));
				}
			}
		});
	}
	const line = meshes.map((m, k) => `${m.slot.data.name} ${Math.round(worst[k].r * 100)}%`).join(', ');
	const bad = meshes.map((m, k) => [m, worst[k]]).filter(([, w]) => !(w.r > FOLD));
	if (bad.length) bad.forEach(([m, w]) => fail(`${animation.name}: ${m.slot.data.name} folds to ${Math.round(w.r * 100)}% at ${w.at}`));
	else console.log(`ok ${animation.name}: ${line}`);
}
if (clothTravel < 3) fail(`cloth free ends move only ${clothTravel.toFixed(2)}px relative to the torso`);
else console.log(`ok cloth free ends move ${clothTravel.toFixed(2)}px relative to torso`);
for (const strap of straps) {
	if (strap.travel < 1.25) fail(`${strap.name}: painted free end moves only ${strap.travel.toFixed(2)}px`);
	else console.log(`ok ${strap.name}: ${strap.owned.length} painted vertices, ${strap.travel.toFixed(2)}px independent flow`);
}
for (const name of ['band_tails', 'sash_end', 'cord_end', 'charm'].filter((name) => json.slots.some((slot) => slot.name === name))) {
	const k = meshes.findIndex((m) => m.slot.data.name === name);
	if (k < 0) { fail(`${name}: no mesh`); continue; }
	if (travel[k] < MIN_TIP_PX) fail(`${name}: moves only ${travel[k].toFixed(1)}px in the idle — not flowing`);
	else console.log(`ok ${name} travels ${travel[k].toFixed(1)}px in the idle`);
}
// Exercise the same mixes as Mascot.svelte, including a new cut interrupting
// recovery and a finale played at Turbo speed. Isolated clips miss these.
for (const [label, events, duration] of [
	['cut-to-idle', [[0, 'idle', .18, 1], [.7, 'slash', .055, 1], [1.64, 'idle', .24, 1]], 2.5],
	['repeated-cut', [[0, 'idle', .18, 1], [.5, 'slash', .055, 1], [.7, 'slash_alt', .055, 1], [1.64, 'idle', .24, 1]], 2.5],
	['turbo-finale', [[0, 'idle', .18, 1], [.5, 'split_finale', .055, 1 / .6], [1.208, 'idle', .24, 1]], 2],
	['cheer-to-dance', [[0, 'cheer', .18, 1], [2.05, 'dance', .18, 1]], 3.5],
	['watch-to-cut', [[0, 'watch', .18, 1], [.8, 'slash', .055, 1], [1.74, 'idle', .24, 1]], 2.6],
	['scatter-to-cheer', [[0, 'scatter_slash', .055, 1], [1.62, 'cheer', .18, 1]], 3.5],
]) {
	skeleton.setToSetupPose();
	state.clearTracks();
	state.setAnimation(1, 'flutter', true);
	skeleton.updateWorldTransform(Physics.reset);
	let event = 0, worst = 1, where = '';
	for (let frame = 0; frame < duration * 120; frame++) {
		const t = frame / 120;
		while (event < events.length && t + 1e-6 >= events[event][0]) {
			const [, name, mix, speed] = events[event++];
			const track = state.setAnimation(0, name, name === 'idle' || name === 'dance');
			track.mixDuration = mix;
			track.timeScale = speed;
		}
		state.update(1 / 120); state.apply(skeleton); skeleton.update(1 / 120);
		skeleton.updateWorldTransform(Physics.update);
		meshes.forEach((m, k) => {
			const a = areas(m, world(m));
			for (let i = 0; i < a.length; i++) if (inked[k][i] && Math.abs(rest[k][i]) > 1e-6)
				if (a[i] / rest[k][i] < worst) { worst = a[i] / rest[k][i]; where = `${m.slot.data.name} at ${t.toFixed(2)}s`; }
		});
	}
	if (!(worst > FOLD)) fail(`${label}: mixed animation folds to ${Math.round(worst * 100)}% (${where})`);
	else console.log(`ok ${label} at 120fps: worst area ${Math.round(worst * 100)}%`);
}
if (failures) {
	console.log(`check_ninja_mesh: ${failures} failure(s)`);
	process.exitCode = 1;
} else console.log('check_ninja_mesh: all checks passed');
