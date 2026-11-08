/**
 * Every symbol's win, acted by ITS OWN PARTS (2026-11-07, round 3).
 *
 * The user: "I want the picture itself to move, not the whole tile." So the
 * tile barely moves — a 3 px lift and a 1.5 % swell carry the beat — and the
 * acting is in the features: eyes that blink, ears that twitch, mouths that
 * open, ribbons and tails that swing a beat behind.
 *
 *   H1 sarcophagus  both eyes blink, the ears twitch one after the other, the
 *                   crossed paws pat twice, the bow's ribbon swings
 *   H2 canopic jar  the cat's smile squeezes, the head sways side to side,
 *                   ears twitch, the scarf's end swings
 *   H3 yarn ball    the core twists against the outer wraps, the thread
 *                   whips, the loose bandage flutters
 *   H4 fish bones   chomps twice, blinks, the tail fin flaps
 *   W  mummy cat    laughs (the mouth opens wider twice), winks, the ears
 *                   twitch, the head leans
 *   S  gold mask    the sapphire eyes, the forehead scarab and the collar gem
 *                   swell and gleam, the ears lift
 *   L1-L5 letters   the stone stays put; the letter pops inside it and the
 *                   bandage knot's tails flap
 *
 * Rhythm (slot-motion-recipes §1.2): 0.14 s anticipation, 0.27 s the blink or
 * wink, 0.41 s the big action, held, 1.1-1.23 s the second one, home by 1.5 s
 * (meshRig.settled blends the last 180 ms). Each follower is LATE on what drives
 * it by 60-140 ms. Coordinates: the 256 canvas, read off grids of the cut
 * subjects and the panel art (2026-11-07).
 *
 * H1-H4 and the letters run in CUT mode (design/cut_mummy_symbols.py: subject,
 * plate recess, shadow); W and S in PANEL mode (the art runs into its frame).
 */
import {
	blob,
	bump,
	flick,
	panelParts,
	polygon,
	polyline,
	ramp,
	restPose,
	track,
	union,
	type MeshWinSpec,
	type PartSpec,
	type Point,
	type Pose,
	type Rig,
} from './meshRig';
import { MUMMY_SYMBOLS } from './mummySymbols';

const DONE = 1500;
const GRID = { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 };
const INNER: [number, number, number, number] = [12, 12, 244, 244];

/** the three-beat drive, -1..1: dip, big beat at 0.41 s, smaller one at 1.18 s */
const beat3 = (t: number, delay = 0) =>
	track(t - delay, [[0, 0], [140, -0.45], [410, 1], [600, 0], [1000, 0], [1180, 0.8], [1400, 0], [DONE, 0]]);
/** an eye: shut for ~0.1 s starting at `at` */
const blink = (t: number, at: number) => ramp(t, at, at + 40) * (1 - ramp(t, at + 110, at + 170));
const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

/** a feature: claims its region (priority) and blends into its parent over `fade` px */
const feature = (name: string, parent: string, pivot: Point, dist: (p: Point) => number, fade = 10, axis?: Point): PartSpec => ({
	name,
	parent,
	pivot,
	axis,
	dist,
	priority: 30,
	keep: (p: Point) => 1 - ramp(dist(p), 0, fade),
});

/** the tile carries the beat, barely: 3 px, 1.5 % */
const carry = (rig: Rig, t: number, lift = 3): Pose => {
	const pose = restPose(rig);
	const b = beat3(t);
	pose.rigid = { sx: 1 - 0.01 * Math.min(0, b), sy: 1 + 0.012 * Math.min(0, b), rot: 0, pop: 1 + 0.015 * Math.max(0, b), dx: 0, dy: -lift * Math.max(0, b) };
	pose.air = 0.25 * Math.max(0, b);
	pose.flash = 0.18 * bump(t, 300, 640) + 0.12 * bump(t, 1060, 1340);
	pose.sheen = t > 240 && t < 720 ? (t - 240) / 480 : -1;
	return pose;
};

