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
export const HOLD_MS = 480;

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

// The four royals are neon tubes, so they ignite rather than move. Each gets its
// own colour (matched to its own art) AND its own rhythm — four letters all
// flickering the same way would be the original bug at a smaller scale.
const NEON = {
	L1: 0xff3b8b, // A — pink
	L2: 0x66f6ff, // K — cyan
	L3: 0xffd166, // Q — yellow
	L4: 0xb08cff, // J — violet
} as const;

/**
 * A neon royal: `ignite(t)` is the tube's own switch-on pattern in 0..1, and
 * `move(t, glow)` is how the letter physically reacts to being lit.
 *
 * `move` exists because of a measurement, not a hunch. The first version gave
 * all four royals the same faint breathe and differed them only by flicker
 * timing and colour — and `design/check_symbol_motion.mjs` scored the four
 * royals at 0.28-0.61 apart while every other pair on the board was 0.94 or
 * more. Numerically they were still the original bug, at a smaller scale, and
 * colour was doing all the work.
 *
 * So each royal now moves on a DIFFERENT AXIS: A rises, K twitches sideways on
 * its bad contact, Q leans as it warms, J buzzes in scale. Same idea, four
 * distinguishable motions, and the check now passes on motion alone rather than
 * on tint.
 */
const neonRoyal = (
	tint: number,
	ignite: (t: number) => number,
	move: (t: number, glow: number) => Partial<SymbolWinFrame>,
): SymbolWinMotion => ({
	hitScale: 0.9,
	frame: (t) => {
		const glow = ignite(t);
		return rest({
			bloomAlpha: 0.75 * glow,
			bloomTint: tint,
			...move(t, glow),
		});
	},
});

// ── the table ────────────────────────────────────────────────────────────────

