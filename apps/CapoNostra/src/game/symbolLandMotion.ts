/**
 * Per-symbol LANDING motion.
 *
 * The companion of `symbolWinMotion.ts`, and the same bug one beat earlier.
 * Three reviewers rejected this game writing "poor animation". The win state was
 * fixed on 2026-08-19 by giving each symbol its own motion; landing was left
 * running ONE shared squash — `SymbolSprite` hammered every tile to 1.12/0.82,
 * rebounded, and settled, with nothing varying but the amplitude. So a
 * briefcase dropping onto the grid and a card-suit chip dropping onto the grid
 * were the same 240ms of motion at two sizes.
 *
 * ── And the same reskin trap as the win table ────────────────────────────────
 *
 * On 2026-09-07 four of these blocks were still byte-identical to Hot Miami's,
 * describing a flamingo alighting and a boombox being dropped on a board that
 * now draws a briefcase and a whiskey glass. `check_symbol_motion.mjs` compares
 * each symbol's block against the sibling app's block for the SAME symbol key,
 * so that cannot pass again.
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
 * `ReelSymbol` grades symbols by tier (Scatter 1.25 … the lows 0.7) and
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

/** Ramps 0→1 between `at` and `at + width`, flat either side. */
const step = (u: number, at: number, width: number) =>
	u <= at ? 0 : u >= at + width ? 1 : (u - at) / width;

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

/** Matches the win table's sheen colours — the same four chips catching light. */
const SHEEN = {
	// Kept in step with symbolWinMotion.ts — see the note there.
	L1: 0xcfd6dc, // Spade  — silver
	L2: 0xc9484f, // Heart  — wine
	L3: 0xd8705f, // Diamond — warm copper-red
	L4: 0xa9b2b9, // Club   — dimmer silver
} as const;

