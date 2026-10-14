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
	 * every symbol — every win should punch — but Wild, Scatter and Bruiser
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

// The four royals are neon tubes, so they ignite rather than move. Each gets its
// own colour (matched to its own art) AND its own rhythm — four letters all
// flickering the same way would be the original bug at a smaller scale.
// ── Turf War (2026-09-27) ────────────────────────────────────────────────────
//
// Until this date the table here was Hot Miami's verbatim: a Hawaiian-shirt guy,
// a blonde, a flamingo, a boombox, a convertible, four neon-tube royals and a
// comic burst — so a crown chain moved like a man, a banknote roll pecked like a
// bird and the Boombox Scatter spun ~60°. Deadwood Express was rejected for
// "Poor animations" with exactly that kind of inherited table; every entry below
// is what THIS symbol's object does, in this game's orange / bone / gold.
const ORANGE = 0xf5893d; // streetlight sodium orange
const BONE = 0xd9d6ce; // spray-paint off-white
const GOLD = 0xffc65e; // chain and knuckles
const BLOOD = 0xe0463c; // the Bruiser's red

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
const glint = (t: number, window: number, tint = GOLD, y = -0.05): SymbolWinOverlay[] => {
	const u = t / window;
	if (u < 0 || u >= 1) return [];
	return [{ key: 'fxStreak', x: -0.45 + u * 0.9, y, width: 0.24, height: 0.7, rotation: -0.5, alpha: 0.55 * hump(u, 1), tint }];
};

/**
 * A spray-paint tag being sprayed on: a mist that swells and clears over
 * `ms`, shaped by `mist(u)` (0..1), with the tag's own move on top. The mist
 * rhythm differs per tag as well as the move — with one shared mist the checker
 * scored the tags as the same animation (0.85 < 0.9).
 */
const spray = (
	ms: number,
	mist: (u: number, t: number) => number,
	move: (t: number, u: number) => Partial<SymbolWinFrame>,
): SymbolWinMotion => ({
	hitScale: 0.9,
	frame: (t) => {
		const u = Math.min(1, t / ms);
		const m = mist(u, t);
		return rest({
			bloomAlpha: 0.25 * m,
			bloomTint: BONE,
			overlays: [light(0, 0, 1.1 + 0.3 * u, 0.35 * m, BONE, false)],
			...move(t, u),
		});
	},
});

