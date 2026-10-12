/**
 * THE EFFECTS LAYER OF A WIN — what a sprite artist draws round the acting.
 *
 * GoBananasBoat's runner, unchanged; the effects at the bottom are this
 * game's. The mesh does the acting (the kabuto flips, the shuriken spins, the
 * bomb counts down, the fan snaps open); this is the layer a hand-animated win
 * has on top: each symbol's MATERIAL answering the move — a red war aura and
 * glinting horns, air cut into streaks and sparks where the star bites the
 * slate, a spitting fuse and rolling violet smoke, spray off painted waves,
 * cherry petals off the ninja's headband, gold off the bananas, grit knocked
 * out of a letter's slot.
 *
 * Everything here is a function of the act's own clock (t, ms, already scaled
 * by the play speed), and randomness is seeded per particle, so turbo, a
 * dropped frame and the offline render (design/render_mesh_wins.py, through
 * check_mesh_wins.mjs --dump) all see the same particles. Positions are in the
 * rig's 256 canvas. An emitter's `at` is a point on the DRAWING: particles are
 * born where that point is at their birth time — on a leaping helmet the
 * bubbles leave a trail along its arc — and then fly free.
 *
 * Textures are the white fx sprites (design/generate_fx_textures.mjs), 128px,
 * tinted here.
 */
import { bump, type Point, type Rig } from './meshRig';

export type FxTex = 'glow' | 'star' | 'streak' | 'scrap' | 'bubble' | 'puff' | 'drop' | 'leaf';
export const FX_TEXTURES: Record<FxTex, string> = {
	glow: 'fxGlow',
	star: 'fxStar',
	streak: 'fxStreak',
	scrap: 'fxScrap',
	bubble: 'fxBubble',
	puff: 'fxPuff',
	drop: 'fxDrop',
	leaf: 'fxLeaf',
};
/** every fx texture is drawn at this size */
const TEX = 128;

type Look = {
	tex: FxTex;
	tint: number | number[];
	/** 'add' for light, 'normal' for matter (bubbles, smoke, paint) */
	blend?: 'add' | 'normal';
	/** under the subject (a light it casts) or over it (what it throws) */
	layer?: 'under' | 'over';
};

/** a burst or a stream of particles */
export type Emit = Look & {
	kind: 'emit';
	at: Point;
	/** born evenly (jittered) between these, ms; from === to is one burst */
	from: number;
	to: number;
	count: number;
	life: [number, number];
	/** px/s, and the direction in degrees (0 right, -90 up) with its spread */
	speed: [number, number];
	dir: number;
	spread: number;
	/** px/s², + down; negative for what rises (bubbles, embers, smoke) */
	gravity?: number;
	/** random offset at birth, px, on each axis */
	scatter?: [number, number];
	/** diameter in px, at birth and at death */
	size: [number, number];
	alpha: number;
	/** degrees per second, random sign */
	spin?: number;
	/** a sideways sway, px and Hz — a bubble's wobble, an ember's drift */
	wobble?: [number, number];
	/** drawn long along its velocity (streaks, droplets): length / width */
	stretch?: number;
};

/** a single sprite with its own curves — a halo, a glint */
export type Light = Look & {
	kind: 'light';
	at: Point;
	/** false: a fixed point on the canvas rather than one on the drawing */
	follow?: boolean;
	size: (t: number) => number;
	alpha: (t: number) => number;
	rot?: (t: number) => number;
};

export type FxItem = Emit | Light;

/** when the last particle of a list is gone, ms (lights end with the act) */
export const fxEndMs = (items: FxItem[]) =>
	Math.max(0, ...items.map((it) => (it.kind === 'emit' ? it.to + it.life[1] : 0)));

export type FxSprite = {
	tex: FxTex;
	x: number;
	y: number;
	/** scale on each axis, from the 128px texture */
	sx: number;
	sy: number;
	rot: number;
	alpha: number;
	tint: number;
	blend: 'add' | 'normal';
	layer: 'under' | 'over';
};

// ---------------------------------------------------------------------------
// the runner

