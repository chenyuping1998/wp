/**
 * Settled-board life for every Sumo Monkey symbol.
 *
 * Review 2026-11-03 (5.3, "Poor animations"): a settled board did not move at
 * all — symbols only squashed on landing. Same verdict Turf War got on 10-27
 * ("too static"). Each symbol now has its own act, and one cell on the board
 * performs it every SLOT_MS, in a scattered order so it never reads as a reel
 * sweep. Between acts every symbol holds its source pose exactly.
 * Gate: design/check_symbol_idle.mjs (part of `pnpm build`).
 */

export type IdleFrame = {
	dx: number; // fraction of SYMBOL_SIZE
	dy: number;
	rotation: number; // radians
	scaleX: number;
	scaleY: number;
	alpha: number;
	/** 0..1 progress through the act, -1 between acts */
	actU: number;
};

type IdleSpec = {
	actMs: number;
	frame: (u: number) => Partial<IdleFrame>;
};

const TAU = Math.PI * 2;
const sin = Math.sin;
// smooth 0→1→0 bell over u ∈ [0,1]
const bell = (u: number) => (u < 0 || u > 1 ? 0 : sin(Math.PI * u) ** 2);
// damped oscillation, n half-swings over u
const ring = (u: number, n: number) => (u < 0 ? 0 : sin(Math.PI * n * u) * (1 - u));
// rotation about a pivot py below (+) or above (−) the centre
const pivot = (rot: number, py: number) => ({
	rotation: rot,
	dx: py * sin(rot),
	dy: py * (1 - Math.cos(rot)),
});
// hop: up over [0,a], then n settling bounces
const hop = (u: number, a: number) => (u < 0 ? 0 : u < a ? sin((Math.PI * u) / a) : 0);

