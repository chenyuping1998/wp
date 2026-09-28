/**
 * S — THE BEACON. The Scatter is a caged warning lamp, so it does what a
 * beacon does: it charges (a squeeze), FLARES (the globe swells and flashes
 * hot orange, twice, like a pulse), and the loose parts round it react — the
 * blue hood flaps open off the globe and the coiled cable swings.
 *
 * The flash is orange, not gold: hot orange is the Scatter's colour and no one
 * else's in this game (src/game/palette.ts).
 *
 * The bulb BREATHES: the glass inside the cage swells with each flare while the
 * cage's outer ring holds, so the bars bow outward with it — a lamp under
 * pressure rather than a picture of one getting bigger.
 */
import { bump, circle, flick, polygon, polyline, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Rig, boneOf, landFlick } from './meshRig';

const T = { charge: 130, flare: 290, flare2: 560, done: 1000 };
const GLOBE: Point = [160, 118];
const HINGE: Point = [110, 72];
const CABLE = polyline([[52, 140], [44, 196]], 11);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	sprite: 'gbS',
	flashTint: 0xff9a3c,
	feetY: 226,
	durationMs: T.done,
	landMs: T.flare2,
	hitMs: T.flare,
	rig: {
		grid: { x0: 26, y0: 20, x1: 230, y1: 234, cols: 46, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'core', pivot: GLOBE, dist: (p) => Math.min(14, circle(GLOBE, 64)(p)) },
			{
				name: 'hood',
				parent: 'core',
				pivot: HINGE,
				axis: [-1, -0.4],
				priority: 1,
				dist: polygon([[28, 18], [120, 18], [112, 66], [100, 136], [36, 136]]),
				// fading at the bottom too, where the hood meets the cable
				keep: (p) => smoothstep((Math.hypot(p[0] - HINGE[0], p[1] - HINGE[1]) - 8) / 20) * smoothstep((134 - p[1]) / 26),
			},
			{
				name: 'cable',
				parent: 'core',
				pivot: [52, 140],
				axis: [-8, 56],
				priority: 2,
				dist: CABLE.dist,
				keep: (p) => smoothstep((CABLE.along(p) - 2) / 14),
			},
			{
				// the glass and the bars over it, free in the middle and handing back
				// to the cage's rim (r 64) over the last 18px
				name: 'bulb',
				parent: 'core',
				pivot: GLOBE,
				priority: 2,
				dist: (p) => Math.max(circle(GLOBE, 50)(p), Math.max(0, 108 - p[0])),
				keep: (p) => smoothstep((62 - Math.hypot(p[0] - GLOBE[0], p[1] - GLOBE[1])) / 18),
			},
		],
	},
	// geometric (check_mesh_wins.mjs S --limits): hood +7.5 -6   cable +36 -50
	limits: {
		hood: { pos: 5, neg: 4.5 },
		cable: { pos: 14, neg: 14 },
		bulb: { pos: 0.5, neg: 0.5 },
	},
	// landing: the hood rattles, the cable swings — both harder with each
	// Scatter the spin has shown (k climbs to 1.6, see ReelSymbol)
	land: (rig, t, k, pose) => {
		boneOf(rig, pose, 'hood').angle = -2.6 * k * landFlick(t, 30);
		boneOf(rig, pose, 'cable').angle = 8 * k * landFlick(t, 40);
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// the two pulses of the flare
		const pulse = bump(t, T.charge, T.flare + 200) + 0.6 * bump(t, T.flare2 - 60, T.flare2 + 180);

		pose.rigid = {
			sx: track(t, [[0, 1], [T.charge, 0.94, 'out'], [T.flare, 1.05, 'out'], [470, 1], [T.flare2, 1.03, 'out'], [760, 1]]),
			sy: track(t, [[0, 1], [T.charge, 0.93, 'out'], [T.flare, 1.05, 'out'], [470, 1], [T.flare2, 1.03, 'out'], [760, 1]]),
			rot: 2 * flick(t, T.flare, 2.2, 3.4),
			pop: 1 + 0.035 * pulse,
			dx: 0,
			dy: -4 * pulse,
		};

		// the hood lifts off the globe on each flare (- opens it up and out)
		b('hood').angle = -4 * Math.max(0, flick(t, T.charge + 60, 2.2, 2.6)) - 2.6 * Math.max(0, flick(t, T.flare2 - 40, 2.4, 3.2)) + 1.2 * flick(t, 800, 2.6, 5);
		// the cable swings, lagging the body
		b('cable').angle = 12 * flick(t, T.flare, 1.8, 2.4);
		// the bulb swells with each flare, a hair behind it
		b('bulb').along = b('bulb').across = 1 + 0.07 * (bump(t, T.charge + 40, T.flare + 240) + 0.6 * bump(t, T.flare2 - 20, T.flare2 + 220));

		pose.air = 0.6 * pulse;
		// the flare itself: brighter than anyone else's flash, it is the Scatter
		pose.flash = 0.45 * track(t, [[T.charge, 0], [T.flare, 1, 'out'], [470, 0.15, 'in'], [T.flare2, 0.7, 'out'], [820, 0, 'in']]);
		pose.sheen = t >= 330 && t <= 760 ? (t - 330) / 430 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.charge, 470) + 0.02 * bump(t, T.flare2 - 40, T.flare2 + 160);
		return pose;
	},
};

