/**
 * THE HIGH PAYS LEAP OUT OF THEIR CELLS.
 *
 * GoBananasBoat's leaps (2026-09-27, asked for there: the high pays jump
 * exaggeratedly, touching and crossing the cells round them), with this
 * game's tricks:
 *
 *   H1  the kabuto     a front flip; the cord knot drags behind the turn
 *   H2  the shuriken   thrown up spinning two full turns; the blades bend
 *                      back against the spin
 *   H3  the bomb       its countdown first (three swells), THEN the hop, with
 *                      a shimmy in the air — the whole leap runs `delay` late
 *   H4  the fan        a full twirl; the tassels drag
 *   S   the bananas    a plain hop, lower
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
	/** NINJA: ms the whole leap waits for the act's own lead-in (the bomb's countdown) */
	delay?: number;
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
		// 0.14 -> 0.2 (2026-10-16: bigger wins)
		pop: 1 + 0.2 * h,
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

const spinUp = (t: number, from: number, to: number) => {
	// fast off the hand, slowing into the catch: an ease-out on the angle
	const u = Math.max(0, Math.min(1, (t - from) / (to - from)));
	return 1 - (1 - u) ** 2.2;
};

export const LEAPS: Record<string, Leap> = {
	// a front flip about its middle; the cord knot under the chin trails it
	H1: {
		height: 145,
		pivot: [128, 120],
		turn: (t) => -360 * ease(t, L.launch, 820),
		drag: { knot: 3.2, horn_l: 0.8, horn_r: 0.8 },
	},
	// thrown up spinning, two full turns, the blades bending back against it
	H2: {
		height: 150,
		pivot: [128, 129],
		turn: (t) => 720 * spinUp(t, L.launch - 30, 880),
		drag: { blade_tl: 1.6, blade_tr: 1.6, blade_br: 1.6, blade_bl: 1.6 },
	},
	// the countdown, then a hop with a shimmy
	H3: {
		height: 130,
		pivot: [132, 152],
		delay: 330,
		turn: (t) => 12 * Math.sin((2 * Math.PI * (t - L.launch)) / 260) * bump(t, L.launch, L.land),
		drag: { fuse: 2.2 },
	},
	// a full twirl the other way; the tassels fly out behind
	H4: {
		height: 140,
		pivot: [128, 120],
		turn: (t) => 360 * ease(t, L.launch, 840),
		drag: { tassel_l: 3, tassel_r: 3 },
	},
	// the scatter hops lower, with a rock side to side
	S: {
		height: 105,
		pivot: [150, 140],
		turn: (t) => 8 * Math.sin((2 * Math.PI * (t - L.launch)) / 420) * bump(t, L.launch, L.land),
		drag: { bow: 2.4, ends: 2.4 },
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
	const d = leap.delay ?? 0;
	return {
		...spec,
		leaps: true,
		landMs: leap.boing ? spec.landMs : L.land + d,
		hitMs: Math.round(leapTime(leap.beats, spec.hitMs)),
		pose: (rig, t, amp) => {
			const pose = spec.pose(rig, ownTime(leap.beats, t), amp);
			// the leap's own clock: held at rest through the act's lead-in
			const lt = Math.max(0, t - d);
			const { rigid, air } = leapRigid(leap, lt, spec.feetY);
			// the lag of the loose parts behind the turn
			const rate = turnRate(leap, lt);
			for (const [part, gain] of Object.entries(leap.drag ?? {})) {
				const i = rig.bones.findIndex((x) => x.name === part);
				if (i < 0) continue;
				const lim = spec.limits?.[part];
				const b = pose.bones[i];
				b.angle -= gain * rate;
				if (lim) b.angle = Math.max(-lim.neg, Math.min(lim.pos, b.angle));
			}
			const j = jelly(lt, !!leap.boing);
			rigid.sx *= 1 + 0.05 * j;
			rigid.sy *= 1 - 0.05 * j;
			pose.rigid = rigid;
			pose.air = air;
			// the cell takes the launch and the landing
			pose.plateHit =
				1 + 0.05 * bump(lt, 60, leap.boing ? 260 : L.launch + 60) + 0.06 * bump(lt, leap.boing ? 560 : L.land - 20, (leap.boing ? 560 : L.land) + 160);
			return pose;
		},
	};
};
