/**
 * Per-symbol win motion.
 *
 * Three reviewers rejected this game writing "poor animation", and the specific
 * failure is not that nothing moves — it is that ALL TWELVE SYMBOLS MOVE
 * IDENTICALLY. `SymbolWinAnim` ran one shared scale-overshoot plus one shared
 * sine wobble for every symbol on the board, so a winning flamingo, a winning
 * boombox and a winning letter J were the same animation with different art
 * inside it. A reviewer watching a few hundred spins sees that immediately.
 *
 * This table is the fix: one motion per symbol, chosen to read as the thing
 * itself. The boombox thumps on a beat, the car idles and lunges, the flamingo
 * pecks, the neon letters strike like tubes igniting, the scatter spins. Nothing
 * here needs new art — it is all transforms of the existing PNG plus the fx
 * sprites already in the registry.
 *
 * ── Why a table of functions rather than twelve components ───────────────────
 *
 * Twelve Svelte components would be twelve copies of the same `<Sprite>`
 * boilerplate differing by a few numbers, and the thing that actually needs
 * reviewing — is symbol A's motion genuinely different from symbol B's? — would
 * be spread across twelve files where nobody can compare them. As pure
 * functions they sit side by side, and they can be MEASURED: see
 * `design/check_symbol_motion.mjs`, which samples all twelve over the same
 * window and fails the build if any two traces are too similar. That check is
 * the actual defence against the thing that got the game rejected, and it is
 * only possible because these are pure.
 *
 * If a symbol ever needs something a transform cannot express — real EQ bars on
 * the boombox, wheels rotating independently — add a component branch in
 * `SymbolWinAnim` for that one symbol. Do not widen this type until something
 * needs it.
 *
 * ── Every beat must fit inside the win hold ─────────────────────────────────
 *
 * `SymbolWinAnim` holds a cell in the `win` state for WIN_HOLD_MS (480ms) and
 * `Board.svelte` then flips it to `postWinStatic`. So a motion built on a 1100ms
 * cycle shows the player its first 44% and nothing else, ever — the "rest" of
 * the animation is written, measured, and never seen.
 *
 * The first draft of this table had exactly that bug in four symbols. Every
 * characteristic beat now completes within HOLD_MS, and the checker samples the
 * visible window rather than an arbitrary 1400ms, so a beat that does not fit is
 * a beat the score reflects.
 *
 * ── Units ────────────────────────────────────────────────────────────────────
 *
 * `dx`/`dy` and overlay geometry are FRACTIONS OF THE CELL, not pixels, and this
 * file imports nothing. That is deliberate: it keeps the table renderer-agnostic
 * and, more usefully, keeps it loadable by a plain node script. Importing
 * `constants.ts` would pull in `types.ts`, `utils-slots` and the app config, and
 * the verification script could not run at all.
 */

export type SymbolWinOverlay = {
	/** asset registry key — must exist in game/assets.ts */
	key: string;
	/** cell fractions, relative to the symbol's centre */
	x: number;
	y: number;
	/** cell fractions */
	width: number;
	height: number;
	rotation: number;
	alpha: number;
	tint: number;
	/** drawn behind the symbol sprite rather than over it */
	behind?: boolean;
};

export type SymbolWinFrame = {
	scaleX: number;
	scaleY: number;
	rotation: number;
	/** cell fractions */
	dx: number;
	dy: number;
	/** additive copy of the symbol's own sprite, for neon-tube ignition */
	bloomAlpha: number;
	bloomTint: number;
	overlays: SymbolWinOverlay[];
};

export type SymbolWinMotion = {
	/**
	 * Multiplies the shared arrival overshoot. The hit itself stays common to
	 * every symbol — every win should punch — but Wild, Scatter and Collector
	 * punch harder because they are what the player is hunting.
	 */
	hitScale: number;
	/**
	 * This symbol turns continuously rather than leaning. Declared, not
	 * inferred, because `check_symbol_motion.mjs` rejects large rotations as
	 * accidental tumbling — which is the right rule for eleven of the twelve
	 * symbols and exactly wrong for the one whose identity is that it spins.
	 */
	spins?: boolean;
	/** `t` is milliseconds since the win started. */
	frame: (t: number) => SymbolWinFrame;
};

/**
 * The window a winning cell is actually on screen (SymbolWinAnim's WIN_HOLD_MS).
 * Cycle lengths are expressed against this so they cannot drift apart from it.
 */
