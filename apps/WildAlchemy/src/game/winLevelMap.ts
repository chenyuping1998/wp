import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { SECOND } from 'constants-shared/time';

// Five levels from the math (game_config.get_win_level, SPEC §2.7): the shared
// big-win thresholds of the reference family, in bet multiples.
//
//     level 1   < 25x      no banner, no count-up
//     level 2   25-50x     BIG WIN
//     level 3   50-100x    SUPER WIN
//     level 4   100-200x   MEGA WIN
//     level 5   >= 200x    EPIC WIN
//     max       = cap      MAX WIN (frontend-only: level 5 whose amount is the cap)
//
// Every banner level runs In 1.17 s / Loop 1.17 s / Out 1.0 s and may upgrade
// to the next level during its In (REF_TIMING.bigWin). presentDuration is the
// count-up span the shared WinCountUpProvider uses: In + Loop.
const BANNER_PRESENT = (1.17 + 1.17) * SECOND;

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
		alias: 'big',
		type: 'big',
		text: 'BIG WIN',
		presentDuration: BANNER_PRESENT,
		sound: { sfx: 'sfx_winlevel_big', bgm: 'bgm_winlevel_big' },
		animation: { intro: 'big_win_intro', idle: 'big_win_idle', outro: 'big_win_exit' },
	},
	3: {
		level: 3,
		alias: 'superwin',
		type: 'big',
		text: 'SUPER WIN',
		presentDuration: BANNER_PRESENT,
		sound: { sfx: 'sfx_winlevel_superwin', bgm: 'bgm_winlevel_superwin' },
		animation: { intro: 'super_win_intro', idle: 'super_win_idle', outro: 'super_win_exit' },
	},
	4: {
		level: 4,
		alias: 'mega',
		type: 'big',
		text: 'MEGA WIN',
		presentDuration: BANNER_PRESENT,
		sound: { sfx: 'sfx_winlevel_mega', bgm: 'bgm_winlevel_mega' },
		animation: { intro: 'mega_win_intro', idle: 'mega_win_idle', outro: 'mega_win_exit' },
	},
	5: {
		level: 5,
		alias: 'epic',
		type: 'big',
		text: 'EPIC WIN!',
		presentDuration: BANNER_PRESENT,
		sound: { sfx: 'sfx_winlevel_epic', bgm: 'bgm_winlevel_epic' },
		animation: { intro: 'epic_win_intro', idle: 'epic_win_idle', outro: 'epic_win_exit' },
	},
	6: {
		level: 6,
		alias: 'max',
		type: 'big',
		text: 'MAX WIN',
		presentDuration: BANNER_PRESENT,
		sound: { sfx: 'sfx_winlevel_max', bgm: 'bgm_winlevel_max' },
		animation: { intro: 'max_win_intro', idle: 'max_win_idle', outro: 'max_win_exit' },
	},
} as const;

export type WinLevelMap = typeof winLevelMap;
export type WinLevel = keyof typeof winLevelMap;
export type WinLevelData = WinLevelMap[WinLevel];
export type WinLevelAlias = WinLevelData['alias'];

/** The max-win cap in bet multiples (config.betModes[*].max_win is the same for every mode). */
export const MAX_WIN_MULTIPLE = 20000;

/**
 * A level-5 win that reaches the cap is MAX WIN. The math only emits 1-5, so
 * the frontend promotes it from the amount — the same test the reference
 * family makes on its own top banner.
 */
export const withMaxWin = (winLevelData: WinLevelData, bookEventAmount: number): WinLevelData =>
	winLevelData?.level === 5 && bookEventAmount / BOOK_AMOUNT_MULTIPLIER >= MAX_WIN_MULTIPLE
		? winLevelMap[6]
		: winLevelData;

/** Kept for callers that used the old 10x rung; this game has no count-up under BIG. */
export const withTenXRung = (winLevelData: WinLevelData, _bookEventAmount: number): WinLevelData =>
	winLevelData;
