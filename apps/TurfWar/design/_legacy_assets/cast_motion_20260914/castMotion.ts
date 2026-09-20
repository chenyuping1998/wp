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
 *  the one it hangs from: hips lead, the head arrives later, the hands last,
 *  because the hands are what the eye is on. */
export type ReactionSpec = Record<string, [amplitudeDeg: number, lagMs: number]>;

/** One reaction tier.
 *
 *    bones      — what each joint does, and when it starts
 *    durationMs — the beat's length at speed 1 (turbo divides it)
 *    snap/hold  — fractions of the duration spent arriving, and the point the
 *                 release starts. The quick tiers snap and let go; the big ones
 *                 arrive fast and STAY there, which is the difference between a
 *                 movement and a flinch.
 *
 *  and the three whole-body moves that cost NOTHING in mesh distortion, because
 *  they are rigid on the entire figure rather than a bend at a joint:
 *
 *    rise    — root translation UP, as a fraction of the figure box height
 *    stretch — root vertical SCALE, as a fraction
 *    lean    — root translation toward the board, fraction of figure width
 *
 *  Miami Mayhem's own note on their breathing bone: translation alone "looks
 *  like the whole person is floating". The stretch is what plants it — the
 *  figure grows out of the floor instead of hovering off it. The stretch pivots
 *  on `root`, which sits BELOW the shoes (y 886 against a shoe line near 830),
 *  so the feet move by a pixel and the head carries the travel. */
export type ReactionTier = {
  bones: ReactionSpec;
  durationMs: number;
  snap: number;
  hold: number;
  rise: number;
  stretch: number;
  lean: number;
  /**
   * What happens DURING the hold, and why a tier that omits it looks stuck.
   *
   * Measured off the reference cast (Miami Mayhem teardown, `reports/
   * character-reactions.md` §3): every one of their reactions puts something in
   * the hold — a biceps scale shaking between 1.40 and 1.52 on a 0.067s period,
   * a prop swinging 14.6 degrees inside one frame. Their note is explicit that a
   * hold with nothing moving in it reads as jammed rather than as effort.
   *
   *   deg      amplitude, degrees, added and subtracted
   *   periodMs full cycle; 67ms is the reference's own
   *   bones    keep it to what is ALREADY carrying the gesture — a tremor on a
   *            still bone reads as a glitch
   */
  /**
   * The perspective push — where the sense of SIZE comes from now that no tier
   * moves the figure as a whole.
   *
   * This is the reference's `*_persp` bone, reproduced. Their teardown
   * (`character-reactions.md` §4a) measures it on all four reacting characters:
   * a control bone parented under the spine, carrying a displacement of
   * (+50.7, +90.8) on `main_guy`, weighted 0.39–0.52 across the torso mesh —
   * and, critically, **with no child bones**. It does not carry the character
   * anywhere. It pushes the torso's own vertices and nothing else, so the
   * silhouette swells toward the viewer while the feet, the head and the hands
   * stay exactly where the joints put them.
   *
   * `x` / `y` are fractions of the figure box, applied to the named bone's
   * FINAL matrix after the hierarchy has already been composed — that is what
   * keeps it off the children. See skinnedFigure.update().
   */
  push?: { bone: string; x: number; y: number };
  tremor?: { deg: number; periodMs: number; bones: string[] };
  /**
   * Additive re-draw of the figure's own texture, peaking with the reaction.
   *
   * The reference's cheapest source of "size" (§4c): their glow slots point at
   * the SAME attachment as the body and differ only by `"blend": "additive"`.
   * No bone moves for it, no new art is drawn for it. `skinnedFigure.ts` does
   * this with a second Mesh sharing the first one's geometry, so it deforms
   * with the body for free.
   */
  glow?: number;
};

export const DEG = Math.PI / 180;
export const LOOP_MS = 8000;

// Idle envelope shape, and the default for the reaction tiers that do not
// override it.
export const SNAP = 0.18;
export const HOLD = 0.63;

