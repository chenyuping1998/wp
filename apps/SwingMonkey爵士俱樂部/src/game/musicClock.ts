// The band's clock (2026-11-06, user: 「動畫跟音效節奏方面要更強」).
//
// Everything that should land WITH the band — the reels landing on chord
// tones, the win lighting up reel by reel, the instruments on the H1–H4
// symbols playing their notes, the big-win tiers, the count-up, the mascot's
// sway — reads the running BGM's position from here.
//
// Sound.svelte owns the AudioContext, starts the two BGM stems on an exact
// context time and registers it here. The context clock is the one the audio
// follows (performance.now drifts against it and pauses differently), so
// positions are read from it; `heardPerf` converts a context time into the
// performance.now() at which the listener HEARS it, for the visuals.
//
// Nothing here makes a sound and nothing waits for audio: with the music not
// running (no gesture yet, Web Audio missing, tab hidden) every helper answers
// "no grid" and the callers keep their own timings.
//
// The chord table is the one design/generate_swing_audio_v2.py writes the
// tune on; design/check_swing_music.mjs fails the build if they differ.

type Clock = {
	ctx: AudioContext;
	/** context time of the loop's first downbeat */
	start: number;
	bpm: number;
	/** where the off-beat eighth falls inside the beat (0.5 = straight) */
	swing: number;
};

let clock: Clock | null = null;

export const setMusicClock = (next: Clock | null) => {
	clock = next;
};

const running = () => (clock && clock.ctx.state === 'running' ? clock : null);
const latency = (c: Clock) =>
	((c.ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0) + (c.ctx.baseLatency ?? 0);

export const musicLive = () => !!running();
export const musicBpm = () => running()?.bpm ?? 128;
export const musicSwing = () => running()?.swing ?? 0.64;
export const beatMs = () => 60000 / musicBpm();

/** Milliseconds per subdivision: perBeat 4 = sixteenths. */
export const gridMs = (perBeat = 4) => 60000 / musicBpm() / perBeat;

/** The context's current time, or -1 without music. */
export const ctxNow = () => running()?.ctx.currentTime ?? -1;

/** performance.now() at which a sound scheduled at context time `t` is heard. */
export const heardPerf = (t: number) => {
	const c = running();
	if (!c) return performance.now();
	return performance.now() + (t + latency(c) - c.ctx.currentTime) * 1000;
};

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

/** Context time of the first beat (quarter note) at or after context time `from`. */
export const beatAtOrAfter = (from: number): number | null => {
	const c = running();
	if (!c) return null;
	const beat = 60 / c.bpm;
	const k = Math.ceil((from - c.start) / beat - 1e-6);
	return c.start + Math.max(0, k) * beat;
};

/**
 * Seconds since the last beat the listener heard, or -1 without music. For
 * visuals that pulse with the band.
 */
export const secondsSinceBeat = () => {
	const c = running();
	if (!c) return -1;
	const beat = 60 / c.bpm;
	const t = c.ctx.currentTime - latency(c) - c.start;
	if (t < 0) return -1;
	return t % beat;
};

/** Beats heard since the loop's first downbeat (fractional), or -1 without music. */
export const beatsHeard = () => {
	const c = running();
	if (!c) return -1;
	const t = c.ctx.currentTime - latency(c) - c.start;
	return t < 0 ? -1 : t / (60 / c.bpm);
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

// ─── harmony ────────────────────────────────────────────────────────────────

export type Quality = 'maj6' | 'dom7' | 'min7' | 'min6';
export const QUALITY: Record<Quality, readonly number[]> = {
	maj6: [0, 4, 7, 9],
	dom7: [0, 4, 7, 10],
	min7: [0, 3, 7, 10],
	min6: [0, 3, 7, 9],
};
/** one chord per bar of the 16-bar tune: [root pitch class above F, quality] */
export const CHORDS: readonly (readonly [number, Quality])[] = [
	[0, 'maj6'], [9, 'dom7'], [2, 'min7'], [7, 'dom7'],
	[0, 'maj6'], [9, 'dom7'], [2, 'min7'], [7, 'dom7'],
	[0, 'dom7'], [5, 'maj6'], [5, 'min6'], [0, 'maj6'],
	[9, 'dom7'], [2, 'dom7'], [7, 'dom7'], [0, 'maj6'],
];

/** The chord the band plays at context time `at` (now by default); F6 without music. */
export const chordAt = (at?: number): { root: number; quality: Quality } => {
	const c = running();
	if (!c) return { root: 0, quality: 'maj6' };
	const bar = (4 * 60) / c.bpm;
	const t = (at ?? c.ctx.currentTime) - c.start;
	const index = ((Math.floor(t / bar) % CHORDS.length) + CHORDS.length) % CHORDS.length;
	const [root, quality] = CHORDS[index];
	return { root, quality };
};

/**
 * Semitones from F for the idx-th chord tone counting up from the root
 * (root, third, fifth, sixth/seventh, root an octave up, …). The root is
 * taken in the octave nearest F, so a sample tuned to F stays within about a
 * fourth of its own pitch on the first tone.
 */
export const chordToneSemis = (idx: number, at?: number) => {
	const { root, quality } = chordAt(at);
	const r = root > 6 ? root - 12 : root;
	const tones = QUALITY[quality];
	const i = Math.max(0, idx);
	return r + tones[i % tones.length] + 12 * Math.floor(i / tones.length);
};

/** playbackRate for a sample tuned to F, landing on chord tone idx. */
export const chordToneRate = (idx: number, at?: number) => 2 ** (chordToneSemis(idx, at) / 12);

/** playbackRate that moves an F-rooted sample to the chord's root (nearest octave). */
export const chordRootRate = (at?: number) => {
	const { root } = chordAt(at);
	return 2 ** ((root > 6 ? root - 12 : root) / 12);
};
