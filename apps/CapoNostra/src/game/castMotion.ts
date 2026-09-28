/**
 * Every number the Don's motion is made of, and nothing else.
 *
 * THIS MODULE MUST NOT IMPORT ANYTHING. design/check_cast_motion.mjs loads it
 * with bare node so it can MEASURE these tables instead of trusting them — the
 * same arrangement game/idleSway.ts already has with check_idle_sway.mjs. One
 * pixi import here and that gate cannot run at all. It must also stay clear of
 * the turbo modules (`state-shared`, `game/timeScale`): the speed a reaction
 * runs at is read by the CALLER and passed into `react()`, never imported here.
 *
 * skinnedFigure.ts owns the rendering; this owns what the rendering is asked to
 * do. The split exists so the second one can be checked.
 *
 * ── 2026-09-20: BACK TO HOT MIAMI'S MOTION ──────────────────────────────────
 *
 * What was here between 2026-09-13 and 2026-09-19 derived every tier from a
 * transcription of Hacksaw's Miami rig (`REFERENCE_ROTATION` / `REFERENCE_SCALE`
 * / `fromReference`) and added a squash-and-stretch channel to carry it. The
 * user's verdict on the result, after the cut-layer evaluation built on the same
 * reference: 「完全不行，重來，回到類似 hot miami 的動態」.
 *
 * So the tables below are Hot Miami's, which shipped and passed review, with two
 * changes and nothing else:
 *
 *   1. NO `hair` BONE. Hot Miami's woman has one; the Don's hair is short and
 *      sits on the skull. The bone does not exist on this rig.
 *   2. THE RIGHT-SIDE SIGNS ARE NEGATIVE. On Hot Miami's rig positive opens the
 *      body on both sides; on this one it was MEASURED the other way —
 *      `arm_l` at +10deg throws that hand 44px outward, `arm_r` at -10deg throws
 *      its hand 32px outward. Same gesture, opposite sign, because the drawing
 *      is different. check_cast_motion rule 5 holds the convention.
 *
 * The amplitudes are Hot Miami's verbatim. MOTION_SCALE is NOT: Hot Miami's man
 * runs at 0.36 and the Don runs at 0.18, because his left forearm folds at
 * anything above 0.26. That is measured, the sweep is in MOTION_SCALE's own
 * comment, and it is a property of the drawing rather than of these tables.
 *
 * WHAT WENT WITH THE TRANSCRIPTION, and do not put it back without a reason
 * that is not "the reference does it":
 *
 *   - `scale` / `flutter` — per-bone squash and stretch and the bulge's shake.
 *     Hot Miami has no such channel; the life comes from the per-bone LAG below.
 *   - `push` / `tremor` — already unused before this change.
 *   - `lean` — the toward-the-board root translation. Hot Miami moves the root
 *     up (`rise`) and scales it (`stretch`) and nothing sideways.
 *
 * `glow` stays. It is a flash, not motion, it is already wired through
 * skinnedFigure.ts, and it was never part of what was wrong.
 */

export type MotionSpec = [
  amplitude: number,
  lagMs: number,
  periodMs: number,
  oddScale: number,
];

/** A reaction's per-bone amplitude in degrees, and how much LATER than the
 *  reaction's own start that bone begins moving.
 *
 *  The lag is the whole point. Every bone used to share one envelope, so the
 *  figure snapped into its pose as a single rigid unit — the read is a twitch,
 *  not a person. Measured off Hacksaw's Miami Mayhem cast: motion travels OUT
 *  along the chain, each link starting after the one it hangs from. Hips lead,
 *  the head arrives later, the hands last, because the hands are what the eye
 *  is on. check_cast_motion rule 3 holds the order. */
export type ReactionSpec = Record<string, [amplitudeDeg: number, lagMs: number]>;

/** One reaction tier.
 *
 *    bones      — what each joint does, and when it starts
 *    durationMs — the beat's length at speed 1 (turbo divides it)
 *    snap/hold  — fractions of the duration spent arriving, and the point the
 *                 release starts
 *
 *  and the two whole-body moves that cost NOTHING in mesh distortion, because
 *  they are rigid on the entire figure rather than a bend at a joint:
 *
 *    rise    — root translation UP, as a fraction of the figure box height
 *    stretch — root vertical SCALE, as a fraction
 *
 *  Miami Mayhem's own note on their breathing bone: translation alone "looks
 *  like the whole person is floating". The stretch is what plants it. */
