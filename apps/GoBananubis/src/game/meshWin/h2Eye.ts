/**
 * H2 — THE EYE OF HORUS. It is an eye, so it acts like one: squints on the
 * wind-up, flies wide open with the pupil dilating and the brow shooting up,
 * looks left, looks right — the whole carving leaning after its gaze — then
 * blinks hard, brow pressing down with the lids, and lands. The spiral and the
 * teardrop are the loose ends: they are never driven, only flicked by the
 * moves around them, and swing on their own springs after (follow-through).
 *
 * The pupil touches both lids, so its darts are horizontal; its pull fades out
 * vertically (see the pupil's `keep`) so the lid lines do not ride along.
 */
import {
	landFlick,
	boneOf,
	bump,
	circle,
	flick,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { crouch: 120, rise: 300, fall: 1100, land: 1320, done: 1500 };

const PUPIL: [number, number] = [149, 114];
const tail = polyline([[158, 132], [128, 152], [100, 176], [86, 184]], 6);
const drop = polyline([[170, 127], [171, 160], [169, 196]], 7);

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	feetY: 196,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 210,
	collapsible: ['eye', 'pupil'],
	rig: {
		grid: { x0: 36, y0: 52, x1: 220, y1: 206, cols: 44, rows: 38 },
		soft: 4,
		parts: [
			// The strokes nothing else moves: the lower rear line, the brow's
			// curl into the eye's back corner, and the junction the tail and the
			// teardrop hang from. Everywhere else it reads as FAR (14px), so the
			// air round a moving part follows that part — a nearer constant
			// pinned the air above the brow and folded its top edge on the rise.
			{
				name: 'face',
				pivot: [128, 130],
				dist: (p) =>
					Math.min(
						14,
						union(
							polygon([[40, 101], [104, 101], [96, 118], [92, 126], [40, 127]]),
							polygon([[196, 86], [216, 86], [216, 126], [200, 124]]),
							polygon([[150, 128], [182, 124], [182, 142], [150, 142]]),
						)(p),
					),
			},
			{
				name: 'brow',
				parent: 'face',
				pivot: [120, 84],
				axis: [1, 0],
				dist: polygon([[40, 64], [214, 60], [214, 93], [150, 92], [120, 95], [40, 99]]),
				// Moves over the eye only. Its right end curls down into the eye's
				// back corner, and its left end runs 2px above the lower rear line —
				// moving either sheared that gap (fold 56%, stretch 166%) — so both
				// ends stay with the face.
				keep: (p) => smoothstep((198 - p[0]) / 14) * smoothstep((p[0] - 92) / 26),
			},
			{
				name: 'eye',
				parent: 'face',
				// low in the almond: in a blink the UPPER lid does the travelling.
				// Collapsing about the middle lifted the lower lid 15px and tore
				// the tail stroke under it
				pivot: [148, 122],
				axis: [1, 0],
				priority: 1,
				dist: polygon([
					[96, 118], [112, 106], [130, 98], [150, 95], [172, 98], [192, 108],
					[204, 118], [190, 128], [160, 136], [130, 137], [108, 132],
				]),
			},
			{
				name: 'pupil',
				parent: 'eye',
				pivot: PUPIL,
				axis: [1, 0],
				priority: 6,
				dist: circle(PUPIL, 14),
				// wide sideways, tight up and down: the lids hug the pupil
				keep: (p) => {
					const e = Math.hypot((p[0] - PUPIL[0]) / 26, (p[1] - PUPIL[1]) / 17);
					return smoothstep((1 - e) / 0.35);
				},
			},
			{
				name: 'drop',
				parent: 'face',
				pivot: [170, 127],
				axis: [0, 1],
				dist: drop.dist,
				keep: (p) => smoothstep((drop.along(p) - 2) / 12),
			},
			{
				name: 'tail',
				parent: 'face',
				pivot: [158, 132],
				axis: [-72, 52],
				dist: tail.dist,
				keep: (p) => smoothstep((tail.along(p) - 2) / 14),
			},
			{ name: 'curl', parent: 'tail', pivot: [66, 168], priority: 2, dist: circle([66, 168], 24) },
		],
	},
	// Geometric (check_mesh_wins.mjs H2 --limits, 2026-09-25):
	//   brow +9 -16   drop +9.5 -11   tail +8 -7   curl +25.5 -16.5
	// eye and pupil are never rotated (0.5 is "none"): they scale and slide.
	limits: {
		brow: { pos: 3, neg: 3 },
		eye: { pos: 0.5, neg: 0.5 },
		pupil: { pos: 0.5, neg: 0.5 },
		drop: { pos: 8, neg: 8 },
		tail: { pos: 4, neg: 4 },
		curl: { pos: 16, neg: 16 },
	},
	// landing: it winces — a squint on the impact — and the loose ends swing
	land: (rig, t, k, pose) => {
		boneOf(rig, pose, 'eye').across = 1 - 0.28 * k * Math.max(0, landFlick(t, 20));
		boneOf(rig, pose, 'brow').dy = 2 * k * Math.max(0, landFlick(t, 20));
		boneOf(rig, pose, 'curl').angle = 7 * k * landFlick(t, 60);
		boneOf(rig, pose, 'drop').angle = 3 * k * landFlick(t, 50);
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const hover = ramp(t, 260, 420) * (1 - ramp(t, 1000, 1200));
		const idle = ramp(t, T.land, T.done);

		// the gaze: fast darts, held — an eye never drifts
		const lookX = track(t, [
			[0, 0], [380, 0], [430, -5, 'out'], [600, -5], [640, 5, 'out'], [800, 5], [850, 0, 'out'],
		]);
		const lookY = track(t, [[380, 0], [430, 1, 'out'], [600, 1], [640, -1, 'out'], [800, -1], [850, 0, 'out']]);
		// the carving leans after its gaze, but LATER and SLOWER than the pupil:
		// on the pupil's own track the whole piece snapped with every dart
		const lean = track(t, [[0, 0], [400, 0], [520, -5, 'inOut'], [610, -5], [740, 5, 'inOut'], [810, 5], [940, 0, 'inOut']]);

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.04, 'out'], [200, 0.97, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 1.05, 'out'], [T.done, 1, 'out']]),
			sy: track(t, [[0, 1], [T.crouch, 0.92, 'out'], [200, 1.06, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 0.93, 'out'], [T.done, 1, 'out']]),
			// the carving leans after its own gaze
			rot: 0.45 * lean,
			pop: 1 + 0.05 * air,
			dx: 0.6 * lean,
			dy: -7 * air - 1.5 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 620),
		};

		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		const eye = b('eye');
		eye.across = track(t, [
			[0, 1], [T.crouch, 0.8, 'out'], [T.rise, 1.16, 'back'], [450, 1.06],
			[880, 1.06], [930, 0.3, 'in'], [975, 0.3], [1060, 1.1, 'out'], [1180, 1.02],
			[T.land, 1], [T.land + 60, 0.9, 'out'], [T.done, 1, 'out'],
		]);

		const pupil = b('pupil');
		pupil.dx = lookX;
		pupil.dy = lookY;
		const dilate = 1 + 0.12 * bump(t, T.crouch, 440);
		pupil.along = dilate;
		pupil.across = dilate;

		const brow = b('brow');
		brow.dy = track(t, [
			// the blink presses the brow DOWN with the lid: it takes part of the
			// lid's travel, so the skin between them is not stretched on its own
			[0, 0], [T.crouch, 3, 'out'], [T.rise, -5, 'back'], [460, -4], [880, -4],
			[930, 4, 'in'], [975, 4], [1060, -3.5, 'out'], [1250, -1], [T.land, 0], [T.land + 60, 1.5, 'out'], [T.done, 0, 'out'],
		]);
		// one brow up, the other down — the look of an eye weighing you up
		brow.angle = track(t, [[460, 0], [600, -2.5, 'out'], [800, 2, 'inOut'], [1000, 0]]);

		// the loose ends: flicked by the hit and the landing, never driven
		b('drop').angle = 5 * flick(t, T.rise, 1.8, 2.6) - 5 * flick(t, T.land, 2.4, 4) + 1.2 * idle * Math.sin((2 * Math.PI * t) / 900);
		b('tail').angle = -3 * flick(t, T.rise + 20, 1.6, 3) + 2 * flick(t, T.land + 10, 2, 4);
		const curl = b('curl');
		curl.angle = 14 * flick(t, T.rise + 60, 1.3, 2.2) - 8 * flick(t, T.land + 20, 1.8, 3.5) + 2 * idle * Math.sin((2 * Math.PI * t) / 1100);

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.5 * track(t, [[T.crouch, 0], [210, 1, 'out'], [650, 0, 'in']]);
		pose.sheen = t >= 420 && t <= 1000 ? (t - 420) / 580 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 400) + 0.025 * bump(t, T.land, T.land + 140);
		return pose;
	},
};
