/**
 * Per-symbol win motion.
 *
 * Three reviewers rejected this game writing "poor animation", and the specific
 * failure is not that nothing moves — it is that ALL TWELVE SYMBOLS MOVE
 * IDENTICALLY. `SymbolWinAnim` ran one shared scale-overshoot plus one shared
 * sine wobble for every symbol on the board, so a winning car, a winning glass
 * of whiskey and a winning card suit were the same animation with different art
 * inside it. A reviewer watching a few hundred spins sees that immediately.
 *
 * This table is the fix: one motion per symbol, chosen to read as the thing
 * itself. The ring turns and catches the light, the skyline lights its windows,
 * the briefcase opens, the whiskey sloshes, the car lunges, the chips take a
 * travelling glint, the scatter spins. Nothing here needs new art — it is all
 * transforms of the existing PNG plus the fx sprites already in the registry.
 *
 * ── This table survived a reskin once, and must not again ────────────────────
 *
 * Capo Nostra is a reskin of Hot Miami, and on 2026-09-07 the H1-H5 and L1-L4
 * blocks here were still BYTE-IDENTICAL to Hot Miami's — including their design
 * comments, which described objects this game does not contain. H1 was leaning
 * like a man in a Hawaiian shirt while drawing a gold signet ring; H3 was
 * pecking like a flamingo while drawing a briefcase; H4 was thumping like a
 * boombox while drawing a glass of spirit. Every one of them measured as
 * "distinct" the whole time, because the gate only ever compared these twelve
 * against EACH OTHER. `design/check_symbol_motion.mjs` now also compares each
 * symbol's own source block against the same symbol's block in the sibling app,
 * so inheriting a motion designed for a different object fails the build.
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
 * the whiskey, wheels rotating independently — add a component branch in
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
	/** additive copy of the symbol's own sprite — a specular bloom on metal */
	bloomAlpha: number;
	bloomTint: number;
	overlays: SymbolWinOverlay[];
};

