/**
 * THE DYNAMITE PROP (gbDynamite) — the bundle the transition throws or drops
 * into the middle of the screen before the white-out — as a mesh.
 *
 * As a sprite it could only fly, spin and blink as one flat card. Here:
 *
 *   · the FUSE is three joints and the SPARK on its end: it trails behind the
 *     tumble of a throw, streams and flutters on the straight drop, whips over
 *     on the arrival and keeps fizzing while it sits there armed
 *   · the BUNDLE lands with weight — squashed on arrival, back up with a
 *     wobble — and swells a little with each of the two red blinks, as if the
 *     pressure inside were building
 *   · the spark flares on every blink and flares hardest as the bundle burns
 *
 * The flight itself (position, spin, scale, tint) stays on the transform in
 * TransitionAnimation.svelte; DynamiteMesh.svelte draws this mesh in place of
 * the Sprite. The air round the art is `frame`, nailed down, so the rigid move
 * is never used (panel mode) — the transform does that job.
 *
 * Rig units are a 256 x 235.43 canvas over the 672 x 618 art. Measured on
 * dynamite.png, 2026-09-26.
 */
import {
	bump,
	circle,
	flick,
	polygon,
	polyline,
	restPose,
	smoothstep,
	spring,
	union,
	type MeshWinSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';

export const DYNAMITE_CANVAS: [number, number] = [256, 618 * (256 / 672)];

/** what drives it this frame (TransitionAnimation.svelte fills this in) */
export type DynamiteEnv = {
	/** ms since the prop appeared */
	t: number;
	/** how much of the flight's flutter is on, 0..1 — eased by the caller */
	flying: number;
	/** tumble speed, turns per second, clockwise positive — smoothed by the caller */
	spin: number;
	/** ms since it arrived in the middle of the screen, or < 0 */
	arriveT: number;
	/** ms since the first red blink, or < 0 */
	armedT: number;
	/** the burn, 0..1 (the boom consuming it), or 0 */
	burn: number;
};

export type DynamiteSpec = MeshWinSpec & { drive: (rig: Rig, env: DynamiteEnv) => Pose };

const BUNDLE: Point[] = [
	[40, 112], [56, 100], [96, 94], [112, 86], [136, 80], [150, 74], [176, 70], [200, 80], [212, 102],
	[220, 128], [222, 160], [208, 180], [170, 198], [130, 212], [90, 224], [66, 232], [38, 228],
	[20, 212], [16, 192], [6, 172], [4, 150], [16, 136], [26, 116],
];
// the fuse, from the knot up and over to the spark
const FUSE1: Point[] = [[122, 84], [125, 66], [130, 46]];
const FUSE2: Point[] = [[130, 46], [138, 32], [150, 20], [166, 10], [182, 6]];
const FUSE3: Point[] = [[182, 6], [196, 7], [206, 15], [214, 27]];
const SPARK_AT: Point = [226, 46];
const SPARK_R = 20;

const bundleDist = polygon(BUNDLE);
const fuse1 = polyline(FUSE1, 2);
const fuse2 = polyline(FUSE2, 2);
const fuse3 = polyline(FUSE3, 2);
const sparkDist = circle(SPARK_AT, SPARK_R);
const inkDist = union(bundleDist, fuse1.dist, fuse2.dist, fuse3.dist, sparkDist);

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];
const clampAbs = (v: number, m: number) => Math.max(-m, Math.min(m, v));

// The two red blinks are TickMs 260 apart in the transition; each is a sine
// half, so they peak at 65 and 195ms.
const BLINKS = [65, 195];

