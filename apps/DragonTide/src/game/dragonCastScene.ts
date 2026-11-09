import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
import { AnimationState, AnimationStateData, Skeleton, SkeletonJson, Physics, type AttachmentLoader } from '@esotericsoftware/spine-core';
import kingRig from './dragonKingData.json';
import kingAtlas from './dragonKingAtlas.json';
import princessRig from './dragonPrincessData.json';
import princessAtlas from './dragonPrincessAtlas.json';
import extents from './dragonCastExtents.json';

// Dragon King (base game) and Dragon Princess (free game), r11 layers exported by the
// stand34 kit as Spine 4.3. Bones and curves run in the real 4.3 runtime; every region
// attachment is a full 1024x1536 canvas, drawn here as one Pixi mesh over its alpha crop.
//
// Root space: x right, y down, feet at y≈0, origin = canvas x 512 / y 1456. Both are drawn
// facing screen-left (face, eyes and body turned toward the board on their left), so neither
// is mirrored; each holds the prop out on the outer side. Checked in the game, not from the art
// (11-09: a mirrored princess looked AWAY from the board although her pearl hand faced it).

const loader = {
	newRegionAttachment: () => null, newMeshAttachment: () => null,
	newBoundingBoxAttachment: () => null, newPathAttachment: () => null,
	newPointAttachment: () => null, newClippingAttachment: () => null,
} as unknown as AttachmentLoader;
type Attachment = { x?: number; y?: number; rotation?: number; width: number; height: number };
type Part = { x: number; y: number; width: number; height: number; cropX: number; cropY: number };
type Rig = typeof kingRig;
type Box = { minX: number; maxX: number; minY: number; maxY: number };
export type DragonCastKind = 'mg' | 'fg';

const CAST: Record<DragonCastKind, {
	rig: Rig; atlas: { width: number; height: number; parts: Record<string, Part> }; mirror: boolean;
	/** canvas pixels on the prop: the trident's centre prong / the night pearl */
	release: { slot: string; drawing: string; x: number; y: number };
	/** canvas y of the hip joint (portrait tucks everything below it behind the frame) */
	hipY: number;
}> = {
	mg: { rig: kingRig, atlas: kingAtlas, mirror: false, release: { slot: 'prop', drawing: 'prop', x: 797, y: 140 }, hipY: 760 },
	fg: { rig: princessRig as unknown as Rig, atlas: princessAtlas, mirror: false, release: { slot: 'prop', drawing: 'prop', x: 791, y: 335 }, hipY: 700 },
};
const ORIGIN = { x: 512, y: 1456 };

/** Requests from the game (Hypno-era names included) → this rig's staff set. */
const CAST_REQUESTS = new Set(['cast', 'gaze', 'gaze_turbo', 'fg_gaze', 'fg_gaze_turbo']);
const READY_REQUESTS = new Set(['ready', 'fg_ready', 'fg_end']);
const TRANSFORM_REQUESTS = new Set(['transform', 'fg_transform']);
// 天使奧丁 (SPEC §4, Stone 11-05): no victory act on a big win — the caster stays in idle
// and turns into a translucent silhouette until the win display ends.
const SILHOUETTE_REQUESTS = new Set(['win_big', 'win_max', 'silhouette']);
const SILHOUETTE = { tint: 0x2c4652, alpha: 0.45 };

