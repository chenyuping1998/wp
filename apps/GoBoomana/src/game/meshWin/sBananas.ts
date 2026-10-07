/**
 * S — THE BANANA SCATTER. A golden bunch on a pile of rock and nuggets. The
 * bunch hops up off the pile, the long top banana fans away from the others
 * while it hangs, and it drops back onto the rocks with a squash. The rocks and
 * nuggets stay where they are — they are what it jumps off.
 *
 * PANEL mode: the bunch lies on the rock pile, which a cut would tear. The
 * plain dark stone round the bunch absorbs the stretch.
 *
 * Coordinates are the 256 canvas (s.png, 2026-09-25): bunch (21..211, 29..179),
 * stem top (184,36), rock pile (40..236, 150..232).
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

const INNER: Rect = [16, 16, 240, 240];
const T = { crouch: 110, rise: 300, fall: 860, land: 1040, done: 1400 };

const BUNCH = polygon([[18, 84], [110, 52], [160, 40], [176, 24], [198, 28], [212, 70], [214, 150], [182, 184], [70, 184], [26, 152]]);
const UPPER = polygon([[18, 72], [160, 38], [182, 70], [112, 104], [22, 112]]);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	sprite: 'gbS',
	mode: 'panel',
	feetY: 180,
	durationMs: T.done,
	landMs: T.land,
	hitMs: 220,
	sparkAt: [120, 100],
	inked: (p) => BUNCH(p) === 0,
	// gold: bright and yellow; the stone and the dark rocks are neither
	inkColor: (r, g, b) => r > 140 && g > 100 && r - b > 70,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{
				name: 'bunch',
				parent: 'panel',
				// scaled about its middle: from the base, every 1% of stretch threw
				// the stem 1.5px up at the frame (GoBananubis's Wild, again)
				pivot: [118, 112],
				axis: [0, -1],
				priority: 1,
				dist: BUNCH,
				// the stem's tip is 8px from the frame: it hands its weight back to
				// the panel there, or the hop folds the strip above it
				keep: (p) => smoothstep((p[1] - 16) / 22),
			},
			{
				name: 'upper',
				parent: 'bunch',
				// the top banana fans from where the bunch is joined at the stem
				pivot: [168, 96],
				axis: [-1, -0.25],
				priority: 3,
				dist: UPPER,
				keep: (p) => smoothstep((164 - p[0]) / 30),
			},
		],
	},
	// geometric (check_mesh_wins.mjs S --limits, 2026-09-25):
	//   bunch +4.5 -4.5   upper +4.5 -3.5
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		bunch: { pos: 3, neg: 3 },
		upper: { pos: 3.2, neg: 2.5 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [T.fall, 1], [T.land, 0, 'in']]);
		const hover = ramp(t, 260, 400) * (1 - ramp(t, T.fall - 100, T.fall));
		const bunch = b('bunch');
		bunch.dy = -HOP * air - 1.4 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 520);
		bunch.along = track(t, [[0, 1], [T.crouch, 0.95, 'out'], [220, 1.025, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.95, 'out'], [1200, 1.01], [1300, 1]]);
		bunch.across = track(t, [[0, 1], [T.crouch, 1.04, 'out'], [220, 0.98, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 1.04, 'out'], [1300, 1]]);
		// it tilts as it hangs, like something tossed
		bunch.angle = TILT_DEG * flick(t, 280, 1.3, 1.6) - 0.7 * TILT_DEG * flick(t, T.land, 2.4, 4);
		// the top banana fans open and closes
		b('upper').angle = FAN_DEG * Math.max(0, flick(t, 360, 1.5, 2.2)) - 0.6 * FAN_DEG * Math.max(0, flick(t, T.land, 2.6, 4));

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.36 * track(t, [[T.crouch, 0], [220, 1, 'out'], [640, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 960 ? (t - 380) / 580 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 400) + 0.025 * bump(t, T.land, T.land + 140);
		return pose;
	},
};

// set from the measured limits
const HOP = 4;
const TILT_DEG = 1.8;
const FAN_DEG = 2.5;
