// Where the teapot (sushiSymbols/h1.png, 512 square) sits on the Master's
// `prop` bone, in bone units (y up). Shared by SplashMaster.svelte (through
// src/game/teapotRig.ts, which mirrors these numbers) and render_pour.mjs.
//
// The hand grips the dragon handle on the RIGHT of the art, so the pot's
// centre is pushed out toward -x (the board, and the spout).
export const TEAPOT = {
	x: -78,
	y: 6,
	w: 220,
	h: 220,
	/** the spout's mouth, in the same bone units */
	spout: [-78 - 220 * 0.44, 6 + 220 * 0.2],
};