const cut = (s: string, feetY: number, parts: PartSpec[], limits: MeshWinSpec['limits'], collapsible: string[], pose: (rig: Rig, t: number) => Pose): MeshWinSpec => ({
	symbol: s,
	key: 'gb' + s,
	mode: 'cut',
	feetY,
	durationMs: DONE,
	landMs: 1380,
	hitMs: 410,
	flashTint: 0xf2e8d0,
	rig: { grid: GRID, soft: 6, parts },
	limits,
	collapsible,
	pose,
});

// ── H1: the sarcophagus ────────────────────────────────────────────────────────
// ears (112,22) and (184,28); eyes (122,52) and (162,58); crossed paws round
// (130,98); the bow (160,152), its tails down to (178,205)
export const H1_ACT = cut(
	'H1',
	240,
	[
		{ name: 'body', pivot: [132, 240], dist: blob([135, 125], 85, 122) },
		{...feature('lid','body',[132,86],blob([143,43],66,40),22),priority:18},
		feature('ear_l', 'lid', [112, 40], polygon([[100, 40], [114, 6], [128, 36]]), 8),
		feature('ear_r', 'lid', [182, 44], polygon([[170, 42], [186, 12], [198, 46]]), 8),
		feature('eye_l', 'lid', [122, 52], blob([122, 52], 12, 8), 20),
		feature('eye_r', 'lid', [162, 58], blob([162, 58], 12, 8), 20),
		feature('paws', 'body', [130, 112], blob([130, 100], 36, 14), 22),
		feature('bow', 'body', [160, 152], polygon([[150, 142], [176, 140], [196, 206], [176, 214], [154, 176]]), 18),
	],
	{ body: { pos: 0, neg: 0 }, lid:{pos:4,neg:4}, ear_l: { pos: 12, neg: 12 }, ear_r: { pos: 12, neg: 12 }, eye_l: { pos: 0, neg: 0 }, eye_r: { pos: 0, neg: 0 }, paws: { pos: 8, neg: 8 }, bow: { pos: 12, neg: 12 } },
	['eye_l', 'eye_r'],
	(rig, t) => {
		const pose = carry(rig, t);
		const lid=bone(rig,pose,'lid');
		lid.dy=track(t,[[0,0],[140,.5],[410,-1.1],[520,-1.1],[680,.4],[850,0],[1190,-.9],[1260,-.9],[1420,0]]);
		lid.angle=track(t,[[0,0],[140,-.5],[410,.9],[560,.9],[730,-.3],[920,0],[1190,.7],[1400,0]]);
		bone(rig, pose, 'eye_l').along = 1 - 0.55 * blink(t, 250);
		bone(rig, pose, 'eye_r').along = 1 - 0.55 * blink(t, 270);
		bone(rig, pose, 'ear_l').angle = -6 * flick(t, 380, 3.2, 6) - 3.5 * flick(t, 1120, 3.4, 7);
		bone(rig, pose, 'ear_r').angle = 6 * flick(t, 470, 3.2, 6) + 3.5 * flick(t, 1200, 3.4, 7);
		// the paws pat the chest: two quick dips on the beats
		const paws = bone(rig, pose, 'paws');
		paws.dy = 2.2 * bump(t, 330, 470) + 2.2 * bump(t, 520, 660) + 1.8 * bump(t, 1100, 1240);
		// and rock as they pat (measured limit +10.5 / -12)
		paws.angle = 6 * bump(t, 330, 470) - 6 * bump(t, 520, 660) + 5 * bump(t, 1100, 1240);
		bone(rig, pose, 'bow').angle = 6 * flick(t, 460, 2.2, 3.5) - 3 * bump(t, 120, 360) + 3.5 * flick(t, 1220, 2.4, 4.5);
		return pose;
	},
);

