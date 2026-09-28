/**
 * H4 — THE MINE CART FULL OF BANANAS. It squats on its axle and rocks on its
 * wheels, and the load JOSTLES: the pile is thrown down into the cart, bounces
 * back up, and wobbles side to side a beat behind the cart.
 *
 * PANEL mode: the cart stands on rails painted onto its plate, so a cut would
 * have taken the rails or left the wheels floating.
 *
 * WHY THE LOAD NEVER GOES UP. The bananas reach y 17-25 all the way across —
 * practically touching the frame. A hop of any size folded the strip between
 * them and the frame (to 11%, then 1.7% when the cart was faded instead). So
 * every move here goes DOWN or sideways, the pile's top rows hand their weight
 * back toward the frame, and `inked` follows the drawing's real top edge so
 * the plain stone above the pile is what takes the stretch.
 *
 * Coordinates are the 256 canvas (h4.png, 2026-09-25): bananas (23..218,
 * 17..110), cart box (18..238, 80..215), wheels and rails below.
 */
import {
	bump,
	flick,
	panelParts,
	polygon,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [16, 14, 240, 240];
const T = { crouch: 110, rise: 300, fall: 700, land: 860, done: 1400 };

const CART = polygon([[18, 84], [238, 76], [232, 196], [204, 218], [56, 218], [26, 196]]);
const LOAD = polygon([[26, 58], [70, 30], [120, 22], [176, 20], [214, 44], [226, 92], [28, 100]]);
const ALL = polygon([[20, 62], [70, 30], [122, 22], [176, 20], [216, 44], [238, 78], [232, 196], [204, 236], [56, 236], [26, 196]]);

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	sprite: 'gbH4',
	mode: 'panel',
	feetY: 218,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 240,
	sparkAt: [128, 60],
	inked: (p) => ALL(p) === 0,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'cart',
				parent: 'panel',
				// rocks on its wheels
				pivot: [128, 212],
				axis: [0, -1],
				priority: 1,
				dist: CART,
				// the cart runs to within 2px of the frame on both sides: its edges
				// hand their weight back there, or its rock folded the strip (47%)
				keep: (p) => smoothstep((Math.min(p[0] - 16, 240 - p[0]) - 2) / 18),
			},
			{
				name: 'load',
				// Hung from the PANEL, not the cart, and made to follow the cart in
				// the pose instead. As the cart's child, the top rows' faded weight
				// fell to the cart, whose squash pivots at the wheels 186px below —
				// a 5% squash dragged the top of the pile 9px down (stretch 184%).
				parent: 'panel',
				pivot: [128, 100],
				axis: [0, -1],
				priority: 3,
				dist: LOAD,
				// rides up out of the cart's mouth; the top rows hand their weight
				// back as they near the frame band
				keep: (p) =>
					smoothstep((106 - p[1]) / 20) *
					smoothstep((p[1] - 18) / 24) *
					smoothstep((Math.min(p[0] - 16, 240 - p[0]) - 2) / 18),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H4 --limits, 2026-09-25):
	//   cart +3.5 -3 (the load's left end, where it meets the frame)   load +5 -5
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		cart: { pos: 2.4, neg: 2.2 },
		load: { pos: 3.5, neg: 3.5 },
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
		const mouth = (1 - cart.along) * (212 - 100) + cart.dy;
		// the load: thrown down into the cart a beat after it squats, bouncing
		// back on a spring, and a second, smaller jolt on the landing
		const load = b('load');
		load.dy = mouth + LOAD_SINK * (Math.max(0, bump(t, T.crouch, 330)) + 0.35 * Math.max(0, bump(t, T.land + 20, T.land + 200))) - 0.25 * LOAD_SINK * Math.max(0, flick(t, 330, 2.6, 4));
		load.across = 1 + 0.05 * bump(t, T.crouch, 330) + 0.04 * bump(t, T.land + 20, T.land + 200);
		// and it wobbles side to side behind the cart's rock
		load.angle = cart.angle + 1.6 * flick(t, 300, 2.2, 2.4) - 1 * flick(t, T.land + 40, 2.6, 4);

		pose.air = 0;
		pose.flash = 0.3 * track(t, [[T.crouch, 0], [240, 1, 'out'], [620, 0, 'in']]) + 0.14 * bump(t, T.land, T.land + 220);
		pose.sheen = t >= 380 && t <= 920 ? (t - 380) / 540 : -1;
		pose.plateHit = 1 + 0.03 * bump(t, T.crouch, 400) + 0.035 * bump(t, T.land, T.land + 160);
		return pose;
	},
};

// set from the measured limits
const ROCK_DEG = 1.1;
const LOAD_SINK = 4;
