/**
 * Every number the cast's motion is made of, and nothing else.
 *
 * THIS MODULE MUST NOT IMPORT ANYTHING. design/check_cast_motion.mjs loads it
 * with bare node so it can MEASURE these tables instead of trusting them — the
 * same arrangement game/idleSway.ts already has with check_idle_sway.mjs. One
 * pixi import here and that gate cannot run at all.
 *
 * skinnedFigure.ts owns the rendering; this owns what the rendering is asked to
 * do. The split exists so the second one can be checked.
 *
 * ── 2026-09-22: DEADWOOD EXPRESS'S MOTION ────────────────────────────────────
 *
 * User: 「turf 人物動態照 deadwood 的」. Everything below — the idle table, the
 * reference rotation / squash-and-stretch / lift / flutter, `fromReference`, the
 * three tiers' fractions and timings, and composeBoneMatrices with its second
 * (`chain`) matrix — is copied from apps/DeadwoodExpress/src/game/castMotion.ts
 * verbatim. The Hot Miami tables it replaces are in
 * design/_legacy_assets/cast_motion_hm_20260920/.
 *
 * What Turf keeps of its own, because Deadwood has one drawing and this has two:
 *
 *   RIG_POSE / CAST_POSES — which rig is which drawing. Both poses run the same
 *     Deadwood tables; the split only exists so the gate measures each rig.
 *   HELD_STILL — base `fore_l` is the PLANTED BAT, not a forearm. Any rotation
 *     slides the bat foot ~4px/deg and measured trigger fold 0% on 2026-09-18,
 *     so it takes no idle, no rotation and no squash there.
 *
 *   BY_ROLE — the reference's arms swap sides, because its throwing arm is
 *     this man's pocketed one. See the note above `byRole`.
 */

export type MotionSpec = [
  amplitude: number,
  lagMs: number,
  periodMs: number,
  oddScale: number,
];

/** A reaction's per-bone amplitude in degrees, and how much LATER than the
 *  reaction's own start that bone begins moving. */
export type ReactionSpec = Record<string, [amplitudeDeg: number, lagMs: number]>;

export type ReactionTier = {
  bones: ReactionSpec;
  durationMs: number;
  snap: number;
  hold: number;
  /** root translation UP, as a fraction of the figure box height */
  rise: number;
  /** root vertical SCALE, as a fraction */
  stretch: number;
  /** root translation sideways, as a fraction of the figure box width */
  lean: number;
  push?: { bone: string; x: number; y: number };
  tremor?: { deg: number; periodMs: number; bones: string[] };
  /** Additive re-draw of the figure's own texture, peaking with the reaction. */
  glow?: number;
  /** Per-bone squash and stretch: [along, across] the bone, times k. */
  scale?: { k: number; shape: Record<string, [along: number, across: number]> };
  /** A shake on the squash while the pose holds. */
  flutter?: { depth: number; periodMs: number };
};

export const DEG = Math.PI / 180;
export const LOOP_MS = 8000;

// Idle envelope shape, and the default for the reaction tiers that do not
// override it.
export const SNAP = 0.18;
export const HOLD = 0.63;

export type CastPose = "base" | "shoulder" | "layered";
export const CAST_POSES: CastPose[] = ["base", "shoulder"];
/** Which pose each shipped rig was fitted to. The gates iterate this. */
export const RIG_POSE: Record<string, CastPose> = {
  guy: "base",
  guy_feature: "shoulder",
  guy_kingpin: "shoulder",
};

/** Bones that play a PROP on a drawing, not the limb the table wrote them for. */
export const HELD_STILL: Record<CastPose, string[]> = {
  base: ["fore_l"],
  shoulder: [],
  layered: [],
};

const withoutHeld = <T>(pose: CastPose, table: Record<string, T>) =>
  Object.fromEntries(Object.entries(table).filter(([bone]) => !HELD_STILL[pose].includes(bone)));

// ── Deadwood Express, verbatim ─────────────────────────────────────────────

export const IDLE: Record<string, MotionSpec> = {
  root: [0.0, 0, 2000, 0.0],
  hips: [0.06, 0, 2450, 0.0],
  waist: [0.12, 360, 2800, 0.2],
  chest: [0.24, 180, 2150, 0.3],
  neck: [0.38, 120, 2650, 0.5],
  head: [0.55, 60, 1750, 0.8],
  arm_l: [1.6, 0, 2050, 0.4],
  fore_l: [1.2, 300, 1800, 0.3],
  arm_r: [1.5, 180, 1500, 0.4],
  fore_r: [1.1, 360, 1550, 0.3],
};

