// THE WIN REACTION, REDONE AS ONE GESTURE (2026-10-31).
//
// The old `cheer` (theme_cast_motions.mjs) slid the whole figure left, then
// right, while both arms waved twice: it moved from the first frame to the
// last and never arrived anywhere. Commercial character acting (the
// slot-motion-recipes skill, §4.2, measured on Sweet Loot) is the opposite —
// a wind-up AGAINST the move, one decisive move, then a HOLD longer than the
// move itself, with only the head nodding along, then a settle back to idle.
//
//   0.00–0.18  wind-up: sink into the knees, lean back, cup drawn in to the chest
//   0.18–0.40  the offer: rise, lean toward the board, cup raised (fore-arms
//              trail their upper arms by 0.06s, so the arm unfolds)
//   0.46–1.12  HOLD at the top, laughing with the eyes closed; two small nods
//   1.12–1.45  settle: arms down, a small squash as the weight comes home
//   → 1.70     idle pose
//
// Arms stay inside the generator's MAX_SHOULDER 26° / MAX_ELBOW 22° (the
// painted arm tears past them). The figure's travel is the hip, not the root,
// so the feet stay planted. Same length as before (Mascot.svelte times nothing
// off cheer's inside, only its end).
//
// Applied two ways: theme_cast_motions.mjs puts the bones (so a regenerated
// rig keeps them) and add_cheer_clip.mjs lays bones AND the face onto the
// shipped skeletons without regenerating them.

const rot = (keys) => keys.map(([time, value]) => ({ time, value }));
const xy = (keys) => keys.map(([time, x, y]) => ({ time, x, y }));

const CAST = {
	// the master offers a cup with his left arm; the right opens out
	mg: { end: 1.7, cup: -25, open: 18, lean: -6, rise: 14, step: 8 },
	// the apprentice: lighter, a little higher, both hands up
	fg: { end: 1.6, cup: -24, open: 22, lean: -4, rise: 18, step: 6 },
};

const A = 0.18; // wind-up
const P = 0.4; // peak of the move
const H0 = 0.46; // hold begins
const H1 = 1.12; // hold ends
const S = 1.38; // settle squash

export const cheerBones = (cast) => {
	const c = CAST[cast];
	const E = c.end;
	return {
		hip: {
			translate: xy([
				[0, 0, 0],
				[A, -c.step * 0.5, -10],
				[P, c.step, c.rise],
				[0.62, c.step, c.rise * 0.7],
				[0.9, c.step, c.rise * 0.85],
				[H1, c.step * 0.8, c.rise * 0.7],
				[S, 0, -4],
				[E, 0, 0],
			]),
		},
		torso: {
			rotate: rot([[0, 0], [A, 3], [P, c.lean], [H1, c.lean * 0.8], [S, 1], [E, 0]]),
			scale: xy([[0, 1, 1], [A, 1.03, 0.95], [P, 0.98, 1.04], [0.6, 1, 1.01], [H1, 1, 1.01], [S, 1.02, 0.97], [E, 1, 1]]),
		},
		head: {
			// looks down into the wind-up, chin up on the offer, then two nods
			rotate: rot([[0, 0], [A, 3], [P, -5], [0.62, -1], [0.8, -5], [0.98, -1], [H1, -4], [S, 1], [E, 0]]),
			translate: xy([[0, 0, 0], [A, 0, -4], [P, 0, 3], [0.62, 0, 0], [0.8, 0, 3], [0.98, 0, 0], [S, 0, -2], [E, 0, 0]]),
		},
		armL: { rotate: rot([[0, 0], [A, 6], [P, c.cup], [0.7, c.cup * 0.92], [H1, c.cup], [S, -4], [1.52, 2], [E, 0]]) },
		armL_fore: { rotate: rot([[0, 0], [A + 0.06, -4], [P + 0.06, 14], [0.76, 12], [H1 + 0.06, 14], [S + 0.06, 2], [E, 0]]) },
		armR: { rotate: rot([[0, 0], [A, -5], [P, c.open], [0.7, c.open * 0.9], [H1, c.open], [S, 3], [1.52, -1], [E, 0]]) },
		armR_fore: { rotate: rot([[0, 0], [A + 0.06, 3], [P + 0.06, -12], [0.76, -10], [H1 + 0.06, -12], [S + 0.06, -1], [E, 0]]) },
		legL: { scale: xy([[0, 1, 1], [A, 1, 0.94], [P, 1, 1], [S, 1, 0.97], [E, 1, 1]]) },
		legR: { scale: xy([[0, 1, 1], [A, 1, 0.94], [P, 1, 1], [S, 1, 0.97], [E, 1, 1]]) },
		// the old cheer slid the root; it stays put now
		root: { translate: xy([[0, 0, 0], [E, 0, 0]]) },
	};
};

// The face: the laugh opens on the offer, HOLDS eyes-closed through the hold
// (one blink-wide squeeze at the second nod), and closes on the settle.
export const cheerFace = () => ({
	attachment: [
		[0, 'head_2_face_rest'],
		[A, 'head_2_face_inhale'],
		[0.32, 'head_2_face_laugh_1'],
		[0.36, 'head_2_face_laugh_2'],
		[P, 'head_2_face_laugh_3'],
		[H0, 'head_2_face_laugh_4_blink'],
		[0.8, 'head_2_face_laugh_4'],
		[0.86, 'head_2_face_laugh_4_blink'],
		[H1, 'head_2_face_laugh_3'],
		[1.2, 'head_2_face_laugh_2'],
		[1.28, 'head_2_face_laugh_1'],
		[S, 'head_2_face_rest'],
	].map(([time, name]) => ({ time, name })),
});
