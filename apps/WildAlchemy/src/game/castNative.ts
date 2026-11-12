/**
 * The side figure's layout box (width : height), used by Cast.svelte and
 * castPlacement.ts to size the strip the Spine cast (CastAlchemy) stands in.
 *
 * Moved here on 2026-11-11 from the retired flat-sprite CastFigure.svelte,
 * which was deleted with the rest of the inherited cast components. The
 * numbers are unchanged — they only set the box's proportions, and the cast
 * placement was tuned against them.
 */
export const CAST_NATIVE = { guy: { w: 441, h: 1100 }, girl: { w: 473, h: 1100 } } as const;
