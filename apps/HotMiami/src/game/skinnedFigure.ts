import { Container, Mesh, MeshGeometry, type Texture } from "pixi.js";

import {
  DEG,
  IDLE,
  TIERS,
  WIN_REACTION,
  idleAngle,
  reactionEnvelope,
  type CastReactionKind,
  type ReactionTier,
} from "./castMotion";

type Bone = { name: string; x: number; y: number; parent: number };

export type MeshRig = {
  size: [number, number];
  figure_box: [number, number, number, number];
  verts: [number, number][];
  tris: [number, number, number][];
  weights: number[][];
  bones: Bone[];
};


export class SkinnedFigure {
  readonly view = new Container();
  readonly mesh: Mesh;
  readonly figureBox: [number, number, number, number];

  private readonly rest: Float32Array;
  private readonly positions: Float32Array;
  private readonly weightedBones: number[][];
  private readonly weightedValues: number[][];
  private readonly matrices: Float32Array[];
	private reactionStart: number | null = null;
	private reactionTier: ReactionTier = WIN_REACTION;

  constructor(
    private readonly rig: MeshRig,
    texture: Texture,
    /** See MOTION_SCALE — how much of the shared tables this artwork can carry
     *  before its own extremities distort. */
    private readonly motionScale: number = 1,
  ) {
    const [width, height] = rig.size;
    this.figureBox = rig.figure_box;
    this.rest = new Float32Array(rig.verts.length * 2);
    const uvs = new Float32Array(rig.verts.length * 2);
    for (let index = 0; index < rig.verts.length; index += 1) {
      const [x, y] = rig.verts[index];
      this.rest[index * 2] = x;
      this.rest[index * 2 + 1] = y;
      uvs[index * 2] = x / width;
      uvs[index * 2 + 1] = y / height;
    }
    this.positions = new Float32Array(this.rest);

    const indices = new Uint32Array(rig.tris.length * 3);
    rig.tris.forEach((triangle, index) => {
      indices[index * 3] = triangle[0];
      indices[index * 3 + 1] = triangle[1];
      indices[index * 3 + 2] = triangle[2];
    });

    this.weightedBones = [];
    this.weightedValues = [];
    for (const row of rig.weights) {
      const bones: number[] = [];
      const values: number[] = [];
      row.forEach((weight, boneIndex) => {
        if (weight > 0.002) {
          bones.push(boneIndex);
          values.push(weight);
        }
      });
      this.weightedBones.push(bones);
      this.weightedValues.push(values);
    }

    const geometry = new MeshGeometry({
      positions: this.positions,
      uvs,
      indices,
    });
    this.mesh = new Mesh({ geometry, texture });
    this.matrices = rig.bones.map(() => new Float32Array(6));
    this.view.addChild(this.mesh);
  }

	react(kind: CastReactionKind, atMs = performance.now()) {
		this.reactionStart = atMs;
		this.reactionTier = TIERS[kind] ?? WIN_REACTION;
  }

  update(timeMs: number) {
    const tier = this.reactionTier;
    // The whole-body envelope, used for the rise and the stretch. Individual
    // bones each evaluate their own, offset by their lag.
    let bodyReaction = 0;
    if (this.reactionStart !== null) {
      const age = (timeMs - this.reactionStart) / tier.durationMs;
      bodyReaction = reactionEnvelope(age);
      // The longest per-bone lag has to finish too, or the hair is cut off
      // mid-swing when the body has already settled.
      if (age >= 1.4) this.reactionStart = null;
    }

    const [, boxY0, , boxY1] = this.figureBox;
    const figureHeight = boxY1 - boxY0;
    for (let index = 0; index < this.rig.bones.length; index += 1) {
      const bone = this.rig.bones[index];
      const idle = idleAngle(IDLE[bone.name] ?? [0, 0, 2000, 0], timeMs);
      // Each bone runs the same envelope, started `lag` milliseconds later, so
      // the pose travels along the chain instead of arriving all at once.
      let reaction = 0;
      const spec = tier.bones[bone.name];
      if (spec && this.reactionStart !== null) {
        const [amplitude, lagMs] = spec;
        reaction =
          amplitude *
          this.motionScale *
          reactionEnvelope((timeMs - this.reactionStart - lagMs) / tier.durationMs);
      }
      const angle = (idle + reaction) * DEG;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      let offsetY = 0;
      // Rise and stretch ride the root, so they move the ENTIRE figure rigidly
      // — no joint bends, so no mesh distortion at any amplitude. This is the
      // cheapest travel available and it is why the beat reads without pushing
      // any single joint near its measured limit.
      let scaleY = 1;
      if (index === 0 && bodyReaction > 0) {
        offsetY = figureHeight * -tier.rise * this.motionScale * bodyReaction;
        scaleY = 1 + tier.stretch * this.motionScale * bodyReaction;
      }
      const a = cosine;
      const b = -sine * scaleY;
      const d = sine;
      const e = cosine * scaleY;
      const local = [
        a,
        b,
        bone.x - a * bone.x - b * bone.y,
        d,
        e,
        bone.y - d * bone.x - e * bone.y + offsetY,
      ];
      const matrix = this.matrices[index];
      if (bone.parent < 0) {
        matrix.set(local);
      } else {
        const parent = this.matrices[bone.parent];
        matrix[0] = parent[0] * local[0] + parent[1] * local[3];
        matrix[1] = parent[0] * local[1] + parent[1] * local[4];
        matrix[2] = parent[0] * local[2] + parent[1] * local[5] + parent[2];
        matrix[3] = parent[3] * local[0] + parent[4] * local[3];
        matrix[4] = parent[3] * local[1] + parent[4] * local[4];
        matrix[5] = parent[3] * local[2] + parent[4] * local[5] + parent[5];
      }
    }

    for (let vertex = 0; vertex < this.rig.verts.length; vertex += 1) {
      const x = this.rest[vertex * 2];
      const y = this.rest[vertex * 2 + 1];
      let animatedX = 0;
      let animatedY = 0;
      const bones = this.weightedBones[vertex];
      const values = this.weightedValues[vertex];
      for (let weightIndex = 0; weightIndex < bones.length; weightIndex += 1) {
        const matrix = this.matrices[bones[weightIndex]];
        const weight = values[weightIndex];
        animatedX += (matrix[0] * x + matrix[1] * y + matrix[2]) * weight;
        animatedY += (matrix[3] * x + matrix[4] * y + matrix[5]) * weight;
      }
      this.positions[vertex * 2] = animatedX;
      this.positions[vertex * 2 + 1] = animatedY;
    }
    this.mesh.geometry.getBuffer("aPosition").update();
  }
}
