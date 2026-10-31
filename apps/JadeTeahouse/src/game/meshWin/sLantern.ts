/**
 * S — THE JADE LANTERN (the Scatter). It floats up off its card like a lantern
 * on a festival night, swings from its top ring while it hangs there, the
 * glass globe swells as if the flame inside caught, and the red tassel trails
 * every swing a beat late. It settles back down swinging gently.
 *
 * CUT mode, over its card (Symbol.svelte).
 *
 * Coordinates are the 256 canvas of sushiSymbols/s.png (2026-10-09):
 * ring (143,18), globe (143,88) 74x48, jade bead (144,166), tassel
 * (132..184, 172..232).
 */
import { blob, flick, strongLeap, polygon, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Rig } from './meshRig';

const LEAP = { crouch: 120, rise: 380, fall: 820, land: 1000, hop2: 1220, done: 1500 };

const BODY = polygon([[134, 12], [152, 12], [154, 30], [176, 34], [208, 52], [222, 88], [210, 124], [176, 142], [160, 152], [156, 172], [184, 208], [182, 222], [160, 234], [136, 234], [130, 200], [132, 172], [128, 152], [110, 142], [76, 124], [66, 88], [78, 52], [110, 34], [132, 30]]);
const GLOBE = blob([143, 88], 74, 48, 2.5);
const TASSEL = polygon([[136, 172], [152, 172], [160, 185], [184, 210], [176, 222], [160, 234], [138, 234], [132, 200]]);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	sprite: 'gbS',
	art: 'sushiSymbols/s.png',
	feetY: 232,
	durationMs: LEAP.done,
	landMs: LEAP.land,
	hitMs: LEAP.rise,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'root', pivot: [143, 232], dist: () => 14 },
			// hung from its ring
			{ name: 'body', parent: 'root', pivot: [143, 20], axis: [0, 1], priority: 1, dist: BODY },
			{
				name: 'globe',
				parent: 'body',
				pivot: [143, 88],
				axis: [0, -1],
				priority: 2,
				dist: GLOBE,
				keep: (p) => smoothstep((1.02 - Math.hypot((p[0] - 143) / 74, (p[1] - 88) / 48)) / 0.3),
			},
			{
				name: 'tassel',
				parent: 'body',
				pivot: [144, 170],
				axis: [0, 1],
				priority: 4,
				dist: TASSEL,
				keep: (p) => smoothstep((p[1] - 172) / 12),
			},
		],
	},
	limits: {
		body: { pos: 6, neg: 6 },
		globe: { pos: 0, neg: 0 },
		tassel: { pos: 14, neg: 14 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// it swings from its ring while it floats, and once more on settling
		const swing = flick(t, LEAP.crouch + 80, 1.1, 1.2) + 0.5 * flick(t, LEAP.land, 1.6, 2.6);
		b('body').angle = SWING_DEG * swing;
		// the tassel trails each swing a beat late, and further
		b('tassel').angle = -TASSEL_DEG * (flick(t, LEAP.crouch + 260, 1.1, 1.4) + 0.6 * flick(t, LEAP.land + 120, 1.8, 2.4));

		// the flame catches: the globe swells at the top
		const glow = track(t, [[0, 0], [LEAP.crouch, -0.4, 'out'], [LEAP.rise, 1, 'out'], [LEAP.fall, 0.5], [LEAP.land, 0, 'in']]);
		const globe = b('globe');
		globe.across = 1 + 0.035 * glow;
		globe.along = 1 + 0.02 * glow;

		const { rigid, air } = strongLeap(t, LEAP, 28);
		pose.rigid = turnAbout(rigid, [143, 100], 232);
		pose.air = air;
		return pose;
	},
};

// set from the measured limits
const SWING_DEG = 4;
const TASSEL_DEG = 9;
