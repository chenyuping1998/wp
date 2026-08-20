/**
 * Per-symbol LANDING motion.
 *
 * The companion of `symbolWinMotion.ts`, and the same bug one beat earlier.
 * Three reviewers rejected this game writing "poor animation". The win state was
 * fixed on 2026-08-19 by giving each symbol its own motion; landing was left
 * running ONE shared squash — `SymbolSprite` hammered every tile to 1.12/0.82,
 * rebounded, and settled, with nothing varying but the amplitude. So a boombox
 * dropping onto the grid and a letter J dropping onto the grid were the same
 * 240ms of motion at two sizes.
 *
 * Landing is seen far more often than winning: every symbol lands on every spin
 * and only a few of them ever win. If "all twelve move the same" is the thing
 * that reads as cheap, this is where a reviewer meets it first.
 *
 * ── Same contract as the win table ───────────────────────────────────────────
 *
 * Pure functions of `t` (ms since the symbol touched down), fractions of the
 * cell for offsets, no imports beyond the shared frame types — so
 * `design/check_symbol_motion.mjs` can load it in plain node and MEASURE that no
 * two of them are alike, rather than the repo asserting it.
 *
 * ── Landing is one-shot, and it must end ─────────────────────────────────────
 *
 * A win motion loops for as long as the cell is lit. A landing motion has to
 * arrive at rest by LAND_MS, because `ReelSymbol` flips the symbol to 'static'
 * on completion and any residual offset would snap away in one frame. Every
 * motion here therefore decays; `check_symbol_motion.mjs` asserts the last
 * sampled frame is at rest, which caught two of these mid-lean.
 *
 * ── Amplitude is not this table's job ────────────────────────────────────────
 *
 * `ReelSymbol` grades symbols by tier (Scatter 1.25 … royals 0.7) and
 * `SymbolSprite` multiplies every deviation from rest by it. These functions are
 * written at tier 1 and describe SHAPE only, which is also what the checker
 * compares. Weight and character are two different questions and they stay in
 * two different places.
 */

import type { SymbolWinFrame, SymbolWinOverlay } from './symbolWinMotion';

export type SymbolLandOverlay = SymbolWinOverlay;
export type SymbolLandFrame = SymbolWinFrame;

export type SymbolLandMotion = {
	/**
	 * This symbol turns through a large angle on arrival by design (the Scatter
	 * lands still spinning). Declared for the same reason as in the win table:
	 * the checker rejects big rotations as accidental tumbling, which is right
	 * for eleven of the twelve.
	 */
	spins?: boolean;
	/** `t` is milliseconds since touchdown. */
	frame: (t: number) => SymbolLandFrame;
};

/**
 * How long a landing takes. The old shared squash was 70+90+80 = 240ms of
 * tweens, and that budget is kept: reels stop in a cascade, so lengthening the
 * settle would push each reel's arrival into the next one's.
 */
export const LAND_MS = 240;

// ── helpers ──────────────────────────────────────────────────────────────────

/** Progress 0→1 across the landing, clamped so t past the end is at rest. */
const p = (t: number) => Math.max(0, Math.min(1, t / LAND_MS));

/** Decaying oscillation: a struck thing ringing down. `n` = half-cycles. */
const ring = (u: number, n: number, damp = 4.2) => Math.exp(-damp * u) * Math.sin(Math.PI * n * u);

/** One 0→1→0 hump over the first `width` of the landing, flat after. */
const hump = (u: number, width: number) => (u >= width ? 0 : Math.sin((Math.PI * u) / width));

/** Falls from 1 to 0 over the first `width`, flat after. */
const fade = (u: number, width: number) => (u >= width ? 0 : 1 - u / width);

