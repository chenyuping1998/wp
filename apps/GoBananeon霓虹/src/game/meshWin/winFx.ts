/**
 * EACH SYMBOL'S OWN PARTICLES, over its mesh win — neon edition.
 *
 * Every symbol gets a signature that says what it IS:
 *
 *   H1 boombox   sound-wave streaks shot out of both speakers on every beat,
 *                pink and cyan motes floating up like the music
 *   H2 helmet    speed lines rushing past, glints running along the visor
 *   H3 can       the lime mist puffing out of the nozzle, drips off the splat
 *   H4 sneaker   cyan sparks skidding off the sole on each landing
 *   W  gorilla   the shutter shades blaze, stars off the horns on the beat,
 *                club light motes rising
 *   S  bananas   gold dust drifting up, the cyan circuit traces sparking
 *   L1..L5       a burst of neon sparks in the tube's own colour
 *
 * Pure data and a DETERMINISTIC evaluator (seeded per cell), so a particle's
 * state is a function of time alone: SymbolMeshWin.svelte draws it, and the
 * same code can be rendered offline. Imports nothing but meshRig's types.
 *
 * Coordinates are the 256 canvas of the symbol art, y down; times are ms of
 * the win at normal speed (the component scales them for turbo). The beats
 * match neonSymbols.ts / highJump.ts: hit 260, landing 600, 860, 1120.
 */
import type { Point } from './meshRig';

export type FxTexture = 'fxStar' | 'fxGlow' | 'fxStreak' | 'chip';

export type Emitter = {
	tex: FxTexture;
	add?: boolean;
	at: Point;
	/** origin scatter, px */
	jitter?: number;
	/** a burst at this many ms after the symbol's hit… */
	atHit?: number;
	/** …or a stream spread evenly over [from, to] ms */
	from?: number;
	to?: number;
	/** each burst point used in turn (glints hopping round the facets) */
	points?: Point[];
	count: number;
	/** degrees, 0 = right, -90 = up */
	angle: number;
	spread: number;
	speed: [number, number];
	/** px/s², down positive; negative floats */
	gravity?: number;
	/** per second: how fast the launch speed bleeds away */
	drag?: number;
	life: [number, number];
	/** the sprite's width, px */
	size: [number, number];
	/** size at the end of life, as a factor */
	grow?: number;
	tint: [number, number];
	/** streak along the velocity instead of spinning */
	align?: boolean;
	spin?: number;
	/** sideways sway, px */
	sway?: number;
	/** y it lands on and bounces off, once */
	floorY?: number;
	/** alpha at full, default 1 */
	alpha?: number;
};

/** light behind the subject, breathing with the flash */
export type Halo = { at: Point; size: number; tint: number; base: number; flicker: number };

/** a cone of light from a point, swinging between two angles — the soft
 *  glow texture stretched long, drawn from near its end */
export type Beam = { at: Point; from: number; to: number; angles: [number, number]; length: number; width: number; tint: number; alpha: number };

export type WinFx = { emitters: Emitter[]; halo?: Halo; beam?: Beam };

const PINK = 0xff3fd0, CYAN = 0x35e9ff, LIME = 0xb4ff2e, WHITE = 0xffffff;
const HIT = 260;
/** a beat at win time `ms`, as an offset from the hit */
const LAND_AFTER = (ms: number) => ms - HIT;

/** a ring of sound-wave streaks out of both speakers, `after` ms past the hit */
const WAVE = (after: number, count: number, tint: number): Emitter => ({
	tex: 'fxStreak', add: true, at: [0, 0], points: [[61, 163], [187, 163]], atHit: after, count,
	angle: -90, spread: 360, speed: [260, 360], drag: 2.2, life: [300, 420], size: [26, 36], grow: 0.4,
	tint: [WHITE, tint], align: true,
});

/** neon sparks in the letter's own colour */
const LETTER_FX = (tint: number): WinFx => ({
	halo: { at: [128, 130], size: 190, tint, base: 0.1, flicker: 0.6 },
	emitters: [
		{
			tex: 'fxStreak', add: true, at: [128, 130], jitter: 30, atHit: 0, count: 12, angle: -90, spread: 360,
			speed: [170, 270], drag: 2, life: [300, 460], size: [22, 32], grow: 0.4, tint: [WHITE, tint], align: true,
		},
		{
			tex: 'fxStar', add: true, at: [0, 0], points: [[78, 82], [178, 82], [128, 66], [84, 186], [172, 186]], from: 260, to: 900,
			count: 3, angle: 0, spread: 0, speed: [0, 0], life: [280, 360], size: [34, 44], tint: [WHITE, tint], spin: 3,
		},
	],
});