const BASE_WIN_MOTION: Record<string, SymbolWinMotion> = {
	// W — brass knuckles. Two jabs straight at the viewer, each landing with a
	// flash of gold on the knuckles.
	W: {
		hitScale: 1.0,
		frame: (t) => {
			const jab = strike(cycle(t, HOLD_MS * 0.45), 7) * (t < HOLD_MS * 0.9 ? 1 : 0);
			return rest({
				scaleX: 1 + 0.1 * jab,
				scaleY: 1 + 0.1 * jab,
				rotation: -0.06 * jab,
				bloomAlpha: 0.3 * jab,
				bloomTint: GOLD,
				overlays: [light(0, -0.12, 0.8, 0.5 * jab, GOLD, false)],
			});
		},
	},

	// S — the boombox. It pumps on the bass: a strict beat, speakers pushing out
	// (wider, shorter), orange light behind on every hit. It does not spin.
	S: {
		hitScale: 1.05,
		frame: (t) => {
			const beat = strike(cycle(t, HOLD_MS / 4), 6);
			return rest({
				scaleX: 1 + 0.08 * beat,
				scaleY: 1 - 0.05 * beat,
				overlays: [light(0, 0.05, 1.3, 0.45 * beat, ORANGE)],
			});
		},
	},

	// SW — the Bruiser. Winds the bat back, then swings through: a slow lean
	// back and a fast forward snap, pivoting low, with a red flare on contact.
	SW: {
		hitScale: 1.05,
		frame: (t) => {
			const u = Math.min(1, t / (HOLD_MS * 0.75));
			const theta = u < 0.5 ? 0.12 * Math.sin((u / 0.5) * (Math.PI / 2)) : 0.12 - 0.3 * Math.sin(((u - 0.5) / 0.5) * (Math.PI / 2)) * Math.exp(-(u - 0.5) * 2);
			const hit = u > 0.5 ? hump((u - 0.5) / 0.5, 0.6) : 0;
			return rest({
				...hang(theta, -0.4),
				bloomAlpha: 0.3 * hit,
				bloomTint: BLOOD,
				overlays: [light(0, 0, 1.3, 0.5 * hit, BLOOD)],
			});
		},
	},

	// H1 — the crown chain. Swings on its chain and settles, a gold glint
	// running across the links.
	H1: {
		hitScale: 1.05,
		frame: (t) => ({ ...rest({ overlays: glint(t - 60, 650) }), ...hang(0.16 * Math.exp(-t / 600) * Math.sin(t / 130), 0.45) }),
	},

	// H2 — the fenced block. The fence rattles and the windows behind it flicker
	// on: a fast damped shake with warm light coming up inside.
	H2: {
		hitScale: 1.0,
		frame: (t) => {
			const damp = Math.exp(-t / 380);
			const windows = 0.55 + 0.45 * Math.sin(t / 45) * Math.sin(t / 110);
			return rest({
				dx: 0.03 * damp * Math.sin(t / 20),
				dy: 0.012 * damp * Math.sin(t / 27),
				bloomAlpha: 0.25 * windows,
				bloomTint: ORANGE,
				overlays: [light(0, 0.05, 0.9, 0.35 * windows, ORANGE)],
			});
		},
	},

	// H3 — the banknote roll. Riffled: quick squeezes along its length, as if a
	// thumb ran through the notes, with one slow roll forward.
	H3: {
		hitScale: 1.0,
		frame: (t) => {
			const riffle = Math.abs(Math.sin(t / 40)) * Math.exp(-t / 500);
			return rest({
				scaleX: 1 - 0.07 * riffle,
				scaleY: 1 + 0.03 * riffle,
				rotation: 0.08 * Math.sin(t / 300),
				overlays: glint(t - 150, 600, BONE),
			});
		},
	},

	// H4 — bottle and cigarette. Smoke rises off the cigarette in two puffs while
	// the bottle sways once. The slow symbol: nothing about it snaps.
	H4: {
		hitScale: 1.0,
		frame: (t) => {
			const puffs = [0, 1].map((i) => {
				const age = (t - i * 380) / 700;
				if (age < 0 || age > 1) return null;
				return light(0.22 + 0.05 * age, -0.1 - 0.45 * age, 0.2 + 0.35 * age, 0.45 * (1 - age), 0xcfcac2, false);
			});
			return rest({
				...hang(0.1 * Math.sin(t / 240) * (1 - Math.exp(-t / 200)), -0.42),
				overlays: [light(0, 0.1, 0.7, 0.3, ORANGE), ...puffs.filter((x) => x !== null)],
			});
		},
	},

	// H5 — the lowrider. Hydraulics: it hops, lands, and the front and back pitch
	// alternately — the one symbol that bounces off the ground.
	H5: {
		hitScale: 1.05,
		frame: (t) => {
			const u = cycle(t, HOLD_MS * 0.48);
			const hop = hump(u, 0.45);
			const land = u > 0.45 ? strike((u - 0.45) / 0.55, 6) : 0;
			const side = Math.floor(t / (HOLD_MS * 0.48)) % 2 ? 1 : -1;
			return rest({
				dy: -0.07 * hop,
				rotation: side * 0.07 * hop,
				scaleY: 1 - 0.06 * land,
				scaleX: 1 + 0.04 * land,
				overlays: [light(0, 0.3, 0.9, 0.35 * land, ORANGE)],
			});
		},
	},

	// L1-L4 — spray-paint tags. Each is sprayed on (a mist that swells and clears)
	// and moves on its own axis, so the four never read as one animation:
	// the crown rises, the skull shakes, the star turns a little, the bolt zaps.
	L1: spray(520, (u) => hump(u, 1), (t, u) => ({ dy: -0.06 * hump(u, 1) })),
	L2: spray(300, (u) => hump(u, 1), (t, u) => ({ dx: 0.04 * Math.sin(t / 45) * Math.exp(-t / 400) })),
	L3: spray(800, (u) => Math.sin(u * Math.PI) ** 2, (t, u) => ({ rotation: 0.14 * Math.sin(u * Math.PI) })),
	L4: spray(
		700,
		(u, t) => (Math.sin(t / 30) > 0.2 ? 1 : 0.15) * (1 - u),
		(t, u) => ({ scaleX: 1 + 0.1 * strike(cycle(t, 160), 9) * (1 - u), scaleY: 1 - 0.06 * strike(cycle(t, 160), 9) * (1 - u) }),
	),
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
// 2026-09-27 halved this, as Deadwood's was; Deadwood's next review then
// doubled "Poor animations". 2026-10-01: restored to Deadwood's post-review
// floor — 15°, 10% of a cell, 15% of the symbol's size.
export const VISIBLE_FLOOR = {
	rotation: 0.26,
	offset: 0.1,
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
