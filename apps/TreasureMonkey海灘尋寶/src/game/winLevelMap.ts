import { SECOND } from 'constants-shared/time';

// ── 2026-08-25: the whole ladder re-timed against a shipped Hacksaw game ─────
//
// The user supplied a reverse-engineered performance spec for Hacksaw's "The
// Luxe" (gameId 1897, timings read out of its own bundle). Its win presentation
// is an eight-step lookup on the win multiple, and two things in it are nothing
// like what this game was doing:
//
//   · EVERYTHING UNDER 10x COSTS ZERO PRESENT TIME. In their own 4,040-hand
//     recording, 98.1% of hands land in that tier. The symbol animation plays
//     and the round moves on. Hot Miami was spending 0.6s to 2.0s of count-up on
//     every win up to 15x, which is most wins in any session — a second of dead
//     time, several times a minute, forever.
//   · THEIR BIG WINS ARE SHORT. 1.8s for BIG, 3.6s for MEGA, 7s for EPIC.
//     Hot Miami had 6s / 20s / 26s, and 32s for a max win. Three to five times
//     longer than the game the reviewers passed.
//
// A reviewer spins for a few minutes. What they feel is the density of that
// session, and ours was padded at both ends: a slow tick on every small win and
// a presentation that would not let go on a big one. That is a pacing fault,
// and it is one of the few things a canned "poor animation" tag can be pointing
// at that is not about the drawing.
//
// The bands are ours (the maths assigns winLevel 1-10, see
// math-sdk/src/config/config.py get_win_level); the DURATIONS are theirs,
// mapped onto our bands by multiple:
//
//     level 1-5   0-15x     0ms      no count-up at all
//     level 6     15-30x    1800ms   BIG WIN
//     level 7     30-50x    3600ms   SUPER WIN
//     level 8     50-100x   3600ms   MEGA WIN
//     level 9     100x-cap  7000ms   EPIC WIN
//     level 10    20000x    9000ms   MAX WIN
//
// Level 10 is the one place this deliberately departs from them: they have no
// separate max-win tier, and a 20,000x cap that ends the round is worth more
// than the tier below it. 9s is still under a third of what it was.
//
// What does NOT change is the symbol animation. A zero here means the count-up
// takes no time, not that nothing happens: SymbolWinAnim still holds the cell
// for HOLD_MS and the win lines still run. Their spec makes the same point —
// the 0ms tier is floored at the 970ms symbol animation.

// Levels 2-5 carried `sfx: undefined`, so a 0.3x win and a 4.9x win were
// acoustically identical — the visual ladder stepped (0.6 / 1.0 / 1.5 / 2.0s of
// present time) and nothing told the ear. They now step too, as a two-stage
// ladder: win_gliss pitched up for the two small rungs, then win_gliss_big
// pitched up for the two medium ones, each louder than the last. The pitch/
// volume per name lives in Sound.svelte's SPRITE_TO_CN, which is the same idiom
// the five reel-stop clicks already use.
//
// `bgm` stays undefined on every level and that is deliberate — see the comment
// at bookEventHandlerMap.ts:49-58. Its reasoning is about the bgm bed being torn
// down by a track that does not exist; it says nothing about sfx.
//
// Level 3 is `sfx_multiplier_win` rather than the alias-matching
// `sfx_winlevel_small` on purpose: bookEventHandlerMap.ts:118 already fires
// `sfx_winlevel_small` unconditionally on every winInfo as the "a line paid"
// tick, so reusing it here would make level 3 the only rung whose stinger is
// the sound the player just heard. Every name used is in SoundEffectName
// (game/sound.ts) and mapped into the Miami set in Sound.svelte.
export const winLevelMap = {
	1: {
		level: 1,
		alias: 'zero',
		type: 'small',
		text: null,
		presentDuration: 0,
		sound: { sfx: undefined, bgm: undefined },
		animation: undefined,
	},
	2: {
		level: 2,
		alias: 'standard',
		type: 'small',
		text: null,
		presentDuration: 0,
		sound: { sfx: 'sfx_winlevel_standard', bgm: undefined },
		animation: undefined,
	},
	3: {
		level: 3,
		alias: 'small',
		type: 'small',
		text: null,
		presentDuration: 0,
		sound: { sfx: 'sfx_multiplier_win', bgm: undefined },
		animation: undefined,
	},
	4: {
		level: 4,
		alias: 'nice',
		type: 'medium',
		text: null,
		presentDuration: 0,
		sound: { sfx: 'sfx_winlevel_nice', bgm: undefined },
		animation: undefined,
	},
	5: {
		level: 5,
		alias: 'substantial',
		type: 'medium',
		text: null,
		presentDuration: 0,
		sound: { sfx: 'sfx_winlevel_substantial', bgm: undefined },
		animation: undefined,
	},
	6: {
		level: 6,
		alias: 'big',
		type: 'big',
		text: 'BIG WIN',
		presentDuration: 1.8 * SECOND,
		sound: { sfx: 'sfx_winlevel_big', bgm: 'bgm_winlevel_big' },
		animation: { intro: 'big_win_intro', idle: 'big_win_idle', outro: 'big_win_exit' },
	},
	7: {
		level: 7,
		alias: 'superwin',
		type: 'big',
		text: 'SUPER WIN',
		presentDuration: 3.6 * SECOND,
		sound: { sfx: 'sfx_winlevel_superwin', bgm: 'bgm_winlevel_superwin' },
		animation: { intro: 'super_win_intro', idle: 'super_win_idle', outro: 'super_win_exit' },
	},
	8: {
		level: 8,
		alias: 'mega',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: 3.6 * SECOND,
		sound: { sfx: 'sfx_winlevel_mega', bgm: 'bgm_winlevel_mega' },
		animation: { intro: 'mega_win_intro', idle: 'mega_win_idle', outro: 'mega_win_exit' },
	},
	9: {
		level: 9,
		alias: 'epic',
		type: 'big',
		text: 'EPIC WIN!',
		presentDuration: 7 * SECOND,
		sound: { sfx: 'sfx_winlevel_epic', bgm: 'bgm_winlevel_epic' },
		animation: { intro: 'epic_win_intro', idle: 'epic_win_idle', outro: 'epic_win_exit' },
	},
	10: {
		level: 10,
		alias: 'max',
		type: 'big',
		text: 'MAX WIN',
		presentDuration: 9 * SECOND,
		sound: { sfx: 'sfx_winlevel_max', bgm: 'bgm_winlevel_max' },
		animation: { intro: 'max_win_intro', idle: 'max_win_idle', outro: 'max_win_exit' },
	},
} as const;

export type WinLevelMap = typeof winLevelMap;
export type WinLevel = keyof typeof winLevelMap;
export type WinLevelData = WinLevelMap[WinLevel];
export type WinLevelAlias = WinLevelData['alias'];