export type ReactionTier = {
  bones: ReactionSpec;
  durationMs: number;
  snap: number;
  hold: number;
  rise: number;
  stretch: number;
  /**
   * Additive re-draw of the figure's own texture, peaking with the reaction.
   *
   * The reference's cheapest source of "size": several of their glow slots point
   * at the SAME attachment as the body, differing only by `"blend": "additive"`.
   * No bone moves, no new art is drawn — the same image again, added to itself,
   * is the flash. `skinnedFigure.ts` does exactly this with a second Mesh
   * sharing the first one's geometry, so it deforms with the body for free.
   *
   * 0 or omitted = no glow, which is right for the small tiers: a line win that
   * lights the man up would be louder than the win.
   */
  glow?: number;
  /** Per-bone squash and stretch at the peak, [along the bone, across it],
   *  times k. Arms only, and ACROSS rather than along — see ARM_BULGE. */
  scale?: { k: number; shape: Record<string, [along: number, across: number]> };
  /** A shake on the bulge while the pose holds (the reference's biceps
   *  trembling 1.40 <-> 1.52 every 2 frames). */
  flutter?: { depth: number; periodMs: number };
};

export const DEG = Math.PI / 180;
export const LOOP_MS = 8000;

// Idle envelope shape, and the timing every reaction tier uses. Hot Miami keeps
// one pair for all three tiers; so does this now.
export const SNAP = 0.18;
export const HOLD = 0.63;

/* THE IDLE — Hot Miami's table, minus the hair bone this rig does not have.
 *
 * Its own note: the reference rig's measured motion reduced to 55%, giving 0.42%
 * head travel and 0px at the feet — visible life without the large whole-body
 * sway that failed review.
 *
 * This is SMALLER than what it replaces, and that is the point. The
 * transcription's idle ran the shoulders at 1.6deg, which is 32% of this
 * figure's 4.5deg shoulder limit spent standing still; Hot Miami's 0.88 leaves
 * the reaction its room (check_cast_motion rule 8).
 *
 * Periods stay mutually prime-ish, so no two loops ever line up. */
export const IDLE: Record<string, MotionSpec> = {
  root: [0, 0, 2000, 0],
  hips: [0.033, 0, 2450, 0],
  waist: [0.066, 360, 2800, 0.2],
  chest: [0.132, 180, 2150, 0.3],
  neck: [0.209, 120, 2650, 0.5],
  head: [0.3025, 60, 1750, 0.8],
  arm_l: [0.88, 0, 2050, 0.4],
  fore_l: [0.66, 300, 1800, 0.3],
  arm_r: [0.825, 180, 1500, 0.4],
  fore_r: [0.605, 360, 1550, 0.3],
  // The layered MG / FG figures' free-hanging pieces (2026-09-28). They carry
  // the idle's visible life, the way Miami's ponytail and earrings do; the
  // archetype measurements are 13° smoke, 15° ponytail, 8–12° earrings, taken
  // here at roughly a third so a standing figure does not look windblown.
  // Bone names are unique to those figures, so the old single-mesh rig never
  // reads these rows.
  dangle_smoke: [4.5, 0, 3300, 0.2],
  dangle_ponytail: [5.0, 260, 1700, 0.3],
  dangle_earring_l: [3.5, 120, 1300, 0.2],
  dangle_earring_r: [4.0, 200, 1450, 0.2],
};

/* (2026-09-28) The single-mesh Don's reaction ladder (TRIGGER / WIN_BIG / WIN,
 * TIERS) and its MOTION_SCALE were retired with that figure. The layered MG / FG
 * figures carry their own tables in layeredCastMotion.ts, built from the same
 * Hot Miami ladder; the old tables and their measurement history are in the
 * design folder's legacy area (single_mesh_cast_20260928/). What stays here is
 * shared by both figures: the idle, the envelope and the posing / skinning. */

