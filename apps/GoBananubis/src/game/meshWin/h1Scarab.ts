/**
 * H1 — THE SCARAB. Crouches, springs off its own shadow, scuttles in the air
 * with the body banking into each stride, drops and lands.
 *
 * The drawing's limits decide the acting: the forelegs stand in open air and
 * take the most swing; the middle and hind legs lie 3-5px off the shell and
 * take less; every leg only OPENS from where it was drawn and comes back,
 * because the other side of each joint is the gap it shares with the head or
 * the shell. Middle and hind legs on one side touch tip-to-root, so each side
 * moves as one (a waddle) — the true tripod gait tore that gap to 2x.
 */
import {
	landFlick,
	boneOf,
	blob,
	bump,
	flick,
	polygon,
	polyline,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const LEGS: Record<string, Point[]> = {
	fore_l: [[91, 100], [84, 86], [86, 70], [92, 55]],
	fore_r: [[165, 101], [173, 88], [172, 72], [166, 55]],
	mid_l: [[86, 120], [76, 130], [73, 146], [80, 158]],
	mid_r: [[170, 118], [180, 126], [184, 142], [178, 156]],
	hind_l: [[88, 160], [79, 168], [84, 184], [106, 199]],
	hind_r: [[168, 160], [177, 168], [174, 184], [150, 199]],
};
/** the rotation sign that swings each leg AWAY from the body (measured by the
 *  gate on the skinned mesh, not trusted from this table) */
export const OPEN: Record<string, number> = { fore_l: -1, fore_r: 1, mid_l: 1, mid_r: -1, hind_l: 1, hind_r: -1 };
const SIDE: Record<string, 0 | 1> = { fore_l: 0, mid_l: 0, hind_l: 0, fore_r: 1, mid_r: 1, hind_r: 1 };

const legPart = (name: string) => {
	const path = LEGS[name];
	const line = polyline(path, 3.5);
	const [px, py] = path[0];
	const [tx, ty] = path[path.length - 1];
	return {
		name,
		parent: 'shell',
		pivot: path[0],
		axis: [tx - px, ty - py] as Point,
		dist: line.dist,
		// hand the weight back to the shell over the first 9px from the joint
		keep: (p: Point) => smoothstep((line.along(p) - 1) / 8),
	};
};

// timing, ms at normal speed
const T = { crouch: 110, rise: 330, fall: 1050, land: 1300, done: 1450, gait: 150 };

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	feetY: 200,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 200,
	rig: {
		grid: { x0: 60, y0: 46, x1: 196, y1: 208, cols: 32, rows: 40 },
		soft: 4,
		parts: [
			{ name: 'shell', pivot: [128.5, 136], axis: [0, -1], dist: blob([128.5, 136], 41.5, 60, 3) },
			{
				name: 'head',
				parent: 'shell',
				pivot: [128, 84],
				axis: [0, -1],
				dist: polygon([[106, 40], [150, 40], [150, 86], [106, 86]]),
				keep: (p) => smoothstep((86 - p[1]) / 10),
			},
			...Object.keys(LEGS).map(legPart),
		],
	},
	// Geometric (check_mesh_wins.mjs H1 --limits, 2026-09-25, on h1_subject):
	//   head   +11 -10.5   fore_l +6 -7      fore_r +9.5 -7.5
	//   mid_l  +11.5 -9    mid_r +7 -8.5     hind_l +11.5 -9    hind_r +10.5 -12
	// The table sits under those, and the side a leg CLOSES toward stays at 3.
	limits: {
		head: { pos: 6, neg: 6 },
		fore_l: { pos: 3, neg: 6.5 },
		fore_r: { pos: 6.5, neg: 3 },
		mid_l: { pos: 6.5, neg: 3 },
		mid_r: { pos: 3, neg: 6.5 },
		hind_l: { pos: 6.5, neg: 3 },
		hind_r: { pos: 3, neg: 6.5 },
	},
	// WALKING (ScarabRunner, the beetle that runs along each paying line): the
	// same waddle as the win's scuttle, driven by distance rather than time, so
	// the feet never skate — and banking into each stride
	walk: (rig, phase, amount) => {
		const pose = restPose(rig);
		const a = Math.max(0, Math.min(1, amount));
		for (const leg of Object.keys(LEGS)) {
			const side = SIDE[leg] === 0 ? 0 : Math.PI;
			const [splay, amp] = leg.startsWith('fore') ? [1, 5] : [1, 5];
			boneOf(rig, pose, leg).angle = OPEN[leg] * a * (splay + amp * (0.5 + 0.5 * Math.sin(phase + side)));
		}
		const head = boneOf(rig, pose, 'head');
		head.angle = -3 * a * Math.sin(phase);
		boneOf(rig, pose, 'shell').across = 1 + 0.015 * a * Math.sin(phase);
		pose.rigid.rot = -2 * a * Math.sin(phase);
		return pose;
	},
	// landing: the legs splay as it hits, the head nods
	land: (rig, t, k, pose) => {
		for (const leg of Object.keys(LEGS)) boneOf(rig, pose, leg).angle = OPEN[leg] * 2.5 * k * Math.max(0, landFlick(t));
		boneOf(rig, pose, 'head').angle = 1.5 * k * landFlick(t, 50);
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		// off the stone: springs up with overshoot, hangs, then FALLS (accelerating)
		const air = track(t, [
			[0, 0],
			[T.crouch, 0],
			[T.rise, 1, 'back'],
			[T.fall, 1],
			[T.land, 0, 'in'],
		]);
		const hover = ramp(t, 250, 380) * (1 - ramp(t, 1000, 1200));
		const gait = (2 * Math.PI * t) / T.gait;
		const idle = ramp(t, T.land, T.done);
		const reach = Math.min(1, air);

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.06, 'out'], [190, 0.96, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 1.06, 'out'], [T.done, 1, 'out']]),
			sy: track(t, [[0, 1], [T.crouch, 0.9, 'out'], [190, 1.07, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.92, 'out'], [T.done, 1, 'out']]),
			// the body banks into each stride
			rot: -1.8 * hover * Math.sin(gait),
			pop: 1 + 0.06 * air,
			dx: 0,
			dy: -9 * air - 1.2 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 500),
		};

		rig.bones.forEach((bone, b) => {
			const p = pose.bones[b];
			if (bone.name === 'shell') {
				p.across = 1 + 0.03 * reach + 0.012 * hover * Math.sin(gait);
				return;
			}
			if (bone.name === 'head') {
				// leans toward whichever foreleg is opening, on the gait's clock —
				// on a clock of its own it pulled the gap between them apart
				p.angle = -3 * hover * Math.sin(gait) + 0.6 * idle * Math.sin((2 * Math.PI * t) / 830) + 2.5 * flick(t, T.land, 3, 6);
				p.along = 1 + 0.08 * reach;
				return;
			}
			const fore = bone.name.startsWith('fore');
			const [splay, amp] = fore ? [2.5, 3.5] : [2, 4];
			const phase = SIDE[bone.name] === 0 ? 0 : Math.PI;
			const deg =
				splay * reach +
				amp * hover * (0.5 + 0.5 * Math.sin(gait + phase)) +
				1.2 * idle * Math.sin((2 * Math.PI * t) / 830 + phase);
			p.angle = OPEN[bone.name] * deg;
			p.along = 1 + 0.06 * reach;
		});

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.55 * track(t, [[T.crouch, 0], [200, 1, 'out'], [600, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 950 ? (t - 380) / 570 : -1;
		pose.plateHit = 1 + 0.04 * bump(t, T.crouch, 380) + 0.025 * bump(t, T.land, T.land + 140);
		return pose;
	},
};
