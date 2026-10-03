/**
 * H4 — THE COPPER LANTERN. A round body with a carrying bail arched over it,
 * hinged at two points on its shoulders. A bucket handle is the most
 * recognisable secondary motion there is: everyone knows how it swings and
 * everyone knows it keeps swinging after the bucket stops.
 *
 * The acting: the lantern is picked up — it hops, the bail is left behind and
 * catches up, swings past, and rings back and forth on its hinge long after
 * the body has landed. The body itself only crouches, hops and squashes, all
 * of it rigid.
 *
 * Geometry measured off h4_subject.png's alpha: rows y 41..49 are a bar across
 * x ~90..165 (the top of the bail), y 57..74 shows the two posts with a clear
 * gap between them, and the body begins at y ~74 and runs to y 217 across
 * x 64..191. The hinge line is where the posts meet the shoulders, y ~86.
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

const T = { crouch: 120, rise: 330, fall: 720, land: 950, done: 1450 };

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	feetY: 215,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 215,
	rig: {
		grid: { x0: 40, y0: 18, x1: 214, y1: 236, cols: 33, rows: 41 },
		// covers the WHOLE painted subject (alpha > 8 on its _subject.png, which
		// runs to 20..236). It used to stop short of it, so the mesh dropped the
		// subject's edges while it acted and they reappeared with the sprite.
		soft: 4,
		parts: [
			// the body: the round lamp and its base
			{
				name: 'body',
				pivot: [127, 150],
				dist: (p) => Math.min(14, blob([127, 148], 66, 72, 2.4)(p)),
			},
			// THE BAIL. One bone for the whole arch, pivoting on the hinge line
			// between the two shoulders — which is how a bucket handle actually
			// turns. Its distance is the arch itself (two posts and the top bar),
			// so the air inside the arch belongs to the body behind it and does
			// not get dragged along.
			{
				name: 'bail',
				parent: 'body',
				pivot: [127, 88],
				axis: [0, -1],
				dist: union(
					polygon([
						[80, 34],
						[174, 34],
						[174, 56],
						[80, 56],
					]),
					polygon([
						[80, 44],
						[98, 44],
						[98, 92],
						[80, 92],
					]),
					polygon([
						[156, 44],
						[174, 44],
						[174, 92],
						[156, 92],
					]),
				),
				priority: 3,
				keep: hinge([127, 88], 10, 18),
			},
		],
	},
	// Geometric limits from --limits; the bail ships under its own because a
	// thin handle shears at the hinge long before a triangle loses area.
	// Geometric (--limits): bail +11 -11.
	limits: {
		bail: { pos: 7.5, neg: 7.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

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
				[T.crouch, 1.08, 'out'],
				[215, 0.95, 'out'],
				[T.rise, 1],
				[T.land - 20, 1],
				[T.land + 50, 1.1, 'out'],
				[1120, 0.98],
				[1240, 1],
			]),
			sy: track(t, [
				[0, 1],
				[T.crouch, 0.87, 'out'],
				[215, 1.02, 'out'],
				[T.rise, 1],
				[T.land - 20, 1],
				[T.land + 50, 0.86, 'out'],
				[1120, 1.03],
				[1240, 1],
			]),
			// it swings a little as it hangs, because it is hanging from the bail
			rot: 4.5 * apex * Math.sin((2 * Math.PI * (t - T.rise)) / 400),
			pop: 1 + 0.02 * air,
			dy: -8 * air,
			dx: 0,
		};

		// THE BAIL swings the opposite way to the body it hangs from, lags the
		// hop by a beat, and is still ringing when everything else has stopped.
		// A handle left behind is the whole reason this symbol reads as picked
		// up rather than scaled.
		b('bail').angle =
			track(t, [
				[0, 0],
				[T.crouch, 1.8, 'out'],
				[T.rise + 50, -6, 'out'],
				[T.fall + 40, 4, 'inOut'],
				[T.land + 20, -2, 'inOut'],
			]) +
			2.4 * apex * Math.sin((2 * Math.PI * (t - T.rise - 70)) / 360) +
			5.5 * flick(t, T.land, 2.2, 2.8);
		// steel does not stretch: the handle lifts off its hinge instead
		b('bail').along = 1 + 0.03 * bump(t, T.rise, T.rise + 260);

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.32 * track(t, [
			[T.crouch, 0],
			[215, 1, 'out'],
			[660, 0, 'in'],
		]);
		pose.sheen = t >= 380 && t <= 900 ? (t - 380) / 520 : -1;
		pose.plateHit = 1 + 0.04 * bump(t, T.crouch, 400) + 0.035 * bump(t, T.land, T.land + 160);
		return pose;
	},
};