const REFERENCE_ROTATION: Record<string, number> = {
 chest:1.68, neck:2.70, head:4.02, arm_l:.36, fore_l:1.08, arm_r:-.48, fore_r:-1.56,
};

/** [along the bone, across it]. ⚠ CORRECTED 2026-09-24 — Deadwood's table
 *  (arm_r [1.23,1.1], fore_r [1.15,1.05], chest [1.06,1.02], neck [1.04,1],
 *  arm_l [.97,1.02], fore_l [.96,1.02]) read the reference's Spine scales the
 *  wrong way round: scaleX is ALONG a Spine bone, scaleY ACROSS it. Measured
 *  off the Miami motion pack (miami_main_guy, full_screen/reaction, t=0.2):
 *  arm_r keeps its length (shoulder->elbow 231.09 -> 231.09) and bulges 1.229
 *  across; arm_l_2 goes 1.063 along / 0.799 across. chest/neck have no source.
 *  So: the driving upper arm bulges, the bracing forearm thins. An arm stretched
 *  along itself with its hand pinned was the 「像沒骨頭」 bow. */
const REFERENCE_SCALE: Record<string, [number,number]> = {
 arm_r:[1.00,1.23], fore_l:[1.06,0.80],
};

const REFERENCE_SCALE_K = 0.42;

const REFERENCE_LIFT = { lean: 0.018, rise: 0.045 };

const REFERENCE_FLUTTER = { depth: 0.13, periodMs: 66.7 };

/**
 * The reference's arms mapped BY ROLE, not by name — the one change to
 * Deadwood's numbers, and a mapping, not a retune.
 *
 * Deadwood's conductor throws out his right arm, so the reference puts its
 * loudest rotation and squash on `arm_r`/`fore_r` (1.23x along). Turf's right
 * hand is IN A POCKET, pinned to the hips on purpose; driving it by name shears
 * the forearm between a moving elbow and a fixed hand. Measured with Deadwood's
 * tables as-is: trigger fold 47% (base) / 36% (shoulder) at the pocket hand.
 * The free arm here is the LEFT one (the bat arm), so the two sides swap, signs
 * with them (+ opens the left, - opens the right on these rigs). Same result as
 * the 2026-09-18 A/B, where by-role measured 65%/57% against by-name 47%/36%.
 * The idle is symmetric enough that it stays as written.
 */
const BY_ROLE: Record<string, string> = {
  arm_l: "arm_r", fore_l: "fore_r", arm_r: "arm_l", fore_r: "fore_l",
};
const byRole = <T>(table: Record<string, T>, flip: (value: T) => T) =>
  Object.fromEntries(
    Object.entries(table).map(([bone, value]) =>
      BY_ROLE[bone] ? [BY_ROLE[bone], flip(value)] : [bone, value],
    ),
  ) as Record<string, T>;

/**
 * THE ARMS ARE RIGID — Hot Miami's rule, not Deadwood's (2026-09-23).
 *
 * User on the Deadwood port: 「turf 的手很怪，很像沒骨頭一樣，參考 miami 或 deadwood」.
 * Measured as how far each arm-owned vertex group strays from the best RIGID
 * fit of itself over a trigger (so pure rotation scores 0), as a share of the
 * figure's height:
 *
 *                            Deadwood port   arms rigid   Deadwood's conductor
 *   base     arm_l trigger       23.9 ‰        ~11 ‰             ≤ 8.8 ‰
 *   shoulder arm_l trigger       24.5 ‰         ~8 ‰
 *   base     arm_l idle only      4.8 ‰        ~1.2 ‰   (Hot Miami's idle)
 *
 * Two things made the arms bend like rubber here and not on the conductor:
 *   - the squash. BY_ROLE hands the reference's biggest stretch (1.23x along)
 *     to the left arm, whose fist is on the planted bat (base) or on the bat at
 *     the shoulder — a stretched arm with a pinned hand can only bow.
 *   - the idle. Deadwood breathes the arms at 1.6/1.2/1.5/1.1deg, forever; with
 *     either hand pinned that is a permanent bend, ~4x Hot Miami's.
 * So the idle ARM rows are the ones that shipped before (Hot Miami's × the
 * pose's old scale). Spine, head, root lift, lean and every reaction angle stay
 * Deadwood's.
 *
 * 2026-09-24: the arms take squash again, but the REFERENCE's squash — the
 * table above had its axes swapped (see REFERENCE_SCALE). Bulging the upper
 * arm across instead of stretching it along bends it about as little as no
 * squash at all (affine residual, base upper sleeve 1.9 per mille vs 3.1
 * without and 7.1 with the swapped table).
 */
