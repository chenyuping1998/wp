// Shared helpers: load a converted (4.2) skeleton from spine-42/ in node and pose it, no textures needed.
import fs from 'node:fs';
import path from 'node:path';
// spine-core 4.2 from the wp workspace (any 4.2 build works; set SPINE_CORE to override).
const SPINE_CORE = process.env.SPINE_CORE ?? 'file:///E:/stake/wp/node_modules/.pnpm/@esotericsoftware+spine-core@4.2.74/node_modules/@esotericsoftware/spine-core/dist/index.js';
const spine = await import(SPINE_CORE);

export { spine };
// The teardown folder: RESEARCH=<dir> (default: the Sweet Loot teardown).
export const ROOT = (process.env.RESEARCH ?? 'E:/stake/archive/research/sweet-loot').replaceAll('\\', '/');
export const DIR = `${ROOT}/spine-42`;

// Geometry only: a fake texture is enough for regions and meshes to compute world vertices.
class NoTexture extends spine.Texture { constructor() { super({ width: 4096, height: 4096 }); } setFilters() {} setWraps() {} dispose() {} }

export function load(name) {
	const atlas = new spine.TextureAtlas(fs.readFileSync(path.join(DIR, `${name}.atlas`), 'utf8'));
	for (const p of atlas.pages) p.setTexture(new NoTexture());
	const json = JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), 'utf8'));
	const data = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas)).readSkeletonData(json);
	const raw = JSON.parse(fs.readFileSync(path.join(DIR, '..', 'spine', `${name}.json`), 'utf8')); // 3.7 original
	return { data, raw, json };
}

export function poser(data) {
	const skeleton = new spine.Skeleton(data);
	const state = new spine.AnimationState(new spine.AnimationStateData(data));
	return {
		skeleton,
		pose(anim, t, tweak) {
			skeleton.setToSetupPose();
			state.clearTracks();
			if (anim) {
				const e = typeof anim === 'string' ? state.setAnimation(0, anim, false) : state.setAnimationWith(0, anim, false);
				e.trackTime = t; e.mixDuration = 0;
				state.apply(skeleton);
			}
			if (tweak) tweak(skeleton);
			skeleton.updateWorldTransform(spine.Physics.update);
			return skeleton;
		},
	};
}

/** Bounds of the visible attachments (optionally only slots matching a regex). */
export function bounds(skeleton, only) {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	const v = [];
	for (const slot of skeleton.drawOrder) {
		if (only && !only.test(slot.data.name)) continue;
		const a = slot.getAttachment();
		if (!a || slot.color.a === 0) continue;
		let n = 0;
		if (a instanceof spine.RegionAttachment) { a.computeWorldVertices(slot, v, 0, 2); n = 8; }
		else if (a instanceof spine.MeshAttachment) { n = a.worldVerticesLength; a.computeWorldVertices(slot, 0, n, v, 0, 2); }
		else continue;
		for (let i = 0; i < n; i += 2) { minX = Math.min(minX, v[i]); maxX = Math.max(maxX, v[i]); minY = Math.min(minY, v[i + 1]); maxY = Math.max(maxY, v[i + 1]); }
	}
	return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export const r2 = (n) => +(+n).toFixed(2);
export const r3 = (n) => +(+n).toFixed(3);
