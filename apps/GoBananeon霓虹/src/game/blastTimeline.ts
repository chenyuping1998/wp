/**
 * THE PULSE BOMB'S TIMELINE, shared by ReelBlast.svelte (the Graphics: the
 * void, the bolts, the scanlines) and BlastFx.svelte (the sprites: the real-art
 * shards, the soft plasma pillar, the source lock and the copies). Both read
 * the same clock, so they must agree on where each beat is; the numbers live
 * here once.
 *
 * Pure: no pixi, no svelte.
 */

export const CHARGE_MS = 380;

/** how long a copy of the fill takes to fly from its source cell */
export const COPY_FLIGHT_MS = 220;
/** the column's flash starts this long after its last copy lands: the cell's
 *  own landing (landMotion LAND_MS 240) has just settled */
export const COLUMN_FLASH_DELAY_MS = 240;

/**
 * When the copy into a refilled cell lands, ms on the blast clock: once the
 * pillar has thinned enough to show the cells (a fifth of DISPERSE), then top
 * to bottom down each reel, the reels in the order they went up.
 */
export const copyArriveAt = (disperseAt: number, disperseMs: number, reelOrder: number, row: number) =>
	disperseAt + disperseMs * 0.2 + COPY_FLIGHT_MS * 0.5 + reelOrder * 40 + (row - 1) * 55;

export type Beats = {
	shatter: number;
	puff: number;
	hold: number;
	disperse: number;
	settle: number;
	total: number;
};

/** 0..1 progress through each beat at clock t (ms since the blast began) */
export const phasesAt = (t: number, beats: Beats) => {
	const charge = Math.min(1, t / CHARGE_MS);
	const shatter = t < CHARGE_MS ? 0 : Math.min(1, (t - CHARGE_MS) / beats.shatter);
	const PUFF_AT = CHARGE_MS + beats.shatter;
	const puff = t < PUFF_AT ? 0 : Math.min(1, (t - PUFF_AT) / beats.puff);
	const DISPERSE_AT = PUFF_AT + beats.puff + beats.hold;
	const disperse = t < DISPERSE_AT ? 0 : Math.min(1, (t - DISPERSE_AT) / beats.disperse);
	return { charge, shatter, puff, disperse, PUFF_AT, DISPERSE_AT, SWAP_AT: PUFF_AT + beats.puff };
};

/**
 * The plasma pillar's shape: it bursts out past the reel, holds, then
 * collapses to a line and shrinks to its middle like a CRT switching off.
 * `half` is the half-width of the sheath in board px; `top`/`h` its extent.
 */
export const pillarAt = (puff: number, disperse: number, symbolSize: number, height: number) => {
	const open = 1 - (1 - puff) ** 3;
	const collapse = disperse < 0.55 ? 1 - (disperse / 0.55) ** 2 * 0.96 : 0.04 * (1 - (disperse - 0.55) / 0.45);
	const half = (symbolSize / 2) * (0.35 + 0.85 * open) * collapse;
	const vEnd = disperse < 0.55 ? 1 : 1 - (disperse - 0.55) / 0.45;
	const top = (height / 2) * (1 - vEnd);
	const h = height * vEnd;
	const alpha = puff <= 0 ? 0 : disperse < 0.85 ? 1 : 1 - (disperse - 0.85) / 0.15;
	return { half, top, h, alpha };
};

// ---------------------------------------------------------------------------
// THE LADDER, MADE VISIBLE. A blast on rung 1 and a blast on rung 5 used to
// differ only in width. Now every rung adds weight: more lightning, harder
// shards, a bigger bang, and the palette climbs from the pink/violet of the
// opener through cyan to white-hot rainbow at the top — never gold, which
// belongs to the Scatter alone.

export type BlastLook = {
	/** 1..5 (a full board is 5) */
	level: number;
	/** overall push: ring radius, shard speed, spark count */
	power: number;
	/** core / sheath / outer glow of the pillar */
	core: number;
	sheath: number;
	outer: number;
	/** the bolts' outer colour */
	bolt: number;
	/** shard edge-light colours, cycled */
	edge: number[];
	/** ms of hit-stop on the bang (the shards hang before flying) */
	hitStop: number;
	/** boardFrameImpact strength on the bang */
	impact: number;
};

const PINK = 0xff3fd0;
const VIOLET = 0xb143ec;
const CYAN = 0x59e3ff;
const ICE = 0x9ff6ff;
const LILAC = 0xf2d8ff;

export const blastLook = (level: number, full: boolean): BlastLook => {
	const L = full ? 5 : Math.max(1, Math.min(5, level));
	const table: Record<number, Omit<BlastLook, 'level' | 'power' | 'hitStop' | 'impact'>> = {
		1: { core: LILAC, sheath: PINK, outer: VIOLET, bolt: VIOLET, edge: [PINK, VIOLET] },
		2: { core: LILAC, sheath: PINK, outer: CYAN, bolt: VIOLET, edge: [PINK, CYAN] },
		3: { core: 0xe8fbff, sheath: CYAN, outer: VIOLET, bolt: CYAN, edge: [CYAN, PINK, VIOLET] },
		4: { core: 0xffffff, sheath: ICE, outer: PINK, bolt: CYAN, edge: [ICE, PINK, CYAN] },
		5: { core: 0xffffff, sheath: 0xffd6f6, outer: CYAN, bolt: 0xffffff, edge: [PINK, CYAN, VIOLET, ICE, 0xffffff] },
	};
	return {
		level: L,
		power: 1 + 0.14 * (L - 1) + (full ? 0.25 : 0),
		hitStop: full ? 110 : L >= 4 ? 60 : 0,
		impact: full ? 1.6 : 0.35 + 0.15 * L,
		...table[L],
	};
};