const IDLE_ARMS: Record<CastPose, Record<string, MotionSpec>> = {
  base: {
    arm_l: [0.4048, 0, 2050, 0.4],
    fore_l: [0.3036, 300, 1800, 0.3],
    arm_r: [0.3795, 180, 1500, 0.4],
    fore_r: [0.2783, 360, 1550, 0.3],
  },
  shoulder: {
    arm_l: [0.2992, 0, 2050, 0.4],
    fore_l: [0.2244, 300, 1800, 0.3],
    arm_r: [0.2805, 180, 1500, 0.4],
    fore_r: [0.2057, 360, 1550, 0.3],
  },
  layered: {
    arm_l: [0.8, 0, 2050, 0.4],
    fore_l: [0.55, 300, 1800, 0.3],
    arm_r: [0.5, 180, 1500, 0.4],
    fore_r: [0.4, 360, 1550, 0.3],
    dangle_chain: [1.4, 420, 2200, 0.25],
    dangle_mask: [2.6, 530, 2000, 0.2],
  },
};
function fromReference(
  pose: CastPose,
  fraction: number,
  timing: { durationMs: number; snap: number; hold: number },
  glow = 0,
): ReactionTier {
  const rotation = byRole(REFERENCE_ROTATION, (degrees) => -degrees);
  const shape = byRole(REFERENCE_SCALE, (pair) => pair);
  const bones: ReactionSpec = {};
  for (const [bone, degrees] of Object.entries(withoutHeld(pose, rotation)))
    bones[bone] = [degrees * fraction, 0];
  return {
    ...timing,
    bones,
    rise: REFERENCE_LIFT.rise * fraction,
    lean: REFERENCE_LIFT.lean * fraction,
    stretch: 0,
    scale: { k: REFERENCE_SCALE_K * fraction, shape: withoutHeld(pose, shape) },
    flutter: REFERENCE_FLUTTER,
    glow,
  };
}

export type CastReactionKind = "win" | "winBig" | "trigger";

function ladder(pose: CastPose): Record<CastReactionKind, ReactionTier> {
  return {
    trigger: fromReference(pose, 1, { durationMs: 1000, snap: 0.18, hold: 0.63 }, 0.34),
    winBig: fromReference(pose, 0.75, { durationMs: 880, snap: 0.15, hold: 0.6 }),
    win: fromReference(pose, 0.5, { durationMs: 720, snap: 0.18, hold: 0.42 }),
  };
}

export const IDLE_BY_POSE: Record<CastPose, Record<string, MotionSpec>> = {
  base: withoutHeld("base", { ...IDLE, ...IDLE_ARMS.base }),
  shoulder: withoutHeld("shoulder", { ...IDLE, ...IDLE_ARMS.shoulder }),
  layered: { ...IDLE, ...IDLE_ARMS.layered, dangle_smoke: [2.4, 150, 2900, 0.4] },
};

export const TIERS_BY_POSE: Record<CastPose, Record<CastReactionKind, ReactionTier>> = {
  base: ladder("base"),
  shoulder: ladder("shoulder"),
  layered: ladder("layered"),
};

export const MOTION_SCALE: Record<"guy", number> = {
  guy: 1,
};

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
 * A bone angle inside its measured limit can still collapse a triangle: what
 * tears the drawing is the GEOMETRY the angles produce, and that depends on the
 * rig as much as on the table. The posing lives here, importing nothing, so
 * skinnedFigure.ts renders with it and the gates measure with it.
 */

export type Bone = {
  name: string;
  x: number;
  y: number;
  parent: number;
  /** Unit vector along the bone, when it cannot be derived. Only squash and
   *  stretch reads it. Written by design/rig/build_turf_rigs.py. */
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
  /** Which drawing — picks the idle table. */
  pose: CastPose;
  tier: ReactionTier;
  /** ms since the reaction started, or null when none is running. */
  reactionAge: number | null;
  /** `tier.durationMs / speed`, precomputed because the renderer caches it. */
  durationMs: number;
  speed: number;
  motionScale: number;
  /** Fixed degrees added to a bone's angle on top of idle + reaction — a
   *  corrected rest pose for a drawing whose own pose reads wrong. */
  rest?: Record<string, number>;
};

