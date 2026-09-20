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
 * ── 2026-09-20: BACK TO HOT MIAMI'S MOTION ──────────────────────────────────
 *
 * What was here derived every tier from a transcription of Hacksaw's Miami rig
 * (`PORT_ROTATION` / `PORT_SCALE` / `fromReference`) and added a
 * squash-and-stretch channel to carry it. Capo Nostra ran the same model, the
 * user's verdict there was 「完全不行，重來，回到類似 hot miami 的動態」, and
 * Turf War was told to follow.
 *
 * It also unblocks this game: the build had been stopped since 2026-09-18 on two
 * gate failures that were both properties of the transcription's own numbers —
 * base `neck` 3.34deg against a 3deg visual limit, and an idle `arm_r` peaking
 * at 79% of its joint's budget against a 60% cap. Hot Miami's idle is less than
 * half the size, so both are gone rather than argued about.
 *
 * The tables below are Hot Miami's, which shipped and passed review, with three
 * changes and nothing else:
 *
 *   1. THE `hair` BONE IS LEFT UNDRIVEN. Both rigs declare one (it was added for
 *      a wallet chain), but it has no row in check_cast_motion's JOINT_LIMIT_DEG
 *      and the art it was meant for is not in the texture, so driving it would be
 *      guessing. Hot Miami's `hair` entries — the loudest thing in its tables —
 *      are therefore dropped rather than reassigned.
 *   2. THE RIGHT-SIDE SIGNS ARE NEGATIVE. On Hot Miami's rig positive opens the
 *      body on both sides; on these two it was MEASURED the other way round
 *      (check_cast_motion rule 5), so every right-limb entry is negated.
 *   3. EACH POSE TAKES ITS OWN FRACTION. See POSE_SCALE — the two drawings have
 *      very different budgets and one number cannot serve both.
 *
 * WHAT WENT WITH THE TRANSCRIPTION, and do not put it back without a reason that
 * is not "the reference does it": `scale` / `flutter` (per-bone squash and
 * stretch and the bulge's shake), `push` / `tremor` (already unused), and `lean`.
 * `glow` stays: it is a flash, not motion, and was never part of what was wrong.
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
 *  not a person. Motion travels OUT along the chain, each link starting after
 *  the one it hangs from. check_cast_motion rule 3 holds the order. */
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
 *  On the base drawing the planted bat hangs off root too, so it rises with the
 *  feet rather than staying behind. */
export type ReactionTier = {
  bones: ReactionSpec;
  durationMs: number;
  snap: number;
  hold: number;
  rise: number;
  stretch: number;
  /** Additive re-draw of the figure's own texture, peaking with the reaction —
   *  the same image added to itself. `skinnedFigure.ts` does it with a second
   *  Mesh sharing the first one's geometry, so it deforms with the body for
   *  free. 0 or omitted = no glow, which is right for the small tiers. */
  glow?: number;
};

export const DEG = Math.PI / 180;
export const LOOP_MS = 8000;

// Idle envelope shape, and the timing every reaction tier uses. Hot Miami keeps
// one pair for all three tiers; so does this now.
export const SNAP = 0.18;
export const HOLD = 0.63;

/** Two drawings, two poses. The motion tables are Hot Miami's on both; what
 *  differs is how much of them each pose can take (POSE_SCALE) and which bones
 *  are playing a prop rather than a limb (HELD_STILL). */
export type CastPose = "base" | "shoulder";
export const CAST_POSES: CastPose[] = ["base", "shoulder"];
/** Which pose each shipped rig was fitted to. The gates iterate this. */
export const RIG_POSE: Record<string, CastPose> = {
  guy: "base",
  guy_feature: "shoulder",
  guy_kingpin: "shoulder",
};

/* THE IDLE — Hot Miami's table, minus the hair bone neither drawing has.
 *
 * Its own note: the reference rig's measured motion reduced to 55%, giving 0.42%
 * head travel and 0px at the feet — visible life without the large whole-body
 * sway that failed review.
 *
 * This is less than half the size of the transcription's idle it replaces, and
 * that is what clears the blocker: the old `arm_r` peaked at 2.36deg, 79% of the
 * base drawing's 3deg budget, spent standing still. Hot Miami's 0.825 peaks at
 * about 1.36 — 45%, inside rule 8's 60% cap with room for the reaction.
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
};

/** Bones that play a PROP on a drawing, not the limb the table wrote them for.
 *  They take no idle and no rotation there.
 *
 *  base fore_l: held still since 2026-09-18, when giving it a forearm's numbers
 *  measured trigger fold 0% with 27 inversions at (133,828). Held still it was
 *  65% / 1.40x with 0 flips, and it still is under Hot Miami's tables.
 *
 *  The bat is real — it is in `sprites/turfCast/guy.png`, which is the texture
 *  the gate measures. (It is NOT in the PNG sitting next to the rig file; see the
 *  warning above POSE_SCALE before opening that one and drawing conclusions.) */
export const HELD_STILL: Record<CastPose, string[]> = {
  base: ["fore_l"],
  shoulder: [],
};

const withoutHeld = <T>(pose: CastPose, table: Record<string, T>) =>
  Object.fromEntries(Object.entries(table).filter(([bone]) => !HELD_STILL[pose].includes(bone)));

/**
 * How much of Hot Miami's table each DRAWING can take.
 *
 * NOT a taste dial. Hot Miami runs one figure at 0.36 and the other at 1.0
 * because they are drawn differently; these two are drawn differently from each
 * other as well, so one number cannot serve both. Each is the largest fraction
 * that keeps every joint inside its own measured limit (check_cast_motion
 * JOINT_LIMIT_DEG, rule 1), on top of an idle that never stops running, with
 * margin left for the mesh fold gate (rule 10).
 *
 * Both numbers were SWEPT against the gate rather than derived, because the
 * binding constraint turned out not to be the joint limits on either drawing:
 *
 *   base       squeezed from both sides. Above 0.50 the trigger's `arm_l`
 *              smears the mesh past rule 10's 1.60x stretch cap (1.65x at
 *              229,367); below it the line win stops clearing rule 2's
 *              visibility floor. 0.46 leaves 6 points of stretch margin
 *              (measured 1.54x) and needs WIN_FRACTION raised to 0.6.
 *   shoulder   the free forearm folds: 0.42 measured 44% against rule 10's 50%
 *              floor at 133,175. 0.34 measures 62%.
 *
 * `fore_l` does not appear in the base column at all — it is the planted bat
 * (HELD_STILL), so the base drawing's free end is `fore_r`.
 */
/**
 * ⚠ THE RIG FOLDER'S PNGs ARE NOT THE ART. Checked 2026-09-20 after being
 * misled by them:
 *
 *   `meshRigs/cast_guy/guy.png`, `guy_feature.png` and `guy_don.png` are
 *   BYTE-IDENTICAL to each other (one md5) and show a man in a pinstripe suit.
 *   Nothing renders them. They are leftover SOURCE art from building the rigs,
 *   and `rig.image` still names them.
 *
 *   What ships, and what every number below was measured against, is
 *   `sprites/turfCast/guy.png` / `guy_feature.png` / `guy_kingpin.png` — the
 *   hooded figure with the bat. design/lib/castMesh.mjs resolves the texture out
 *   of game/assets.ts for exactly this reason and says so in its own header.
 *
 * So: measure with the gate, never by opening the file next to the rig.
 */
export const POSE_SCALE: Record<CastPose, number> = {
  base: 0.46,
  shoulder: 0.34,
};

/** The idle takes POSE_SCALE too, and that is not a detail.
 *
 * Scaling only the reaction shrinks the beat while leaving the permanent sway at
 * full size, and on the tight drawing that inverts the relationship the whole
 * thing depends on: measured here, a line win's loudest bone came out at 1.14deg
 * under an idle already peaking at 1.37 — the reaction was literally smaller
 * than the breathing it had to read against (check_cast_motion rule 2). A
 * drawing that can only take 55% of the gesture can only take 55% of the sway. */
const scaledIdle = (pose: CastPose) =>
  Object.fromEntries(
    Object.entries(withoutHeld(pose, IDLE)).map(([bone, [amp, lag, period, odd]]) => [
      bone,
      [Number((amp * POSE_SCALE[pose]).toFixed(4)), lag, period, odd] as MotionSpec,
    ]),
  );

export const IDLE_BY_POSE: Record<CastPose, Record<string, MotionSpec>> = {
  base: scaledIdle("base"),
  shoulder: scaledIdle("shoulder"),
};

/* THE REACTION — Hot Miami's trigger table, its ladder, and its per-bone lag.
 *
 * Hot Miami's own reasoning for the sizes, kept because it is the reasoning that
 * produced them: the tables before it peaked at 0.41deg on a line win, which on
 * a figure ~400px tall moves an extremity under 3px across the whole beat — the
 * reaction was, measurably, invisible. The amplitude is spread DOWN the chain
 * because the limit is each joint's own local angle, not the total the chain adds
 * up to: an accumulated rotation carries the parts below it rigidly, and rigid
 * costs nothing.
 *
 * Signs: positive-left / negative-right opens the body on BOTH of these drawings
 * (re-measured on these rigs, check_cast_motion rule 5). Hot Miami's own tables
 * are positive on both sides because its rig is built the other way round.
 */
const TRIGGER_BONES: ReactionSpec = {
  hips: [1.6, 0],
  waist: [2.5, 40],
  chest: [3.5, 80],
  neck: [4.7, 130],
  head: [6.4, 180],
  arm_l: [7.5, 110],
  fore_l: [12.5, 190],
  arm_r: [-3.8, 110],
  fore_r: [-7.5, 190],
};

/** The ladder, as fractions of the trigger — Hot Miami's three tiers, which are
 *  the same gesture at three sizes rather than three different poses. Its own
 *  numbers are 1 / 0.8 / 0.4 of the trigger; the durations are its own too. */
const LADDER: Record<CastReactionKindName, {
  fraction: number;
  durationMs: number;
  rise: number;
  stretch: number;
  glow?: number;
}> = {
  trigger: { fraction: 1, durationMs: 1250, rise: 0.045, stretch: 0.025, glow: 0.34 },
  winBig: { fraction: 0.75, durationMs: 1100, rise: 0.035, stretch: 0.02 },
  // The line win's fraction is PER POSE — see WIN_FRACTION. Hot Miami's 0.4 is
  // not usable on either drawing here.
  win: { fraction: 0, durationMs: 950, rise: 0.015, stretch: 0.01 },
};


/**
 * The line win is the only rung whose size is set from BELOW rather than above,
 * and on these two drawings that floor bites.
 *
 * Every other rung is a fraction of the trigger. The line win also has to clear
 * check_cast_motion rule 2 — an absolute 2deg floor for being visible at all,
 * and 1.25x its own bone's idle peak so it is not buried in the sway. Once
 * POSE_SCALE has already reduced the whole gesture, Hot Miami's 0.4 lands under
 * that floor on both drawings (base 1.14deg, shoulder 1.625).
 *
 * So each pose takes the smallest fraction that clears its own floor:
 *
 *   base       arm_l is the loudest bone it has (fore_l is the planted bat):
 *              7.5 x f x 0.46 >= 2 -> f >= 0.58, shipped 0.6
 *   shoulder   fore_l is free here and louder:
 *              12.5 x f x 0.34 >= 2 -> f >= 0.47, shipped 0.5
 *
 * There is no setting where Hot Miami's own 0.4 ladder fits the base drawing:
 * the window between "the trigger smears" and "the line win is invisible" is
 * narrower than the gap between 0.4 and what the floor needs.
 */
export const WIN_FRACTION: Record<CastPose, number> = {
  base: 0.6,
  shoulder: 0.5,
};

export type CastReactionKind = "win" | "winBig" | "trigger";
type CastReactionKindName = CastReactionKind;

function tier(pose: CastPose, kind: CastReactionKind): ReactionTier {
  const spec = LADDER[kind];
  const fraction = kind === "win" ? WIN_FRACTION[pose] : spec.fraction;
  const size = fraction * POSE_SCALE[pose];
  const bones: ReactionSpec = {};
  for (const [bone, [degrees, lagMs]] of Object.entries(withoutHeld(pose, TRIGGER_BONES)))
    bones[bone] = [Number((degrees * size).toFixed(3)), lagMs];
  return {
    bones,
    durationMs: spec.durationMs,
    snap: SNAP,
    hold: HOLD,
    // rise and stretch do NOT take POSE_SCALE — see BODY_SCALE.
    rise: spec.rise,
    stretch: spec.stretch,
    glow: spec.glow,
  };
}

function ladder(pose: CastPose): Record<CastReactionKind, ReactionTier> {
  return {
    win: tier(pose, "win"),
    winBig: tier(pose, "winBig"),
    trigger: tier(pose, "trigger"),
  };
}

export const TIERS_BY_POSE: Record<CastPose, Record<CastReactionKind, ReactionTier>> = {
  base: ladder("base"),
  shoulder: ladder("shoulder"),
};

/** Kept at 1: the per-drawing reduction lives in POSE_SCALE, which is applied to
 *  the tables above rather than at render time, so the gates read the real
 *  amplitudes. Both gates still multiply by this, so a second cast member would
 *  need an entry here AND its own row in check_cast_motion's JOINT_LIMIT_DEG. */
export const MOTION_SCALE: Record<"guy", number> = {
  guy: 1,
};

/** MOTION_SCALE and POSE_SCALE exist to stop a JOINT from folding the mesh.
 * `rise` and `stretch` do not bend a joint: they translate and scale the ROOT,
 * so the whole figure moves as one piece and no triangle changes shape relative
 * to its neighbours. Scaling them down to protect a forearm is a category error,
 * and an expensive one — measured on Capo Nostra's rig, the root lift is where
 * most of the reaction's visible size comes from.
 *
 * So the rigid channels ride their own dial, and it is 1. If the figure ever
 * starts reading as floating rather than lifting, this is the dial: Miami
 * Mayhem's note is that translation alone "looks like the whole person is
 * floating" and the stretch is what plants it, so lower them together. */
export const BODY_SCALE = 1;

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
};

