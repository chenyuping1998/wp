/**
 * What the two CHARACTERS do when nothing is happening.
 *
 * `idleBreathe.ts` already gives every symbol on a settled board a ~1% breath.
 * That is ambient, deliberately identical across the board, and it is the right
 * thing for a letter or a boombox. It is not what makes a person look alive.
 *
 * The method here is lifted from Hacksaw's *Miami Mayhem* (1824/1.23.2), whose
 * five background characters sway continuously without ever reading as a loop.
 * The numbers below are theirs, measured off their spine skeletons; the art and
 * the skeletons are theirs and are NOT used — the pack's own note says so, and
 * this file implements the method on our own rigged parts.
 *
 * Four rules, in the order they matter:
 *
 *   1. LOOP LENGTHS MUST NOT MATCH. Their five characters run 3.33 / 5 / 6.67 /
 *      8 / 8 seconds, chosen so all five realign only every 40s. Ours are 8s and
 *      5s: the guy and the blonde return to the same relative pose once every
 *      40 seconds, so a board holding both never shows the same pair twice in a
 *      session anyone sits through. This is the cheapest of the four and the one
 *      that does the most.
 *
 *   2. THE BODY BARELY MOVES; THE APPENDAGES CARRY IT. Their bodies rotate
 *      1-3.3 degrees while hair reaches 27.5, a beard 13.9, cigar smoke 25.9 —
 *      a 4x to 8x spread. A body that moves as much as its hair reads as a
 *      person swaying, which is worse than a person standing still.
 *
 *   3. FOLLOW-THROUGH: EACH LINK ~2x ITS PARENT, AND LATER. Their beard is
 *      6.9 degrees at the jaw and 13.9 at the tip, with the tip lagging. That
 *      lag is the whole illusion of mass — hair does not move WITH a head, it
 *      is dragged by it.
 *
 *   4. ONE IRREGULAR JITTER PER LOOP. In their 8s green_guy loop, one 0.83s
 *      window carries five unevenly spaced keys of +-0.5 degrees, and nothing
 *      else in the loop is like it. Their note calls this the most worthwhile
 *      trick and it is nearly free: a regular loop is recognised as a loop after
 *      about two passes, and one asymmetric hiccup stops that from happening.
 *
 * Their breathing bone is also worth copying exactly: it translates AND scales
 * vertically on the same period, because translation alone reads as the whole
 * figure floating rather than as a chest filling.
 *
 * ── Why this file imports nothing ────────────────────────────────────────────
 *
 * Same rule as symbolWinMotion.ts, symbolLandMotion.ts and symbolParts.ts: the
 * gate (design/check_idle_sway.mjs) loads this table in plain node, and node ESM
 * cannot resolve an extensionless relative import.
 */

const DEG = Math.PI / 180;

/** Amplitudes are authored in DEGREES because that is the unit the reference is
 *  measured in, and the whole point of rules 2 and 3 is the ratio between them.
 *  Converted once, here. */
export type SwayPart = {
	/** part name, matching symbolParts.ts */
	name: string;
	/** peak rotation, degrees */
	rotationDeg?: number;
	/** peak translation, in cell fractions */
	dx?: number;
	dy?: number;
	/** peak vertical stretch, as a fraction (0.012 = 1.2%) */
	scaleY?: number;
	/** how far this part runs behind its parent, ms */
	lagMs?: number;
	/** phase offset within the loop, radians — for parts that are not on the chain */
	phase?: number;
};

export type SwayRig = {
	/** loop length, ms. MUST differ between characters — rule 1. */
	loopMs: number;
	/**
	 * The follow-through chain, root first. Rule 3 is checked along this list:
	 * each named part must be at least 1.6x its predecessor and lag it.
	 */
	chain: string[];
	/**
	 * Parts that drift rather than swing, and are therefore exempt from the
	 * chain rule. A big soft mass hanging behind a head does not swing on a hinge
	 * — the win rig reached the same conclusion for the same part, after a
	 * checker scored three sine-driven parts as one motion with three phases.
	 */
	drift?: string[];
	parts: SwayPart[];
	/**
	 * The once-per-loop hiccup. `at` is where the window opens as a fraction of
	 * the loop; the reference puts its window at 0.47-0.57 of an 8s loop.
	 */
	jitter: { part: string; at: number; durationMs: number; amplitudeDeg: number };
};