// 2026-08-25: 620 -> 970, from the Hacksaw spec (The Luxe's symbol win spines
// are all 0.97s; the wild is 1.00s). It is also the floor their own win-tier
// table applies to the no-count-up tier — the small win takes no extra time,
// but the symbol still gets a full second to do something.
//
// It costs nothing in session time now that levels 1-5 present for 0ms: what
// used to be 620ms of symbol plus 600-2000ms of ticking count-up is now 970ms
// of symbol and no count-up at all.
export const HOLD_MS = 970;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Sawtooth 0→1 over `period` ms. */
const cycle = (t: number, period: number) => (t % period) / period;

/** Sharp attack, exponential decay — a struck thing, not a breathing thing. */
const strike = (u: number, sharpness: number) => Math.exp(-sharpness * u);

/** One smooth 0→1→0 hump over the first `width` of a cycle, flat after. */
const hump = (u: number, width: number) => (u >= width ? 0 : Math.sin((Math.PI * u) / width));

const rest = (over: Partial<SymbolWinFrame> = {}): SymbolWinFrame => ({
	scaleX: 1,
	scaleY: 1,
	rotation: 0,
	dx: 0,
	dy: 0,
	bloomAlpha: 0,
	bloomTint: 0xffffff,
	overlays: [],
	...over,
});

// ── Deadwood Express (2026-09-26) ────────────────────────────────────────────
//
// Everything above this line is shared machinery. The table below replaced the
// one inherited from Hot Miami after Deadwood's second review ("Poor
// animations"): that table was written for a Hawaiian-shirt guy, a flamingo, a
// boombox, a convertible and four neon-tube royals, and on this board it lit
// stone letters neon pink and made a lantern peck like a bird. Every motion here
// is what THIS symbol's object would do, in this game's colours:
const TEAL = 0x5fd6c4; // ghost light — the game's signature colour
const AMBER = 0xf0a040; // lantern flame
const SIGNAL = 0xff4a3c; // signal lens
const LILAC = 0xb08ae0; // the veiled passenger
const BRASS = 0xf0d9a4; // warm metal glint

/** Rotation about a point `h` cell-heights above the centre (a hanging ring). */
const hang = (theta: number, h: number) => ({
	rotation: theta,
	dx: -h * Math.sin(theta),
	dy: h * (Math.cos(theta) - 1),
});

/** A soft light sprite, the only overlay primitive this table uses. */
const light = (
	x: number,
	y: number,
	size: number,
	alpha: number,
	tint: number,
	behind = true,
): SymbolWinOverlay => ({ key: 'fxGlow', x, y, width: size, height: size, rotation: 0, alpha, tint, behind });

/** A brass glint travelling across the art once, over `window` ms. */
const glint = (t: number, window: number, y = -0.05): SymbolWinOverlay[] => {
	const u = t / window;
	if (u >= 1) return [];
	return [
		{
			key: 'fxStreak',
			x: -0.45 + u * 0.9,
			y,
			width: 0.26,
			height: 0.7,
			rotation: -0.5,
			alpha: 0.55 * hump(u, 1),
			tint: BRASS,
		},
	];
};

// ── the table ────────────────────────────────────────────────────────────────