/* ── TURF WAR'S OWN RIGS, rebuilt on the 2026-09-14 redraw ────────────────────
 *
 * The man is drawn twice, and each drawing has its own rig
 * (design/rig/build_turf_rigs.py) and its own motion below:
 *
 *   base      guy.rig.json          bat planted outside the foot in one hand,
 *                                   other hand in the pocket
 *   shoulder  guy_feature.rig.json  bat on the shoulder, barrel angled AWAY from
 *             guy_kingpin.rig.json  the hood; kingpin is the same silhouette
 *
 * The redraw was requested in ART_BRIEF_CAST_RIG.md because the first drawings
 * locked both hands onto one bat (base) and ran the bat behind the hood
 * (shoulder), which held the torso to 3 degrees.
 *
 * ── THE LIMITS, one joint at a time, judged zoomed on the bat and hands ──────
 *
 *               hips waist chest neck head arm_l fore_l arm_r fore_r
 *   base          2    6     7    7    9    5     3      6    10
 *   shoulder      5    7     7    7    9    6    12      6    10
 *
 * base: the fist and bat hang off ROOT so the planted bat stays on the ground
 * while the body leans; the lean is absorbed along the forearm. fore_l rocks the
 * bat about the fist, and its foot slides ~7px per degree, so 3 is the ceiling.
 * Hips above 2 kink the handle below the fist.
 *
 * ── THE CARRIER ─────────────────────────────────────────────────────────────
 *
 * shoulder: fore_l, POSITIVE — the bat lifts off the shoulder and drops back.
 * base: fore_r, NEGATIVE — the pocket arm's elbow kicks out while the hand stays
 * in the pocket (the hand belongs to the hips). The bat only rocks underneath.
 * check_cast_motion.mjs holds the head/neck and free-end ratios against each
 * pose's own carrier. Positive-left/negative-right opens the body on both.
 *
 * THE SPINE IS HELD BY HEAD TRAVEL, NOT BY THE JOINT LIMITS. The redraw lets the
 * torso bend to 7deg cleanly, and the first tables used that room — which put the
 * head at 12% of body height on the shoulder trigger. measure_cast_travel.mjs's
 * budget (the 頭部位移太多 complaint, turned into a number) is the real ceiling;
 * the spine was cut to fit it and the carriers were left alone, which is the
 * reference's 本體小、附屬物大 anyway. */

export type CastPose = "base" | "shoulder";
export const CAST_POSES: CastPose[] = ["base", "shoulder"];
/** Which limb carries the reaction on each drawing — the gate reads this. */
export const CARRIER: Record<CastPose, string> = { base: "fore_r", shoulder: "fore_l" };

/* Periods, lags and odd-beat scales are the tuned ones (rule 1 depends on the
 * periods). On the base pose the arms and the bat-rock are cut so the permanent
 * sway stays well under 60% of those joints' limits. */
const IDLE_BODY: Record<string, MotionSpec> = {
  root: [0, 0, 2000, 0],
  hips: [0.099, 0, 2450, 0],
  waist: [0.198, 360, 2800, 0.2],
  chest: [0.396, 180, 2150, 0.3],
  neck: [0.627, 120, 2650, 0.5],
  head: [0.9075, 60, 1750, 0.8],
  fore_r: [0.968, 360, 1550, 0.3],
};

export const IDLE_BY_POSE: Record<CastPose, Record<string, MotionSpec>> = {
  base: {
    ...IDLE_BODY,
    arm_l: [0.9, 0, 2050, 0.4],
    fore_l: [0.6, 300, 1800, 0.3],
    arm_r: [0.85, 180, 1500, 0.4],
  },
  shoulder: {
    ...IDLE_BODY,
    arm_l: [1.408, 0, 2050, 0.4],
    fore_l: [1.056, 300, 1800, 0.3],
    arm_r: [1.32, 180, 1500, 0.4],
  },
};

/* BASE — the everyday pose: win and winBig most of the time, and the trigger
 * (the texture only turns to the shoulder pose once the feature starts). */
