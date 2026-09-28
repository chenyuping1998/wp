/**
 * H1 — THE DIVING HELMET. Crouches onto its breastplate, springs off the steel,
 * and while it hangs the dome rocks on its collar the way a diver's head turns
 * inside it — left, right, a nod — with the air hose whipping after it. Drops,
 * lands, the dome nods once more.
 *
 * The dome is the part with room: it is a ball on a collar, and the collar
 * band is where the bend is absorbed. The hose loops tight against the
 * breastplate, so it gets small swings on a long blend rather than a big one.
 */
import {
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

const T = { crouch: 110, rise: 330, fall: 1050, land: 1300, done: 1450 };
const HOSE = polyline([[58, 166], [40, 178], [35, 196], [48, 210], [72, 215], [95, 213]], 10);

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	feetY: 230,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 200,
	// the launch is ~15 board px in one frame: two trailing ghosts sell it as a
	// spring off the steel instead of a jump cut
	// `trail` pulls each ghost back ALONG the motion, past where the helmet
	// really was: the launch is mostly a stretch and a pop, so the true past
	// poses sat almost under the helmet and the ghosts hid behind it
	// (trail 1.3 since the leap: the flight is big enough to show the ghosts
	// on its own, and 2.6 flung them a cell away)
	smear: { ghosts: 2, stepMs: 26, alpha: 0.38, fullAtPx: 8, trail: 1.3 },
	rig: {
		grid: { x0: 22, y0: 24, x1: 218, y1: 240, cols: 44, rows: 48 },
		soft: 4,
		parts: [
			{
				name: 'body',
				pivot: [128, 200],
				axis: [0, -1],
				dist: polygon([[44, 150], [212, 150], [212, 212], [190, 230], [130, 236], [68, 226], [44, 204]]),
			},
			{
				name: 'dome',
				parent: 'body',
				pivot: [128, 152],
				axis: [0, -1],
				dist: union(circle([126, 98], 66), circle([78, 112], 26), circle([158, 112], 36), circle([194, 102], 12)),
				// a wide blend through the collar band: that is where the bend lives
				keep: (p) => smoothstep((160 - p[1]) / 24),
			},
			{
				name: 'hose',
				parent: 'body',
				pivot: [58, 166],
				axis: [-18, 30],
				priority: 3,
				dist: HOSE.dist,
				keep: (p) => smoothstep((HOSE.along(p) - 4) / 16),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs --limits, 2026-09-25, on the 512 layers):
	//   dome +4.5 -4    hose +8.5 -7
	// The table sits under those.
	limits: {
		dome: { pos: 3.5, neg: 3.5 },
		hose: { pos: 6.5, neg: 6.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const hover = ramp(t, 250, 380) * (1 - ramp(t, 1000, 1200));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.06, 'out'], [190, 0.96, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 1.06, 'out'], [T.done, 1, 'out']]),
			sy: track(t, [[0, 1], [T.crouch, 0.9, 'out'], [190, 1.07, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.92, 'out'], [T.done, 1, 'out']]),
			rot: 1.2 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 640),
			// BIGGER JUMP (2026-09-27, asked for): the rigid move carries it — it moves
			// every vertex alike, so it costs nothing against the mesh's limits.
			pop: 1 + 0.1 * air,
			dx: 0,
			dy: -15 * air - 1.6 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 500),
		};

		// the head inside it looks left, right, and nods on the landing
		b('dome').angle =
			3.2 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 700) + 2.2 * flick(t, T.land, 2.6, 5);
		b('dome').along = 1 + 0.03 * Math.min(1, air);
		// the hose whips after the dome, later and decaying
		// sized for the screen: at 3 degrees it moved ~1px there — invisible
		const whip = flick(t, 220, 2.2, 2.4);
		b('hose').angle = 5.5 * whip - 4 * flick(t, T.land + 30, 2.8, 4);
		b('hose').along = 1 + 0.08 * Math.abs(whip);

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.55 * track(t, [[T.crouch, 0], [200, 1, 'out'], [600, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 950 ? (t - 380) / 570 : -1;
		pose.plateHit = 1 + 0.04 * bump(t, T.crouch, 380) + 0.025 * bump(t, T.land, T.land + 140);
		return pose;
	},
};
