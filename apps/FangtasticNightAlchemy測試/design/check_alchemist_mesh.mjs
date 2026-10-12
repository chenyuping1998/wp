// Parse the shipped rig in the game Spine runtime and sweep every animation —
// with `flutter` on track 1 and the PHYSICS STEPPED, the way Mascot.svelte
// plays it (2026-10-04: the accessory bones in design/alchemist_flow.py only
// move under physics + flutter, and the first version of this check stepped
// neither, so it could not see them at all).
//
// Fails on:
//   1. the body mesh at rest not sitting exactly on the art
//   2. any ACCESSORY triangle (inked, with the flowing bones holding >= 20% of
//      its weight) folding under 50% or stretching past 1.6x of its rest area
//      in any animation — or, where the arm swings already pull the body past
//      that, folding/stretching worse than the body does (0.9x / 1.25x); and any inked triangle at all INVERTING. The body's
//      other triangles are only reported: Boom's arm swings (throw, chest beat)
//      already pulled the coarse first rig to 19% / 184% before any accessory
//      existed, and that is the arm weights' budget, not this rig's.
//   3. a flowing accessory that does not visibly move (< 3px of tip travel
//      against where its parent carries it), or one that flails (> 40px)
// Usage: node design/check_alchemist_mesh.mjs [toolsDir]   (pngjs lives there)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((name) => name.startsWith('@esotericsoftware+spine-core@'));
if (!coreDir) throw new Error('Spine runtime package missing');
const corePath = path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js');
const { TextureAtlas, AtlasAttachmentLoader, SkeletonJson, Skeleton, AnimationStateData, AnimationState, Physics } = await import(pathToFileURL(corePath).href);
const require = createRequire(path.join(process.argv[2] ?? 'E:/stake/tools/gen', 'noop.js'));
const { PNG } = require('pngjs');

const dir = path.join(root, 'static/assets/spines/goBananasMonkey');
const atlas = new TextureAtlas(fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8'));
const json = JSON.parse(fs.readFileSync(path.join(dir, 'monkey.json'), 'utf8'));
const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);
const skeleton = new Skeleton(data);
const state = new AnimationState(new AnimationStateData(data));
const slot = skeleton.findSlot('alchemy_body');
const mesh = slot.getAttachment();
if (!mesh?.triangles) throw new Error('Alchemist body is not a weighted mesh');
const att = json.skins[0].attachments.alchemy_body.alchemy_body;
const W = att.width, H = att.height;
const png = PNG.sync.read(fs.readFileSync(path.join(dir, 'alchemy_body.png')));
const alphaAt = (u, v) => {
	const x = Math.max(0, Math.min(png.width - 1, Math.round(u * png.width)));
	const y = Math.max(0, Math.min(png.height - 1, Math.round(v * png.height)));
	return png.data[(y * png.width + x) * 4 + 3];
};
const tris = mesh.triangles;
const inked = [];
for (let i = 0; i < tris.length; i += 3) {
	const vs = [tris[i], tris[i + 1], tris[i + 2]];
	const us = vs.map((v) => [att.uvs[v * 2], att.uvs[v * 2 + 1]]);
	us.push([(us[0][0] + us[1][0] + us[2][0]) / 3, (us[0][1] + us[1][1] + us[2][1]) / 3]);
	inked.push(us.some(([u, v]) => alphaAt(u, v) > 128));
}

// which triangles the flowing accessories own
const FLOW_BONES = new Set(['coatL1', 'coatL2', 'coatR1', 'coatR2', 'flask', 'vials', 'goggles', 'banana', 'jaw'].map((n) => data.findBone(n)?.index));
const flowShare = new Float64Array(mesh.worldVerticesLength / 2);
{
	const vs = att.vertices;
	for (let v = 0, i = 0; v < flowShare.length; v++) {
		const n = vs[i++];
		for (let k = 0; k < n; k++, i += 4) if (FLOW_BONES.has(vs[i])) flowShare[v] += vs[i + 3];
	}
}
const accessory = inked.map((ink, t) => ink && (flowShare[tris[t * 3]] + flowShare[tris[t * 3 + 1]] + flowShare[tris[t * 3 + 2]]) / 3 >= 0.2);

const xy = new Float32Array(mesh.worldVerticesLength);
const areas = () => {
	mesh.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
	const result = [];
	for (let i = 0; i < tris.length; i += 3) {
		const a = tris[i] * 2, b = tris[i + 1] * 2, c = tris[i + 2] * 2;
		result.push((xy[b] - xy[a]) * (xy[c + 1] - xy[a + 1]) - (xy[b + 1] - xy[a + 1]) * (xy[c] - xy[a]));
	}
	return result;
};
skeleton.setToSetupPose();
skeleton.updateWorldTransform(Physics.reset);
const rest = areas();
let maxRestError = 0;
for (let v = 0; v < mesh.worldVerticesLength / 2; v++) {
	const expectedX = W * att.uvs[v * 2] - W / 2;
	const expectedY = H - H * att.uvs[v * 2 + 1];
	maxRestError = Math.max(maxRestError, Math.hypot(xy[v * 2] - expectedX, xy[v * 2 + 1] - expectedY));
}
let failed = 0;
const fail = (m) => { console.log(`  !! ${m}`); failed++; };
if (maxRestError > 0.02) fail(`body mesh shifts the art by ${maxRestError}px at rest`);