export const WIN_FX: Record<string, WinFx> = {
	H1: {
		halo: { at: [124, 163], size: 240, tint: PINK, base: 0.16, flicker: 0.45 },
		emitters: [
			WAVE(0, 12, PINK),
			WAVE(LAND_AFTER(600), 16, CYAN),
			WAVE(LAND_AFTER(860), 10, PINK),
			WAVE(LAND_AFTER(1120), 8, CYAN),
			{
				tex: 'fxGlow', add: true, at: [126, 70], jitter: 70, from: 120, to: 1250, count: 18,
				angle: -90, spread: 40, speed: [50, 100], gravity: -30, drag: 0.6, life: [600, 900],
				size: [12, 20], grow: 0.3, tint: [PINK, CYAN], sway: 8,
			},
		],
	},
	H2: {
		halo: { at: [104, 90], size: 200, tint: CYAN, base: 0.12, flicker: 0.1 },
		emitters: [
			{
				tex: 'fxStreak', add: true, at: [250, 128], jitter: 100, from: 120, to: 1150, count: 18, angle: 180, spread: 4,
				speed: [420, 560], life: [260, 360], size: [40, 56], tint: [WHITE, CYAN], align: true, alpha: 0.7,
			},
			{
				tex: 'fxStar', add: true, at: [0, 0], points: [[46, 66], [120, 58], [170, 96], [80, 100]], from: 320, to: 1150,
				count: 5, angle: 0, spread: 0, speed: [0, 0], life: [320, 420], size: [46, 60], tint: [WHITE, CYAN], spin: 2.5,
			},
		],
	},
	H3: {
		halo: { at: [170, 60], size: 200, tint: LIME, base: 0.05, flicker: 0.2 },
		emitters: [
			{
				tex: 'fxGlow', add: true, at: [102, 26], jitter: 6, from: 500, to: 1250, count: 32, angle: -16, spread: 34,
				speed: [170, 270], drag: 1.3, gravity: 60, life: [480, 760], size: [14, 24], grow: 2, tint: [0xeaff9a, LIME],
			},
			{
				tex: 'chip', at: [206, 100], jitter: 22, atHit: 360, count: 9, angle: 90, spread: 50, speed: [20, 60],
				gravity: 520, life: [600, 880], size: [6, 10], tint: [LIME, 0x6cd010], spin: 4,
			},
			{
				tex: 'fxStar', add: true, at: [100, 26], atHit: 300, count: 2, angle: 0, spread: 360, speed: [0, 10],
				life: [300, 380], size: [50, 60], tint: [WHITE, LIME], spin: 3,
			},
		],
	},
	H4: {
		halo: { at: [120, 186], size: 230, tint: CYAN, base: 0.12, flicker: 0.35 },
		emitters: [
			{
				tex: 'fxStreak', add: true, at: [120, 204], jitter: 80, atHit: 600 - HIT, count: 18, angle: -90, spread: 150,
				speed: [160, 300], gravity: 900, life: [380, 560], size: [20, 30], grow: 0.4, tint: [WHITE, CYAN],
				align: true, floorY: 214,
			},
			{
				tex: 'fxStreak', add: true, at: [120, 204], jitter: 70, atHit: 1120 - HIT, count: 8, angle: -90, spread: 150,
				speed: [120, 220], gravity: 900, life: [320, 460], size: [18, 26], grow: 0.4, tint: [WHITE, CYAN],
				align: true, floorY: 214,
			},
			{
				tex: 'fxStar', add: true, at: [0, 0], points: [[150, 40], [190, 90], [44, 60]], from: 200, to: 560,
				count: 3, angle: 0, spread: 0, speed: [0, 0], life: [260, 340], size: [40, 50], tint: [WHITE, 0xff9a3a], spin: 3,
			},
		],
	},
	W: {
		halo: { at: [132, 54], size: 150, tint: PINK, base: 0.22, flicker: 0.55 },
		emitters: [
			{
				tex: 'fxStar', add: true, at: [0, 0], points: [[34, 24], [62, 20]], from: HIT - 20, to: 1100, count: 4,
				angle: 0, spread: 0, speed: [0, 0], life: [260, 340], size: [44, 56], tint: [WHITE, PINK], spin: 3,
			},
			{
				tex: 'fxGlow', add: true, at: [128, 224], jitter: 110, from: 100, to: 1250, count: 20, angle: -90, spread: 30,
				speed: [50, 100], gravity: -20, life: [600, 900], size: [11, 18], grow: 0.3, tint: [PINK, CYAN], sway: 6,
			},
			{
				tex: 'fxStreak', add: true, at: [48, 40], jitter: 10, atHit: 0, count: 10, angle: -110, spread: 120,
				speed: [200, 300], drag: 2, life: [280, 400], size: [24, 32], grow: 0.4, tint: [WHITE, CYAN], align: true,
			},
		],
	},
	S: {
		halo: { at: [124, 132], size: 210, tint: 0xffd24a, base: 0.12, flicker: 0.06 },
		emitters: [
			{
				tex: 'fxGlow', add: true, at: [124, 160], jitter: 70, from: 40, to: 1200, count: 22, angle: -90, spread: 50,
				speed: [40, 80], gravity: -14, life: [700, 1000], size: [11, 18], grow: 0.2, tint: [0xfff2a8, 0xffb020], sway: 5,
			},
			{
				tex: 'fxStar', add: true, at: [0, 0], points: [[92, 72], [58, 108], [152, 96], [112, 152], [176, 150], [150, 200], [70, 160]],
				from: 200, to: 1150, count: 8, angle: 0, spread: 0, speed: [0, 0], life: [260, 340], size: [30, 40], tint: [WHITE, CYAN], spin: 3,
			},
		],
	},
	L1: LETTER_FX(0x28dbff),
	L2: LETTER_FX(0xff42cf),
	L3: LETTER_FX(0xffdc3b),
	L4: LETTER_FX(0x45f5c9),
	L5: LETTER_FX(0xc274ff),
};

