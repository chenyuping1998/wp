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
};

/* WHY THESE REACTION NUMBERS ARE THE SIZE THEY ARE — Hot Miami's own reasoning,
 * kept because it is the reasoning that produced the tables:
 *
 * The tables this game shipped before peaked at 0.41deg on a line win. On a
 * figure drawn ~400px tall that moves an extremity under 3px across the whole
 * beat: the reaction was, measurably, invisible.
 *
 * The ceiling is measured rather than guessed, by rotating one joint at a time
 * and rendering the mesh. What breaks, and when, on a figure drawn like this one:
 *
 *     shoulder (arm_*)   clean to ~10 deg, visibly tearing by 15-30
 *     elbow (fore_*)     clean to ~15 deg, the hand goes to a blade by 30-45
 *     chest / waist      clean to ~20-25 deg
 *     neck / head        clean past 60 deg
 *
 * The limit is each joint's OWN local angle, not the total the chain adds up to:
 * an accumulated rotation carries the parts below it rigidly, and rigid costs
 * nothing. So the amplitude is spread down the chain, and every entry sits well
 * inside its own joint's measured budget while the figure as a whole moves many
 * times further than it used to.
 *
 * ⚠ THIS FIGURE'S OWN LIMITS ARE TIGHTER THAN THE LIST ABOVE and they are what
 * the gate enforces: the Don's shoulders were measured at 4.5 / 7deg, not 10,
 * because his arms hang against his body. That is why MOTION_SCALE exists and
 * why it is 0.36. See check_cast_motion JOINT_LIMIT_DEG.
 */

// The feature trigger: the top of the ladder, and the rarest, so it is allowed
// to be the biggest thing the figure does.
export const TRIGGER_REACTION: ReactionTier = {
  durationMs: 1250,
  snap: SNAP,
  hold: HOLD,
  rise: 0.045,
  stretch: 0.025,
  glow: 0.34,
  bones: {
    hips: [1.6, 0],
    waist: [2.5, 40],
    chest: [3.5, 80],
    neck: [4.7, 130],
    head: [6.4, 180],
    arm_l: [7.5, 110],
    fore_l: [12.5, 190],
    arm_r: [-3.8, 110],
    fore_r: [-7.5, 190],
  },
};

// A win worth making a fuss about (see BIG_WIN at the call site). Reads clearly
// from across the screen without matching the trigger.
export const WIN_BIG_REACTION: ReactionTier = {
  durationMs: 1100,
  snap: SNAP,
  hold: HOLD,
  rise: 0.035,
  stretch: 0.02,
  bones: {
    hips: [1.3, 0],
    waist: [2.0, 40],
    chest: [2.8, 80],
    neck: [3.8, 130],
    head: [5.1, 180],
    arm_l: [6.0, 110],
    fore_l: [10.0, 190],
    arm_r: [-3.0, 110],
    fore_r: [-6.0, 190],
  },
};

// An ordinary line win. This is the common case by a wide margin, so it stays a
// nod rather than a celebration. It is still an order of magnitude larger than
// what shipped before, because what shipped before could not be seen at all.
export const WIN_REACTION: ReactionTier = {
  durationMs: 950,
  snap: SNAP,
  hold: HOLD,
  rise: 0.015,
  stretch: 0.01,
  bones: {
    hips: [0.6, 0],
    waist: [0.9, 40],
    chest: [1.3, 80],
    neck: [1.8, 130],
    head: [2.4, 180],
    arm_l: [3.0, 110],
    fore_l: [5.0, 190],
    arm_r: [-1.5, 110],
    fore_r: [-3.0, 190],
  },
};

/** How much of the tables the artwork actually takes.
 *
 * NOT a taste dial — it is a property of THIS DRAWING, and it was measured, not
 * chosen. Hot Miami's man runs at 0.36; the Don needs half that, and the reason
 * is worth reading before anyone raises it.
 *
 * The binding constraint is not a joint angle. Every joint above is inside its
 * measured limit at 0.36 (the worst is the left shoulder at 4.07 against 4.5).
 * What fails is check_cast_motion rule 10, which poses the actual mesh and
 * watches every triangle's area: the LEFT FOREARM folds. Swept against the gate,
 * trigger fold (floor 50%, and 0 flips at every setting):
 *
 *     MOTION_SCALE   trigger fold   winBig fold
 *        0.36           37%            47%     <- fails
 *        0.30           45%            53%     <- fails
 *        0.26           51%            58%     <- passes by one point
 *        0.22           56%            62%
 *        0.18           62%            66%     <- shipped, 12 points of margin
 *
 * The fold is always at the same vertex, (85, 529), and it is a WEIGHT CLIFF:
 * the two grid columns either side of it carry fore_l at 0.17 and 0.83, a 0.66
 * jump across one 32px cell. The usual fix is more lattice smoothing in
 * design/build_cast_guy_rig.py, and it is NOT available here — that script's own
 * sweep shows smooth=2 drops the cigar arm's upper-arm ownership to 0.42, under
 * the 0.5 floor rule 11 enforces. The script says why, and it is the drawing:
 * a cell is 32px and each of the Don's arms is 40-50px wide, so an arm is ONE
 * lattice column with no interior to keep rigid while the rim softens.
 *
 * ⚠ THE REAL UNLOCK IS THE ART, and it is already written down in ART_BRIEF.md
 * §1: the Don is drawn with his arms against his body. Draw him with daylight
 * under the arms and there is mesh across the joint to absorb the bend — the
 * limits go up, the cliff softens, and this number can go back toward Hot
 * Miami's 0.36. Until then, raising it past 0.26 ships a creased sleeve.
 *
 * If a second figure is ever stood beside this board it needs its own entry here
 * AND its own row in check_cast_motion's JOINT_LIMIT_DEG, measured the same way.
 * Adding one without the other is exactly how a shipped build with a broken hand
 * happened on the other game. */
export const MOTION_SCALE: Record<"guy", number> = {
  guy: 0.18,
};

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

export const TIERS: Record<CastReactionKind, ReactionTier> = {
  win: WIN_REACTION,
  winBig: WIN_BIG_REACTION,
  trigger: TRIGGER_REACTION,
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
  /** Unit vector along the bone. Written by design/build_cast_guy_rig.py and
   *  kept in the rig files, but NOTHING reads it since squash and stretch was
   *  removed on 2026-09-20 — it was the only consumer. Left on the type so the
   *  existing rig JSON still parses. */
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

/**
 * Compose every bone's world matrix into `out` — one Float32Array(6) per bone,
 * allocated by the caller so the per-frame path allocates nothing. Returns the
 * body envelope, which the renderer also needs for the glow.
 *
 * Rotation and translation only. There used to be a second matrix per bone here
 * (`chain`) because the squash-and-stretch channel had to reach the bone's own
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
  const bodyReaction = bodyEnvelope(state);
  const [boxY0, boxY1] = [rig.figure_box[1], rig.figure_box[3]];
  const figureHeight = boxY1 - boxY0;

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
