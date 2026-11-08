// The music's clock (2026-11-06): everything that wants to land ON the beat —
// the win lighting up reel by reel, the count-up bed, the plaque's pulse —
// reads the position of the running BGM from here.
//
// Sound.svelte owns the AudioContext and starts the BGM stems on an exact
// context time; it registers that here. The context clock is the only clock
// the audio actually follows (performance.now drifts against it and pauses
// differently), so positions are read from it directly.
//
// Nothing here makes a sound and nothing waits for audio: with the music not
// running (no gesture yet, Web Audio missing, tab hidden) every helper answers
// "no grid" and the callers carry on with their own timings.

type Clock = {
	ctx: AudioContext;
	// context time of the loop's first downbeat
	start: number;
	bpm: number;
};

let clock: Clock | null = null;

export const setMusicClock = (next: Clock | null) => {
	clock = next;
};

const running = () => (clock && clock.ctx.state === 'running' ? clock : null);

/** Context seconds the listener is hearing now (output latency removed). */
const heardNow = (c: Clock) => c.ctx.currentTime - ((c.ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0);

export const musicBpm = () => running()?.bpm ?? 120;

/** Milliseconds per subdivision: perBeat 4 = sixteenths. */
export const gridMs = (perBeat = 4) => 60000 / musicBpm() / perBeat;

/**
 * Milliseconds until the next subdivision of the running music. 0 without a
 * clock, and 0 when the grid is less than `snapMs` away (start now rather than
 * wait a whole step).
 */
export const msToNextGrid = (perBeat = 4, snapMs = 12) => {
	const c = running();
	if (!c) return 0;
	const step = 60 / c.bpm / perBeat;
	const t = c.ctx.currentTime - c.start;
	if (t < 0) return -t * 1000;
	const left = (step - (t % step)) * 1000;
	return left < snapMs || left > step * 1000 - snapMs ? 0 : left;
};

/**
 * Context time of the nearest upcoming subdivision if it is within `withinMs`,
 * otherwise `null` (play now). Used to snap a one-shot onto the grid.
 */
export const nextGridTime = (perBeat = 4, withinMs = 45): number | null => {
	const c = running();
	if (!c) return null;
	const step = 60 / c.bpm / perBeat;
	const t = c.ctx.currentTime - c.start;
	if (t < 0) return c.start;
	const left = step - (t % step);
	if (left * 1000 > withinMs) return null;
	return c.ctx.currentTime + left;
};

/**
 * Seconds since the last beat the listener heard, or -1 without music. For
 * visuals that pulse with the music.
 */
export const secondsSinceBeat = () => {
	const c = running();
	if (!c) return -1;
	const beat = 60 / c.bpm;
	const t = heardNow(c) - c.start;
	if (t < 0) return -1;
	return t % beat;
};

/**
 * Where the music is inside its bar, as a fraction 0..1, for starting a
 * one-bar loop in phase with it. -1 without music.
 */
export const barPhase = () => {
	const c = running();
	if (!c) return -1;
	const bar = (4 * 60) / c.bpm;
	const t = c.ctx.currentTime - c.start;
	if (t < 0) return 0;
	return (t % bar) / bar;
};
