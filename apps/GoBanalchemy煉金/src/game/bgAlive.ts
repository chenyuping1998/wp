/**
 * The backgrounds' MOVING air and energy (2026-10-29, user: 「背景動態要做得更
 * 明顯生動」). BgLight only breathes light and nudges its fog banks a third of
 * their width; this is the part that travels, so the room reads as alive
 * from across the screen:
 *
 *   rivers   long banks of green fog flowing across the floor and through
 *            the arch, wrapping round, two speeds for depth
 *   vapor    curls of elixir vapour (the reel blast's own potion_vapor art)
 *            rising out of the glowing flasks, twisting as they go
 *   surges   (feature) a pulse of light runs up each glass tube, one tube
 *            after another
 *   embers   (feature) motes of crystal energy lift off the crystal beds
 *   sparks   (feature) a facet catches the light now and then
 *
 * Pure: (scene, t, stir) -> sprite states in the plates' 1920 x 1080 space,
 * so design/preview_bg_alive.mjs can draw the same frames offline.
 * BgAlive.svelte maps them into the plate's box.
 */

export type AliveSprite = {
	/** stable across frames, for keyed rendering */
	id: string;
	key: string;
	x: number;
	y: number;
	w: number;
	h: number;
	rot: number;
	alpha: number;
	tint: number;
	add: boolean;
};

type River = { y: number; h: number; w: number; speed: number; alpha: number; n: number };
const RIVERS: Record<'base' | 'feature', River[]> = {
	base: [
		// through the arch, slow (far)
		{ y: 470, h: 300, w: 640, speed: 18, alpha: 0.15, n: 5 },
		// along the floor, faster (near)
		{ y: 840, h: 280, w: 600, speed: 32, alpha: 0.2, n: 5 },
	],
	feature: [
		{ y: 600, h: 260, w: 600, speed: 16, alpha: 0.12, n: 5 },
		{ y: 920, h: 240, w: 620, speed: 30, alpha: 0.2, n: 5 },
	],
};

// [x, y] of a flask mouth, the period between curls, a phase
type Vent = [number, number, number, number];
const VAPOR: Record<'base' | 'feature', Vent[]> = {
	base: [
		[170, 582, 1.7, 0], // the round elixir flask on the left table
		[1824, 176, 2.1, 0.6], // the green flask on the right top shelf
		[34, 438, 2.6, 1.3], // the green bottle low on the left shelf
		[1712, 520, 1.9, 0.9], // the copper still's green glow, right
	],
	// off the crystal beds, rising over the dark stone between the banks
	feature: [
		[640, 900, 2.2, 0],
		[1290, 900, 2.5, 1.1],
		[330, 990, 2.9, 0.5],
		[1600, 990, 2.6, 1.7],
	],
};

// [cx, cy, rx, ry] of the glass tubes (BG_POTIONS.feature's cyan chambers)
const TUBES: [number, number, number, number][] = [
	[397, 148, 34, 56],
	[512, 565, 24, 66],
	[1590, 265, 36, 86],
	[1508, 505, 20, 34],
];

// the crystal beds embers lift off, [x0, x1, y]
// The feature plate is lit green from edge to edge, so anything green on it
// vanishes: what reads there is WHITE-hot light moving over the dark stone
// between the banks.
const BEDS: [number, number, number][] = [
	[120, 720, 960],
	[1200, 1800, 960],
];
// crystal faces a spark can land on (feature), [x, y]
const FACETS: [number, number][] = [
	[120, 330], [210, 520], [60, 600], [300, 760], [170, 880], [455, 870],
	[1750, 420], [1820, 520], [1660, 640], [1500, 700], [1450, 860], [1880, 760],
];

const hash = (n: number) => {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};