/** MOTION_SCALE exists to stop a JOINT from folding the mesh. `rise` and
 * `stretch` do not bend a joint: they translate and scale the ROOT, so the whole
 * figure moves as one piece and no triangle changes shape relative to its
 * neighbours. Scaling those down to protect a forearm is a category error, and
 * an expensive one — measured on this rig, the root lift is where most of the
 * reaction's visible size comes from.
 *
 * So the rigid channels ride their own dial. It is 1: the tables' `rise` and
 * `stretch` are used at full strength, which is what this game shipped before
 * (4.5% of the figure box at the trigger) and what check_cast_motion rule 10
 * still passes with — a rigid lift has no fold to measure.
 *
 * If the Don ever starts reading as floating rather than lifting, this is the
 * dial, not MOTION_SCALE. Miami Mayhem's own note is that translation alone
 * "looks like the whole person is floating" and the `stretch` is what plants it,
 * so lower them together. */
export const BODY_SCALE = 1;

export type CastReactionKind = "win" | "winBig" | "trigger";


export function wave(value: number) {
  const u = value - Math.floor(value);
  const v = u < 0.38 ? u / 0.38 : 1 - (u - 0.38) / 0.62;
  return v * v * (3 - 2 * v) * 2 - 1;
}

export function oddBeat(value: number) {
  return value < 0.5 || value > 0.74
    ? 0
    : -Math.sin((Math.PI * (value - 0.5)) / 0.24);
}

export function idleAngle(spec: MotionSpec, timeMs: number) {
  const [amplitude, lagMs, periodMs, oddScale] = spec;
  if (!amplitude) return 0;
  const phase = timeMs - lagMs;
  let angle = amplitude * wave(phase / periodMs);
  angle += amplitude * 0.25 * Math.sin((Math.PI * 2 * phase) / LOOP_MS);
  if (oddScale) {
    const loopPosition = (((phase % LOOP_MS) + LOOP_MS) % LOOP_MS) / LOOP_MS;
    angle += amplitude * oddScale * oddBeat(loopPosition);
  }
  return angle;
}

export function reactionEnvelope(value: number, snap = SNAP, hold = HOLD) {
  if (value <= 0 || value >= 1) return 0;
  if (value < snap) {
    const t = value / snap;
    return t * t * (3 - 2 * t);
  }
  if (value < hold) return 1;
  const t = 1 - (value - hold) / (1 - hold);
  return t * t * (3 - 2 * t);
}

/* ── the geometry, not just the angles ──────────────────────────────────────
 *
 * Everything above is a table of numbers. A bone angle inside its measured
 * limit can still collapse a triangle, because what tears the drawing is the
 * GEOMETRY the angles produce, not the angles — and the geometry depends on the
 * rig as much as on the table. So checking it needs the vertices actually
 * posed.
 *
 * That posing used to live inside skinnedFigure.ts, which imports pixi.js and
 * therefore cannot be loaded by design/check_cast_motion.mjs under bare node.
 * Re-deriving the same matrix maths inside the gate was the obvious fix and is
 * the wrong one: the gate would then be measuring a COPY, free to drift away
 * from what ships — the same split this module's header exists to prevent. So
 * it moved here, where it still imports nothing, and skinnedFigure.ts calls it.
 */

export type Bone = {
  name: string;
  x: number;
  y: number;
  parent: number;
  /** Unit vector along the bone. Written by design/build_cast_guy_rig.py; the
   *  arm bulge reads it (boneAxes), because a folded forearm's direction cannot
   *  be derived from its children. */
  axis?: [number, number];
};

export type MeshRig = {
  size: [number, number];
  figure_box: [number, number, number, number];
  verts: [number, number][];
  tris: [number, number, number][];
  weights: number[][];
  bones: Bone[];
};

export type PoseState = {
  /** Wall clock. The idle is a function of this and never stops. */
  timeMs: number;
  tier: ReactionTier;
  /** ms since the reaction started, or null when none is running. */
  reactionAge: number | null;
  /** `tier.durationMs / speed`, precomputed because the renderer caches it
   *  across frames. */
  durationMs: number;
  speed: number;
  motionScale: number;
};

/** The envelope for everything that carries NO lag — the rigid rise and
 *  stretch and the glow all ride this, so they start WITH the body rather than
 *  trailing it. */
export function bodyEnvelope(state: PoseState) {
  if (state.reactionAge === null) return 0;
  return reactionEnvelope(
    state.reactionAge / state.durationMs,
    state.tier.snap,
    state.tier.hold,
  );
}

const axesCache = new WeakMap<MeshRig, Float64Array>();
/** Each bone's unit direction — `axis` from the rig when given, else toward its
 *  first child, else away from its parent. Only the bulge reads it. */