export const SYMBOL_WIN_MOTION: Record<string, SymbolWinMotion> = {
	// H1 — the guy in the Hawaiian shirt. A confident lean, and a hard specular
	// glint sweeping across the sunglasses, which is the readable detail on him.
	H1: {
		hitScale: 1.05,
		frame: (t) => {
			const sweep = cycle(t, HOLD_MS * 1.08);
			const glinting = sweep < 0.34;
			// A double-take: two quick nods on each cycle, then still. H2 is the
			// other portrait symbol and sits next to this one on the paytable, so
			// they are the pair most at risk of reading as one animation — the
			// checker scored them the closest on the board. The fix is a different
			// TEMPORAL signature, not just a different amplitude: this one is a
			// discrete repeating beat, H2 is a continuous sway.
			const nod = strike(sweep, 9) * Math.sin(sweep * 44);
			return rest({
				rotation: 0.055 * nod,
				dy: 0.045 * nod,
				overlays: glinting
					? [
							{
								key: 'fxStreak',
								x: -0.42 + (sweep / 0.34) * 0.84,
								y: -0.14,
								width: 0.34,
								height: 0.5,
								rotation: -0.42,
								alpha: 0.85 * hump(sweep / 0.34, 1),
								tint: 0xffffff,
							},
						]
					: [],
			});
		},
	},

	// H2 — the blonde. Deliberately slower and wider than H1: they are the two
	// portrait symbols and sit next to each other on the paytable, so if either
	// pair is going to read as "the same animation twice" it is this one.
	H2: {
		hitScale: 1.05,
		frame: (t) => {
			const spark = cycle(t, HOLD_MS);
			return rest({
				rotation: 0.07 * Math.sin(t / 340),
				dx: 0.014 * Math.sin(t / 340 + 0.6),
				overlays: [
					{
						key: 'fxStar',
						x: 0.2,
						y: -0.06,
						width: 0.3 * hump(spark, 0.45),
						height: 0.3 * hump(spark, 0.45),
						rotation: spark * 2,
						alpha: 0.95 * hump(spark, 0.45),
						tint: 0xfff2c4,
					},
				],
			});
		},
	},

	// H3 — flamingo. A bird pecks: a fast dip forward, then a slow rise. The
	// asymmetry is the whole read; a symmetric bob would be a wobble again.
	H3: {
		hitScale: 1.0,
		frame: (t) => {
			const u = cycle(t, HOLD_MS);
			const dip = hump(u, 0.26);
			return rest({
				scaleX: 1 + 0.04 * dip,
				scaleY: 1 - 0.05 * dip,
				rotation: -0.11 * dip,
				dy: 0.05 * dip,
			});
		},
	},

	// H4 — boombox. The only symbol on a strict beat: sharp attack, decay,
	// repeat, with the speakers pushing outward and a warm glow behind on each
	// hit. Periodic where everything else is either continuous or one-shot.
	H4: {
		hitScale: 1.1,
		frame: (t) => {
			const thump = strike(cycle(t, HOLD_MS * 0.48), 5);
			return rest({
				scaleX: 1 + 0.075 * thump,
				scaleY: 1 - 0.05 * thump,
				dy: -0.012 * thump,
				overlays: [
					{
						key: 'fxGlow',
						x: 0,
						y: 0,
						width: 1.25,
						height: 1.25,
						rotation: 0,
						alpha: 0.4 * thump,
						tint: 0xffa64d,
						behind: true,
					},
				],
			});
		},
	},

	// H5 — the convertible. Two motions at once, which no other symbol has: a
	// constant high-frequency idle vibration, and a slow lunge forward with
	// speed lines. The vibration is what makes it read as an engine rather than
	// as a shaking picture.
	H5: {
		hitScale: 1.1,
		frame: (t) => {
			const lunge = strike(cycle(t, HOLD_MS * 1.15), 6);
			return rest({
				dx: 0.004 * Math.sin(t / 29) + 0.055 * lunge,
				dy: 0.008 * Math.sin(t / 38),
				rotation: -0.025 * lunge,
				overlays: [-1, 1].map((side) => ({
					key: 'fxStreak',
					x: -0.3 - 0.25 * lunge,
					y: side * 0.14,
					width: 0.55,
					height: 0.12,
					rotation: 0,
					alpha: 0.55 * lunge,
					tint: 0x8ef7ff,
					behind: true,
				})),
			});
		},
	},

	// L1-L4 — neon tubes. Same idea; four switch-on rhythms AND four axes of
	// movement, so no two are alike either to the eye or to the checker.

	// A: two hard blinks, then steady — and the letter RISES as it lights.
	L1: neonRoyal(
		NEON.L1,
		(t) => (t < 60 ? 1 : t < 110 ? 0.15 : t < 165 ? 1 : 0.55 + 0.45 * Math.sin(t / 300)),
		(t, glow) => ({ dy: -0.055 * glow + 0.012 * Math.sin(t / 320) }),
	),
	// K: a loose contact. It twitches SIDEWAYS on the blink and settles.
	L2: neonRoyal(
		NEON.L2,
		(t) => (t < 130 ? 0.9 : t < 175 ? 0.1 : 0.6 + 0.4 * Math.sin(t / 240 + 1.1)),
		(t, glow) => ({ dx: 0.05 * (1 - glow) * Math.sin(t / 45) + 0.01 * Math.sin(t / 380) }),
	),
	// Q: no blink at all — a slow warm swell, and it LEANS as it warms up.
	L3: neonRoyal(
		NEON.L3,
		(t) => Math.min(1, t / 380) * (0.6 + 0.4 * Math.sin(t / 420)),
		(t, glow) => ({ rotation: 0.1 * glow * Math.sin(t / 520) }),
	),
	// J: the cheapest tube on the sign — a fast stutter that BUZZES in scale.
	L4: neonRoyal(
		NEON.L4,
		(t) => (t < 300 ? (Math.sin(t / 25) > 0 ? 1 : 0.2) : 0.6 + 0.4 * Math.sin(t / 260)),
		(t, glow) => ({ scaleX: 1 + 0.06 * glow, scaleY: 1 - 0.045 * glow }),
	),

	// W — the comic burst. Hits hardest and kicks, with rays thrown off the
	// impact. It is a drawn explosion, so it should behave like one.
	W: {
		hitScale: 1.35,
		frame: (t) => {
			const settle = Math.exp(-t / 260);
			// Re-punches on a beat rather than breathing. The breathe it used to
			// have was `sin(t/240)`, and S's was `sin(t/260)` — near-identical
			// functions, which is why the checker scored W and S as the closest
			// pair on the board despite one of them spinning. Two symbols can look
			// different and still share their underlying motion; the fix is to stop
			// sharing it.
			const punch = strike(cycle(t, HOLD_MS * 0.62), 7);
			return rest({
				scaleX: 1 + 0.05 * settle + 0.07 * punch,
				scaleY: 1 + 0.05 * settle - 0.045 * punch,
				rotation: 0.1 * settle * Math.sin(t / 60),
				overlays: [0, 1, 2, 3].map((i) => ({
					key: 'fxStreak',
					x: 0,
					y: 0,
					width: 0.5 + 0.7 * (1 - settle),
					height: 0.09,
					rotation: (i / 4) * Math.PI * 2 + t / 1400,
					alpha: 0.7 * settle,
					tint: 0xffd166,
					behind: true,
				})),
			});
		},
	},

	// S — scatter. The only symbol that rotates continuously. It is a starburst,
	// so the shape does the work; nothing else on the board turns, which makes a
	// scatter win identifiable from the corner of the eye.
	S: {
		hitScale: 1.3,
		spins: true,
		frame: (t) => {
			const breath = Math.sin(t / 260);
			return rest({
				rotation: t / 900,
				scaleX: 1 + 0.045 * breath,
				scaleY: 1 + 0.045 * breath,
				overlays: [
					{
						key: 'fxGlow',
						x: 0,
						y: 0,
						width: 1.35 + 0.1 * breath,
						height: 1.35 + 0.1 * breath,
						rotation: 0,
						alpha: 0.32 + 0.12 * breath,
						tint: 0x4dffa6,
						behind: true,
					},
				],
			});
		},
	},

	// C — the Collector. It sweeps frames off the board, so it pulls INWARD:
	// a pinch on each beat with stars converging into it. Every other symbol on
	// this board expands when it wins; this one is the only one that contracts,
	// and that is the mechanic drawn as motion.
	C: {
		hitScale: 1.25,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.95);
			const suck = strike(u, 4);
			return rest({
				scaleX: 1 - 0.07 * suck,
				scaleY: 1 + 0.055 * suck,
				overlays: [0, 1, 2].map((i) => {
					const angle = (i / 3) * Math.PI * 2 + t / 900;
					const radius = 0.62 * u;
					return {
						key: 'fxStar',
						x: Math.cos(angle) * radius,
						y: Math.sin(angle) * radius,
						width: 0.26 * (1 - u),
						height: 0.26 * (1 - u),
						rotation: angle,
						alpha: 0.85 * (1 - u),
						tint: 0xff8cf0,
						behind: true,
					};
				}),
			});
		},
	},
};

/**
 * Motion for a symbol name. Falls back to a neutral breathe rather than
 * throwing: an unknown symbol should animate blandly, not crash the board.
 */
export const getSymbolWinMotion = (name: string): SymbolWinMotion =>
	SYMBOL_WIN_MOTION[name] ?? {
		hitScale: 1,
		frame: (t) => rest({ rotation: 0.05 * Math.sin(t / 360) }),
	};
