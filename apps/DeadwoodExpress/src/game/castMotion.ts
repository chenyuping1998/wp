/**
 * Every number the cast's motion is made of, and nothing else.
 *
 * THIS MODULE MUST NOT IMPORT ANYTHING. design/check_cast_motion.mjs loads it
 * with bare node to measure the tables rather than trust them, the same
 * arrangement game/idleSway.ts already has with check_idle_sway.mjs. One pixi
 * import here and that gate cannot run at all.
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
 *  not a person. Measured off Hacksaw's Miami Mayhem cast (see
 *  docs/handoff/hot_miami.md, 2026-08-27): motion travels UP the chain, each
 *  link starting after the one it hangs from. Hips lead, the head arrives last,
 *  and the hair arrives after that. */
export type ReactionSpec = Record<string, [amplitudeDeg: number, lagMs: number]>;

/** One reaction tier: what each bone does, how long it runs, and the two
 *  whole-body moves that cost NOTHING in mesh distortion, because they are
 *  rigid on the entire figure rather than a bend at a joint:
 *
 *    rise    — root translation, as a fraction of figure height
 *    stretch — root vertical scale, as a fraction
 *
 *  Miami Mayhem's own note on their breathing bone: translation alone "looks
 *  like the whole person is floating". The stretch is what plants it. */
export type ReactionTier = {
  bones: ReactionSpec;
  durationMs: number;
  rise: number;
  stretch: number;
};

export const DEG = Math.PI / 180;
export const LOOP_MS = 8000;
export const SNAP = 0.18;
export const HOLD = 0.63;

// The reference rig's measured motion, reduced to 55%. The resulting gate
// measurement is 0.42% head travel and 0 px at the feet: visible life without
// returning to the large whole-body sway that failed review.
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
  // Miami Mayhem's rule 2, which nothing on this rig obeyed until now: the BODY
  // holds to 1-3 degrees and the amplitude goes to whatever hangs off it —
  // their hair measured 27.5 against a 1-3.3 body, four to eight times over.
  // The girl's hair is the only mass on either figure big enough to carry it
  // (the man's is short and sits on the skull; a bone there would read as a wig
  // sliding, so he does not have one). Its own period is coprime with every
  // other line here so the two never lock, and it lags the head it hangs from.
  hair: [1.9, 520, 3350, 0.6],
};

/* WHY THESE NUMBERS, AND WHY THEY ARE MUCH LARGER THAN THEY WERE.
 *
 * The previous tables peaked at 0.41 degrees on a line win. On a figure drawn
 * ~400px tall that moves an extremity under 3px across the whole beat: the
 * reaction was, measurably, invisible. The trigger was not much better at 2.4.
 *
 * The ceiling was measured rather than guessed, by rotating one joint at a
 * time through 90 degrees and rendering the mesh (design/, and the sweep sheets
 * in the 2026-09-02 handoff entry). What breaks, and when:
 *
 *     shoulder (arm_*)   clean to ~10 deg, visibly tearing by 15-30
 *     elbow (fore_*)     clean to ~15 deg, the hand goes to a blade by 30-45
 *     chest / waist      clean to ~20-25 deg
 *     neck / head        clean past 60 deg
 *
 * The limit is each joint's OWN local angle, not the total the chain adds up
 * to: an accumulated rotation carries the parts below it rigidly, and rigid
 * costs nothing. So the amplitude is spread down the chain, and every entry
 * below sits well inside its own joint's measured budget while the figure as a
 * whole moves many times further than it used to.
 *
 * Sign convention, checked by rendering both directions: POSITIVE opens the
 * body and raises the arms. The old win table had the arms negative, so the one
 * reaction the player sees most often was the girl lowering her raygun — a
 * deflating gesture on a win. */

// The feature trigger: the top of the ladder, and the rarest, so it is allowed
// to be the biggest thing the figure does.
export const TRIGGER_REACTION: ReactionTier = {
	durationMs: 1250,
	rise: 0.045,
	stretch: 0.025,
	bones: {
		hips: [1.6, 0],
		waist: [2.5, 40],
		chest: [3.5, 80],
		neck: [4.7, 130],
		head: [6.4, 180],
		arm_l: [7.5, 110],
		fore_l: [12.5, 190],
		arm_r: [3.8, 110],
		fore_r: [7.5, 190],
		hair: [14.0, 300],
	},
};

// A win worth making a fuss about (see BIG_WIN at the call site). Reads clearly
// from across the screen without matching the trigger.
export const WIN_BIG_REACTION: ReactionTier = {
	durationMs: 1100,
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
		arm_r: [3.0, 110],
		fore_r: [6.0, 190],
		hair: [11.0, 300],
	},
};

// An ordinary line win. This is the common case by a wide margin — the base
// game pays about one spin in 3.5 — so it stays a nod rather than a
// celebration. It is still an order of magnitude larger than what shipped
// before, because what shipped before could not be seen at all.
export const WIN_REACTION: ReactionTier = {
	durationMs: 950,
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
		arm_r: [1.5, 110],
		fore_r: [3.0, 190],
		hair: [5.5, 280],
	},
};

/** How much of the tables each figure actually takes.
 *
 * NOT a taste dial — it is a property of the drawing, and it was measured the
 * same way everything else here was: render the peak pose, zoom in on the
 * extremity, and look.
 *
 * The man is drawn with his arms hanging against his body, so each arm is about
 * ONE grid cell wide and there is almost no mesh across it to absorb a bend. At
 * the full table his hand stretched into a point at 12.5deg, was still visibly
 * drawn out at 8.8 and 6.9, and only came back to being a hand around 5. The
 * woman holds her arm away from her body with several cells across it and takes
 * the tables as written.
 *
 * This also corrects an earlier measurement. The first sweep judged the whole
 * figure at viewing size and put the elbow's limit near 15deg; zoomed to the
 * hand, the man's is nearer 6. A limit read off the silhouette is not a limit.
 */
export const MOTION_SCALE: Record<"guy" | "girl", number> = {
	guy: 0.36,
	girl: 1.0,
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

export function reactionEnvelope(value: number) {
  if (value <= 0 || value >= 1) return 0;
  if (value < SNAP) {
    const t = value / SNAP;
    return t * t * (3 - 2 * t);
  }
  if (value < HOLD) return 1;
  const t = 1 - (value - HOLD) / (1 - HOLD);
  return t * t * (3 - 2 * t);
}