export function boneAxes(rig: MeshRig) {
  const cached = axesCache.get(rig);
  if (cached) return cached;
  const firstChild = new Map<number, number>();
  rig.bones.forEach((bone, index) => {
    if (bone.parent >= 0 && !firstChild.has(bone.parent)) firstChild.set(bone.parent, index);
  });
  const axes = new Float64Array(rig.bones.length * 2);
  rig.bones.forEach((bone, index) => {
    let dx = 0;
    let dy = -1;
    const child = firstChild.get(index);
    if (bone.axis) {
      [dx, dy] = bone.axis;
    } else if (child !== undefined) {
      dx = rig.bones[child].x - bone.x;
      dy = rig.bones[child].y - bone.y;
    } else if (bone.parent >= 0) {
      dx = bone.x - rig.bones[bone.parent].x;
      dy = bone.y - rig.bones[bone.parent].y;
    }
    const length = Math.hypot(dx, dy);
    axes[index * 2] = length > 1e-9 ? dx / length : 0;
    axes[index * 2 + 1] = length > 1e-9 ? dy / length : -1;
  });
  axesCache.set(rig, axes);
  return axes;
}

// Scratch for callers that do not keep their own `chain` (the gates).
const chainCache = new WeakMap<MeshRig, Float32Array[]>();

/**
 * Compose every bone's world matrix into `out` — one Float32Array(6) per bone,
 * allocated by the caller so the per-frame path allocates nothing. Returns the
 * body envelope, which the renderer also needs for the glow.
 *
 * Two matrices per bone again since 2026-09-24: `out` is what the bone's own
 * vertices are skinned with, `chain` is what its children compose against —
 * rotation and translation only — so an arm's bulge reaches the arm and is not
 * inherited by the forearm below it.
 *
 * The posing lives in THIS module rather than in skinnedFigure.ts so that
 * design/check_cast_motion.mjs can run it under bare node and measure the real
 * mesh. Re-deriving the matrix maths inside the gate would make it a gate on a
 * copy, free to drift from what ships.
 */