const BASE_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: {
    durationMs: 720, snap: 0.18, hold: 0.42, rise: 0, stretch: 0, lean: 0,
    push: { bone: "chest", x: 0.003, y: 0.009 },
    bones: {
      hips: [0.13, 0], waist: [0.35, 10], chest: [0.6, 18], neck: [0.5, 30], head: [0.75, 42],
      arm_l: [0.4, 24], fore_l: [0.6, 60], arm_r: [-0.6, 22], fore_r: [-2.6, 54],
    },
  },
  winBig: {
    durationMs: 940, snap: 0.15, hold: 0.6, rise: 0, stretch: 0, lean: 0,
    push: { bone: "chest", x: 0.007, y: 0.022 },
    bones: {
      hips: [0.2, 0], waist: [0.6, 25], chest: [0.95, 45], neck: [0.75, 75], head: [1.15, 105],
      arm_l: [0.9, 60], fore_l: [1.2, 150], arm_r: [-1.2, 55], fore_r: [-4.5, 135],
    },
  },
  trigger: {
    durationMs: 1250, snap: 0.18, hold: 0.63, rise: 0, stretch: 0, lean: 0,
    push: { bone: "chest", x: 0.012, y: 0.038 },
    glow: 0.34,
    tremor: { deg: 0.5, periodMs: 67, bones: ["fore_r"] },
    bones: {
      hips: [0.3, 0], waist: [1.0, 45], chest: [1.5, 85], neck: [1.25, 145], head: [2.0, 210],
      arm_l: [1.4, 95], fore_l: [1.8, 235], arm_r: [-2.0, 135], fore_r: [-7.0, 275],
    },
  },
};

/* SHOULDER — feature and kingpin. The bat lifts off the shoulder (fore_l +) and
 * the body follows it up the chain; the pocket arm answers on the other side. */
const SHOULDER_TIERS: Record<CastReactionKind, ReactionTier> = {
  win: {
    durationMs: 720, snap: 0.18, hold: 0.42, rise: 0, stretch: 0, lean: 0,
    push: { bone: "chest", x: 0.003, y: 0.009 },
    bones: {
      hips: [0.15, 0], waist: [0.35, 10], chest: [0.5, 18], neck: [0.45, 30], head: [0.7, 42],
      arm_l: [0.5, 24], fore_l: [2.8, 60], arm_r: [-0.4, 22], fore_r: [-1.2, 54],
    },
  },
  winBig: {
    durationMs: 940, snap: 0.15, hold: 0.6, rise: 0, stretch: 0, lean: 0,
    push: { bone: "chest", x: 0.007, y: 0.022 },
    bones: {
      hips: [0.25, 0], waist: [0.55, 25], chest: [0.8, 45], neck: [0.75, 75], head: [1.15, 105],
      arm_l: [1.2, 60], fore_l: [5.5, 150], arm_r: [-1.0, 55], fore_r: [-2.4, 135],
    },
  },
  trigger: {
    durationMs: 1250, snap: 0.18, hold: 0.63, rise: 0, stretch: 0, lean: 0,
    push: { bone: "chest", x: 0.012, y: 0.038 },
    glow: 0.34,
    tremor: { deg: 0.5, periodMs: 67, bones: ["fore_l"] },
    bones: {
      hips: [0.4, 0], waist: [0.9, 45], chest: [1.3, 85], neck: [1.3, 145], head: [2.0, 210],
      arm_l: [2.0, 95], fore_l: [9.5, 235], arm_r: [-1.6, 135], fore_r: [-4.0, 275],
    },
  },
};

/** How much of the tables the artwork takes. The tables above are written
 *  against Turf War's own measured limits, so this stays 1; it remains a dial
 *  because both gates multiply by it. */
export const MOTION_SCALE: Record<"guy", number> = {
  guy: 1,
};

export type CastReactionKind = "win" | "winBig" | "trigger";

export const TIERS_BY_POSE: Record<CastPose, Record<CastReactionKind, ReactionTier>> = {
  base: BASE_TIERS,
  shoulder: SHOULDER_TIERS,
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