const hash = (a: number, b: number, c: number) => {
	let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** the rig vertex nearest a point on the drawing: particles ride it */
const nearest = (rig: Rig, p: Point) => {
	let best = 0, bd = Infinity;
	for (let v = 0; v < rig.rest.length; v += 2) {
		const d = (rig.rest[v] - p[0]) ** 2 + (rig.rest[v + 1] - p[1]) ** 2;
		if (d < bd) (bd = d), (best = v);
	}
	// further than this from any vertex: the point is off the mesh (the Wild's
	// ring is frame, not mesh) and stays where it is drawn
	return bd > 14 * 14 ? -1 : best;
};

/**
 * Keeps what the particles need between frames: which vertex each emitter
 * rides and where each particle was born. One per playing copy.
 */
export class FxRunner {
	private verts: number[];
	private born = new Map<number, Point>();
	private items: FxItem[];
	private positionsAt: (ms: number) => Float32Array;
	/** positionsAt: the skinned positions of the act at a time — for a
	 *  particle's birth. (Plain fields, not parameter properties: the gate
	 *  loads this file through node's type stripping, which refuses those.) */
	constructor(rig: Rig, items: FxItem[], positionsAt: (ms: number) => Float32Array) {
		this.items = items;
		this.positionsAt = positionsAt;
		this.verts = items.map((it) => nearest(rig, it.at));
	}

	private point(i: number, positions: Float32Array): Point {
		const v = this.verts[i];
		const it = this.items[i];
		if (v < 0 || (it.kind === 'light' && it.follow === false)) return it.at;
		return [positions[v], positions[v + 1]];
	}

	/** the sprites to draw at t, given the positions at t */
	frame(t: number, positions: Float32Array): FxSprite[] {
		const out: FxSprite[] = [];
		this.items.forEach((it, i) => {
			const look = {
				tex: it.tex,
				blend: it.blend ?? 'add',
				layer: it.layer ?? 'over',
			};
			if (it.kind === 'light') {
				const a = it.alpha(t);
				const s = it.size(t);
				if (a <= 0.01 || s <= 0.5) return;
				const [x, y] = this.point(i, positions);
				const tint = Array.isArray(it.tint) ? it.tint[0] : it.tint;
				out.push({ ...look, x, y, sx: s / TEX, sy: s / TEX, rot: it.rot?.(t) ?? 0, alpha: Math.min(1, a), tint });
				return;
			}
			for (let k = 0; k < it.count; k++) {
				const r = (n: number) => hash(i + 1, k + 1, n);
				const slot = it.count > 1 ? k / (it.count - 1) : 0;
				const birth = it.from + (it.to - it.from) * Math.min(1, Math.max(0, slot + (r(1) - 0.5) / it.count));
				const life = it.life[0] + (it.life[1] - it.life[0]) * r(2);
				const age = t - birth;
				if (age < 0 || age > life) continue;
				const key = i * 1000 + k;
				let o = this.born.get(key);
				if (!o) {
					o = this.point(i, t - birth < 20 ? positions : this.positionsAt(birth));
					const [sx, sy] = it.scatter ?? [0, 0];
					o = [o[0] + (r(3) * 2 - 1) * sx, o[1] + (r(4) * 2 - 1) * sy];
					this.born.set(key, o);
				}
				const u = age / life;
				const s = age / 1000;
				const ang = ((it.dir + (r(5) - 0.5) * it.spread) * Math.PI) / 180;
				const v = it.speed[0] + (it.speed[1] - it.speed[0]) * r(6);
				const vx = Math.cos(ang) * v, vy = Math.sin(ang) * v;
				const g = it.gravity ?? 0;
				let x = o[0] + vx * s;
				const y = o[1] + vy * s + 0.5 * g * s * s;
				if (it.wobble) x += it.wobble[0] * Math.sin(2 * Math.PI * it.wobble[1] * s + r(7) * 6.28);
				const size = (it.size[0] + (it.size[1] - it.size[0]) * u) * (0.8 + 0.4 * r(8));
				// in fast, out slow: a pop of life, then the long fade
				const alpha = it.alpha * Math.min(1, u / 0.12) * (1 - u * u);
				const tints = Array.isArray(it.tint) ? it.tint : [it.tint];
				const tint = tints[Math.floor(r(9) * tints.length) % tints.length];
				let rot = it.spin ? ((r(10) < 0.5 ? -1 : 1) * it.spin * s * Math.PI) / 180 + r(11) * 6.28 : 0;
				let sx = size / TEX, sy = size / TEX;
				if (it.stretch) {
					// long along where it is going now
					rot = Math.atan2(vy + g * s, vx);
					sx *= it.stretch;
				}
				out.push({ ...look, x, y, sx, sy, rot, alpha, tint });
			}
		});
		return out;
	}
}

// ---------------------------------------------------------------------------
// the effects, per symbol (canvas px; on the leap's clock, leaps.ts: launch
// 230, top 480, land 900 — the bomb's leap runs 330 late: launch 560, land 1230)

const pulse = (t: number, a: number, b: number) => (t < a || t > b ? 0 : bump(t, a, b));

/** a glint that pops on a point of the drawing: grows, turns, gone */
const glint = (at: Point, t0: number, size = 44, tint = 0xffffff, ms = 260): Light => ({
	kind: 'light',
	tex: 'star',
	at,
	tint,
	size: (t) => size * pulse(t, t0, t0 + ms),
	alpha: (t) => pulse(t, t0, t0 + ms) * 1.4,
	rot: (t) => (t - t0) / 400,
});

/** the dust a heavy thing raises where it lands on the slate */
const landingGrit = (at: Point, t0: number, count = 4): Emit => ({
	kind: 'emit',
	tex: 'puff',
	at,
	from: t0,
	to: t0 + 25,
	count,
	life: [420, 640],
	speed: [24, 52],
	dir: 0,
	spread: 360,
	gravity: -30,
	scatter: [44, 4],
	size: [24, 50],
	alpha: 0.32,
	spin: 40,
	tint: 0x9aa6b0,
	blend: 'normal',
	layer: 'under',
});

// NO COLOURED GLOW UNDER A SUBJECT (2026-10-04, asked for): a light pooled on
// the slate under the symbol read as a yellow (red, green, violet) backing
// and took the eye off the jump. The effects are matter and glints only.

const H1: FxItem[] = [
	// both horn tips catch the light at the top of the flip
	glint([18, 28], 440, 46, 0xfff0d0),
	glint([238, 28], 500, 46, 0xfff0d0),
	// embers shaken off the lacquer as it turns
	{
		kind: 'emit',
		tex: 'glow',
		at: [128, 120],
		from: 260,
		to: 820,
		count: 10,
		life: [380, 560],
		speed: [40, 90],
		dir: -90,
		spread: 220,
		gravity: -40,
		scatter: [60, 50],
		size: [9, 3],
		alpha: 1,
		wobble: [5, 2],
		tint: [0xffb15a, 0xff6a3a, 0xffe2a0],
	},
	landingGrit([128, 214], 900),
];

const H2: FxItem[] = [
	// the spin cuts the air: streaks whipping round it while it flies
	{
		kind: 'emit',
		tex: 'streak',
		at: [128, 129],
		from: 260,
		to: 820,
		count: 9,
		life: [160, 240],
		speed: [260, 380],
		dir: 0,
		spread: 360,
		scatter: [34, 34],
		size: [30, 40],
		alpha: 0.5,
		stretch: 2.6,
		tint: [0xffffff, 0xc8ffd0],
	},
	// the bite: sparks off the blades where it hits the slate
	...([[20, 230], [236, 230], [128, 236]] as Point[]).map(
		(at, i): Emit => ({
			kind: 'emit',
			tex: 'star',
			at,
			from: 900 + i * 12,
			to: 915 + i * 12,
			count: 4,
			life: [240, 380],
			speed: [120, 210],
			dir: -90,
			spread: 120,
			gravity: 520,
			size: [16, 4],
			alpha: 1,
			spin: 360,
			tint: [0xffffff, 0xd8ffe0, 0xffe28a],
		}),
	),
	glint([128, 129], 470, 56, 0xe8ffe8),
];

const H3: FxItem[] = [
	// the fuse spits sparks through the countdown
	{
		kind: 'emit',
		tex: 'star',
		at: [210, 46],
		from: 60,
		to: 1150,
		count: 22,
		life: [200, 340],
		speed: [70, 150],
		dir: -60,
		spread: 110,
		gravity: 420,
		size: [12, 3],
		alpha: 1,
		spin: 420,
		tint: [0xffd36a, 0xffffff, 0xff8a3a],
	},
	// violet smoke rolls off on every beat of the countdown, and on the landing
	...[120, 330, 500, 1230].map(
		(t0, i): Emit => ({
			kind: 'emit',
			tex: 'puff',
			at: [128, 128],
			from: t0,
			to: t0 + 40,
			count: i === 3 ? 6 : 3,
			life: [600, 900],
			speed: [26, 60],
			dir: -90,
			spread: 300,
			gravity: -36,
			scatter: [70, 60],
			size: [40, 90],
			alpha: 0.4,
			spin: 50,
			tint: [0xa24dff, 0x7a2fd0, 0xd09cff],
			blend: 'normal',
			layer: i === 3 ? 'under' : 'over',
		}),
	),
];

const H4: FxItem[] = [
	// spray off the painted waves as the fan snaps open
	{
		kind: 'emit',
		tex: 'drop',
		at: [128, 50],
		from: 200,
		to: 300,
		count: 14,
		life: [380, 560],
		speed: [110, 200],
		dir: -90,
		spread: 160,
		gravity: 520,
		scatter: [90, 20],
		size: [9, 5],
		alpha: 0.95,
		stretch: 1.6,
		tint: [0xe6f7ff, 0x9fe0ff, 0x5fc8ff],
	},
	// the gust it throws
	{
		kind: 'emit',
		tex: 'streak',
		at: [-10, 100],
		from: 250,
		to: 700,
		count: 6,
		life: [260, 340],
		speed: [480, 600],
		dir: -4,
		spread: 10,
		scatter: [10, 60],
		size: [34, 42],
		alpha: 0.4,
		stretch: 2.4,
		tint: 0xe8f8ff,
	},
	glint([20, 112], 420, 40, 0xe0f6ff),
	glint([240, 140], 520, 40, 0xe0f6ff),
	landingGrit([128, 236], 900, 3),
];

const W: FxItem[] = [
	// cherry petals blown off his tails, drifting left and down
	{
		kind: 'emit',
		tex: 'leaf',
		at: [40, 90],
		from: 300,
		to: 1100,
		count: 9,
		life: [700, 1000],
		speed: [40, 80],
		dir: 160,
		spread: 50,
		gravity: 40,
		scatter: [30, 30],
		size: [16, 12],
		alpha: 1,
		spin: 240,
		wobble: [6, 1.4],
		tint: [0xffb7d0, 0xff8fb8, 0xffd6e4],
		blend: 'normal',
	},
	// a glint in his eye as he turns to us
	glint([140, 108], 620, 40, 0xfff2d8),
	// the rivets in the four corners flash in turn
	...([[10, 10], [246, 10], [246, 246], [10, 246]] as Point[]).map((at, i): Light => ({ ...glint(at, 300 + i * 110, 34, 0xffe7a0, 300), follow: false })),
];

const S: FxItem[] = [
	// gold shaken out of the bunch as it hops
	{
		kind: 'emit',
		tex: 'star',
		at: [128, 150],
		from: 140,
		to: 820,
		count: 14,
		life: [500, 700],
		speed: [10, 40],
		dir: 90,
		spread: 120,
		gravity: 70,
		scatter: [70, 50],
		size: [14, 4],
		alpha: 1,
		spin: 200,
		tint: [0xfff09a, 0xffd34a, 0xffffff],
	},
	glint([60, 120], 300, 40, 0xfff6c8),
	glint([200, 120], 520, 36, 0xfff6c8),
	glint([150, 190], 760, 34, 0xfff6c8),
];

/** a steel letter knocks grit out of its slot on the hit */
const grit: FxItem[] = [
	{
		kind: 'emit',
		tex: 'puff',
		at: [128, 130],
		from: 180,
		to: 200,
		count: 3,
		life: [420, 560],
		speed: [10, 26],
		dir: -90,
		spread: 180,
		scatter: [40, 30],
		size: [34, 64],
		alpha: 0.24,
		spin: 30,
		tint: 0xb8c2c8,
		blend: 'normal',
		layer: 'under',
	},
	{
		kind: 'emit',
		tex: 'scrap',
		at: [128, 130],
		from: 185,
		to: 200,
		count: 6,
		life: [320, 440],
		speed: [90, 150],
		dir: -90,
		spread: 170,
		gravity: 460,
		scatter: [40, 34],
		size: [9, 5],
		alpha: 0.95,
		spin: 400,
		tint: [0x9aa4ac, 0xc8d0d6, 0x6c767e],
		blend: 'normal',
	},
];

export const MESH_FX: Record<string, FxItem[]> = { H1, H2, H3, H4, W, S, L1: grit, L2: grit, L3: grit, L4: grit, L5: grit };

/**
 * THE IMPACT FRAME, per symbol: how white the subject goes on the frames of
 * its hit. Lighter on the letters, which win on most spins.
 */
export const IMPACT_MS = 45;
export const IMPACT: Record<string, number> = { H1: 0.85, H2: 0.9, H3: 0.75, H4: 0.8, W: 0.6, S: 0.7, L1: 0.45, L2: 0.45, L3: 0.45, L4: 0.45, L5: 0.45 };

/**
 * THE IDLE ACTS' EFFECTS (idles.ts): small and all NORMAL blend — the idle
 * plays on the board itself, under its mask, where additive light draws nothing.
 */
export const MESH_IDLE_FX: Record<string, FxItem[]> = {
	H3: [
		{
			kind: 'emit',
			tex: 'star',
			at: [210, 46],
			from: 100,
			to: 800,
			count: 6,
			life: [200, 320],
			speed: [60, 120],
			dir: -60,
			spread: 100,
			gravity: 400,
			size: [10, 3],
			alpha: 1,
			spin: 300,
			tint: [0xffd36a, 0xffffff],
			blend: 'normal',
		},
	],
	H2: [{ ...glint([128, 129], 380, 34, 0xe8ffe8), blend: 'normal' }],
	S: [{ ...glint([60, 120], 420, 30, 0xfff6c8), blend: 'normal' }],
	W: [
		{
			kind: 'emit',
			tex: 'leaf',
			at: [30, 90],
			from: 200,
			to: 700,
			count: 2,
			life: [700, 900],
			speed: [30, 60],
			dir: 160,
			spread: 40,
			gravity: 30,
			size: [14, 10],
			alpha: 1,
			spin: 200,
			wobble: [5, 1.4],
			tint: [0xffb7d0, 0xff8fb8],
			blend: 'normal',
		},
	],
};
