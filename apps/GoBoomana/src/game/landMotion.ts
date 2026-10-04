/**
 * Per-symbol LANDING motion (ported from DeadwoodExpress's symbolLandMotion,
 * 2026-09-28).
 *
 * Every symbol lands on every spin — far more often than any of them wins —
 * and all of them used to land with ONE shared squash (hammer to 1.12/0.82,
 * rebound, settle), varying only in amplitude. "All of them move the same" is
 * what three reviewers of Deadwood Express called "poor animation", and
 * landing is where a reviewer meets it first. So each symbol lands as the
 * THING it is:
 *
 *   H1 lantern   swings on its handle, the flame flaring
 *   H2 crystal   a glassy ting: it stretches UP, flashes cyan
 *   H3 picks     a metal clank: a fast side-to-side rattle
 *   H4 cart      the heaviest: two thuds, and dust
 *   L1..L5       stone slabs: flat, no rebound, grit — each tipping its own way
 *   W  miner     a nod, the headlamp flaring
 *   P  coin      flips over once as it lands, catching the light
 *   (B and S land as meshes — meshWin/landB.ts, landS.ts — and X, the empty
 *   hold-and-spin cell, keeps the plain squash.)
 *
 * The contract, as in Deadwood: pure functions of `t` (ms since touchdown),
 * cell fractions for offsets, no imports — design/check_idle_land.mjs loads this
 * in plain node and MEASURES that every motion ends at rest by LAND_MS and that
 * no two of them are the same motion. Amplitude is not this table's job:
 * SymbolSprite scales every deviation by the symbol's tier (`impact`).
 */

export type LandFrame = {
	sx: number;
	sy: number;
	/** radians */
	rot: number;
	/** cell fractions */
	dx: number;
	dy: number;
	/** additive copy of the art, 0..1, and its tint */
	bloom: number;
	bloomTint: number;
	/** dust at the cell's floor, 0..1, and its tint */
	dust: number;
	dustTint: number;
};

/** The old shared squash was 70+90+80 = 240ms; reels stop in a cascade, so the budget is kept. */
export const LAND_MS = 240;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** progress across the landing */
const p = (t: number) => clamp01(t / LAND_MS);
/** a struck thing ringing down; n = half-cycles */
const ring = (u: number, n: number, damp = 4.2) => Math.exp(-damp * u) * Math.sin(Math.PI * n * u);
/** 0 -> 1 -> 0 over the first `w` of the landing */
const hump = (u: number, w: number) => (u >= w ? 0 : Math.sin((Math.PI * u) / w));
/** 1 -> 0 over the first `w` */
const fade = (u: number, w: number) => (u >= w ? 0 : 1 - u / w);

export const REST: LandFrame = { sx: 1, sy: 1, rot: 0, dx: 0, dy: 0, bloom: 0, bloomTint: 0xffffff, dust: 0, dustTint: 0xffffff };
const rest = (over: Partial<LandFrame>): LandFrame => ({ ...REST, ...over });

const STONE = 0xc9bfae;

// the stone letters share a body and differ in which way each slab tips
const slab = (tip: number) => (t: number) => {
	const u = p(t);
	const drop = Math.exp(-9 * u);
	return rest({
		// lighter than the cart's squash, and every slab TIPS — a slab that only
		// squashed was the cart's first thud again (the gate had H4/L5 at 0.13)
		sx: 1 + 0.08 * drop,
		sy: 1 - 0.1 * drop,
		dy: 0.02 * drop,
		rot: tip * 0.065 * hump(u, 0.7),
		dust: 0.35 * fade(u, 0.7),
		dustTint: STONE,
	});
};

// the plain squash, for anything not in the table
const plain = (t: number) => {
	const u = p(t);
	return rest({
		sx: 1 + 0.12 * Math.exp(-7 * u) * Math.cos(Math.PI * 1.5 * u),
		sy: 1 - 0.18 * Math.exp(-7 * u) * Math.cos(Math.PI * 1.5 * u),
	});
};

