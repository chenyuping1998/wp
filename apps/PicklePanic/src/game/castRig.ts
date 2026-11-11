/**
 * The two casts' sizes, shared by Mascot.svelte (which plays them) and
 * stageLayout.ts (which decides where they stand beside the board).
 *
 * In skeleton units, origin on the ground between the boots:
 *   art          floor to the top of the head, and the width across
 *   throwReach   how far 'throwit' carries the jar TOWARD THE BOARD — the most
 *                negative x of skeleton.getBounds() over the clip, measured in
 *                the browser 2026-10-13 (Mascot's REACH table). The widest
 *                motion, so it sizes the cast: he must be able to step back
 *                and throw without any of it landing on the board.
 */
export const CAST_ART = {
	basegame: { height: 862, width: 415 },
	freegame: { height: 862, width: 406 },
} as const;

export const CAST_THROW_REACH = { basegame: 400, freegame: 406 } as const;
