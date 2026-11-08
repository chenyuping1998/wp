/**
 * The music's beat, for everything that wants to land ON it (2026-11-06, user:
 * 「動畫跟音效節奏方面要更強」).
 *
 * Both beds are 16 bars of 4/4 cut to the sample (sampledAudioLoops.json:
 * 128 BPM base, 154 BPM feature), so once a bed starts its grid is known for as
 * long as it loops. Sound.svelte publishes the AudioContext clock and the moment
 * the bed started; the win wake, the landing clinks and the tier fanfares read
 * the grid from here so the picture and the cues fall on the same sixteenths as
 * the drums.
 *
 * The grid is read off the AUDIO clock, not performance.now(): the two drift
 * apart by a few ms a minute, and a bed loops for as long as a session lasts.
 * Visuals and cues are both started from JS at the same instant, so they share
 * the same output latency and stay together without correcting for it.
 *
 * No bed (sound never unlocked, or between beds) -> every wait is 0 and
 * nothing is delayed; the grid is a nicety, never a gate.
 */
type Clock = { now: () => number; anchor: number; bpm: number };

let clock: Clock | null = null;

export const setBeatClock = (next: Clock | null) => {
	clock = next;
};

/** the bed's tempo, or the base game's when none is playing */
export const beatBpm = () => clock?.bpm ?? 128;

/** ms per beat / per sixteenth at the current tempo */
export const beatMs = () => 60000 / beatBpm();
export const sixteenthMs = () => beatMs() / 4;

/** how far into the current beat, 0..1 (0 when no bed is running) */
export const beatPhase = (division = 1) => {
	if (!clock) return 0;
	const period = 60 / clock.bpm / division;
	const t = clock.now() - clock.anchor;
	return t <= 0 ? 0 : (t % period) / period;
};

/** beats since the bed started (fractional), or -1 with no bed */
export const beatsElapsed = () => {
	if (!clock) return -1;
	return Math.max(0, (clock.now() - clock.anchor) * (clock.bpm / 60));
};

/**
 * ms until the next grid line of `division` per beat (4 = sixteenths).
 * A line closer than `slack` ms is taken as "now" rather than waiting a whole
 * step for the next one.
 */
export const msToGrid = (division = 4, slack = 18) => {
	if (!clock) return 0;
	const period = 60000 / clock.bpm / division;
	const into = ((clock.now() - clock.anchor) * 1000) % period;
	const left = into < 0 ? -into : period - into;
	return left <= slack || period - left <= slack ? 0 : left;
};
