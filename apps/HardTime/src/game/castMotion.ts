/**
 * Every number the prisoner's motion is made of, and nothing else.
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
 *  and the three whole-body moves, all on the root, so they move the ENTIRE
 *  figure rigidly and no triangle changes shape:
 *
 *    rise    — root translation UP, as a fraction of the figure box height
 *    stretch — root vertical SCALE, as a fraction
 *    lean    — root translation toward the board, fraction of figure width
 *
 *  `rise` and `lean` carry the transcription's REACTION_LIFT (rig/motion.py):
 *  (0.018, 0.045) of the box at the trigger. `stretch` stays zero.
 *
 *  ⚠ The 2026-09-10 tables had all three at zero, on the strength of the RAW
 *  Spine teardown (`character-reactions.md` §4a: no root keyframe on any of
 *  the four reacting characters). That was the wrong reference for a mesh:
 *  those characters are cut-out parts whose arms turn 20 degrees and fight
 *  nothing. The transcription — the same reference ported onto THIS 10-bone,
 *  16x40 topology and swept against the fold gate — does lift the root, and a
 *  rigid lift is the one channel with no amplitude ceiling. Do not zero it
 *  again on the old argument. */
export type ReactionTier = {
  bones: ReactionSpec;
  durationMs: number;
  snap: number;
  hold: number;
  rise: number;
  stretch: number;
  lean: number;
  /**
   * The perspective push. NO TIER USES IT NOW — the transcription gets its size
   * from the root lift and squash and stretch, and the port has no push. Kept
   * because composeBoneMatrices still honours it.
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
  /**
   * NO TIER USES IT NOW — `flutter` below replaced it (the reference shakes a
   * muscle's SCALE through the hold, never its rotation).
   *
   * What happens DURING the hold, and why a tier that omits it looks stuck.
   *
   * Measured off the reference cast (Miami Mayhem teardown, `reports/
   * character-reactions.md` §3): every one of their reactions puts something in
   * the hold. `main_guy` shakes his biceps scale between 1.40 and 1.52 on a
   * 0.067s period — a muscle straining — and swings the bat 14.6 degrees inside
   * a single frame at the midpoint. Their note is explicit that a hold with
   * nothing moving in it reads as "卡住" (jammed) rather than as effort.
   *
   * Ours is the same idea on the only channel this rig has: a small, fast
   * oscillation added to the named bones for the length of the hold, riding on
   * top of the pose they are already holding.
   *
   *   deg      amplitude, degrees, added and subtracted
   *   periodMs full cycle; the reference's 67ms is the shortest that still
   *            reads as a tremor rather than as noise
   *   bones    which bones shake. Keep it to what is ALREADY carrying the
   *            gesture — a tremor on a bone that is not moving reads as a glitch
   */
  tremor?: { deg: number; periodMs: number; bones: string[] };
  /**
   * Additive re-draw of the figure's own texture, peaking with the reaction.
   *
   * The reference's third and cheapest source of "size" (§4c): five of their
   * glow slots point at the SAME attachment as the body, differing only by
   * `"blend": "additive"`. No bone moves, no new art is drawn — the same image
   * again, added to itself, is the flash. `skinnedFigure.ts` does exactly this
   * with a second Mesh sharing the first one's geometry, so it deforms with the
   * body for free.
   *
   * 0 or omitted = no glow, which is right for the small tiers: a line win that
   * lights the man up would be louder than the win.
   */
  glow?: number;
  /**
   * SQUASH AND STRETCH — the channel this rig was missing entirely.
   *
   * Every other channel on this type ROTATES a bone. Rotation never changes a
   * limb's length or thickness, so a figure driven by rotation alone reads as a
   * flat cut-out flapping at its joints: nothing in it ever looks like it is
   * taking load. 「人物整個像紙片一樣軟軟的」 was the review, and this is why.
   *
   * The reference's peak pose is mostly THIS, not rotation: `arm_r` at
   * 1.00x1.23, `arm_l_2` at 1.06x0.80, `biceps_r` at 1.52x1.56, against joint
   * rotations that never exceed 20deg. The driving arm lengthens and thickens;
   * the bracing arm compresses along its bone and bulges across it.
   *
   *   shape  per bone, (along the bone, across it) at the peak. The SHAPE of
   *          the gesture — which bone lengthens, which compresses.
   *   k      how much of that shape this figure takes. Swept against
   *          check_cast_motion rule 10, not chosen.
   *
   * Scale is applied in the bone's own frame about its pivot and does NOT pass
   * to children (see composeBoneMatrices). Straight from the hacksaw-character-
   * motion port (rig/motion.py REACTION_SCALE), which was swept against this
   * exact rig topology — 10 bones, one continuous 16x40 grid.
   *
   * It needs the arm bones to be ON the arms. Until 2026-09-17 this game's rig
   * was Hot Miami's, fitted to a different man: fore_l and fore_r owned ~0 of
   * the prisoner's forearms and hands, so any stretch here would have bent his
   * jacket and trousers instead. design/build_cast_guy_rig.py.
   */
  scale?: { k: number; shape: Record<string, [along: number, across: number]> };
  /**
   * The bulge does not hold still.
   *
   * The reference's `biceps_r` oscillates between 1.40 and 1.52 on a 2-frame
   * period for the whole hold — a muscle shaking under load. That is a mean
   * bulge of 1.46 wobbling by ±0.06, i.e. ±13% OF THE BULGE, so `depth`
   * modulates the EXCESS over 1 rather than the scale itself. Modulating the
   * scale directly would push a small bulge like the chest's 1.02 below 1.0,
   * turning a muscle straining into one alternately flexing and relaxing.
   *
   * Runs only between snap and hold: a muscle shakes while it is HOLDING a
   * load, not while it is still travelling. Without it the hold reads as a
   * freeze even with the bulge on.
   *
   * This replaces `tremor` on the tiers that use it. `tremor` put the shake on
   * ROTATION, which is the one channel the reference never shakes.
   */
  flutter?: { depth: number; periodMs: number };
};