const BASE_WIN_MOTION: Record<string, SymbolWinMotion> = {
	// W — the locomotive. Two chugs: squash down, rebound up, on a beat, with a
	// puff of steam leaving the chimney on each and the headlamp flaring teal.
	W: {
		hitScale: 1.0,
		frame: (t) => {
			const beat = HOLD_MS * 0.46;
			const u = cycle(t, beat);
			const chug = strike(u, 6);
			const puffs = [0, 1].map((i) => {
				const age = (t - i * beat) / (beat * 1.6);
				if (age < 0 || age > 1) return null;
				return light(0.02 * i, -0.42 - 0.35 * age, 0.25 + 0.45 * age, 0.5 * (1 - age), 0xdff5ef, false);
			});
			return rest({
				scaleX: 1 + 0.05 * chug,
				scaleY: 1 - 0.07 * chug,
				dy: 0.03 * chug,
				bloomAlpha: 0.35 * chug,
				bloomTint: TEAL,
				overlays: [light(0, -0.02, 0.5 + 0.2 * chug, 0.55 * chug, TEAL), ...puffs.filter((p) => p !== null)],
			});
		},
	},

	// S — the ticket. Paper caught in a draught: a damped flutter that rocks and
	// drifts, with one glint across it. The only symbol that moves like paper.
	S: {
		hitScale: 1.05,
		frame: (t) => {
			const damp = Math.exp(-t / 650);
			return rest({
				rotation: 0.16 * damp * Math.sin(t / 70),
				dx: 0.04 * damp * Math.sin(t / 110 + 1),
				scaleY: 1 - 0.05 * damp * Math.abs(Math.sin(t / 70)),
				bloomAlpha: 0.25 * hump(Math.min(1, t / 500), 1),
				bloomTint: TEAL,
				overlays: [light(0, 0, 1.3, 0.3 * (0.6 + 0.4 * damp), TEAL), ...glint(t, 600, 0)],
			});
		},
	},

	// H1 — the conductor. One slow, deliberate nod — a doffed cap — and his scarf
	// flares ghost-teal as he comes back up. Restrained on purpose: he is the top
	// symbol, and his gesture is the calm one.
	H1: {
		hitScale: 1.05,
		frame: (t) => {
			const u = Math.min(1, t / (HOLD_MS * 0.8));
			const nod = hump(u, 0.55);
			const flare = hump(Math.max(0, u - 0.35) / 0.65, 1);
			return rest({
				rotation: -0.1 * nod,
				dy: 0.06 * nod,
				// 0.2, not 0.4: the bloom tints the whole bust, and at 0.4 he went
				// green from cap to coat rather than his scarf catching the light.
				bloomAlpha: 0.2 * flare,
				bloomTint: TEAL,
				overlays: [light(0.05, 0.25, 0.9, 0.45 * flare, TEAL)],
			});
		},
	},

	// H2 — the veiled passenger. An apparition: she lifts and hangs in the air,
	// breathing lilac light. Continuous and slow where H1 is one discrete beat —
	// they are the two portraits, and must not read as one animation twice.
	H2: {
		hitScale: 1.05,
		frame: (t) => {
			const rise = 1 - Math.exp(-t / 260);
			const breathe = 0.5 + 0.5 * Math.sin(t / 150);
			return rest({
				dy: -0.07 * rise + 0.012 * Math.sin(t / 150),
				scaleX: 1 + 0.03 * breathe,
				scaleY: 1 + 0.03 * breathe,
				bloomAlpha: 0.2 + 0.25 * breathe * rise,
				bloomTint: LILAC,
				overlays: [light(0, 0.1, 1.1, 0.3 * rise, LILAC)],
			});
		},
	},

	// H3 — the lantern. It swings from its top ring like a pendulum, damping out,
	// and the flame gutters: an irregular amber flicker behind the glass.
	H3: {
		hitScale: 1.0,
		frame: (t) => {
			const theta = 0.2 * Math.exp(-t / 700) * Math.sin(t / 105);
			const flicker = 0.55 + 0.25 * Math.sin(t / 37) + 0.2 * Math.sin(t / 61 + 2);
			return rest({
				...hang(theta, 0.45),
				bloomAlpha: 0.45 * flicker,
				bloomTint: AMBER,
				overlays: [light(-0.02, 0.08, 0.75, 0.6 * flicker, AMBER)],
			});
		},
	},

	// H4 — the pocket watch. Tick... tock: the watch snaps a notch on each tick
	// and holds, alternating direction — a discrete stepping motion nothing else
	// on the board has — with the teal dial lighting on the beat.
	H4: {
		hitScale: 1.0,
		frame: (t) => {
			const tick = HOLD_MS / 6;
			const n = Math.floor(t / tick);
			const snap = strike((t % tick) / tick, 10);
			const side = n % 2 === 0 ? 1 : -1;
			return rest({
				rotation: side * 0.09 * (1 - 0.4 * snap),
				scaleX: 1 + 0.05 * snap,
				scaleY: 1 + 0.05 * snap,
				bloomAlpha: 0.35 * snap,
				bloomTint: TEAL,
				overlays: [light(-0.05, 0.02, 0.8, 0.35 * snap, TEAL)],
			});
		},
	},

	// H5 — the signal lamp. The red lens flashes hard, twice, and the housing
	// jolts on each flash. On/off, never a fade: it is a signal.
	H5: {
		hitScale: 1.0,
		frame: (t) => {
			const on = (t > 40 && t < 220) || (t > 420 && t < 600) ? 1 : 0.12;
			const jolt = strike(cycle(t, 380), 12) * (t < 760 ? 1 : 0);
			return rest({
				dx: 0.05 * jolt,
				rotation: 0.05 * jolt,
				// The bloom is an additive copy of the WHOLE sprite, so at 0.55 it
				// turned the iron housing pink; the lens is lit by a light laid over
				// it instead, and the bloom only warms the edges.
				bloomAlpha: 0.1 * on,
				bloomTint: SIGNAL,
				overlays: [
					light(0.06, 0.0, 1.0, 0.45 * on, SIGNAL),
					light(0.06, 0.0, 0.5, 0.7 * on, 0xffc2b8, false),
				],
			});
		},
	},

	// L1-L4 — carved stone letters with bronze edges (v1 art). Heavy objects: they
	// thud and rock rather than wobble, each on its own axis, and a brass glint
	// runs across the bevel. No colour of their own — they are the quiet symbols.

	// A: lifted and dropped — one heavy thud, a small bounce.
	L1: {
		hitScale: 0.9,
		frame: (t) => {
			const u = Math.min(1, t / 520);
			const lift = u < 0.45 ? Math.sin((u / 0.45) * (Math.PI / 2)) : Math.exp(-(u - 0.45) * 9) * Math.cos((u - 0.45) * 30);
			return rest({ dy: -0.07 * lift, overlays: glint(t, 700) });
		},
	},
	// K: rocks on its base, left then right, settling.
	L2: {
		hitScale: 0.9,
		frame: (t) => ({ ...rest({ overlays: glint(t - 120, 700) }), ...hang(0.12 * Math.exp(-t / 520) * Math.sin(t / 95), -0.42) }),
	},
	// Q: a double pulse in scale, like a heartbeat.
	L3: {
		hitScale: 0.9,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.9);
			const beat = hump(u, 0.16) + 0.7 * hump(Math.max(0, u - 0.22), 0.16);
			return rest({ scaleX: 1 + 0.1 * beat, scaleY: 1 + 0.1 * beat, overlays: glint(t - 60, 700) });
		},
	},
	// J: swings sideways from its top like a hung sign — a slow sway.
	L4: {
		hitScale: 0.9,
		frame: (t) => ({ ...rest({ overlays: glint(t - 180, 700) }), ...hang(0.14 * Math.sin(t / 200) * (1 - Math.exp(-t / 150)), 0.42) }),
	},

	// C — unused in Deadwood (no Collector), kept because SYMBOL_INFO_MAP still
	// lists it and the checker requires every board symbol to have a motion.
	C: {
		hitScale: 1,
		frame: (t) => rest({ scaleX: 1 + 0.08 * hump(cycle(t, 480), 0.5), scaleY: 1 - 0.08 * hump(cycle(t, 480), 0.5) }),
	},
};

