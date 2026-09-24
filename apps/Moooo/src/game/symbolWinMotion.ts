/**
 * Per-symbol win motion.
 *
 * Three reviewers rejected the sibling game writing "poor animation", and the
 * specific failure was not that nothing moved — it is that ALL TWELVE SYMBOLS
 * MOVED IDENTICALLY. `SymbolWinAnim` ran one shared scale-overshoot plus one
 * shared sine wobble for every symbol on the board, so three different objects
 * were the same animation with different art inside it. A reviewer watching a
 * few hundred spins sees that immediately.
 *
 * This table is the fix: one motion per symbol, chosen to read as the thing
 * itself. The rosette swings on its pin, the ribbon flutters, the milk sloshes
 * in the bottle, the hay bale lands dead, the bucket rings, the fair tokens
 * catch the light as they turn, the cow bursts and the scatter spins. Nothing
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
 * If a symbol ever needs something a transform cannot express — milk that
 * actually sloshes inside the glass, ribbon tails simulated separately from the
 * body — add a component branch in `SymbolWinAnim` for that one symbol. Do not
 * widen this type until something needs it.
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
	/** additive copy of the symbol's own sprite, for the glow-up */
	bloomAlpha: number;
	bloomTint: number;
	overlays: SymbolWinOverlay[];
};