export function composeBoneMatrices(
  rig: MeshRig,
  state: PoseState,
  out: Float32Array[],
  chain?: Float32Array[],
) {
  if (!chain) {
    chain = chainCache.get(rig);
    if (!chain) {
      chain = rig.bones.map(() => new Float32Array(6));
      chainCache.set(rig, chain);
    }
  }
  const { tier, reactionAge, durationMs, speed, motionScale, timeMs } = state;
  const bodyReaction = bodyEnvelope(state);
  const [boxY0, boxY1] = [rig.figure_box[1], rig.figure_box[3]];
  const figureHeight = boxY1 - boxY0;
  const shape = tier.scale?.shape;
  const axes = shape ? boneAxes(rig) : null;

  for (let index = 0; index < rig.bones.length; index += 1) {
    const bone = rig.bones[index];
    const idle = idleAngle(IDLE[bone.name] ?? [0, 0, 2000, 0], timeMs);
    // Each bone rides the same envelope, started `lag` ms later, so the pose
    // travels out along the chain instead of arriving all at once.
    let reaction = 0;
    const spec = tier.bones[bone.name];
    if (spec && reactionAge !== null) {
      const [amplitude, lagMs] = spec;
      const envelope = reactionEnvelope(
        (reactionAge - lagMs / speed) / durationMs,
        tier.snap,
        tier.hold,
      );
      reaction = amplitude * motionScale * envelope;
    }
    const angle = (idle + reaction) * DEG;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    let offsetY = 0;
    // Rise and stretch ride the root, so they move the ENTIRE figure rigidly —
    // no joint bends, so no mesh distortion at any amplitude.
    let scaleY = 1;
    if (index === 0 && bodyReaction > 0) {
      // BODY_SCALE, not motionScale — see BODY_SCALE. These are rigid moves of
      // the whole figure and cannot fold anything.
      offsetY = figureHeight * -tier.rise * BODY_SCALE * bodyReaction;
      scaleY = 1 + tier.stretch * BODY_SCALE * bodyReaction;
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

    // The bulge, on the same lagged envelope as this bone's rotation so it
    // arrives with the swing. Applied to this bone's own skin matrix only.
    let skin = local;
    const shapeEntry = shape?.[bone.name];
    if (shapeEntry && axes && reactionAge !== null) {
      const lagMs = spec ? spec[1] : 0;
      const u = (reactionAge - lagMs / speed) / durationMs;
      const envelope = reactionEnvelope(u, tier.snap, tier.hold);
      if (envelope > 0) {
        const k = tier.scale?.k ?? 0;
        let wobble = 0;
        const flutter = tier.flutter;
        if (flutter && u >= tier.snap && u <= tier.hold) {
          wobble = flutter.depth * Math.sin((reactionAge / (flutter.periodMs / speed)) * Math.PI * 2);
        }
        const along = 1 + (shapeEntry[0] - 1) * envelope * k * (1 + wobble);
        const across = 1 + (shapeEntry[1] - 1) * envelope * k * (1 + wobble);
        const ux = axes[index * 2];
        const uy = axes[index * 2 + 1];
        // A · diag(along, across) · Aᵀ, A the bone's frame
        const s00 = ux * ux * along + uy * uy * across;
        const s01 = ux * uy * (along - across);
        const s11 = uy * uy * along + ux * ux * across;
        const m00 = a * s00 + b * s01;
        const m01 = a * s01 + b * s11;
        const m10 = d * s00 + e * s01;
        const m11 = d * s01 + e * s11;
        skin = [
          m00,
          m01,
          bone.x - m00 * bone.x - m01 * bone.y,
          m10,
          m11,
          bone.y - m10 * bone.x - m11 * bone.y + offsetY,
        ];
      }
    }

    const matrix = out[index];
    const link = chain[index];
    if (bone.parent < 0) {
      matrix.set(skin);
      link.set(local);
    } else {
      const parent = chain[bone.parent];
      matrix[0] = parent[0] * skin[0] + parent[1] * skin[3];
      matrix[1] = parent[0] * skin[1] + parent[1] * skin[4];
      matrix[2] = parent[0] * skin[2] + parent[1] * skin[5] + parent[2];
      matrix[3] = parent[3] * skin[0] + parent[4] * skin[3];
      matrix[4] = parent[3] * skin[1] + parent[4] * skin[4];
      matrix[5] = parent[3] * skin[2] + parent[4] * skin[5] + parent[5];
      if (skin === local) {
        link.set(matrix);
      } else {
        link[0] = parent[0] * local[0] + parent[1] * local[3];
        link[1] = parent[0] * local[1] + parent[1] * local[4];
        link[2] = parent[0] * local[2] + parent[1] * local[5] + parent[2];
        link[3] = parent[3] * local[0] + parent[4] * local[3];
        link[4] = parent[3] * local[1] + parent[4] * local[4];
        link[5] = parent[3] * local[2] + parent[4] * local[5] + parent[5];
      }
    }
  }

  return bodyReaction;
}

/** The sparse weight rows, built once. Weights under 0.002 are dropped: they
 *  move a vertex less than a thousandth of a pixel and cost a matrix multiply
 *  each. */
export function buildWeightIndex(rig: MeshRig) {
  const bones: number[][] = [];
  const values: number[][] = [];
  for (const row of rig.weights) {
    const rowBones: number[] = [];
    const rowValues: number[] = [];
    row.forEach((weight, boneIndex) => {
      if (weight > 0.002) {
        rowBones.push(boneIndex);
        rowValues.push(weight);
      }
    });
    bones.push(rowBones);
    values.push(rowValues);
  }
  return { bones, values };
}

/** Linear blend skinning: each vertex is the weighted sum of itself through
 *  every bone matrix it belongs to. This is the step that makes the mesh
 *  continuous — a vertex shared between two bones lands BETWEEN them, so there
 *  is no boundary anywhere for a seam to open at. */
export function skinVertices(
  rest: Float32Array,
  index: { bones: number[][]; values: number[][] },
  matrices: Float32Array[],
  out: Float32Array,
) {
  for (let vertex = 0; vertex < index.bones.length; vertex += 1) {
    const x = rest[vertex * 2];
    const y = rest[vertex * 2 + 1];
    let animatedX = 0;
    let animatedY = 0;
    const bones = index.bones[vertex];
    const values = index.values[vertex];
    for (let i = 0; i < bones.length; i += 1) {
      const matrix = matrices[bones[i]];
      const weight = values[i];
      animatedX += (matrix[0] * x + matrix[1] * y + matrix[2]) * weight;
      animatedY += (matrix[3] * x + matrix[4] * y + matrix[5]) * weight;
    }
    out[vertex * 2] = animatedX;
    out[vertex * 2 + 1] = animatedY;
  }
}
