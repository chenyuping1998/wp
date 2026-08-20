/**
 * Rigged symbols: the parts a symbol is cut into, and what each part does.
 *
 * Everything before this animated a symbol as ONE image — the whole PNG scaled,
 * rotated and offset. That is as far as a flat sprite can go, and it is why the
 * boombox could thump but its speakers could not move, and why the flamingo
 * could dip but could not peck.
 *
 * The art is now delivered cut into layers (design/source/parts/<symbol>/), so a
 * rigged symbol is drawn as a stack of full-canvas PNGs, each with its own
 * transform about its own pivot. `SymbolArt.svelte` draws the stack; a symbol
 * with no entry here keeps rendering exactly as before, as a single sprite.
 *
 * ── Composition ──────────────────────────────────────────────────────────────
 *
 * Part motion is ADDITIVE to the whole-symbol motion in symbolWinMotion.ts /
 * symbolLandMotion.ts. The symbol still leans, thumps and lands as a body; the
 * parts move ON it. Keeping the two separate means the existing gates keep
 * measuring what they always measured, and a symbol can be rigged without
 * rewriting its character motion.
 *
 * ── Pivots ───────────────────────────────────────────────────────────────────
 *
 * A pivot is given in the part's OWN BBOX fractions — [0.5, 1] is bottom centre
 * of that part, [0.5, 0.5] its middle — and resolved against the measured bbox
 * in partsManifest.ts, which is generated from the actual pixels. So "the handle
 * rotates about where it meets the case" survives the art being regenerated at a
 * slightly different size; a hand-copied cell coordinate would not.
 */

/**
 * ── Why this file imports nothing ────────────────────────────────────────────
 *
 * Same rule as symbolWinMotion.ts and symbolLandMotion.ts: the gates load these
 * tables in plain node, and node ESM cannot resolve an extensionless relative
 * import. So the two windows below are restated here rather than imported, and
 * `design/check_symbol_parts.mjs` asserts they still equal the real ones — a
 * copied constant that nothing checks is exactly how a beat drifts out of sync
 * with the body it is supposed to be playing against.
 */

/** mirrors HOLD_MS in symbolWinMotion.ts */
const HOLD_MS = 480;
/** mirrors LAND_MS in symbolLandMotion.ts */
const LAND_MS = 240;

export type PartFrame = {
	/** cell fractions, added to whatever the whole symbol is doing */
	dx: number;
	dy: number;
	rotation: number;
	scaleX: number;
	scaleY: number;
};

export type SymbolPart = {
	/** file stem under static/assets/sprites/hotMiamiParts/<symbol>/ */
	name: string;
	/** asset registry key — must exist in game/assets.ts */
	key: string;
	/** pivot in this part's own bbox fractions: [0.5, 1] is bottom centre */
	pivot: [number, number];
	/** what this part does while the symbol is winning; `t` is ms since the win */
	win?: (t: number) => Partial<PartFrame>;
	/** what it does as the symbol lands; `t` is ms since touchdown */
	land?: (t: number) => Partial<PartFrame>;
};

/** Parts are listed BACK TO FRONT — first drawn is furthest away. */
export type SymbolRig = { parts: SymbolPart[] };

const rest = (over: Partial<PartFrame> = {}): PartFrame => ({
	dx: 0,
	dy: 0,
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
	...over,
});

/** Sharp attack, exponential decay — a struck thing. */
const strike = (u: number, sharpness: number) => Math.exp(-sharpness * u);
/** Sawtooth 0→1 over `period` ms. */
const cycle = (t: number, period: number) => (t % period) / period;
/** Progress across the landing, clamped so anything past the end is at rest. */
const landP = (t: number) => Math.max(0, Math.min(1, t / LAND_MS));

// ── the rigs ─────────────────────────────────────────────────────────────────

/**
 * H4, the boombox. The first rigged symbol, and the one the art came back
 * cleanest for: the case ships with two empty speaker wells, and the cones and
 * the handle are separate complete objects.
 *
 * The beat is H4's whole character — it is the only symbol on the board that
 * keeps time — so the rig is built on the same beat the body already thumps to
 * (HOLD_MS * 0.48), and the parts play AGAINST it rather than with it:
 *
 *   cones    push out on the beat, the bass driver harder and a beat behind
 *   handle   swings on its own inertia, lagging the case
 *
 * Everything a speaker does is scale about its own centre — a cone pumps, it
 * does not travel — and the handle only rotates, about where it meets the case.
 */
const BEAT_MS = HOLD_MS * 0.48;

