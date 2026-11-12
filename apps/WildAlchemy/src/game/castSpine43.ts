import {
	AnimationState,
	AnimationStateData,
	Physics,
	RegionAttachment,
	Skeleton,
	SkeletonData,
	SkeletonJson,
	TextureRegion,
	type AttachmentLoader,
} from '../vendor/spine-core-4.3.13/index.js';
import { Container, Mesh, MeshGeometry, Texture } from 'pixi.js';

/**
 * The cast as spine-motion-kit Spine 4.3 rigs (2026-11-10; file ported from
 * Static Shift's castSpine43.ts).
 *
 * The rigs (new-games/wild-alchemy/art/2026-11-10-characters/<mg|fg>/spine,
 * stand34 robe template with the flask motion set, packed by
 * design/build_game_cast.py) are region attachments only; the head swaps
 * drawings (idle / blink / focus), so each slot holds one mesh per drawing it
 * can show and only the one the slot points at is visible. The rest of the game
 * keeps the shared 4.2 runtime; this file is the only user of the vendored 4.3.
 *
 * Coordinates: skeleton units = source image px, y up, feet on y = 0. The view
 * flips y, so (0, 0) of the view is the point between the feet.
 */

export type CastRig = { skeleton: { spine: string }; wildAlchemy: { prefix: string } };
/** a box in skeleton units, y UP */
export type CastBox = { minX: number; maxX: number; minY: number; maxY: number };

// The textures are separate Pixi frames, so no Spine atlas: a unit region makes
// the region attachment size its quad from its own width/height.
const loader: AttachmentLoader = {
	newRegionAttachment: (_skin, _placeholder, name, _path, sequence) => {
		const region = new TextureRegion();
		region.u2 = region.v2 = 1;
		region.width = region.height = region.originalWidth = region.originalHeight = 1;
		sequence.regions.fill(region);
		return new RegionAttachment(name, sequence);
	},
	newMeshAttachment: () => {
		throw new Error('Wild Alchemy cast rigs have no mesh attachments');
	},
	newBoundingBoxAttachment: () => {
		throw new Error('Wild Alchemy cast rigs have no bounding boxes');
	},
	newPathAttachment: () => {
		throw new Error('Wild Alchemy cast rigs have no paths');
	},
	newPointAttachment: () => {
		throw new Error('Wild Alchemy cast rigs have no points');
	},
	newClippingAttachment: () => {
		throw new Error('Wild Alchemy cast rigs have no clipping');
	},
};

type Part = { attachment: RegionAttachment; mesh: Mesh; positions: Float32Array };

export const readCastData = (json: CastRig) => {
	if (!json.skeleton.spine.startsWith('4.3.')) throw new Error('Wild Alchemy cast needs a Spine 4.3 rig');
	return new SkeletonJson(loader).readSkeletonData(json);
};

const corners = new Float32Array(8);
/**
 * The ink's reach over a whole clip, in skeleton units (y up): every frame at
 * 30 fps on a private skeleton, every visible quad (crops are alpha-tight).
 * Taken from the rig itself so a re-rig can never leave stale layout numbers.
 */
export const measureClip = (data: SkeletonData, animation: string): CastBox => {
	if (!data.findAnimation(animation)) throw new Error(`Cast rig has no ${animation}`);
	const skeleton = new Skeleton(data);
	const state = new AnimationState(new AnimationStateData(data));
	const duration = state.setAnimation(0, animation, false).animation?.duration ?? 0;
	const box: CastBox = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
	skeleton.setupPose();
	for (let t = 0; ; t += 1 / 30) {
		state.update(t === 0 ? 0 : 1 / 30);
		state.apply(skeleton);
		skeleton.updateWorldTransform(Physics.none);
		for (const slot of skeleton.slots) {
			const pose = slot.getAppliedPose();
			const attachment = pose.attachment;
			if (!(attachment instanceof RegionAttachment)) continue;
			attachment.computeWorldVertices(slot, attachment.getOffsets(pose), corners, 0, 2);
			for (let k = 0; k < 8; k += 2) {
				box.minX = Math.min(box.minX, corners[k]);
				box.maxX = Math.max(box.maxX, corners[k]);
				box.minY = Math.min(box.minY, corners[k + 1]);
				box.maxY = Math.max(box.maxY, corners[k + 1]);
			}
		}
		if (t >= duration) break;
	}
	return box;
};

const regionAttachments = (skeleton: Skeleton) => {
	const out: { slotIndex: number; attachment: RegionAttachment }[] = [];
	const skin = skeleton.data.defaultSkin;
	if (!skin) throw new Error('Wild Alchemy cast rig has no default skin');
	for (const entry of skin.getAttachments()) {
		if (!(entry.attachment instanceof RegionAttachment)) throw new Error(`Cast attachment ${entry.placeholder} is not a region`);
		out.push({ slotIndex: entry.slotIndex, attachment: entry.attachment });
	}
	return out;
};

