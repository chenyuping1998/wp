/**
 * H2 — THE CRYSTAL CLUSTER. The rock it grows from stays put; the crystals
 * CHARGE: the two side clusters flare outward from their roots and spring
 * back, the tall spire in the middle swells, and the whole cluster flashes
 * cyan, not gold — a gold flash read as the crystal turning yellow.
 *
 * PANEL mode, and it cannot lift: the spire's tip is at y 13, already inside
 * the frame band, so any upward move folds the strip above it. Everything
 * here moves sideways or swells in place, and the spire hands its weight back
 * to the panel as it nears the frame (the GoBananubis Wild's crown, again).
 *
 * Coordinates are the 256 canvas (h2.png, 2026-09-25): spire (108..150,
 * 12..190), left cluster tips ~(80,58), right cluster tips ~(190,55), rock base
 * (58..236, 120..236).
 */
import {
	bump,
	flick,
	panelParts,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rect,
	type Rig,
} from './meshRig';

const INNER: Rect = [16, 14, 240, 240];
const T = { crouch: 110, hit: 250, land: 1150, done: 1450 };

const SPIRE = polygon([[106, 190], [110, 42], [126, 12], [144, 42], [152, 190]]);
const LEFT = polygon([[74, 60], [96, 48], [118, 110], [118, 176], [94, 172], [66, 108]]);
const RIGHT = polygon([[146, 110], [172, 50], [202, 58], [200, 128], [178, 172], [146, 172]]);
const CLUSTER = polygon([[64, 52], [106, 44], [124, 10], [146, 40], [206, 50], [206, 140], [170, 200], [120, 206], [80, 186], [60, 110]]);

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	sprite: 'gbH2',
	mode: 'panel',
	feetY: 205,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.hit,
	sparkAt: [128, 110],
	flashTint: 0xbff6ff,
	inked: (p) => CLUSTER(p) === 0,
	// the crystal is cyan; the rock between the shards is not
	inkColor: (r, g, b) => b - r > 25 && b > 90,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'spire',
				parent: 'panel',
				pivot: [128, 190],
				axis: [0, -1],
				priority: 3,
				dist: SPIRE,
				// rooted in the rock below, and handed back to the panel at the tip
				keep: (p) => smoothstep((190 - p[1]) / 16) * smoothstep((p[1] - 14) / 20),
			},
			{
				name: 'left',
				parent: 'panel',
				pivot: [112, 172],
				axis: [-0.45, -1],
				priority: 2,
				dist: LEFT,
				keep: (p) => smoothstep((172 - p[1]) / 18),
			},
			{
				name: 'right',
				parent: 'panel',
				pivot: [158, 170],
				axis: [0.55, -1],
				priority: 2,
				dist: RIGHT,
				keep: (p) => smoothstep((170 - p[1]) / 18),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H2 --limits, 2026-09-25):
	//   spire +3 -3 (never turned)   left +3 -3.5   right +4 -4
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		spire: { pos: 1, neg: 1 },
		left: { pos: 2.2, neg: 2.6 },
		right: { pos: 3, neg: 3 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the charge: drawn in, then flared open, springing back — twice
		const charge = track(t, [[0, 0], [T.crouch, -0.35, 'out'], [T.hit, 1, 'out'], [420, 0]]) + 0.55 * flick(t, 420, 2.2, 2.6);
		const pulse2 = 0.5 * Math.max(0, flick(t, 760, 2.4, 3.4));
		const flare = charge + pulse2;
		// left: - swings its tips out to the left; right: + out to the right
		b('left').angle = -FLARE_DEG * flare;
		b('right').angle = FLARE_DEG * flare;
		b('left').along = 1 + 0.025 * flare;
		b('right').along = 1 + 0.025 * flare;

		const spire = b('spire');
		spire.across = 1 + 0.06 * Math.max(0, flare) + 0.02 * Math.sin(t / 60) * ramp(t, 300, 400) * (1 - ramp(t, 1000, 1150));
		spire.along = 1 + 0.015 * Math.max(0, flare);

		// the base knocks on the hit and the landing
		const panel = b('panel');
		panel.along = track(t, [[0, 1], [T.crouch, 0.985, 'out'], [T.hit, 1.005, 'out'], [420, 1], [T.land - 20, 1], [T.land + 50, 0.985, 'out'], [T.done, 1, 'out']]);

		pose.air = 0;
		// bright and short, twice: the charge and its echo
		pose.flash = 0.42 * track(t, [[T.crouch, 0], [T.hit, 1, 'out'], [560, 0, 'in']]) + 0.22 * bump(t, 740, 1000);
		pose.sheen = t >= 360 && t <= 900 ? (t - 360) / 540 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 420) + 0.02 * bump(t, T.land, T.land + 140);
		return pose;
	},
};

// how far the side clusters flare: set from the measured limit
const FLARE_DEG = 2;
