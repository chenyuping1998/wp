/**
 * THE EFFECTS LAYER OF A WIN — what a sprite artist draws round the acting.
 *
 * The mesh does the acting (the helmet flips, the mine boings, the flags snap);
 * this is the layer a hand-animated win has on top of that and a mesh alone
 * does not: each symbol's MATERIAL answering the move. A diving helmet trails
 * air bubbles as it flips and splashes down; a sea mine glows danger-red at
 * every bounce and throws sparks off its horns; the lantern lights the cells
 * round it green and sheds embers; the flags whip the air into streaks; the
 * rivets round the captain's porthole light up in a chase; the banana net
 * sheds gold; a stencilled letter puffs paint.
 *
 * Asked for 2026-09-27: "make the symbol wins look like a professional sprite
 * artist made them".
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

export type FxTex = 'glow' | 'star' | 'streak' | 'scrap' | 'bubble' | 'puff' | 'drop';
export const FX_TEXTURES: Record<FxTex, string> = {
	glow: 'fxGlow',
	star: 'fxStar',
	streak: 'fxStreak',
	scrap: 'fxScrap',
	bubble: 'fxBubble',
	puff: 'fxPuff',
	drop: 'fxDrop',
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
// the effects, per symbol (canvas px; timings on the leap in leaps.ts where
// the symbol leaps: launch 230, top 480, land 900 — the mine's boing peaks
// at 360, 780, 1060)

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

const H1: FxItem[] = [
	// air escaping as it flips: from the hose and the dome's top valve
	...([
		[44, 190],
		[124, 40],
	] as Point[]).map(
		(at): Emit => ({
			kind: 'emit',
			tex: 'bubble',
			at,
			from: 220,
			to: 880,
			count: 8,
			life: [450, 650],
			speed: [30, 60],
			dir: -90,
			spread: 50,
			gravity: -70,
			size: [8, 14],
			alpha: 0.95,
			wobble: [4, 3],
			tint: 0xd8f6ff,
			blend: 'normal',
		}),
	),
	// the splash on landing
	{
		kind: 'emit',
		tex: 'drop',
		at: [128, 224],
		from: 900,
		to: 925,
		count: 12,
		life: [320, 480],
		speed: [110, 190],
		dir: -90,
		spread: 150,
		gravity: 520,
		scatter: [40, 4],
		size: [9, 5],
		alpha: 0.95,
		stretch: 1.6,
		tint: [0xe6f7ff, 0xb9e6ff],
	},
	// the brass catches the light at the top of the leap
	glint([150, 104], 470, 48),
];

const HORNS: [Point, number][] = [
	[[40, 88], -150],
	[[102, 64], -110],
	[[170, 66], -70],
	[[222, 92], -30],
];
const H2: FxItem[] = [
	// danger: the mine glows red on the knock and at every bounce
	{
		kind: 'light',
		tex: 'glow',
		at: [128, 132],
		tint: 0xff3a1c,
		layer: 'under',
		size: (t) => 210 + 40 * pulse(t, 120, 520),
		alpha: (t) => 0.7 * pulse(t, 110, 520) + 0.45 * pulse(t, 540, 820) + 0.3 * pulse(t, 880, 1120),
	},
	// sparks off the horns on the knock
	...HORNS.map(
		([at, dir]): Emit => ({
			kind: 'emit',
			tex: 'star',
			at,
			from: 130,
			to: 150,
			count: 3,
			life: [260, 420],
			speed: [110, 190],
			dir,
			spread: 40,
			gravity: 380,
			size: [18, 4],
			alpha: 1,
			spin: 360,
			tint: [0xffc15a, 0xff8a3a, 0xffffff],
		}),
	),
	// grit off the bottom horns on the first hard bounce
	{
		kind: 'emit',
		tex: 'puff',
		at: [128, 214],
		from: 590,
		to: 620,
		count: 4,
		life: [520, 760],
		speed: [18, 40],
		dir: 90,
		spread: 200,
		gravity: -40,
		scatter: [30, 4],
		size: [22, 46],
		alpha: 0.35,
		spin: 40,
		tint: 0xa9b3ba,
		blend: 'normal',
		layer: 'under',
	},
];

const H3: FxItem[] = [
	// the lantern lights the cells round it
	{
		kind: 'light',
		tex: 'glow',
		at: [128, 126],
		tint: 0x4dffa0,
		layer: 'under',
		size: (t) => 200 + 36 * pulse(t, 160, 620),
		alpha: (t) =>
			Math.min(1, pulse(t, 120, 520) * 1.4 + 0.45 * (t > 300 && t < 1250 ? pulse(t, 300, 1250) : 0)) *
			(0.85 + 0.15 * Math.sin(t / 37)),
	},
	// embers out of the top vent, drifting up
	{
		kind: 'emit',
		tex: 'glow',
		at: [128, 44],
		from: 200,
		to: 820,
		count: 10,
		life: [500, 700],
		speed: [22, 48],
		dir: -90,
		spread: 50,
		gravity: -30,
		scatter: [10, 2],
		size: [9, 3],
		alpha: 1,
		wobble: [7, 1.6],
		tint: [0xffd36a, 0xffe9a8, 0xa8ffcf],
	},
	glint([112, 104], 480, 40, 0xe9fff2),
];

const H4: FxItem[] = [
	// the gust: streaks of wind through the cell as the cloth snaps
	{
		kind: 'emit',
		tex: 'streak',
		at: [-10, 118],
		from: 190,
		to: 720,
		count: 7,
		life: [260, 360],
		speed: [480, 600],
		dir: -4,
		spread: 8,
		scatter: [10, 56],
		size: [36, 44],
		alpha: 0.45,
		stretch: 2.4,
		tint: 0xffffff,
	},
	// the snap: a glint on each free corner
	glint([56, 138], 300, 40),
	glint([234, 122], 360, 40),
];

// the rivets round the porthole light up in a chase, all the way round
const RIVETS = 14;
const W: FxItem[] = [
	...Array.from({ length: RIVETS }, (_, i): Light => {
		const a = -Math.PI / 2 + (i / RIVETS) * Math.PI * 2;
		const t0 = 240 + i * 55;
		return { ...glint([124 + Math.cos(a) * 84, 120 + Math.sin(a) * 84], t0, 30, 0xffe7a0, 300), follow: false };
	}),
	// and the ring flares as the chase closes
	{
		kind: 'light',
		tex: 'glow',
		at: [124, 120],
		follow: false,
		tint: 0xffd36a,
		size: () => 250,
		alpha: (t) => 0.35 * pulse(t, 980, 1360),
	},
];

const S: FxItem[] = [
	// gold shaken out of the net as it swings
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
		scatter: [46, 26],
		size: [14, 4],
		alpha: 1,
		spin: 200,
		tint: [0xfff09a, 0xffd34a, 0xffffff],
	},
	glint([102, 128], 260, 40, 0xfff6c8),
	glint([160, 158], 520, 36, 0xfff6c8),
	glint([128, 104], 800, 34, 0xfff6c8),
];

/** stencil paint: a puff of mist and flecks off the letter on the hit */
const paint: FxItem[] = [
	{
		kind: 'emit',
		tex: 'puff',
		at: [128, 136],
		from: 180,
		to: 200,
		count: 3,
		life: [420, 560],
		speed: [10, 26],
		dir: -90,
		spread: 180,
		scatter: [40, 30],
		size: [34, 64],
		alpha: 0.28,
		spin: 30,
		tint: 0xe8e2cc,
		blend: 'normal',
		layer: 'under',
	},
	{
		kind: 'emit',
		tex: 'glow',
		at: [128, 136],
		from: 185,
		to: 200,
		count: 7,
		life: [300, 420],
		speed: [90, 150],
		dir: -90,
		spread: 170,
		gravity: 420,
		scatter: [36, 30],
		size: [8, 4],
		alpha: 0.95,
		tint: 0xefe9d4,
		blend: 'normal',
	},
];

export const MESH_FX: Record<string, FxItem[]> = { H1, H2, H3, H4, W, S, L1: paint, L2: paint, L3: paint, L4: paint, L5: paint };

/**
 * THE IMPACT FRAME, per symbol: how white the subject goes on the frames of
 * its hit (an animator's "hit flash" — two or three frames of pure silhouette
 * before the colour comes back, which is what makes a hit land). Lighter on the
 * letters, which win on most spins.
 */
export const IMPACT_MS = 45;
export const IMPACT: Record<string, number> = { H1: 0.85, H2: 0.9, H3: 0.75, H4: 0.8, W: 0.6, S: 0.7, L1: 0.45, L2: 0.45, L3: 0.45, L4: 0.45, L5: 0.45 };
