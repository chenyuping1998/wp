// Ink extents of every cast animation in the renderer's root space (x right, y down,
// feet at y≈0). Conservative: each part's alpha box corners, after its bone transform.
// Usage: node design/cast_dragon/motion_extents.mjs  -> src/game/dragonCastExtents.json (read by dragonCastScene.ts)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { AnimationState, AnimationStateData, Skeleton, SkeletonJson, Physics } from '@esotericsoftware/spine-core';
const here = dirname(fileURLToPath(import.meta.url));
const game = join(here, '../../src/game');
const loader = { newRegionAttachment: () => null, newMeshAttachment: () => null, newBoundingBoxAttachment: () => null,
	newPathAttachment: () => null, newPointAttachment: () => null, newClippingAttachment: () => null };
const out = {};
for (const [who, key] of [['mg', 'dragonKing'], ['fg', 'dragonPrincess']]) {
	const rig = JSON.parse(readFileSync(join(game, `${key}Data.json`), 'utf8'));
	const atlas = JSON.parse(readFileSync(join(game, `${key}Atlas.json`), 'utf8'));
	const data = new SkeletonJson(loader).readSkeletonData(rig);
	const skin = rig.skins[0].attachments;
	const result = {};
	for (const animation of data.animations) {
		const skeleton = new Skeleton(data); const state = new AnimationState(new AnimationStateData(data));
		skeleton.setupPose(); state.setAnimation(0, animation.name, false);
		const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
		const parts = {};
		const keys = rig.animations[animation.name]?.slots ?? {};
		for (let f = 0; f <= Math.ceil(animation.duration * 30); f++) {
			const t = Math.min(animation.duration, f / 30);
			skeleton.setupPose(); state.clearTracks(); state.setAnimation(0, animation.name, false);
			state.update(t); state.apply(skeleton); skeleton.updateWorldTransform(Physics.none);
			for (const slot of rig.slots) {
				let drawing = slot.attachment;
				for (const k of keys[slot.name]?.attachment ?? []) if ((k.time ?? 0) <= t + 1e-6) drawing = k.name ?? null;
				const part = drawing && atlas.parts[drawing]; if (!part) continue;
				const at = skin[slot.name][drawing];
				const bone = skeleton.findBone(slot.bone).getAppliedPose();
				const ang = (at.rotation ?? 0) * Math.PI / 180, c = Math.cos(ang), s = Math.sin(ang);
				const a = bone.a * c + bone.b * s, b = -bone.a * s + bone.b * c, c1 = bone.c * c + bone.d * s, d = -bone.c * s + bone.d * c;
				const qx = bone.worldX + bone.a * (at.x ?? 0) + bone.b * (at.y ?? 0), qy = bone.worldY + bone.c * (at.x ?? 0) + bone.d * (at.y ?? 0);
				const mx = qx - a * at.width / 2 + b * at.height / 2, my = qy - c1 * at.width / 2 + d * at.height / 2;
				for (const [x, y] of [[part.cropX, part.cropY], [part.cropX + part.width, part.cropY], [part.cropX + part.width, part.cropY + part.height], [part.cropX, part.cropY + part.height]]) {
					const X = mx + a * x - b * y, Y = -(my + c1 * x - d * y);
					box.minX = Math.min(box.minX, X); box.maxX = Math.max(box.maxX, X); box.minY = Math.min(box.minY, Y); box.maxY = Math.max(box.maxY, Y);
					const p = (parts[slot.name] ??= { minX: Infinity, maxX: -Infinity }); p.minX = Math.min(p.minX, X); p.maxX = Math.max(p.maxX, X);
				}
			}
		}
		const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));
		const leftmost = Object.entries(parts).sort((p, q) => p[1].minX - q[1].minX).slice(0, 3).map(([n, v]) => `${n}:${Math.round(v.minX)}`);
		const rightmost = Object.entries(parts).sort((p, q) => q[1].maxX - p[1].maxX).slice(0, 3).map(([n, v]) => `${n}:${Math.round(v.maxX)}`);
		result[animation.name] = { ...round(box), leftmost, rightmost };
	}
	out[who] = result;
}
writeFileSync(join(game, 'dragonCastExtents.json'), JSON.stringify(out, null, 1) + '\n');
for (const [who, r] of Object.entries(out)) for (const [n, b] of Object.entries(r)) console.log(who, n.padEnd(13), `x ${b.minX}..${b.maxX}  y ${b.minY}..${b.maxY}`, ' L', b.leftmost.join(' '), ' R', b.rightmost.join(' '));