export const DEG = Math.PI / 180;
export const LOOP_MS = 8000;

// Idle envelope shape, and the default for the reaction tiers that do not
// override it.
export const SNAP = 0.18;
export const HOLD = 0.63;

/* THE IDLE — verbatim from the transcription (hacksaw-character-motion,
 * rig/motion.py DEFAULTS). Every number below, lag, period and odd-beat
 * included, is the reference's.
 *
 * What it replaces — Capo Nostra's idle, carried here verbatim since the
 * reskin — had the right TIMING and the wrong SIZE: the lags, periods and odd
 * beats matched, but the whole spine had been scaled up 1.65x (head 0.55 ->
 * 0.9075) and the arms down to 0.88x. A spine that sways 65% more than the
 * reference is the whole sheet of paper rocking, which is half of what Capo's
 * review called 「人物整個像紙片一樣軟軟的」. The reference keeps the spine
 * small and lets the arms breathe.
 *
 * Periods stay mutually prime-ish, so no two loops ever line up (rule 1). */
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

/* THE REACTION — verbatim from the transcription (hacksaw-character-motion,
 * rig/motion.py: REACTION, REACTION_LIFT, REACTION_SCALE, SCALE_K, FLUTTER,
 * REACTION_MS, SNAP, HOLD).
 *
 * ── WHAT WAS WRONG WITH THE TABLES THIS REPLACES ────────────────────────────
 *
 * They were Capo Nostra's, copied in with the reskin and identical to the
 * byte. Capo built them on 2026-09-10 from the RAW Spine teardown
 * (`character-reactions.md`) — main_guy's hand at +20.0deg, girl_arm_R at
 * 18.77, bikinigirl at +27.1. Those are CUT-OUT characters: each arm is its own
 * attachment, so it can rotate 20 degrees and fight nothing. This figure is one
 * continuous mesh. Its arm cannot rotate 20 degrees, so the tables pushed the
 * gesture into the forearm as far as the joint gate allowed — fore_l at 6.7deg,
 * 6.2x the port's 1.08 — and with no squash and stretch at all, that is exactly
 * a flat forearm flapping. 「人物整個像紙片一樣軟軟的」.
 *
 * rig/motion.py is the same reference ported onto THIS topology (10 bones, one
 * 16x40 grid) and swept against the same fold gate. It distributes the gesture
 * the opposite way round, and the difference is the whole point:
 *
 *                    the old tables     the port
 *     head              2.5               4.02    <- the spine carries rotation
 *     neck              1.7               2.70
 *     fore_l            6.7               1.08    <- the arms barely rotate...
 *     arm_r stretch     none              1.23x   <- ...they lengthen instead
 *     root lift         0                 (1.8%, -4.5%) of the box
 *
 * ── IT FITS, AND WITH ROOM ──────────────────────────────────────────────────
 *
 * Measured 2026-09-17 on the rig design/build_cast_guy_rig.py writes — the one
 * whose arm bones are actually on the prisoner's arms — at 8 trigger phases
 * (rule 10, inked triangles only):
 *
 *     the 2026-09-10 tables            fold 56.0%   stretch 1.54x
 *     the port, arm_l driving, k 0.42  fold 71.0%   stretch 1.28x   <- shipped
 *
 * The old tables clear the fold floor on this rig, and that is exactly the
 * trap rule 10 cannot see: fold is AREA. They swing fore_l 6.7deg, ~8.2 with
 * the idle on top, and the prisoner's hand is only clean to 7 — past it the
 * fingers are drawn to a point on one side and smeared fat on the other while
 * every triangle keeps its area. Rule 1 fails them; rule 10 alone would not.
 *
 * On the rig this game shipped with before — Hot Miami's, fitted to a
 * different man — the 2026-09-10 tables were ALREADY folding in the live
 * build: trigger 3.6% / 2.27x, big win 43%. Nothing measured it; this game's
 * gate had no mesh rule.
 *
 * ── THE ONE THING THIS RIG CANNOT COPY ──────────────────────────────────────
 *
 * The reference stretches its arm to 1.23x. On one continuous mesh the arm tops
 * out near 1.11x, and no retuning moves that much: their arm is a separate
 * attachment that fights nothing, while here a scale on one bone has to be
 * absorbed by the blended boundary with its neighbours. One mesh buys "no seams,
 * ever" and pays for it in squash-and-stretch headroom. The SHAPE is identical;
 * the ceiling on its size is the price of the rig.
 *
 * ── WHICH ARM DRIVES: arm_l, BY MEASUREMENT ─────────────────────────────────
 *
 * The port's driving arm is `arm_r`, the straight arm on the port's own figure
 * that throws out. Capo Nostra mirrored it to `arm_l` BY ROLE, because the
 * Don's `arm_r` is a folded cigar arm that cannot throw anything.
 *
 * The prisoner has no such tell: he stands square, both arms hanging straight
 * and mirror-symmetric to within 2px, so either arm can play the role. Rule 10
 * on this rig, 8 trigger phases:
 *
 *                                 win       big win   trigger
 *     A  by name  (arm_r drives)  79.4%     75.9%     72.2% / 1.32x
 *     B  mirrored (arm_l drives)  79.3%     75.0%     71.0% / 1.28x   <- shipped
 *
 * The mesh does not choose between them — within a point of fold, B a little
 * less stretch. (On the first cut of the rig, with one smoothing pass, B led by
 * ten points; the second pass that cleaned up the hands closed that gap.) B
 * matches Capo Nostra's mapping, so the two games share one table. Chosen by
 * the user 2026-09-17.
 *
 * The sign convention is re-measured on this rig, not inherited: arm_l +10deg
 * moves the prisoner's hand 17.5px OUTWARD, arm_r -10deg moves his other hand
 * 26.8px outward, so positive-left / negative-right opens the body. Every
 * magnitude is the port's, moved to the other side.
 */

