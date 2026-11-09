/**
 * The props' row (spiral sign, then balloons) in background units at propScale
 * 1: widths, the balloons' height (the taller prop), the gap between props as a
 * share of the balloons' width, and their height as a share of the cast's
 * figure height. Shared with stageLayout.ts so the board stands clear of them.
 */
export const PROPS = { signWidth: 132, balloonWidth: 145, balloonHeight: 300, gap: .4, size: .36 };
/** Screen px: the props' ground line, just above the bar (Background.svelte). */
export const propsGround = (canvasHeight: number, standard: { height: number; scale: number }, barHeight: number) =>
 (canvasHeight - standard.height * standard.scale) / 2 + (standard.height - barHeight) * standard.scale - 12;
/** Screen px: right edge of the row standing right of the bar's corner cluster (setBounds clearLeft). */
export const propsRight = (clearLeft: number, figureHeight: number) =>
 clearLeft + figureHeight * PROPS.size / PROPS.balloonHeight * (PROPS.signWidth + PROPS.balloonWidth * (1 + 2 * PROPS.gap));
/** Screen px: top of the row. */
export const propsTop = (groundY: number, figureHeight: number) => groundY - figureHeight * PROPS.size;
