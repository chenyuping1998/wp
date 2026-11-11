import { AnimationState, AnimationStateData, Physics, type Skeleton } from '@esotericsoftware/spine-core';
import type { CastSpineJson } from './spineCastData';
import type { CastReactionKind } from './castMotion';

/**
 * Animation playback for the Spine cast, kept free of Pixi so the QA simulator
 * (design/cast_v6/sim.mjs) drives the exact same state machine the game does.
 *
 * Two layouts:
 * - `replace` (v5): a reaction replaces the idle on track 0, then the idle is
 *   queued again from its first frame.
 * - `overlay` (v6, Iron Jaw style): the idle runs on track 0 for the whole
 *   session on one clock and is never restarted; reactions and the occasional
 *   idle variation play on track 1 over it and cross-fade back into the idle's
 *   CURRENT phase.
 */
export class CastDirector {
  readonly state: AnimationState;
  private readonly meta: CastSpineJson['turf'];
  private readonly random: () => number;
  private loopsUntilVariant = 0;
  private lastIdleLoop = 0;
  private busyUntil = 0;
  private releaseAt = 0;
  private queued: { name: string; rate: number } | null = null;
  private clock = 0;
  private variantIndex = 0;
  private readonly skeleton: Skeleton;

  constructor(skeleton: Skeleton, meta: CastSpineJson['turf'], random: () => number = Math.random) {
    this.skeleton = skeleton;
    this.meta = meta;
    this.random = random;
    const stateData = new AnimationStateData(skeleton.data);
    stateData.defaultMix = meta.reactions ? 0.18 : 0.12;
    this.state = new AnimationState(stateData);
    skeleton.setupPose();
    skeleton.updateWorldTransform(Physics.none);
    const idle = meta.idle ?? 'idle';
    this.state.setAnimation(0, idle, true).timeScale = meta.speed?.[idle] ?? 1;
    this.scheduleVariant();
  }

  private get overlay() {
    return this.meta.layering === 'overlay';
  }

  private scheduleVariant() {
    const [lo, hi] = this.meta.variantEvery ?? [3, 5];
    this.loopsUntilVariant = lo + Math.floor(this.random() * (hi - lo + 1));
  }

  /** Plays `name` on the overlay track with the rig's own mix times (also used by QA). */
  overlayPlay(name: string, timeScale: number) {
    const mix = this.meta.mix ?? { in: 0.12, out: 0.22 };
    const track = this.state.getTrack(1);
    // A fresh overlay starting from nothing mixes in from the running idle.
    if (!track) this.state.setEmptyAnimation(1, 0);
    const entry = this.state.setAnimation(1, name, false);
    entry.timeScale = timeScale;
    entry.mixDuration = mix.in;
    // Spine starts this mix-out `mix.out` before the clip's end (track time).
    this.state.addEmptyAnimation(1, mix.out, 0);
    this.busyUntil = this.clock + entry.animation!.duration / timeScale;
    this.releaseAt = this.clock + Math.max(0, entry.animation!.duration - mix.out) / timeScale;
  }

  react(kind: CastReactionKind, speed = 1) {
    const timeScale = Number.isFinite(speed) && speed > 0 ? speed : 1;
    const name = this.meta.reactions?.[kind];
    if (!name) return;
    const rate = timeScale * (this.meta.speed?.[name] ?? 1);
    if (this.overlay) {
      // A punch is never cut off mid-strike: while one is playing, the next
      // reaction waits (only the latest is kept) and starts as the current one
      // eases out. Cutting in cross-faded a half-extended arm into a new
      // wind-up, poses no clip contains (and the sleeve folded there).
      if (this.clock < this.releaseAt) {
        this.queued = { name, rate };
        return;
      }
      this.overlayPlay(name, rate);
      return;
    }
    const idle = this.meta.idle ?? 'idle';
    const entry = this.state.setAnimation(0, name, false);
    entry.timeScale = rate;
    entry.mixDuration = 0.15;
    const back = this.state.addAnimation(0, idle, true, 0);
    back.mixDuration = 0.35;
    back.timeScale = this.meta.speed?.[idle] ?? 1;
  }

  /** Advances by `delta` seconds and poses the skeleton (physics included). */
  step(delta: number) {
    this.clock += delta;
    if (this.queued && this.clock >= this.releaseAt) {
      const { name, rate } = this.queued;
      this.queued = null;
      this.overlayPlay(name, rate);
    }
    this.state.update(delta);
    if (this.overlay && this.meta.variants?.length) {
      const idleTrack = this.state.getTrack(0);
      const loop = idleTrack ? Math.floor(idleTrack.trackTime / Math.max(1e-6, idleTrack.animationEnd)) : 0;
      if (loop !== this.lastIdleLoop) {
        this.lastIdleLoop = loop;
        if (--this.loopsUntilVariant <= 0 && this.clock >= this.busyUntil) {
          const variants = this.meta.variants;
          const name = variants[this.variantIndex++ % variants.length];
          this.overlayPlay(name, this.meta.speed?.[name] ?? 1);
          this.scheduleVariant();
        }
      }
    }
    this.state.apply(this.skeleton);
    this.skeleton.update(delta);
    this.skeleton.updateWorldTransform(Physics.update);
  }
}
