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
import { blob, flick, polygon, restPose, smoothstep, turnAbout, type MeshWinSpec, type Rig } from './meshRig';
import { ACT, stageAct } from './act';
import { lagged, ppTrack, type PPKey } from './ppVocabulary';

const BODY = polygon([[134, 12], [152, 12], [154, 30], [176, 34], [208, 52], [222, 88], [210, 124], [176, 142], [160, 152], [156, 172], [184, 208], [182, 222], [160, 234], [136, 234], [130, 200], [132, 172], [128, 152], [110, 142], [76, 124], [66, 88], [78, 52], [110, 34], [132, 30]]);
const GLOBE = blob([143, 88], 74, 48, 2.5);
const TASSEL = polygon([[136, 172], [152, 172], [160, 185], [184, 210], [176, 222], [160, 234], [138, 234], [132, 200]]);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	sprite: 'gbS',
	art: 'sushiSymbols/s.png',
	feetY: 232,
	durationMs: ACT.done,
	landMs: ACT.back,
	hitMs: ACT.pop1,
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

		// A LANTERN HANGS (2026-11-06): it no longer bounces like a ball. It is
		// pulled back, let go, and swings from its hook (out, back, out a little
		// less) while the tassel follows a couple of frames late and further.
		// Its light swells on each turn of the swing. The lift is only a breath.
		const swingKeys: PPKey[] = [[0, 0], [ACT.anticipate, -0.35], [ACT.pop1, 1], [800, -0.65], [ACT.pop2, 0.4], [ACT.land2, -0.12], [ACT.done, 0, 'settle']];
		const swing = ppTrack(t, swingKeys);
		b('body').angle = 2 * flick(t, ACT.pop1, 2.2, 4);
		b('tassel').angle = -TASSEL_DEG * lagged(t, swingKeys, 2, 50, 1);

		const glow = ppTrack(t, [[0, 0], [ACT.anticipate, -0.4], [ACT.pop1, 1], [600, 0.3], [800, 0.8], [1000, 0.2], [ACT.pop2, 0.5], [ACT.done, 0]]);
		const globe = b('globe');
		globe.across = 1 + 0.035 * glow;
		globe.along = 1 + 0.02 * glow;

		const act = stageAct(t, { height: 6, second: 0.5, squash: 0.25 });
		act.rigid.rot += SWING_DEG * swing;
		// about the hook, not the feet
		pose.rigid = turnAbout(act.rigid, [143, 14], 232);
		pose.air = act.air;
		pose.flash = act.flash * 0.6 + 0.12 * Math.max(0, glow);
		return pose;
	},
};

const SWING_DEG = 12;
const TASSEL_DEG = 9;
