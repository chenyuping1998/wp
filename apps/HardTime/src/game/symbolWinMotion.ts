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
			// 0.35, not 0.7: the bloom tints the whole flat suit icon
			bloomAlpha: 0.35 * lit,
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

// ── Hard Time (2026-09-27) ───────────────────────────────────────────────────
//
// Until this date H1-H5, W, S and SW here were Capo Nostra's table verbatim —
// a signet ring, a skyline, a briefcase, whiskey, a sedan, a fedora doff, a
// vault wheel cranked round (which spun the cell gate ~100°) and a Tommy Gun.
// Deadwood Express was rejected for "Poor animations" with exactly that kind of
// inherited table, so every entry below is what THIS symbol's object does.
const STEEL = 0xdfe6ea; // cold metal glint
const LAMP = 0xffe2a0; // the searchlight's warm beam
const CHALK = 0xf3ecd9; // tally marks
const RUST = 0xd8864a; // warm light off old iron

/** Rotation about a point `h` cell-heights above the centre (negative = below). */
const hang = (theta: number, h: number) => ({
	rotation: theta,
	dx: -h * Math.sin(theta),
	dy: h * (Math.cos(theta) - 1),
});

const light = (x: number, y: number, size: number, alpha: number, tint: number, behind = true): SymbolWinOverlay => ({
	key: 'fxGlow', x, y, width: size, height: size, rotation: 0, alpha, tint, behind,
});

/** One glint travelling across the art over `window` ms (nothing outside it). */
const glint = (t: number, window: number, tint = STEEL, y = -0.05): SymbolWinOverlay[] => {
	const u = t / window;
	if (u < 0 || u >= 1) return [];
	return [{ key: 'fxStreak', x: -0.45 + u * 0.9, y, width: 0.24, height: 0.7, rotation: -0.5, alpha: 0.55 * hump(u, 1), tint }];
};

const BASE_WIN_MOTION: Record<string, SymbolWinMotion> = {
	// W — the prison cap. Tossed up and caught: it rises with a small tip, then
	// lands flat with a squash. The only symbol whose gesture is a throw.
	W: {
		hitScale: 1.0,
		frame: (t) => {
			const u = Math.min(1, t / (HOLD_MS * 0.7));
			const air = u < 0.55 ? Math.sin((u / 0.55) * Math.PI) : 0;
			const land = u >= 0.55 ? strike((u - 0.55) / 0.45, 5) : 0;
			return rest({
				dy: -0.09 * air,
				rotation: -0.1 * air,
				scaleX: 1 + 0.07 * land,
				scaleY: 1 - 0.07 * land,
				overlays: [light(0, 0.35, 0.8, 0.35 * land, RUST), ...glint(t - 120, 620)],
			});
		},
	},

	// S — the cell gate. Rattled: a slam, then the bars shake side to side and
	// settle. It used to rotate like a vault wheel; a gate does not turn.
	S: {
		hitScale: 1.05,
		frame: (t) => {
			const damp = Math.exp(-t / 420);
			const slam = strike(t / 200, 3);
			return rest({
				dx: 0.035 * damp * Math.sin(t / 22),
				scaleX: 1 - 0.05 * slam,
				scaleY: 1 + 0.03 * slam,
				bloomAlpha: 0.18 * damp,
				bloomTint: RUST,
				overlays: [light(0, 0, 1.25, 0.3 * (0.4 + 0.6 * damp), RUST)],
			});
		},
	},

	// SW — the searchlight. The lamp head sweeps side to side from its base and
	// its beam sweeps with it: the mechanic, drawn as the object doing it.
	SW: {
		hitScale: 1.05,
		frame: (t) => {
			const theta = 0.16 * Math.sin(t / 170);
			return rest({
				...hang(theta, -0.4),
				bloomAlpha: 0.3,
				bloomTint: LAMP,
				overlays: [
					light(0.08, -0.12, 0.7, 0.55, LAMP, false),
					{ key: 'fxStreak', x: 0.1 + 0.6 * Math.sin(theta), y: -0.45, width: 0.3, height: 1.1, rotation: theta, alpha: 0.4, tint: LAMP, behind: true },
				],
			});
		},
	},

	// H1 — the key ring. Swings from its ring like a pendulum and jangles out:
	// a damped swing with a quick secondary rattle on top.
	H1: {
		hitScale: 1.05,
		frame: (t) => {
			const theta = 0.18 * Math.exp(-t / 650) * Math.sin(t / 120) + 0.02 * Math.exp(-t / 300) * Math.sin(t / 18);
			return rest({ ...hang(theta, 0.42), overlays: glint(t - 80, 700) });
		},
	},

	// H2 — the handcuffs. Click-click: two fast horizontal snaps as they close.
	H2: {
		hitScale: 1.0,
		frame: (t) => {
			const snap = strike(cycle(t, 300), 12) * (t < 600 ? 1 : 0);
			return rest({
				scaleX: 1 - 0.1 * snap,
				scaleY: 1 + 0.03 * snap,
				bloomAlpha: 0.3 * snap,
				bloomTint: STEEL,
				overlays: [light(0, 0, 0.9, 0.3 * snap, STEEL)],
			});
		},
	},

	// H3 — the contraband tin. It hops twice, the lid rattling as it lands.
	H3: {
		hitScale: 1.0,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.42);
			const hop = hump(u, 0.55);
			const rattle = u > 0.55 ? 0.03 * Math.exp(-(u - 0.55) * 12) * Math.sin(t / 15) : 0;
			return rest({ dy: -0.07 * hop, rotation: rattle, overlays: glint(t - 200, 600, RUST) });
		},
	},

	// H4 — the tin mug. Banged on the bars: three rhythmic knocks, each a sharp
	// tilt and a ring of warm light.
	H4: {
		hitScale: 1.0,
		frame: (t) => {
			const knock = strike(cycle(t, HOLD_MS / 3), 8);
			return rest({
				rotation: -0.12 * knock,
				dx: -0.03 * knock,
				overlays: [light(-0.2, -0.1, 0.6, 0.45 * knock, RUST)],
			});
		},
	},

	// H5 — the tally patch. Three chalk strokes scratched across it, the patch
	// pressed a little flatter on each: counting the days.
	H5: {
		hitScale: 1.0,
		frame: (t) => {
			const stroke = HOLD_MS / 3.4;
			const i = Math.floor(t / stroke);
			const u = (t % stroke) / stroke;
			const press = hump(u, 0.5);
			return rest({
				scaleX: 1 - 0.06 * press,
				scaleY: 1 - 0.06 * press,
				dy: 0.02 * press,
				overlays:
					i < 3
						? [{ key: 'fxStreak', x: -0.3 + 0.25 * i, y: -0.3 + 0.6 * u, width: 0.08, height: 0.55 * Math.min(1, u * 2), rotation: 0.35, alpha: 0.75 * (1 - u), tint: CHALK }]
						: [],
			});
		},
	},

	// L1-L4 — the four suits. Unchanged in gesture (they were written for card
	// suits, which these are); only their bloom was halved in suitMedallion.
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
// 2026-09-27: halved, as Deadwood's was. The old 15°/12px/15% floor turned
// every symbol into a big wobble; the motions above are specific instead.
export const VISIBLE_FLOOR = {
	rotation: 0.12,
	offset: 0.05,
	scale: 0.08,
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
