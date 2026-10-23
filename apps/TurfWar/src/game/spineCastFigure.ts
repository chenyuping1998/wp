import { AnimationState, AnimationStateData, MeshAttachment, Physics, RegionAttachment } from '@esotericsoftware/spine-core';
import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
import { readCastSkeleton, type CastSpineJson } from './spineCastData';
import type { CastReactionKind } from './castMotion';

type Part = { attachment: MeshAttachment | RegionAttachment; slotIndex: number; positions: Float32Array; mesh: Mesh };

/** Spine 4.3 cast renderer, isolated from the game's existing 4.2 symbol runtime. */
export class SpineCastFigure {
  readonly view: Container;
  readonly figureBox: [number, number, number, number];
  readonly envelope: [number, number];
  readonly skeleton: ReturnType<typeof readCastSkeleton>;
  readonly state: AnimationState;
  private lastMs: number | null = null;
  private readonly parts: Part[] = [];
  private readonly origin: [number, number];
  private readonly reactions: Record<string, string> | null;
  private readonly idle: string;
  private readonly speed: Record<string, number>;

  constructor(json: CastSpineJson, textures: Record<string, Texture>, label: string) {
    this.view = new Container({ label });
    this.figureBox = json.turf.figureBox;
    this.envelope = json.turf.envelope;
    this.origin = json.turf.origin ?? [0, 0];
    this.reactions = json.turf.reactions ?? null;
    this.idle = json.turf.idle ?? 'idle';
    this.speed = json.turf.speed ?? {};
    this.skeleton = readCastSkeleton(json);
    const stateData = new AnimationStateData(this.skeleton.data);
    stateData.defaultMix = this.reactions ? 0.18 : 0.12;
    this.state = new AnimationState(stateData);
    this.skeleton.setupPose();
    this.skeleton.updateWorldTransform(Physics.none);
    for (const slot of this.skeleton.slots) {
      const attachment = slot.getAppliedPose().attachment;
      const texture = textures[slot.data.name];
      if (!texture) throw new Error(`Missing cast texture: ${slot.data.name}`);
      let geometry: MeshGeometry;
      let positions: Float32Array;
      if (attachment instanceof MeshAttachment) {
        positions = new Float32Array(attachment.worldVerticesLength);
        geometry = new MeshGeometry({ positions,
          uvs: new Float32Array(attachment.regionUVs), indices: new Uint32Array(attachment.triangles) });
      } else if (attachment instanceof RegionAttachment) {
        attachment.updateSequence();
        positions = new Float32Array(8);
        geometry = new MeshGeometry({ positions, uvs: new Float32Array(attachment.sequence.getUVs(0)),
          indices: new Uint32Array([0, 1, 2, 2, 3, 0]) });
      } else throw new Error(`Missing cast attachment: ${slot.data.name}`);
      const mesh = new Mesh({ geometry, texture });
      mesh.label = `${label}-${slot.data.name}`;
      this.view.addChild(mesh);
      this.parts.push({ attachment, slotIndex: slot.data.index, positions, mesh });
    }
    this.state.setAnimation(0, this.idle, true).timeScale = this.speed[this.idle] ?? 1;
    this.update(0);
    this.lastMs = null;
  }

  react(kind: CastReactionKind, _atMs = performance.now(), speed = 1) {
    const timeScale = Number.isFinite(speed) && speed > 0 ? speed : 1;
    if (this.reactions) {
      // Full-body kit moves (punch / celebrate / jump) replace the guard, then
      // ease back into it.
      const name = this.reactions[kind];
      if (!name) return;
      const entry = this.state.setAnimation(0, name, false);
      entry.timeScale = timeScale * (this.speed[name] ?? 1);
      entry.mixDuration = 0.15;
      const back = this.state.addAnimation(0, this.idle, true, 0);
      back.mixDuration = 0.35;
      back.timeScale = this.speed[this.idle] ?? 1;
      return;
    }
    const entry = this.state.setAnimation(1, kind, false);
    entry.additive = true;
    entry.mixDuration = 0.06;
    entry.timeScale = timeScale;
    this.state.addEmptyAnimation(1, 0.14 / entry.timeScale, 0);
  }

  update(timeMs: number) {
    const delta = this.lastMs === null ? 0 : Math.max(0, Math.min(0.1, (timeMs - this.lastMs) / 1000));
    this.lastMs = timeMs;
    this.state.update(delta);
    this.state.apply(this.skeleton);
    this.skeleton.update(delta);
    this.skeleton.updateWorldTransform(Physics.update);
    const [ox, oy] = this.origin;
    for (const { attachment, slotIndex, positions, mesh } of this.parts) {
      const slot = this.skeleton.slots[slotIndex];
      if (attachment instanceof RegionAttachment)
        attachment.computeWorldVertices(slot, attachment.getOffsets(slot.getAppliedPose()), positions, 0, 2);
      else attachment.computeWorldVertices(this.skeleton, slot, 0, positions.length, positions, 0, 2);
      // Spine y-up -> the existing Turf layout's canvas y-down coordinate space.
      for (let i = 0; i < positions.length; i += 2) {
        positions[i] += ox;
        positions[i + 1] = oy - positions[i + 1];
      }
      mesh.geometry.getBuffer('aPosition').update();
    }
  }

  destroy() {
    this.state.clearTracks();
    for (const { mesh } of this.parts) mesh.geometry.destroy();
    this.view.removeFromParent();
    // Asset loader owns the shared textures; only release this instance's meshes.
    this.view.destroy({ children: true });
  }
}
