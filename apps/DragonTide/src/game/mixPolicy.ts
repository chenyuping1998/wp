/**
 * How Dragon Tide's sounds share the mix when many fire at once (Stone 2026-11-10: the music, the
 * reel stops and the clears blur together).
 *
 * Measured on the delivery-v1 files: the music bed sits mostly at 200-600 Hz and 600 Hz-2 kHz, the
 * sea / hall ambience at 600 Hz-2 kHz, and the score, pearl and reel-stop sounds at 600 Hz-2 kHz too,
 * so they cover each other. The fix makes room by role, while a sound rings:
 *   - hero beats (score, burst, cast, pearls, gate, feature stings) dip the music's low-mids and
 *     mids, pull the ambience back, and push the small ticks under them;
 *   - character voices do the same and thin the effects' lows (the cast rumble shares their band);
 *   - ticks (reel stops, refill landings, clicks) dip the music's mids a little;
 *   - the music's low-mids and mids also sit a little lower all the time;
 * and a few sounds that come in bursts keep only their newest copies ringing.
 * Measurement tool and before/after numbers: new-games/sea-dragon/qa-1110/mixlab/.
 */

/** A hero beat, a voice, a tick, or a sound that does no ducking (the big win has its own). */
export type MixClass = 'hero' | 'voice' | 'tick' | 'none';

export const mixClass = (cue: string): MixClass => {
	if (cue.startsWith('vo_')) return 'voice';
	if (/^sfx_bigwin_(loop|count)/.test(cue) || cue === 'sfx_gate_tease') return 'none';
	if (/^sfx_(reel_stop|refill|board_out|pearl_fly|spin_press|button|menu_|buy_hover)/.test(cue)) return 'tick';
	return 'hero';
};

/** How long a sound of each class holds the ducking, at most (a voice holds for its whole line). */
export const DUCK_HOLD_S: Record<Exclude<MixClass, 'none'>, number> = { hero: 0.8, voice: 9, tick: 0.2 };
/** Time constants (setTargetAtTime) going down and coming back. */
export const DUCK_ATTACK_S = 0.015;
export const DUCK_RELEASE_S = 0.18;

export type DuckTarget = 'musicLowMid' | 'musicMid' | 'musicGain' | 'ambienceGain' | 'tickGain' | 'effectsLow';
/**
 * dB each stage sits at: `idle` when nothing rings, otherwise the deepest value of the classes
 * ringing. The music's two bells also cut a little all the time (idle), so the swings stay small:
 * at most 4-5 dB in the bells and 1.5 dB overall, which keeps the bed from pumping on every beat.
 */
export const DUCK_DB: Record<DuckTarget, Partial<Record<MixClass, number>> & { idle?: number; release?: number }> = {
	musicLowMid: { idle: -3, hero: -7, voice: -7, tick: -4 },
	musicMid: { idle: -2, hero: -7, voice: -5, tick: -4 },
	musicGain: { hero: -1.5, voice: -1.5 },
	ambienceGain: { hero: -8, voice: -6, tick: -3, release: 0.4 },
	tickGain: { hero: -6, voice: -4 },
	effectsLow: { voice: -6 },
};
/** Stage filters: music low-mid and mid bells, the effects' low shelf. */
export const MUSIC_LOW_MID = { frequency: 320, q: 0.8 };
export const MUSIC_MID = { frequency: 1100, q: 0.7 };
export const EFFECTS_LOW_SHELF_HZ = 220;
/** The ambience always sits 3 dB lower in the band the beats speak in. */
export const AMBIENCE_MID_CUT = { frequency: 1200, q: 0.7, gain: -3 };

/** Bursts: at most this many copies ring at once; the oldest gives way in 40 ms. */
export const CUE_CAP: Record<string, number> = {
	sfx_reel_stop: 3,
	sfx_pearl_show: 2,
	sfx_refill: 1,
	sfx_strike: 2,
	sfx_pearl_fly: 3,
	sfx_gate_land: 2,
	sfx_pearl_lit_s: 2,
	sfx_pearl_lit_m: 2,
	sfx_pearl_lit_l: 2,
	sfx_quake: 2,
	sfx_quake_top: 2,
};
export const CAP_FADE_S = 0.04;