const boombox: SymbolRig = {
	parts: [
		{
			name: 'body',
			key: 'hmH4Body',
			pivot: [0.5, 0.5],
			// The case itself stays almost still. Its thump already lives in
			// symbolWinMotion/symbolLandMotion as the whole-symbol motion, and
			// doubling it here would just make the symbol bigger, not livelier.
			win: (t) => ({ scaleY: 1 - 0.012 * strike(cycle(t, BEAT_MS), 6) }),
		},
		{
			name: 'speaker_top',
			key: 'hmH4SpeakerTop',
			pivot: [0.5, 0.5],
			// Tweeter: quick, small, on the beat.
			win: (t) => {
				const push = strike(cycle(t, BEAT_MS), 7);
				return { scaleX: 1 + 0.085 * push, scaleY: 1 + 0.085 * push, dy: -0.004 * push };
			},
			// The shock reaches the small cone LATE and passes through it once: a
			// single hump starting at 18% of the landing, not a decay from the
			// impact frame. Two exponential decays at different rates still read as
			// one motion to the checker (they scored 0.19, then 0.40 after the woofer
			// was given an oscillation) — and to the eye. Different TIMING is what
			// separates parts, exactly as it separates whole symbols.
			land: (t) => {
				const u = landP(t);
				const pulse = u < 0.18 || u > 0.62 ? 0 : Math.sin((Math.PI * (u - 0.18)) / 0.44);
				return { scaleX: 1 + 0.07 * pulse, scaleY: 1 + 0.07 * pulse };
			},
		},
		{
			name: 'speaker_bottom',
			key: 'hmH4SpeakerBottom',
			pivot: [0.5, 0.5],
			// Woofer: bigger excursion, slower recovery, and HALF A BEAT LATE, so
			// the two cones read as two drivers rather than one pair blinking.
			win: (t) => {
				const push = strike(cycle(t + BEAT_MS * 0.5, BEAT_MS), 4.5);
				return { scaleX: 1 + 0.13 * push, scaleY: 1 + 0.13 * push, dy: 0.006 * push };
			},
			// On landing the heavy cone FLAPS — pushed out, sucked back, out again —
			// where the tweeter above just jolts once and stops. The first version
			// gave both of them the same decaying push and the gate scored them 0.19
			// apart: two cones doing one motion at two sizes, which is the flat
			// sprite's problem re-created inside a rig.
			land: (t) => {
				const u = landP(t);
				const flap = Math.exp(-4.5 * u) * Math.cos(Math.PI * 2.6 * u);
				return { scaleX: 1 + 0.12 * flap, scaleY: 1 + 0.12 * flap };
			},
		},
		{
			name: 'handle',
			key: 'hmH4Handle',
			// Rotates about where it meets the case — bottom centre of its own
			// bbox — not about the middle of the cell, which would swing the whole
			// handle sideways like a windscreen wiper.
			pivot: [0.5, 1],
			// Inertia: the case moves first and the handle follows, so its sway is
			// a slower wave than the beat and never lines up with it.
			win: (t) => ({ rotation: 0.05 * Math.sin(t / 190) }),
			// On landing it whips once and rings down — the only part of this
			// symbol that oscillates rather than pulses.
			land: (t) => {
				const u = landP(t);
				return { rotation: 0.11 * Math.exp(-4 * u) * Math.sin(Math.PI * 3.2 * u) };
			},
		},
	],
};

export const SYMBOL_RIGS: Record<string, SymbolRig> = {
	H4: boombox,
};

/** Exposed so design/check_symbol_parts.mjs can prove the copies above match. */
export const PART_WINDOWS = { HOLD_MS, LAND_MS };

export const getSymbolRig = (name: string): SymbolRig | null => SYMBOL_RIGS[name] ?? null;

/**
 * Resolve a part's pivot to cell coordinates (fractions of the cell, origin at
 * its centre) against the part's measured bounding box. `bbox` comes from
 * partsManifest.ts — passed in rather than imported, see the note at the top.
 *
 * A part with no measurement pivots about the centre of the cell, which makes a
 * missing or unmeasured part behave like the flat sprite instead of flying off
 * to a corner.
 */
export const resolvePivot = (
	bbox: [number, number, number, number] | undefined,
	pivot: [number, number],
): [number, number] => {
	if (!bbox) return [0, 0];
	const [x0, y0, x1, y1] = bbox;
	return [x0 + (x1 - x0) * pivot[0], y0 + (y1 - y0) * pivot[1]];
};

export const partFrame = (
	part: SymbolPart,
	mode: 'win' | 'land',
	t: number,
): PartFrame => rest((mode === 'win' ? part.win?.(t) : part.land?.(t)) ?? {});
