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
if (!meshes.find(({ slot }) => slot.data.name === 'body')) throw new Error('Ninja body is not a weighted mesh');

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

// 1. the body at rest is the art
{
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
		meshes.forEach((m, k) => {
			const xy = world(m);
			const a = areas(m, xy);
			for (let i = 0; i < a.length; i++) {
				if (Math.abs(rest[k][i]) < 1e-6 || !inked[k][i]) continue;
				const r = a[i] / rest[k][i];
				if (r < worst[k].r) worst[k] = { r, at: `frame ${frame} triangle ${i}` };
			}
			if (animation.name === 'idle') {
				// the last vertex row of a chain mesh is its free end; take the max over all
				for (let v = 0; v < xy.length; v += 2)
					travel[k] = Math.max(travel[k], Math.hypot(xy[v] - restXY[k][v], xy[v + 1] - restXY[k][v + 1]));
			}
		});
	}
	const line = meshes.map((m, k) => `${m.slot.data.name} ${Math.round(worst[k].r * 100)}%`).join(', ');
	const bad = meshes.map((m, k) => [m, worst[k]]).filter(([, w]) => !(w.r > FOLD));
	if (bad.length) bad.forEach(([m, w]) => fail(`${animation.name}: ${m.slot.data.name} folds to ${Math.round(w.r * 100)}% at ${w.at}`));
	else console.log(`ok ${animation.name}: ${line}`);
}
for (const name of ['band_tails', 'sash_end', 'cord_end', 'charm']) {
	const k = meshes.findIndex((m) => m.slot.data.name === name);
	if (k < 0) { fail(`${name}: no mesh`); continue; }
	if (travel[k] < MIN_TIP_PX) fail(`${name}: moves only ${travel[k].toFixed(1)}px in the idle — not flowing`);
	else console.log(`ok ${name} travels ${travel[k].toFixed(1)}px in the idle`);
}
if (failures) {
	console.log(`check_ninja_mesh: ${failures} failure(s)`);
	process.exitCode = 1;
} else console.log('check_ninja_mesh: all checks passed');
