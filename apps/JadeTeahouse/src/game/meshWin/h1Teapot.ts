/**
 * H1 — THE JADE TEAPOT POURS (2026-11-06 act; was one big leap with a tip at
 * the top). It winds up leaning back while the dragon rears, hops out of its
 * frame turning toward the viewer, comes down on its card and — the hold —
 * tips forward on the spout's foot and POURS: the spout dips, the lid lifts
 * and rattles, the dragon on the handle leans after it. Then it rights itself
 * with a small second hop and the lid clatters home last.
 *
 * The turn is a fake 3-D look (ppVocabulary lookPart): the swirls on the belly
 * slide further than the silhouette, so the pot reads as turning, not sliding.
 *
 * CUT mode: the painting is already a cut-out over a separate paper card
 * (Symbol.svelte), so the card stays still and the teapot itself performs.
 *
 * Coordinates are the 256 canvas of sushiSymbols/h1.png (2026-10-09):
 * knob (122,45) r16, lid dome+rim (62..186, 28..104), spout (14..62, 92..140),
 * dragon head (166..234, 40..92), foot to y 230.
 */
import { flick, polygon, restPose, smoothstep, turnAbout, type MeshWinSpec, type Rig } from './meshRig';
import { ACT, holdTrack, stageAct } from './act';
import { lagged, lookPart, ppTrack } from './ppVocabulary';

const BODY = polygon([[14, 96], [50, 92], [70, 104], [100, 52], [122, 28], [146, 52], [176, 90], [168, 58], [205, 40], [230, 50], [244, 100], [240, 170], [232, 200], [196, 204], [178, 230], [66, 230], [54, 206], [30, 172], [26, 135], [14, 118]]);
const LID = polygon([[106, 28], [140, 28], [146, 58], [170, 74], [186, 88], [186, 104], [62, 104], [64, 88], [80, 74], [102, 58]]);
const SPOUT = polygon([[14, 96], [42, 92], [60, 104], [62, 132], [48, 140], [30, 128], [16, 116]]);
const HEAD = polygon([[166, 58], [180, 46], [205, 40], [232, 48], [234, 80], [218, 92], [196, 84], [172, 80]]);

export const H1: MeshWinSpec = {
	symbol: 'H1',
	key: 'gbH1',
	sprite: 'gbH1',
	art: 'sushiSymbols/h1.png',
	feetY: 230,
	durationMs: ACT.done,
	landMs: ACT.back,
	hitMs: ACT.pop1,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			{ name: 'root', pivot: [128, 230], dist: () => 14 },
			{ name: 'body', parent: 'root', pivot: [124, 230], axis: [0, -1], priority: 1, dist: BODY },
			// the belly's swirls turn with a fake 3-D look
			lookPart([124, 160], 74, { parent: 'body', headPriority: 1, soft: 4 }),
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
		look: { pos: 0, neg: 0 },
		lid: { pos: 6, neg: 6 },
		spout: { pos: 8, neg: 8 },
		dragon: { pos: 9, neg: 9 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];

		// the pour: tipped forward on the card, held, righted for the second beat
		const pour = holdTrack(t, ACT.back - 20, 130, ACT.hold, 150);

		// the lid lifts and rattles while it pours, clatters on each landing
		const lid = b('lid');
		const rattle = Math.sin(t / 24) * pour;
		lid.dy = -3.2 * pour - 0.8 * Math.max(0, rattle) + 1.2 * Math.max(0, flick(t, ACT.land2, 5, 9));
		lid.angle = LID_DEG * (0.5 * rattle + 0.8 * flick(t, ACT.back, 3.4, 5) + 0.9 * flick(t, ACT.land2, 3.6, 5));

		// the spout dips into the pour, a frame after the body
		b('spout').angle = -SPOUT_DEG * lagged(t, [[0, 0], [ACT.back - 20, 0], [ACT.back + 110, 1], [ACT.hold, 1], [ACT.hold + 150, 0]], 1, 33, 1) + 2 * flick(t, ACT.land2, 2.4, 4);

		// the dragon rears on the wind-up, leans after the pour (two frames late), snaps back
		b('dragon').angle =
			DRAGON_DEG * (ppTrack(t, [[0, 0], [ACT.anticipate, 0.7], [ACT.pop1, -0.5], [ACT.back + 67, 0.9], [ACT.hold + 67, 0.7], [ACT.hold + 160, -0.4], [ACT.land2, 0], [ACT.done, 0]]) +
				0.5 * flick(t, ACT.land2, 2.2, 3));

		// the turn: toward the spout as it rises, held while it pours, back
		const look = b('look');
		look.dx = ppTrack(t, [[0, 0], [ACT.anticipate, 2], [ACT.pop1, -7], [ACT.back, -5], [ACT.hold, -6], [ACT.pop2, 2], [ACT.done, 0]]);
		look.dy = -1.5 * pour;
		look.across = 1 + 0.03 * ppTrack(t, [[0, 0], [ACT.anticipate, -1], [ACT.pop1, 1], [ACT.back, 0]]);

		const act = stageAct(t, { height: 22 });
		const rigid = act.rigid;
		// the wind-up leans back; the pour tips it 20° forward on the spout's foot
		rigid.rot += 4 * ppTrack(t, [[0, 0], [ACT.anticipate, 1], [ACT.pop1, -0.4], [ACT.back, 0]]);
		rigid.rot -= 20 * pour;
		// turned about its middle in the air, about the spout-side foot for the pour
		const onFoot = smoothstep(pour / 0.25);
		pose.rigid = turnAbout(rigid, [128 - 62 * onFoot, 140 + 88 * onFoot], 230);
		pose.air = act.air;
		pose.flash = act.flash;
		return pose;
	},
};

// set from the measured limits
const LID_DEG = 5;
const SPOUT_DEG = 6;
const DRAGON_DEG = 8;
