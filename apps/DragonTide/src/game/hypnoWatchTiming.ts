import { medusaAnimations, type MedusaAnimation } from './animationTimeline';

/** Both stand34 casts release at 620ms in source time; preserve each book beat.
 * MG gaze plays at 2x: ATG 戰神賽特's throw is a quick ~0.8 s gesture (research
 * ATG-Seth-Capture §5), same poses, only faster. */
export const castReleaseRate = (request: string) => {
 const rates:Record<string,number>={gaze:2,gaze_turbo:620/350*1.4,fg_gaze:620/350,fg_gaze_turbo:620/210};
 return rates[request]??1;
};

/**
 * A refill pearl (天使奧丁, SPEC §2.3): the caster acts at the burst (castDelayMs into the
 * tumble), the pearl rides its column's refill with its value already on it, and the strike
 * comes as its column stops. On the reference clock the refill lands well after the gesture;
 * the hole only opens when it would not (turbo).
 */
export const watchDropTiming = ({
	freegame,
	turbo,
	crumbleMs,
	fallMs,
	columnDelayMs,
	castDelayMs = 0,
}: {
	freegame: boolean;
	turbo: boolean;
	crumbleMs: number;
	/** fall of the first watch's column */
	fallMs: number;
	/** stagger before the first watch's column starts */
	columnDelayMs: number;
	/** the caster acts this long into the tumble (the burst) */
	castDelayMs?: number;
}) => {
	const animation: MedusaAnimation = freegame
		? turbo
			? 'fg_gaze_turbo'
			: 'fg_gaze'
		: turbo
			? 'gaze_turbo'
			: 'gaze';
	const releaseMs = medusaAnimations[animation].releaseAtMs;
	// the pearl never lands before the gesture has released it
	const leadMs = turbo ? 90 : 180;
	const gapMs = Math.max(0, castDelayMs + releaseMs + leadMs - crumbleMs - columnDelayMs - fallMs);
	return {
		animation,
		castDelayMs,
		releaseMs,
		leadMs,
		gapMs,
		firstLandMs: crumbleMs + gapMs + columnDelayMs + fallMs,
	};
};

/**
 * Chain-end settlement on the reference clock (天使奧丁 §4.3 / §4.3.1, SPEC §2.4). Base game: the
 * first pearl pops its value at once (0.2 s) as the readout opens and the value travels 0.8 s.
 * Free game: the readout opens (0.2 s), the running TOTAL pops off its plate and flies in
 * ("win × TOTAL" at 1.2 s), and the pearls follow from 1.4 s. Pearls go column 1 to 6, one every
 * 0.7 s start to start (a base-game pearl may pop while the last is still in the air); 0.3 s
 * after the last the whole sum holds — 1.6 s before a big win (and always in the base game),
 * 0.8 s otherwise, the ×1000 prism 0.6 s longer — and only then collapses into the paid amount.
 */
export const watchCollectTiming = ({
	turbo,
	watchCount,
	carriesTotal,
	topTier = false,
	freegame = carriesTotal,
	bigWin = false,
}: {
	turbo: boolean;
	watchCount: number;
	/** free game with a total already on the plate */
	carriesTotal: boolean;
	/** a top-tier (prism, ×250+) pearl is in the sum */
	topTier?: boolean;
	freegame?: boolean;
	/** the spin goes on to a big-win plaque */
	bigWin?: boolean;
}) => {
	const s = turbo ? 0.55 : 1;
	const openMs = 200 * s;
	const totalFlyMs = carriesTotal ? 1000 * s : 0;
	// "win × TOTAL" reads for 0.2 s before the first pearl pops
	const afterTotalMs = carriesTotal ? 200 * s : 0;
	// the base-game readout opens with the first pearl rather than before it
	const leadMs = freegame ? openMs : 0;
	const pulseMs = 200 * s;
	const flyMs = (freegame ? 500 : 800) * s;
	const staggerMs = 700 * s;
	const settleMs = 300 * s;
	const holdMs = ((freegame && !bigWin ? 800 : 1600) + (topTier ? 600 : 0)) * s;
	const collapseMs = 200 * s;
	const watchesMs = watchCount > 0 ? pulseMs + flyMs + (watchCount - 1) * staggerMs + settleMs : 0;
	return {
		openMs,
		leadMs,
		totalFlyMs,
		afterTotalMs,
		pulseMs,
		flyMs,
		staggerMs,
		settleMs,
		holdMs,
		collapseMs,
		formulaMs: leadMs + totalFlyMs + afterTotalMs + watchesMs,
	};
};