// ── H2: the canopic jar ────────────────────────────────────────────────────────
// head (130,45), neck at the scarf (130,90); ears (102,14) and (170,14); the
// shut smiling eyes (112,50) and (152,50); the scarf's end hangs to (190,160)
export const H2_ACT = cut(
	'H2',
	242,
	[
		{ name: 'jar', pivot: [128, 242], dist: blob([128, 170], 90, 76) },
		{ ...feature('head', 'jar', [130, 92], blob([130, 48], 60, 42), 26), priority: 20 },
		feature('ear_l', 'head', [104, 30], polygon([[90, 30], [100, 4], [118, 26]]), 8),
		feature('ear_r', 'head', [162, 30], polygon([[152, 26], [170, 4], [180, 30]]), 8),
		feature('eyes', 'head', [132, 50], union(blob([112, 50], 13, 6), blob([152, 50], 13, 6)), 8),
		feature('scarf', 'jar', [174, 100], polygon([[166, 94], [200, 96], [210, 160], [190, 168], [172, 132]]), 18),
	],
	{ jar: { pos: 0, neg: 0 }, head: { pos: 7, neg: 7 }, ear_l: { pos: 12, neg: 12 }, ear_r: { pos: 12, neg: 12 }, eyes: { pos: 0, neg: 0 }, scarf: { pos: 14, neg: 14 } },
	['eyes'],
	(rig, t) => {
		const pose = carry(rig, t);
		// the contented sway: one way on the big beat, back on the second
		const head=bone(rig,pose,'head');
		head.angle=track(t,[[0,0],[140,-1.8],[410,5.8],[540,5.4],[780,-1],[1010,-3.6],[1180,-4.8],[1380,0]]);
		head.dy=track(t,[[0,0],[140,1],[410,-2.6],[560,-2.2],[780,0],[1180,-1.6],[1400,0]]);
		// the smile squeezes (the shut eyes narrow further) on each beat
		bone(rig, pose, 'eyes').along = 1 - 0.35 * bump(t, 300, 620) - 0.25 * bump(t, 1080, 1340);
		bone(rig, pose, 'ear_l').angle = -10 * flick(t, 560, 3.3, 6);
		bone(rig, pose, 'ear_r').angle = 10 * flick(t, 640, 3.3, 6) + 6 * flick(t, 1180, 3.5, 7);
		bone(rig, pose, 'scarf').angle = 6 * flick(t, 400, 2, 3.5) - 3 * bump(t, 120, 360) + 3.5 * flick(t, 1160, 2.2, 4.5);
		return pose;
	},
);

