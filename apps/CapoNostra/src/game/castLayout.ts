/**
 * The box the side-band cast is sized into, in the proportions the retired
 * flat cut-outs had (moved here from CastFigure.svelte on 2026-09-28 when that
 * component was retired). Cast.svelte and FreeSpinIntro.svelte size their
 * layout boxes with these; CastFigureLayered scales each figure's own ink
 * height into the box, so the numbers are a frame, not a drawing.
 */
export const CAST_NATIVE = { guy: { w: 441, h: 1100 }, girl: { w: 473, h: 1100 } };