/** Degrees at the peak — the port's magnitudes, driving and bracing sides
 *  swapped (see above). No per-bone lag: the port drives every bone from one
 *  envelope, and its size comes from the lift and the stretch rather than from
 *  a wave travelling up the chain. */
const REFERENCE_ROTATION: Record<string, number> = {
  chest: 1.68,
  neck: 2.7,
  head: 4.02,
  // driving (the port's arm_r -0.48 / fore_r -1.56, mirrored)
  arm_l: 0.48,
  fore_l: 1.56,
  // bracing (the port's arm_l 0.36 / fore_l 1.08, mirrored)
  arm_r: -0.36,
  fore_r: -1.08,
};

/** (along the bone, across it) at the peak. The driving arm throws out —
 *  longer and thicker; the ribcage lifts; the bracing arm compresses along its
 *  bone and bulges across it.
 *
 *  The bracing forearm takes the ORIGINAL reference's 0.80, not the port's
 *  softened 0.96. The port softened it only because its figure's forearm ran
 *  down against the torso, and says so: "On a figure with daylight under the
 *  arm, put it back." The prisoner's gap is thin (5-8px) so it was measured
 *  rather than assumed: trigger fold 71.0% at 0.80 against 76.6% at 0.96. The
 *  reference's number costs five points and still clears the 50% floor by
 *  twenty, so it stays — the compression is half of the gesture. */
