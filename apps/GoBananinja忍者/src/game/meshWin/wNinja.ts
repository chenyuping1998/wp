/**
 * W — THE NINJA. The monkey's portrait fills his tile: head and red headband,
 * the band's two long tails streaming off to the left, a navy scarf wrapped
 * round his shoulders with a torn edge.
 *
 * PANEL mode (meshRig.panelParts): he is painted edge to edge on the slate and
 * cannot be cut out, so the inside of the tile is the mesh and the riveted
 * edge is the frame that never moves.
 *
 * He is the character, so the act is his: a sharp nod and a turn of the head
 * toward the player — and the HEADBAND TAILS do what makes it read as a
 * ninja: they are whipped by the move and stream out, each tail in two links
 * so the free end lags the knot and travels twice as far (mesh-cast-rig §3:
 * the body barely moves, the amplitude goes to what hangs off it). The torn
 * edge of the scarf ripples after him.
 *
 * The tails reach to within a few px of the frame on the left, so they swing
 * UP and DOWN (across the frame, never into it) and never lengthen.
 */
import {
	bump,
	flick,
	panelParts,
	polygon,
	restPose,
	smoothstep,
	type MeshWinSpec,
	type Point,
	type Rig,
} from './meshRig';

const T = { crouch: 120, nod: 300, turn: 560, land: 1150, done: 1500 };
const INNER: [number, number, number, number] = [8, 8, 248, 248];
const KNOT: Point = [80, 64];
const HEAD = polygon([[86, 36], [112, 10], [170, 8], [212, 40], [216, 92], [208, 140], [188, 176], [156, 194], [116, 186], [92, 160], [74, 118], [76, 82]]);
const TAIL_UP = polygon([[12, 48], [44, 46], [70, 50], [86, 58], [84, 72], [56, 76], [30, 76], [14, 70]]);
const TAIL_LO = polygon([[84, 72], [72, 90], [56, 108], [40, 130], [22, 138], [6, 118], [6, 98], [28, 84], [56, 76]]);
const fromKnot = (p: Point) => Math.hypot(p[0] - KNOT[0], p[1] - KNOT[1]);