const TABLE: Record<string, (t: number) => LandFrame> = {
	// the lantern hangs from its handle: it SWINGS, twice, and the flame flares
	H1: (t) => {
		const u = p(t);
		const drop = Math.exp(-7 * u);
		return rest({
			sx: 1 + 0.03 * drop,
			sy: 1 - 0.035 * drop,
			// ONE slow swing out and back, big, like a lamp on a hook — a faster,
			// smaller one was the picks' rattle again (the gate had H1/H3 at 0.13)
			rot: 0.15 * ring(u, 2, 2.4),
			dx: 0.03 * ring(u, 2, 2.4),
			bloom: 0.4 * fade(u, 0.55),
			bloomTint: 0xffa640,
		});
	},
	// glass does not thud, it rings: a stretch UP, a cyan flash
	H2: (t) => {
		const u = p(t);
		const lift = Math.exp(-6 * u);
		return rest({
			sx: 1 - 0.06 * lift,
			sy: 1 + 0.09 * lift,
			dy: -0.035 * lift,
			bloom: 0.5 * fade(u, 0.45),
			bloomTint: 0x7fe8ff,
		});
	},
	// steel on stone: a fast rattle side to side
	H3: (t) => {
		const u = p(t);
		const drop = Math.exp(-8 * u);
		return rest({
			sx: 1 + 0.05 * drop,
			sy: 1 - 0.06 * drop,
			dx: 0.07 * ring(u, 7, 3.4),
			rot: 0.015 * ring(u, 7, 4),
		});
	},
	// the cart is the heaviest thing on the board: TWO thuds, the second nearly
	// as hard as the first — a load settling — and dust
	H4: (t) => {
		const u = p(t);
		const thud = (from: number) => (u < from ? 0 : Math.exp(-13 * (u - from)));
		const slam = thud(0) + 0.8 * thud(0.42);
		return rest({
			sx: 1 + 0.13 * slam,
			sy: 1 - 0.14 * slam,
			dy: 0.045 * slam,
			dust: 0.5 * fade(u, 0.75),
			dustTint: 0xd9b98a,
		});
	},
	L1: slab(1),
	L2: slab(-1),
	L3: slab(0.75),
	L4: slab(-0.75),
	L5: slab(0.9),
	// the miner nods on landing and the headlamp flares
	W: (t) => {
		const u = p(t);
		const drop = Math.exp(-8 * u);
		return rest({
			// a double nod: down, a little up past rest, down, settle — a sink
			// with a tip was a stone slab's landing again (the gate had L3/W at 0.14)
			sx: 1 + 0.04 * drop,
			sy: 1 - 0.04 * drop,
			dy: 0.09 * ring(u, 3, 2.8),
			bloom: 0.45 * fade(u, 0.5),
			bloomTint: 0xfff0b0,
		});
	},
	// the coin flips once as it lands (its width through zero and back), and
	// catches the light at the turn
	P: (t) => {
		const u = p(t);
		const turn = clamp01(u / 0.8);
		return rest({
			sx: Math.cos(2 * Math.PI * turn),
			sy: 1 + 0.04 * hump(u, 0.8),
			bloom: 0.35 * hump(u, 0.8),
			bloomTint: 0xffd75e,
		});
	},
};

// every deviation is blended out over the last fifth, so a symbol is EXACTLY at
// rest when the landing reports complete and the sprite goes static
const settle = (f: LandFrame, u: number): LandFrame => {
	const k = 1 - clamp01((u - 0.8) / 0.2);
	const e = k * k * (3 - 2 * k);
	return {
		...f,
		sx: 1 + (f.sx - 1) * e,
		sy: 1 + (f.sy - 1) * e,
		rot: f.rot * e,
		dx: f.dx * e,
		dy: f.dy * e,
		bloom: f.bloom * e,
		dust: f.dust * e,
	};
};

/** The landing frame for `symbol` at `t` ms after touchdown, at tier 1. */
export const landFrame = (symbol: string, t: number): LandFrame => settle((TABLE[symbol] ?? plain)(t), p(t));

/** the symbols with their own landing (for the gate) */
export const LAND_SYMBOLS = Object.keys(TABLE);
