/**
 * S — THE BANANA SCATTER. A bunch hanging from a blue bow on parchment. It
 * swings from the knot like something hung up (a pendulum, decaying), the bow's
 * loops flap after it, and the bananas fan open a touch and close again; a
 * small jolt on the landing.
 *
 * PANEL mode (meshRig.panelParts): the parchment round the bunch absorbs the
 * stretch. The bananas touch each other along their whole length, so they fan
 * as two groups, not four — a fan of four sheared the seams between them.
 */
import {
	landFlick,
	boneOf,
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

const INNER: Rect = [28, 28, 228, 228];
const T = { crouch: 110, rise: 300, land: 1300, done: 1500 };
const KNOT: [number, number] = [166, 72];

// includes the whole bow: the first outline cut the right loop off
const BUNCH = polygon([[44, 122], [118, 50], [208, 52], [206, 92], [204, 206], [118, 206], [44, 168]]);
const UPPER = polygon([[44, 122], [150, 88], [178, 104], [120, 150], [44, 150]]);

export const S: MeshWinSpec = {
	symbol: 'S',
	key: 'gbS',
	sprite: 'gbS',
	mode: 'panel',
	feetY: INNER[3],
	durationMs: T.done,
	landMs: T.land,
	hitMs: 210,
	inked: (p) => BUNCH(p) === 0,
	// gold bananas and the blue bow are strongly coloured; the parchment is
	// not (chroma ~65 against 150+)
	inkColor: (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 100,
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 },
		soft: 4,
		parts: [
			...panelParts(INNER),
			{ name: 'bunch', parent: 'panel', pivot: KNOT, axis: [0, 1], priority: 1, dist: BUNCH },
			{
				name: 'bow_l',
				parent: 'bunch',
				pivot: [158, 70],
				axis: [-1, 0],
				priority: 4,
				dist: polygon([[120, 54], [158, 50], [160, 90], [122, 94]]),
				keep: (p) => smoothstep((158 - p[0]) / 12),
			},
			{
				name: 'bow_r',
				parent: 'bunch',
				pivot: [174, 70],
				axis: [1, 0],
				priority: 4,
				dist: polygon([[174, 50], [206, 58], [202, 92], [174, 88]]),
				keep: (p) => smoothstep((p[0] - 174) / 10),
			},
			{
				// the two long bananas across the top fan away from the others
				name: 'upper',
				parent: 'bunch',
				pivot: [168, 104],
				axis: [-1, 0.4],
				priority: 3,
				dist: UPPER,
				keep: (p) => smoothstep((166 - p[0]) / 30),
			},
		],
	},
	// geometric: panel +60 -21.5, bunch +3.5 -4.5, bow_l +22 -18,
	// bow_r +19.5 -22, upper +5.5 -5
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		bunch: { pos: 3.3, neg: 3.3 },
		bow_l: { pos: 14, neg: 14 },
		bow_r: { pos: 14, neg: 14 },
		upper: { pos: 3, neg: 3 },
	},
	// landing: the bunch swings from the knot and the bow flaps. `k` climbs
	// with each Scatter the spin has shown (ReelSymbol), so the tease builds
	land: (rig, t, k, pose) => {
		boneOf(rig, pose, 'bunch').angle = 2.2 * k * landFlick(t, 30);
		const flap = 8 * k * landFlick(t, 60);
		boneOf(rig, pose, 'bow_l').angle = flap;
		boneOf(rig, pose, 'bow_r').angle = -flap;
	},
	// THE TEASE, while two or more Scatters are down and a reel still turns: the
	// bunch sways from its knot like something hung up in a draught, the bow's
	// loops trailing it — slow (1.4s), because this is waiting, not winning.
	// `k` climbs with the count (Symbol.svelte), and it eases in from the
	// drawing over the first 350ms.
	tease: (rig, t, k) => {
		const pose = restPose(rig);
		const on = ramp(t, 0, 350);
		const w = (2 * Math.PI * t) / 1400;
		boneOf(rig, pose, 'bunch').angle = 1.8 * k * on * Math.sin(w);
		const flap = 5 * k * on * Math.sin(w - 0.9);
		boneOf(rig, pose, 'bow_l').angle = flap;
		boneOf(rig, pose, 'bow_r').angle = -flap * 0.85;
		boneOf(rig, pose, 'upper').angle = 1.1 * k * on * Math.sin(w - 0.5);
		return pose;
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		const air = track(t, [[0, 0], [T.crouch, 0], [T.rise, 1, 'back'], [1100, 1], [T.land, 0, 'in']]);

		const panel = b('panel');
		// floats while it hangs: the review found it standing dead still for 470ms
		const hover = ramp(t, 260, 400) * (1 - ramp(t, 1050, 1200));
		panel.dy = -5 * air - 1.3 * hover * Math.sin((2 * Math.PI * (t - T.rise)) / 560);
		panel.along = track(t, [[0, 1], [T.crouch, 0.95, 'out'], [210, 1.04, 'out'], [T.rise, 1], [T.land - 20, 1], [T.land + 40, 0.96, 'out'], [T.done, 1, 'out']]);

		// hung from the knot: kicked by the hit, swings and dies away
		// decays slowly enough to still be swinging through the hold
		b('bunch').angle = 3.2 * flick(t, 260, 1.4, 1.1) - 2 * flick(t, T.land, 2.2, 4);
		// the bow flaps after the swing, its loops in opposite senses
		const flap = 11 * flick(t, 320, 2.6, 3.2) + 4 * flick(t, T.land + 30, 3, 5) + 2.5 * hover * Math.sin((2 * Math.PI * t) / 330);
		b('bow_l').angle = flap;
		b('bow_r').angle = -flap;
		// the top pair fans open a touch and closes
		b('upper').angle = 2.5 * Math.max(0, flick(t, 380, 1.6, 2.6));

		pose.air = Math.max(0, Math.min(1, air));
		pose.flash = 0.35 * track(t, [[T.crouch, 0], [220, 1, 'out'], [650, 0, 'in']]);
		pose.sheen = t >= 380 && t <= 1000 ? (t - 380) / 620 : -1;
		pose.plateHit = 1 + 0.035 * bump(t, T.crouch, 400) + 0.025 * bump(t, T.land, T.land + 140);
		return pose;
	},
};