/**
 * Raise everything to a floor of BOLDNESS, and never shrink anything.
 *
 * ── Why this replaced a flat multiplier ─────────────────────────────────────
 *
 * The tables were written to be DISTINGUISHABLE from each other, and
 * `check_symbol_motion.mjs` measures exactly that — correlation distance on
 * z-scored traces, deliberately blind to amplitude. Nothing measured whether a
 * motion was big enough to SEE, and most were not: H2 moved 1.6px on a 118px
 * cell, H1 3.9px. That went out as a flat x3, which made them visible (H2 12
 * degrees, H1 11.8px) and scored the same `poor animation` tag a third time.
 *
 * The instruction after that round was 大破大立 — either make it big or take it
 * out. A flat multiplier cannot deliver that, because it preserves the ratio
 * between the loudest and the quietest: at any gain that makes H2 bold, W and S
 * are through the roof. So each symbol is now raised until its OWN loudest
 * channel reaches the floor below, and a symbol already past the floor is left
 * exactly where it is. The hierarchy survives at the top; the bottom is gone.
 *
 * Applied here rather than in the component so the numbers the gate checks are
 * the numbers that ship — including the floor itself, which
 * `check_symbol_motion.mjs` now asserts as a failure rather than a report.
 *
 * Rotation is not touched on a spinner: S's identity is that it turns, and a
 * different rate is a different symbol, not a louder one. bloomAlpha and overlay
 * alphas are left alone as well — they are already at 0.75 and cannot get
 * brighter, and clamping them would flatten the tops of the neon flickers, which
 * is a shape change.
 */
// Deadwood, 2026-09-26 halved this to 7°/7px/8% so the new themed motions
// would read as "heavy"; the third review (2026-09-30) then doubled the
// "Poor animations" tag (1 -> 2 reviewers). Back to the Hot Miami floor —
// the motions stay themed, they just have to be big enough to see.
export const VISIBLE_FLOOR = {
	/** 15 degrees. Below this a lean on a cell is a tremble. */
	rotation: 0.26,
	/** cell fractions: 0.10 is ~15px at the 1.22 board. */
	offset: 0.1,
	/** 15% of the symbol's own size. */
	scale: 0.15,
};

