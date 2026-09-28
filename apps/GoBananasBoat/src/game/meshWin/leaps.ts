/**
 * THE HIGH PAYS LEAP OUT OF THEIR CELLS.
 *
 * Asked for (2026-09-27): the four high pays should jump exaggeratedly —
 * touching and crossing the cells round them — so a high pay reads as a high
 * pay. Each is wrapped here: its own parts keep acting as its file says (the
 * dome looks round, the cloth snaps, the flame flares), and its RIGID move — the
 * whole subject at once, which costs the mesh nothing — is replaced by a leap
 * about half a cell high, with a trick of its own in the air:
 *
 *   H1  the helmet   a front flip
 *   H2  the mine     it hangs, so it BOINGS on its chain — three bounces, each
 *                    smaller, swinging from the shackle
 *   H3  the lantern  jumps off its bracket and shimmies side to side
 *   H4  the flags    a full twirl
 *
 * The shape is the cartoon one: a deep crouch, a stretched launch, a hang at
 * the top, a fall that speeds up, a hard squash on the landing and one small
 * rebound. The plate stays in its cell; WinWays draws the leaping subject above
 * every other cell and frame (its `subjectOnly` pass) so it crosses them
 * rather than disappearing under them.
 *
 * Canvas units: the cell is 256, so a leap of 128 is half a cell.
 *
 * THE PARTS MOVE ON THE LEAP'S CLOCK (2026-09-27). Each symbol's own act was
 * timed for its old small hop — the helmet's hose and dome reacted to a
 * landing at 1300ms, 400ms after the leap had actually landed at 900 — so the
 * follow-through came after nothing. `beats` re-times the act onto the leap:
 * its crouch on the crouch, its landing on the landing.
 *
 * And the parts that trail DRAG: while the body turns, a loose part (the hose,
 * the flame, the cloth's free edge) lags behind it by an angle that grows with
 * how fast the body is turning — the overlap that tells a hose from a painted
 * hose. Clamped to the part's measured limit, so the gate still holds.
 *
 * After the rebound it settles like jelly: two small squash wobbles, dying.
 */
import { bump, flick, track, turnAbout, type MeshWinSpec, type Point, type RigidPose } from './meshRig';

type Leap = {
	/** peak height, canvas px */
	height: number;
	/** the trick: rotation in degrees at time t (ms), and what it turns about */
	turn: (t: number) => number;
	pivot: Point;
	/** true: the three-bounce boing (the mine) instead of the single leap */
	boing?: boolean;
	/** the act's own beats onto the leap's: [own ms, leap ms], ascending */
	beats?: [number, number][];
	/** per part: degrees of lag per degree/ms the body turns */
	drag?: Record<string, number>;
};

// the single leap, ms: crouch, launch, top, fall, land, rebound, rest
const L = { crouch: 150, launch: 230, top: 480, hang: 620, land: 900, reboundTop: 1040, reboundLand: 1160, rest: 1300 };

const leapHeight = (t: number) =>
	track(t, [
		[0, 0],
		[L.crouch, 0],
		[L.top, 1, 'out'],
		[L.hang, 0.95],
		[L.land, 0, 'in'],
		[L.reboundTop, 0.22, 'out'],
		[L.reboundLand, 0, 'in'],
	]);

// the boing: up and down three times on the chain, each lower
const boingHeight = (t: number) =>
	track(t, [
		[0, 0],
		[120, 0],
		[360, 1, 'out'],
		[600, 0, 'in'],
		[780, 0.5, 'out'],
		[940, 0, 'in'],
		[1060, 0.2, 'out'],
		[1170, 0, 'in'],
	]);

// squash on the ground, stretch in flight — keyed on the same beats
const squash = (t: number, boing: boolean): [number, number] => {
	const keys: [number, number, number][] = boing
		? [
				[0, 1, 1],
				[120, 1, 1],
				[200, 0.88, 1.14],
				[360, 1, 1],
				[600, 1.14, 0.84],
				[680, 0.94, 1.06],
				[940, 1.08, 0.9],
				[1170, 1.04, 0.95],
				[1300, 1, 1],
			]
		: [
				[0, 1, 1],
				[L.crouch, 1.16, 0.78],
				[L.launch, 0.86, 1.22],
				[L.top, 1, 1],
				[L.hang, 1, 1],
				[L.land - 30, 0.92, 1.1],
				[L.land + 30, 1.24, 0.72],
				[L.land + 120, 0.95, 1.06],
				[L.reboundLand - 20, 1, 1],
				[L.reboundLand + 30, 1.08, 0.9],
				[L.rest, 1, 1],
			];
	const sx = track(t, keys.map(([ms, x]) => [ms, x, 'out'] as [number, number, 'out']));
	const sy = track(t, keys.map(([ms, , y]) => [ms, y, 'out'] as [number, number, 'out']));
	return [sx, sy];
};

const leapRigid = (leap: Leap, t: number, feetY: number): { rigid: RigidPose; air: number } => {
	const h = leap.boing ? boingHeight(t) : leapHeight(t);
	const [sx, sy] = squash(t, !!leap.boing);
	const rigid: RigidPose = {
		sx,
		sy,
		rot: leap.turn(t),
		// it grows as it comes up toward the player
		pop: 1 + 0.14 * h,
		dx: 0,
		dy: -leap.height * h,
	};
	turnAbout(rigid, leap.pivot, feetY);
	return { rigid, air: Math.min(1, h) };
};