export function aliveSprites(scene: 'base' | 'feature', t: number, stir = 0): AliveSprite[] {
	const out: AliveSprite[] = [];

	// fog rivers: n banks spaced evenly along a loop one screen + one bank wide
	for (const [r, river] of RIVERS[scene].entries()) {
		const span = 1920 + river.w;
		for (let i = 0; i < river.n; i++) {
			const x = ((i / river.n) * span + t * river.speed * (1 + 1.5 * stir) + r * 230) % span - river.w / 2;
			// each bank thickens and thins on its own slow clock, so the river
			// never looks like a conveyor of identical puffs
			const thick = 0.65 + 0.35 * Math.sin(t * 0.21 + i * 1.9 + r * 0.7);
			out.push({
				id: `r${r}.${i}`,
				key: `bgFog${(i + r) % 3}`,
				x,
				y: river.y + 26 * Math.sin(t * 0.17 + i * 2.3),
				w: river.w * (0.9 + 0.2 * hash(i + r * 7)),
				h: river.h,
				rot: 0,
				alpha: river.alpha * thick * (1 + 0.6 * stir),
				tint: 0x46e0a6,
				add: true,
			});
		}
	}

	// vapour: a curl leaves the mouth every period, rises ~300px in 3.4s,
	// swinging side to side, growing and slowly turning, then thins away
	const LIFE = 3.4;
	for (const [v, [vx, vy, period, phase]] of VAPOR[scene].entries()) {
		for (let k = 0; k < Math.ceil(LIFE / period); k++) {
			const born = Math.floor((t + phase) / period - k) * period - phase;
			const u = (t - born) / LIFE;
			if (u <= 0 || u >= 1) continue;
			const seed = hash(Math.round(born * 10) + v * 31);
			const rise = 1 - (1 - u) ** 1.6;
			const size = 70 + 210 * rise;
			out.push({
				id: `v${v}.${Math.round(born * 100)}`,
				key: 'gbPotionVapor',
				x: vx + (seed - 0.5) * 18 + 30 * Math.sin(u * Math.PI * 1.6 + seed * 6) * u,
				y: vy - 300 * rise,
				w: size,
				h: size,
				rot: (seed - 0.5) * 1.2 + u * (seed > 0.5 ? 1.1 : -1.1),
				alpha: 0.5 * Math.min(1, u / 0.18) * (1 - u) ** 1.3 * (1 + 0.5 * stir),
				tint: 0xffffff,
				add: true,
			});
		}
	}

	if (scene === 'feature') {
		// surges: one tube at a time, 0.8s bottom to top, every 1.3s
		const SURGE = 1.3;
		const n = Math.floor(t / SURGE);
		const p = (t / SURGE - n) / (0.8 / SURGE);
		if (p < 1) {
			const [cx, cy, rx, ry] = TUBES[(n * 3) % TUBES.length];
			const y = cy + ry - 2 * ry * (1 - (1 - p) ** 2);
			const a = Math.sin(Math.PI * p);
			out.push({ id: 'surge', key: 'fxGlow', x: cx, y, w: rx * 4, h: rx * 2.2, rot: 0, alpha: 0.9 * a, tint: 0xb8ffe8, add: true });
			out.push({ id: 'surgeCore', key: 'fxGlow', x: cx, y, w: rx * 1.8, h: rx * 1.1, rot: 0, alpha: a, tint: 0xffffff, add: true });
		}

		// embers: 26 motes, each its own rise speed and sway, looping
		for (let i = 0; i < 26; i++) {
			const [x0, x1, by] = BEDS[i % 2];
			const life = 4.2 + 2.4 * hash(i + 3);
			const u = ((t + hash(i) * life) / life) % 1;
			const x = x0 + (x1 - x0) * hash(i + 11) + 22 * Math.sin(u * 7 + i);
			const size = 28 + 30 * hash(i + 5);
			out.push({
				id: `e${i}`,
				key: 'fxGlow',
				x,
				y: by - 520 * u,
				w: size,
				h: size,
				rot: 0,
				alpha: Math.min(1, Math.sin(Math.PI * u) * (0.7 + 0.3 * Math.sin(t * 6 + i * 2.1)) * (1 + stir)),
				tint: i % 3 ? 0xc8ffe6 : 0xffffff,
				add: true,
			});
		}

		// sparks: three slots, each pops on a different facet every ~1.4s
		for (let slot = 0; slot < 3; slot++) {
			const period = 1.4 + slot * 0.33;
			const m = Math.floor(t / period + slot * 0.41);
			const q = (t / period + slot * 0.41) % 1;
			if (q >= 0.25) continue;
			const [fx, fy] = FACETS[(m * 5 + slot * 7) % FACETS.length];
			const s = Math.sin((q / 0.25) * Math.PI);
			out.push({ id: `k${slot}`, key: 'fxStar', x: fx, y: fy, w: 104 * s, h: 104 * s, rot: m * 0.6, alpha: s, tint: 0xe6fff4, add: true });
		}
	}
	return out;
}
