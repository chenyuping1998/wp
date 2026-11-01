/** App-owned presentation timings. This module never changes book amounts. */
export const medusaAnimations = {
	idle: { durationMs: 6000, loop: true, blinkAtMs: 5600, snakeEveryLoops: 3 },
	idle_fidget: { durationMs: 1500, idleAfterMs: 20000 },
	react_small: { durationMs: 800 },
	gaze: {
		durationMs: 1600,
		handAtMs: 200,
		peekAtMs: 350,
		beamAtMs: 600,
		releaseAtMs: 620,
		beamEndMs: 1000,
	},
	gaze_turbo: {
		durationMs: 900,
		handAtMs: 100,
		peekAtMs: 175,
		beamAtMs: 250,
		releaseAtMs: 350,
		beamEndMs: 620,
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
} as const;

export type MedusaAnimation = keyof typeof medusaAnimations;

/**
 * One tumble link on a fixed clock, whatever the win size (GoO 1000
 * transcription, research/goo1000_motion): the winners glow and take the spell
 * (mark), a silent beat, a two-frame white flash, the burst, a short look at the
 * empty cells, then the refill. Turbo drops the mark to a flick and the beat,
 * as GoO Turbo does, but keeps the burst whole.
 */
export const tumbleTiming = ({ chain = 1, turbo = false, turboLevel = 1 } = {}) => {
	const scale = (chain >= 4 ? 0.85 : 1) * (turbo ? 0.6 : 1) * (turbo && turboLevel === 2 ? 0.8 : 1);
	const highlightMs = (turbo ? 120 : 620) * (turbo ? 1 : scale);
	const stoneMs = (turbo ? 60 : 200) * (turbo ? 1 : scale);
	const crackMs = (turbo ? 60 : 130) * (turbo ? 1 : scale);
	const restMs = turbo ? 0 : 170 * scale;
	const flashMs = 33;
	const crumbleMs = 350 * (turbo ? 1 : scale);
	const emptyMs = (turbo ? 60 : 120) * (turbo ? 1 : scale);
	const dropMs = 550 * scale;
	const columnStaggerMs = 27 * scale;
	const settleMs = 150 * scale;
	return {
		scale,
		highlightMs,
		stoneMs,
		crackMs,
		markMs: highlightMs + stoneMs + crackMs,
		restMs,
		flashMs,
		crumbleMs,
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