/** The gate's own limits, restated so a boost stops short of them. */
export const MOTION_BOUNDS = { rotation: 0.55, offset: 0.22, scale: 0.5 };

/** No motion is multiplied past this, whatever the floor asks for. */
const MAX_GAIN = 4;

/**
 * A channel this quiet is incidental, not part of the gesture, and is ignored
 * when deciding the gain.
 *
 * Without it one stray pixel drives everything: H4's win is a speaker thump
 * (scale) with a 1.4px bob on it, and asking that 1.4px to reach a 12px floor
 * demanded 8x, which took the whole boombox to +-50% scale. A channel under 15%
 * of its floor is a detail of the shape, so it rides along at whatever gain the
 * real channels ask for.
 */
const RELEVANT = 0.15;

/**
 * Nothing ends up more than twice the floor either.
 *
 * 大破大立 is a floor, not licence for a symbol to swing 40 degrees because its
 * quietest relevant channel happened to need 6x. The band this produces —
 * every symbol between one and two times the floor on the channels it actually
 * uses — is what keeps twelve bold motions on one board from becoming noise.
 */
const CEILING = 2;
const MARGIN = 1.03;

export const boostToFloor = <T extends SymbolWinMotion>(
	motion: T,
	windowMs: number,
	floor = VISIBLE_FLOOR,
): T => {
	let peakRotation = 0;
	let peakOffset = 0;
	let peakScale = 0;
	for (let t = 0; t <= windowMs; t += 5) {
		const f = motion.frame(t);
		peakRotation = Math.max(peakRotation, Math.abs(f.rotation));
		peakOffset = Math.max(peakOffset, Math.abs(f.dx), Math.abs(f.dy));
		peakScale = Math.max(peakScale, Math.abs(f.scaleX - 1), Math.abs(f.scaleY - 1));
	}

	const wanted: number[] = [];
	const allowed: number[] = [MAX_GAIN];
	const consider = (peak: number, floorValue: number, bound: number) => {
		if (peak <= 1e-6) return;
		// MARGIN, not decoration: the peak here is found on a 5ms grid and the
		// gate samples on a 10ms one, so a motion boosted to land exactly ON the
		// floor measures a hair under it there and fails. Aim 3% over.
		if (peak >= floorValue * RELEVANT) wanted.push((floorValue * MARGIN) / peak);
		allowed.push(Math.min(bound / peak, (floorValue * CEILING) / peak));
	};
	if (!motion.spins) consider(peakRotation, floor.rotation, MOTION_BOUNDS.rotation);
	consider(peakOffset, floor.offset, MOTION_BOUNDS.offset);
	consider(peakScale, floor.scale, MOTION_BOUNDS.scale);
	if (!wanted.length) return motion;

	// The LARGEST gain any channel that is part of the gesture asks for, held
	// back by the smallest the bounds and the ceiling allow.
	//
	// Taking the smallest wanted — the first draft — stops boosting the moment
	// any one channel reaches the floor, which quietly SHRANK the symbols that
	// move on two axes: H3 went from 18.9 degrees under the old flat x3 to 12.6.
	const gain = Math.max(1, Math.min(Math.max(...wanted), ...allowed));
	if (gain === 1) return motion;

	return {
		...motion,
		frame: (t: number) => {
			const f = motion.frame(t);
			return {
				...f,
				scaleX: 1 + (f.scaleX - 1) * gain,
				scaleY: 1 + (f.scaleY - 1) * gain,
				rotation: motion.spins ? f.rotation : f.rotation * gain,
				dx: f.dx * gain,
				dy: f.dy * gain,
			};
		},
	};
};

export const SYMBOL_WIN_MOTION: Record<string, SymbolWinMotion> = Object.fromEntries(
	Object.entries(BASE_WIN_MOTION).map(([name, motion]) => [
		name,
		boostToFloor(motion, HOLD_MS),
	]),
);

/**
 * Motion for a symbol name. Falls back to a neutral breathe rather than
 * throwing: an unknown symbol should animate blandly, not crash the board.
 */
export const getSymbolWinMotion = (name: string): SymbolWinMotion =>
	SYMBOL_WIN_MOTION[name] ?? {
		hitScale: 1,
		frame: (t) => rest({ rotation: 0.05 * Math.sin(t / 360) }),
	};