// ---------------------------------------------------------------------------

export type Particle = {
	emitter: Emitter;
	born: number;
	life: number;
	x0: number;
	y0: number;
	vx: number;
	vy: number;
	size: number;
	spin: number;
	phase: number;
};

/** the same stream of numbers every time for a given seed */
const rng = (seed: number) => {
	let s = seed >>> 0 || 1;
	return () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return (s >>> 0) / 4294967296;
	};
};

export const spawn = (fx: WinFx, hitMs: number, seed: number): Particle[] => {
	const r = rng(seed);
	const between = ([a, b]: [number, number]) => a + (b - a) * r();
	const out: Particle[] = [];
	for (const e of fx.emitters) {
		for (let i = 0; i < e.count; i++) {
			const born =
				e.atHit !== undefined
					? hitMs + e.atHit + r() * 40
					: (e.from ?? 0) + (((e.to ?? 0) - (e.from ?? 0)) * (i + r() * 0.6)) / e.count;
			const base = e.points ? e.points[i % e.points.length] : e.at;
			const j = e.jitter ?? 0;
			const a = ((e.angle + (r() - 0.5) * e.spread) * Math.PI) / 180;
			const v = between(e.speed);
			out.push({
				emitter: e,
				born,
				life: between(e.life),
				x0: base[0] + (r() - 0.5) * 2 * j,
				y0: base[1] + (r() - 0.5) * 2 * j * 0.6,
				vx: Math.cos(a) * v,
				vy: Math.sin(a) * v,
				size: between(e.size),
				spin: ((r() - 0.5) * 2 * (e.spin ?? 0)),
				phase: r() * Math.PI * 2,
			});
		}
	}
	return out;
};

export type ParticleState = { visible: boolean; x: number; y: number; size: number; alpha: number; rotation: number; stretch: number; tint: number };

const mixTint = (a: number, b: number, k: number) => {
	const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k);
	return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

export const particleAt = (p: Particle, t: number): ParticleState => {
	const age = (t - p.born) / p.life;
	if (age <= 0 || age >= 1) return { visible: false, x: 0, y: 0, size: 0, alpha: 0, rotation: 0, stretch: 1, tint: 0 };
	const e = p.emitter;
	const s = (t - p.born) / 1000;
	const k = e.drag ?? 0;
	const travel = k > 0 ? (1 - Math.exp(-k * s)) / k : s;
	const g = e.gravity ?? 0;
	const x = p.x0 + p.vx * travel + (e.sway ?? 0) * Math.sin(s * 5 + p.phase);
	let y = p.y0 + p.vy * travel + 0.5 * g * s * s;
	// velocity now, for the streaks and the bounce
	const dragNow = k > 0 ? Math.exp(-k * s) : 1;
	let vx = p.vx * dragNow;
	let vy = p.vy * dragNow + g * s;
	if (e.floorY !== undefined && y > e.floorY && vy > 0) {
		// one bounce, a third of the height, and it stays down after
		y = e.floorY - (y - e.floorY) * 0.33;
		vy = -vy * 0.33;
		vx *= 0.6;
	}
	// in fast, out slow
	const alpha = (e.alpha ?? 1) * Math.min(1, age * 6) * (1 - age) ** 1.3;
	// `grow` is the size at the end of life; a star also pops in and out
	const grow = e.grow === undefined ? 1 : 1 + (e.grow - 1) * age;
	const size = p.size * grow * (e.tex === 'fxStar' ? Math.sin(Math.PI * Math.min(1, age * 1.3)) : 1);
	const speed = Math.hypot(vx, vy);
	return {
		visible: true,
		x,
		y,
		size,
		alpha,
		rotation: e.align ? Math.atan2(vy, vx) : p.spin * s + p.phase,
		stretch: e.align ? Math.min(2.4, 0.8 + speed / 220) : 1,
		tint: mixTint(e.tint[0], e.tint[1], age),
	};
};

/** 0..1 halo strength this frame: a floor, the flash on top, and a flicker */
export const haloAt = (h: Halo, t: number, flash: number) =>
	Math.min(1, h.base * (1 + h.flicker * (Math.sin(t / 47) * 0.6 + Math.sin(t / 19 + 1.7) * 0.4)) + flash * 0.8);

/** the beam's angle (degrees) and alpha this frame */
export const beamAt = (b: Beam, t: number) => {
	if (t <= b.from || t >= b.to) return { angle: b.angles[0], alpha: 0 };
	const u = (t - b.from) / (b.to - b.from);
	const ease = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
	return { angle: b.angles[0] + (b.angles[1] - b.angles[0]) * ease, alpha: b.alpha * Math.sin(Math.PI * u) ** 0.7 };
};
