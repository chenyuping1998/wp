/** App-owned presentation timings. This module never changes book amounts. */
import { MEDUSA_HIGHLIGHT_MS } from './ppMotion.ts';
export const medusaAnimations = {
	idle: { durationMs: 6000, loop: true, blinkAtMs: 5600, snakeEveryLoops: 3 },
	idle_fidget: { durationMs: 1500, idleAfterMs: 20000 },
	react_small: { durationMs: 800 },
	gaze: {
		durationMs: 2500,
		handAtMs: 200,
		peekAtMs: 350,
		beamAtMs: 600,
		releaseAtMs: 1450,
		beamEndMs: 1900,
	},
	gaze_turbo: {
		durationMs: 2500,
		handAtMs: 200,
		peekAtMs: 350,
		beamAtMs: 600,
		releaseAtMs: 1450,
		beamEndMs: 1900,
	},
	gaze_dud: { durationMs: 1200, turboDurationMs: 1200 },
	fg_trigger: { durationMs: 2000 },
	fg_idle: {
		durationMs: 6000,
		loop: true,
		blinkAtMs: 5600,
		snakeEveryLoops: 3,
	},
	fg_gaze: {
		durationMs: 2100,
		beamAtMs: 200,
		releaseAtMs: 1050,
		beamEndMs: 1500,
	},
	fg_gaze_turbo: {
		durationMs: 2100,
		beamAtMs: 200,
		releaseAtMs: 1050,
		beamEndMs: 1500,
	},
	win_big: { durationMs: 2400, loopMs: 2000 },
	win_max: { durationMs: 3000, loopMs: 2000 },
	fg_end: { durationMs: 1500 },
} as const;

export type MedusaAnimation = keyof typeof medusaAnimations;

export const tumbleTiming = ({ chain = 1, turbo = false, turboLevel = 1 } = {}) => {
	const scale = (chain >= 4 ? 0.8 : 1) * (turbo ? 0.5 : 1) * (turbo && turboLevel === 2 ? 0.8 : 1);
	// PP-style acting gets the readable part of the budget. The shared drop
	// includes its own two rebounds, so no second landing animation is stacked.
	const highlightMs = MEDUSA_HIGHLIGHT_MS * scale;
	const stoneMs = 135 * scale;
	const crackMs = 108 * scale;
	const crumbleMs = 240 * scale;
	const dropMs = 360 * scale;
	const columnStaggerMs = 0;
	const settleMs = 0;
	return {
		scale,
		highlightMs,
		stoneMs,
		crackMs,
		markMs: highlightMs + stoneMs + crackMs,
		crumbleMs,
		dropMs,
		columnStaggerMs,
		settleMs,
		totalMs: highlightMs + stoneMs + crackMs + crumbleMs + dropMs + columnStaggerMs * 5 + settleMs,
	};
};

export const multiplierCountMs = (mult: number, _turbo?: boolean) =>
	600 + 600 * Math.min(1, Math.log10(Math.max(2, mult)) / 2);

export const throwTiming = ({
	freegame,
	applied,
	orbCount,
	mult,
}: {
	freegame: boolean;
	turbo: boolean;
	turboLevel?:number;
	applied: boolean;
	orbCount: number;
	mult: number;
}) => {
	// Character, magic, audio, flight and readout use one readable performance.
	// Turbo tiers affect the board's tumble/drop choreography only.
	const animation: MedusaAnimation = freegame?'fg_gaze':'gaze';
	const action = medusaAnimations[animation];
	const releaseMs=action.releaseAtMs,chargeMs=350,flightMs=600,staggerMs=200,shatterMs=500,landMs=140;
	const plateCountMs=freegame&&applied?400:0,transferMs=applied?650:0,collisionHoldMs=applied?140:0,beamMs=0;
	const countMs=applied?multiplierCountMs(mult):0,resultHoldMs=applied?550:0;
	const firstArrivalMs = releaseMs + flightMs;
	const lastArrivalMs = firstArrivalMs + Math.max(0, orbCount - 1) * staggerMs;
	return {
		animation,
		actionMs: action.durationMs,
		releaseMs,
		chargeMs,
		flightMs,
		staggerMs,
		shatterMs,
		landMs,
		plateCountMs,
		beamMs,
		transferMs,
		collisionHoldMs,
		countMs,
		resultHoldMs,
		firstArrivalMs,
		lastArrivalMs,
		plateCountStartMs: lastArrivalMs + landMs,
		transferStartMs:lastArrivalMs+landMs+plateCountMs,
		collisionAtMs:lastArrivalMs+landMs+plateCountMs+transferMs,
		scoreStartMs: lastArrivalMs + landMs + plateCountMs + transferMs+collisionHoldMs,
		endMs: lastArrivalMs + (applied ? landMs + plateCountMs + transferMs+collisionHoldMs + countMs + resultHoldMs : shatterMs),
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
				'number:transfer',
				'number:collision',
				'score:count',
			]
		: ['gaze', 'orb:fly', 'score:impact', 'number:transfer', 'number:collision', 'score:count'];
};