export type SymbolWinMotion = {
	/**
	 * Multiplies the shared arrival overshoot. The hit itself stays common to
	 * every symbol — every win should punch — but Wild, Scatter and Tommy Gun
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

/** Ramps 0→1 between `at` and `at + width`, flat either side. */
const step = (u: number, at: number, width: number) =>
	u <= at ? 0 : u >= at + width ? 1 : (u - at) / width;

// The four lows are struck-metal chips with an engraved suit on the face
// (ART_BRIEF §2), so they take LIGHT rather than emit it. Each gets its own
// sheen colour, matched to its own art — four medallions all glinting the same
// way would be the original bug at a smaller scale.
const SHEEN = {
	// These used to be neon letters and this table used to ignite pink, cyan and
	// violet tubes behind them. The 2026-08 rebuild made them engraved suits on
	// dark chips; the colours were re-grounded then, but the MOTION stayed a
	// neon-tube switch-on flicker until 2026-09-07. A tube ignites; a metal chip
	// catches a moving highlight. Same four inks, new grammar.
	L1: 0xcfd6dc, // Spade  — silver
	L2: 0xc9484f, // Heart  — wine
	L3: 0xd8705f, // Diamond — warm copper-red
	L4: 0xa9b2b9, // Club   — dimmer silver
} as const;

/**
 * An engraved suit medallion.
 *
 * `shine(t)` is the specular strength on the face in 0..1 — how hard the metal
 * is catching the light. `sweep(t)` is WHERE that highlight sits as it crosses
 * the engraving, 0 at one edge and 1 at the other, or a negative number for the
 * part of the cycle when no glint is crossing. `angle` is the axis it runs
 * along, so no two suits are lit from the same direction. `move(t, shine)` is
 * how the chip itself reacts.
 *
 * `move` exists because of a measurement, not a hunch. The first version gave
 * all four lows the same faint breathe and differed them only by flicker
 * timing and colour — and `design/check_symbol_motion.mjs` scored the four
 * at 0.28-0.61 apart while every other pair on the board was 0.94 or
 * more. Numerically they were still the original bug, at a smaller scale, and
 * colour was doing all the work.
 *
 * So each one also moves on a DIFFERENT AXIS: the spade lifts as it is struck,
 * the heart rocks sideways on its edge, the diamond leans into the facet that
 * flares, the club rings down in scale. Four distinguishable motions, and the
 * check passes on motion alone rather than on tint.
 */
const suitMedallion = (
	tint: number,
	angle: number,
	shine: (t: number) => number,
	sweep: (t: number) => number,
	move: (t: number, shine: number) => Partial<SymbolWinFrame>,
): SymbolWinMotion => ({
	hitScale: 0.9,
	frame: (t) => {
		const lit = shine(t);
		const at = sweep(t);
		// The bloom is the metal brightening under the highlight; the streak is
		// the highlight itself travelling. One without the other reads as either a
		// flat tint change or a decal sliding over a dead chip.
		return rest({
			bloomAlpha: 0.7 * lit,
			bloomTint: tint,
			overlays:
				at < 0 || at > 1
					? []
					: [
							{
								key: 'fxStreak',
								x: Math.cos(angle) * (at * 1.12 - 0.56),
								y: Math.sin(angle) * (at * 1.12 - 0.56),
								// fxStreak is a horizontal soft ellipse in a square texture, so
								// a narrow-and-tall size squeezes it into a VERTICAL bar. The
								// bar must end up across the direction of travel, and it is
								// already across a travel of angle=0, so the rotation is the
								// angle itself — not angle + 90 degrees, which lays the bar
								// down along its own path and reads as a smear rather than a
								// glint.
								width: 0.26,
								height: 1.02,
								rotation: angle,
								alpha: 0.8 * hump(at, 1),
								tint: 0xfff4dc,
							},
						],
			...move(t, lit),
		});
	},
});

// ── the table ────────────────────────────────────────────────────────────────

const BASE_WIN_MOTION: Record<string, SymbolWinMotion> = {
	// H1 — the Don's signet ring: solid gold, oval crest face, band catching the
	// key light (see static/assets/sprites/capoSymbols/h1.png).
	//
	// Gold does not gesture, it CATCHES LIGHT, so the ring is turned through one
	// slow swing and a hard specular glint runs across the crest at the moment
	// the face squares up. The band foreshortens on the turn — scale moves at
	// twice the rotation's frequency, which is what separates "being rotated in
	// the hand" from "leaning". The slowest continuous motion on the board
	// carrying the shortest flash on it is the whole read.
	H1: {
		hitScale: 1.05,
		frame: (t) => {
			const u = cycle(t, HOLD_MS);
			// One smooth roll out and back. No beat: nothing strikes a ring.
			const turn = Math.sin(Math.PI * 2 * u);
			// The face squares up on the way through, and that is when it flares.
			const sweep = u < 0.08 || u > 0.44 ? -1 : (u - 0.08) / 0.36;
			const flare = sweep < 0 ? 0 : hump(sweep, 1);
			return rest({
				rotation: 0.05 * turn,
				// Foreshortening, at twice the turn's rate — widest square-on.
				scaleX: 1 - 0.022 * Math.abs(turn),
				dy: 0.012 * turn,
				bloomAlpha: 0.55 * flare,
				// The only symbol allowed bright gold (ART_BRIEF §2).
				bloomTint: 0xdce8f0,
				overlays:
					sweep < 0
						? []
						: [
								{
									key: 'fxStreak',
									// Across the crest face, which sits right of the band.
									x: -0.34 + sweep * 0.82,
									y: -0.06,
									width: 0.3,
									height: 0.62,
									rotation: -0.38,
									alpha: 0.9 * flare,
									tint: 0xfff6d8,
								},
							],
			});
		},
	},

	// H2 — the 1930s skyline: art-deco towers in silhouette with small warm
	// window lights (capoSymbols/h2.png).
	//
	// A city does not sway. What a city does is STAND while the light changes
	// around it, so this is the only monotonic motion on the board: a slow
	// camera push toward the towers, the warm light on them coming up in three
	// steps like blocks switching on, and a searchlight crossing behind the
	// spires. Everything else here either oscillates or repeats; this one goes
	// one way and stays, which is its whole temporal signature.
	//
	// The three steps are the whole SPRITE brightening, not individual windows:
	// `bloomAlpha` draws an additive copy of the symbol's own art (SymbolArt's
	// `overlayTint`/`overlayAlpha`), and there is no per-window geometry to
	// address. Lighting the tiers separately would need art cut into tiers.
	H2: {
		hitScale: 1.05,
		frame: (t) => {
			const u = Math.min(1, t / HOLD_MS);
			// Smoothstep, so the push has no visible start or stop.
			const push = u * u * (3 - 2 * u);
			// Three tiers of windows, bottom to top. A staircase, not a fade.
			const lit = (step(u, 0.16, 0.07) + step(u, 0.35, 0.07) + step(u, 0.56, 0.07)) / 3;
			const beam = cycle(t, HOLD_MS * 0.62);
			return rest({
				scaleX: 1 + 0.04 * push,
				scaleY: 1 + 0.04 * push,
				dy: -0.012 * push,
				bloomAlpha: 0.72 * lit,
				bloomTint: 0xffc46b,
				overlays: [
					{
						key: 'fxStreak',
						x: -0.34 + beam * 0.68,
						y: -0.05,
						width: 0.22,
						height: 1.35,
						// Raked over as it crosses, like a beam swung from below.
						rotation: -0.55 + beam * 1.1,
						alpha: 0.55 * hump(beam, 1),
						tint: 0xfff0c8,
						behind: true,
					},
				],
			});
		},
	},

	// H3 — the cash briefcase, shown open with the bundles inside
	// (capoSymbols/h3.png).
	//
	// So the win is the case OPENING: the brass latch ticks first, then the lid
	// swings up over a third of a second and the money light comes out of it,
	// with three notes lifting clear on a stagger. Two events of very different
	// speed in one gesture — a 30ms tick and a 330ms swing — which is a
	// signature no other symbol here has.
	H3: {
		hitScale: 1.0,
		frame: (t) => {
			const u = cycle(t, HOLD_MS);
			// The latch: a sharp, tiny jolt, over almost before it starts.
			const tick = u < 0.05 ? 0 : Math.exp(-34 * (u - 0.05));
			// The lid: slow, eased, and it STAYS open once it is.
			const open = step(u, 0.14, 0.34);
			const eased = open * open * (3 - 2 * open);
			return rest({
				// Taller and slightly narrower: the lid going up, not a squash.
				scaleY: 1 + 0.055 * eased,
				scaleX: 1 - 0.014 * eased,
				dy: -0.018 * eased,
				dx: 0.012 * tick,
				rotation: -0.02 * tick,
				overlays: [
					{
						key: 'fxGlow',
						x: 0,
						y: 0.02,
						width: 0.5 + 0.5 * eased,
						height: 0.42 + 0.3 * eased,
						rotation: 0,
						alpha: 0.4 * eased,
						tint: 0xffe0a0,
					},
					...[0, 1, 2].map((i) => {
						// Notes lifting out of the open case, one after another.
						const lift = step(u, 0.22 + i * 0.11, 0.4);
						return {
							key: 'fxStar',
							x: (i - 1) * 0.19,
							y: 0.16 - 0.52 * lift,
							width: 0.17 * (1 - 0.35 * lift),
							height: 0.17 * (1 - 0.35 * lift),
							rotation: (i - 1) * 0.5 * lift,
							alpha: 0.85 * hump(lift, 1),
							tint: 0xfff0c0,
						};
					}),
				],
			});
		},
	},

	// H4 — whiskey and cigar: a cut tumbler of amber with a lit cigar across the
	// front of it (capoSymbols/h4.png).
	//
	// This was written for a boombox and kept a strict speaker-thump beat, which
	// is exactly what a glass of spirit does not do. It is now the only LIQUID
	// motion on the board: a long low swing with a lateral drift a quarter-cycle
	// behind it, so the two together read as whisky swinging round the inside of
	// the glass rather than as the glass wobbling. The ember breathes on its own
	// slower cycle and three curls of smoke leave it on a stagger — the only
	// overlay here that travels off the top of the cell.
	H4: {
		hitScale: 1.05,
		frame: (t) => {
			const phase = (Math.PI * 2 * t) / (HOLD_MS * 0.62);
			// Phase-modulated, not a plain sine, and that is the point rather than
			// decoration: liquid swings fast to one side and comes back slowly, so
			// the wave is skewed. A clean sine here scored 0.76 against the car's
			// idle and 0.87 against the heart's rock — three symbols all running
			// sin(t). The skew is a shape no other symbol on the board has.
			const swing = Math.sin(phase + 0.9 * Math.sin(phase));
			// The liquid lags the glass. That lag IS the slosh.
			const lagPhase = phase - 0.95;
			const lag = Math.sin(lagPhase + 0.9 * Math.sin(lagPhase));
			const ember = 0.5 + 0.5 * Math.sin(t / 215);
			return rest({
				rotation: 0.055 * swing,
				dx: 0.03 * lag,
				dy: 0.008 * Math.sin(phase * 2),
				// The spirit lit from within, not a flash: it never fully leaves.
				bloomAlpha: 0.2 + 0.35 * ember,
				bloomTint: 0xc98b3a,
				overlays: [
					{
						// The cigar's lit end, bottom-left in the art.
						key: 'fxGlow',
						x: -0.3,
						y: 0.25,
						width: 0.24 + 0.05 * ember,
						height: 0.24 + 0.05 * ember,
						rotation: 0,
						alpha: 0.3 + 0.35 * ember,
						tint: 0xff7a2a,
					},
					...[0, 1, 2].map((i) => {
						// Smoke: rises, spreads, thins, and is replaced.
						const curl = cycle(t + (i * HOLD_MS) / 3, HOLD_MS);
						return {
							key: 'fxGlow',
							x: -0.28 + 0.13 * Math.sin(curl * 5 + i),
							y: 0.16 - 0.62 * curl,
							width: 0.18 + 0.34 * curl,
							height: 0.18 + 0.34 * curl,
							rotation: 0,
							alpha: 0.42 * hump(curl, 1),
							tint: 0xb9a78f,
						};
					}),
				],
			});
		},
	},

	// H5 — the black sedan: a tall 1930s saloon in side view, chrome waist trim,
	// whitewall tyres (capoSymbols/h5.png).
	//
	// Two motions at once, which no other symbol has, and that concept survives
	// the reskin because both the old symbol and this one are cars. What did not
	// survive is the shape of it. A convertible is low and light, so it dipped
	// its nose into the lunge and threw cyan speed lines; a heavy saloon on soft
	// springs SQUATS on the rear and lifts its nose, and it builds to it rather
	// than snapping. So the lunge is now a slow eased swell with a positive
	// pitch, the idle is a low shudder instead of a buzz, and the streaks are
	// warm chrome — Miami's cyan is not a colour this game has.
	H5: {
		hitScale: 1.1,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 1.1);
			// Eased in and out over most of the cycle: weight taking up.
			const pull = hump(u, 0.66);
			// Chrome running along the waist line, early in the pull.
			const gleam = u < 0.06 || u > 0.4 ? -1 : (u - 0.06) / 0.34;
			return rest({
				dx: 0.0035 * Math.sin(t / 34) + 0.05 * pull,
				dy: 0.006 * Math.sin(t / 26),
				// Nose UP as the back squats, not down.
				rotation: 0.026 * pull,
				overlays: [
					...(gleam < 0
						? []
						: [
								{
									key: 'fxStreak',
									x: -0.46 + gleam * 0.92,
									y: -0.02,
									width: 0.26,
									height: 0.34,
									rotation: -0.12,
									alpha: 0.85 * hump(gleam, 1),
									tint: 0xfff6dc,
								},
							]),
					...[-1, 1].map((side) => ({
						key: 'fxStreak',
						x: -0.3 - 0.24 * pull,
						// Body line and wheel line rather than symmetric about centre.
						y: side < 0 ? -0.06 : 0.2,
						width: 0.55,
						height: 0.1,
						rotation: 0,
						alpha: 0.5 * pull,
						tint: 0xe8d9b4,
						behind: true,
					})),
				],
			});
		},
	},

	// L1-L4 — struck-metal chips. Same idea as before; four sheen rhythms AND
	// four axes of movement, so no two are alike either to the eye or to the
	// checker. What changed is the grammar: these used to switch on like neon
	// tubes, which is a light-EMITTING object's motion applied to an engraved
	// metal disc. They now take a travelling highlight instead.

	// Spade — struck once, cleanly. The glint crosses flat left to right and the
	// chip LIFTS on the strike, then settles under a low held sheen.
	L1: suitMedallion(
		SHEEN.L1,
		0,
		(t) => {
			const u = cycle(t, HOLD_MS);
			return 0.22 + 0.78 * hump(u, 0.46);
		},
		(t) => {
			const u = cycle(t, HOLD_MS);
			return u < 0.5 ? u / 0.5 : -1;
		},
		(t, lit) => ({ dy: -0.05 * lit + 0.01 * Math.sin(t / 320) }),
	),
	// Heart — the chip is rocking on its edge, so the light crosses TWICE, once
	// each way, and the chip travels sideways with it.
	L2: suitMedallion(
		SHEEN.L2,
		0.42,
		(t) => 0.18 + 0.82 * Math.abs(Math.sin((Math.PI * 2 * t) / HOLD_MS)),
		(t) => cycle(t, HOLD_MS / 2),
		(t) => ({ dx: 0.05 * Math.sin((Math.PI * 2 * t) / HOLD_MS) }),
	),
	// Diamond — a cut facet: the sheen builds slowly and then BREAKS in one hard
	// narrow flash near the top of the lean, which is what a facet does and a
	// flat face does not.
	L3: suitMedallion(
		SHEEN.L3,
		1.15,
		(t) => {
			const u = cycle(t, HOLD_MS);
			return 0.12 + 0.28 * hump(u, 1) + 0.6 * (u < 0.42 ? 0 : hump((u - 0.42) / 0.2, 1));
		},
		(t) => {
			const u = cycle(t, HOLD_MS);
			return u < 0.42 || u > 0.62 ? -1 : (u - 0.42) / 0.2;
		},
		(t) => ({ rotation: 0.09 * hump(cycle(t, HOLD_MS), 1) }),
	),
	// Club — struck and RINGING: the sheen beats down in a decaying oscillation
	// and the chip rings with it in scale, going nowhere.
	L4: suitMedallion(
		SHEEN.L4,
		-0.5,
		(t) => {
			const u = cycle(t, HOLD_MS);
			return 0.1 + 0.85 * Math.exp(-3.4 * u) * Math.abs(Math.cos(Math.PI * 5 * u));
		},
		(t) => {
			const u = cycle(t, HOLD_MS);
			return u < 0.3 ? u / 0.3 : -1;
		},
		(t, lit) => ({ scaleX: 1 + 0.06 * lit, scaleY: 1 - 0.045 * lit }),
	),

	// W — the fedora. Not a drawn explosion: this is a GESTURE, the doff. The
	// brim tips off fast, wobbles through two decaying overshoots the way a
	// caught object does rather than a rigid one, and comes back level. The
	// gold "WILD" band gets one glint as the brim rises back into the light —
	// the payout is on the band, not on rays flung off the silhouette.
	// 2026-09-07: this used to be Hot Miami's comic-burst rays, sized for a
	// drawn explosion. A hat does not explode; it tips.
	W: {
		hitScale: 1.15,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.85);
			// Fast tip, ringing decay — an underdamped settle, not a snap-to-rest.
			const ring = strike(u, 3.2) * Math.cos(u * Math.PI * 3.4);
			const catch_ = strike(u, 5);
			return rest({
				rotation: -0.22 * ring,
				scaleY: 1 - 0.05 * catch_,
				dy: -0.035 * catch_,
				overlays: [
					{
						key: 'fxStreak',
						x: 0,
						y: 0.06,
						width: 0.8,
						height: 0.11,
						rotation: -0.22 * ring,
						alpha: 0.6 * catch_,
						tint: 0xffd166,
						behind: false,
					},
				],
			});
		},
	},

	// S — the vault door. The wheel is being cranked, not twinkling: it spins
	// up fast and holds a steady turn, the whole door taking one heavy
	// metallic clunk as the mechanism catches, and the amber crack of light
	// already painted at the hinge (see fs.png) pulses as it strains against
	// the frame. `spins: true` is kept — nothing else on the board turns,
	// which is still what makes a scatter identifiable from the corner of the
	// eye — but the shape reads as machinery now, not as a star.
	// 2026-09-07: this used to be a green/cyan starburst pulse, matching
	// nothing in the actual art (a dark riveted door with one amber sliver).
	S: {
		hitScale: 1.15,
		spins: true,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.85);
			const spinup = 1 - strike(u, 4);
			const clunk = strike(u, 8);
			const speed = t / 520;
			return rest({
				rotation: speed * (0.25 + 0.75 * spinup),
				scaleX: 1 + 0.045 * clunk,
				scaleY: 1 - 0.03 * clunk,
				bloomAlpha: 0.22 + 0.16 * Math.sin(t / 190) * spinup,
				bloomTint: 0xffb347,
				overlays: [
					{
						key: 'fxStreak',
						x: 0,
						y: 0,
						width: 0.85,
						height: 0.07,
						rotation: speed * (0.25 + 0.75 * spinup),
						alpha: 0.5 * spinup,
						tint: 0xe3d9c6,
						behind: true,
					},
				],
			});
		},
	},

	// SW — the Tommy Gun. It fills its whole reel with Wilds, so it pushes
	// OUTWARD ALONG THE COLUMN: a vertical stretch on each beat with stars
	// thrown up and down the reel rather than orbiting the cell. The Collector
	// this replaced pinched inward, which was right for a symbol that swept
	// things off the board and is exactly wrong for one that fills a column.
	SW: {
		hitScale: 1.25,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.95);
			const recoil = strike(u, 4);
			return rest({
				// Narrow and TALL, growing: the cell reaching up and down its reel.
				scaleX: 1 - 0.05 * recoil,
				scaleY: 1 + 0.12 * recoil,
				overlays: [0, 1, 2].map((i) => {
					// Thrown up and down the column, not around the cell. `i - 1`
					// gives -1 / 0 / +1, so one goes up, one stays, one goes down.
					const lane = i - 1;
					const travel = 0.75 * u;
					return {
						key: 'fxStar',
						x: 0,
						y: lane * travel,
						width: 0.26 * (1 - u),
						height: 0.26 * (1 - u),
						rotation: 0,
						alpha: 0.85 * (1 - u),
						// Cold searchlight signal; red is reserved for the alarm transition.
						tint: 0x8fb4c8,
						behind: true,
					};
				}),
			});
		},
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
 * brighter, and clamping them would flatten the tops of the medallion glints,
 * which is a shape change.
 */
export const VISIBLE_FLOOR = {
	/** 15 degrees. Below this a lean on a 118px cell is a tremble. */
	rotation: 0.26,
	/** cell fractions: 0.10 is ~12px. */
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
 * Without it one stray pixel drives everything: when H4's win was still a
 * speaker thump (scale) with a 1.4px bob on it, asking that 1.4px to reach a
 * 12px floor demanded 8x, which took the whole symbol to +-50% scale. A channel under 15%
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
