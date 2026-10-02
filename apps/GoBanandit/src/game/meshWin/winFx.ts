/**
 * EACH SYMBOL'S OWN PARTICLES, over its mesh win.
 *
 * The mesh gives every symbol its acting, but the hit used to finish with the
 * same eight gold stars on all of them. Here each gets a signature that says
 * what it IS:
 *
 *   H1 lantern   embers rising out of the vents, the flame's light pulsing
 *   H2 crystal   glints travelling from facet to facet, cyan shards on the hit
 *   H3 picks     a shower of hot sparks from the clash, falling under gravity
 *   H4 cart      gold nuggets jolted out of the load and landing back on it
 *   W  miner     the headlamp's beam sweeping, a glint across the goggles
 *   S  bananas   gold dust drifting up, the nuggets at its foot twinkling
 *   L1..L5       stone chips knocked out of the carved letter
 *
 * Pure data and a DETERMINISTIC evaluator (seeded per symbol), so a particle's
 * state is a function of time alone: SymbolMeshWin.svelte draws it, and the
 * same code can be rendered offline. Imports nothing but meshRig's types.
 *
 * Coordinates are the 256 canvas of the symbol art, y down; times are ms of
 * the win at normal speed (the component scales them for turbo).
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

// dark: the letters are carved into PALE stone, and pale chips vanished on it
const STONE: [number, number] = [0x6e6456, 0x3e372e];
const CHIPS = (tint: [number, number]): Emitter => ({
	tex: 'chip', at: [128, 128], jitter: 34, atHit: 0, count: 14, angle: -90, spread: 170,
	speed: [140, 260], gravity: 760, drag: 0.6, life: [520, 760], size: [7, 13], tint, spin: 12,
});

export const WIN_FX: Record<string, WinFx> = {
	H1: {
		halo: { at: [128, 146], size: 170, tint: 0xffa640, base: 0.22, flicker: 0.3 },
		emitters: [
			{
				tex: 'fxGlow', add: true, at: [128, 46], jitter: 12, from: 60, to: 1250, count: 22,
				angle: -90, spread: 44, speed: [60, 120], gravity: -40, drag: 0.8, life: [760, 1150],
				size: [14, 24], grow: 0.3, tint: [0xffe08a, 0xff5a1a], sway: 7,
			},
			{
				tex: 'fxStar', add: true, at: [128, 142], jitter: 20, atHit: 0, count: 6, angle: -90, spread: 360,
				speed: [40, 100], life: [400, 560], size: [40, 58], grow: 0.2, tint: [0xffffff, 0xffc04a], spin: 3,
			},
		],
	},
	H2: {
		halo: { at: [104, 104], size: 190, tint: 0x6fe6ff, base: 0.16, flicker: 0.08 },
		emitters: [
			{
				tex: 'fxStar', add: true, at: [0, 0], from: 100, to: 1150, count: 7,
				points: [[54, 20], [120, 54], [30, 70], [166, 88], [84, 94], [140, 130], [70, 150]],
				angle: 0, spread: 0, speed: [0, 0], life: [360, 440], size: [52, 68], grow: 0, tint: [0xffffff, 0x9ff2ff], spin: 2.5,
			},
			{
				tex: 'fxStreak', add: true, at: [104, 104], jitter: 16, atHit: 0, count: 14, angle: -90, spread: 360,
				speed: [220, 340], gravity: 320, drag: 1.2, life: [440, 620], size: [30, 42], grow: 0.3,
				tint: [0xe8feff, 0x3fc8ff], align: true,
			},
		],
	},
	H3: {
		halo: { at: [128, 34], size: 110, tint: 0xffb04a, base: 0, flicker: 0 },
		emitters: [
			{
				tex: 'fxStreak', add: true, at: [128, 30], jitter: 6, atHit: 0, count: 24, angle: -90, spread: 170,
				speed: [240, 440], gravity: 760, drag: 1, life: [450, 760], size: [28, 40], grow: 0.35,
				tint: [0xfff2b0, 0xff5a10], align: true,
			},
			{
				tex: 'fxStreak', add: true, at: [128, 30], jitter: 6, atHit: 260, count: 12, angle: -90, spread: 150,
				speed: [180, 300], gravity: 760, drag: 1, life: [380, 600], size: [22, 32], grow: 0.35,
				tint: [0xfff2b0, 0xff5a10], align: true,
			},
		],
	},
	H4: {
		halo: { at: [128, 62], size: 170, tint: 0xffd24a, base: 0, flicker: 0 },
		emitters: [
			{
				tex: 'chip', at: [128, 52], jitter: 40, atHit: 0, count: 11, angle: -90, spread: 100,
				speed: [170, 280], gravity: 820, life: [760, 980], size: [10, 15], tint: [0xffe066, 0xd9981c],
				spin: 9, floorY: 66,
			},
			{
				tex: 'fxStar', add: true, at: [128, 50], jitter: 44, atHit: 120, count: 6, angle: -90, spread: 360,
				speed: [0, 20], life: [320, 440], size: [36, 50], tint: [0xffffff, 0xffd24a], spin: 3,
			},
		],
	},
	W: {
		halo: { at: [182, 60], size: 120, tint: 0xfff0b0, base: 0.25, flicker: 0.18 },
		beam: { at: [190, 62], from: 60, to: 1250, angles: [30, -10], length: 120, width: 84, tint: 0xfff2c8, alpha: 0.5 },
		emitters: [
			{
				tex: 'fxStar', add: true, at: [0, 0], from: 520, to: 900, count: 2, points: [[118, 104], [176, 112]],
				angle: 0, spread: 0, speed: [0, 0], life: [340, 400], size: [52, 62], tint: [0xffffff, 0xfff2c8], spin: 2,
			},
		],
	},
	S: {
		halo: { at: [120, 104], size: 190, tint: 0xffd24a, base: 0.12, flicker: 0.06 },
		emitters: [
			{
				tex: 'fxGlow', add: true, at: [124, 150], jitter: 60, from: 40, to: 1200, count: 22, angle: -90, spread: 50,
				speed: [40, 80], gravity: -14, life: [700, 1000], size: [11, 18], grow: 0.2, tint: [0xfff2a8, 0xffb020], sway: 5,
			},
			{
				tex: 'fxStar', add: true, at: [0, 0], from: 200, to: 1000, count: 4, points: [[60, 176], [100, 184], [152, 190], [184, 170]],
				angle: 0, spread: 0, speed: [0, 0], life: [320, 400], size: [38, 48], tint: [0xffffff, 0xffd24a], spin: 3,
			},
		],
	},
	L1: { emitters: [CHIPS(STONE)] },
	L2: { emitters: [CHIPS(STONE)] },
	L3: { emitters: [CHIPS(STONE)] },
	L4: { emitters: [CHIPS(STONE)] },
	L5: { emitters: [CHIPS(STONE)] },
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
