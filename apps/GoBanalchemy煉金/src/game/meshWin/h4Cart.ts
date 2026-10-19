/** Alchemy v2: fixed plate; independently weighted painted parts perform.
 * No rigid flip, tile jump, or impact dust. Geometry follows the repaint. */
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

const T = { crouch: 110, rise: 300, fall: 700, land: 880, done: 1400 };

const CART = polygon([[30, 88], [228, 82], [226, 108], [206, 172], [140, 198], [62, 176], [36, 108]]);
const LOAD = polygon([[52, 84], [54, 40], [72, 30], [100, 28], [118, 18], [146, 18], [176, 30], [178, 104], [150, 114], [60, 102]]);
const COIL = polygon([[176, 34], [210, 32], [214, 100], [178, 104]]);
const ALL = polygon([[28, 86], [54, 36], [118, 16], [146, 16], [212, 30], [230, 84], [226, 112], [228, 198], [150, 228], [36, 202]]);

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	sprite: 'gbH4',
	mode: 'panel',
	inked: (p) => ALL(p) === 0,
	feetY: 214,
	durationMs: T.done,
	landMs: 99999,
	hitMs: 240,
	sparkAt: [128, 60],
	rig: {
		fixedBorder: 10,
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			// the rails and whatever else is drawn: the root
			{ name: 'frame', pivot: [128, 128], dist: () => 14 },
			{ name: 'panel', parent: 'frame', pivot: [136, 214], axis: [0, -1], dist: ALL },
			{
				name: 'cart',
				parent: 'panel',
				// rocks on its wheels
				pivot: [136, 196],
				axis: [0, -1],
				priority: 1,
				dist: CART,
			},
			{
				name: 'load',
				// hung from the PANEL, not the cart, and made to follow the cart in
				// the pose: as the cart's child, the top rows' faded weight fell to
				// the cart, whose squash pivots at the wheels far below
				parent: 'panel',
				pivot: [118, 100],
				axis: [0, -1],
				priority: 3,
				dist: LOAD,
				keep: (p) => smoothstep((108 - p[1]) / 18),
			},
			{
				name: 'coil',
				parent: 'panel',
				// sprung from its foot in the cart
				pivot: [196, 102],
				axis: [0, -1],
				priority: 4,
				dist: COIL,
				keep: (p) => smoothstep((106 - p[1]) / 16) * smoothstep((p[1] - 28) / 14),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H4 --limits, 2026-10-04) — see the gate
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		cart: { pos: 2.4, neg: 2.4 },
		load: { pos: 3, neg: 3 },
		coil: { pos: 4, neg: 4 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the cart: squats on its springs, pops, rocks, lands with a bump
		const cart = b('cart');
		cart.along = track(t, [[0, 1], [T.crouch, 0.97, 'out'], [260, 1, 'out'], [T.land - 20, 1], [T.land + 50, 0.975, 'out'], [1180, 1]]);
		cart.across = track(t, [[0, 1], [T.crouch, 1.015, 'out'], [260, 1, 'out'], [T.land - 20, 1], [T.land + 50, 1.012, 'out'], [1180, 1]]);
		cart.dy = 2 * bump(t, 60, 260) + 1.5 * bump(t, T.land, T.land + 160);
		cart.angle = ROCK_DEG * flick(t, 260, 1.8, 2.4) - 0.8 * ROCK_DEG * flick(t, T.land, 2.6, 4);

		// where the cart's mouth (y 100) is this frame, so the load sits in it
		const mouth = (1 - cart.along) * (196 - 100) + cart.dy;
		const load = b('load');
		load.dy = mouth + LOAD_SINK * (Math.max(0, bump(t, T.crouch, 330)) + 0.35 * Math.max(0, bump(t, T.land + 20, T.land + 200))) - 0.25 * LOAD_SINK * Math.max(0, flick(t, 330, 2.6, 4));
		load.across = 1 + 0.045 * bump(t, T.crouch, 330) + 0.035 * bump(t, T.land + 20, T.land + 200);
		load.angle = cart.angle + 1.5 * flick(t, 300, 2.2, 2.4) - 1 * flick(t, T.land + 40, 2.6, 4);

		// the coil: compressed with the load, then boinging long after
		const coil = b('coil');
		coil.dy = mouth;
		coil.along = 1 - 0.06 * bump(t, T.crouch, 300) + 0.07 * flick(t, 300, 3.2, 2.2) + 0.04 * flick(t, T.land + 30, 3.4, 3);
		coil.angle = 2.4 * flick(t, 320, 2.1, 2.2);

		return pose;
	},
};

// set from the measured limits
const ROCK_DEG = 1.1;
const LOAD_SINK = 4;