export type SymbolWinMotion = {
	/**
	 * Multiplies the shared arrival overshoot. The hit itself stays common to
	 * every symbol — every win should punch — but Wild, Scatter and the Milk Churn
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

// The four tokens are enamel and catch light rather than move much. Each gets its
// own colour (matched to its own art) AND its own rhythm — four letters all
// flickering the same way would be the original bug at a smaller scale.
// Bloom tint per fair token, LIFTED from each symbol's own dominant colour so a
// winning token glows in its own hue rather than a borrowed one.
//
// 2026-08-27: this was called NEON and read `L1: 0xff3b8b // A — pink`,
// `L2: 0x66f6ff // K — cyan`, `L3: 0xffd166 // Q — yellow`, `L4: 0xb08cff //
// J — violet` — Hot Miami's card royals, in Hot Miami's colours. Moooo's four
// low symbols are not royals, they are fair tokens, and their colours are
// specified in docs/handoff/moooo_SYMBOLS.md. So a winning HORSESHOE bloomed
// pink and a winning CLOVER bloomed cyan.
//
// Values are the measured dominant of each sprite (PIL, alpha > 200, neutral
// chrome ring excluded) raised toward white so the bloom reads as light coming
// off the object rather than a second copy of it:
//
//   l1.png #c03030 pillar-box red   -> 0xff5a52
//   l2.png #309040 grass green      -> 0x62d874
//   l3.png #2050b0 cobalt blue      -> 0x5a92ff
//   l4.png #8050b0 violet           -> 0xb98cf0
const TOKEN_GLOW = {
	L1: 0xff5a52, // horseshoe — pillar-box red
	L2: 0x62d874, // clover — grass green
	L3: 0x5a92ff, // wheat sheaf — cobalt blue
	L4: 0xb98cf0, // hen's egg — violet
} as const;

/**
 * A fair token lighting up: `ignite(t)` is its own glow pattern in 0..1, and
 * `move(t, glow)` is how the object physically reacts to being lit.
 *
 * `move` exists because of a measurement, not a hunch. The first version gave
 * all four tokens the same faint breathe and differed them only by flicker
 * timing and colour — and `design/check_symbol_motion.mjs` scored the four at
 * 0.28-0.61 apart while every other pair on the board was 0.94 or more.
 * Numerically they were still the original bug, at a smaller scale, and colour
 * was doing all the work.
 *
 * So each moves on a DIFFERENT AXIS: L1 rises, L2 twitches sideways, L3 leans,
 * L4 buzzes in scale. Four distinguishable motions, and the check passes on
 * motion alone rather than on tint.
 *
 * (Named `neonRoyal` until 2026-08-27, when the four were still being thought
 * of as Hot Miami's A / K / Q / J neon letters. They are a horseshoe, a clover,
 * a wheat sheaf and a hen's egg — see docs/handoff/moooo_SYMBOLS.md.)
 */
const litToken = (
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
	// ── The five premiums ────────────────────────────────────────────────────
	//
	// 2026-08-27: every one of these was designed for a HOT MIAMI object, and the
	// gestures were as wrong as the names. H1 was "the guy in the Hawaiian shirt"
	// with a specular glint across his sunglasses; H2 "the blonde"; H3 a flamingo
	// pecking; H4 a boombox on a strict beat with its speakers pushing outward;
	// H5 a convertible with an idle vibration, a lunge and speed lines.
	//
	// Moooo's five are a rosette, a ribbon, a milk bottle, a hay bale and a feed
	// bucket (docs/handoff/moooo_SYMBOLS.md). A hay bale does not have a beat and
	// a feed bucket does not have suspension, so renaming the comments would have
	// left five objects moving like five other objects.
	//
	// The structural constraint from the original work is kept: each moves on a
	// DIFFERENT temporal signature, because design/check_symbol_motion.mjs scores
	// pairs on correlation and amplitude alone will not separate them.
	//
	//   H1 discrete swing (pendulum, decaying)   H2 continuous flutter
	//   H3 single asymmetric tilt-and-settle     H4 one dead thud, no rebound
	//   H5 high-frequency ring, decaying

	// H1 — Champion Rosette. Three layers of pleated ribbon on a pin with two
	// long tails: it SWINGS, and the tails trail a beat behind the body. Rotation
	// leads and the vertical follows, which is what a hanging thing does.
	H1: {
		hitScale: 1.05,
		frame: (t) => {
			const sweep = cycle(t, HOLD_MS * 1.08);
			const flashing = sweep < 0.34;
			// Pendulum: a decaying swing rather than the old double-nod. Discrete
			// and repeating, against H2's continuous sway — a different temporal
			// signature, not just a different amplitude.
			const swing = strike(sweep, 9) * Math.sin(sweep * 30);
			return rest({
				rotation: 0.085 * swing,
				dx: 0.03 * swing,
				dy: 0.02 * Math.abs(swing),
				overlays: flashing
					? [
							// Light running along the satin as it turns, across the pleats
							// rather than across a pair of sunglasses.
							{
								key: 'mooooFxStreak',
								x: -0.42 + (sweep / 0.34) * 0.84,
								y: -0.1,
								width: 0.3,
								height: 0.62,
								rotation: -0.2,
								alpha: 0.7 * hump(sweep / 0.34, 1),
								tint: 0xfff2dc,
							},
						]
					: [],
			});
		},
	},

	// H2 — Runner-up Ribbon. One flat layer and a short tail, so it is far
	// lighter than H1: it FLUTTERS instead of swinging. Continuous where H1 is
	// discrete, and led by width rather than by angle — cloth catching air
	// narrows and widens, it does not rotate about a pin.
	H2: {
		hitScale: 1.05,
		frame: (t) => {
			const spark = cycle(t, HOLD_MS);
			const air = Math.sin(t / 190);
			return rest({
				scaleX: 1 + 0.035 * air,
				scaleY: 1 - 0.018 * air,
				rotation: 0.022 * Math.sin(t / 340),
				dx: 0.012 * Math.sin(t / 250 + 0.6),
				overlays: [
					{
						key: 'mooooFxStar',
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

	// H3 — Milk Bottle. Glass, full, foil-capped. The bottle is rocked once and
	// the MILK keeps moving after it: a quick tilt, then a slow asymmetric
	// settle back. The asymmetry is the whole read — it is the only symbol whose
	// return is slower than its departure — and it is inherited unchanged from
	// the flamingo's peck, which is the one Miami gesture that happened to
	// transfer: a bird's dip and a bottle's slosh are the same curve.
	H3: {
		hitScale: 1.0,
		frame: (t) => {
			const u = cycle(t, HOLD_MS);
			const tilt = hump(u, 0.26);
			return rest({
				scaleX: 1 + 0.03 * tilt,
				scaleY: 1 - 0.04 * tilt,
				rotation: -0.10 * tilt,
				dx: 0.03 * tilt,
				dy: 0.035 * tilt,
			});
		},
	},

	// H4 — Hay Bale. The heaviest thing on the board and the only one with NO
	// rebound: it drops, it lands, it stays. A single dead thud per cycle with
	// dust pushed out sideways at the base.
	//
	// The boombox's strict repeating beat was exactly backwards for this object —
	// hay has no rhythm — so the periodicity goes and what is left is one impact
	// with a long flat tail. That also keeps it apart from every other premium
	// here, all of which repeat.
	H4: {
		hitScale: 1.1,
		frame: (t) => {
			const thud = strike(cycle(t, HOLD_MS * 0.96), 9);
			return rest({
				scaleX: 1 + 0.085 * thud,
				scaleY: 1 - 0.07 * thud,
				dy: 0.03 * thud,
				overlays: [-1, 1].map((side) => ({
					// dust squeezed out from under the bale, low and wide
					key: 'mooooFxGlow',
					x: side * (0.24 + 0.2 * thud),
					y: 0.34,
					width: 0.5 + 0.3 * thud,
					height: 0.26,
					rotation: 0,
					alpha: 0.4 * thud,
					tint: 0xd9c9a0,
					behind: true,
				})),
			});
		},
	},

	// H5 — Feed Bucket. Chipped enamel over steel: struck, it RINGS. A fast
	// high-frequency shimmer that decays, plus the wooden handle swinging on its
	// lugs a little behind the body.
	//
	// The vibration survives from the convertible's engine idle — a ringing pail
	// and an idling engine are both fast small oscillations — but it now decays
	// instead of running forever, because a bucket rings and stops. The lunge and
	// the speed lines are gone; they were a car.
	H5: {
		hitScale: 1.1,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 1.15);
			const ring = Math.exp(-4.2 * u);
			return rest({
				dx: 0.012 * ring * Math.sin(u * 90),
				scaleX: 1 + 0.03 * ring * Math.sin(u * 78),
				scaleY: 1 - 0.03 * ring * Math.sin(u * 78),
				// the handle lags the body by a quarter cycle
				rotation: 0.03 * ring * Math.sin(u * 78 - Math.PI / 2),
				overlays: [
					{
						key: 'mooooFxGlow',
						x: 0,
						y: 0,
						width: 1.05 + 0.5 * (1 - ring),
						height: 1.05 + 0.5 * (1 - ring),
						rotation: 0,
						alpha: 0.42 * ring,
						// The bucket's own chipped duck-egg enamel (sampled #60a8a8,
						// lifted), not the icy 0x8ef7ff it carried over from Hot Miami.
						tint: 0x9fdcd8,
						behind: true,
					},
				],
			});
		},
	},

	// L1-L4 — fair tokens. Same idea; four glow rhythms AND four axes of
	// movement, so no two are alike either to the eye or to the checker.

	// A: two hard blinks, then steady — and the letter RISES as it lights.
	L1: litToken(
		TOKEN_GLOW.L1,
		(t) => (t < 60 ? 1 : t < 110 ? 0.15 : t < 165 ? 1 : 0.55 + 0.45 * Math.sin(t / 300)),
		(t, glow) => ({ dy: -0.055 * glow + 0.012 * Math.sin(t / 320) }),
	),
	// K: a loose contact. It twitches SIDEWAYS on the blink and settles.
	L2: litToken(
		TOKEN_GLOW.L2,
		(t) => (t < 130 ? 0.9 : t < 175 ? 0.1 : 0.6 + 0.4 * Math.sin(t / 240 + 1.1)),
		(t, glow) => ({ dx: 0.05 * (1 - glow) * Math.sin(t / 45) + 0.01 * Math.sin(t / 380) }),
	),
	// Q: no blink at all — a slow warm swell, and it LEANS as it warms up.
	L3: litToken(
		TOKEN_GLOW.L3,
		(t) => Math.min(1, t / 380) * (0.6 + 0.4 * Math.sin(t / 420)),
		(t, glow) => ({ rotation: 0.1 * glow * Math.sin(t / 520) }),
	),
	// J: the cheapest tube on the sign — a fast stutter that BUZZES in scale.
	L4: litToken(
		TOKEN_GLOW.L4,
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
					key: 'mooooFxStreak',
					x: 0,
					y: 0,
					width: 0.5 + 0.7 * (1 - settle),
					height: 0.09,
					rotation: (i / 4) * Math.PI * 2 + t / 1400,
					alpha: 0.7 * settle,
					// Cream, not the 0xffd166 gold this used to be. Gold at that saturation
					// is the CHAMPION BELL's colour (BELL_COLORS in constants.ts), and this
					// streak fires off the cow — the one symbol a bell is actually attached
					// to. A gold flash on a cow carrying a brass bell said the wrong tier.
					tint: 0xfff2dc,
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
						key: 'mooooFxGlow',
						x: 0,
						y: 0,
						width: 1.35 + 0.1 * breath,
						height: 1.35 + 0.1 * breath,
						rotation: 0,
						alpha: 0.32 + 0.12 * breath,
						// Warm horn-brass. It was 0x4dffa6, mint green — Hot Miami's, and the
						// scatter here is a cream-and-red megaphone.
						tint: 0xffc98a,
						behind: true,
					},
				],
			});
		},
	},

	// M — the Milk Churn.
	//
	// 2026-08-27: this entry was keyed `C` and commented "the Collector. It sweeps
	// frames off the board, so it pulls INWARD". There is no Collector in Moooo,
	// and no key `C` in SYMBOL_INFO_MAP (constants.ts) — so this motion could
	// never play, and the Milk Churn, which is a real symbol that lands on real
	// boards, had NO win motion at all.
	//
	// The gesture is reversed with it, because the mechanic is the opposite one:
	// the Collector pulled value in, the Churn PUSHES a meter up a step. So it
	// heaves upward on each beat and throws its sparks up and out — the same
	// direction the token flies in MilkMeters.svelte, which is the motion this is
	// promising. Cream rather than pink: it is a milk churn.
	M: {
		hitScale: 1.25,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.95);
			const heave = strike(u, 4);
			return rest({
				// squat and rebound taller — a lift, not a pinch
				scaleX: 1 + 0.05 * heave,
				scaleY: 1 + 0.09 * heave,
				dy: -0.05 * heave,
				overlays: [0, 1, 2].map((i) => {
					// thrown upward in a narrow fan rather than orbiting
					const angle = -Math.PI / 2 + (i - 1) * 0.5;
					const radius = 0.68 * u;
					return {
						key: 'mooooFxStar',
						x: Math.cos(angle) * radius,
						y: Math.sin(angle) * radius,
						width: 0.26 * (1 - u),
						height: 0.26 * (1 - u),
						rotation: angle,
						alpha: 0.85 * (1 - u),
						tint: 0xfff2dc,
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