// ── H3: the yarn ball ──────────────────────────────────────────────────────────
// ball (125,105) r ~95; the thread from (190,165) round to a hook at (145,215);
// the loose bandage off the left, (100,160) -> (15,210), torn end at (105,230)
const THREAD: Point[] = [[190, 165], [228, 178], [242, 200], [232, 222], [200, 236], [160, 236], [142, 222], [150, 208]];
const RIBBON: Point[] = [[100, 160], [60, 168], [22, 188], [14, 212], [34, 232], [66, 222], [100, 238], [116, 222], [100, 198]];
export const H3_ACT = cut(
	'H3',
	228,
	[
		{ name: 'ball', pivot: [125, 205], dist: blob([125, 105], 96, 96, 2), priority: 12 },
		feature('core', 'ball', [125, 105], blob([125, 105], 52, 52, 2), 34),
		{ ...feature('thread', 'ball', [190, 168], polyline(THREAD, 9).dist, 10, [1, 0.4]), keep: (p: Point) => ramp(Math.hypot(p[0] - 190, p[1] - 168), 10, 40) },
		{ ...feature('ribbon', 'ball', [102, 160], polygon(RIBBON), 10, [-1, 0.6]), keep: (p: Point) => ramp(Math.hypot(p[0] - 102, p[1] - 160), 10, 40) },
		{...feature('thread_tip','thread',[203,211],blob([168,222],34,22),12,[-1,.2]),priority:38,keep:(p:Point)=>ramp(p[1],192,212)},
		{...feature('ribbon_tip','ribbon',[38,207],blob([67,225],47,18),14,[1,.1]),keep:(p:Point)=>ramp(p[1],199,224)},
	],
	{ ball: { pos: 0, neg: 0 }, core: { pos: 14, neg: 14 }, thread: { pos: 14, neg: 14 }, ribbon: { pos: 12, neg: 12 },thread_tip:{pos:0,neg:0},ribbon_tip:{pos:0,neg:0} },
	[],
	(rig, t) => {
		const pose = carry(rig, t);
		// the core twists against the outer wraps, as if the ball were nudged
		bone(rig, pose, 'core').angle = 12 * bump(t, 220, 700) - 8 * bump(t, 1000, 1360);
		bone(rig, pose, 'thread').angle = -5 * bump(t, 180, 480) + 9 * flick(t, 520, 1.8, 3) + 5 * flick(t, 1220, 2.1, 4);
		bone(rig, pose, 'ribbon').angle = -4 * bump(t, 220, 520) + 6.5 * flick(t, 560, 2, 3.4) + 3.5 * flick(t, 1260, 2.3, 4.5);
		// The loose ends catch up after the ball and first cloth section.
		bone(rig,pose,'thread_tip').dy=track(t,[[0,0],[280,0],[590,-1.5],[790,1.2],[1010,0],[1280,-1],[1430,0]]);
		bone(rig,pose,'ribbon_tip').dy=track(t,[[0,0],[340,0],[650,-1.7],[850,1.3],[1030,0],[1320,-1],[1470,0]]);
		return pose;
	},
);

// ── H4: the fish bones ─────────────────────────────────────────────────────────
// the eye (118,106); the open mouth (52,145), lower jaw hinged at (82,132); the
// tail fin x 200-250 hinged at (200,125); the bow (210,122)
export const H4_ACT = cut(
	'H4',
	205,
	[
		{ name: 'spine', pivot: [128, 205], dist: blob([140, 125], 70, 72) },
		feature('jaw', 'spine', [84, 134], polygon([[24, 140], [84, 132], [90, 160], [60, 178], [28, 168]]), 16),
		feature('eye', 'spine', [118, 106], blob([118, 106], 16, 14), 10),
		{ ...feature('tail', 'spine', [200, 125], union(blob([226, 125], 24, 80), blob([210, 122], 22, 20)), 10, [1, 0]), keep: (p: Point) => ramp(p[0] - 186, 0, 32) },
	],
	{ spine: { pos: 0, neg: 0 }, jaw: { pos: 8, neg: 8 }, eye: { pos: 0, neg: 0 }, tail: { pos: 12, neg: 12 } },
	['eye'],
	(rig, t) => {
		const pose = carry(rig, t);
		// two chomps: the jaw drops and snaps shut
		bone(rig, pose, 'jaw').angle = -4.5 * bump(t, 300, 520) - 4.5 * bump(t, 560, 760) - 3.5 * bump(t, 1080, 1300);
		bone(rig, pose, 'eye').along = 1 - 0.5 * blink(t, 260);
		// the tail fin swims on its own, strongest round the beats
		bone(rig, pose, 'tail').angle = track(t,[[0,0],[160,2],[410,-9],[580,6],[820,-2.5],[1030,0],[1170,-6],[1290,2.2],[1440,0]]);
		return pose;
	},
);

// ── the letters: the carved letter leaps out of its slot ───────────────────────
// The picture itself jumps (2026-11-07), as the other games' leaps do
// (PuttMonkey's strongLeap / hopRigid): the letter is cut out of its stone
// (design/cut_mummy_symbols.py) and the tile, knot and empty slot stay put.
//   0.00-0.12  sinks into a crouch, squashed (anticipation)
//   0.12-0.46  up out of the slot, stretched, swelling to 1.1
//   0.18-0.88  ONE FULL TURN about its upright axis while it is in the air
//              (the user: every letter the same, a left-right spin)
//   0.95       lands hard back in the slot: squash, sprung at ~4 Hz
//   0.97-1.18  a small second hop, a smaller landing; home by 1.5 s
const LEAP = { crouch: 120, apex: 460, land: 950, hop2: 1160 };
/** a landing: squashed within ~40 ms of touching down (from 0, no jump), then sprung back at ~4 Hz */
const impactOf = (t: number, at: number, hz = 4, decay = 6) =>
	t < at - 40 ? 0 : t < at ? bump(t, at - 40, at + 40) : Math.exp((-decay * (t - at)) / 1000) * Math.cos((2 * Math.PI * hz * (t - at)) / 1000);
