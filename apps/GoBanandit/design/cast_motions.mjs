// Go Banandit's OWN motion tables, one per cast — imported by
// generate_monkey_spine.mjs and laid over the inherited set by name.
//
// WHY THIS FILE EXISTS
//
// The first submission (2026-10-04, 5.0/9) came back "Poor animations ×2" and
// "Reused assets". Both casts were playing Go Boomana's miner motions: nod,
// flinch, alert and glance were byte-identical to Boomana's skeleton, the
// Bandit's accessory loop too, and the two characters shared every motion — a
// chimp thief and an orangutan lookout moving like the same gorilla. A reviewer
// who has seen the series recognises the gestures before the art.
//
// So each cast gets a body language of its own, written here:
//
//   BANDIT (base game)   a sneak. Weight on the balls of the feet, a low
//                        side-to-side prowl, snap glances with holds (casing
//                        the joint), a cap-tip for a win, a two-step jig for a
//                        big one, and for the trigger a wheezing laugh that
//                        shakes his shoulders on the six beats of voice_laugh.
//   LOOKOUT (free spins) lazy and heavy. A slow wide scan of the horizon with
//                        a chew under it, a forward lean to peer at the board,
//                        a double nod, a bounce for a win, a shimmy for the
//                        big ones.
//
// Same constraint as the inherited set (see MAX_SHOULDER in the generator):
// the arm art breaks past ~26°, so the character comes from the hip, the
// torso's squash and the head; arms trail with hang().
//
// Contracts with Mascot.svelte that are kept: names; chestbeat's six beats at
// 0.48 + 0.3·i (the laugh / impacts are timed to them); throwit untouched
// (the transition times the sack's release to it).

const k = (pairs) => pairs.map(([time, value]) => ({ time, value }));
const kxy = (triples) => triples.map(([time, x, y]) => ({ time, x, y }));

// a periodic key list over a loop, sampled — whole cycles only, so it closes
const wave = (loop, n, amp, phase = 0, steps = 24, shape = Math.sin) =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const t = (loop * i) / steps;
		return { time: +t.toFixed(4), value: +(amp * shape((2 * Math.PI * n * t) / loop + phase)).toFixed(3) };
	});

