// THE WIN MOVES, CARRIED OVER FROM GO BANANAS 100.
//
// Every symbol in GB100 has its own 1.4s win choreography — the H1 swings, the
// H2 shivers, the H3 squashes and bounces, the H4 rattles, the lows hop, the
// Wild and Scatter swell hardest — each with a warm tint flash or two. They
// live there as Spine animations on the symbol's single bone, and this is that
// data lifted out of goBananasSymbolsV3/*.json verbatim, converted once:
//
//   rotate      degrees, SIGN FLIPPED — Spine turns counter-clockwise, pixi
//               clockwise
//   translate   in CELLS, not pixels — Spine's units were the 256px tile, so
//               x/256, and y sign-flipped because Spine's y points up
//   scale       as is
//   tint        the slot colour's RGB; its alpha was always ff
//
// Why not load the spines themselves: their atlases carry GB100's own art, and
// a spine swapping to that picture the moment a symbol won is exactly the bug
// constants.ts records. The motion is what was wanted, so only the motion
// came across. Every curve was linear, so plain lerp between keys reproduces it.
//
// GB100 has no X move (its x.json was never shipped); X uses L1's hop.
// Generated from GB100's files — edit there and regenerate rather than by hand.

export type WinMove = {
	rotate: [number, number][];
	scale: [number, number, number][];
	translate: [number, number, number][];
	tint: [number, number][];
};

export const WIN_MOVE_MS = 1400;

