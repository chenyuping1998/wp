/**
 * THE MUSIC'S GRID — one clock for everything that should move or sound WITH
 * the club track instead of next to it.
 *
 * Before this, the background ran its own 105/128 BPM sine from a frame clock,
 * the mascot ran club_idle at 105/125 timeScale from wherever its track
 * happened to start, and the rollup / tension beds were 2-second loops at
 * 120 BPM. All four were "at a tempo", none of them were ON the beat that the
 * player hears: they drifted through it, and the beds argued with it.
 *
 * Sound.svelte anchors this to the moment the BGM buffer actually starts on the
 * audio clock (mapped to performance.now through getOutputTimestamp, so output
 * latency is included) and re-anchors every few seconds. Everything visual
 * reads musicAt(performance.now()).
 *
 * The constants mirror design/build_neon_audio_v3.py music(): change one,
 * change both. Pure, no Pixi/DOM: design/check_beat_clock.mjs runs it offline.
 */
export type MusicScene = 'base' | 'freespin';

/** kick positions in beats within one 4/4 bar */
export const MUSIC_GRID = {
	// half-time-ish street groove: kick on 1, the "and" of 2, 3, and a push before 4's end
	base: { bpm: 105, kicks: [0, 1.5, 2, 3.25] },
	// rooftop: four on the floor
	freespin: { bpm: 128, kicks: [0, 1, 2, 3] },
} as const;
export const LOOP_BARS = 16;

/** Cm9 / Abmaj7 / Ebmaj7 / Bb6, two bars each — the voicing the pads play. */
export const CHORD_ROOTS = [48, 44, 51, 46] as const;
export const chordAt = (bar: number): [number, number, number, number] => {
	const root = CHORD_ROOTS[((Math.floor(bar / 2) % 4) + 4) % 4];
	return [root + 12, root + (root === 48 ? 15 : 16), root + 19, root + 22];
};

/** kick steps (16ths) per bar, derived from MUSIC_GRID so both stay together */
export const kickSteps = (scene: MusicScene) => MUSIC_GRID[scene].kicks.map((k) => Math.round(k * 4));

type Anchor = { scene: MusicScene; startMs: number };
let anchor: Anchor | null = null;
/** startMs: performance.now() at which beat 0 of the loop is HEARD */
export const setMusicAnchor = (scene: MusicScene, startMs: number) => {
	anchor = { scene, startMs };
};
export const clearMusicAnchor = () => {
	anchor = null;
};
export const musicAnchor = () => anchor;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
	const k = clamp01(v);
	return k * k * (3 - 2 * k);
};

/**
 * A drum hit as light: a very short rise (not a one-frame strobe) and an
 * exponential fall. Exactly 0 before the hit, so nothing leads the sound.
 */
export const pulse = (ageMs: number, attackMs = 16, decayMs = 150) =>
	ageMs < 0 || !Number.isFinite(ageMs) ? 0 : ageMs < attackMs ? smooth(ageMs / attackMs) : Math.exp(-(ageMs - attackMs) / decayMs);

export type MusicState = {
	scene: MusicScene;
	bpm: number;
	beatMs: number;
	/** beats since the loop start, 0..64 */
	beats: number;
	bar: number;
	/** 0..4 within the bar */
	barBeat: number;
	/** 0..1 within the beat */
	phase: number;
	/** ms since the last kick the drummer actually played */
	sinceKickMs: number;
	/** 0..1 kick envelope */
	kick: number;
	/** 0..1 on every quarter note */
	beatPulse: number;
	/** 0..1, longer, on beat 1 of each bar */
	downbeat: number;
	/** false = no music anchor, a free-running grid at the scene's tempo */
	live: boolean;
};

export const musicAt = (nowMs: number, fallbackScene: MusicScene = 'base', a: Anchor | null = anchor): MusicState => {
	const scene = a?.scene ?? fallbackScene;
	const { bpm, kicks } = MUSIC_GRID[scene];
	const beatMs = 60000 / bpm;
	const loopBeats = LOOP_BARS * 4;
	const raw = (nowMs - (a?.startMs ?? 0)) / beatMs;
	const beats = ((raw % loopBeats) + loopBeats) % loopBeats;
	const bar = Math.floor(beats / 4);
	const barBeat = beats - bar * 4;
	let last = kicks[kicks.length - 1] - 4; // wraps into the previous bar
	for (const k of kicks) if (k <= barBeat) last = k;
	const sinceKickMs = (barBeat - last) * beatMs;
	const phase = beats - Math.floor(beats);
	return {
		scene,
		bpm,
		beatMs,
		beats,
		bar,
		barBeat,
		phase,
		sinceKickMs,
		kick: pulse(sinceKickMs),
		beatPulse: pulse(phase * beatMs, 14, 120),
		downbeat: pulse(barBeat * beatMs, 20, 300),
		live: a !== null,
	};
};
