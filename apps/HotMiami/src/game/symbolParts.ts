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
	/**
	 * This part turns through a large angle on purpose. Declared, not inferred:
	 * check_symbol_parts.mjs rejects big rotations because a part swinging past
	 * ~30 degrees has normally come loose from the body it belongs to — which is
	 * right for every part except the one whose identity is that it spins.
	 */
	spins?: boolean;
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


/**
 * H1, the guy. A bust, so there is no arm to swing — `arm` is a sliver of sleeve
 * that belongs to the silhouette and stays put. What moves is the head (his
 * double-take, the same beat his whole-symbol motion nods to) and the gold chain,
 * which follows a beat later because a chain has no muscles.
 */
const hawaiianGuy: SymbolRig = {
	parts: [
		{ name: 'torso', key: 'hmH1Torso', pivot: [0.5, 1], win: (t) => ({ scaleY: 1 + 0.008 * Math.sin(t / 260) }) },
		// Static: in the stack for the silhouette, not for motion. Dropping it took
		// the assembled stack from IoU 1.00 against the artist's _full.png to 0.83.
		{ name: 'arm', key: 'hmH1Arm', pivot: [0.5, 0.5] },
		{
			name: 'head',
			key: 'hmH1Head',
			// the neck, not the middle of the face
			pivot: [0.5, 1],
			win: (t) => {
				const nod = strike(cycle(t, HOLD_MS * 1.08), 9) * Math.sin(cycle(t, HOLD_MS * 1.08) * 44);
				return { rotation: 0.06 * nod, dy: 0.02 * nod };
			},
			land: (t) => {
				const u = landP(t);
				return { rotation: -0.07 * Math.exp(-5 * u) * Math.sin(Math.PI * 2.2 * u) };
			},
		},
		{
			name: 'chain',
			key: 'hmH1Chain',
			// hangs from its top edge
			pivot: [0.5, 0],
			// A beat behind the head, and wider: the chain is the tell that the man
			// moved, the way a coat tail is.
			win: (t) => ({ rotation: 0.09 * Math.sin((t - 90) / 150) }),
			land: (t) => {
				const u = landP(t);
				return { rotation: 0.16 * Math.exp(-3.4 * u) * Math.sin(Math.PI * 3.6 * u) };
			},
		},
	],
};

/**
 * H2, the blonde. Her hair is the whole point — it is the biggest soft mass on
 * the board — so it is split front and back and the two halves swing at
 * different rates. Hair does not move with the head, it lags it, and the back
 * mass lags more than the front because there is more of it.
 */
const blonde: SymbolRig = {
	parts: [
		{
			name: 'hair_back',
			key: 'hmH2HairBack',
			// hangs from the crown
			pivot: [0.5, 0.12],
			// The back mass DRIFTS sideways and breathes; it does not swing. Its
			// first version rotated on a sine like everything else on this symbol
			// and the checker scored the three moving parts 0.43-0.68 apart — three
			// sine waves at three rates is one motion with three phases.
			win: (t) => ({ dx: 0.02 * Math.sin(t / 330), scaleY: 1 + 0.012 * Math.sin(t / 330 + 1.2) }),
			land: (t) => {
				const u = landP(t);
				return { rotation: 0.07 * Math.exp(-3 * u) * Math.sin(Math.PI * 2 * u) };
			},
		},
		{ name: 'torso', key: 'hmH2Torso', pivot: [0.5, 1], win: (t) => ({ scaleY: 1 + 0.01 * Math.sin(t / 240 + 1) }) },
		{
			name: 'head',
			key: 'hmH2Head',
			pivot: [0.5, 1],
			// A slow lean rather than a nod — H1 is the one who nods, and these two
			// portraits sit next to each other on the paytable.
			win: (t) => ({ rotation: 0.05 * Math.sin(t / 340), dx: 0.008 * Math.sin(t / 340 + 0.6) }),
			land: (t) => {
				const u = landP(t);
				return { rotation: 0.05 * Math.exp(-4 * u) * Math.cos(Math.PI * 1.4 * u) };
			},
		},
		{
			name: 'hair_front',
			key: 'hmH2HairFront',
			pivot: [0.5, 0.08],
			// The front strands WHIP on the beat and settle, where the back mass
			// drifts continuously and the head leans slowly: three different
			// temporal signatures on one symbol, which is the only thing that
			// separates parts as reliably as it separates symbols.
			win: (t) => {
				const whip = strike(cycle(t, HOLD_MS), 5) * Math.sin(cycle(t, HOLD_MS) * 18);
				return { rotation: -0.075 * whip, dx: -0.016 * whip };
			},
			land: (t) => {
				const u = landP(t);
				return { rotation: -0.1 * Math.exp(-4.5 * u) * Math.sin(Math.PI * 3 * u) };
			},
		},
	],
};