/**
 * H1, the guy in the shirt. Bust framing, so the chain is short: torso, head,
 * and the gold chain that hangs off him. The chain is the only part of him with
 * no muscles, which is exactly why it is the one allowed to move.
 */
const guy: SwayRig = {
	loopMs: 8000,
	chain: ['torso', 'head', 'chain'],
	parts: [
		// the breathing bone: rises and stretches on the same period, quarter-loop
		{ name: 'torso', rotationDeg: 1.0, dy: -0.004, scaleY: 0.011 },
		{ name: 'head', rotationDeg: 2.6, dx: 0.006, lagMs: 90 },
		{ name: 'chain', rotationDeg: 7.2, lagMs: 240 },
	],
	jitter: { part: 'torso', at: 0.47, durationMs: 830, amplitudeDeg: 0.5 },
};

/**
 * H2, the blonde. The biggest soft mass on the board is her hair, so she gets
 * the longer chain and the bigger numbers — and a shorter loop than his, which
 * is rule 1 doing its work: 8 and 5 realign every 40 seconds.
 */
const blonde: SwayRig = {
	loopMs: 5000,
	chain: ['torso', 'head', 'hair_front'],
	drift: ['hair_back'],
	parts: [
		{ name: 'torso', rotationDeg: 1.2, dy: -0.004, scaleY: 0.013 },
		{ name: 'head', rotationDeg: 3.0, dx: 0.007, lagMs: 110 },
		{ name: 'hair_front', rotationDeg: 9.4, dx: -0.010, lagMs: 300 },
		// drifts sideways and breathes rather than swinging on the crown
		{ name: 'hair_back', dx: 0.014, scaleY: 0.016, phase: 1.2 },
	],
	jitter: { part: 'torso', at: 0.52, durationMs: 700, amplitudeDeg: 0.5 },
};

export const SWAY_RIGS: Record<string, SwayRig> = { h1: guy, h2: blonde };

export const getSwayRig = (symbolName: string): SwayRig | null =>
	SWAY_RIGS[symbolName.toLowerCase()] ?? null;

/**
 * Every sway loop and the ambient breath have to stay periodic in one shared
 * clock, so the clock wraps at their common multiple rather than at the breath's
 * own period: 2600 x 5000 x 8000 -> 520000ms. Without this the sway would jump
 * every 2.6s when the clock reset mid-loop.
 */
export const IDLE_WRAP_MS = 520_000;

/**
 * The jitter: five unevenly spaced keys inside one window, linearly interpolated,
 * zero at both ends so it grafts onto the smooth motion without a step.
 *
 * The offsets and values are the reference's own, normalised to the window —
 * 0, -0.54, +0.12, -0.37, +0.21, 0 at 0, 0.24, 0.40, 0.56, 0.72, 1.0 of the
 * window. Uneven on purpose: evenly spaced keys are just a faster wobble, and a
 * wobble is still a pattern.
 */
const JITTER_KEYS: [number, number][] = [
	[0, 0],
	[0.24, -1.0],
	[0.4, 0.22],
	[0.56, -0.69],
	[0.72, 0.39],
	[1, 0],
];

export const jitterAt = (u: number): number => {
	if (u <= 0 || u >= 1) return 0;
	for (let i = 1; i < JITTER_KEYS.length; i += 1) {
		const [t1, v1] = JITTER_KEYS[i];
		const [t0, v0] = JITTER_KEYS[i - 1];
		if (u <= t1) {
			// Smoothstep between keys, not a straight line.
			//
			// Linear interpolation is continuous in POSITION but not in velocity: at
			// every key the direction changes instantly, and on a figure the height
			// of the screen that corner reads as a snap rather than as a hiccup —
			// reported as 「人物晃一晃會有一個抖動」. The reference's keys carry bezier
			// handles for the same reason. Smoothstep gives zero velocity at each key,
			// which is what a bezier with flat handles would give.
			const p = (u - t0) / (t1 - t0);
			return v0 + (v1 - v0) * p * p * (3 - 2 * p);
		}
	}
	return 0;
};

export type SwayFrame = { dx: number; dy: number; rotation: number; scaleY: number };

