/**
 * H3 — THE SUPPLY CRATE ON A SLED. The lid is already open in the drawing and
 * hinged at the back, so it is a door: the one part here that can swing through
 * a real angle without anything bending.
 *
 * The acting: the sled lurches forward as if pulled, the crate rocks back on
 * its runners, and the LID claps — thrown wide open by the lurch, falling
 * back, and bouncing twice on its hinge. The runners rock under it the whole
 * time on a slower curve, which is what makes it read as a sled on snow rather
 * than a box.
 *
 * Geometry measured off h3_subject.png's alpha: the lid occupies x 103..211,
 * y 43..95 (up and to the right, leaning back); the box is x ~50..200,
 * y 95..174; the runners spread the full x 35..211 below y 166 and reach
 * y 218. The hinge is where the lid's lower-left corner meets the box's back
 * edge, about (110, 97).
 */
import {
	bump,
	flick,
	hinge,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { crouch: 130, lurch: 340, open: 430, shut: 760, land: 930, done: 1450 };

export const H3: MeshWinSpec = {
	symbol: 'H3',
	key: 'gbH3',
	feetY: 216,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 340,
	rig: {
		grid: { x0: 18, y0: 18, x1: 228, y1: 234, cols: 37, rows: 38 },
		// covers the WHOLE painted subject (alpha > 8 on its _subject.png, which
		// runs to 20..236). It used to stop short of it, so the mesh dropped the
		// subject's edges while it acted and they reappeared with the sprite.
		soft: 6,
		parts: [
			// the runners: the part that touches the ground and never leaves it
			{
				name: 'sled',
				pivot: [123, 200],
				dist: (p) => Math.min(14, polygon([
					[35, 164],
					[211, 164],
					[211, 220],
					[35, 220],
				])(p)),
			},
			// the crate rides the runners and rocks against them
			{
				name: 'box',
				parent: 'sled',
				pivot: [123, 172],
				axis: [0, -1],
				// the top edge drops away to the right, under the open lid: with a
				// flat top at y=92 the box's region ran within 8px of the lid's far
				// corner and the two sheared against each other there
				dist: polygon([
					[48, 94],
					[150, 96],
					[196, 112],
					[196, 176],
					[48, 176],
				]),
				keep: hinge([123, 172], 14, 22),
			},
			// THE LID, hinged at the crate's back-top corner. Its axis runs from
			// the hinge out to the lid's far corner, so `along` lengthens the lid
			// rather than fattening it.
			{
				name: 'lid',
				parent: 'box',
				pivot: [110, 97],
				axis: [0.88, -0.47],
				// The polygon follows the lid's own LEAN. A flat-bottomed box from
				// y=40 to y=100 overlapped the crate's top edge (y=92) along its
				// whole width, so at the far corner the lid bone and the box bone
				// fought over the same vertices and the lid measured 6.5 degrees.
				// Cut along the underside the drawing actually has — low at the
				// hinge, high at the far end — and they stop overlapping.
				dist: polygon([
					[98, 38],
					[214, 38],
					[214, 84],
					[104, 102],
				]),
				priority: 2,
				keep: hinge([110, 97], 14, 26),
			},
		],
	},
	// Geometric limits from --limits. The lid is the widest-swinging bone in the
	// set and still ships at half its geometric number: past that the snow cap
	// along its top edge shears off the wood.
	// Geometric (check_mesh_wins.mjs --limits): box +9 -10.5, lid +5 -6. The lid
	// is the tightest bone in the set and it is inherent — a long plank hinged
	// at one end, whose far corner sits a few px off the crate. Shipped under
	// both, with the clap's size coming from the sled's rigid lurch instead.
	limits: {
		box: { pos: 6, neg: 6 },
		lid: { pos: 4.2, neg: 4.2 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// A SHORT HOP, not a high one: a loaded sled is heavy, and the weight is
		// the point. Most of the size is in the lurch and the lid instead.
		const air = track(t, [
			[0, 0],
			[T.crouch, 0],
			[T.lurch, 1, 'back'],
			[T.shut, 1],
			[T.land, 0, 'in'],
		]);
		const apex = ramp(t, T.lurch - 40, T.lurch + 60) * (1 - ramp(t, T.shut - 120, T.shut));

		pose.rigid = {
			sx: track(t, [
				[0, 1],
				[T.crouch, 1.07, 'out'],
				[230, 0.96, 'out'],
				[T.lurch, 1],
				[T.land - 20, 1],
				[T.land + 50, 1.09, 'out'],
				[1110, 0.99],
				[1240, 1],
			]),
			sy: track(t, [
				[0, 1],
				[T.crouch, 0.88, 'out'],
				[230, 1.02, 'out'],
				[T.lurch, 1],
				[T.land - 20, 1],
				[T.land + 50, 0.88, 'out'],
				[1110, 1.02],
				[1240, 1],
			]),
			// the lurch: it tips back as it is pulled away, then noses down
			rot: track(t, [
				[0, 0],
				[T.crouch, 1.6, 'out'],
				[T.lurch, -4.5, 'back'],
				[T.shut, 2.2, 'inOut'],
				[T.land, -1.4, 'inOut'],
				[1150, 0.5],
				[1300, 0],
			]),
			pop: 1 + 0.018 * air,
			dx: 3 * apex,
			dy: -5 * air,
		};

		// the crate rocks against its runners, a beat behind them
		b('box').angle = -1.6 * apex * Math.sin((2 * Math.PI * (t - T.lurch)) / 460) + 2 * flick(t, T.land, 2.8, 4.5);

		// THE LID CLAPS. Thrown open by the lurch, dropped back, and bouncing
		// twice on the hinge — the bounce is the whole gag, and it is the last
		// motion in the symbol.
		//
		// Positive opens it (the axis points up and out to the lid's far corner),
		// so the numbers read the way the drawing does.
		b('lid').angle =
			track(t, [
				[0, 0],
				[T.crouch, -0.8, 'out'],
				[T.open, 3.4, 'back'],
				[T.shut, -1.5, 'in'],
				[T.land, 1, 'out'],
				[1130, -0.4, 'inOut'],
				[1290, 0],
			]) + 1.4 * flick(t, T.shut, 2.4, 3.2);
		// the lid is a plank: it does not squash, it knocks
		b('lid').across = 1 + 0.04 * bump(t, T.shut, T.shut + 160);

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.33 * track(t, [
			[T.crouch, 0],
			[T.lurch - 20, 1, 'out'],
			[700, 0, 'in'],
		]);
		pose.sheen = t >= 400 && t <= 920 ? (t - 400) / 520 : -1;
		// two knocks: the lurch, and the lid slamming back down
		pose.plateHit =
			1 + 0.04 * bump(t, T.crouch, 420) + 0.045 * bump(t, T.shut, T.shut + 170) + 0.03 * bump(t, T.land, T.land + 150);
		return pose;
	},
};
