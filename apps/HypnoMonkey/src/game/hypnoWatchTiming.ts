import { medusaAnimations, type MedusaAnimation } from './animationTimeline';

/** Both stand34 casts release at 620ms in source time; preserve each book beat. */
export const castReleaseRate = (request: string) => {
 const rates:Record<string,number>={gaze_turbo:620/350,fg_gaze:620/350,fg_gaze_turbo:620/210};
 return rates[request]??1;
};

/**
 * The pocket watch rides the last refill of a winning spin (Gates of Olympus 1000
 * study, research/goo1000_rhythm): the burst leaves a hole, the hypnotist charges
 * in it and points, and the watch lands a beat after the point, so the gesture
 * reads as the cause. The hole only opens when a watch is coming; a spin without
 * one refills straight away.
 */
export const watchDropTiming = ({
	freegame,
	turbo,
	crumbleMs,
	fallMs,
	columnDelayMs,
}: {
	freegame: boolean;
	turbo: boolean;
	crumbleMs: number;
	/** fall of the first watch's column */
	fallMs: number;
	/** stagger before the first watch's column starts */
	columnDelayMs: number;
}) => {
	const animation: MedusaAnimation = freegame
		? turbo
			? 'fg_gaze_turbo'
			: 'fg_gaze'
		: turbo
			? 'gaze_turbo'
			: 'gaze';
	const releaseMs = medusaAnimations[animation].releaseAtMs;
	// GoO lands its orb 0.16 s after Zeus strikes his pose.
	const leadMs = turbo ? 90 : 180;
	const gapMs = Math.max(0, releaseMs + leadMs - crumbleMs - columnDelayMs - fallMs);
	return {
		animation,
		releaseMs,
		leadMs,
		gapMs,
		firstLandMs: crumbleMs + gapMs + columnDelayMs + fallMs,
	};
};

/**
 * Chain-end settlement: the running total (free game) flies into the readout
 * first, then each watch pulses and sends its ×value, the readout holds the
 * whole sum "win × N =", and only then collapses into the paid amount.
 */
export const watchCollectTiming = ({
	turbo,
	watchCount,
	carriesTotal,
}: {
	turbo: boolean;
	watchCount: number;
	/** free game with a total already on the plate */
	carriesTotal: boolean;
}) => {
	const s = turbo ? 0.55 : 1;
	const openMs = 220 * s;
	const totalFlyMs = carriesTotal ? 450 * s : 0;
	const pulseMs = 260 * s;
	const flyMs = 520 * s;
	const staggerMs = 380 * s;
	const holdMs = 350 * s;
	const collapseMs = 220 * s;
	const watchesMs = watchCount > 0 ? pulseMs + flyMs + (watchCount - 1) * staggerMs : 0;
	return {
		openMs,
		totalFlyMs,
		pulseMs,
		flyMs,
		staggerMs,
		holdMs,
		collapseMs,
		formulaMs: openMs + totalFlyMs + watchesMs,
	};
};
