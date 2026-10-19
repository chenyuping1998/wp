// The `bow` both casts take when the curtain comes down (2026-10-18): the
// Bandleader on the way into free spins, the tap dancer on the way out.
//
// It replaces `throwit` there: the user did not want him pitching a record at
// the board, but the bow a bandleader takes when the number ends. A flat
// cut-out cannot bend toward the viewer, so the bow is built the 2-D way:
//
//   a small rise on the last beat (anticipation), then down into the bow — hip
//   dips, the torso squashes short and wide (reads as bending forward), the
//   head drops; the board-side arm (armL) sweeps out to present the stage, the
//   other folds across his belly. He smiles into it and shuts his eyes at the
//   bottom (the gracious bow, not a grin at the crowd). Hold, come up with a
//   little overshoot, settle. (No hat-tip: the hat is part of the head mesh —
//   the `helmet` bone owns no vertices — and the arm could not reach it inside
//   the budget anyway.)
//
// Budget (generate_monkey_spine.mjs): shoulder ±26, elbow ±22; outward is −
// on the left arm, + on the right. +y is up. Board side is −x (TOWARD_X −1).
// Head translate is written already at the generator's 0.55 neck factor (the
// collar blend), since add_bow_clip.mjs bypasses that pass; head rotation
// stays inside its ±9.
//
// Kept out of the generator's body so add_bow_clip.mjs can lay it onto the
// shipped monkey.json without regenerating the rig, and the generator imports
// it too, so a regenerate keeps it. Timings are read by TransitionAnimation
// (the curtain falls a second after he is straight again).

const k = (pairs) => pairs.map(([time, value]) => ({ time, value }));
const kxy = (triples) => triples.map(([time, x, y]) => ({ time, x, y }));

export const BOW = {
	/** at the bottom of the bow */
	DOWN_AT: 0.62,
	/** starts to come up */
	UP_AT: 1.22,
	DURATION: 2.0,
};

/** physics: the skeleton's own `*_phys` mix keys at full (cheer's), so a bow
 * after the throw never leaves the costume damped. fold: the off arm folds
 * across the belly — off for the tap dancer, whose right hand rests on her
 * tail and tears it when it swings in. */
export const bowClip = (physics = { tail_phys: { mix: [{ time: 0, value: 1 }] } }, fold = true) => {
	const f = fold ? 1 : 0.25;
	const { DOWN_AT: A, UP_AT: B, DURATION: D } = BOW;
	const UP = B + 0.34; // straight again (with the overshoot)
	return {
		bones: {
			hip: { translate: kxy([[0, 0, 0], [0.2, 0, 5], [A, -4, -22], [B, -4, -21], [UP, 0, 3], [UP + 0.2, 0, 0], [D, 0, 0]]) },
			torso: {
				rotate: k([[0, 0], [0.2, -1.5], [A, 6], [B, 5.5], [UP, -1.5], [UP + 0.2, 0], [D, 0]]),
				scale: kxy([[0, 1, 1], [0.2, 0.99, 1.025], [A, 1.04, 0.88], [B, 1.035, 0.885], [UP, 0.99, 1.02], [UP + 0.2, 1, 1], [D, 1, 1]]),
			},
			head: {
				rotate: k([[0, 0], [0.2, -2], [A, 8], [B, 7], [UP, -2], [UP + 0.22, 0], [D, 0]]),
				translate: kxy([[0, 0, 0], [0.2, 0, 1.6], [A, -2.5, -8], [B, -2.5, -7.4], [UP, 0, 1.1], [UP + 0.22, 0, 0], [D, 0, 0]]),
			},
			// board side: sweeps out, presenting the stage, a flourish of the wrist
			armL: { rotate: k([[0, 0], [0.2, 4], [A, -24], [B, -23], [UP, -4], [UP + 0.24, 0], [D, 0]]) },
			armL_fore: { rotate: k([[0, 0], [0.28, 3], [A + 0.06, -18], [B, -15], [UP + 0.06, -2], [UP + 0.28, 0], [D, 0]]) },
			// the other folds across his belly
			armR: { rotate: k([[0, 0], [0.2, 3], [A, -14 * f], [B, -14 * f], [UP, 2], [UP + 0.24, 0], [D, 0]]) },
			armR_fore: { rotate: k([[0, 0], [0.26, 0], [A + 0.04, -21 * f], [B, -20 * f], [UP + 0.06, 0], [UP + 0.28, 0], [D, 0]]) },
			legL: { scale: kxy([[0, 1, 1], [A, 1, 0.96], [B, 1, 0.965], [UP, 1, 1.005], [UP + 0.2, 1, 1], [D, 1, 1]]) },
			legR: { scale: kxy([[0, 1, 1], [A, 1, 0.96], [B, 1, 0.965], [UP, 1, 1.005], [UP + 0.2, 1, 1], [D, 1, 1]]) },
		},
		// a pleased smile going down, eyes shut at the bottom, a blink coming up
		slots: {
			head_2_face: {
				attachment: [
					{ time: 0, name: 'head_2_face_rest' },
					{ time: 0.24, name: 'head_2_face_laugh_1' },
					{ time: A - 0.14, name: 'head_2_face_laugh_3' },
					{ time: A - 0.06, name: 'head_2_face_laugh_3_blink' },
					{ time: B + 0.1, name: 'head_2_face_laugh_3' },
					{ time: UP + 0.1, name: 'head_2_face_laugh_1' },
					{ time: UP + 0.34, name: 'head_2_face_rest' },
				],
			},
		},
		physics,
	};
};
