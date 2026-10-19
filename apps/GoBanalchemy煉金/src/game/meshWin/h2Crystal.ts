/** Alchemy v2: fixed plate; independently weighted painted parts perform.
 * No rigid flip, tile jump, or impact dust. Geometry follows the repaint. */
import {
	flick,
	polygon,
	ramp,
	restPose,
	smoothstep,
	track,
	type MeshWinSpec,
	type Rig,
} from './meshRig';

const T = { crouch: 110, hit: 250, land: 900, done: 1450 };

const SPIRE = polygon([[103, 168], [104, 42], [128, 9], [147, 40], [149, 168]]);
const LEFT = polygon([[40, 108], [42, 50], [66, 56], [98, 62], [108, 112], [106, 164], [78, 158], [58, 140]]);
const RIGHT = polygon([[150, 112], [160, 60], [201, 40], [216, 94], [206, 126], [192, 160], [152, 164]]);
const BOWL = polygon([[56, 150], [200, 150], [200, 186], [186, 226], [62, 226], [56, 186]]);
const CLUSTER = (p: [number, number]) => Math.min(polygon([[38, 106], [42, 46], [100, 58], [128, 8], [150, 38], [202, 38], [218, 96], [204, 150]])(p), BOWL(p));

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	sprite: 'gbH2',
	mode: 'panel',
	inked: (p) => CLUSTER(p) === 0,
	feetY: 226,
	durationMs: T.done,
	landMs: 99999,
	hitMs: T.hit,
	sparkAt: [128, 100],
	rig: {
		fixedBorder: 10,
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			// the bowl, which everything grows from
			{ name: 'frame', pivot: [128, 128], dist: () => 14 },
			{ name: 'panel', parent: 'frame', pivot: [128, 226], axis: [0, -1], dist: CLUSTER },
			{
				name: 'spire',
				parent: 'panel',
				pivot: [126, 168],
				axis: [0, -1],
				priority: 3,
				dist: SPIRE,
				// rooted in the bowl below
				keep: (p) => smoothstep((168 - p[1]) / 16),
			},
			{
				name: 'left',
				parent: 'panel',
				pivot: [100, 160],
				axis: [-0.6, -1],
				priority: 2,
				dist: LEFT,
				keep: (p) => smoothstep((160 - p[1]) / 18),
			},
			{
				name: 'right',
				parent: 'panel',
				pivot: [160, 160],
				axis: [0.6, -1],
				priority: 2,
				dist: RIGHT,
				keep: (p) => smoothstep((160 - p[1]) / 18),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H2 --limits, 2026-10-04) — see the gate
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		spire: { pos: 1, neg: 1 },
		left: { pos: 3, neg: 3 },
		right: { pos: 3, neg: 3 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the charge: drawn in, then flared open, springing back — twice
		const charge = track(t, [[0, 0], [T.crouch, -0.35, 'out'], [T.hit, 1, 'out'], [420, 0]]) + 0.55 * flick(t, 420, 2.2, 2.6);
		const pulse2 = 0.6 * Math.max(0, flick(t, 760, 2.4, 3.4));
		const flare = charge + pulse2;
		// left: - swings its tips out to the left; right: + out to the right
		b('left').angle = -FLARE_DEG * flare;
		b('right').angle = FLARE_DEG * flare;
		b('left').along = 1 + 0.03 * flare;
		b('right').along = 1 + 0.03 * flare;

		const spire = b('spire');
		spire.across = 1 + 0.07 * Math.max(0, flare) + 0.02 * Math.sin(t / 60) * ramp(t, 300, 400) * (1 - ramp(t, 1000, 1150));
		spire.along = 1 + 0.015 * Math.max(0, flare);

		// the bowl knocks on the hit and the landing
		const panel = b('panel');
		panel.along = track(t, [[0, 1], [T.crouch, 0.985, 'out'], [T.hit, 1.005, 'out'], [420, 1], [T.land - 20, 1], [T.land + 50, 0.985, 'out'], [T.done, 1, 'out']]);

		return pose;
	},
};

// how far the side clusters flare: set from the measured limit
const FLARE_DEG = 2.2;