/** The envelope for everything that carries NO lag — the rigid rise, stretch,
 *  lean, push and glow. */
export function bodyEnvelope(state: PoseState) {
  if (state.reactionAge === null) return 0;
  return reactionEnvelope(
    state.reactionAge / state.durationMs,
    state.tier.snap,
    state.tier.hold,
  );
}

/**
 * Compose every bone's world matrix into `out` — one Float32Array(6) per bone,
 * allocated by the caller so the per-frame path allocates nothing. Returns the
 * body envelope, which the renderer also needs for the glow.
 *
 * Rotation and translation only. There used to be a second matrix per bone here
 * (`chain`) because the squash-and-stretch channel had to reach a bone's own
 * vertices without passing to its children. That channel went on 2026-09-20 with
 * the rest of the transcription, so one matrix per bone is all there is again.
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
) {
  const { tier, reactionAge, durationMs, speed, motionScale, timeMs } = state;
  const idleTable = IDLE_BY_POSE[state.pose];
  const bodyReaction = bodyEnvelope(state);
  const figureHeight = rig.figure_box[3] - rig.figure_box[1];

  for (let index = 0; index < rig.bones.length; index += 1) {
    const bone = rig.bones[index];
    const idleAngleDeg = idleAngle(idleTable[bone.name] ?? [0, 0, 2000, 0], timeMs);
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
    const angle = (idleAngleDeg + reaction) * DEG;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    let offsetY = 0;
    // Rise and stretch ride the root, so they move the ENTIRE figure rigidly —
    // no joint bends, so no mesh distortion at any amplitude. BODY_SCALE, not
    // motionScale: see BODY_SCALE.
    let scaleY = 1;
    if (index === 0 && bodyReaction > 0) {
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

    const matrix = out[index];
    if (bone.parent < 0) {
      matrix.set(local);
    } else {
      const parent = out[bone.parent];
      matrix[0] = parent[0] * local[0] + parent[1] * local[3];
      matrix[1] = parent[0] * local[1] + parent[1] * local[4];
      matrix[2] = parent[0] * local[2] + parent[1] * local[5] + parent[2];
      matrix[3] = parent[3] * local[0] + parent[4] * local[3];
      matrix[4] = parent[3] * local[1] + parent[4] * local[4];
      matrix[5] = parent[3] * local[2] + parent[4] * local[5] + parent[5];
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