/** The envelope for everything that carries NO lag — the rigid rise, lean,
 *  stretch, push and glow. */
export function bodyEnvelope(state: PoseState) {
  if (state.reactionAge === null) return 0;
  return reactionEnvelope(
    state.reactionAge / state.durationMs,
    state.tier.snap,
    state.tier.hold,
  );
}

const axesCache = new WeakMap<MeshRig, Float64Array>();
export function boneAxes(rig: MeshRig) {
  const cached = axesCache.get(rig);
  if (cached) return cached;
  const firstChild = new Map<number, number>();
  rig.bones.forEach((bone, index) => {
    if (bone.parent >= 0 && !firstChild.has(bone.parent))
      firstChild.set(bone.parent, index);
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
 * Compose every bone's world matrix into `out` (what its vertices are skinned
 * with) and `chain` (what its children compose against — rotation and
 * translation only, so a bone's squash and stretch reaches its own vertices and
 * is not inherited). Deadwood Express's, plus the per-pose idle table.
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
  const idleTable = IDLE_BY_POSE[state.pose];
  const bodyReaction = bodyEnvelope(state);
  const [boxX0, boxY0, boxX1, boxY1] = rig.figure_box;
  const figureWidth = boxX1 - boxX0;
  const figureHeight = boxY1 - boxY0;
  const shape = tier.scale?.shape;
  const axes = shape ? boneAxes(rig) : null;

  for (let index = 0; index < rig.bones.length; index += 1) {
    const bone = rig.bones[index];
    const idle = idleAngle(idleTable[bone.name] ?? [0, 0, 2000, 0], timeMs);
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
      const tremor = tier.tremor;
      if (tremor && envelope > 0 && tremor.bones.includes(bone.name)) {
        const period = tremor.periodMs / speed;
        reaction +=
          tremor.deg *
          motionScale *
          envelope *
          Math.sin((reactionAge / period) * Math.PI * 2);
      }
    }
    const angle = ((state.rest?.[bone.name] ?? 0) + idle + reaction) * DEG;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    let offsetX = 0;
    let offsetY = 0;
    // Rise, lean and stretch ride the root, so they move the ENTIRE figure
    // rigidly — no joint bends, so no mesh distortion at any amplitude.
    let scaleY = 1;
    if (index === 0 && bodyReaction > 0) {
      offsetX = figureWidth * tier.lean * motionScale * bodyReaction;
      offsetY = figureHeight * -tier.rise * motionScale * bodyReaction;
      scaleY = 1 + tier.stretch * motionScale * bodyReaction;
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

    // This bone's own squash and stretch, on the SAME lagged envelope as its
    // rotation, so the bulge arrives with the swing rather than ahead of it.
    let skin = local;
    const bulge = shape?.[bone.name];
    if (bulge && axes && reactionAge !== null) {
      const lagMs = spec ? spec[1] : 0;
      const u = (reactionAge - lagMs / speed) / durationMs;
      const envelope = reactionEnvelope(u, tier.snap, tier.hold);
      if (envelope > 0) {
        const k = (tier.scale?.k ?? 0) * motionScale;
        let wobble = 0;
        const flutter = tier.flutter;
        if (flutter && u >= tier.snap && u <= tier.hold) {
          wobble =
            flutter.depth *
            Math.sin((reactionAge / (flutter.periodMs / speed)) * Math.PI * 2);
        }
        const along = 1 + (bulge[0] - 1) * envelope * k * (1 + wobble);
        const across = 1 + (bulge[1] - 1) * envelope * k * (1 + wobble);
        if (along !== 1 || across !== 1) {
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
            bone.x - m00 * bone.x - m01 * bone.y + offsetX,
            m10,
            m11,
            bone.y - m10 * bone.x - m11 * bone.y + offsetY,
          ];
        }
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

  // The perspective push, applied AFTER the whole hierarchy is composed and
  // written straight into one bone's final SKIN matrix.
  const push = tier.push;
  if (push && bodyReaction > 0) {
    const pushIndex = rig.bones.findIndex((bone) => bone.name === push.bone);
    if (pushIndex >= 0) {
      const matrix = out[pushIndex];
      matrix[2] += figureWidth * push.x * motionScale * bodyReaction;
      matrix[5] += figureHeight * push.y * motionScale * bodyReaction;
    }
  }

  return bodyReaction;
}

/** The sparse weight rows, built once. Weights under 0.002 are dropped. */
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
 *  every bone matrix it belongs to. */
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