const rest = (over: Partial<SymbolLandFrame> = {}): SymbolLandFrame => ({
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

/** Matches the win table's neon colours — the same four tubes lighting up. */
const NEON = {
	L1: 0xff3b8b, // A — pink
	L2: 0x66f6ff, // K — cyan
	L3: 0xffd166, // Q — yellow
	L4: 0xb08cff, // J — violet
} as const;

/**
 * A puff of dust under a heavy symbol. Sits behind the sprite at the cell's
 * floor and spreads as it fades, so weight reads from the ground rather than
 * from the sprite alone.
 */
const dust = (u: number, width: number, strength: number): SymbolLandOverlay[] =>
	u >= width
		? []
		: [-1, 1].map((side) => ({
				key: 'fxGlow',
				x: side * (0.16 + 0.3 * (u / width)),
				y: 0.34,
				width: 0.5 + 0.35 * (u / width),
				height: 0.24,
				rotation: 0,
				alpha: strength * (1 - u / width),
				tint: 0xffd9a8,
				behind: true,
			}));

// ── the table ────────────────────────────────────────────────────────────────

export const SYMBOL_LAND_MOTION: Record<string, SymbolLandMotion> = {
	// H1 — the guy. Lands on his feet and rocks BACK, one slow lean that returns.
	// Deliberately the least squashy arrival on the board: the squash was cut to
	// a quarter of its first draft because with it in, the checker scored H1
	// against H4 and W at 0.39 and 0.71 — three symbols all reading as "flat
	// impulse, decay". A symbol whose landing is led by ROTATION has to actually
	// be led by rotation.
	H1: {
		frame: (t) => {
			const u = p(t);
			const drop = Math.exp(-6 * u);
			// One smooth lean out and back, NOT a damped oscillation. H4 and W
			// both ring down on impact, and a third ringing symbol is a third copy
			// of the same idea however different its axis is — the checker had
			// H1/H4/W at 0.53-0.63 while every other pair was over 1.0. A single
			// swing that never overshoots is a different event: a man taking the
			// landing on his knees, not a struck object.
			return rest({
				scaleX: 1 + 0.03 * drop,
				scaleY: 1 - 0.035 * drop,
				rotation: -0.14 * hump(u, 0.9),
				dx: 0.035 * hump(u, 0.9),
				dy: 0.02 * hump(u, 0.55),
			});
		},
	},

	// H2 — the blonde. The other portrait symbol, so it is the pair most at risk
	// of reading as one motion: this one absorbs the landing SIDEWAYS, swaying
	// twice on the x axis where H1 rocks once on rotation.
	H2: {
		frame: (t) => {
			const u = p(t);
			const drop = Math.exp(-5 * u);
			return rest({
				scaleX: 1 + 0.07 * drop,
				scaleY: 1 - 0.08 * drop,
				dx: 0.055 * ring(u, 3, 3.6),
			});
		},
	},

	// H3 — flamingo. A bird does not thud, it alights: the body STRETCHES up as
	// the legs take the weight, the opposite of a squash, and drifts down after.
	H3: {
		frame: (t) => {
			const u = p(t);
			const lift = Math.exp(-5.5 * u);
			return rest({
				scaleX: 1 - 0.07 * lift,
				scaleY: 1 + 0.1 * lift,
				dy: -0.06 * lift + 0.03 * hump(u, 0.8),
				rotation: 0.03 * hump(u, 0.55),
			});
		},
	},

	// H4 — boombox. The heaviest thing on the board: a hard flat squash that
	// barely rebounds, a shudder along the case, and dust. It should look like it
	// was DROPPED, not placed.
	H4: {
		frame: (t) => {
			const u = p(t);
			// TWO thuds, not one — and the second nearly as hard as the first, at
			// 44% of the way through. Every other heavy symbol here is a single
			// impulse decaying away, and the checker scored H4 against H1 and W at
			// 0.39 and 0.47 for exactly that reason: one exponential looks like any
			// other exponential. A second hit is a TEMPORAL signature, which is the
			// only kind of difference this metric (deliberately) responds to —
			// three intermediate attempts that varied amplitude, damping and even
			// held the squash flat all scored WORSE, between 0.51 and 0.69. It is
			// also the right read for this symbol: it is the one that keeps a beat
			// when it wins.
			const thud = (from: number) => (u < from ? 0 : Math.exp(-13 * (u - from)));
			const slam = thud(0) + 0.85 * thud(0.44);
			return rest({
				scaleX: 1 + 0.15 * slam,
				scaleY: 1 - 0.16 * slam,
				dy: 0.05 * slam,
				dx: 0.012 * Math.exp(-7 * u) * Math.sin(u * 58),
				overlays: dust(u, 0.75, 0.5),
			});
		},
	},

	// H5 — the convertible. Suspension: it lands on its wheels and bounces TWICE
	// vertically, low frequency, with the body pitching nose-down and back.
	H5: {
		frame: (t) => {
			const u = p(t);
			// No dust, on purpose. It read fine, but it put a decaying overlay
			// alpha on the car in the same window as its win motion's speed
			// lines, and the cross-table check scored the two at 0.24 — the car
			// was landing the way it pays. Dust is now H4's alone, which also
			// makes it mean something: the one symbol heavy enough to raise it.
			return rest({
				scaleY: 1 - 0.08 * Math.exp(-6 * u),
				// Suspension, so it oscillates rather than decays: two full
				// compressions with the body pitching against them.
				dy: 0.07 * Math.abs(ring(u, 4, 2.2)),
				rotation: 0.055 * ring(u, 2, 2.4),
			});
		},
	},

	// L1-L4 — neon tubes. A tube slotting into the sign lights as it seats, so
	// the royals arrive by IGNITING. Four rhythms and four axes, same rule as the
	// win table: colour must not be the thing doing the distinguishing.

	// A — flicks on cleanly and lifts as it seats.
	L1: {
		frame: (t) => {
			const u = p(t);
			return rest({
				scaleY: 1 - 0.05 * Math.exp(-7 * u),
				dy: -0.03 * hump(u, 0.7),
				bloomAlpha: 0.8 * fade(u, 0.85),
				bloomTint: NEON.L1,
			});
		},
	},
	// K — a bad contact: it stutters on and jitters sideways while it does.
	L2: {
		frame: (t) => {
			const u = p(t);
			const flicker = u < 0.55 ? (Math.sin(u * 46) > 0 ? 1 : 0.15) : fade(u, 1);
			return rest({
				dx: 0.035 * Math.exp(-4 * u) * Math.sin(u * 40),
				bloomAlpha: 0.75 * flicker * fade(u, 1),
				bloomTint: NEON.L2,
			});
		},
	},
	// Q — no flicker: it warms up, and leans over as it does.
	L3: {
		frame: (t) => {
			const u = p(t);
			return rest({
				rotation: 0.07 * hump(u, 1),
				bloomAlpha: 0.7 * hump(u, 1),
				bloomTint: NEON.L3,
			});
		},
	},
	// J — the cheap tube: it buzzes in scale rather than moving anywhere.
	L4: {
		frame: (t) => {
			const u = p(t);
			const buzz = Math.exp(-4.5 * u) * Math.abs(Math.sin(u * 30));
			return rest({
				scaleX: 1 + 0.07 * buzz,
				scaleY: 1 - 0.06 * buzz,
				bloomAlpha: 0.7 * buzz,
				bloomTint: NEON.L4,
			});
		},
	},

	// W — the comic burst. Hits hardest, throws a shockwave RING outward along
	// the floor line and kicks in rotation. It is a drawn explosion; it arrives
	// like one.
	W: {
		frame: (t) => {
			const u = p(t);
			// A hard flat slam that FLATTENS the burst, where its win motion swells
			// it outward. Opposite signs on the same symbol, so a Wild that lands
			// and then pays reads as two events rather than one gesture played
			// twice; the cross-table check scored the first draft at 0.25 because
			// both of them expanded.
			const slam = Math.exp(-8 * u);
			// It squashes AND THEN OVERSHOOTS BACK PAST REST before settling —
			// classic squash-and-stretch, the thing a drawn cartoon object does
			// and a heavy real one does not. H4 is the heavy one and never
			// rebounds, and until this was added the two scored 0.51 against each
			// other: both were a single flat impulse decaying away, and the ring
			// and the dust were not enough to tell them apart.
			const rebound = u < 0.18 ? 0 : hump((u - 0.18) / 0.82, 1);
			return rest({
				scaleX: 1 + 0.2 * slam - 0.11 * rebound,
				scaleY: 1 - 0.2 * slam + 0.13 * rebound,
				dy: 0.06 * slam - 0.03 * rebound,
				// No rotation at all, which is unusual here and deliberate. Its win
				// motion wobbles fast on rotation while it swells, and with a
				// rotation ring on the landing too the two scored 0.56 against each
				// other — a Wild would have arrived doing a small version of its
				// payout. Landing is pure vertical squash-and-stretch; rotation is
				// reserved for the win.
				// A single wide ground FLASH, gone in the first third, rather than
				// the four rays this had at first. The rays are its win motion's
				// signature and they fade slowly over the whole 600ms hold; repeating
				// them on the landing put the same slow decay in the same channel in
				// both events, and no amount of changing what the sprite itself did
				// moved the cross-table score off 0.56. Rays are the payout; a flash
				// on the deck is the arrival.
				overlays:
					u >= 0.34
						? []
						: [
								{
									key: 'fxGlow',
									x: 0,
									y: 0.22,
									width: 0.7 + 1.5 * (u / 0.34),
									height: 0.3,
									rotation: 0,
									alpha: 0.85 * (1 - u / 0.34),
									tint: 0xffd166,
									behind: true,
								},
							],
			});
		},
	},

	// S — scatter. It arrives still TURNING and slows to a stop, which is the
	// only rotation of that size on the board and makes a scatter landing
	// recognisable before the eye has read the art. The anticipation build hangs
	// off scatters, so being able to spot one landing is worth a beat of its own.
	S: {
		spins: true,
		frame: (t) => {
			const u = p(t);
			// Tapered to exactly zero at u=1, not merely small: `ReelSymbol` flips
			// the symbol to 'static' the instant the landing completes, so a few
			// degrees of residual lean would snap away in one frame.
			const spin = Math.exp(-3.6 * u) * (1 - u);
			return rest({
				rotation: 1.9 * spin,
				scaleX: 1 + 0.1 * spin,
				scaleY: 1 + 0.1 * spin,
				overlays: [
					{
						key: 'fxGlow',
						x: 0,
						y: 0,
						width: 1.1 + 0.5 * spin,
						height: 1.1 + 0.5 * spin,
						rotation: 0,
						alpha: 0.45 * spin,
						tint: 0x4dffa6,
						behind: true,
					},
				],
			});
		},
	},

	// C — the Collector. Its mechanic is pulling things in, so it does not drop
	// onto the cell: it CONVERGES, arriving wide and thin and pinching to size
	// with stars falling inward. The only symbol here that gets narrower as it
	// settles rather than wider.
	C: {
		frame: (t) => {
			const u = p(t);
			// Isotropic: it arrives OVERSIZE and contracts evenly to the cell, like
			// something being drawn to a point. Its win motion is an anisotropic
			// pinch (narrow and tall), and the two scored 0.15 against each other
			// when landing used the pinch as well — the Collector was landing with
			// the exact gesture it pays with, which is the one cross-table failure
			// here that was a genuine design mistake rather than a metric artefact.
			const pull = Math.exp(-4.5 * u);
			return rest({
				scaleX: 1 + 0.14 * pull,
				scaleY: 1 + 0.14 * pull,
				rotation: -0.06 * pull,
				overlays:
					u >= 0.8
						? []
						: [0, 1, 2].map((i) => {
								const angle = (i / 3) * Math.PI * 2 + 0.7;
								const radius = 0.55 * (1 - u / 0.8);
								return {
									key: 'fxStar',
									x: Math.cos(angle) * radius,
									y: Math.sin(angle) * radius,
									width: 0.22 * (u / 0.8),
									height: 0.22 * (u / 0.8),
									rotation: angle,
									// Fades IN as it falls inward and is gone at contact, rather
									// than starting bright and decaying: a decaying overlay alpha
									// is what every other symbol's fx does, including this one's
									// own win sparks.
									alpha: 0.9 * hump(u / 0.8, 1),
									tint: 0xff8cf0,
									behind: true,
								};
							}),
			});
		},
	},
};

/**
 * Landing motion for a symbol name. Falls back to the old shared squash rather
 * than throwing — an unknown symbol should land plainly, not crash the reel.
 */
export const getSymbolLandMotion = (name: string): SymbolLandMotion =>
	SYMBOL_LAND_MOTION[name] ?? {
		frame: (t) => {
			const drop = Math.exp(-6 * p(t));
			return rest({ scaleX: 1 + 0.1 * drop, scaleY: 1 - 0.11 * drop });
		},
	};