const MOVES: Record<string, WinMove> = {
	H1: {
		rotate: [[0, 0], [0.2, 12], [0.45, -12], [0.7, 8], [0.95, -6], [1.2, 2], [1.4, 0]],
		scale: [[0, 1, 1], [0.35, 1.4, 1.32], [0.9, 1.34, 1.4], [1.4, 1, 1]],
		translate: [],
		tint: [[0, 0xffffff], [0.28, 0xffe9a8], [0.56, 0xffffff], [0.84, 0xffe9a8], [1.4, 0xffffff]],
	},
	H2: {
		rotate: [[0, 0], [0.12, 6], [0.24, -6], [0.36, 5], [0.48, -5], [0.62, 4], [0.76, -4], [0.95, 2], [1.2, -1], [1.4, 0]],
		scale: [[0, 1, 1], [0.2, 1.3, 1.42], [0.45, 1.4, 1.3], [0.7, 1.32, 1.44], [1, 1.38, 1.34], [1.4, 1, 1]],
		translate: [],
		tint: [[0, 0xffffff], [0.18, 0xffd699], [0.36, 0xffffff], [0.54, 0xffb08a], [0.72, 0xffffff], [0.95, 0xffd699], [1.4, 0xffffff]],
	},
	H3: {
		rotate: [],
		scale: [[0, 1, 1], [0.15, 1.3, 0.82], [0.38, 1.16, 1.52], [0.6, 1.42, 1.18], [0.82, 1.24, 1.44], [1.1, 1.34, 1.3], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.15, 0, 0.0547], [0.42, 0, -0.1016], [0.68, 0, -0.0078], [0.9, 0, -0.0625], [1.15, 0, 0], [1.4, 0, 0]],
		tint: [[0, 0xffffff], [0.28, 0xffc9c9], [0.56, 0xffffff], [0.84, 0xffc9c9], [1.4, 0xffffff]],
	},
	H4: {
		rotate: [[0, 0], [0.1, 7], [0.2, -7], [0.3, 6], [0.4, -6], [0.5, 5], [0.6, -5], [0.72, 4], [0.84, -4], [1, 2], [1.2, -1], [1.4, 0]],
		scale: [[0, 1, 1], [0.3, 1.38, 1.38], [1, 1.38, 1.38], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.15, -0.0234, -0.0156], [0.3, 0.0234, 0.0156], [0.45, -0.0195, -0.0117], [0.6, 0.0195, 0.0117], [0.8, -0.0117, -0.0078], [1, 0.0078, 0], [1.4, 0, 0]],
		tint: [[0, 0xffffff], [0.15, 0xfff3b0], [0.3, 0xffffff], [0.45, 0xffd699], [0.6, 0xffffff], [0.78, 0xfff3b0], [1.4, 0xffffff]],
	},
	L1: {
		rotate: [[0, 0], [0.28, 8], [0.56, -8], [0.84, 4], [1.12, -4], [1.4, 0]],
		scale: [[0, 1, 1], [0.21, 1.32, 1.32], [0.42, 1.45, 1.45], [0.63, 1.2, 1.2], [0.84, 1.36, 1.36], [1.12, 1, 1], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.35, 0, -0.0703], [0.7, 0, 0], [1.05, 0, -0.0352], [1.4, 0, 0]],
		tint: [],
	},
	L2: {
		rotate: [[0, 0], [0.28, 8], [0.56, -8], [0.84, 4], [1.12, -4], [1.4, 0]],
		scale: [[0, 1, 1], [0.21, 1.32, 1.32], [0.42, 1.45, 1.45], [0.63, 1.2, 1.2], [0.84, 1.36, 1.36], [1.12, 1, 1], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.35, 0, -0.0703], [0.7, 0, 0], [1.05, 0, -0.0352], [1.4, 0, 0]],
		tint: [],
	},
	L3: {
		rotate: [[0, 0], [0.28, 8], [0.56, -8], [0.84, 4], [1.12, -4], [1.4, 0]],
		scale: [[0, 1, 1], [0.21, 1.32, 1.32], [0.42, 1.45, 1.45], [0.63, 1.2, 1.2], [0.84, 1.36, 1.36], [1.12, 1, 1], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.35, 0, -0.0703], [0.7, 0, 0], [1.05, 0, -0.0352], [1.4, 0, 0]],
		tint: [],
	},
	L4: {
		rotate: [[0, 0], [0.28, 8], [0.56, -8], [0.84, 4], [1.12, -4], [1.4, 0]],
		scale: [[0, 1, 1], [0.21, 1.32, 1.32], [0.42, 1.45, 1.45], [0.63, 1.2, 1.2], [0.84, 1.36, 1.36], [1.12, 1, 1], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.35, 0, -0.0703], [0.7, 0, 0], [1.05, 0, -0.0352], [1.4, 0, 0]],
		tint: [],
	},
	L5: {
		rotate: [[0, 0], [0.28, 8], [0.56, -8], [0.84, 4], [1.12, -4], [1.4, 0]],
		scale: [[0, 1, 1], [0.21, 1.32, 1.32], [0.42, 1.45, 1.45], [0.63, 1.2, 1.2], [0.84, 1.36, 1.36], [1.12, 1, 1], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.35, 0, -0.0703], [0.7, 0, 0], [1.05, 0, -0.0352], [1.4, 0, 0]],
		tint: [],
	},
	W: {
		rotate: [[0, 0], [0.2, 14], [0.45, -14], [0.7, 10], [0.95, -8], [1.2, 3], [1.4, 0]],
		scale: [[0, 1, 1], [0.25, 1.45, 1.45], [0.55, 1.55, 1.55], [0.85, 1.4, 1.4], [1.1, 1.5, 1.5], [1.4, 1, 1]],
		translate: [[0, 0, 0], [0.35, 0, -0.0781], [0.7, 0, 0], [1.05, 0, -0.0391], [1.4, 0, 0]],
		tint: [[0, 0xffffff], [0.28, 0xffe066], [0.56, 0xffffff], [0.84, 0xffe066], [1.4, 0xffffff]],
	},
	S: {
		rotate: [[0, 0], [0.3, 10], [0.6, -10], [0.9, 6], [1.2, -3], [1.4, 0]],
		scale: [[0, 1, 1], [0.18, 1.55, 1.55], [0.4, 1.3, 1.3], [0.62, 1.5, 1.5], [0.84, 1.35, 1.35], [1.06, 1.45, 1.45], [1.4, 1, 1]],
		translate: [],
		tint: [[0, 0xffffff], [0.2, 0xfff59b], [0.4, 0xffffff], [0.6, 0xffe066], [0.8, 0xffffff], [1, 0xfff59b], [1.4, 0xffffff]],
	},
	P: {
		rotate: [],
		scale: [[0, 1, 1], [0.14, 1.3, 1.3], [0.32, 0.16, 1.38], [0.5, 1.34, 1.34], [0.68, 0.16, 1.38], [0.86, 1.34, 1.34], [1.04, 0.4, 1.36], [1.2, 1.2, 1.2], [1.4, 1, 1]],
		translate: [],
		tint: [[0, 0xffffff], [0.28, 0xffe9a8], [0.56, 0xffffff], [0.84, 0xffe9a8], [1.4, 0xffffff]],
	},
};
MOVES.X = MOVES.L1;

export const winMoveOf = (symbol: string): WinMove => MOVES[symbol] ?? MOVES.L1;