const SPIN = { from: 180, to: 880 };
const lowAct = (s: string): MeshWinSpec =>
	cut(
		s,
		214,
		[{ name: 'letter', pivot: [130, 214], dist: blob([130, 132], 90, 92, 4) }],
		{ letter: { pos: 0, neg: 0 } },
		[],
		(rig, t) => {
			const pose = restPose(rig);
			const up = track(t, [[0, 0], [LEAP.crouch, 0], [LEAP.apex, 1, 'out'], [LEAP.land, 0, 'in']]);
			const hop2 = bump(t, LEAP.land + 20, LEAP.hop2 + 60);
			const air = Math.max(0, Math.min(1, up + 0.22 * hop2));
			const squash = 0.11 * bump(t, 0, LEAP.crouch + 100) + 0.13 * Math.max(0, impactOf(t, LEAP.land)) + 0.05 * Math.max(0, impactOf(t, LEAP.hop2 + 60));
			const stretch = 0.08 * bump(t, LEAP.crouch - 20, LEAP.apex) + 0.03 * bump(t, 700, LEAP.land);
			// the turn: width follows |cos| of the angle (eased in and out) — both
			// faces show the letter the right way round, like a coin with one
			// face on both sides (a true back face printed it mirrored, "01");
			// never exactly zero, so the mesh keeps an area edge-on
			const turn = 2 * Math.PI * track(t, [[0, 0], [SPIN.from, 0], [SPIN.to, 1]]);
			const width = Math.max(0.01, Math.abs(Math.cos(turn)));
			pose.rigid = {
				sx: (1 + squash * 0.8 - stretch * 0.55) * width,
				sy: 1 - squash + stretch,
				rot: 0,
				pop: 1 + 0.1 * up + 0.02 * hop2,
				dx: 0,
				// it sinks into the crouch before it goes
				dy: -20 * air + 3 * bump(t, 0, LEAP.crouch + 80),
			};
			pose.air = air;
			// light, not bleach: a charcoal letter turns grey under a strong flash
			pose.flash = 0.07 * bump(t, 250, 700) + 0.04 * bump(t, 1000, 1300);
			pose.sheen = t > 260 && t < 760 ? (t - 260) / 500 : -1;
			pose.plateHit = 1 - 0.01 * bump(t, LEAP.land, LEAP.land + 120);
			return pose;
		},
	);

// ── panel symbols ──────────────────────────────────────────────────────────────
const panel = (s: string, flashTint: number, parts: PartSpec[], limits: MeshWinSpec['limits'], collapsible: string[], pose: (rig: Rig, t: number) => Pose): MeshWinSpec => ({
	symbol: s,
	key: 'gb' + s,
	sprite: 'gb' + s,
	mode: 'panel',
	feetY: 238,
	durationMs: DONE,
	landMs: 1400,
	hitMs: 410,
	flashTint,
	inked: (p) => p[0] > 24 && p[0] < 232 && p[1] > 20 && p[1] < 236,
	rig: { grid: GRID, soft: 8, parts: [...panelParts(INNER, 28), ...parts] },
	limits: { frame: { pos: 0, neg: 0 }, panel: { pos: 3, neg: 3 }, ...limits },
	collapsible,
	pose,
});
const panelCarry = (rig: Rig, t: number): Pose => {
	const pose = restPose(rig);
	const b = beat3(t);
	const p = pose.bones[1];
	p.dy = -1.5 * Math.max(0, b);
	p.along = 1 + 0.008 * Math.max(0, b);
	pose.flash = 0.14 * bump(t, 300, 640) + 0.1 * bump(t, 1060, 1340);
	pose.sheen = t > 220 && t < 680 ? (t - 220) / 460 : -1;
	return pose;
};

