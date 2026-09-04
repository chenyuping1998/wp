import type { Graphics as PixiGraphics } from 'pixi.js';

/**
 * The closed face of a cargo crate — canvas tarp, roped down, customs stamp.
 *
 * Drawn in ONE place and shared by two callers that need it to be the exact
 * same shape: Symbol.svelte draws it static wherever M sits sealed on the
 * board, and MysteryReveal.svelte draws it again as the thing that peels off
 * and flies away when the tarp comes loose. If the two ever drew different
 * shapes, the reveal would read as a swap to a different graphic rather than
 * as the same tarp being pulled — the frame right before the tarp starts
 * moving has to be pixel-identical to the frame it was sitting in a moment
 * before.
 *
 * There is no bespoke texture behind M yet (see the TODO in Symbol.svelte),
 * so this is deliberately vector: cheap, resolution-independent, and it
 * means the crate never looks worse than the rest of the board while it
 * waits on real art — a placeholder texture would.
 */
export const CRATE_CANVAS = 0xc2a878; // sun-bleached jute
export const CRATE_CANVAS_FOLD = 0xdfc79c; // lighter fold catching the light
export const CRATE_ROPE = 0x4a3826; // tied-down rope, dark brown
export const CRATE_STAMP = 0x8a3b2a; // customs stamp, rust red

export const drawCrateFace = (g: PixiGraphics, size: number) => {
	const half = size / 2;
	const corner = size * 0.09;

	// the canvas itself
	g.roundRect(-half, -half, size, size, corner);
	g.fill({ color: CRATE_CANVAS });

	// a fold catching the light, upper-left — breaks up the flat fill so it
	// reads as cloth rather than as a painted square
	g.moveTo(-half + corner, -half);
	g.lineTo(-half * 0.1, -half);
	g.lineTo(-half, -half * 0.1);
	g.lineTo(-half, -half + corner);
	g.closePath();
	g.fill({ color: CRATE_CANVAS_FOLD, alpha: 0.55 });

	// rope, corner to corner
	g.moveTo(-half * 0.86, -half * 0.86);
	g.lineTo(half * 0.86, half * 0.86);
	g.moveTo(half * 0.86, -half * 0.86);
	g.lineTo(-half * 0.86, half * 0.86);
	g.stroke({ width: size * 0.05, color: CRATE_ROPE, cap: 'round' });

	// a tie at each corner and one knot in the middle
	for (const [cx, cy] of [
		[-half * 0.86, -half * 0.86],
		[half * 0.86, -half * 0.86],
		[-half * 0.86, half * 0.86],
		[half * 0.86, half * 0.86],
	] as const) {
		g.circle(cx, cy, size * 0.045);
		g.fill({ color: CRATE_ROPE });
	}
	g.circle(0, 0, size * 0.075);
	g.fill({ color: CRATE_ROPE });

	// customs stamp, off-centre — dead-centre on the knot would read as
	// decoration on the rope rather than as its own mark
	const sx = half * 0.32;
	const sy = -half * 0.4;
	g.circle(sx, sy, size * 0.12);
	g.stroke({ width: size * 0.018, color: CRATE_STAMP, alpha: 0.75 });
	g.moveTo(sx - size * 0.06, sy);
	g.lineTo(sx + size * 0.06, sy);
	g.moveTo(sx, sy - size * 0.06);
	g.lineTo(sx, sy + size * 0.06);
	g.stroke({ width: size * 0.016, color: CRATE_STAMP, alpha: 0.75 });
};
