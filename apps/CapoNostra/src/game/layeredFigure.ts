import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
import {
	buildWeightIndex,
	composeBoneMatrices,
	skinVertices,
	type CastReactionKind,
	type MeshRig,
	type ReactionTier,
} from './castMotion';

/**
 * A layered cast figure: one continuous mesh per layer, one set of bone
 * matrices and one reaction clock. Ported from Hard Time's layeredFigure.ts
 * with two changes:
 *
 *  - Textures are CROPPED to each layer's ink (design/build_cast_layers_runtime.py).
 *    Vertices stay in the 1024x2048 canvas space the rig and the motion gate
 *    use; only the UVs are mapped into the crop. Full-canvas textures would
 *    have been ~260 MB of GPU memory across both figures and three FG tiers.
 *  - The reaction tables are per figure (layeredCastMotion.ts), and textures can
 *    be swapped live for the FG tier variants, which share geometry and alpha.
 */
export type LayeredRig = {
	version: number;
	size: [number, number];
	figure_box: [number, number, number, number];
	order: string[];
	variants?: string[];
	layers: { name: string; texture: string; crop: [number, number, number, number]; rig: MeshRig }[];
};

export class LayeredFigure {
	readonly view = new Container({ label: 'capo-layered-cast' });
	readonly figureBox: [number, number, number, number];
	private readonly parts: {
		name: string;
		rest: Float32Array;
		positions: Float32Array;
		weights: ReturnType<typeof buildWeightIndex>;
		mesh: Mesh;
		glow: Mesh;
	}[] = [];
	private readonly matrices: Float32Array[];
	private readonly chain: Float32Array[];
	private readonly commonRig: MeshRig;
	private start: number | null = null;
	private kind: CastReactionKind = 'win';
	private speed = 1;

	constructor(
		manifest: LayeredRig,
		textures: Record<string, Texture>,
		private readonly tiers: Record<CastReactionKind, ReactionTier>,
	) {
		if (!manifest.layers.length) throw new Error('Cast rig has no layers');
		this.commonRig = manifest.layers[0].rig;
		this.figureBox = manifest.figure_box;
		this.matrices = this.commonRig.bones.map(() => new Float32Array(6));
		this.chain = this.commonRig.bones.map(() => new Float32Array(6));
		for (const name of manifest.order) {
			const part = manifest.layers.find((layer) => layer.name === name);
			if (!part || !textures[name]) throw new Error(`Missing cast layer: ${name}`);
			const rig = part.rig;
			const [cx, cy, cw, ch] = part.crop;
			const rest = new Float32Array(rig.verts.flat());
			const positions = new Float32Array(rest);
			// Canvas-space vertices, UVs into the cropped texture. A vertex outside
			// the crop samples past the texture edge, which is transparent padding
			// in the crop (build_cast_layers_runtime.py pads by 4 px) and clamps.
			const uvs = new Float32Array(rig.verts.flatMap(([x, y]) => [(x - cx) / cw, (y - cy) / ch]));
			const geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(rig.tris.flat()) });
			const mesh = new Mesh({ geometry, texture: textures[name] });
			mesh.label = `cast-${name}`;
			const glow = new Mesh({ geometry, texture: textures[name] });
			glow.label = `cast-${name}-glow`;
			glow.blendMode = 'add';
			glow.alpha = 0;
			this.view.addChild(mesh, glow);
			this.parts.push({ name, rest, positions, weights: buildWeightIndex(rig), mesh, glow });
		}
	}

	/** Swap to another texture set with the same crops (an FG tier variant). */
	setTextures(textures: Record<string, Texture>) {
		for (const part of this.parts) {
			const texture = textures[part.name];
			if (!texture) continue;
			part.mesh.texture = texture;
			part.glow.texture = texture;
		}
	}

	react(kind: CastReactionKind, atMs = performance.now(), speed = 1) {
		this.kind = kind;
		this.start = atMs;
		this.speed = Number.isFinite(speed) && speed > 0 ? speed : 1;
	}

	update(timeMs: number) {
		const tier = this.tiers[this.kind];
		const durationMs = tier.durationMs / this.speed;
		const tail = Math.max(0, ...Object.values(tier.bones).map(([, lag]) => lag)) / this.speed;
		if (this.start !== null && timeMs - this.start >= durationMs + tail) this.start = null;
		const intensity = composeBoneMatrices(
			this.commonRig,
			{
				timeMs,
				tier,
				reactionAge: this.start === null ? null : timeMs - this.start,
				durationMs,
				speed: this.speed,
				motionScale: 1,
			},
			this.matrices,
			this.chain,
		);
		for (const part of this.parts) {
			skinVertices(part.rest, part.weights, this.matrices, part.positions);
			part.mesh.geometry.getBuffer('aPosition').update();
			part.glow.alpha = (tier.glow ?? 0) * intensity;
		}
	}
}
