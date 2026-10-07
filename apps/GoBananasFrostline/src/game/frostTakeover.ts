/**
 * The freeze takeover: a Wild lands in the free game, frost creeps over its
 * reel, the reel freezes solid, and the ice clarifies into the full-reel WILD.
 *
 * This is version TWO of that moment. Version one — a Wild "infecting" the reel
 * cell by cell, the five Wilds then being pulled into the middle and slammed
 * into a banner — is still in ExpandingWilds.svelte and still reachable; see
 * TAKEOVER there. Nothing in this file is used by it.
 *
 * ── Why the numbers live here ────────────────────────────────────────────────
 *
 * Same argument as anticipationFocus.ts. This is a three-beat animation whose
 * whole job is to read as ONE continuous process — water cooling, then setting,
 * then going clear — and the ways that quietly break are all arithmetic:
 *
 *   · a cell that ends the frost beat at 0.97 instead of 1, so the reel never
 *     quite finishes freezing and the slab arrives over a half-frosted cell
 *   · a crystal that grows and then shrinks back because its growth curve was
 *     not monotonic
 *   · a beat that leaves something mid-flight when the next one starts
 *
 * None of those are visible in a screenshot and all of them are visible in a
 * loop. As pure functions they can be measured, and
 * `design/check_frost_takeover.mjs` measures them.
 *
 * No imports, so a plain node script can load this.
 */

/** Beat lengths in ms. Deliberately slower than v1's 840/460 — "慢慢結霜". */
export const FROST_TIMING = {
	/** frost creeps out of the landed Wild and covers the reel */
	frostMs: 1150,
	/** the frost sets: a slab of ice takes the whole reel, and cracks */
	freezeMs: 560,
	/** the ice goes clear and the WILD panel is what is left */
	clarifyMs: 300,
} as const;

/** Clamped 0→1. */
const p = (t: number, ms: number) => Math.max(0, Math.min(1, t / ms));
const easeOut = (u: number) => 1 - (1 - u) ** 2.2;
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);

/**
 * How far the frost front has travelled, 0→1, as a fraction of the reel's
 * half-height measured from the landed cell.
 *
 * Fast off the mark and then slowing: frost spreads quickest over the surface it
 * is already touching. A linear front reads as a wipe, which is a transition
 * effect rather than something growing.
 */
export const frostFront = (t: number) => easeOut(p(t, FROST_TIMING.frostMs));

/**
 * How frosted one cell is, 0→1.
 *
 * `distance` is how many cells it sits from the landed one, `span` the furthest
 * any cell is. A cell starts frosting when the front reaches it and takes
 * `CELL_FROST_FRACTION` of the whole beat to finish — so the reel is always
 * partly frosted rather than switching cell by cell, which is what separates
 * this from v1's infect.
 *
 * Guaranteed to reach exactly 1 by the end of the beat for every cell, which is
 * the property the gate cares about most: the slab must never arrive over a cell
 * that is still clear.
 */
export const CELL_FROST_FRACTION = 0.42;
export const cellFrost = (t: number, distance: number, span: number) => {
	const front = frostFront(t);
	// where in the beat this cell's own frosting begins, 0..1
	const start = span <= 0 ? 0 : (distance / span) * (1 - CELL_FROST_FRACTION);
	if (front <= start) return 0;
	return Math.min(1, (front - start) / CELL_FROST_FRACTION);
};

/**
 * One frost crystal: a six-armed dendrite growing on the cell's surface.
 *
 * `arm` is how far the arms have grown (0→1 of their full length), `barb` how
 * far the side barbs have come out, `alpha` its opacity. The barbs deliberately
 * LAG the arms — a dendrite grows outward first and fills in after, and starting
 * both together makes it read as a snowflake stamp fading in rather than as ice
 * forming.
 */
export const crystalGrowth = (u: number) => {
	const g = Math.max(0, Math.min(1, u));
	return {
		arm: easeOut(g),
		// nothing until the arm is a third out, then it catches up
		barb: g <= 0.34 ? 0 : easeOut((g - 0.34) / 0.66),
		alpha: Math.min(1, g * 2.4),
	};
};

