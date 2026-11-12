import { Container, Mesh, MeshGeometry, type Texture } from "pixi.js";

import {
  TIERS,
  WIN_REACTION,
  buildWeightIndex,
  composeBoneMatrices,
  skinVertices,
  type CastReactionKind,
  type MeshRig,
  type ReactionTier,
} from "./castMotion";

export type { MeshRig } from "./castMotion";

/**
 * The prisoner, as one continuous skinned mesh.
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
  private readonly weightIndex: { bones: number[][]; values: number[][] };
  private readonly matrices: Float32Array[];
  // What each bone's children compose against — rotation and translation, no
  // squash and stretch. See composeBoneMatrices for why the two are separate.
  private readonly chain: Float32Array[];
  private reactionStart: number | null = null;
  private reactionTier: ReactionTier = WIN_REACTION;
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

    this.weightIndex = buildWeightIndex(rig);

    const geometry = new MeshGeometry({
      positions: this.positions,
      uvs,
      indices,
    });
    this.mesh = new Mesh({ geometry, texture });
    this.matrices = rig.bones.map(() => new Float32Array(6));
    this.chain = rig.bones.map(() => new Float32Array(6));
    this.view.addChild(this.mesh);

    // The glow: the SAME texture drawn again over itself with additive
    // blending, its alpha ridden up and down by the reaction envelope.
    //
    // Straight out of the reference teardown (`character-reactions.md` §4c),
    // which calls this the cheapest of their three ways of making a reaction
    // feel big: five of their glow slots point at the same attachment as the
    // body and differ only by `"blend": "additive"`. No bone moves for it and
    // no new art is drawn for it.
    //
    // `geometry` is the SAME instance the body mesh uses, so this deforms with
    // the body for free — one skinning pass still feeds both. Alpha 0 until a
    // tier with a `glow` fires, so games and tiers that do not ask for it pay
    // nothing but one extra draw call of a fully transparent mesh.
    this.glow = new Mesh({ geometry, texture });
    this.glow.blendMode = 'add';
    this.glow.alpha = 0;
    this.view.addChild(this.glow);
  }

  react(kind: CastReactionKind, atMs = performance.now(), speed = 1) {
    const tier = TIERS[kind] ?? WIN_REACTION;
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
    if (reactionAge !== null && reactionAge >= durationMs + this.reactionTailMs)
      this.reactionStart = null;

    // Every matrix, and the body's own lag-free share of the envelope. Both
    // come out of castMotion.ts so that design/check_cast_motion.mjs poses the
    // mesh with THIS code rather than a copy of it — see the note above
    // `composeBoneMatrices` for why that matters.
    const bodyReaction = composeBoneMatrices(
      this.rig,
      {
        timeMs,
        tier,
        reactionAge,
        durationMs,
        speed: this.reactionSpeed,
        motionScale: this.motionScale,
      },
      this.matrices,
      this.chain,
    );

    skinVertices(this.rest, this.weightIndex, this.matrices, this.positions);
    this.mesh.geometry.getBuffer("aPosition").update();

    // Glow rides the body's own envelope — no lag, so the flash is at its
    // brightest with the pose rather than trailing the hands. Only the tiers
    // that ask for it (currently the feature trigger) light at all.
    this.glow.alpha = (tier.glow ?? 0) * bodyReaction;
  }
}
