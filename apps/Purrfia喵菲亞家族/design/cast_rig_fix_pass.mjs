// Two fixes on Don Whiskers' rig that leave every drawing where it is (user 2026-10-31):
//   1. 「把頭的接合處往右邊一點，讓脖子是接在臉的正中心下方」 — the builder put the neck / head pivot under the nose
//      (x −12), left of the face. It moves to the face's centre (x +12, the middle of the face's widest rows), so
//      head tilts and squashes turn about the middle of the face. The neck and head bones move right; every bone
//      hung on them and every vertex bound to them moves back by the same amount.
//   2. 「眼鏡的鍊子，現在沒有接在一起」 — the monocle chain hung ~90px below and left of the monocle, touching
//      nothing. Its ring now hooks onto the lug on the lens rim's lower right, and the chain's first bone pivots on
//      that hook, so its swing hangs from the monocle.
// The setup pose of every parent from root to the head is identity (checked), so world shifts are local shifts.
//
// Run after design/cast_arm_pass.mjs, after every rebuild of the cast. Refuses to run twice on the same rig.
//   node design/cast_rig_fix_pass.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/game/characterRigData.json', 'static/assets/spines/donWhiskers43/character.json'].map((f) => path.join(app, f));
const before = fs.readFileSync(FILES[0], 'utf8');
const raw = JSON.parse(before);
const boneOf = (n) => raw.bones.find((b) => b.name === n);
const index = (n) => raw.bones.findIndex((b) => b.name === n);
if (boneOf('fore_front').inherit !== 'noScale') throw Error('run design/cast_arm_pass.mjs first');

const NECK_SHIFT = 24; // world px right: head pivot −12 → +12
const CHAIN_SHIFT = [61, 117]; // world px: the chain's ring onto the rim lug
const HOOK = [61, -29]; // the lug, in the monocle bone's space — the chain's first bone pivots here

const mid = boneOf('lens_chain_mid'), end = boneOf('lens_chain_end');
if (mid.parent !== 'monocle' || end.parent !== 'lens_chain_mid') throw Error('monocle chain bones changed — remeasure');
if (mid.x === HOOK[0] && mid.y === HOOK[1]) { console.log('cast rig fix pass: already applied'); process.exit(0); }

for (let n = 'monocle'; n; n = boneOf(n).parent) {
	const b = boneOf(n);
	if ((b.rotation ?? 0) !== 0 || (b.scaleX ?? 1) !== 1 || (b.scaleY ?? 1) !== 1 || (b.shearX ?? 0) || (b.shearY ?? 0) || b.inherit)
		throw Error(`${n} is no longer an identity bone in setup pose — remeasure`);
}
for (const n of ['lens_chain_mid', 'lens_chain_end'])
	if ((boneOf(n).rotation ?? 0) !== 0 || (boneOf(n).scaleX ?? 1) !== 1 || (boneOf(n).scaleY ?? 1) !== 1) throw Error(`${n} rotated or scaled — remeasure`);

// bone moves
boneOf('neck').x += NECK_SHIFT;
for (const b of raw.bones) if (b.parent === 'neck' || b.parent === 'head') if (b.name !== 'head') b.x = (b.x ?? 0) - NECK_SHIFT;
// the chain: first bone onto the hook, second bone where the whole chain's shift puts it
const midMove = [HOOK[0] - mid.x, HOOK[1] - mid.y];
const endWorld = [mid.x + end.x + CHAIN_SHIFT[0], mid.y + end.y + CHAIN_SHIFT[1]];
mid.x = HOOK[0]; mid.y = HOOK[1];
end.x = endWorld[0] - HOOK[0]; end.y = endWorld[1] - HOOK[1];

// vertices bound to the moved bones keep their world place
const NECK = index('neck'), HEAD = index('head'), MID = index('lens_chain_mid');
const midBack = [CHAIN_SHIFT[0] - midMove[0], CHAIN_SHIFT[1] - midMove[1]];
let moved = 0;
for (const skin of raw.skins) for (const atts of Object.values(skin.attachments)) for (const a of Object.values(atts)) {
	if (!a.vertices || (a.type !== 'mesh' && a.type !== 'boundingbox' && a.type !== 'clipping' && a.type !== 'path')) continue;
	const count = a.type === 'mesh' ? a.uvs.length / 2 : a.vertexCount;
	if (a.vertices.length === count * 2) continue; // unweighted: rides its slot's bone
	const v = a.vertices;
	for (let i = 0; i < v.length; ) {
		const k = v[i++];
		for (let j = 0; j < k; j++, i += 4) {
			if (v[i] === NECK || v[i] === HEAD) { v[i + 1] -= NECK_SHIFT; moved++; }
			else if (v[i] === MID) { v[i + 1] += midBack[0]; v[i + 2] += midBack[1]; moved++; }
		}
	}
}
// region / unweighted attachments straight on the neck or head
for (const slot of raw.slots) if (slot.bone === 'neck' || slot.bone === 'head')
	for (const skin of raw.skins) for (const a of Object.values(skin.attachments[slot.name] ?? {}))
		if (!a.type || a.type === 'region' || (a.vertices && a.vertices.length === (a.uvs?.length ?? -1))) {
			if (a.vertices) for (let i = 0; i < a.vertices.length; i += 2) a.vertices[i] -= NECK_SHIFT;
			else a.x = (a.x ?? 0) - NECK_SHIFT;
			moved++;
		}

const text = JSON.stringify(raw);
if (fs.readFileSync(FILES[0], 'utf8') !== before) throw Error('characterRigData.json changed while the pass ran — rerun it on the new rig');
for (const f of FILES) fs.writeFileSync(f, text);
const coveragePath = path.join(app, 'design/character-anatomy-coverage.json');
if (fs.existsSync(coveragePath)) {
	const sha = (s) => createHash('sha256').update(s).digest('hex');
	const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
	if (coverage.rigSha256 === sha(before)) { coverage.rigSha256 = sha(text); fs.writeFileSync(coveragePath, JSON.stringify(coverage)); }
	else console.log('cast rig fix pass: anatomy coverage was already stale before this pass — left as it is');
}
console.log(`cast rig fix pass: neck pivot +${NECK_SHIFT}px, chain hooked at monocle (${HOOK}), ${moved} bindings compensated`);
