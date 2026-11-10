/** App-owned presentation timings. This module never changes book amounts. */
export const medusaAnimations = {
	idle: { durationMs: 6000, loop: true, blinkAtMs: 5600, snakeEveryLoops: 3 },
	idle_fidget: { durationMs: 1500, idleAfterMs: 20000 },
	react_small: { durationMs: 800 },
	gaze: {
		durationMs: 800,
		handAtMs: 100,
		peekAtMs: 175,
		beamAtMs: 300,
		releaseAtMs: 310,
		beamEndMs: 500,
	},
	gaze_turbo: {
		durationMs: 650,
		handAtMs: 70,
		peekAtMs: 125,
		beamAtMs: 180,
		releaseAtMs: 250,
		beamEndMs: 440,
	},
	gaze_dud: { durationMs: 1200, turboDurationMs: 600 },
	fg_trigger: { durationMs: 2000 },
	fg_idle: {
		durationMs: 6000,
		loop: true,
		blinkAtMs: 5600,
		snakeEveryLoops: 3,
	},
	fg_gaze: {
		durationMs: 1200,
		beamAtMs: 200,
		releaseAtMs: 350,
		beamEndMs: 950,
	},
	fg_gaze_turbo: {
		durationMs: 900,
		beamAtMs: 100,
		releaseAtMs: 210,
		beamEndMs: 660,
	},
	win_big: { durationMs: 2400, loopMs: 2000 },
	win_max: { durationMs: 3000, loopMs: 2000 },
	fg_end: { durationMs: 1500 },
	// Dragon Tide staff set (SPEC §4, 天使奧丁 timings): wind-up while the feature plaque
	// is up (ready 0.52 s → ready_loop), then the transform act before the portal.
	fg_ready: { durationMs: 520 },
	fg_transform: { durationMs: 1600 },
} as const;

export type MedusaAnimation = keyof typeof medusaAnimations;

/**
 * One tumble link on a fixed clock, whatever the win size.
 *
 * Normal play is 天使奧丁's link (SPEC §2.2, reference §3.3/§3.3.1: every link 3.0 s, base
 * game and free game alike, whatever the chain length): the winners are framed and act for
 * 1.30 s (mark) while their amount shows, the frames go and each winner swells to a light ball
 * (flash, 0.15 s), bursts at 1.45 s into the splash (crumble, 0.5 s), the column hangs open
 * 0.15 s (empty), the refill starts at 2.10 s left to right 50 ms a reel, survivors and new
 * symbols falling together, lands, and the next link's frames come 0.25 s after the last reel.
 * Turbo keeps our own shorter clock (the reference was recorded without turbo).
 */
export const tumbleTiming = ({ turbo = false, turboLevel = 1 }: { chain?: number; turbo?: boolean; turboLevel?: number } = {}) => {
	const scale = turbo ? 0.6 * (turboLevel === 2 ? 0.8 : 1) : 1;
	const highlightMs = turbo ? 120 : 760;
	const stoneMs = turbo ? 60 : 330;
	const crackMs = turbo ? 60 : 210;
	const restMs = 0;
	const flashMs = turbo ? 70 : 150;
	const crumbleMs = turbo ? 220 : 500;
	const emptyMs = turbo ? 60 : 150;
	/** survivors start dropping this long into the burst (normal: with the refill, as one string) */
	const survivorsAtMs = turbo ? 50 : crumbleMs + emptyMs - 100;
	const dropMs = turbo ? 550 * scale : 450;
	const columnStaggerMs = turbo ? 27 * scale : 50;
	const settleMs = turbo ? 150 * scale : 250;
	return {
		scale,
		highlightMs,
		stoneMs,
		crackMs,
		markMs: highlightMs + stoneMs + crackMs,
		restMs,
		flashMs,
		crumbleMs,
		survivorsAtMs,
		emptyMs,
		/** tumble start -> refill start */
		clearMs: restMs + flashMs + crumbleMs + emptyMs,
		dropMs,
		columnStaggerMs,
		settleMs,
		totalMs: highlightMs + stoneMs + crackMs + restMs + flashMs + crumbleMs + emptyMs + dropMs + columnStaggerMs * 5 + settleMs,
	};
};

export const multiplierCountMs = (mult: number, turbo: boolean) =>
	(600 + 600 * Math.min(1, Math.log10(Math.max(2, mult)) / 2)) * (turbo ? 0.6 : 1);

export const throwTiming = ({
	freegame,
	turbo,
	applied,
	orbCount,
	mult,
}: {
	freegame: boolean;
	turbo: boolean;
	applied: boolean;
	orbCount: number;
	mult: number;
}) => {
	const animation: MedusaAnimation = freegame
		? turbo
			? 'fg_gaze_turbo'
			: 'fg_gaze'
		: turbo
			? 'gaze_turbo'
			: 'gaze';
	const action = medusaAnimations[animation];
	// A dud uses a compact setup: the joke is its grey crack, not a long charge.
	const releaseMs = applied
		? action.releaseAtMs
		: freegame
			? turbo
				? 140
				: 200
			: turbo
				? 175
				: 350;
	const flightMs = turbo ? 270 : 450;
	const staggerMs = turbo ? 90 : 150;
	const shatterMs = turbo ? 150 : freegame ? 250 : 300;
	const landMs = turbo ? 80 : 120;
	const plateCountMs = freegame && applied ? (turbo ? 240 : 400) : 0;
	const beamMs = freegame && applied ? (turbo ? 90 : 150) : 0;
	const countMs = applied ? multiplierCountMs(mult, turbo) : 0;
	const resultHoldMs=applied?(turbo?120:360):0;
	const firstArrivalMs = releaseMs + flightMs;
	const lastArrivalMs = firstArrivalMs + Math.max(0, orbCount - 1) * staggerMs;
	return {
		animation,
		actionMs: action.durationMs,
		releaseMs,
		flightMs,
		staggerMs,
		shatterMs,
		landMs,
		plateCountMs,
		beamMs,
		countMs,
		resultHoldMs,
		firstArrivalMs,
		lastArrivalMs,
		plateCountStartMs: lastArrivalMs + landMs,
		scoreStartMs: lastArrivalMs + landMs + plateCountMs + beamMs,
		endMs: lastArrivalMs + (applied ? landMs + plateCountMs + beamMs + countMs + resultHoldMs : shatterMs),
	};
};

/** Offline inspection and rig handoff use the same sequence as MedusaThrow. */
export const multiplierStages = (input: Parameters<typeof throwTiming>[0]) => {
	if (!input.orbCount) return input.applied ? ['score:base'] : [];
	if (!input.applied) return ['gaze', 'orb:fly', 'orb:grey', 'orb:crack', 'orb:rubble', 'gaze_dud'];
	return input.freegame
		? [
				'fg_gaze',
				'orb:fly',
				'plate:impact',
				'plate:count',
				'plate:level',
				'plate:beam',
				'score:count',
			]
		: ['gaze', 'orb:fly', 'score:impact', 'score:count'];
};