// W: ears (55,30) and (192,32); the open eye (100,92); the laughing mouth
// (130,138); the head round (130,92), chin (135,172)
export const W_ACT = panel(
	'W',
	0xf2e8d0,
	[
		{ ...feature('head', 'panel', [135, 172], blob([130, 90], 92, 74), 0), keep: (p: Point) => ramp(178 - p[1], 0, 30) * ramp(Math.min(p[0], 256 - p[0], p[1]), 14, 64), priority: 10 },
		{ ...feature('ear_l', 'head', [62, 60], polygon([[42, 60], [54, 30], [80, 50]]), 12), keep: (p: Point) => (1 - ramp(polygon([[42, 60], [54, 30], [80, 50]])(p), 0, 12)) * ramp(Math.min(p[0], 256 - p[0], p[1]), 16, 44) },
		{ ...feature('ear_r', 'head', [186, 58], polygon([[172, 50], [196, 28], [212, 60]]), 12), keep: (p: Point) => (1 - ramp(polygon([[172, 50], [196, 28], [212, 60]])(p), 0, 12)) * ramp(Math.min(p[0], 256 - p[0], p[1]), 16, 44) },
		feature('eye', 'head', [100, 92], blob([100, 92], 20, 16), 10),
		feature('jaw', 'head', [130, 124], blob([132, 140], 30, 16), 18),
	],
	{ head: { pos: 4, neg: 4 }, ear_l: { pos: 12, neg: 12 }, ear_r: { pos: 12, neg: 12 }, eye: { pos: 0, neg: 0 }, jaw: { pos: 10, neg: 10 } },
	['eye'],
	(rig, t) => {
		const pose = panelCarry(rig, t);
		bone(rig, pose, 'head').angle = 1.6 * beat3(t, 70) - 1.2 * bump(t, 620, 980);
		bone(rig, pose, 'eye').along = 1 - 0.7 * blink(t, 250);
		// the laugh: the mouth opens wider twice
		const jaw = bone(rig, pose, 'jaw');
		jaw.along = 1 + 0.12 * bump(t, 320, 560) + 0.12 * bump(t, 580, 800) + 0.09 * bump(t, 1080, 1300);
		bone(rig, pose, 'ear_l').angle = -10 * flick(t, 420, 3.2, 6) - 6 * flick(t, 1120, 3.4, 7);
		bone(rig, pose, 'ear_r').angle = 9 * flick(t, 500, 3.2, 6) + 6 * flick(t, 1160, 3.4, 7);
		// Two chuckles with a held smile, rather than a high-frequency mouth wag.
		jaw.dy=track(t,[[0,0],[260,0],[410,.9],[500,.2],[640,.7],[790,0],[1080,0],[1200,.8],[1380,0]]);
		jaw.angle=track(t,[[0,0],[300,0],[430,2.2],[650,-1.4],[860,0],[1190,1.6],[1400,0]]);
		return pose;
	},
);

// Rigid gold: light sweeps over the mask; its metal silhouette stays still.
export const S_ACT=MUMMY_SYMBOLS.S;

export const MUMMY_CUT: Record<string, MeshWinSpec> = {
	H1: H1_ACT,
	H2: H2_ACT,
	H3: H3_ACT,
	H4: H4_ACT,
	W: W_ACT,
	// A metal mask keeps its silhouette: the travelling specular highlight acts.
	S: S_ACT,
	L1: lowAct('L1'),
	L2: lowAct('L2'),
	L3: lowAct('L3'),
	L4: lowAct('L4'),
	L5: lowAct('L5'),
};