const REFERENCE_SCALE: Record<string, [number, number]> = {
  arm_l: [1.23, 1.1],
  fore_l: [1.15, 1.05],
  chest: [1.06, 1.02],
  neck: [1.04, 1.0],
  arm_r: [0.97, 1.02],
  fore_r: [0.8, 1.06],
};

const REFERENCE_SCALE_K = 0.42;

/** Root lift as (toward the board, up), fractions of the figure box. The port's
 *  REACTION_LIFT. A translation on the root moves the whole figure with zero
 *  distortion — no triangle changes shape — so it is the one channel with no
 *  amplitude ceiling, which is why the port puts real numbers here. */
const REFERENCE_LIFT = { lean: 0.018, rise: 0.045 };

/** A muscle shaking under load: ±13% of the bulge, every 2 frames at 30fps. */
const REFERENCE_FLUTTER = { depth: 0.13, periodMs: 66.7 };

/**
 * One tier, as a fraction of the reference gesture.
 *
 * The reference defines ONE reaction — the feature trigger. This game needs a
 * ladder of three, and the rule that keeps the ladder honest is that the lower
 * rungs are the SAME gesture at less size, never a different pose: a big win has
 * to read as "the same man, more of it". So every channel — rotation, lift and
 * stretch — scales by the one fraction, and the shape between bones is untouched.
 */
function fromReference(
  fraction: number,
  timing: { durationMs: number; snap: number; hold: number },
  glow = 0,
): ReactionTier {
  const bones: ReactionSpec = {};
  for (const [bone, degrees] of Object.entries(REFERENCE_ROTATION))
    bones[bone] = [degrees * fraction, 0];
  return {
    ...timing,
    bones,
    rise: REFERENCE_LIFT.rise * fraction,
    lean: REFERENCE_LIFT.lean * fraction,
    stretch: 0,
    scale: { k: REFERENCE_SCALE_K * fraction, shape: REFERENCE_SCALE },
    flutter: REFERENCE_FLUTTER,
    glow,
  };
}

/** The feature trigger: the reference, at full size. REACTION_MS 1000, SNAP
 *  0.18, HOLD 0.63 — the port's own timing. The glow is the reference's
 *  additive re-draw (§4c), kept to this tier: a line win that lights the man up
 *  would be louder than the win. */
export const TRIGGER_REACTION: ReactionTier = fromReference(
  1,
  { durationMs: 1000, snap: 0.18, hold: 0.63 },
  0.34,
);

/** A big win: three-quarters of the gesture, arriving sooner and holding
 *  longer than a line win. */
export const WIN_BIG_REACTION: ReactionTier = fromReference(0.75, {
  durationMs: 880,
  snap: 0.15,
  hold: 0.6,
});

/** A line win — the common case, so a nod rather than a celebration. Half the
 *  gesture is the floor, not a taste call: its loudest bone (the head, 2.01deg)
 *  has to clear 2deg to be visible at all and 1.25x its own idle peak so the
 *  breathing does not bury it (check_cast_motion rule 2). */
