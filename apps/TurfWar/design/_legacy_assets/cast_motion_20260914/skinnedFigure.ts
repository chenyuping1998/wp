import { Container, Mesh, MeshGeometry, type Texture } from "pixi.js";

import {
  DEG,
  IDLE_BY_POSE,
  TIERS_BY_POSE,
  idleAngle,
  reactionEnvelope,
  type CastPose,
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

/**
 * Kingpin, as one continuous skinned mesh.
 *
 * This class is a RENDERER and nothing else. Every number it animates lives in
 * game/castMotion.ts, which imports nothing and is therefore loadable by
 * design/check_cast_motion.mjs under bare node — that gate is the only reason
 * anyone can believe the tables. It also deliberately has no import on
 * `stateBetDerived` / `featureTimeScale`: turbo is state the CALLER reads and
 * hands to `react()`, the same way `atMs` is.
 */
export class SkinnedFigure {
  readonly view = new Container();
  readonly mesh: Mesh;
  /** Additive copy of `mesh`, sharing its geometry — see the constructor. */
  readonly glow: Mesh;
  readonly figureBox: [number, number, number, number];

  private readonly rest: Float32Array;
  private readonly positions: Float32Array;
  private readonly weightedBones: number[][];
  private readonly weightedValues: number[][];
  private readonly matrices: Float32Array[];
  private reactionStart: number | null = null;
  private reactionTier: ReactionTier = TIERS_BY_POSE.base.win;
  // How long past `durationMs` the last-starting bone is still moving. The
  // reaction may not be cleared before then or the laggards are cut mid-swing.
  private reactionTailMs = 0;
  // Turbo shortens this beat the same way it shortens everything the reaction
  // rides alongside (the win volley, the FG trigger sequence). 1 = normal,
  // >1 = faster. The duration and every lag are divided by it; the snap/hold
  // FRACTIONS and every amplitude are untouched, so turbo makes the reaction
  // quicker, never smaller.
  private reactionDurationMs = 0;
  private reactionSpeed = 1;

  constructor(
    private readonly rig: MeshRig,
    texture: Texture,
    /** See MOTION_SCALE — how much of the shared tables this artwork can carry
     *  before its own extremities distort. */
    private readonly motionScale: number = 1,
    /** Which drawing the rig was fitted to — picks its own idle and tiers,
     *  measured against that drawing's limits (game/castMotion.ts). */
    readonly pose: CastPose = "base",
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

    // The glow: the SAME texture drawn again over itself with additive
    // blending, its alpha ridden up and down by the reaction envelope. Straight
    // out of the reference teardown (`character-reactions.md` §4c), which calls
    // this the cheapest of their three ways of making a reaction feel big — no
    // bone moves for it and no new art is drawn for it.
    //
    // `geometry` is the SAME instance the body mesh uses, so this deforms with
    // the body for free: one skinning pass still feeds both. Alpha 0 until a
    // tier with a `glow` fires.
    this.glow = new Mesh({ geometry, texture });
    this.glow.blendMode = 'add';
    this.glow.alpha = 0;
    this.view.addChild(this.glow);
  }

  react(kind: CastReactionKind, atMs = performance.now(), speed = 1) {
    const tier = TIERS_BY_POSE[this.pose][kind] ?? TIERS_BY_POSE[this.pose].win;
    this.reactionStart = atMs;
    this.reactionTier = tier;
    this.reactionSpeed = speed > 0 ? speed : 1;
    this.reactionDurationMs = tier.durationMs / this.reactionSpeed;
    let maxLag = 0;
    for (const bone of this.rig.bones) {
      maxLag = Math.max(maxLag, tier.bones[bone.name]?.[1] ?? 0);
    }
    this.reactionTailMs = maxLag / this.reactionSpeed;
  }

  update(timeMs: number) {
    const tier = this.reactionTier;
    const reactionAge =
      this.reactionStart === null ? null : timeMs - this.reactionStart;
    const durationMs = this.reactionDurationMs;
    // The body's own share of the envelope, with no lag — it drives the rigid
    // rise, stretch and lean, and those should start WITH the body rather than
    // trail it.
    let bodyReaction = 0;
    if (reactionAge !== null) {
      bodyReaction = reactionEnvelope(
        reactionAge / durationMs,
        tier.snap,
        tier.hold,
      );
      if (reactionAge >= durationMs + this.reactionTailMs)
        this.reactionStart = null;
    }

    const [boxX0, boxY0, boxX1, boxY1] = this.figureBox;
    const figureWidth = boxX1 - boxX0;
    const figureHeight = boxY1 - boxY0;
    for (let index = 0; index < this.rig.bones.length; index += 1) {
      const bone = this.rig.bones[index];
      const idle = idleAngle(IDLE_BY_POSE[this.pose][bone.name] ?? [0, 0, 2000, 0], timeMs);
      // Each bone rides the same envelope, started `lag` ms later, so the pose
      // travels out along the chain instead of arriving all at once. Hips
      // first, the head after, the hands last.
      let reaction = 0;
      const spec = tier.bones[bone.name];
      if (spec && reactionAge !== null) {
        const [amplitude, lagMs] = spec;
        const envelope = reactionEnvelope(
          (reactionAge - lagMs / this.reactionSpeed) / durationMs,
          tier.snap,
          tier.hold,
        );
        reaction = amplitude * this.motionScale * envelope;
        // The strain in the hold. Scaled BY the envelope so it fades in and out
        // with the pose rather than appearing from nothing and being cut off,
        // and driven off the reaction's own clock so every bone in the tremor
        // shakes in step — see ReactionTier.tremor.
        const tremor = tier.tremor;
        if (tremor && envelope > 0 && tremor.bones.includes(bone.name)) {
          const period = tremor.periodMs / this.reactionSpeed;
          reaction +=
            tremor.deg *
            this.motionScale *
            envelope *
            Math.sin((reactionAge / period) * Math.PI * 2);
        }
      }
      const angle = (idle + reaction) * DEG;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      let offsetX = 0;
      let offsetY = 0;
      // Rise, lean and stretch ride the root, so they move the ENTIRE figure
      // rigidly — no joint bends, so no mesh distortion at any amplitude. This
      // is the cheapest travel available and it is what makes the ladder
      // legible when the joints themselves are all inside a few degrees.
      //
      // The stretch is not decoration on top of the rise. Translation alone
      // reads as the whole man floating; scaling him vertically about the root
      // — which sits below the shoes — grows him out of the floor instead, so
      // the feet stay put while the head carries the travel.
      let scaleY = 1;
      if (index === 0 && bodyReaction > 0) {
        offsetX = figureWidth * tier.lean * this.motionScale * bodyReaction;
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
        bone.x - a * bone.x - b * bone.y + offsetX,
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

    // The perspective push, applied AFTER the whole hierarchy is composed and
    // written straight into one bone's final matrix.
    //
    // That ordering is the entire point. A translation applied before the
    // hierarchy pass would be inherited by neck, head and the arms and would
    // carry the figure — which is what the rise/lean it replaces used to do.
    // Written afterwards, it reaches only the vertices WEIGHTED to this bone:
    // the torso swells toward the viewer and nothing else moves. That is the
    // reference's `*_persp` bone, which is likewise parented under the spine
    // and likewise has no children of its own.
    const push = tier.push;
    if (push && bodyReaction > 0) {
      const pushIndex = this.rig.bones.findIndex((bone) => bone.name === push.bone);
      if (pushIndex >= 0) {
        const matrix = this.matrices[pushIndex];
        matrix[2] += figureWidth * push.x * this.motionScale * bodyReaction;
        matrix[5] += figureHeight * push.y * this.motionScale * bodyReaction;
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

    // Glow rides the body's own envelope — no lag, so the flash is brightest
    // with the pose rather than trailing the hands.
    this.glow.alpha = (tier.glow ?? 0) * bodyReaction;
  }
}
