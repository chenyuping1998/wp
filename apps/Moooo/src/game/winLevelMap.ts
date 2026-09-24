import { SECOND } from 'constants-shared/time';

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
// ── Countup ladder, rescaled against Densho (2026-08-26) ────────────────────
//
// It used to run 6 / 18 / 20 / 26 / 32s across the five big tiers. The 6 -> 18
// step is the tell: BIG (15x) and SUPER (30x) are ADJACENT rungs one doubling
// apart in money, and the presentation tripled in length between them. A 30x win
// held the screen for eighteen seconds.
//
// Densho's eight-tier table spends 1.5 / 1.8 / 3.6 / 3.6 / 7.0s and covers a
// 10x-to-250x range doing it. Its ratios, not its numbers, are what transfer:
// each rung is worth roughly 1x / 2x / 2x / 4x the first countup tier, and the
// climb is smooth. Moooo's payout range is far wider (15x to the 10,000x cap),
// so the top rung keeps a real celebration - but the shape is Densho's.
//
// The small rungs (0.6 / 1 / 1.5 / 2s) are deliberately untouched. Densho gives
// everything under 10x a countup of ZERO and covers the acknowledgement with its
// 0.5s presentDelay instead; Moooo now has that delay too (bookEventHandlerMap's
// PRESENT_DELAY), but its small rungs also carry the only sound cue those wins
// get, so zeroing them would take the stinger with them.
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
		presentDuration: 0.6 * SECOND,
		sound: { sfx: 'sfx_winlevel_standard', bgm: undefined },
		animation: undefined,
	},
	3: {
		level: 3,
		alias: 'small',
		type: 'small',
		text: null,
		presentDuration: 1 * SECOND,
		sound: { sfx: 'sfx_multiplier_win', bgm: undefined },
		animation: undefined,
	},
	4: {
		level: 4,
		alias: 'nice',
		type: 'medium',
		text: null,
		presentDuration: 1.5 * SECOND,
		sound: { sfx: 'sfx_winlevel_nice', bgm: undefined },
		animation: undefined,
	},
	5: {
		level: 5,
		alias: 'substantial',
		type: 'medium',
		text: null,
		presentDuration: 2.0 * SECOND,
		sound: { sfx: 'sfx_winlevel_substantial', bgm: undefined },
		animation: undefined,
	},
	6: {
		level: 6,
		alias: 'big',
		type: 'big',
		text: 'BIG WIN',
		presentDuration: 2.5 * SECOND,
		sound: { sfx: undefined, bgm: 'bgm_winlevel_big' },
		animation: { intro: 'big_win_intro', idle: 'big_win_idle', outro: 'big_win_exit' },
	},
	7: {
		level: 7,
		alias: 'superwin',
		type: 'big',
		text: 'SUPER WIN',
		presentDuration: 3.0 * SECOND,
		sound: { sfx: undefined, bgm: 'bgm_winlevel_superwin' },
		animation: { intro: 'super_win_intro', idle: 'super_win_idle', outro: 'super_win_exit' },
	},
	8: {
		level: 8,
		alias: 'mega',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: 4.5 * SECOND,
		sound: { sfx: undefined, bgm: 'bgm_winlevel_mega' },
		animation: { intro: 'mega_win_intro', idle: 'mega_win_idle', outro: 'mega_win_exit' },
	},
	9: {
		level: 9,
		alias: 'epic',
		type: 'big',
		text: 'EPIC WIN!',
		presentDuration: 7.0 * SECOND,
		sound: { sfx: undefined, bgm: 'bgm_winlevel_epic' },
		animation: { intro: 'epic_win_intro', idle: 'epic_win_idle', outro: 'epic_win_exit' },
	},
	10: {
		level: 10,
		alias: 'max',
		type: 'big',
		text: 'MAX WIN',
		presentDuration: 12.0 * SECOND,
		sound: { sfx: undefined, bgm: 'bgm_winlevel_max' },
		animation: { intro: 'max_win_intro', idle: 'max_win_idle', outro: 'max_win_exit' },
	},
} as const;

export type WinLevelMap = typeof winLevelMap;
export type WinLevel = keyof typeof winLevelMap;
export type WinLevelData = WinLevelMap[WinLevel];
export type WinLevelAlias = WinLevelData['alias'];
