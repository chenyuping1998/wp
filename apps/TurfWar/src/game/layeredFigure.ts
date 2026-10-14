/**
 * Layered cast figure for Pixi v8 — one mesh per delivered layer, one shared
 * skeleton, one reaction clock. Copy into the game's src/game/ next to its
 * castMotion.ts (generalised from Hard Time's shipped prisoner, 2026-09-25).
 *
 *   const fig = new LayeredFigure(manifest, textures, TIERS, { label: 'cast' });
 *   stage.addChild(fig.view); ticker.add(() => fig.update(performance.now()));
 *   fig.react('trigger', performance.now(), speed);
 *
 * `manifest` is layers.manifest.json from build_layered_rig.py. `textures`
 * maps layer name -> Texture (body, head, arm_l, arm_r, fingers_*, prop_*,
 * dangle_*). `tiers` is the game's { win, winBig, trigger } table.
 * `poseState` adds any extra PoseState fields that game's castMotion needs
 * (Turf War's takes `pose`).
 *
 * The posing is the game's own castMotion.composeBoneMatrices — the SAME
 * function check_layered_cast.mjs measures — so the gate and the screen
 * cannot drift apart. It must take the optional 4th `chain` argument (the
 * squash-and-stretch channel's second matrix set).
 */
import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
import {
  buildWeightIndex, composeBoneMatrices, skinVertices,
  type CastReactionKind, type MeshRig, type ReactionTier,
} from './castMotion';

export type LayeredManifest = {
  version: number;
  size: [number, number];
  figure_box: [number, number, number, number];
  order: string[];
  layers: { name: string; texture: string; crop?: [number, number, number, number]; rig: MeshRig }[];
};

type Part = {
  rest: Float32Array;
  positions: Float32Array;
  weights: ReturnType<typeof buildWeightIndex>;
  mesh: Mesh;
  glow: Mesh;
};

export class LayeredFigure {
  readonly view: Container;
  readonly figureBox: [number, number, number, number];
  private readonly parts: Part[] = [];
  private readonly rig: MeshRig;
  private readonly matrices: Float32Array[];
  private readonly chain: Float32Array[];
  private start: number | null = null;
  private kind: CastReactionKind = 'win';
  private speed = 1;

  constructor(
    manifest: LayeredManifest,
    textures: Record<string, Texture>,
    private readonly tiers: Record<CastReactionKind, ReactionTier>,
    private readonly options: { label?: string; poseState?: Record<string, unknown> } = {},
  ) {
    this.view = new Container({ label: options.label ?? 'layered-cast' });
    this.rig = manifest.layers[0].rig;
    this.figureBox = manifest.figure_box;
    this.matrices = this.rig.bones.map(() => new Float32Array(6));
    this.chain = this.rig.bones.map(() => new Float32Array(6));
    for (const name of manifest.order) {
      const layer = manifest.layers.find((l) => l.name === name);
      const texture = textures[name];
      if (!layer || !texture) throw new Error(`Layered cast is missing layer "${name}"`);
      const rig = layer.rig;
      const rest = new Float32Array(rig.verts.flat());
      const positions = new Float32Array(rest);
      const [cx, cy, cw, ch] = layer.crop ?? [0, 0, ...rig.size];
      const uvs = new Float32Array(rig.verts.flatMap(([x, y]) => [(x - cx) / cw, (y - cy) / ch]));
      const geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(rig.tris.flat()) });
      const mesh = new Mesh({ geometry, texture });
      mesh.label = `${this.view.label}-${name}`;
      // Additive copy sharing the geometry: the trigger's flash deforms with the body for free.
      const glow = new Mesh({ geometry, texture });
      glow.blendMode = 'add';
      glow.alpha = 0;
      this.view.addChild(mesh, glow);
      this.parts.push({ rest, positions, weights: buildWeightIndex(rig), mesh, glow });
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
      this.rig,
      {
        ...(this.options.poseState ?? {}),
        timeMs,
        tier,
        reactionAge: this.start === null ? null : timeMs - this.start,
        durationMs,
        speed: this.speed,
        motionScale: 1,
      } as Parameters<typeof composeBoneMatrices>[1],
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
