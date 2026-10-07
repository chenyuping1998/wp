/**
 * H3 — THE BANANA CHEST. Squats and the lid dips; bursts up, the lid springing
 * open and the three bunches popping out one after another (overlap, not all
 * on one frame); rocks in the air while the lid bounces on its spring and the
 * bananas bounce in the box; lands, the lid slams and the bananas jump from the
 * impact.
 *
 * The lid "opens" by scaling ACROSS its hinge line: the free edge rises and
 * falls, which reads as the lid swinging on its hinge without any art the
 * drawing does not have. The bananas' bases stay on the gold front rim (see
 * their `keep`), so a bunch rising STRETCHES up out of the box rather than
 * sliding off it — they are sitting in it, and the rim hides their ends.
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
	spring,
	track,
	union,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { crouch: 130, rise: 300, fall: 1050, land: 1300, done: 1480 };

const stalk = polyline([[188, 108], [196, 96], [200, 84]], 5);

/** only upward: repeated hops decaying, like something bouncing in a box */
const hops = (t: number, t0: number, hz: number, decay: number) => Math.abs(flick(t, t0, hz, decay));

// A bunch keeps its weight above the rim and hands it back to the box below,
// over 14px: at 9 a 4.5px hop stretched that band to 1.7x at both ends of the
// load, where the box walls leave nothing else to give.
const onRim = (rimY: number) => (p: [number, number]) => smoothstep((rimY - p[1]) / 14);

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	feetY: 210,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 220,
	rig: {
		grid: { x0: 38, y0: 44, x1: 218, y1: 216, cols: 42, rows: 40 },
		soft: 4,
		parts: [
			// The box body and the dark interior under the lid. Far (14px)
			// everywhere else, so the air round the lid and the bananas follows
			// them rather than pinning their edges.
			{
				name: 'box',
				pivot: [128, 160],
				dist: (p) =>
					Math.min(
						14,
						union(
							polygon([[44, 108], [186, 104], [212, 112], [210, 198], [172, 214], [48, 200]]),
							polygon([[60, 90], [172, 82], [196, 98], [184, 108], [60, 108]]),
						)(p),
					),
			},
			{
				name: 'lid',
				parent: 'box',
				pivot: [128, 90],
				axis: [1, 0],
				dist: polygon([[46, 86], [80, 56], [170, 52], [208, 92], [196, 97], [170, 82], [60, 90]]),
				// the hinge row stays with the box
				keep: (p) => smoothstep((90 - p[1]) / 6),
			},
			// All the bananas as one load, doing the main hop, with each bunch
			// adding a little of its own on top. Hopping the bunches separately
			// tore whatever lay between them (a banana lying across the gap
			// stretched to 1.68x): the load moves together, the bunches overlap.
			{
				name: 'bananas',
				parent: 'box',
				pivot: [128, 112],
				axis: [0, -1],
				priority: 3,
				dist: union(blob([82, 104], 26, 11), blob([112, 98], 11, 14), blob([164, 103], 26, 10), polyline([[186, 110], [196, 96], [200, 84]], 5).dist),
				keep: onRim(111),
			},
			{
				name: 'banL',
				parent: 'bananas',
				pivot: [82, 112],
				axis: [0, -1],
				priority: 5,
				dist: blob([82, 104], 26, 11),
				keep: onRim(111),
			},
			{
				name: 'banC',
				parent: 'bananas',
				pivot: [112, 112],
				axis: [0, -1],
				priority: 5,
				dist: blob([112, 98], 11, 14),
				keep: onRim(111),
			},
			{
				name: 'banR',
				parent: 'bananas',
				pivot: [176, 112],
				axis: [0, -1],
				priority: 5,
				dist: union(blob([164, 103], 26, 10), polyline([[186, 110], [196, 96], [200, 84]], 5).dist),
				keep: onRim(110),
			},
			// the one banana standing up out of the right bunch: it alone wags.
			// Wagging the whole bunch about its base swung the bunch's far end
			// 3px against its neighbour and tore the banana lying between.
			{
				name: 'stalk',
				parent: 'banR',
				pivot: [188, 108],
				axis: [12, -24],
				priority: 7,
				dist: stalk.dist,
				keep: (p) => smoothstep((stalk.along(p) - 1) / 8),
			},
		],
	},
	// Geometric (check_mesh_wins.mjs H3 --limits, 2026-09-25): stalk +37.5
	// -28. The rest are not rotated at all (0.5 is "none"): the lid swings by
	// scale about its hinge, the bananas by translation.
	limits: {
		lid: { pos: 0.5, neg: 0.5 },
		bananas: { pos: 0.5, neg: 0.5 },
		banL: { pos: 0.5, neg: 0.5 },
		banC: { pos: 0.5, neg: 0.5 },
		banR: { pos: 0.5, neg: 0.5 },
		stalk: { pos: 8, neg: 8 },
	},
	// landing: the lid jolts on its hinge and the bananas jump in the box
	land: (rig, t, k, pose) => {
		boneOf(rig, pose, 'lid').across = 1 - 0.14 * k * landFlick(t, 30);
		boneOf(rig, pose, 'bananas').dy = -2.5 * k * Math.max(0, landFlick(t, 60));
		boneOf(rig, pose, 'stalk').angle = 4 * k * landFlick(t, 80);
	},
	// IDLE: the lid lifts a crack, the bananas peek up and the stalk waggles,
	// and it all settles shut again
	idle: (rig, t) => {
		const pose = restPose(rig);
		boneOf(rig, pose, 'lid').across = 1 + 0.16 * bump(t, 120, 760);
		boneOf(rig, pose, 'bananas').dy = -3 * bump(t, 220, 720);
		boneOf(rig, pose, 'stalk').angle = 5 * Math.sin((2 * Math.PI * (t - 220)) / 320) * bump(t, 220, 900);
		return pose;
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const hover = ramp(t, 260, 420) * (1 - ramp(t, 950, 1150));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.06, 'out'], [210, 0.96, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 1.07, 'out'], [T.done, 1, 'out']]),
			sy: track(t, [[0, 1], [T.crouch, 0.9, 'out'], [210, 1.07, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 0.9, 'out'], [T.done, 1, 'out']]),
			// rocks on its feet while it hangs in the air
			rot: 2.5 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 560),
			pop: 1 + 0.05 * air,
			dx: 0,
			dy: -6 * air,
		};

		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the lid: dips on the wind-up, springs open on the hit and bounces on
		// its hinge, slams on the landing and bounces again
		const lid = b('lid');
		// (the spring takes over at 360ms from exactly where the keys leave off:
		// 1 + 0.2 * spring(360) = 1.2)
		lid.across =
			(t < 360
				? track(t, [[0, 1], [T.crouch, 0.86, 'out'], [T.rise, 1.28, 'back'], [360, 1.2]])
				: 1 + 0.2 * spring(t, 360, 2.6, 3.4)) - 0.16 * flick(t, T.land, 3.2, 5);

		// the load sinks on the wind-up, pops on the hit and bounces in the box,
		// and jumps again when the chest lands
		const load = b('bananas');
		const wind = track(t, [[0, 0], [T.crouch, 2, 'out'], [170, 0]]);
		load.dy = wind - 4 * hops(t, 165, 2.1, 2.6) - 2.5 * hops(t, T.land + 10, 3, 5);
		load.along = 1 + 0.08 * hops(t, 165, 2.1, 2.6);
		// each bunch a beat apart on top of it: left, centre, right
		const bunch = (name: string, t0: number) => {
			b(name).dy = -1.5 * hops(t, t0, 2.4, 3.2);
		};
		bunch('banL', 150);
		bunch('banC', 190);
		bunch('banR', 230);
		// the one standing banana wags after its jump
		b('stalk').angle = 7 * flick(t, 260, 2.8, 3) - 4 * flick(t, T.land + 30, 3, 5);

		pose.air = Math.max(0, Math.min(1, air));
		// bright malachite: half strength washed the chest white
		pose.flash = 0.3 * track(t, [[T.crouch, 0], [220, 1, 'out'], [650, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 980 ? (t - 380) / 600 : -1;
		pose.plateHit = 1 + 0.04 * bump(t, T.crouch, 400) + 0.03 * bump(t, T.land, T.land + 150);
		return pose;
	},
};