export const castMotions = ({ CAST, hang, TOWARD_X, BEAT_START, BEAT_GAP, RIGPTS }) => {
	const IN = TOWARD_X; // +x toward the board is IN * x
	const beats = [0, 1, 2, 3, 4, 5].map((i) => BEAT_START + i * BEAT_GAP);

	if (CAST === 'mg') {
		// ── THE BANDIT ────────────────────────────────────────────────────────
		const IDLE = 4.8;
		// The prowl: weight rocks foot to foot on a 2.4 s stride, and at each
		// end he rises a hair onto his toes — a sneak's bounce, not a breath.
		const idle = {
			bones: {
				hip: {
					translate: kxy([
						[0, 0, 0],
						[0.6, -4, 3],
						[1.2, -6, 0],
						[1.8, -4, 3],
						[2.4, 0, 0],
						[3.0, 4, 3],
						[3.6, 6, 0],
						[4.2, 4, 3],
						[IDLE, 0, 0],
					]),
				},
				legL: { scale: kxy([[0, 1, 1], [1.2, 1, 0.99], [3.6, 1, 1.006], [IDLE, 1, 1]]) },
				legR: { scale: kxy([[0, 1, 1], [1.2, 1, 1.006], [3.6, 1, 0.99], [IDLE, 1, 1]]) },
				torso: {
					// hunched: shoulders up and in, a counter-lean against the hip
					rotate: k([[0, 0], [1.2, -1.6], [2.4, 0], [3.6, 1.6], [IDLE, 0]]),
					scale: kxy([[0, 1, 0.992], [1.2, 1.006, 0.986], [2.4, 1, 0.992], [3.6, 1.006, 0.986], [IDLE, 1, 0.992]]),
				},
				// Furtive glances: snap, HOLD, snap back. Linear looks around are
				// a mascot; looks with holds are someone keeping watch.
				head: {
					rotate: k([
						[0, 0],
						[0.5, 0],
						[0.62, 4.5],
						[1.3, 4.5],
						[1.42, 0.5],
						[2.6, 0.5],
						[2.72, -4],
						[3.2, -4],
						[3.34, -1],
						[3.5, -2],
						[4.4, -1],
						[IDLE, 0],
					]),
					translate: kxy([[0, 0, 0], [0.62, 3 * IN, 0], [1.3, 3 * IN, 0], [1.42, 0, 0], [2.72, -3 * IN, 1], [3.34, 0, 0], [IDLE, 0, 0]]),
				},
				armL: { rotate: k([[0, 0], [1.2, -3], [2.4, 0], [3.6, 2.4], [IDLE, 0]]) },
				armR: { rotate: k([[0, 0], [1.3, -2.2], [2.5, 0], [3.7, 3], [IDLE, 0]]) },
				armL_fore: { rotate: k([[0, 0], [1.3, hang(-3)], [2.5, 0], [3.7, hang(2.4)], [IDLE, 0]]) },
				armR_fore: { rotate: k([[0, 0], [1.4, hang(-2.2)], [2.6, 0], [3.8, hang(3)], [IDLE, 0]]) },
				armL_hand: { rotate: k([[0, 0], [1.4, 2], [3.8, -2], [IDLE, 0]]) },
				armR_hand: { rotate: k([[0, 0], [1.5, -2], [3.9, 2], [IDLE, 0]]) },
			},
		};

		// side-eye at the board: a snap, two little checking nods, back
		const GL = 1.5;
		const glance = {
			bones: {
				head: {
					rotate: k([[0, 0], [0.12, 7], [0.4, 6], [0.5, 8], [0.62, 6], [0.72, 8], [1.1, 7], [GL, 0]]),
					translate: kxy([[0, 0, 0], [0.12, 11 * IN, -1], [1.1, 11 * IN, -1], [GL, 0, 0]]),
				},
				torso: { rotate: k([[0, 0], [0.18, 2.2], [1.1, 2.2], [GL, 0]]) },
				hip: { translate: kxy([[0, 0, 0], [0.2, 4 * IN, -2], [1.1, 4 * IN, -2], [GL, 0, 0]]) },
			},
		};

		// a win: tips his cap — head cocks sideways, a quick dip, a grin's worth
		// of bounce in the shoulders
		const NOD = 0.8;
		const nod = {
			bones: {
				head: {
					rotate: k([[0, 0], [0.12, -7], [0.3, -5], [0.42, -8], [NOD, 0]]),
					translate: kxy([[0, 0, 0], [0.12, 0, -5], [0.3, 0, 2], [0.42, 0, -3], [NOD, 0, 0]]),
				},
				torso: { scale: kxy([[0, 1, 1], [0.12, 1.012, 0.985], [0.3, 0.996, 1.01], [NOD, 1, 1]]) },
				hip: { translate: kxy([[0, 0, 0], [0.12, 0, -4], [0.3, 0, 2], [NOD, 0, 0]]) },
			},
		};

		// a big win: a two-step jig — hop to one side, hop to the other, land
		const CH = 1.7;
		const cheer = {
			bones: {
				hip: {
					translate: kxy([
						[0, 0, 0],
						[0.14, 0, -12],
						[0.34, 10, 22],
						[0.52, 12, -8],
						[0.66, 0, -10],
						[0.86, -10, 22],
						[1.04, -12, -8],
						[1.24, 0, 4],
						[CH, 0, 0],
					]),
				},
				torso: {
					rotate: k([[0, 0], [0.34, -5], [0.52, -2], [0.86, 5], [1.04, 2], [1.3, 0], [CH, 0]]),
					scale: kxy([[0, 1, 1], [0.14, 1.03, 0.95], [0.34, 0.98, 1.04], [0.52, 1.03, 0.96], [0.66, 1.02, 0.97], [0.86, 0.98, 1.04], [1.04, 1.03, 0.96], [1.3, 1, 1], [CH, 1, 1]]),
				},
				head: { rotate: k([[0, 0], [0.38, 6], [0.9, -6], [1.3, 0], [CH, 0]]), translate: kxy([[0, 0, 0], [0.14, 0, -6], [0.34, 0, 4], [0.66, 0, -6], [0.86, 0, 4], [1.24, 0, 0], [CH, 0, 0]]) },
				armL: { rotate: k([[0, 0], [0.34, -20], [0.6, -8], [0.86, -24], [1.1, -6], [1.4, 0], [CH, 0]]) },
				armR: { rotate: k([[0, 0], [0.34, 24], [0.6, 8], [0.86, 20], [1.1, 6], [1.4, 0], [CH, 0]]) },
				armL_fore: { rotate: k([[0, 0], [0.42, hang(-20)], [0.68, hang(-8)], [0.94, hang(-24)], [1.18, hang(-6)], [1.5, 0], [CH, 0]]) },
				armR_fore: { rotate: k([[0, 0], [0.42, hang(24)], [0.68, hang(8)], [0.94, hang(20)], [1.18, hang(6)], [1.5, 0], [CH, 0]]) },
				legL: { scale: kxy([[0, 1, 1], [0.14, 1, 0.97], [0.34, 1, 0.94], [0.52, 1, 0.97], [0.86, 1, 0.94], [1.04, 1, 0.97], [1.3, 1, 1], [CH, 1, 1]]) },
				legR: { scale: kxy([[0, 1, 1], [0.14, 1, 0.97], [0.34, 1, 0.94], [0.52, 1, 0.97], [0.86, 1, 0.94], [1.04, 1, 0.97], [1.3, 1, 1], [CH, 1, 1]]) },
			},
		};

		// THE LAUGH (feature trigger, top-tier wins). Leans back and wheezes: a
		// shoulder shake on each of the six beats of voice_laugh, head thrown
		// back further as it builds, then he wipes it off and squares up.
		const END = beats[5] + BEAT_GAP + 0.35;
		const shake = [];
		const headR = [];
		const headT = [];
		const armLk = [];
		const armRk = [];
		shake.push([0, 1, 1], [0.3, 1.02, 0.97]);
		headR.push([0, 0], [0.32, -4]);
		headT.push([0, 0, 0], [0.32, 0, -4]);
		armLk.push([0, 0], [0.3, -3]);
		armRk.push([0, 0], [0.3, 3]);
		beats.forEach((b, i) => {
			const g = 1 + i * 0.12;
			shake.push([b, 1.02 * 1, 0.975], [b + 0.08, 0.985, 1.03 * g > 1.06 ? 1.06 : 1.03 * g], [b + 0.2, 1.015, 0.985]);
			headR.push([b, -6 - i * 1.2], [b + 0.1, -10 - i * 1.4], [b + 0.22, -7 - i * 1.2]);
			headT.push([b, 0, -2], [b + 0.08, 0, 6 + i], [b + 0.2, 0, 0]);
			armLk.push([b, -4], [b + 0.08, -9 - i], [b + 0.2, -5]);
			armRk.push([b, 4], [b + 0.08, 9 + i], [b + 0.2, 5]);
		});
		const tail = beats[5] + BEAT_GAP;
		shake.push([tail, 1, 1], [END, 1, 1]);
		headR.push([tail, -4], [END, 0]);
		headT.push([tail, 0, 0], [END, 0, 0]);
		armLk.push([tail, -2], [END, 0]);
		armRk.push([tail, 2], [END, 0]);
		const chestbeat = {
			bones: {
				torso: {
					scale: kxy(shake),
					// leaning back away from the board, laughing at it
					rotate: k([[0, 0], [0.32, -3 * -IN], [beats[2], -5 * -IN], [beats[5], -6 * -IN], [tail, -2 * -IN], [END, 0]]),
				},
				head: { rotate: k(headR), translate: kxy(headT) },
				hip: {
					translate: kxy([[0, 0, 0], [0.3, -3 * IN, -6], ...beats.map((b) => [b + 0.08, -4 * IN, -2]), [tail, -2 * IN, -4], [END, 0, 0]]),
				},
				armL: { rotate: k(armLk) },
				armR: { rotate: k(armRk) },
				armL_fore: { rotate: k(armLk.map(([t, v]) => [Math.min(END, t + 0.06), hang(v)])) },
				armR_fore: { rotate: k(armRk.map(([t, v]) => [Math.min(END, t + 0.06), hang(v)])) },
			},
		};

		// meter step: FREEZE — pops up rigid, eyes on the board, a tremble, eases
		const AL = 1.3;
		const alert = {
			bones: {
				hip: { translate: kxy([[0, 0, 0], [0.08, 0, 12], [0.6, 0, 10], [0.62, 1, 10], [0.64, -1, 10], [0.66, 1, 10], [0.68, 0, 10], [1.0, 0, -2], [AL, 0, 0]]) },
				torso: { scale: kxy([[0, 1, 1], [0.08, 0.98, 1.035], [0.6, 0.985, 1.03], [1.0, 1.005, 0.99], [AL, 1, 1]]), rotate: k([[0, 0], [0.08, 1.5], [1.0, 0], [AL, 0]]) },
				head: { rotate: k([[0, 0], [0.06, 9], [0.7, 8], [1.05, 0], [AL, 0]]), translate: kxy([[0, 0, 0], [0.06, 6 * IN, 4], [0.7, 6 * IN, 4], [1.05, 0, 0], [AL, 0, 0]]) },
				armL: { rotate: k([[0, 0], [0.08, 4], [0.7, 4], [1.05, 0], [AL, 0]]) },
				armR: { rotate: k([[0, 0], [0.08, -4], [0.7, -4], [1.05, 0], [AL, 0]]) },
			},
		};

		// a near miss / shock: ducks (the template's startle was a hop)
		const FL = 1.1;
		const flinch = {
			bones: {
				hip: { translate: kxy([[0, 0, 0], [0.1, -2 * IN, -18], [0.5, -2 * IN, -16], [0.75, 0, 3], [FL, 0, 0]]) },
				torso: { scale: kxy([[0, 1, 1], [0.1, 1.04, 0.94], [0.5, 1.035, 0.95], [0.75, 0.99, 1.02], [FL, 1, 1]]), rotate: k([[0, 0], [0.1, 3], [0.5, 3], [FL, 0]]) },
				head: { rotate: k([[0, 0], [0.1, 6], [0.5, 4], [0.62, 7], [FL, 0]]), translate: kxy([[0, 0, 0], [0.1, 0, -10], [0.5, 0, -8], [0.75, 0, 2], [FL, 0, 0]]) },
				legL: { scale: kxy([[0, 1, 1], [0.1, 1, 0.955], [0.5, 1, 0.96], [0.75, 1, 1], [FL, 1, 1]]) },
				legR: { scale: kxy([[0, 1, 1], [0.1, 1, 0.955], [0.5, 1, 0.96], [0.75, 1, 1], [FL, 1, 1]]) },
			},
		};

		// No hat, banana or tube on him; what hangs off him is the sweater's
		// hems and the trouser legs. Twice the template's rate and his own
		// phases, so the cloth reads as twitchy, like the man.
		const FLUT = 4.8;
		const flutter = {
			bones: {
				cuffL: { rotate: wave(FLUT, 2, 2.6, 0.9) },
				cuffR: { rotate: wave(FLUT, 3, 2.2, 2.6) },
				pantL: { rotate: wave(FLUT, 2, 2, 4.1) },
				pantR: { rotate: wave(FLUT, 3, 1.8, 0.4) },
			},
		};

		return { anims: { idle, glance, nod, cheer, chestbeat, alert, flinch, flutter }, loops: { idle: IDLE, flutter: FLUT } };
	}

	// ── THE LOOKOUT ─────────────────────────────────────────────────────────
	const IDLE = 6.0;
	// Heavy and slow: the weight sinks, he scans the horizon end to end and
	// HOLDS at each end, the jaw working the gum the whole time.
	const chewY = [];
	for (let i = 0; i <= 30; i++) {
		const t = (IDLE * i) / 30;
		chewY.push([+t.toFixed(3), 0, +(1.6 * Math.max(0, Math.sin((2 * Math.PI * 5 * t) / IDLE))).toFixed(3)]);
	}
	const idle = {
		bones: {
			hip: { translate: kxy([[0, 0, 0], [1.5, 2, -5], [3.0, 0, -1], [4.5, -2, -5], [IDLE, 0, 0]]) },
			torso: {
				rotate: k([[0, 0], [1.0, -2.2], [2.6, -2.2], [3.6, 2], [5.2, 2], [IDLE, 0]]),
				scale: kxy([[0, 1, 1], [1.5, 1.012, 0.985], [3.0, 1, 1], [4.5, 1.012, 0.985], [IDLE, 1, 1]]),
			},
			head: {
				rotate: k([[0, 0], [1.0, -5], [2.6, -5], [3.6, 5], [5.2, 5], [IDLE, 0]]),
				translate: kxy(chewY),
			},
			armL: { rotate: k([[0, 0], [1.2, 2], [3.8, -2], [IDLE, 0]]) },
			armR: { rotate: k([[0, 0], [1.4, 2.2], [4.0, -1.6], [IDLE, 0]]) },
			armL_fore: { rotate: k([[0, 0], [1.3, hang(2)], [3.9, hang(-2)], [IDLE, 0]]) },
			armR_fore: { rotate: k([[0, 0], [1.5, hang(2.2)], [4.1, hang(-1.6)], [IDLE, 0]]) },
		},
	};

	// peering at the board: a slow lean in, a hold, back
	const GL = 1.8;
	const glance = {
		bones: {
			hip: { translate: kxy([[0, 0, 0], [0.45, 8 * IN, -4], [1.3, 8 * IN, -4], [GL, 0, 0]]) },
			torso: { rotate: k([[0, 0], [0.45, 4], [1.3, 4], [GL, 0]]) },
			head: { rotate: k([[0, 0], [0.5, 4], [0.9, 5.5], [1.3, 4], [GL, 0]]), translate: kxy([[0, 0, 0], [0.5, 8 * IN, -3], [1.3, 8 * IN, -3], [GL, 0, 0]]) },
		},
	};

	// a double nod
	const NOD = 0.9;
	const nod = {
		bones: {
			head: {
				rotate: k([[0, 0], [0.14, 5], [0.3, -1], [0.46, 5], [0.62, 0], [NOD, 0]]),
				translate: kxy([[0, 0, 0], [0.14, 0, -4], [0.3, 0, 0], [0.46, 0, -4], [0.62, 0, 0], [NOD, 0, 0]]),
			},
			torso: { rotate: k([[0, 0], [0.14, 1.2], [0.46, 1.2], [NOD, 0]]) },
		},
	};

	// a win: three quick bounces in place, the arms swinging out on each
	const CH = 1.6;
	const bounce = [0.0, 0.42, 0.84];
	const cheer = {
		bones: {
			hip: { translate: kxy([[0, 0, 0], ...bounce.flatMap((b) => [[b + 0.1, 0, -10], [b + 0.24, 0, 18], [b + 0.38, 0, -6]]), [1.4, 0, 0], [CH, 0, 0]]) },
			torso: { scale: kxy([[0, 1, 1], ...bounce.flatMap((b) => [[b + 0.1, 1.03, 0.96], [b + 0.24, 0.98, 1.035]]), [1.4, 1, 1], [CH, 1, 1]]) },
			head: { rotate: k([[0, 0], [0.24, -4], [0.66, 4], [1.08, -3], [1.4, 0], [CH, 0]]) },
			armL: { rotate: k([[0, 0], ...bounce.map((b) => [b + 0.24, -22]), ...bounce.map((b) => [b + 0.38, -8]), [1.4, 0], [CH, 0]].sort((a, b) => a[0] - b[0])) },
			armR: { rotate: k([[0, 0], ...bounce.map((b) => [b + 0.26, 22]), ...bounce.map((b) => [b + 0.4, 8]), [1.4, 0], [CH, 0]].sort((a, b) => a[0] - b[0])) },
		},
	};

	// THE BIG ONES: a shimmy, hips swinging out on each of the six beats
	const END = beats[5] + BEAT_GAP + 0.35;
	const hipK = [[0, 0, 0], [0.3, 0, -8]];
	const torR = [[0, 0]];
	const headR = [[0, 0]];
	beats.forEach((b, i) => {
		const s = i % 2 ? 1 : -1;
		hipK.push([b, 12 * s, -6], [b + 0.15, 9 * s, -2]);
		torR.push([b, -4 * s], [b + 0.15, -3 * s]);
		headR.push([b + 0.04, 5 * s], [b + 0.18, 3 * s]);
	});
	const tail = beats[5] + BEAT_GAP;
	hipK.push([tail, 0, -4], [END, 0, 0]);
	torR.push([tail, 0], [END, 0]);
	headR.push([tail, 0], [END, 0]);
	const chestbeat = {
		bones: {
			hip: { translate: kxy(hipK) },
			torso: { rotate: k(torR), scale: kxy([[0, 1, 1], [0.3, 1.02, 0.97], [tail, 1.02, 0.97], [END, 1, 1]]) },
			head: { rotate: k(headR) },
			armL: { rotate: k(torR.map(([t, v]) => [t, v * 3])) },
			armR: { rotate: k(torR.map(([t, v]) => [t, v * 3])) },
			legL: { scale: kxy([[0, 1, 1], [0.3, 1, 0.97], [tail, 1, 0.97], [END, 1, 1]]) },
			legR: { scale: kxy([[0, 1, 1], [0.3, 1, 0.97], [tail, 1, 0.97], [END, 1, 1]]) },
		},
	};

	// meter step: ears up — straightens, head cocked quizzically, then grins
	const AL = 1.4;
	const alert = {
		bones: {
			hip: { translate: kxy([[0, 0, 0], [0.18, 0, 8], [0.9, 0, 7], [1.15, 0, -2], [AL, 0, 0]]) },
			torso: { scale: kxy([[0, 1, 1], [0.18, 0.985, 1.025], [0.9, 0.99, 1.02], [AL, 1, 1]]) },
			head: { rotate: k([[0, 0], [0.2, -9], [0.9, -8], [1.1, 3], [AL, 0]]), translate: kxy([[0, 0, 0], [0.2, 4 * IN, 3], [0.9, 4 * IN, 3], [AL, 0, 0]]) },
		},
	};

	// startle: rocks back on his heels
	const FL = 1.0;
	const flinch = {
		bones: {
			hip: { translate: kxy([[0, 0, 0], [0.12, -6 * IN, 6], [0.4, -5 * IN, 2], [0.7, 0, -2], [FL, 0, 0]]) },
			torso: { rotate: k([[0, 0], [0.12, -5], [0.4, -4], [0.7, 1], [FL, 0]]) },
			head: { rotate: k([[0, 0], [0.12, -7], [0.45, -5], [FL, 0]]) },
		},
	};

	// keep the bubble gum and the chew from the generator; give the cloth his
	// own slow drift (half the Bandit's rate — he is a slower man)
	const FLUT = 4.8;
	const flutterOwn = {
		cuffL: { rotate: wave(FLUT, 1, 3, 1.7) },
		cuffR: { rotate: wave(FLUT, 1, 2.6, 4.4) },
		pantL: { rotate: wave(FLUT, 1, 2.2, 0.2) },
		pantR: { rotate: wave(FLUT, 1, 2, 2.9) },
	};

	return {
		anims: { idle, glance, nod, cheer, chestbeat, alert, flinch },
		flutterBones: flutterOwn,
		loops: { idle: IDLE },
	};
};