/**
 * S_TRIGGER — THE BEACON GOING OFF: the Free Spins trigger, not a line win.
 *
 * It replaces three back-to-back plays of the win beat above, which read as the
 * same small gesture on repeat at the biggest moment in the base game. This is
 * one beat that CLIMBS: it charges, pulses three times, each harder and brighter
 * than the last with the hood lifting higher, then goes off in one big flare and
 * settles. Same rig, same measured limits — the size comes from the rigid pop,
 * the flash and the sparks, which cost the mesh nothing.
 *
 * 2300ms, inside the board's WIN_ANIM_MAX_MS (2600).
 */
const TT = { p1: 300, p2: 780, p3: 1240, flare: 1720, done: 2300 };
const PULSES: [number, number][] = [[TT.p1, 0.45], [TT.p2, 0.7], [TT.p3, 0.9], [TT.flare, 1.4]];

export const S_TRIGGER: MeshWinSpec = {
	...S,
	durationMs: TT.done,
	landMs: TT.flare,
	hitMs: TT.flare,
	hits: PULSES.map(([t]) => t),
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// each pulse a quick swell and a slower release; the flare holds longer
		let swell = 0;
		for (const [t0, k] of PULSES) swell += k * bump(t, t0 - 150, t0 + (k > 1 ? 420 : 260));
		const charge = bump(t, 0, TT.p1 - 40);

		pose.rigid = {
			sx: 1 - 0.05 * charge + 0.03 * swell,
			sy: 1 - 0.06 * charge + 0.03 * swell,
			rot: 1.5 * flick(t, TT.p2, 2.4, 3.4) - 1.5 * flick(t, TT.p3, 2.4, 3.4) + 2.5 * flick(t, TT.flare, 2, 3),
			pop: 1 + 0.045 * swell,
			dx: 0,
			dy: -5 * swell,
		};

		// the hood lifts on every pulse, higher each time, and flaps shut after the flare
		let hood = 0;
		PULSES.forEach(([t0, k]) => (hood -= Math.min(1, k) * 4.2 * Math.max(0, flick(t, t0 - 60, 2.4, 3.2))));
		b('hood').angle = Math.max(-4.4, hood) + 1.4 * flick(t, TT.flare + 380, 2.6, 5);
		b('cable').angle = 6 * flick(t, TT.p1, 1.8, 2.4) + 7 * flick(t, TT.flare, 1.6, 2.2);
		// the bulb breathes with every pulse, deepest on the flare
		b('bulb').along = b('bulb').across = 1 + 0.06 * Math.min(1.4, swell);

		pose.air = Math.min(1, 0.5 * swell);
		pose.flash = Math.min(
			0.8,
			0.12 * ramp(t, 0, TT.p1) * (1 - ramp(t, TT.flare + 200, TT.done - 200)) +
				PULSES.reduce((a, [t0, k]) => a + 0.5 * k * bump(t, t0 - 120, t0 + (k > 1 ? 520 : 300)), 0),
		);
		pose.sheen = t >= TT.flare - 100 && t <= TT.flare + 400 ? (t - TT.flare + 100) / 500 : -1;
		pose.plateHit = 1 + 0.02 * swell;
		return pose;
	},
};

/**
 * S_IDLE — the beacon ticking over while it waits on the board (IdleActors).
 * A flicker of its orange light, the hood rattling on its hinge, the cable
 * swaying: something live and powered sitting there, not a win.
 */
export const S_IDLE: MeshWinSpec = {
	...S,
	noLand: true,
	durationMs: 1100,
	landMs: 1100,
	hitMs: 99999,
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// a stutter of the lamp: two quick flickers and a softer one
		const flick3 = bump(t, 60, 180) + 0.8 * bump(t, 230, 330) + 0.5 * bump(t, 420, 620);
		pose.flash = 0.28 * flick3;
		pose.rigid.pop = 1 + 0.015 * flick3;
		b('hood').angle = -2 * Math.max(0, flick(t, 80, 4, 5)) + 1.2 * flick(t, 400, 3, 4);
		b('cable').angle = 5 * flick(t, 150, 1.8, 2.6);
		b('bulb').along = b('bulb').across = 1 + 0.055 * Math.min(1, flick3);
		return pose;
	},
};