export const W: MeshWinSpec = {
	symbol: 'W',
	key: 'gbW',
	sprite: 'gbW',
	mode: 'panel',
	noDust: true,
	feetY: 248,
	durationMs: T.done,
	landMs: T.land,
	hitMs: T.nod,
	flashTint: 0xff5a4a,
	// the portrait: everything inside the frame that is not bare slate (the
	// top-right corner and the left above and below the tails)
	inked: (p) => p[0] > 10 && p[0] < 246 && p[1] > 10 && p[1] < 246 && (HEAD(p) === 0 || TAIL_UP(p) === 0 || TAIL_LO(p) === 0 || p[1] > 130),
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 52, rows: 52 },
		soft: 4,
		parts: [
			...panelParts(INNER, 8),
			{
				name: 'head',
				parent: 'panel',
				pivot: [146, 196],
				axis: [0, -1],
				priority: 2,
				dist: HEAD,
				keep: (p) => smoothstep((196 - p[1]) / 22),
			},
			{
				name: 'tail_up',
				parent: 'head',
				pivot: KNOT,
				axis: [-1, -0.1],
				priority: 3,
				dist: TAIL_UP,
				keep: (p) => smoothstep((fromKnot(p) - 6) / 16),
			},
			{
				name: 'tail_up_tip',
				parent: 'tail_up',
				pivot: [46, 60],
				axis: [-1, 0],
				priority: 4,
				dist: (p) => (p[0] < 50 ? TAIL_UP(p) : 30),
				keep: (p) => smoothstep((50 - p[0]) / 16),
			},
			{
				name: 'tail_lo',
				parent: 'head',
				pivot: KNOT,
				axis: [-0.6, 1],
				priority: 3,
				dist: TAIL_LO,
				keep: (p) => smoothstep((fromKnot(p) - 6) / 16),
			},
			{
				name: 'tail_lo_tip',
				parent: 'tail_lo',
				pivot: [48, 104],
				axis: [-0.6, 1],
				priority: 4,
				dist: (p) => (p[1] > 100 ? TAIL_LO(p) : 30),
				keep: (p) => smoothstep((p[1] - 100) / 14),
			},
			{
				name: 'scarf',
				parent: 'panel',
				pivot: [60, 160],
				axis: [-1, 0.8],
				priority: 1,
				dist: polygon([[10, 156], [56, 150], [70, 200], [60, 246], [10, 246]]),
				keep: (p) => smoothstep((70 - p[0]) / 26),
			},
		],
	},
	// Geometric (--limits, 2026-10-04): head +2.5 -2 (the tails ride it and
	// their tips sit a few px off the frame), tail_up +8 -7, tail_up_tip
	// +38 -41, tail_lo +6.5 -5.5, tail_lo_tip +17.5 -22.5, scarf +13.5 -11.
	// So the head is held small and the size goes into the tails.
	limits: {
		panel: { pos: 0.5, neg: 0.5 },
		head: { pos: 1.8, neg: 1.6 },
		tail_up: { pos: 6, neg: 6 },
		tail_up_tip: { pos: 16, neg: 16 },
		tail_lo: { pos: 4.5, neg: 4.5 },
		tail_lo_tip: { pos: 13, neg: 13 },
		scarf: { pos: 7, neg: 7 },
	},
	pose: (rig: Rig, t: number) => {
		const pose = restPose(rig);
		const b = (name: string) => pose.bones[rig.bones.findIndex((x) => x.name === name)];
		// the nod: a duck, a sharp dip of the chin, back up and a turn toward us
		const panel = b('panel');
		// his hair touches the top of the tile and his scarf the bottom: the panel
		// has ~8px of plain fade either way, so it only bobs
		panel.dy = 1.4 * bump(t, 0, T.crouch * 2) - 1.2 * bump(t, T.crouch, T.turn) + 0.8 * bump(t, T.land, T.land + 200);
		const head = b('head');
		head.angle = 1.5 * bump(t, T.crouch, T.nod + 120) - 1.4 * bump(t, T.turn - 80, T.land) + 0.7 * flick(t, T.land, 2.6, 5);
		head.along = 1;
		// the grin: the face widens a touch (never taller: the hair is at the frame)
		head.across = 1 + 0.035 * bump(t, T.nod, T.turn + 200);
		// the tails: whipped by the nod, streaming, the tips a beat behind and wider
		const stream = (t0: number, hz: number) => Math.sin((2 * Math.PI * hz * (t - t0)) / 1000) * smoothstep((t - t0) / 160) * (1 - smoothstep((t - 1150) / 260));
		b('tail_up').angle = 3.5 * flick(t, T.nod, 2.2, 2.4) + 1.6 * stream(T.nod, 3.1);
		b('tail_up_tip').angle = 11 * flick(t, T.nod + 70, 2.2, 2.2) + 5.5 * stream(T.nod + 90, 3.1);
		b('tail_lo').angle = -2.6 * flick(t, T.nod + 40, 2, 2.4) - 1.4 * stream(T.nod + 40, 2.7);
		b('tail_lo_tip').angle = -8.5 * flick(t, T.nod + 120, 2, 2.2) - 4.5 * stream(T.nod + 140, 2.7);
		// the torn scarf edge ripples after him
		b('scarf').angle = -4.5 * flick(t, T.nod + 120, 2.6, 3) + 1.6 * stream(T.nod + 200, 3.5);
		pose.air = 0;
		pose.flash = 0.42 * bump(t, T.crouch, 560) + 0.2 * bump(t, T.land, T.land + 200);
		pose.sheen = t >= 420 && t <= 1040 ? (t - 420) / 620 : -1;
		pose.plateHit = 1 + 0.1 * bump(t, T.crouch, 440) + 0.04 * bump(t, T.land, T.land + 160);
		return pose;
	},
};