const REST: SwayFrame = { dx: 0, dy: 0, rotation: 0, scaleY: 1 };

/**
 * One part's pose at time `t` (ms on the shared idle clock).
 *
 * The base wave is the loop itself. The breathing terms — dy and scaleY — run at
 * a QUARTER of the loop, which is the reference's own relationship between its
 * persp bone and the animation length, and it is what stops a breath from
 * reading as part of the sway.
 */
export const swayFrame = (rig: SwayRig, partName: string, t: number): SwayFrame => {
	const part = rig.parts.find((p) => p.name === partName);
	if (!part) return REST;

	const lag = part.lagMs ?? 0;
	const phase = part.phase ?? 0;
	const wave = Math.sin((Math.PI * 2 * (t - lag)) / rig.loopMs + phase);
	// quarter-loop breath, offset so the chest is not at its peak exactly when
	// the sway is
	const breath = Math.sin((Math.PI * 2 * t) / (rig.loopMs / 4) + 0.7);

	let rotation = (part.rotationDeg ?? 0) * DEG * wave;

	if (rig.jitter.part === partName) {
		const u = ((t % rig.loopMs) / rig.loopMs - rig.jitter.at) / (rig.jitter.durationMs / rig.loopMs);
		rotation += rig.jitter.amplitudeDeg * DEG * jitterAt(u);
	}

	return {
		dx: (part.dx ?? 0) * wave,
		dy: (part.dy ?? 0) * (0.5 + 0.5 * breath),
		rotation,
		scaleY: 1 + (part.scaleY ?? 0) * breath,
	};
};

/**
 * ── The cast standing beside the board ──────────────────────────────────────
 *
 * Same method, one layer.
 *
 * The two figures beside the board are a single flat cut-out each (split out of
 * the store tile by design/build_cast_figures.py), so rules 2 and 3 — the body
 * barely moves, appendages carry it, each link doubles — have nothing to act on:
 * there is no hair layer to lag behind a head that is welded to the torso.
 *
 * That is not a reason to move the body more. It is a reason to move it LESS and
 * lean entirely on the two rules that survive: loops that do not match, and one
 * irregular hiccup per loop. A flat figure rotating 1.3 degrees while breathing
 * reads as a person standing; the same figure rotating 5 reads as a cardboard
 * cut-out being waved.
 *
 * Loop lengths are chosen against the SYMBOLS' as well as against each other —
 * 8000 / 5000 / 6500 / 4000 share a common multiple of 520 seconds, which is the
 * whole idle clock. Nothing on screen repeats its relationship to anything else
 * inside any session.
 *
 * When the rigged art lands (docs/art-prompts-hot-miami-parts.md section 14)
 * these become full SwayRigs with a legs/torso/head/hair/hair_tip chain and this
 * block goes away.
 */
export type CastSway = {
	loopMs: number;
	rotationDeg: number;
	dy: number;
	scaleY: number;
	jitter: { at: number; durationMs: number; amplitudeDeg: number };
};

export const CAST_SWAY: Record<string, CastSway> = {
	guy: {
		loopMs: 6500,
		rotationDeg: 1.1,
		dy: -0.005,
		scaleY: 0.008,
		jitter: { at: 0.47, durationMs: 780, amplitudeDeg: 0.45 },
	},
	girl: {
		loopMs: 4000,
		rotationDeg: 1.4,
		dy: -0.006,
		scaleY: 0.01,
		jitter: { at: 0.53, durationMs: 620, amplitudeDeg: 0.45 },
	},
};

export const castFrame = (sway: CastSway, t: number): SwayFrame => {
	const wave = Math.sin((Math.PI * 2 * t) / sway.loopMs);
	const breath = Math.sin((Math.PI * 2 * t) / (sway.loopMs / 4) + 0.7);
	const u = ((t % sway.loopMs) / sway.loopMs - sway.jitter.at) / (sway.jitter.durationMs / sway.loopMs);
	return {
		dx: 0,
		dy: sway.dy * (0.5 + 0.5 * breath),
		rotation: sway.rotationDeg * DEG * wave + sway.jitter.amplitudeDeg * DEG * jitterAt(u),
		scaleY: 1 + sway.scaleY * breath,
	};
};