/**
 * Deterministic crystal seeds for one cell.
 *
 * Deterministic and not random: a reel that frosts differently every time reads
 * as noise, and it also makes the effect impossible to judge when tuning it.
 * Three per cell at different sizes, offsets and rotations, each starting at its
 * own point in the cell's own frosting.
 */
export const CRYSTALS_PER_CELL = 6;
export const crystalSeed = (cellIndex: number, i: number) => {
	const h = (n: number) => {
		const v = Math.sin((cellIndex * 37.3 + i * 12.9898 + n * 4.1) * 1.0) * 43758.5453;
		return v - Math.floor(v);
	};
	return {
		/** offset from the cell centre, in cell fractions */
		dx: (h(1) - 0.5) * 0.7,
		dy: (h(2) - 0.5) * 0.7,
		/**
		 * Radius in cell fractions.
		 *
		 * SMALL, and more of them. The first pass put three crystals per cell at
		 * 0.13-0.29 of the cell — an offline filmstrip showed exactly what that is:
		 * three big snowflake STICKERS sitting on each symbol, one per corner,
		 * which is a decal and not frost. Six at a third of the size read as a
		 * surface icing over.
		 */
		radius: 0.055 + h(3) * 0.075,
		rotation: h(4) * Math.PI,
		/** fraction of the cell's frosting elapsed before this one starts */
		delay: i * 0.09 + h(5) * 0.1,
	};
};

/**
 * Rime along the cell's edges — the fine spiky crust that forms on a rim before
 * the middle of a surface ices over. `depth` is how far it reaches in from the
 * edge, in cell fractions.
 *
 * Leads the crystals: at a third of the way through a cell's frosting the rim is
 * already furred and the middle is still clear.
 */
export const rimeAt = (cellFrostAmount: number) => {
	const f = Math.max(0, Math.min(1, cellFrostAmount));
	return {
		// Shallower than the first pass (0.16). At that depth, with evenly spaced
		// spikes, the crust rendered as a row of tick marks round every cell — a
		// ruler, not frost. The irregularity that fixes it is in the component's
		// spike placement; this just stops it reaching so far in.
		depth: 0.1 * easeOut(Math.min(1, f * 1.6)),
		alpha: Math.min(1, f * 2.2) * 0.75,
	};
};

/**
 * The slab: what the freeze beat draws over the whole reel once the frost has
 * finished.
 *
 * `haze` is the milky body of the ice, `rim` the lit edge round it, `striation`
 * how pronounced the vertical flow lines are, and `crack` a one-frame-ish white
 * flash at the moment it sets.
 *
 * The crack is placed at 0.46 rather than at the end on purpose: the sound and
 * the board shake fire with it, and a snap that lands after the ice has already
 * stopped moving reads as an unrelated noise.
 */
export const CRACK_AT = 0.46;
export const slabAt = (t: number) => {
	const u = p(t, FROST_TIMING.freezeMs);
	const set = easeInOut(u);
	return {
		// 0.72 rather than 0.82: at the higher value the set slab was a flat pale
		// panel and the frost that formed under it was gone. Ice you can still see
		// the crystals in is what says the reel FROZE, rather than that something
		// white was laid over it.
		haze: 0.72 * set,
		rim: 0.35 + 0.65 * set,
		// sharpest just as it sets, then settling as the ice clarifies
		striation: Math.sin(Math.min(1, u / CRACK_AT) * Math.PI * 0.5) * (1 - 0.25 * u),
		crack: u < CRACK_AT ? 0 : Math.max(0, 1 - (u - CRACK_AT) / 0.22) ** 2,
	};
};

/**
 * The clarify beat: the milky ice goes clear and hands the reel to the WILD
 * panel underneath it.
 *
 * Returns the slab's remaining opacity. Ends at exactly 0 — if it did not, every
 * locked reel would keep a permanent film over its panel for the rest of the
 * feature, which is the kind of thing that is only noticeable once fifteen free
 * spins have gone by.
 */
export const clarifyAt = (t: number) => 1 - easeInOut(p(t, FROST_TIMING.clarifyMs));
