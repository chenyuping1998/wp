/**
 * H4 — THE LIFE-SUPPORT PACK. It fires: a squash as it pressurises, a jump
 * off the cell on the burst, a hover with a slow bob, and the left canister and
 * top handle settling after it. The pack body stays rigid.
 *
 * The central dial catches the pressure surge and the violet status lights
 * blink (spec.feature). The dial mesh uses a fine grid so its motion stays
 * local to the painted hardware.
 */
import { bump, flick, polygon, polyline, ramp, restPose, smoothstep, track, type MeshWinSpec, type Point, type Rig, boneOf, landFlick } from './meshRig';

const T = { crouch: 120, rise: 300, fall: 640, land: 820, done: 1000 };
const HOSE_PIVOT: Point = [118, 60];
// A small rotating highlight on the central life-support dial.
const NEEDLE_PIVOT: Point = [132, 112];
const NEEDLE = polyline([[128, 119], [140, 101]], 2.5);
// the central dial and one lower status light
const LAMPS: Point[] = [[128, 112], [151, 203]];

export const H4: MeshWinSpec = {
	symbol: 'H4',
	key: 'gbH4',
	sprite: 'gbH4',
	feetY: 240,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 240,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 72, rows: 72 },
		soft: 4,
		parts: [
			{ name: 'core', pivot: [128, 222], dist: (p) => Math.min(14, polygon([[64, 60], [198, 60], [198, 228], [64, 228]])(p)) },
			{
				// The left canister and its top connector.
				name: 'hose',
				parent: 'core',
				pivot: HOSE_PIVOT,
				axis: [-1, 0.2],
				dist: polygon([[26, 24], [124, 22], [124, 56], [64, 58], [62, 176], [26, 176]]),
				// and fading out again at the bottom, where it runs into the strap:
				// without that the swing tore the strap at (54,180)
				keep: (p) =>
					smoothstep((Math.hypot(p[0] - HOSE_PIVOT[0], p[1] - HOSE_PIVOT[1]) - 10) / 20) *
					smoothstep((172 - p[1]) / 34),
			},
			{
				name: 'vent',
				parent: 'core',
				pivot: [152, 60],
				axis: [0.3, -1],
				dist: polygon([[132, 26], [176, 26], [176, 58], [132, 58]]),
				keep: (p) => smoothstep((60 - p[1]) / 12),
			},
			{
				name: 'needle',
				parent: 'core',
				pivot: NEEDLE_PIVOT,
				axis: [14, -22],
				priority: 6,
				dist: NEEDLE.dist,
			},
		],
	},
	// the status lamps: saturated purple, in two small spots
	feature: {
		test: (r, g, b) => r > 120 && b > 160 && b - g > 60,
		inside: (p) => LAMPS.some((c) => Math.hypot(p[0] - c[0], p[1] - c[1]) < 9),
		tint: 0xe8b8ff,
	},
	// geometric (check_mesh_wins.mjs H4 --limits): hose +5.5 -4.5   vent +8 -9.5
	limits: {
		hose: { pos: 4, neg: 3.5 },
		vent: { pos: 6, neg: 7 },
		// geometric (check_mesh_wins.mjs H4 --limits): needle +16.5 -14 — a 2px
		// line turning through a still dial drags the face beside it — and the
		needle: { pos: 12, neg: 12 },
	},
	// landing: the hoses whip
	land: (rig, t, k, pose) => {
		boneOf(rig, pose, 'hose').angle = 2.4 * k * landFlick(t, 30);
		boneOf(rig, pose, 'vent').angle = -4 * k * landFlick(t, 40);
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const hover = ramp(t, T.rise - 20, T.rise + 80) * (1 - ramp(t, T.fall - 100, T.fall));

		pose.rigid = {
			sx: track(t, [[0, 1], [T.crouch, 1.07, 'out'], [220, 0.96, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 1.07, 'out'], [930, 0.99], [T.done, 1]]),
			sy: track(t, [[0, 1], [T.crouch, 0.89, 'out'], [220, 1.03, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 50, 0.9, 'out'], [930, 1.01], [T.done, 1]]),
			rot: 2.5 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 420),
			pop: 1 + 0.025 * air,
			dx: 0,
			dy: -6 * air - 1.5 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 300),
		};

		// the hose trails the jump and whips on the landing
		b('hose').angle = 3.6 * flick(t, T.crouch + 30, 2, 2.8) - 2.8 * flick(t, T.land, 2.6, 4);
		const vent = b('vent');
		vent.angle = -6 * flick(t, T.crouch + 60, 2.6, 3) + 3.5 * flick(t, T.land, 3, 4.5);
		vent.along = 1 + 0.06 * bump(t, T.crouch, T.rise + 60);

		// the needle whips to the stop as it fires (- is anticlockwise), hangs
		// trembling, kicks again on the landing, and settles
		b('needle').angle =
			-9.5 * track(t, [[0, 0], [T.crouch, 0], [220, 1, 'back'], [T.fall, 0.85], [T.land + 120, 0, 'inOut']]) +
			1.5 * Math.sin(t / 18) * ramp(t, 240, 320) * (1 - ramp(t, T.fall - 60, T.fall)) +
			5 * flick(t, T.land, 3.5, 4);
		// the lamps blink: on-off-on on the burst, a double flash on the landing
		const blink = (at: number, len = 70) => (t >= at && t < at + len ? 1 : 0) * (1 - ramp(t, at + len - 20, at + len));
		pose.feature = 0.9 * Math.max(blink(T.crouch + 60), blink(T.crouch + 190), blink(T.crouch + 320, 120), blink(T.land + 20), blink(T.land + 140));

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.3 * track(t, [[T.crouch, 0], [240, 1, 'out'], [600, 0, 'in']]);
		pose.sheen = t >= 340 && t <= 800 ? (t - 340) / 460 : -1;
		pose.plateHit = 1 + 0.03 * bump(t, T.crouch, 400) + 0.02 * bump(t, T.land, T.land + 150);
		return pose;
	},
};
