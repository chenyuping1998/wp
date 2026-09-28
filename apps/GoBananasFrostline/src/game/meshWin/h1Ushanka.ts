/**
 * H1 — THE FUR HAT. Two ear flaps hang off it, and they are the whole reason
 * this symbol acts well: a free appendage is where the life goes
 * (wp/.claude/skills/mesh-cast-rig §3, rule 2 — the body barely moves and the
 * amplitude goes to what hangs off it).
 *
 * The acting: a crouch, a hop, the flaps swinging OUT as it leaves the plate
 * and trailing behind the fall, then two swings of follow-through after the
 * landing while the hat itself has already stopped. The hat's own body does
 * almost nothing but squash and rise — fur should not bend, and a rigid hop
 * distorts no triangle at all.
 *
 * Geometry measured off h1_subject.png's alpha (a 22x22 occupancy map over the
 * cut, design-time only): the crown fills x 39..207, y 39..166 solid; below
 * y 166 it splits into two lobes with a gap in the middle — the left one
 * x 39..120 ending by y 200, the right one x 135..207 running to y 219. Those
 * two lobes are the flaps.
 */
import {
	blob,
	bump,
	flick,
	hinge,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	union,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { crouch: 120, rise: 330, fall: 720, land: 960, done: 1450 };

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	feetY: 214,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 210,
	rig: {
		grid: { x0: 32, y0: 30, x1: 214, y1: 228, cols: 32, rows: 36 },
		soft: 5,
		parts: [
			// the crown: everything above the flaps, and what they hang from
			{
				name: 'crown',
				pivot: [123, 120],
				dist: (p) => Math.min(14, blob([123, 110], 88, 72, 2.6)(p)),
			},
			// The left flap. Its pivot sits where the lobe meets the crown, and
			// `keep` hands the weight back to the crown over 14px — a 9px blend let
			// a hop stretch a rim 1.7x on GoBananubis, 14 holds.
			{
				name: 'flap_l',
				parent: 'crown',
				pivot: [100, 158],
				axis: [-0.76, 0.65],
				dist: polygon([
					[39, 152],
					[120, 152],
					[112, 206],
					[42, 202],
				]),
				keep: hinge([100, 158], 12, 20),
			},
			// the right flap hangs lower and longer — it gets the bigger swing
			{
				name: 'flap_r',
				parent: 'crown',
				pivot: [150, 156],
				axis: [0.55, 0.84],
				dist: polygon([
					[134, 150],
					[207, 150],
					[207, 222],
					[138, 216],
				]),
				keep: hinge([150, 156], 12, 20),
			},
			// the goggles across the brow: they ride the hat and lag it slightly,
			// which is all a strapped-on object can do
			{
				name: 'goggles',
				parent: 'crown',
				pivot: [123, 78],
				axis: [1, 0],
				dist: union(polygon([
					[62, 48],
					[188, 44],
					[190, 92],
					[60, 96],
				])),
				priority: 2,
				keep: hinge([123, 78], 10, 18),
			},
		],
	},
	// Geometric limits from check_mesh_wins.mjs --limits; shipped well inside
	// them, because a geometric limit only sees AREA (the skill, failure 10).
	// Geometric (--limits): flap_l +12.5 -16, flap_r +12 -9.5, goggles +11 -9.
	// Shipped at ~70% of the tighter side of each.
	limits: {
		flap_l: { pos: 8.5, neg: 8.5 },
		flap_r: { pos: 6.5, neg: 6.5 },
		goggles: { pos: 6, neg: 6 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const air = track(t, [
			[0, 0],
			[T.crouch, 0],
			[T.rise, 1, 'back'],
			[T.fall - 60, 1],
			[T.land, 0, 'in'],
		]);
		const apex = ramp(t, T.rise - 40, T.rise + 60) * (1 - ramp(t, T.fall - 120, T.fall));

		pose.rigid = {
			sx: track(t, [
				[0, 1],
				[T.crouch, 1.09, 'out'],
				[215, 0.94, 'out'],
				[T.rise, 1],
				[T.land - 20, 1],
				[T.land + 50, 1.11, 'out'],
				[1120, 0.98],
				[1240, 1],
			]),
			sy: track(t, [
				[0, 1],
				[T.crouch, 0.85, 'out'],
				[215, 1.02, 'out'],
				[T.rise, 1],
				[T.land - 20, 1],
				[T.land + 50, 0.85, 'out'],
				[1120, 1.03],
				[1240, 1],
			]),
			rot: 4 * apex * Math.sin((2 * Math.PI * (t - T.rise)) / 430),
			pop: 1 + 0.02 * air,
			dy: -7 * air,
			dx: 0,
		};

		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// THE FLAPS. Positive opens the left one outward and closes the right,
		// so the two are driven from one number with opposite signs and can never
		// disagree about which way "out" is.
		//
		// Three things stacked, in the order they happen: they swing out as the
		// hat leaves the plate (drag), sway once at the top, then carry on
		// swinging after the landing while the hat is already still.
		const drag = track(t, [
			[0, 0],
			[T.crouch, 2, 'out'],
			[T.rise, -5.5, 'out'],
			[T.fall, 2.4, 'inOut'],
			[T.land, 0, 'in'],
		]);
		const sway = 2.2 * apex * Math.sin((2 * Math.PI * (t - T.rise)) / 300);
		const settle = 5 * flick(t, T.land, 2.6, 3.4);
		const swing = drag + sway + settle;
		b('flap_l').angle = swing;
		// the heavier flap lags a beat and swings wider
		const swingR =
			track(t, [
				[0, 0],
				[T.crouch + 30, 1.6, 'out'],
				[T.rise + 40, -4.2, 'out'],
				[T.fall + 30, 2, 'inOut'],
				[T.land + 30, 0, 'in'],
			]) +
			1.8 * apex * Math.sin((2 * Math.PI * (t - T.rise - 60)) / 320) +
			4 * flick(t, T.land + 25, 2.3, 3);
		b('flap_r').angle = -swingR;
		// fur compresses on the landing rather than bending
		b('flap_l').along = 1 - 0.05 * bump(t, T.land, T.land + 220);
		b('flap_r').along = 1 - 0.06 * bump(t, T.land + 20, T.land + 260);

		// the goggles are strapped on: a slight lag, no travel of their own
		// The goggles are strapped across the brow: they cannot travel, but they
		// can LAG. Driven off the hat's own hop so they tip back as it rises and
		// snap forward when it lands — the gate rejected a smaller version of
		// this as invisible (0.5px of travel), which is exactly the failure the
		// skill records as "a reaction so small it could not be seen".
		b('goggles').angle =
			track(t, [
				[0, 0],
				[T.crouch, 1.2, 'out'],
				[T.rise, -3.2, 'out'],
				[T.fall, 1.6, 'inOut'],
				[T.land, 0, 'in'],
			]) + 3.4 * flick(t, T.land, 3.2, 5);

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.34 * track(t, [
			[T.crouch, 0],
			[210, 1, 'out'],
			[640, 0, 'in'],
		]);
		pose.sheen = t >= 380 && t <= 900 ? (t - 380) / 520 : -1;
		pose.plateHit = 1 + 0.04 * bump(t, T.crouch, 400) + 0.035 * bump(t, T.land, T.land + 160);
		return pose;
	},
};