export const IDLE_SPECS: Record<string, IdleSpec> = {
	// Trophy: hoisted like a yusho cup — lift, tilt to the crowd, set down with a thud.
	H1: {
		actMs: 1100,
		frame: (u) => {
			const lift = hop(u, 0.6);
			const land = u < 0.6 ? 0 : ring((u - 0.6) / 0.4, 2);
			return {
				...pivot(0.07 * sin(TAU * Math.min(u / 0.6, 1)) * lift, 0.35),
				dy: -0.07 * lift,
				scaleX: 1 + 0.05 * lift + 0.05 * land,
				scaleY: 1 + 0.05 * lift - 0.06 * land,
			};
		},
	},
	// Mawashi belts: pulled tight — a sideways stretch, snap back, two rebounds.
	H2: {
		actMs: 800,
		frame: (u) => {
			const tug = u < 0.3 ? bell(u / 0.6) : 0;
			const snap = u < 0.3 ? 0 : ring((u - 0.3) / 0.7, 3);
			return {
				scaleX: 1 + 0.1 * tug - 0.05 * snap,
				scaleY: 1 - 0.05 * tug + 0.04 * snap,
			};
		},
	},
	// Gunbai fan: the gyoji's call — swings from the grip, points, swings back.
	H3: {
		actMs: 1000,
		frame: (u) => {
			const point = u < 0.35 ? -0.5 * bell(u / 0.7) : 0;
			const call = u < 0.35 ? 0 : ring((u - 0.35) / 0.65, 2.5);
			return pivot(0.22 * call + 0.12 * point, 0.38);
		},
	},
	// Zori: shiko stamp — tilt onto one side, stamp down, the other side, stamp.
	H4: {
		actMs: 1000,
		frame: (u) => {
			const side = u < 0 ? 0 : u < 0.5 ? 1 : -1;
			const v = u < 0 ? 0 : u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
			const up = v < 0.55 ? sin((Math.PI * v) / 0.55) : 0;
			const stamp = v < 0.55 ? 0 : ring((v - 0.55) / 0.45, 2);
			return {
				...pivot(0.1 * side * up, 0.3),
				dy: -0.04 * up,
				scaleX: 1 + 0.07 * stamp,
				scaleY: 1 - 0.07 * stamp,
			};
		},
	},
	// Rikishi medallion: a head-butt charge — crouch, lunge out, recoil.
	W: {
		actMs: 900,
		frame: (u) => {
			const crouch = u < 0.25 ? bell(u / 0.5) : 0;
			const lunge = u < 0.25 ? 0 : ring((u - 0.25) / 0.75, 2);
			return {
				scaleX: 1 - 0.04 * crouch + 0.1 * lunge,
				scaleY: 1 - 0.06 * crouch + 0.1 * lunge,
				rotation: -0.05 * crouch + 0.06 * lunge,
				dy: 0.03 * crouch,
			};
		},
	},
	// Torii: a gust through the gate — the gate sways from its feet, settles.
	S: {
		actMs: 1200,
		frame: (u) => ({
			...pivot(0.08 * ring(u, 3), 0.42),
			scaleY: 1 + 0.05 * bell(u),
		}),
	},
	// Prize Medallion: the rim rolls one full turn under its value stamp (the
	// stamp is drawn by Symbol.svelte and stays put, so it never flips away).
	P: {
		actMs: 1100,
		frame: (u) => {
			const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
			return { rotation: TAU * e, scaleX: 1 + 0.06 * bell(u), scaleY: 1 + 0.06 * bell(u) };
		},
	},
	// A: a salt throw — hops up, lands square.
	L1: {
		actMs: 700,
		frame: (u) => {
			const air = hop(u, 0.55);
			const land = u < 0.55 ? 0 : ring((u - 0.55) / 0.45, 2);
			return { dy: -0.07 * air, scaleX: 1 + 0.07 * land, scaleY: 1 - 0.07 * land };
		},
	},
	// K: a tachiai shove — leans back, slams forward, settles.
	L2: {
		actMs: 750,
		frame: (u) => ({
			...pivot(0.14 * ring(u, 2.5), 0.4),
			dx: 0.04 * ring(u, 2.5),
		}),
	},
	// Q: a slow bow — dips forward from the base and rises.
	L3: {
		actMs: 1000,
		frame: (u) => ({
			...pivot(0.12 * bell(u), 0.45),
			scaleY: 1 - 0.04 * bell(u),
		}),
	},
	// J: hangs from its cord and swings. The pivot is the cord's top: 0.45 above
	// centre on the old narrow shide tag, 0.37 on the wide hexagonal plaque that
	// replaced it (2026-11-10, top of the art at y 64 of 512).
	L4: {
		actMs: 1000,
		frame: (u) => pivot(0.16 * ring(u, 3), -0.37),
	},
	// 10: a slap-down — squashes flat, pops back with a shake.
	L5: {
		actMs: 700,
		frame: (u) => {
			const sq = u < 0.3 ? bell(u / 0.6) : 0;
			const shake = u < 0.3 ? 0 : ring((u - 0.3) / 0.7, 5);
			return {
				scaleX: 1 + 0.09 * sq,
				scaleY: 1 - 0.1 * sq,
				dx: 0.035 * shake,
			};
		},
	},
};

const REST: IdleFrame = { dx: 0, dy: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, actU: -1 };

/** A new cell acts every SLOT_MS; every cell's turn comes round once a cycle. */
export const SLOT_MS = 1400;
export const SLOTS = 20;
export const IDLE_CYCLE_MS = SLOT_MS * SLOTS;

/**
 * Scattered slot for a cell: neighbours are never consecutive, so the acts hop
 * around the board. Rows past 4 (the feature's taller dohyo) fold back in.
 */
export const idleSlot = (reel: number, row: number) => (((row * 5 + reel) * 7) % SLOTS + SLOTS) % SLOTS;

/** `t` = idle clock (ms). */
export const symbolIdleFrame = (name: string, t: number, reel: number, row: number): IdleFrame => {
	const spec = IDLE_SPECS[name];
	if (!spec) return REST;
	const c = ((t % IDLE_CYCLE_MS) + IDLE_CYCLE_MS) % IDLE_CYCLE_MS;
	const elapsed = c - idleSlot(reel, row) * SLOT_MS;
	if (elapsed < 0 || elapsed >= spec.actMs) return REST;
	const u = elapsed / spec.actMs;
	return { ...REST, ...spec.frame(u), actU: u };
};