export function createDragonCastScene(texture: Texture, kind: DragonCastKind) {
	const cast = CAST[kind], rig = cast.rig, atlas = cast.atlas;
	const data = new SkeletonJson(loader).readSkeletonData(rig);
	const skeleton = new Skeleton(data);
	const stateData = new AnimationStateData(data); stateData.defaultMix = 0.12;
	const state = new AnimationState(stateData);
	const root = new Container(); root.label = `Dragon Tide / ${kind === 'mg' ? 'Dragon King' : 'Dragon Princess'} / Spine 4.3`;
	root.eventMode = 'none';
	const figure = new Container(); figure.sortableChildren = true; figure.scale.x = cast.mirror ? -1 : 1; root.addChild(figure);
	const skin = rig.skins[0].attachments as unknown as Record<string, Record<string, Attachment>>;
	const parts = atlas.parts;
	const meshes = new Map<string, { mesh: Mesh; geometry: MeshGeometry; positions: Float32Array }>();
	let hidden = new Set<string>(), reduced = false, disposed = false, inspection = false, silhouetteOn = false;
	state.setAnimation(0, 'idle', true);

	function matrix(slotName: string, drawing: string) {
		const slot = rig.slots.find((s) => s.name === slotName)!;
		const bone = skeleton.findBone(slot.bone)!.getAppliedPose();
		const attachment = skin[slotName][drawing];
		const angle = (attachment.rotation ?? 0) * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
		const a = bone.a * c + bone.b * s, b = -bone.a * s + bone.b * c;
		const c1 = bone.c * c + bone.d * s, d = -bone.c * s + bone.d * c;
		const qx = bone.worldX + bone.a * (attachment.x ?? 0) + bone.b * (attachment.y ?? 0);
		const qy = bone.worldY + bone.c * (attachment.x ?? 0) + bone.d * (attachment.y ?? 0);
		return { a, b, c: c1, d, x: qx - a * attachment.width / 2 + b * attachment.height / 2, y: qy - c1 * attachment.width / 2 + d * attachment.height / 2 };
	}
	/** a canvas pixel of one drawing → root space (mirror applied) */
	function canvasPoint(slot: string, drawing: string, x: number, y: number) {
		const m = matrix(slot, drawing);
		return { x: (m.x + m.a * x - m.b * y) * figure.scale.x, y: -(m.y + m.c * x - m.d * y) };
	}
	function applyTint() {
		for (const item of meshes.values()) item.mesh.tint = silhouetteOn ? SILHOUETTE.tint : 0xffffff;
		figure.alpha = silhouetteOn ? SILHOUETTE.alpha : 1;
	}
	function update(seconds: number) {
		if (disposed) return;
		const dt = Math.max(0, Math.min(0.1, seconds));
		if (!reduced && !inspection) { state.update(dt); skeleton.update(dt); }
		state.apply(skeleton); skeleton.updateWorldTransform(Physics.none);
		for (const item of meshes.values()) item.mesh.visible = false;
		const current = state.tracks[0];
		const name = current?.animation?.name ?? 'idle';
		const time = current ? current.loop ? current.trackTime % current.animation!.duration : Math.min(current.trackTime, current.animation!.duration) : 0;
		const animation = (rig.animations as unknown as Record<string, { slots?: Record<string, { attachment?: { time?: number; name?: string | null }[] }> }>)[name];
		for (const [index, slot] of rig.slots.entries()) {
			if (hidden.has(slot.name)) continue;
			let drawing: string | null = slot.attachment;
			for (const key of animation?.slots?.[slot.name]?.attachment ?? []) if ((key.time ?? 0) <= time + 1e-6) drawing = key.name ?? null;
			if (!drawing || !parts[drawing]) continue;
			const part = parts[drawing]; let item = meshes.get(drawing);
			if (!item) {
				const positions = new Float32Array(8);
				const u0 = part.x / atlas.width, v0 = part.y / atlas.height, u1 = (part.x + part.width) / atlas.width, v1 = (part.y + part.height) / atlas.height;
				const geometry = new MeshGeometry({ positions, uvs: new Float32Array([u0, v0, u1, v0, u1, v1, u0, v1]), indices: new Uint32Array([0, 1, 2, 0, 2, 3]) });
				const mesh = new Mesh({ geometry, texture }); mesh.tint = silhouetteOn ? SILHOUETTE.tint : 0xffffff;
				figure.addChild(mesh); item = { mesh, geometry, positions }; meshes.set(drawing, item);
			}
			const m = matrix(slot.name, drawing);
			const points = [[part.cropX, part.cropY], [part.cropX + part.width, part.cropY], [part.cropX + part.width, part.cropY + part.height], [part.cropX, part.cropY + part.height]];
			for (const [i, [x, y]] of points.entries()) { item.positions[i * 2] = m.x + m.a * x - m.b * y; item.positions[i * 2 + 1] = -(m.y + m.c * x - m.d * y); }
			item.geometry.getBuffer('aPosition').update(); item.mesh.visible = true; item.mesh.zIndex = index;
		}
		figure.sortChildren();
	}
	update(0);

	/** Ink extents per animation in root space (mirror applied), from design/cast_dragon/motion_extents.mjs. */
	const extentsOf = (name: string): Box => {
		const box = (extents as Record<string, Record<string, Box>>)[kind][name] ?? (extents as Record<string, Record<string, Box>>)[kind].idle;
		return cast.mirror ? { minX: -box.maxX, maxX: -box.minX, minY: box.minY, maxY: box.maxY } : { ...box };
	};
	function toIdle() { state.setAnimation(0, 'idle', true); }
	const api = {
		root, state, skeleton, update, kind,
		/** ink box at rest (idle) and over the acts the game plays */
		rest: extentsOf('idle'),
		reach: ['idle', 'cast', 'ready', 'ready_loop', 'transform'].map(extentsOf).reduce((a, b) => ({ minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX), minY: Math.min(a.minY, b.minY), maxY: Math.max(a.maxY, b.maxY) })),
		hipDepth: ORIGIN.y - cast.hipY,
		inspect(name: string, seconds: number) {
			if (!import.meta.env.DEV || !data.findAnimation(name)) return;
			state.clearTracks(); skeleton.setupPose();
			state.setAnimation(0, name, false); state.update(seconds); skeleton.update(seconds); state.apply(skeleton); skeleton.updateWorldTransform(Physics.none);
			inspection = true; update(0);
		},
		/** leave a QA hold straight to idle (the held clip has no idle queued behind it) */
		resume() { inspection = false; silhouetteOn = false; applyTint(); state.clearTracks(); skeleton.setupPose(); toIdle(); update(0); },
		/** slots left undrawn */
		setHidden(names: string[]) { hidden = new Set(names); update(0); },
		setReducedMotion(value: boolean) { reduced = value; if (value) { state.clearTracks(); skeleton.setupPose(); toIdle(); update(0); } },
		/** Plays a game request; false when this rig has nothing for it (Odin: no reaction). */
		play(request: string) {
			// a held QA pose (?castqa) must not be replaced by the game's next cue
			if (disposed || inspection) return false;
			if (SILHOUETTE_REQUESTS.has(request)) { silhouetteOn = true; applyTint(); return true; }
			if (reduced) return false;
			const current = state.tracks[0]?.animation?.name;
			if (CAST_REQUESTS.has(request)) {
				// a cast mid-ready (a refill pearl during the plaque) must not drop the wind-up
				if (current === 'ready' || current === 'ready_loop' || current === 'transform') return false;
				state.setAnimation(0, 'cast', false); state.addAnimation(0, 'idle', true, 0); return true;
			}
			if (READY_REQUESTS.has(request)) {
				if (current === 'ready' || current === 'ready_loop') return true;
				state.setAnimation(0, 'ready', false); state.addAnimation(0, 'ready_loop', true, 0); return true;
			}
			if (TRANSFORM_REQUESTS.has(request)) { state.setAnimation(0, 'transform', false); state.addAnimation(0, 'idle', true, 0); return true; }
			return false;
		},
		/** Back to plain idle, silhouette off. */
		reset() {
			if (inspection) return;
			silhouetteOn = false; applyTint();
			const name = state.tracks[0]?.animation?.name;
			if (name === 'cast' || name === 'transform') return; // let the act finish into idle
			state.clearTracks(); skeleton.setupPose(); toIdle(); update(0);
		},
		/** Release point (prop tip) in the parent's space, for the bolt and pearl effects. */
		getGazeAnchors() {
			const rel = cast.release, p = canvasPoint(rel.slot, rel.drawing, rel.x, rel.y);
			const point = (q: { x: number; y: number }) => ({ x: root.x + q.x * root.scale.x, y: root.y + q.y * root.scale.y });
			const l = point({ x: p.x - 5, y: p.y }), r = point({ x: p.x + 5, y: p.y });
			return { left: l, right: r, center: { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 } };
		},
		destroy() {
			if (disposed) return; disposed = true; state.clearTracks(); state.clearListeners();
			root.destroy({ children: true }); for (const item of meshes.values()) item.geometry.destroy(); meshes.clear();
		},
	};
	if (import.meta.env.DEV) (globalThis as typeof globalThis & { __dragonCastScene?: unknown }).__dragonCastScene = api;
	return api;
}
