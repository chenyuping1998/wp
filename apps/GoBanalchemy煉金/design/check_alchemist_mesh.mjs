// Parse the shipped rig in the game Spine runtime and sweep every animation —
// with `flutter` on track 1 and the PHYSICS STEPPED, the way Mascot.svelte
// plays it (2026-10-04: the accessory bones in design/alchemist_flow.py only
// move under physics + flutter, and the first version of this check stepped
// neither, so it could not see them at all).
//
// Fails on:
//   1. the body mesh at rest not sitting exactly on the art
//   2. ANY painted body/accessory triangle outside 50%..160% of its rest area.
//   3. a flowing accessory that does not visibly move (< 3px of tip travel
//      against where its parent carries it), or one that flails (> 40px)
//   4. shoulder/elbow/wrist and hip/knee/ankle segment lengths changing > 5%,
//      or an elbow exceeding the authored 35-degree rotation envelope.
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
if(json.skeleton.hash==='gb-alchemist-boom-v3'){
 await import('./check_alchemist_parts.mjs');
 process.exit(process.exitCode??0);
}
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
const FLOW_BONES = new Set(['coatL1', 'coatL2', 'coatR1', 'coatR2', 'flask', 'vials', 'goggles', 'banana', 'jaw', 'flapL', 'skirtR', 'crown', 'furL', 'furR', 'strap', 'furArmL', 'furArmR'].map((n) => data.findBone(n)?.index));
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
const segments = [['armL','armL_fore'],['armL_fore','armL_hand'],['armR','armR_fore'],['armR_fore','armR_hand'],['legL','legL_calf'],['legL_calf','legL_foot'],['legR','legR_calf'],['legR_calf','legR_foot']].map(([a,b])=>{
	const parent=skeleton.findBone(a),child=skeleton.findBone(b);
	return {a:parent,b:child,rest:Math.hypot(child.worldX-parent.worldX,child.worldY-parent.worldY)};
});
let segmentMin=Infinity,segmentMax=0,maxElbow=0;
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
const FLOW = ['coatL2', 'coatR2', 'flask', 'vials', 'goggles', 'banana', 'flapL', 'skirtR', 'crown', 'furL', 'furR', 'strap', 'furArmL', 'furArmR'];
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
		for(const s of segments){const ratio=Math.hypot(s.b.worldX-s.a.worldX,s.b.worldY-s.a.worldY)/s.rest;segmentMin=Math.min(segmentMin,ratio);segmentMax=Math.max(segmentMax,ratio);}
		for(const name of ['armL_fore','armR_fore']){const b=skeleton.findBone(name);maxElbow=Math.max(maxElbow,Math.abs(b.rotation-b.data.rotation));}
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
const floor = 0.5, ceil = 1.6;
if (!(lo >= floor) || hi > ceil) fail(`${line} — limits ${Math.round(floor * 100)}%..${Math.round(ceil * 100)}%`);
else console.log(`  ok ${line} — limits ${Math.round(floor * 100)}%..${Math.round(ceil * 100)}%`);
const body = `rest of the body ${Math.round(bodyLo * 100)}%..${Math.round(bodyHi * 100)}% (worst ${bodyAt})`;
if (bodyLo < 0.5 || bodyHi > 1.6) fail(`${body} — outside anatomical skin limits 50%..160%`);
else console.log(`  ok ${body} — anatomical skin limits 50%..160%`);
if(segmentMin<.95||segmentMax>1.05)fail(`limb lengths drift: ${segmentMin.toFixed(3)}..${segmentMax.toFixed(3)}`);
else console.log(`  ok anatomical chains: ${(segmentMin*100).toFixed(1)}%..${(segmentMax*100).toFixed(1)}% of setup length`);
if(maxElbow>35)fail(`elbow rotates ${maxElbow.toFixed(1)}deg beyond setup`);
for (const name of FLOW) {
	const t = travel[name];
	const l = `${name} tip travels ${t.toFixed(1)}px off its parent`;
	if (t < 3) fail(`${l} — does not visibly flow`);
	else if (t > 40) fail(`${l} — flails`);
	else console.log(`  ok ${l}`);
}
// THE BLINK (design/alchemist_blink.py): the painted lids are a mesh whose
// every vertex is a COPY of a body vertex, so through every action they must
// sit exactly where the face under them goes; and the blink loop shows them.
{
	const lidsSlot = skeleton.findSlot('lids');
	const blink = data.findAnimation('blink');
	if (!lidsSlot || !blink) fail('no lids slot / blink animation');
	else {
		const lidAtt = json.skins[0].attachments.lids.lids_closed;
		// match each lid vertex to the body vertex with the same weight entries
		const entries = (vs) => { const out = []; for (let i = 0; i < vs.length;) { const n = vs[i]; out.push(vs.slice(i, i + 1 + 4 * n).join(',')); i += 1 + 4 * n; } return out; };
		const bodyIndex = new Map(entries(att.vertices).map((e, i) => [e, i]));
		const pairs = entries(lidAtt.vertices).map((e) => bodyIndex.get(e));
		if (pairs.some((i) => i === undefined)) fail('a lid vertex is not a body vertex');
		const lidMesh = skeleton.getAttachment(lidsSlot.data.index, 'lids_closed');
		const lxy = new Float32Array(lidMesh.worldVerticesLength);
		let worst = 0, shown = 0;
		for (const anim of data.animations) {
			if (['blink', 'flutter'].includes(anim.name)) continue;
			skeleton.setToSetupPose();
			const st = new AnimationState(new AnimationStateData(data));
			st.setAnimation(0, anim.name, true);
			st.setAnimation(2, 'blink', true);
			for (let f = 0; f * 1 / 30 < Math.max(anim.duration, blink.duration); f++) {
				st.update(1 / 30); st.apply(skeleton); skeleton.update(1 / 30); skeleton.updateWorldTransform(Physics.update);
				if (lidsSlot.getAttachment()) shown++;
				mesh.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
				lidMesh.computeWorldVertices(lidsSlot, 0, lxy.length, lxy, 0, 2);
				pairs.forEach((b, v) => { worst = Math.max(worst, Math.hypot(lxy[v * 2] - xy[b * 2], lxy[v * 2 + 1] - xy[b * 2 + 1])); });
			}
		}
		if (worst > 0.01) fail(`lids drift ${worst.toFixed(3)}px off the face`);
		else if (!shown) fail('the blink never shows the lids');
		else console.log(`  ok blink: lids ride the face (${worst.toFixed(4)}px), shown on ${shown} frames, loop ${blink.duration}s`);
	}
}
console.log(`physics: ${skeleton.physicsConstraints.filter((p) => p.active).length}/${skeleton.physicsConstraints.length} constraints active`);
if (skeleton.physicsConstraints.some((p) => !p.active)) fail('a physics constraint is inactive (each needs its own order)');
if (failed) {
	console.log('check_alchemist_mesh: FAILED');
	process.exitCode = 1;
} else console.log(`check_alchemist_mesh: OK — ${data.animations.length} animations, ${mesh.worldVerticesLength / 2} vertices, rest error ${maxRestError.toFixed(3)}px`);