/**
 * H3, the flamingo. The one motion this symbol has ever wanted is the PECK, and
 * a flat sprite cannot do it: dipping the whole bird dips its legs too. With the
 * head and its full neck on their own layer, pivoting at the base of the neck,
 * the bird can strike down and lift slowly while the body stays planted.
 *
 * The two layers are cut in code (design/cut_flamingo_parts.py): three rounds of
 * generated layer art could not separate this bird — twice the body came back
 * with the head still on it, and the head layer came back as a fragment of the
 * wrong area, which stacks into a perfect copy of the whole flamingo and so
 * passes every numeric check. A neck is in open air, though, so cutting one out
 * reveals nothing that needs painting back in; the only invented pixels are the
 * stump that closes the shoulder, and at rest the neck covers it.
 *
 * The wing is still painted into the body, so there is no wing to flap. The
 * body's own motion stays in symbolWinMotion/symbolLandMotion.
 */
const flamingo: SymbolRig = {
	parts: [
		{ name: 'body', key: 'hmH3Body', pivot: [0.5, 1] },
		{
			name: 'head_neck',
			key: 'hmH3HeadNeck',
			// Where the neck meets the body — the bottom of the head layer's own
			// bbox, pushed right to the neck's centre line rather than the bbox's.
			// The bbox is wide because the beak reaches left; pivoting at its
			// middle would swing the whole neck sideways instead of tipping it.
			pivot: [0.8, 1],
			// Fast down, slow up. The asymmetry IS the peck; a symmetric bob is a
			// bird bouncing, which is a different and much sillier animal.
			win: (t) => {
				const u = cycle(t, HOLD_MS);
				const dip = u < 0.22 ? Math.sin((Math.PI * u) / 0.44) : Math.max(0, Math.cos((Math.PI * (u - 0.22)) / 1.1));
				return { rotation: 0.34 * dip, dy: 0.03 * dip };
			},
			land: (t) => {
				const u = landP(t);
				// arrives with the neck trailing, then whips upright
				return { rotation: 0.2 * Math.exp(-4 * u) * Math.cos(Math.PI * 1.6 * u) };
			},
		},
	],
};

/**
 * C, the Collector. Its whole mechanic is pulling the Neon Frames off the board,
 * so the outer ring turns continuously — the only continuous rotation among the
 * rigged parts — while the lettered core stays upright and legible and simply
 * pulses. A spinning word would be unreadable and, in social play, a compliance
 * problem.
 */
const collector: SymbolRig = {
	parts: [
		{
			name: 'ring',
			key: 'hmCRing',
			pivot: [0.5, 0.5],
			// The ring does NOT rotate, and two attempts at making it are worth
			// recording. A free spin turns the hexagon to arbitrary angles and the
			// emblem stops looking like itself — the outline breaks away from the
			// magenta field, which belongs to the core layer, and the badge reads as
			// coming apart. Snapping to 60° detents fixes the silhouette at the
			// detents and still looks wrong in between, for the same reason.
			//
			// So it BREATHES instead: a slow ring pulse, widest while the core is
			// pinching in, which is the Collector's own gesture (it pulls things
			// toward the middle) expressed with the one transform that cannot
			// misalign concentric art.
			win: (t) => {
				const swell = 0.5 + 0.5 * Math.sin(t / 260);
				return { scaleX: 1 + 0.055 * swell, scaleY: 1 + 0.055 * swell };
			},
			land: (t) => {
				const u = landP(t);
				const settle = Math.exp(-4 * u) * (1 - u);
				return { scaleX: 1 + 0.12 * settle, scaleY: 1 + 0.12 * settle };
			},
		},
		{
			name: 'core',
			key: 'hmCCore',
			pivot: [0.5, 0.5],
			win: (t) => {
				const beat = strike(cycle(t, HOLD_MS * 0.95), 4);
				return { scaleX: 1 - 0.05 * beat, scaleY: 1 + 0.04 * beat };
			},
			// A DELAYED anisotropic pinch, where the ring around it is an immediate
			// isotropic settle. Both parts were decaying exponentials at first and
			// the checker scored them 0.01 apart — the same curve at two sizes, in
			// the one symbol whose mechanic is that its two rings do different
			// things. The core squeezes a moment after the badge has landed, as if
			// the disc took the impact through the frame.
			land: (t) => {
				const u = landP(t);
				const pinch = u < 0.15 || u > 0.85 ? 0 : Math.sin((Math.PI * (u - 0.15)) / 0.7);
				return { scaleX: 1 - 0.09 * pinch, scaleY: 1 + 0.07 * pinch };
			},
		},
	],
};

export const SYMBOL_RIGS: Record<string, SymbolRig> = {
	H1: hawaiianGuy,
	H2: blonde,
	H3: flamingo,
	H4: boombox,
	C: collector,
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