/** the act's own time for a leap time, through the beats (slope 1 past them) */
const ownTime = (beats: [number, number][] | undefined, t: number) => {
	if (!beats) return t;
	for (let i = 1; i < beats.length; i++) {
		const [o0, l0] = beats[i - 1], [o1, l1] = beats[i];
		if (t <= l1) return o0 + ((t - l0) * (o1 - o0)) / (l1 - l0);
	}
	const [o, l] = beats[beats.length - 1];
	return o + (t - l);
};

/** how fast the trick turns, degrees per ms */
const turnRate = (leap: Leap, t: number) => (leap.turn(t) - leap.turn(t - 8)) / 8;

/** the jelly after the rebound: + wider, - taller */
const jelly = (t: number, boing: boolean) => flick(t, boing ? 1170 : L.reboundLand + 20, 7, 8);

const ease = (t: number, a: number, b: number) => {
	const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
	return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};

export const LEAPS: Record<string, Leap> = {
	// a full front flip, turning about its middle, between launch and landing
	H1: {
		height: 130,
		pivot: [128, 128],
		turn: (t) => -360 * ease(t, L.launch, 800),
		// helmet.ts: crouch 110, rise 330, fall 1050, land 1300, done 1450
		beats: [[0, 0], [110, L.crouch], [330, L.launch + 70], [1050, L.hang], [1300, L.land], [1450, 1150]],
		// the left free edge only: the right cloth's own ripple already takes its
		// mesh to the gate's stretch limit (159.7%), with no room for a lag on top
		drag: { tip_l: 2.4 },
	},
	// swinging from the shackle as it boings, dying away
	H2: {
		height: 100,
		pivot: [128, 54],
		boing: true,
		turn: (t) => 16 * Math.sin((2 * Math.PI * (t - 120)) / 520) * Math.max(0, 1 - (t - 120) / 1200) * (t > 120 ? 1 : 0),
		// its own knock is at 120, the boing's too: no re-timing
	},
	// a shimmy in the air, side to side, about its middle
	H3: {
		height: 115,
		pivot: [128, 118],
		turn: (t) => 14 * Math.sin((2 * Math.PI * (t - L.launch)) / 300) * bump(t, L.launch, L.land),
		// lantern.ts: the gust at 120 on the launch, the second gust on the landing
		beats: [[0, 0], [120, L.launch - 40], [820, L.land], [1400, 1300]],
		// the left free edge only: the right cloth's own ripple already takes its
		// mesh to the gate's stretch limit (159.7%), with no room for a lag on top
		drag: { tip_l: 2.4 },
	},
	// a full twirl the other way
	H4: {
		height: 120,
		pivot: [128, 124],
		turn: (t) => 360 * ease(t, L.launch, 820),
		// flags.ts: crouch 100, rise 300, fall 1000, land 1200, done 1400
		beats: [[0, 0], [100, L.crouch], [300, L.launch + 70], [1000, L.hang], [1200, L.land], [1400, 1150]],
		// the left free edge only: the right cloth's own ripple already takes its
		// mesh to the gate's stretch limit (159.7%), with no room for a lag on top
		drag: { tip_l: 2.4 },
	},
};

/** the leap time of one of the act's own times (the beats, the other way) */
const leapTime = (beats: [number, number][] | undefined, own: number) => {
	if (!beats) return own;
	for (let i = 1; i < beats.length; i++) {
		const [o0, l0] = beats[i - 1], [o1, l1] = beats[i];
		if (own <= o1) return l0 + ((own - o0) * (l1 - l0)) / (o1 - o0);
	}
	const [o, l] = beats[beats.length - 1];
	return l + (own - o);
};

/** wrap a high pay's spec: its bones as they were, the rigid move a leap */
export const withLeap = (spec: MeshWinSpec): MeshWinSpec => {
	const leap = LEAPS[spec.symbol];
	if (!leap) return spec;
	return {
		...spec,
		leaps: true,
		landMs: leap.boing ? spec.landMs : L.land,
		hitMs: Math.round(leapTime(leap.beats, spec.hitMs)),
		pose: (rig, t, amp) => {
			const pose = spec.pose(rig, ownTime(leap.beats, t), amp);
			const { rigid, air } = leapRigid(leap, t, spec.feetY);
			// the lag of the loose parts behind the turn
			const rate = turnRate(leap, t);
			for (const [part, gain] of Object.entries(leap.drag ?? {})) {
				const i = rig.bones.findIndex((x) => x.name === part);
				if (i < 0) continue;
				const lim = spec.limits?.[part];
				const b = pose.bones[i];
				b.angle -= gain * rate;
				if (lim) b.angle = Math.max(-lim.neg, Math.min(lim.pos, b.angle));
			}
			const j = jelly(t, !!leap.boing);
			rigid.sx *= 1 + 0.05 * j;
			rigid.sy *= 1 - 0.05 * j;
			pose.rigid = rigid;
			pose.air = air;
			// the cell takes the launch and the landing
			pose.plateHit =
				1 + 0.05 * bump(t, 60, leap.boing ? 260 : L.launch + 60) + 0.06 * bump(t, leap.boing ? 560 : L.land - 20, (leap.boing ? 560 : L.land) + 160);
			return pose;
		},
	};
};
