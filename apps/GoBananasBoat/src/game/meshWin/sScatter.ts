/**
 * S — THE BANANA NET. A net of bananas hung from a cargo hook. It does not
 * hop: it is kicked on the hit, SWINGS from the knot under the hook like the
 * load it is, bounces on the rope (a stretch along the hang, twice), and the
 * loose bananas at its foot wag a beat after the net.
 *
 * The hook and the rope above the knot stay on the steel — the net hangs from
 * them — and so does the SCATTER plaque under it (design/make_symbol_layers.mjs).
 */
import {
	bump,
	flick,
	polygon,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { hit: 120, done: 1500 };
const KNOT: [number, number] = [132, 54];
const NET = polygon([[28, 112], [56, 66], [100, 46], [132, 40], [168, 46], [210, 66], [230, 110], [232, 160], [230, 216], [196, 226], [166, 224], [130, 218], [78, 212], [42, 194], [28, 160]]);
const LOOSE = polygon([[164, 158], [238, 158], [238, 232], [164, 232]]);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	feetY: 226,
	durationMs: T.done,
	landMs: 1180,
	hitMs: 190,
	noDust: true,
	rig: {
		grid: { x0: 22, y0: 28, x1: 242, y1: 236, cols: 50, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'knot', pivot: KNOT, axis: [0, -1], dist: polygon([[118, 28], [148, 28], [148, 58], [118, 58]]) },
			{
				name: 'bunch',
				parent: 'knot',
				pivot: KNOT,
				axis: [0, 1],
				dist: NET,
				// radial round the knot, not a band across the net's width
				keep: (p) => smoothstep((Math.hypot(p[0] - KNOT[0], p[1] - KNOT[1]) - 6) / 18),
			},
			{
				name: 'loose',
				parent: 'bunch',
				pivot: [182, 166],
				axis: [1, 1],
				priority: 3,
				dist: LOOSE,
				keep: (p) => smoothstep((p[0] - 170) / 16),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs --limits, 2026-09-25, on the 512 layers):
	//   bunch +39 -40 (radial round the knot; 5.5 with a band)   loose +5 -6
	// The swing is kept to a real load's swing, far under what the mesh allows.
	limits: {
		// 10 (2026-09-27): the swing was a quarter of a real kicked load's and
		// read as a nudge; still a quarter of what the mesh allows
		bunch: { pos: 10, neg: 10 },
		loose: { pos: 5, neg: 5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// kicked, swinging out and back from the knot, dying away through the hold
		// BALANCED against the helmet (2026-09-26): the review measured the hanging and
		// bolted symbols moving a quarter of what the helmet did (4.5-7.9 board px
		// against 18.8), so a line of mixed symbols read as some acting and some not.
		// They cannot hop, so the size goes into the swing, inside the measured limits.
		// out wide on the kick, back through, and a smaller return — a heavy load
		// on a rope: the second half-swing is shorter than the first
		b('bunch').angle = 9.5 * flick(t, T.hit, 1.25, 1.6);
		// the rope takes the weight: a bounce along the hang
		b('bunch').along = 1 + 0.06 * Math.max(0, flick(t, T.hit + 60, 2.2, 2.6)) + 0.025 * bump(t, 1100, 1280);
		b('bunch').across = 1 - 0.015 * Math.max(0, flick(t, T.hit + 60, 2.2, 2.6));
		// the loose bananas at the foot wag after the net
		b('loose').angle = -5 * flick(t, T.hit + 170, 1.9, 2.2);
		pose.rigid = {
			sx: 1,
			sy: 1,
			rot: 0,
			// BIGGER JUMP (2026-09-27, asked for): the rigid move carries it — it moves
			// every vertex alike, so it costs nothing against the mesh's limits.
			pop: 1 + 0.09 * track(t, [[0, 0], [T.hit, 0], [260, 1, 'out'], [700, 0.25], [1150, 0]]),
			dx: 0,
			dy: -8 * track(t, [[0, 0], [T.hit, 0], [230, 1, 'back'], [520, 0.2], [900, 0]]),
		};
		pose.air = 0.3 * track(t, [[0, 0], [T.hit, 0], [230, 1, 'out'], [900, 0]]);
		pose.flash = 0.4 * track(t, [[T.hit, 0], [220, 1, 'out'], [650, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 1000 ? (t - 380) / 620 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.hit, 400) + 0.02 * bump(t, 1100, 1260);
		return pose;
	},
};
