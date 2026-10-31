/**
 * H1 — THE JADE TEAPOT. It crouches, leaps off its card and, at the top of the
 * leap, tips forward to POUR — the spout dips, the lid rattles up off its rim,
 * and the golden dragon on the handle rears its head. It rights itself, lands
 * with a squash and a small second hop, and the lid clatters down last.
 *
 * CUT mode: the painting is already a cut-out over a separate paper card
 * (Symbol.svelte), so the card stays still and the teapot itself performs.
 *
 * Coordinates are the 256 canvas of sushiSymbols/h1.png (2026-10-09):
 * knob (122,45) r16, lid dome+rim (62..186, 28..104), spout (14..62, 92..140),
 * dragon head (166..234, 40..92), foot to y 230.
 */
import { blob, flick, strongLeap, polygon, ramp, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Rig } from './meshRig';

const LEAP = { crouch: 120, rise: 340, fall: 760, land: 940, hop2: 1170, done: 1450 };

const BODY = polygon([[14, 96], [50, 92], [70, 104], [100, 52], [122, 28], [146, 52], [176, 90], [168, 58], [205, 40], [230, 50], [244, 100], [240, 170], [232, 200], [196, 204], [178, 230], [66, 230], [54, 206], [30, 172], [26, 135], [14, 118]]);
const LID = polygon([[106, 28], [140, 28], [146, 58], [170, 74], [186, 88], [186, 104], [62, 104], [64, 88], [80, 74], [102, 58]]);
const SPOUT = polygon([[14, 96], [42, 92], [60, 104], [62, 132], [48, 140], [30, 128], [16, 116]]);
const HEAD = polygon([[166, 58], [180, 46], [205, 40], [232, 48], [234, 80], [218, 92], [196, 84], [172, 80]]);
const BELLY = blob([124, 168], 82, 52, 2.4);

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	sprite: 'gbH1',
	art: 'sushiSymbols/h1.png',
	feetY: 230,
	durationMs: LEAP.done,
	landMs: LEAP.land,
	hitMs: LEAP.rise,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'root', pivot: [128, 230], dist: () => 14 },
			{ name: 'body', parent: 'root', pivot: [124, 230], axis: [0, -1], priority: 1, dist: BODY },
			{
				name: 'belly',
				parent: 'body',
				pivot: [124, 224],
				axis: [0, -1],
				priority: 2,
				dist: BELLY,
				keep: (p) => smoothstep((1.05 - Math.hypot((p[0] - 124) / 82, (p[1] - 168) / 52)) / 0.4),
			},
			{
				name: 'lid',
				parent: 'body',
				pivot: [124, 104],
				axis: [0, -1],
				priority: 4,
				dist: LID,
				keep: (p) => smoothstep((100 - p[1]) / 16),
			},
			{
				name: 'spout',
				parent: 'body',
				pivot: [60, 122],
				axis: [-1, -0.4],
				priority: 3,
				dist: SPOUT,
				keep: (p) => smoothstep((60 - p[0]) / 20),
			},
			{
				name: 'dragon',
				parent: 'body',
				pivot: [214, 94],
				axis: [-0.4, -1],
				priority: 3,
				dist: HEAD,
				keep: (p) => smoothstep((94 - p[1]) / 14),
			},
		],
	},
	// geometric (check_mesh_wins.mjs H1 --limits) — see the gate
	limits: {
		body: { pos: 0, neg: 0 },
		belly: { pos: 0, neg: 0 },
		lid: { pos: 6, neg: 6 },
		spout: { pos: 8, neg: 8 },
		dragon: { pos: 9, neg: 9 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the pour: tipped forward at the top of the leap
		const pour = track(t, [[0, 0], [LEAP.rise - 60, 0], [LEAP.rise + 120, 1, 'out'], [LEAP.fall - 60, 1], [LEAP.fall + 60, 0, 'inOut']]);

		// the lid rattles up while it pours, and clatters down on each landing
		const lid = b('lid');
		const rattle = Math.sin(t / 22) * ramp(t, LEAP.rise, LEAP.rise + 80) * (1 - ramp(t, LEAP.fall - 80, LEAP.fall));
		lid.dy = -2.2 * pour - 0.6 * Math.max(0, rattle);
		lid.angle = LID_DEG * (0.6 * rattle + 0.7 * flick(t, LEAP.land, 3.4, 4.5) + 0.4 * flick(t, LEAP.hop2, 3.4, 5));

		// the spout dips as it pours
		b('spout').angle = -SPOUT_DEG * pour + 2 * flick(t, LEAP.land, 2.4, 4);

		// the dragon rears back on the spring and snaps forward on the pour
		const dragon = b('dragon');
		dragon.angle =
			DRAGON_DEG * (track(t, [[0, 0], [LEAP.crouch, 0.4, 'out'], [LEAP.rise, -0.7, 'out'], [LEAP.rise + 220, 0.5, 'inOut'], [LEAP.fall, 0.1]]) +
				0.6 * flick(t, LEAP.land, 2.2, 3));
		dragon.along = 1 + 0.03 * Math.sin(t / 60) * ramp(t, LEAP.rise, LEAP.rise + 100) * (1 - ramp(t, LEAP.fall, LEAP.land));

		// the belly breathes in on the wind-up
		const belly = b('belly');
		const breath = track(t, [[0, 0], [LEAP.crouch, -1, 'out'], [LEAP.rise, 1, 'out'], [LEAP.fall, 0.3], [LEAP.land, -0.6, 'in'], [LEAP.land + 160, 0.2, 'out'], [LEAP.done - 200, 0]]);
		belly.across = 1 + 0.04 * breath;
		belly.along = 1 - 0.025 * breath;

		const { rigid, air } = strongLeap(t, LEAP, 38);
		rigid.rot += -16 * pour;
		pose.rigid = turnAbout(rigid, [128, 140], 230);
		pose.air = air;
		return pose;
	},
};

// set from the measured limits
const LID_DEG = 4;
const SPOUT_DEG = 4;
const DRAGON_DEG = 7;
