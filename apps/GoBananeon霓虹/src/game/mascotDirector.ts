/** Occasional accents on top of the character's continuous club idle. */
export type MascotIdleGesture = 'glance' | 'nod' | 'dj_scratch';

export type MascotDirectorStatus = {
	/** False for manual art review, disabled sound/performance modes, etc. */
	enabled: boolean;
	visible: boolean;
	onStage: boolean;
	idle: boolean;
	boardSettled: boolean;
	winActive: boolean;
	modalOpen: boolean;
	/** Optional actual one-shot identity; distinguishes our gesture from an interruption. */
	activeGesture?: MascotIdleGesture | null;
};

export type MascotDirectorOptions = {
	/** Inject the random source; the director never reads global randomness. */
	random: () => number;
	/** Pass actual clip lengths when they differ from these conservative defaults. */
	durationMs?: Partial<Record<MascotIdleGesture, number>>;
};

const MINOR_RANGE = [8_000, 12_000] as const;
const DJ_RANGE = [24_000, 32_000] as const;
// A backgrounded RAF or a suspended caller must not bank time for a gesture.
const MAX_CLOCK_GAP_MS = 2_000;
const DEFAULT_DURATION: Record<MascotIdleGesture, number> = {
	glance: 1_200,
	nod: 1_000,
	dj_scratch: 3_200,
};

/**
 * Caller owns the clock and animation playback. Call tick with performance.now()
 * and current scene state; play a returned gesture once. No timers, DOM or audio.
 * stop() disables emissions; reset() re-enables with a fresh eligible cooldown.
 */
export class MascotIdleDirector {
	private readonly random: () => number;
	private readonly duration: Record<MascotIdleGesture, number>;
	private running = true;
	private lastNow: number | null = null;
	private minorAt: number | null = null;
	private djAt: number | null = null;
	private inFlight: { gesture: MascotIdleGesture; until: number } | null = null;

	constructor(options: MascotDirectorOptions) {
		this.random = options.random;
		this.duration = { ...DEFAULT_DURATION };
		for (const gesture of Object.keys(DEFAULT_DURATION) as MascotIdleGesture[]) {
			const value = options.durationMs?.[gesture];
			if (typeof value === 'number' && Number.isFinite(value) && value >= 100) {
				this.duration[gesture] = value;
			}
		}
	}

	private clearSchedule() {
		this.minorAt = null;
		this.djAt = null;
		this.inFlight = null;
	}

	private unitRandom() {
		try {
			const value = this.random();
			return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5;
		} catch {
			return 0.5;
		}
	}

	private delay(range: readonly [number, number]) {
		return range[0] + (range[1] - range[0]) * this.unitRandom();
	}

	reset() {
		this.running = true;
		this.clearSchedule();
	}

	stop() {
		this.running = false;
		this.clearSchedule();
	}

	tick(now: number, status: MascotDirectorStatus): MascotIdleGesture | null {
		if (!Number.isFinite(now) || now < 0 || now > Number.MAX_SAFE_INTEGER - DJ_RANGE[1] ||
			(this.lastNow !== null && now < this.lastNow)) {
			// Invalid/backward timestamps discard stale deadlines, never fast-forward.
			this.clearSchedule();
			return null;
		}
		const gap = this.lastNow === null ? 0 : now - this.lastNow;
		this.lastNow = now;
		if (!this.running) return null;
		if (gap > MAX_CLOCK_GAP_MS) this.clearSchedule();

		const sceneReady = status.enabled && status.visible && status.onStage &&
			status.boardSettled && !status.winActive && !status.modalOpen;
		if (!sceneReady) {
			this.clearSchedule();
			return null;
		}

		if (this.inFlight) {
			const { gesture, until } = this.inFlight;
			// If the caller supplies identity, an unrelated busy animation is an
			// interruption. Our own small glance/nod preserves the independent DJ
			// deadline, so common minor accents cannot postpone DJ forever.
			if (!status.idle && status.activeGesture !== undefined && status.activeGesture !== gesture) {
				this.clearSchedule();
				return null;
			}
			if (now < until || status.activeGesture === gesture) return null;
			this.inFlight = null;
		}
		if (!status.idle) {
			this.clearSchedule();
			return null;
		}

		if (this.minorAt === null || this.djAt === null) {
			this.minorAt = now + this.delay(MINOR_RANGE);
			this.djAt = now + this.delay(DJ_RANGE);
			return null;
		}

		let gesture: MascotIdleGesture;
		// A due DJ wins when both deadlines coincide. It does not queue behind a
		// stream of cheaper gestures; at most one accent can be returned per tick.
		if (now >= this.djAt) {
			gesture = 'dj_scratch';
			const scheduledAt = this.djAt;
			this.djAt = scheduledAt + this.delay(DJ_RANGE);
			this.minorAt = scheduledAt + this.delay(MINOR_RANGE);
		} else if (now >= this.minorAt) {
			gesture = this.unitRandom() < 0.5 ? 'glance' : 'nod';
			const scheduledAt = this.minorAt;
			this.minorAt = scheduledAt + this.delay(MINOR_RANGE);
			// Leave the upcoming full performance its own space rather than
			// starting a small accent that would overrun the DJ deadline.
			if (this.djAt - now < this.duration[gesture] + 200) return null;
		} else {
			return null;
		}
		this.inFlight = { gesture, until: now + this.duration[gesture] };
		return gesture;
	}
}