export const DYNAMITE: DynamiteSpec = (() => {
	const spec: DynamiteSpec = {
		symbol: 'dynamite',
		key: 'gbDynamite',
		sprite: 'gbDynamite',
		mode: 'panel',
		feetY: 180,
		durationMs: 1400,
		landMs: 99999,
		hitMs: 99999,
		inked: (p) => inkDist(p) < 1,
		rig: {
			canvas: DYNAMITE_CANVAS,
			grid: { x0: 0, y0: 0, x1: 256, y1: DYNAMITE_CANVAS[1], cols: 64, rows: 59 },
			soft: 3,
			parts: [
				// the transparent air round the prop: fixed, free to stretch
				// 12 units off everything near the art, and a much stronger claim
				// further out (dist falls below zero past 16 units), so the air well
				// away from the fuse is truly nailed down and its big swings do not
				// tug on it
				{ name: 'frame', pivot: [128, 118], dist: (p) => 12 - Math.min(40, 3 * Math.max(0, inkDist(p) - 16)) },
				{ name: 'bundle', parent: 'frame', pivot: [114, 160], axis: [0, -1], dist: bundleDist },
				{ name: 'fuse1', parent: 'bundle', pivot: FUSE1[0], axis: [8, -38], dist: fuse1.dist, priority: 1 },
				{ name: 'fuse2', parent: 'fuse1', pivot: FUSE2[0], axis: [52, -40], dist: fuse2.dist, priority: 1 },
				{ name: 'fuse3', parent: 'fuse2', pivot: FUSE3[0], axis: [32, 21], dist: fuse3.dist, priority: 1 },
				{ name: 'spark', parent: 'fuse3', pivot: SPARK_AT, axis: [0, -1], dist: sparkDist, priority: 2 },
			],
		},
		// geometric (check_mesh_wins.mjs dynamite --limits, 2026-09-26)
		limits: {
			bundle: { pos: 3, neg: 3 },
			fuse1: { pos: 14, neg: 14 },
			fuse2: { pos: 14, neg: 14 },
			fuse3: { pos: 16, neg: 16 },
			spark: { pos: 10, neg: 10 },
		},
		drive: (rig, env) => {
			const pose = restPose(rig);
			const { t } = env;
			// it appears as the drawing and the fizz comes up over its first
			// frames, so the swap from nothing to the prop cannot jump
			const on = smoothstep(t / 90);
			const fly = env.flying * on;
			const arrive = env.arriveT;
			const armed = env.armedT;

			// BUNDLE: stretched a touch along its fall, squashed on arrival, and
			// swollen by each blink
			const b = bone(rig, pose, 'bundle');
			const land = arrive >= 0 ? flick(arrive, 0, 4.2, 7) : 0;
			const blink = armed >= 0 ? BLINKS.reduce((s, at) => s + bump(armed, at - 60, at + 70), 0) : 0;
			const swell = 0.035 * blink + 0.05 * env.burn;
			b.along = 1 + 0.02 * fly - 0.075 * land + swell;
			b.across = 1 - 0.012 * fly + 0.06 * land + swell;
			b.angle = arrive >= 0 ? 2.2 * flick(arrive, 30, 2.6, 5) : 0;

			// FUSE: the tumble drags it back (a clockwise spin bends it
			// anticlockwise), the flight flutters it, the arrival whips it over and
			// it never quite stops fizzing
			const drag = clampAbs(-env.spin * 1.6, 6) * on;
			const flutter = (phase: number, hz: number) => Math.sin((t / 1000) * 2 * Math.PI * hz + phase);
			// a spring that starts from 0 (the kick minus its own start), so the
			// arrival does not jump the fuse on one frame
			const whip = (delay: number) =>
				arrive < delay ? 0 : spring(arrive, delay, 3.4, 4.5) - Math.exp((-40 * (arrive - delay)) / 1000);
			const live = 1 - smoothstep(env.burn * 3);
			const idle = (1 - env.flying) * live * on;
			const f1 = bone(rig, pose, 'fuse1');
			const f2 = bone(rig, pose, 'fuse2');
			const f3 = bone(rig, pose, 'fuse3');
			f1.angle = drag * 0.6 + fly * 3 * flutter(0, 7) + 7 * whip(0) + idle * 1.4 * flutter(0.4, 2.3);
			f2.angle = drag + fly * 5 * flutter(1.1, 7) + 9 * whip(45) + idle * 2.2 * flutter(1.3, 2.3);
			f3.angle = drag * 1.2 + fly * 6 * flutter(2.2, 7) + 10 * whip(80) + idle * 3 * flutter(2.4, 2.3);

			// SPARK: fizzing always, flaring with each blink and in the burn
			const s = bone(rig, pose, 'spark');
			const fizz = on * (0.06 * Math.sin(t / 23) + 0.04 * Math.sin(t / 11 + 1.3));
			const flare = 0.12 * blink + 0.14 * env.burn;
			s.along = 1 + fizz + flare;
			s.across = 1 - fizz * 0.6 + flare;
			s.angle = 6 * on * Math.sin(t / 37);
			return pose;
		},
		// for the gate: a drop (no spin) that arrives at 460ms, arms at 460 and
		// burns from 720ms
		pose: (rig, t) =>
			spec.drive(rig, {
				t,
				flying: 1 - smoothstep((t - 380) / 80),
				spin: 0,
				arriveT: t >= 460 ? t - 460 : -1,
				armedT: t >= 460 ? t - 460 : -1,
				burn: smoothstep((t - 720) / 110),
			}),
	};
	return spec;
})();

/** the gate's second run: a THROW — spinning hard through the flight */
export const DYNAMITE_THROWN: DynamiteSpec = {
	...DYNAMITE,
	symbol: 'dynamite:thrown',
	pose: (rig, t) => {
		const flying = 1 - smoothstep((t - 280) / 60);
		return DYNAMITE.drive(rig, {
			t,
			flying,
			spin: 7 * flying,
			arriveT: t >= 340 ? t - 340 : -1,
			armedT: t >= 340 ? t - 340 : -1,
			burn: smoothstep((t - 600) / 110),
		});
	},
};
