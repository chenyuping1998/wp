/**
 * W — THE MINER. A character, so it acts like one: ducks on the wind-up, comes
 * up with the helmet lamp flaring, chomps the banana twice with the banana
 * wagging on each bite, and gives one last chomp as it settles.
 *
 * PANEL mode, and the head fills the whole tile — the helmet reaches y 4 and
 * the fur runs off the left and bottom edges — so, like GoBananubis's Wild, it
 * cannot lift at all. The head bobs a few px about its middle and hands its
 * weight back to the panel toward every edge; the size of the win is in the
 * jaw, the banana and the lamp.
 *
 * Coordinates are the 256 canvas (w.png, 2026-09-25): helmet lamp
 * (145..210, 24..89), mouth ~(150,160), banana from (122,172) down-left to
 * (62,236).
 */
import {
	bump,
	flick,
	panelParts,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [14, 14, 242, 242];
const T = { crouch: 120, rise: 320, bite1: 420, bite2: 700, land: 1180, done: 1500 };

const HEAD = polygon([[20, 30], [90, 8], [200, 8], [236, 60], [240, 200], [224, 244], [20, 244]]);
const JAW = polygon([[70, 158], [214, 148], [222, 236], [70, 244]]);
const BANANA = polyline([[124, 170], [92, 200], [62, 236]], 13);
const edgeDepth = (p: [number, number]) => Math.min(p[0] - 4, p[1] - 4, 252 - p[0], 252 - p[1]);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	mode: 'panel',
	feetY: INNER[3],
	durationMs: T.done,
	landMs: T.land,
	hitMs: 300,
	sparkAt: [182, 58],
	inked: (p) => HEAD(p) === 0,
	// light the helmet, the lamp and the banana — the bright, coloured things —
	// not the dark fur, which a flash only turns muddy
	inkColor: (r, g, b) => Math.max(r, g, b) > 140 && Math.max(r, g, b) - Math.min(r, g, b) > 50,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'head',
				parent: 'panel',
				// scaled about its middle: from the chin, every 1% of growth pushed
				// the helmet up into the strip under the frame (GoBananubis's Wild)
				pivot: [128, 128],
				axis: [0, -1],
				priority: 1,
				dist: HEAD,
				keep: (p) => smoothstep(edgeDepth(p) / 22),
			},
			{
				name: 'jaw',
				parent: 'head',
				pivot: [150, 156],
				axis: [0, 1],
				priority: 3,
				dist: JAW,
				keep: (p) => smoothstep((p[1] - 152) / 16) * smoothstep(edgeDepth(p) / 16),
			},
			{
				name: 'banana',
				parent: 'jaw',
				pivot: [124, 170],
				axis: [-1, 1.1],
				priority: 5,
				dist: BANANA.dist,
				keep: (p) => smoothstep((BANANA.along(p) - 6) / 16) * smoothstep(edgeDepth(p) / 14),
			},
		],
	},
	// geometric (check_mesh_wins.mjs W --limits, 2026-09-25):
	//   head +4 -4, jaw +4.5 -5 (neither turned)   banana +6.5 -7.5
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		head: { pos: 1, neg: 1 },
		jaw: { pos: 1, neg: 1 },
		banana: { pos: 4.8, neg: 5.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the head: ducks, comes up, a small bob while it chews
		const head = b('head');
		const chew = ramp(t, T.bite1 - 60, T.bite1) * (1 - ramp(t, T.bite2 + 240, T.bite2 + 360));
		head.dy = track(t, [[0, 0], [T.crouch, 3, 'out'], [T.rise, -2.5, 'back'], [T.bite1, 0]]) + 1.2 * chew * Math.sin((2 * Math.PI * (t - T.bite1)) / 280);
		head.along = track(t, [[0, 1], [T.crouch, 0.97, 'out'], [T.rise, 1.02, 'out'], [T.bite1 + 60, 1], [T.land - 20, 1], [T.land + 50, 0.985, 'out'], [T.done, 1, 'out']]);
		head.across = track(t, [[0, 1], [T.crouch, 1.02, 'out'], [T.rise, 0.99, 'out'], [T.bite1 + 60, 1]]);

		// two bites and a last one on the landing: the jaw closes (shorter) and
		// the banana kicks down with each
		const bite = (t0: number) => bump(t, t0, t0 + 150);
		const bites = bite(T.bite1) + bite(T.bite2) + 0.6 * bite(T.land);
		const jaw = b('jaw');
		jaw.along = 1 - 0.05 * bites;
		jaw.dy = -2 * bites;
		// + swings the banana's tip down (measured on the render)
		b('banana').angle =
			BANANA_DEG * (flick(t, T.bite1, 3, 3.2) + 0.8 * flick(t, T.bite2, 3, 3.2) + 0.5 * flick(t, T.land, 3.4, 4.5));

		pose.air = 0;
		// the lamp's flare is the hit
		pose.flash = 0.45 * track(t, [[T.crouch, 0], [300, 1, 'out'], [720, 0, 'in']]) + 0.15 * bump(t, T.land, T.land + 200);
		pose.sheen = t >= 440 && t <= 1000 ? (t - 440) / 560 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 440) + 0.02 * bump(t, T.land, T.land + 140);
		return pose;
	},
};

// set from the measured limit
const BANANA_DEG = 3;