/**
 * A puff of dust under a heavy symbol. Sits behind the sprite at the cell's
 * floor and spreads as it fades, so weight reads from the ground rather than
 * from the sprite alone.
 *
 * It RISES and then falls rather than starting at full and decaying, which is
 * both what dust does — it is thrown up by the impact, it does not exist before
 * it — and the last thing that separated this landing from the Wild's ground
 * flash. Two overlays both decaying from maximum are the same channel however
 * different the sprites under them are; the checker had them at 0.83, and this
 * put them at 0.92.
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
				alpha: strength * hump(u / width, 1),
				tint: 0xffd9a8,
				behind: true,
			}));

// ── the table ────────────────────────────────────────────────────────────────

const BASE_LAND_MOTION: Record<string, SymbolLandMotion> = {
	// H1 — the signet ring. Solid gold, and a ring dropped on a table lands on
	// its band and TIPS over onto its face: one decisive swing that arrives and
	// stays, never an oscillation. The gold flashes as the crest comes square to
	// the light, which is the only thing on this board that is heavy and shiny at
	// the same time.
	//
	// Deliberately the least squashy arrival on the board: the squash was cut to
	// a quarter of its first draft because with it in, the checker scored H1
	// against H4 and W at 0.39 and 0.71 — three symbols all reading as "flat
	// impulse, decay". A symbol whose landing is led by ROTATION has to actually
	// be led by rotation. Gold barely deforms anyway, which is the same answer
	// arrived at from the material rather than from the metric.
	H1: {
		frame: (t) => {
			const u = p(t);
			const drop = Math.exp(-6 * u);
			// Fast out, slow back — NOT the symmetric hump this used to be. A ring
			// tipping over goes past the balance point quickly and then lowers
			// itself the rest of the way; a symmetric swing is a pendulum, which is
			// a hanging object, not a falling one.
			//
			// It is also not a damped oscillation: H4 and W both ring down on
			// impact, and a third ringing symbol is a third copy of the same idea
			// however different its axis is — the checker had H1/H4/W at 0.53-0.63
			// while every other pair was over 1.0.
			const tip =
				u < 0.25 ? Math.sin((Math.PI / 2) * (u / 0.25)) : Math.cos((Math.PI / 2) * ((u - 0.25) / 0.75));
			return rest({
				// Gold barely deforms. The squash is a hint, not a gesture.
				scaleX: 1 + 0.025 * drop,
				scaleY: 1 - 0.03 * drop,
				rotation: -0.15 * tip,
				// A ring does not slide across the table; it settles onto its own
				// footprint. Most of the old dx is gone and what is left is the
				// centre of mass moving as the band goes over.
				dx: 0.018 * tip,
				dy: 0.026 * tip,
				// The crest catching the key light as the face comes square — which
				// is late, well after the impact. Gone before the landing ends, so
				// nothing snaps when the symbol goes static.
				bloomAlpha: 0.6 * hump(u, 0.92),
				bloomTint: 0xe8d48b,
			});
		},
	},

	// H2 — the skyline. A city block does not bounce and it does not sway: it is
	// PLANTED. One hard vertical arrival with effectively no rebound — the most
	// inert landing on the board — and then the light on it comes up in steps,
	// which is where all its life goes. The staircase of light after a dead stop
	// is its signature; nothing else here separates its impact from its reaction
	// like that.
	//
	// The steps brighten the whole sprite (an additive copy of its own art), not
	// individual windows — see the note on H2 in symbolWinMotion.ts.
	H2: {
		frame: (t) => {
			const u = p(t);
			// Almost instantaneous: concrete does not absorb, it stops. At -18 the
			// impact is over inside 40ms and everything the player sees after that
			// is light. That extreme is deliberate — at a softer -9 this landing
			// was a vertical impulse with a glow on it, which is also what the spade
			// chip is, and the checker scored the two at 0.68.
			const plant = Math.exp(-18 * u);
			// THREE tiers this time, further apart, so the staircase is the shape of
			// the trace rather than a detail on the end of an impulse. It has to
			// reach zero by the end: the symbol goes static the instant the landing
			// completes.
			const lights =
				((step(u, 0.16, 0.04) + step(u, 0.38, 0.04) + step(u, 0.58, 0.04)) / 3) * fade(u, 1);
			return rest({
				scaleY: 1 - 0.05 * plant,
				scaleX: 1 + 0.02 * plant,
				dy: 0.045 * plant,
				bloomAlpha: 0.85 * lights,
				bloomTint: 0xffc46b,
			});
		},
	},

	// H3 — the briefcase, and the heaviest thing on the board now that the
	// whiskey glass took the beat: a case packed with cash, dropped not placed. A
	// hard flat squash, dust off the deck, and then the LID JARS — a secondary
	// rebound that goes the other way, the case bouncing itself part-open before
	// falling shut. Dust is this symbol's alone, which is what makes it mean
	// something: the one symbol heavy enough to raise it.
	H3: {
		frame: (t) => {
			const u = p(t);
			// THREE impacts, not one: the case hits, the lid slaps shut behind it,
			// and the loose latch rattles once more. Each is shorter and lighter
			// than the last, and none of them rebounds past rest.
			//
			// The train is the whole reason this landing is distinguishable. A
			// single exponential looks like every other single exponential — the
			// first draft of this block was one slam with a soft rebound and the
			// checker scored it 0.34 against the Wild, which is the same event with
			// a different sprite in it. Adding a rotation axis the Wild does not use
			// at all moved that score by 0.00: the metric z-scores against pooled
			// statistics, and with a spinning Scatter in the pool a 4-degree lean is
			// numerically nothing. Only the time structure moves it, which is also
			// the thing a player actually hears in a landing.
			const thud = (from: number, decay: number) =>
				u < from ? 0 : Math.exp(-decay * (u - from));
			const slam = thud(0, 13) + 0.7 * thud(0.34, 16) + 0.35 * thud(0.62, 20);
			return rest({
				scaleX: 1 + 0.14 * slam,
				scaleY: 1 - 0.15 * slam,
				dy: 0.05 * slam,
				// It arrives CORNER-FIRST and rocks flat. That rotation is the axis
				// the Wild's landing does not use at all (its comment there explains
				// why it has none), and it is what finally separated the two: a
				// briefcase is a slab that lands on an edge, an explosion is not.
				rotation: -0.075 * (1 - u) * Math.exp(-5 * u),
				dx: 0.012 * Math.exp(-7 * u) * Math.sin(u * 58),
				overlays: dust(u, 0.75, 0.5),
			});
		},
	},

	// H4 — the whiskey glass. The only thing on the board that is SET DOWN
	// rather than dropped: a short firm contact on the base, and then the liquid
	// keeps going and finds its level, tilting the read of the glass back and
	// forth as it damps out. Light impact, long settle — the exact inverse of
	// H3's heavy impact and quick settle, which is the pair this used to be
	// confused with while it was still a boombox's landing, thudding twice.
	H4: {
		frame: (t) => {
			const u = p(t);
			// The glass is down almost immediately — a hand places it, it does not
			// fall — and the impact is deliberately the SMALLEST thing in this
			// block. What the player sees for the rest of the landing is what is
			// still moving inside it, which is why both rings are lightly damped
			// and are still visibly swinging at the end of the window. At a heavier
			// damping the trace was an impulse decaying away, which is what every
			// dropped object here is, and the checker scored it 0.86 against the
			// Wild. Both rings taper to exactly zero at u=1 regardless.
			const contact = Math.exp(-16 * u);
			const level = ring(u, 3, 1.6);
			return rest({
				scaleX: 1 + 0.03 * contact,
				scaleY: 1 - 0.035 * contact,
				rotation: 0.055 * level,
				dx: 0.035 * ring(u, 2, 1.4),
				dy: 0.012 * contact,
			});
		},
	},

	// H5 — the black sedan. Suspension: it lands on its wheels and bounces TWICE
	// vertically, low frequency, with the body pitching nose-down and back. This
	// is the one landing the reskin did not have to replace — the symbol it was
	// written for was also a car — but it is retuned for a 1930s saloon: a tall
	// heavy body on soft springs takes longer to stop moving than a low
	// convertible, so the damping is slacker and the pitch is wider.
	H5: {
		frame: (t) => {
			const u = p(t);
			// No dust, on purpose. It read fine, but it put a decaying overlay
			// alpha on the car in the same window as its win motion's speed
			// lines, and the cross-table check scored the two at 0.24 — the car
			// was landing the way it pays. Dust belongs to H3 alone.
			// A saloon is TALL and softly sprung, so it does not land as one rigid
			// piece the way the convertible did: the wheels stop first and the body
			// keeps going. The vertical bounce and the body's own compression
			// therefore run at different rates and out of phase, and the pitch is a
			// third rate again. Three loosely coupled oscillators is what heavy
			// bodywork on soft springs looks like; one is what a go-kart looks like.
			const wheels = Math.abs(ring(u, 4, 1.9));
			const body = ring(u, 3, 1.6);
			return rest({
				scaleY: 1 - 0.07 * Math.exp(-4.5 * u) + 0.028 * body,
				scaleX: 1 + 0.02 * Math.exp(-4.5 * u),
				dy: 0.07 * wheels,
				rotation: 0.065 * ring(u, 2, 1.8),
				dx: 0.018 * ring(u, 2, 4),
			});
		},
	},

	// L1-L4 — struck-metal chips. A chip dropped on a table taps, settles and
	// catches the light off its engraving; it does not ignite, which is what
	// these did for as long as this table still held neon letters. Four rhythms and
	// four axes, same rule as the win table: colour must not be the thing doing
	// the distinguishing.

	// Spade — dropped flat onto the felt, which is what a chip does: it TAPS
	// TWICE, the second close behind the first and much lighter, and the sheen
	// crosses the engraving as it comes to rest rather than being brightest at
	// the moment of impact.
	L1: {
		frame: (t) => {
			const u = p(t);
			const tap = Math.exp(-9 * u) + 0.4 * (u < 0.28 ? 0 : Math.exp(-15 * (u - 0.28)));
			return rest({
				scaleX: 1 + 0.03 * tap,
				scaleY: 1 - 0.055 * tap,
				dy: 0.032 * tap,
				// The sheen flashes ON EACH TAP rather than swelling smoothly across
				// the landing: the chip catches the light because it is being
				// knocked, so the brightest channel and the impact channel are the
				// same event twice. A smooth swell here scored 0.73 against the
				// skyline's window staircase — two glows rising over a dead impulse.
				bloomAlpha: 0.75 * Math.min(1, tap),
				bloomTint: SHEEN.L1,
			});
		},
	},
	// Heart — thrown in rather than dropped: it SKIDS sideways across the felt,
	// the highlight chattering across the engraving as it slides, and stops.
	L2: {
		frame: (t) => {
			const u = p(t);
			// A SLIDE that decelerates, with a chatter riding on it — not the
			// symmetric sideways oscillation this used to be. A thrown chip arrives
			// already travelling and loses the travel to friction; it does not
			// wobble about a point it was never at.
			const slide = (1 - u) * Math.exp(-2.6 * u);
			const chatter = Math.exp(-7 * u) * Math.sin(u * 33);
			return rest({
				dx: 0.06 * slide + 0.012 * chatter,
				rotation: -0.05 * slide,
				// The light moves because the chip is moving under it, so the sheen
				// is modulated by the chatter rather than by a clock.
				bloomAlpha: 0.7 * (0.4 + 0.6 * Math.abs(chatter)) * fade(u, 1),
				bloomTint: SHEEN.L2,
			});
		},
	},
	// Diamond — lands on its edge, ROLLS a little and tips flat, so the face
	// swings square to the light and the sheen builds with it rather than
	// arriving all at once.
	L3: {
		frame: (t) => {
			const u = p(t);
			// It ARRIVES tilted and lowers itself flat, ending with no angular
			// velocity at all — a chip finishing a roll. The block this replaced
			// leant out and came back, which is a different event: something
			// standing still that was nudged.
			const flatten = (1 - u) * (1 - u);
			return rest({
				rotation: 0.16 * flatten,
				dx: -0.028 * flatten,
				// The face only catches the light once it is square, so the sheen
				// builds as the lean unwinds and is gone by the end.
				bloomAlpha: 0.7 * step(u, 0.3, 0.35) * fade(u, 1),
				bloomTint: SHEEN.L3,
			});
		},
	},
	// Club — the one that CLATTERS: it rings down in scale, going nowhere, with
	// the sheen beating in step with the ring.
	L4: {
		frame: (t) => {
			const u = p(t);
			// Faster and shorter-lived than the buzz it replaces: a chip landing on
			// its edge clatters flat in a hurry and is then completely still, where
			// a failing neon tube buzzes on and on.
			const clatter = Math.exp(-6.5 * u) * Math.abs(Math.sin(u * 41));
			return rest({
				scaleX: 1 + 0.085 * clatter,
				scaleY: 1 - 0.075 * clatter,
				dx: 0.014 * Math.exp(-6.5 * u) * Math.sin(u * 41),
				bloomAlpha: 0.72 * clatter,
				bloomTint: SHEEN.L4,
			});
		},
	},

	// W — the fedora. Its curved brim ROCKS SIDE TO SIDE on the felt rather
	// than pitching forward-back or slamming flat — no net travel, no
	// rotation (H3's comment above explains why that axis belongs to the
	// briefcase alone), just a symmetric lateral rock decaying to a dead
	// stop, the way a bowl-shaped object settles. The gold band catches the
	// light at each side of the rock rather than in one flash at impact.
	// 2026-09-07: this used to slam and ring like a comic explosion arriving;
	// the first replacement (vertical squash + a small rotation) scored too
	// close to H2's plant-and-glow and H3's corner rock — dx-only, no
	// rotation, no net drift is what's left unclaimed on this board.
	W: {
		frame: (t) => {
			const u = p(t);
			// A pure decaying lateral oscillation — no exponential "plant" pulse at
			// all, which is what kept this out of H2's family (H2 is a single fast
			// decay on scale). Three visible rocks, tightening as they die out.
			const rock = Math.exp(-5 * u) * Math.sin(u * Math.PI * 6);
			return rest({
				dx: 0.05 * rock,
				scaleX: 1 - 0.02 * Math.abs(rock),
				bloomAlpha: 0.55 * Math.abs(rock),
				bloomTint: 0xffd166,
				overlays: [
					{
						key: 'fxStreak',
						x: 0,
						y: 0.06,
						width: 0.7,
						height: 0.09,
						rotation: 0,
						alpha: 0.45 * Math.abs(rock),
						tint: 0xffd166,
						behind: false,
					},
				],
			});
		},
	},

	// S — the vault door. It arrives still TURNING and slows to a stop, same
	// idea as before — the only rotation of that size on the board, so a
	// scatter landing is recognisable before the eye has read the art — but
	// the shape and colour are now the wheel catching, not a starburst: a
	// metal glint sweeps with it rather than a round halo, and the light is
	// the amber already painted at the door's hinge (fs.png), not green/cyan.
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
				scaleX: 1 + 0.07 * spin,
				scaleY: 1 + 0.07 * spin,
				bloomAlpha: 0.3 * spin,
				bloomTint: 0xffb347,
				overlays: [
					{
						key: 'fxStreak',
						x: 0,
						y: 0,
						width: 0.9 + 0.3 * spin,
						height: 0.07,
						rotation: 1.9 * spin,
						alpha: 0.5 * spin,
						tint: 0xe3d9c6,
						behind: true,
					},
				],
			});
		},
	},

	// SW — the Tommy Gun. It lands HARD and settles, rather than converging:
	// it arrives undersized and snaps out to the cell with a kick, which is the
	// gesture of something being racked. The Collector this replaced arrived
	// oversize and contracted, because its mechanic was pulling things in.
	SW: {
		frame: (t) => {
			const u = p(t);
			// Isotropic, and UNDER-sized rather than over: it snaps up to the cell
			// instead of shrinking down onto it. Its win motion is an anisotropic
			// vertical stretch, so landing must not use that same gesture — a
			// symbol that lands with the exact motion it pays with gives the win
			// nothing of its own to say.
			const snap = Math.exp(-4.5 * u);
			return rest({
				scaleX: 1 - 0.12 * snap,
				scaleY: 1 - 0.12 * snap,
				rotation: 0.05 * snap,
				overlays:
					u >= 0.8
						? []
						: [0, 1, 2].map((i) => {
								// Shell casings kicked out sideways and down as it racks,
								// rather than sparks falling inward. `i - 1` spreads them
								// left / centre / right.
								const lane = i - 1;
								const spread = u / 0.8;
								return {
									key: 'fxStar',
									x: lane * 0.5 * spread,
									y: 0.45 * spread * spread,
									width: 0.16 * (1 - spread),
									height: 0.16 * (1 - spread),
									rotation: lane * 1.2 * spread,
									// Fades in on the kick and is gone by the time the symbol
									// settles, rather than starting bright and decaying.
									alpha: 0.9 * hump(spread, 1),
									tint: 0xc1272d,
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
/**
 * The landing floor. Same idea as the win table's — see `VISIBLE_FLOOR` in
 * symbolWinMotion.ts for the argument — and a little lower on every channel,
 * because a landing has 240ms to happen in AND to be back at rest by the end of
 * it. At the win table's floor H1's lean reaches 26 degrees and has to unwind
 * inside a quarter of a second, which reads as a snap rather than as weight.
 */
