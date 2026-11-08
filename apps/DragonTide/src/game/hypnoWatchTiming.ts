import { medusaAnimations, type MedusaAnimation } from './animationTimeline';

/** Both stand34 casts release at 620ms in source time; preserve each book beat.
 * MG gaze plays at 2x: ATG 戰神賽特's throw is a quick ~0.8 s gesture (research
 * ATG-Seth-Capture §5), same poses, only faster. */
export const castReleaseRate = (request: string) => {
 const rates:Record<string,number>={gaze:2,gaze_turbo:620/350*1.4,fg_gaze:620/350,fg_gaze_turbo:620/210};
 return rates[request]??1;
};

/**
 * The pocket watch rides the last refill of a winning spin, blank, and its value
 * is struck in by a beam once it lands (ATG 戰神賽特, research ATG-Seth-Capture
 * §3-1). The hypnotist casts as the tumble starts; on the ATG clock the refill
 * already lands after the gesture, so the hole only opens when it would not
 * (turbo).
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
	topTier = false,
}: {
	turbo: boolean;
	watchCount: number;
	/** free game with a total already on the plate */
	carriesTotal: boolean;
	/** a top-tier (gold, ×250+) watch is in the sum */
	topTier?: boolean;
}) => {
	// ATG 戰神賽特 (research ATG-Seth-Capture §3-3): a light ball pops out of
	// the watch and comets to the readout in 0.25 s, one watch every 0.35 s; the
	// running total (free game) flies first; "win ×N" holds ~0.75 s, then pays.
	const s = turbo ? 0.55 : 1;
	const openMs = 220 * s;
	const totalFlyMs = carriesTotal ? 350 * s : 0;
	const pulseMs = 50 * s;
	const flyMs = 250 * s;
	const staggerMs = 350 * s;
	// 天使奧丁 holds its 1000x eye a further 0.6 s (EyeOdd1000HoldTime)
	const holdMs = (750 + (topTier ? 600 : 0)) * s;
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