export class CastSpine43 {
	readonly view = new Container();
	readonly skeleton: Skeleton;
	readonly state: AnimationState;
	/** fired at the rig's keyed events (`foretell` at trans_in 0 s, `cast_release` at trans_out 0.2 s) */
	onEvent: ((name: string) => void) | null = null;
	private readonly parts = new Map<RegionAttachment, Part>();
	private readonly shown: (Part | null)[];
	private readonly slotLayers: Container[] = [];
	private lastMs: number | null = null;

	constructor(json: CastRig, data: SkeletonData, texture: (name: string) => Texture | undefined, label: string) {
		this.view.label = label;
		this.skeleton = new Skeleton(data);
		const stateData = new AnimationStateData(data);
		stateData.defaultMix = 0.16;
		this.state = new AnimationState(stateData);
		this.state.addListener({ event: (_entry, event) => this.onEvent?.(event.data.name) });

		// One layer per slot, in draw order (the rigs key no draw-order changes).
		for (const slot of this.skeleton.drawOrder.appliedPose) {
			const layer = new Container({ label: slot.data.name });
			this.slotLayers[slot.data.index] = layer;
			this.view.addChild(layer);
		}
		const sources = new Map<unknown, Texture>();
		for (const { slotIndex, attachment } of regionAttachments(this.skeleton)) {
			const name = json.wildAlchemy.prefix + attachment.name;
			const frame = texture(name);
			if (!frame) throw new Error(`Missing cast texture ${name}`);
			// One texture per atlas page; the UVs pick the frame out of it.
			let page = sources.get(frame.source);
			if (!page) sources.set(frame.source, (page = new Texture({ source: frame.source })));
			attachment.updateSequence();
			const unit = attachment.sequence.getUVs(0);
			const { x, y, width, height } = frame.frame;
			const uvs = new Float32Array(8);
			for (let i = 0; i < 8; i += 2) {
				uvs[i] = (x + unit[i] * width) / frame.source.width;
				uvs[i + 1] = (y + unit[i + 1] * height) / frame.source.height;
			}
			const positions = new Float32Array(8);
			const mesh = new Mesh({
				geometry: new MeshGeometry({ positions, uvs, indices: new Uint32Array([0, 1, 2, 2, 3, 0]) }),
				texture: page,
			});
			mesh.label = attachment.name;
			mesh.visible = false;
			this.slotLayers[slotIndex].addChild(mesh);
			this.parts.set(attachment, { attachment, mesh, positions });
		}
		this.shown = this.skeleton.slots.map(() => null);
		this.skeleton.setupPose();
		this.state.setAnimation(0, 'idle', true);
		this.update(0);
		this.lastMs = null;
	}

	update(timeMs: number) {
		const delta = this.lastMs === null ? 0 : Math.max(0, Math.min(0.1, (timeMs - this.lastMs) / 1000));
		this.lastMs = timeMs;
		this.state.update(delta);
		this.state.apply(this.skeleton);
		this.skeleton.update(delta);
		this.skeleton.updateWorldTransform(Physics.update);
		const slots = this.skeleton.slots;
		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			const pose = slot.getAppliedPose();
			const attachment = pose.attachment;
			const part = attachment instanceof RegionAttachment ? (this.parts.get(attachment) ?? null) : null;
			const was = this.shown[i];
			if (was !== part) {
				if (was) was.mesh.visible = false;
				if (part) part.mesh.visible = true;
				this.shown[i] = part;
			}
			if (!part) continue;
			part.attachment.computeWorldVertices(slot, part.attachment.getOffsets(pose), part.positions, 0, 2);
			for (let k = 1; k < 8; k += 2) part.positions[k] = -part.positions[k];
			part.mesh.alpha = pose.color.a;
			part.mesh.geometry.getBuffer('aPosition').update();
		}
	}

	/** The clip on the base track, or null between clips. */
	current() {
		return this.state.getTrack(0)?.animation?.name ?? null;
	}

	/**
	 * Play `name` once (or looping) now, then each of `then` in turn; the last one loops.
	 * `snap` starts the clip on its own first frame with no blend from the pose before it — for a clip that
	 * begins while the figure is hidden (trans_back after the release: blended, the thrown-up arm was seen
	 * dropping to the waist during the fade-in).
	 */
	play(name: string, then: string[] = ['idle'], loop = false, snap = false) {
		const entry = this.state.setAnimation(0, name, loop);
		if (snap) entry.mixDuration = 0;
		then.forEach((next, i) => this.state.addAnimation(0, next, i === then.length - 1, 0));
	}

	/** Replace whatever is queued after the current clip. */
	queue(names: string[]) {
		const current = this.state.getTrack(0);
		if (current) this.state.clearNext(current);
		names.forEach((next, i) => this.state.addAnimation(0, next, i === names.length - 1, 0));
	}

	destroy() {
		this.state.clearTracks();
		this.onEvent = null;
		for (const { mesh } of this.parts.values()) mesh.geometry.destroy();
		this.view.removeFromParent();
		// the atlas belongs to the asset loader; only this figure's meshes go
		this.view.destroy({ children: true });
	}
}
