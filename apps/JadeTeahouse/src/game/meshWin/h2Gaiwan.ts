/**
 * H2 — THE LIDDED TEA BOWL (gaiwan). It leaps off its card with the lid
 * lagging behind — lifted off the bowl by the spring, tipping to let the
 * steam out — and the lid only catches up at the top. On the landing the lid
 * clinks back down onto the rim, twice, and the saucer settles under it.
 *
 * CUT mode, over its card (Symbol.svelte).
 *
 * Coordinates are the 256 canvas of sushiSymbols/h2.png (2026-10-09):
 * knob (97..153, 38..72), lid flange (34..214, 78..114), bowl (60..190,
 * 110..185), saucer (32..214, 150..214).
 */
import { flick, leap, polygon, ramp, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Rig } from './meshRig';

const LEAP = { crouch: 120, rise: 330, fall: 740, land: 920, hop2: 1150, done: 1450 };

const BODY = polygon([[96, 36], [156, 36], [150, 68], [214, 86], [212, 106], [190, 118], [186, 150], [214, 164], [212, 188], [162, 200], [160, 216], [88, 216], [86, 200], [34, 188], [32, 164], [64, 150], [60, 118], [36, 106], [34, 86], [100, 68]]);
const LID = polygon([[96, 38], [156, 38], [148, 68], [190, 78], [214, 88], [212, 104], [180, 114], [70, 114], [36, 104], [34, 88], [62, 78], [102, 68]]);
const SAUCER = polygon([[32, 165], [70, 154], [180, 154], [214, 165], [212, 186], [165, 198], [160, 214], [88, 214], [84, 198], [36, 186]]);

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	sprite: 'gbH2',
	art: 'sushiSymbols/h2.png',
	feetY: 214,
	durationMs: LEAP.done,
	landMs: LEAP.land,
	hitMs: LEAP.rise,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'root', pivot: [124, 214], dist: () => 14 },
			{ name: 'body', parent: 'root', pivot: [124, 214], axis: [0, -1], priority: 1, dist: BODY },
			{
				name: 'lid',
				parent: 'body',
				pivot: [124, 112],
				axis: [0, -1],
				priority: 4,
				dist: LID,
				keep: (p) => smoothstep((108 - p[1]) / 12),
			},
			{
				name: 'saucer',
				parent: 'body',
				pivot: [124, 200],
				axis: [0, -1],
				priority: 3,
				dist: SAUCER,
				keep: (p) => smoothstep((p[1] - 160) / 14),
			},
		],
	},
	limits: {
		body: { pos: 0, neg: 0 },
		lid: { pos: 6, neg: 6 },
		saucer: { pos: 4, neg: 4 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the lid lags the spring: left behind on the way up, lifts off the rim
		// while the bowl hangs, and clinks back down on each landing
		const lift = track(t, [[0, 0], [LEAP.crouch, 0.3, 'out'], [LEAP.rise, 1, 'out'], [LEAP.fall - 80, 0.9], [LEAP.land - 20, 0, 'in']]);
		const lid = b('lid');
		lid.dy = -4 * lift + 1.2 * flick(t, LEAP.land, 4, 6) + 0.6 * flick(t, LEAP.hop2, 4, 7);
		lid.angle = LID_DEG * (0.8 * lift * Math.sin((t - LEAP.rise) / 110) * ramp(t, LEAP.rise - 60, LEAP.rise + 60) + 0.6 * flick(t, LEAP.land, 3.6, 5));

		// the saucer rocks under the landing
		const saucer = b('saucer');
		saucer.angle = SAUCER_DEG * (flick(t, LEAP.land, 2.6, 4) - 0.5 * flick(t, LEAP.crouch, 3, 6));
		saucer.across = 1 + 0.02 * track(t, [[0, 0], [LEAP.land - 20, 0], [LEAP.land + 60, 1, 'out'], [LEAP.land + 260, 0]]);

		const { rigid, air } = leap(t, LEAP, 24);
		// a lazy half-turn wobble in the air, the tea bowl being carried
		rigid.rot = 7 * Math.sin((Math.PI * (t - LEAP.rise)) / 260) * ramp(t, LEAP.rise - 80, LEAP.rise) * (1 - ramp(t, LEAP.fall - 120, LEAP.fall + 40));
		pose.rigid = turnAbout(rigid, [124, 130], 214);
		pose.air = air;
		return pose;
	},
};

// set from the measured limits
const LID_DEG = 4;
const SAUCER_DEG = 2;
