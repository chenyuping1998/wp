/** Runtime QA for the separate Boomana-derived limbs, head and cloth meshes. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
	dir = path.join(app, 'static/assets/spines/goBananasMonkey');
const store = path.resolve(app, '../../node_modules/.pnpm'),
	pkg = fs.readdirSync(store).find((n) => n.startsWith('@esotericsoftware+spine-core@'));
const {
	TextureAtlas,
	AtlasAttachmentLoader,
	SkeletonJson,
	Skeleton,
	AnimationStateData,
	AnimationState,
	Physics,
} = await import(
	pathToFileURL(path.join(store, pkg, 'node_modules/@esotericsoftware/spine-core/dist/index.js'))
);
const require = createRequire('E:/stake/tools/gen/package.json'),
	{ PNG } = require('pngjs');
const raw = JSON.parse(fs.readFileSync(path.join(dir, 'monkey.json'), 'utf8'));
const atlas = new TextureAtlas(fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8'));
const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(raw),
	skeleton = new Skeleton(data);
assert.equal(raw.skeleton.hash, 'gb-alchemist-boom-v3');
assert.ok(
	!raw.slots.some((s) => s.name === 'alchemy_body'),
	'A flattened full-body skin must not replace the separate limbs',
);
for (const name of [
	'idle',
	'cheer',
	'chestbeat',
	'throwit',
	'nod',
	'flinch',
	'alert',
	'glance',
	'flutter',
	'blink',
])
	assert.ok(data.findAnimation(name), `Missing ${name}`);
for (const [slot, bone] of [
	['left_arm_0_upper_arm', 'armL'],
	['left_arm_2_hand', 'armL_fore'],
	['right_arm_0_upper_arm', 'armR'],
	['right_arm_2_hand', 'armR_fore'],
])
	assert.equal(raw.slots.find((s) => s.name === slot)?.bone, bone);
const pages = new Map(
	atlas.pages.map((p) => [p.name, PNG.sync.read(fs.readFileSync(path.join(dir, p.name)))]),
);
const pixels = (slot, att) => {
	const xy = new Float32Array(att.worldVerticesLength ?? 8);
	if (att.triangles) att.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
	else att.computeWorldVertices(slot, xy, 0, 2);
	return xy;
};
const areas = (xy, tri) =>
	Array.from({ length: tri.length / 3 }, (_, i) => {
		const a = tri[i * 3] * 2,
			b = tri[i * 3 + 1] * 2,
			c = tri[i * 3 + 2] * 2;
		return (xy[b] - xy[a]) * (xy[c + 1] - xy[a + 1]) - (xy[b + 1] - xy[a + 1]) * (xy[c] - xy[a]);
	});
skeleton.setToSetupPose();
skeleton.updateWorldTransform(Physics.reset);
const references = [];
for (const slot of skeleton.slots) {
	const att = slot.getAttachment();
	if (!att) continue;
	const xy = pixels(slot, att),
		tri = att.triangles ?? [0, 1, 2, 0, 2, 3],
		uv = att.regionUVs ?? [0, 0, 1, 0, 1, 1, 0, 1],
		page = pages.get(att.region.page.name),
		r = att.region;
	const opaque = (u, v) => {
		const x = Math.max(0, Math.min(page.width - 1, Math.round(r.x + u * r.width))),
			y = Math.max(0, Math.min(page.height - 1, Math.round(r.y + v * r.height)));
		return page.data[(y * page.width + x) * 4 + 3] > 100;
	};
	const inked = Array.from({ length: tri.length / 3 }, (_, i) => {
		const vs = tri.slice(i * 3, i * 3 + 3);
		return (
			vs.some((v) => opaque(uv[v * 2], uv[v * 2 + 1])) ||
			opaque(
				vs.reduce((s, v) => s + uv[v * 2], 0) / 3,
				vs.reduce((s, v) => s + uv[v * 2 + 1], 0) / 3,
			)
		);
	});
	references.push({ name: slot.data.name, tri, rest: areas(xy, tri), inked, base: xy });
}
const chains = [
	['armL', 'armL_fore'],
	['armL_fore', 'armL_hand'],
	['armR', 'armR_fore'],
	['armR_fore', 'armR_hand'],
	['legL', 'legL_calf'],
	['legL_calf', 'legL_foot'],
	['legR', 'legR_calf'],
	['legR_calf', 'legR_foot'],
].map(([a, b]) => {
	a = skeleton.findBone(a);
	b = skeleton.findBone(b);
	return { a, b, length: Math.hypot(a.worldX - b.worldX, a.worldY - b.worldY) };
});
let lo = Infinity,
	hi = 0,
	lengthLo = Infinity,
	lengthHi = 0,
	blinks = 0,
	flips = 0,
	worst = '';
const issues = {};
const travel = { L: 0, R: 0 };
let maxElbowBend = 0;
const wristRest = Object.fromEntries(
	['L', 'R'].map((side) => {
		const b = skeleton.findBone('arm' + side + '_hand');
		return [side, [b.worldX, b.worldY]];
	}),
);
for (const anim of data.animations) {
	if (['flutter', 'blink'].includes(anim.name)) continue;
	for (const speed of [1, 1.5]) {
		skeleton.setToSetupPose();
		skeleton.updateWorldTransform(Physics.reset);
		const state = new AnimationState(new AnimationStateData(data));
		state.setAnimation(0, anim.name, true);
		state.setAnimation(1, 'flutter', true);
		state.setAnimation(2, 'blink', true);
		const frames = Math.ceil((Math.max(anim.duration, 5.6) * 60) / speed) + 1;
		for (let f = 0; f < frames; f++) {
			const dt = speed / 60;
			state.update(dt);
			state.apply(skeleton);
			skeleton.update(dt);
			skeleton.updateWorldTransform(Physics.update);
			for (const chain of chains) {
				const k =
					Math.hypot(chain.a.worldX - chain.b.worldX, chain.a.worldY - chain.b.worldY) /
					chain.length;
				lengthLo = Math.min(lengthLo, k);
				lengthHi = Math.max(lengthHi, k);
			}
			for (const side of ['L', 'R']) {
				const a = skeleton.findBone('arm' + side),
					e = skeleton.findBone('arm' + side + '_fore'),
					p = skeleton.findBone('palm' + side);
				const ax = a.worldX - e.worldX,
					ay = a.worldY - e.worldY,
					bx = p.worldX - e.worldX,
					by = p.worldY - e.worldY;
				const cosine = Math.max(
					-1,
					Math.min(1, (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by))),
				);
				maxElbowBend = Math.max(maxElbowBend, 180 - (Math.acos(cosine) * 180) / Math.PI);
			}
			if (skeleton.findSlot('head_2_face').getAttachment()?.name === 'alchemist_head_closed')
				blinks++;
			for (const ref of references) {
				const slot = skeleton.findSlot(ref.name),
					att = slot.getAttachment();
				if (!att) continue;
				const xy = pixels(slot, att),
					as = areas(xy, ref.tri);
				assert.equal(
					xy.length,
					ref.base.length,
					`${ref.name} attachment changes geometry unexpectedly`,
				);
				for (let t = 0; t < as.length; t++)
					if (ref.inked[t] && Math.abs(ref.rest[t]) > 1e-6) {
						const ratio = as[t] / ref.rest[t];
						if (ratio <= 0) flips++;
						if (ratio < 0.5 || ratio > 1.6)
							issues[ref.name] = [
								Math.min(issues[ref.name]?.[0] ?? Infinity, ratio),
								Math.max(issues[ref.name]?.[1] ?? -Infinity, ratio),
							];
						if (ratio < lo || ratio > hi)
							worst = `${anim.name} ${ref.name} ${(f * dt).toFixed(3)}s`;
						lo = Math.min(lo, ratio);
						hi = Math.max(hi, ratio);
					}
			}
			if (anim.name === 'chestbeat' && speed === 1)
				for (const side of ['L', 'R']) {
					const b = skeleton.findBone('arm' + side + '_hand'),
						p = wristRest[side];
					travel[side] = Math.max(travel[side], Math.hypot(b.worldX - p[0], b.worldY - p[1]));
				}
		}
	}
}
if (flips || lo < 0.5 || hi > 1.6) console.log({ lo, hi, flips, worst, issues });
assert.equal(flips, 0, 'Painted mesh flips');
assert.ok(
	lo >= 0.5 && hi <= 1.6,
	`Mesh area ${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)}%: ${worst}`,
);
assert.ok(lengthLo >= 0.95 && lengthHi <= 1.05, `Limb length drift: ${lengthLo}..${lengthHi}`);
assert.ok(
	travel.L > 100 && travel.R > 100,
	`Chestbeat wrists must move visibly: ${JSON.stringify(travel)}`,
);
assert.ok(blinks > 0, 'The blink never closes the eyes');
assert.ok(maxElbowBend <= 150, `Elbow folds beyond 150 degrees: ${maxElbowBend}`);
let contactError = 0;
for (let beat = 0; beat < 6; beat++) {
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform(Physics.reset);
	const state = new AnimationState(new AnimationStateData(data));
	state.setAnimation(0, 'chestbeat', false);
	const time = 0.48 + beat * 0.3;
	let elapsed = 0;
	while (elapsed < time) {
		const dt = Math.min(1 / 120, time - elapsed);
		state.update(dt);
		state.apply(skeleton);
		skeleton.update(dt);
		skeleton.updateWorldTransform(Physics.update);
		elapsed += dt;
	}
	const side = beat % 2 ? 'L' : 'R',
		palm = skeleton.findBone('palm' + side),
		target = skeleton.findBone('torso').localToWorld({ ...raw.skeleton.chestTargets[side] });
	contactError = Math.max(contactError, Math.hypot(palm.worldX - target.x, palm.worldY - target.y));
}
assert.ok(contactError < 1, `Palm misses chest target by ${contactError}px`);
assert.ok(
	skeleton.physicsConstraints.every((p) => p.active),
	'Inactive accessory physics',
);
const throwSlot = raw.animations.throwit.slots.dynamite.attachment;
assert.equal(
	throwSlot.findLast((k) => k.name === null).time,
	0.38,
	'Reagent release timing changed',
);
const base = JSON.parse(
	fs.readFileSync(path.join(app, 'design/source/boomana_reskin_v3/boom_monkey.json'), 'utf8'),
);
for (const b of base.bones) {
	const now = raw.bones.find((n) => n.name === b.name);
	for (const k of ['parent', 'x', 'y', 'rotation'])
		assert.equal(now[k], b[k], `Source hinge changed: ${b.name}.${k}`);
}
console.log(
	`check_alchemist_mesh: OK — ${data.animations.length} animations; ${references.length} separate visible parts; mesh ${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)}%; no flips`,
);
console.log(
	`  six palm/chest contacts: max error ${contactError.toFixed(3)}px; elbow flexion <= ${maxElbowBend.toFixed(1)} degrees`,
);
console.log(
	`  anatomical chains ${(lengthLo * 100).toFixed(1)}–${(lengthHi * 100).toFixed(1)}%; chestbeat wrist travel L=${travel.L.toFixed(1)}px R=${travel.R.toFixed(1)}px; ${blinks} closed-eye frames; ${skeleton.physicsConstraints.length} active physics constraints`,
);