// where a triangle is, in art px, for the report
const at = (t) => {
	const v = tris[t * 3];
	return `(${Math.round(att.uvs[v * 2] * W)},${Math.round(att.uvs[v * 2 + 1] * H)})`;
};

// accessory tips: travel of the tip against where the PARENT carries it rigidly
const FLOW = ['coatL2', 'coatR2', 'flask', 'vials', 'goggles', 'banana'];
const tipOf = (b) => [b.worldX + b.a * b.data.length, b.worldY + b.c * b.data.length];
const carried = (b) => {
	// the tip if the bone kept its setup rotation relative to its parent
	const p = b.parent, d = b.data;
	const r = (d.rotation * Math.PI) / 180;
	const lx = d.x + Math.cos(r) * d.length, ly = d.y + Math.sin(r) * d.length;
	// chains: carry from the chain's root
	return [p.worldX + p.a * lx + p.b * ly, p.worldY + p.c * lx + p.d * ly];
};
const travel = Object.fromEntries(FLOW.map((n) => [n, 0]));

let lo = Infinity, hi = 0, loAt = '', hiAt = '';
let bodyLo = Infinity, bodyHi = 0, bodyAt = '';
const STEP = 1 / 60;
for (const animation of data.animations) {
	if (animation.name === 'flutter') continue;
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform(Physics.reset);
	state.clearTracks();
	state.setAnimation(0, animation.name, animation.name === 'idle');
	state.setAnimation(1, 'flutter', true);
	const frames = Math.max(90, Math.ceil(animation.duration / STEP) + 60);
	for (let frame = 0; frame <= frames; frame++) {
		state.update(STEP);
		state.apply(skeleton);
		skeleton.update(STEP);
		skeleton.updateWorldTransform(Physics.update);
		const posed = areas();
		for (let i = 0; i < posed.length; i++) {
			if (!inked[i]) continue;
			const ratio = posed[i] / rest[i];
			if (!accessory[i]) {
				if (ratio < bodyLo) { bodyLo = ratio; bodyAt = `${animation.name} frame ${frame} at ${at(i)}`; }
				bodyHi = Math.max(bodyHi, ratio);
				continue;
			}
			if (ratio < lo) { lo = ratio; loAt = `${animation.name} frame ${frame} at ${at(i)}`; }
			if (ratio > hi) { hi = ratio; hiAt = `${animation.name} frame ${frame} at ${at(i)}`; }
		}
		for (const name of FLOW) {
			const b = skeleton.findBone(name);
			if (!b) continue;
			// a two-link chain is judged against its root's parent
			const base = name.endsWith('2') ? skeleton.findBone(name.slice(0, -1) + '1') : b;
			const [tx, ty] = tipOf(b);
			let cx, cy;
			if (base !== b) {
				const [bx, by] = carried(base);
				const r = (b.data.rotation * Math.PI) / 180;
				// root carried rigidly, then the tip link's setup offset from it
				const p = base.parent;
				const rr = ((base.data.rotation) * Math.PI) / 180;
				const ux = Math.cos(rr), uy = Math.sin(rr);
				const lx = base.data.x + ux * base.data.length + (Math.cos(rr + r) * b.data.length);
				const ly = base.data.y + uy * base.data.length + (Math.sin(rr + r) * b.data.length);
				cx = p.worldX + p.a * lx + p.b * ly;
				cy = p.worldY + p.c * lx + p.d * ly;
				void bx; void by;
			} else [cx, cy] = carried(b);
			travel[name] = Math.max(travel[name], Math.hypot(tx - cx, ty - cy));
		}
	}
}
const line = `accessory triangles (${accessory.filter(Boolean).length}) ${Math.round(lo * 100)}%..${Math.round(hi * 100)}% (fold ${loAt}; stretch ${hiAt})`;
// the accessories may never be the worst thing on the figure: 50% / 1.6x, or
// no worse than the arm swings already leave the body (see the header)
const floor = Math.min(0.5, 0.9 * bodyLo), ceil = Math.max(1.6, 1.25 * bodyHi);
if (!(lo >= floor) || hi > ceil) fail(`${line} — limits ${Math.round(floor * 100)}%..${Math.round(ceil * 100)}%`);
else console.log(`  ok ${line} — limits ${Math.round(floor * 100)}%..${Math.round(ceil * 100)}%`);
const body = `rest of the body ${Math.round(bodyLo * 100)}%..${Math.round(bodyHi * 100)}% (worst ${bodyAt})`;
if (!(bodyLo > 0)) fail(`${body} — a triangle inverts`);
else console.log(`  -- ${body} (reported, see header)`);
for (const name of FLOW) {
	const t = travel[name];
	const l = `${name} tip travels ${t.toFixed(1)}px off its parent`;
	if (t < 3) fail(`${l} — does not visibly flow`);
	else if (t > 40) fail(`${l} — flails`);
	else console.log(`  ok ${l}`);
}
console.log(`physics: ${skeleton.physicsConstraints.filter((p) => p.active).length}/${skeleton.physicsConstraints.length} constraints active`);
if (skeleton.physicsConstraints.some((p) => !p.active)) fail('a physics constraint is inactive (each needs its own order)');
if (failed) {
	console.log('check_alchemist_mesh: FAILED');
	process.exitCode = 1;
} else console.log(`check_alchemist_mesh: OK — ${data.animations.length} animations, ${mesh.worldVerticesLength / 2} vertices, rest error ${maxRestError.toFixed(3)}px`);