export const LAND_FLOOR = {
	/** ~11.5 degrees */
	rotation: 0.2,
	/** cell fractions: 0.085 is ~10px */
	offset: 0.085,
	scale: 0.14,
};

/**
 * A local copy of `boostToFloor` from symbolWinMotion.ts, deliberately
 * duplicated.
 *
 * A VALUE import would have to be written `'./symbolWinMotion.ts'` with the
 * extension for a bare `node --experimental-strip-types` to resolve it, and
 * being loadable by bare node is the whole reason this file imports nothing
 * (see the header): it is what lets `design/check_symbol_motion.mjs` measure the
 * shipped table rather than a re-implementation of it. Twenty lines of
 * duplication is cheaper than making the gate unable to run.
 */
const MAX_GAIN = 4;
const RELEVANT = 0.15;
const CEILING = 2;
const MARGIN = 1.03;
const BOUNDS = { rotation: 0.55, offset: 0.22, scale: 0.5 };

const boostToFloor = (motion: SymbolLandMotion, windowMs: number): SymbolLandMotion => {
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
	if (!motion.spins) consider(peakRotation, LAND_FLOOR.rotation, BOUNDS.rotation);
	consider(peakOffset, LAND_FLOOR.offset, BOUNDS.offset);
	consider(peakScale, LAND_FLOOR.scale, BOUNDS.scale);
	if (!wanted.length) return motion;

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

export const SYMBOL_LAND_MOTION: Record<string, SymbolLandMotion> = Object.fromEntries(
	Object.entries(BASE_LAND_MOTION).map(([name, motion]) => [name, boostToFloor(motion, LAND_MS)]),
);

export const getSymbolLandMotion = (name: string): SymbolLandMotion =>
	SYMBOL_LAND_MOTION[name] ?? {
		frame: (t) => {
			const drop = Math.exp(-6 * p(t));
			return rest({ scaleX: 1 + 0.1 * drop, scaleY: 1 - 0.11 * drop });
		},
	};
