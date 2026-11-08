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
import { flick, polygon, restPose, smoothstep, turnAbout, type MeshWinSpec, type Rig } from './meshRig';
import { ACT, holdTrack, stageAct } from './act';
import { lagged, lookPart, ppTrack } from './ppVocabulary';

const BODY = polygon([[96, 36], [156, 36], [150, 68], [214, 86], [212, 106], [190, 118], [186, 150], [214, 164], [212, 188], [162, 200], [160, 216], [88, 216], [86, 200], [34, 188], [32, 164], [64, 150], [60, 118], [36, 106], [34, 86], [100, 68]]);
const LID = polygon([[96, 38], [156, 38], [148, 68], [190, 78], [214, 88], [212, 104], [180, 114], [70, 114], [36, 104], [34, 88], [62, 78], [102, 68]]);
const SAUCER = polygon([[32, 165], [70, 154], [180, 154], [214, 165], [212, 186], [165, 198], [160, 214], [88, 214], [84, 198], [36, 186]]);

export const H2: MeshWinSpec = {
	symbol: 'H2',
	key: 'gbH2',
	sprite: 'gbH2',
	art: 'sushiSymbols/h2.png',
	feetY: 214,
	durationMs: ACT.done,
	landMs: ACT.back,
	hitMs: ACT.pop1,
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
			// the cup's flowers turn with a fake 3-D look
			lookPart([124, 132], 62, { parent: 'body', headPriority: 1, soft: 4 }),
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
		look: { pos: 0, neg: 0 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// 刮茶: back on its saucer, the lid lifts a little and is drawn across the
		// rim twice (the way a gaiwan skims the leaves), then set down with a clink
		const scrape = holdTrack(t, ACT.back + 30, 110, ACT.hold, 120);
		const stroke = ppTrack(t, [[0, 0], [ACT.back + 40, 0], [800, 1], [890, -0.7], [975, 0.7], [ACT.hold + 80, 0]]);
		const lid = b('lid');
		// on the way up it trails a frame behind the cup and floats off the rim
		const trail = lagged(t, [[0, 0], [ACT.anticipate, 0.4], [ACT.pop1, -1], [ACT.back - 40, 0.2], [ACT.back + 40, 0]], 1, 33, 1);
		lid.dy = 3 * trail - 3.4 * scrape + 1.4 * Math.max(0, flick(t, ACT.hold + 120, 5, 8)) + 0.8 * Math.max(0, flick(t, ACT.land2, 5, 8));
		lid.dx = 3.6 * stroke;
		lid.angle = LID_DEG * (-0.7 * scrape * (0.6 + 0.4 * stroke) + 0.6 * flick(t, ACT.back, 3.6, 5) + 0.5 * flick(t, ACT.hold + 120, 3.8, 6));

		// the cup turns toward the hand that scrapes (fake 3-D), back as it rises again
		const look = b('look');
		look.dx = ppTrack(t, [[0, 0], [ACT.anticipate, -2], [ACT.pop1, 5], [ACT.back, 2], [820, -4], [ACT.hold, -3], [ACT.pop2, 2], [ACT.done, 0]]);

		const saucer = b('saucer');
		saucer.angle = SAUCER_DEG * (flick(t, ACT.back, 2.6, 4) + 0.6 * flick(t, ACT.land2, 2.8, 5) - 0.5 * flick(t, ACT.anticipate - 60, 3, 6));
		saucer.across = 1 + 0.02 * ppTrack(t, [[0, 0], [ACT.back - 20, 0], [ACT.back + 60, 1], [ACT.back + 260, 0]]);

		const act = stageAct(t, { height: 20 });
		// a quarter turn of the wrist in the air, toward the scrape
		act.rigid.rot += 6 * ppTrack(t, [[0, 0], [ACT.anticipate, -0.4], [ACT.pop1, 1], [ACT.back, 0], [ACT.pop2, -0.5], [ACT.land2, 0]]);
		pose.rigid = turnAbout(act.rigid, [124, 130], 214);
		pose.air = act.air;
		pose.flash = act.flash;
		return pose;
	},
};

const LID_DEG = 4;
const SAUCER_DEG = 2;
