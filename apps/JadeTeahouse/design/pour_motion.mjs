// The Master's `pour` — the free-spin splash's one big gesture (SplashMaster.svelte).
//
// He produces the teapot (the H1 symbol art, hung on the `sack` slot at
// runtime with addSlotObject — the skeleton has no teapot of its own), lifts it
// toward the board, tips it and holds the pour while the count lands, then
// sets it down and the pot is gone again.
//
// The arm stays inside the rig's budget (MAX_SHOULDER 26 in the generator: the
// arm art breaks past it), so the lift comes from the hip and torso and the
// pour from the PROP's own rotation — the pot is one solid drawing and turns as
// far as it likes.
//
// TOWARD_X = -1: the board is on -x, which is also where armL (the hand that
// carries `prop`) is. A positive (CCW) rotation leans toward -x.
//
// Kept out of the generator's body so add_pour_clip.mjs can lay it onto the
// shipped monkey.json without regenerating the rig, and the generator imports
// it too, so a regenerate keeps it.

const k = (pairs) => pairs.map(([time, value]) => ({ time, value }));
const kxy = (triples) => triples.map(([time, x, y]) => ({ time, x, y }));

export const POUR = {
	/** the pot is fully out and level */
	SHOWN_AT: 0.22,
	/** the stream starts / stops (SplashMaster draws it between these) */
	FLOW_FROM: 0.62,
	FLOW_TO: 1.78,
	DURATION: 2.5,
};

export const pourClip = () => {
	const { SHOWN_AT, FLOW_FROM, FLOW_TO, DURATION: D } = POUR;
	return {
		bones: {
			prop: {
				// out of nowhere, as the throw's sack is; and gone again at the end
				scale: kxy([
					[0, 0.01, 0.01],
					[0.06, 0.01, 0.01],
					[0.16, 1.15, 1.15],
					[SHOWN_AT, 1, 1],
					[2.15, 1, 1],
					[2.3, 0.01, 0.01],
					[D, 0.01, 0.01],
				]),
				// level while it comes up, then tipped spout-down for the pour
				rotate: k([
					[0, 0],
					[0.4, 30],
					[FLOW_FROM, 84],
					[0.9, 80],
					[1.3, 86],
					[FLOW_TO, 82],
					[1.98, 30],
					[2.3, 0],
				]),
			},
			armL: { rotate: k([[0, 0], [0.32, -22], [FLOW_TO, -24], [2.2, 0], [D, 0]]) },
			armL_fore: { rotate: k([[0, 0], [0.32, -16], [FLOW_TO, -18], [2.2, 0], [D, 0]]) },
			// the other arm steadies him
			armR: { rotate: k([[0, 0], [0.4, 8], [FLOW_TO, 9], [2.2, 0], [D, 0]]) },
			torso: { rotate: k([[0, 0], [0.4, 4], [FLOW_FROM, 6], [FLOW_TO, 6], [2.2, 0], [D, 0]]) },
			head: { rotate: k([[0, 0], [0.45, 7], [FLOW_TO, 8], [2.2, 0], [D, 0]]) },
			hip: {
				translate: kxy([
					[0, 0, 0],
					[0.4, -6, -5],
					[FLOW_FROM, -8, -8],
					[FLOW_TO, -8, -8],
					[2.2, 0, 0],
					[D, 0, 0],
				]),
			},
		},
	};
};