export const WIN_REACTION: ReactionTier = fromReference(0.5, {
  durationMs: 720,
  snap: 0.18,
  hold: 0.42,
});

/** How much of the tables the artwork actually takes.
 *
 * Hot Miami needs this because two figures drawn very differently share one set
 * of tables, and its man takes 0.36 of them. Hard Time has exactly ONE cast
 * member, and the tables above were checked against the prisoner's own rig and
 * his own measured limits, so his scale is 1.
 *
 * It stays as a dial because the gate multiplies by it: if a second figure is
 * ever stood beside this board, it needs its own entry here AND its own row in
 * check_cast_motion.mjs's JOINT_LIMIT_DEG, measured the same way. Adding one
 * without the other is exactly how the shipped build with the broken hand
 * happened on the other game. */
export const MOTION_SCALE: Record<"guy", number> = {
  guy: 1,
};

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
  /** Unit vector along the bone, when it cannot be derived. A leaf's axis is
   *  otherwise taken as parent -> self, which is right for an arm hanging
   *  straight and wrong for one that folds back on itself (Capo Nostra's cigar
   *  forearm points ~130deg away from its upper arm). The prisoner's arms are
   *  straight, so his written elbow -> wrist axis sits ~7deg from the derived
   *  one; it is written anyway, so a redraw with a bent arm cannot silently
   *  stretch the wrong way. Written by design/build_cast_guy_rig.py; only
   *  squash and stretch reads it. */
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

/** The envelope for everything that carries NO lag — the rigid rise, stretch,
 *  lean, push and glow all ride this, so they start WITH the body rather than
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
 * Unit vector along each bone, pivot -> first child (or parent -> self at a
 * leaf, or straight up at a lone root).
 *
 * The rig stores a bone as a pivot and a parent with no length or direction,
 * because rotation about a pivot does not need one. Squash and stretch does:
 * "along the bone" and "across the bone" are different directions and have to
 * be scaled by different amounts, or the limb just gets bigger instead of
 * getting longer. Same derivation as rig/skin.py `bone_axes`, including taking
 * the FIRST child by index.
 */
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

/**
 * Compose every bone's world matrix into `out` — one Float32Array(6) per bone,
 * allocated by the caller so the per-frame path allocates nothing. Returns the
 * body envelope, which the renderer also needs for the glow.
 *
 * TWO MATRICES PER BONE, because scale must not inherit.
 *
 *   out[i]    what SKINS the mesh: rotation, translation, and this bone's own
 *             squash and stretch
 *   chain[i]  what CHILDREN compose against: rotation and translation only
 *
 * Letting a child inherit its parent's scale was tried in the reference port
 * first and it inverts triangles at the far end of the chain: stretching an
 * upper arm drags the forearm's whole frame with it, the taper toward the wrist
 * makes those triangles tiny, and they fold. Measured there, inheritance held
 * together only to a sixth of the shipped amplitude. The reference itself
 * blocks inheritance at every joint down its stretching arm
 * (`noScaleOrReflection` / `noScale`).
 *
 * When no bone carries any scale, out and chain are the same numbers computed
 * by the same operations, so this is bit-identical to the rotation-only
 * composition it replaced. design/check_cast_motion.mjs relies on that.
 */
export function composeBoneMatrices(
  rig: MeshRig,
  state: PoseState,
  out: Float32Array[],
  chain: Float32Array[],
) {
  const { tier, reactionAge, durationMs, speed, motionScale, timeMs } = state;
  const bodyReaction = bodyEnvelope(state);
  const [boxX0, boxY0, boxX1, boxY1] = rig.figure_box;
  const figureWidth = boxX1 - boxX0;
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
    const angle = (idle + reaction) * DEG;
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

    // This bone's own squash and stretch, if the tier gives it one and the
    // reaction is live. Uses the SAME lagged envelope as this bone's rotation,
    // so the bulge arrives with the swing rather than ahead of it — the
    // reference drives both from one envelope, and keeping them in step is what
    // that preserves.
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
  // written straight into one bone's final SKIN matrix, so it reaches only the
  // vertices weighted to that bone and nothing inherits it.
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
