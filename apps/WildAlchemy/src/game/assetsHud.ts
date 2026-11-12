// Wild Alchemy HUD / bet-bar / big-win art (design/build_hud_assets.py from
// new-games/wild-alchemy/art/game-ready-1110/keyed, a/b picks per its manifest).
// Merged into game/assets.ts. Background, board frame, logo and transitions
// live in assetsScene.ts, not here.

// Every URL is a string literal: Vite only rewrites `new URL(literal,
// import.meta.url)`; a template with a variable becomes a glob over src/ and
// resolves to undefined for files under assets/ (found 11-10: every key here
// logged "not found in the loadedAssets").

export default {
	// ── free-game HUD (LadderHud.svelte) ──────────────────────────────────────
	waFlaskBody: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/flask_body.png', import.meta.url).href, preload: true },
	waFlaskLiquid: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/flask_liquid.png', import.meta.url).href, preload: true },
	waFlaskFlame: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/flask_flame.png', import.meta.url).href, preload: true },
	waLadderUnlit: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/ladder_unlit.png', import.meta.url).href, preload: true },
	waLadderLit: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/ladder_lit.png', import.meta.url).href, preload: true },
	waLadderCurrent: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/ladder_current.png', import.meta.url).href, preload: true },
	waOrb: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/orb.png', import.meta.url).href, preload: true },
	waFireball: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/fireball.png', import.meta.url).href, preload: true },
	waFsCounter: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/fs_counter.png', import.meta.url).href, preload: true },
	// FG intro / outro card (FreeSpinAnimation.svelte)
	waPanel: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/panel.png', import.meta.url).href },

	// ── bet bar (uiTheme.ts sprites / icons) ──────────────────────────────────
	waUiBar: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/bar_plate.png', import.meta.url).href, preload: true },
	waUiBuy: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/buy_plate.png', import.meta.url).href, preload: true },
	waUiBuyLit: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/buy_plate_lit.png', import.meta.url).href, preload: true },
	waUiSpin: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/spin_plate.png', import.meta.url).href, preload: true },
	waUiButton: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/button_disc.png', import.meta.url).href, preload: true },
	waIconMenu: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_menu.png', import.meta.url).href, preload: true },
	waIconMenuExit: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_menuExit.png', import.meta.url).href, preload: true },
	waIconSettings: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_settings.png', import.meta.url).href, preload: true },
	waIconInfo: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_info.png', import.meta.url).href, preload: true },
	waIconPayTable: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_payTable.png', import.meta.url).href, preload: true },
	waIconSoundOn: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_soundOn.png', import.meta.url).href, preload: true },
	waIconSoundOff: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_soundOff.png', import.meta.url).href, preload: true },
	waIconAutoSpin: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_autoSpin.png', import.meta.url).href, preload: true },
	waIconIncrease: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_increase.png', import.meta.url).href, preload: true },
	waIconDecrease: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/icon_decrease.png', import.meta.url).href, preload: true },

	// ── big-win scenes (Win.svelte): BG plate, FG left/right, shared title ────
	waWinBigBg: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_big_bg.jpg', import.meta.url).href },
	waWinBigFgL: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_big_fg_l.png', import.meta.url).href },
	waWinBigFgR: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_big_fg_r.png', import.meta.url).href },
	waWinSuperBg: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_super_bg.jpg', import.meta.url).href },
	waWinSuperFgL: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_super_fg_l.png', import.meta.url).href },
	waWinSuperFgR: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_super_fg_r.png', import.meta.url).href },
	waWinMegaBg: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_mega_bg.jpg', import.meta.url).href },
	waWinMegaFgL: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_mega_fg_l.png', import.meta.url).href },
	waWinMegaFgR: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_mega_fg_r.png', import.meta.url).href },
	waWinEpicBg: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_epic_bg.jpg', import.meta.url).href },
	waWinEpicFgL: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_epic_fg_l.png', import.meta.url).href },
	waWinEpicFgR: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_epic_fg_r.png', import.meta.url).href },
	waWinTitlePlate: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemyHud/win_title_plate.png', import.meta.url).href, preload: true },
} as const;

/** Native sizes of the runtime sprites above, for aspect ratios. */
export const HUD_ART = {
	flaskBody: { w: 412, h: 623 },
	// flask_liquid sits at (11.5, 189.5) on the body (layout/hud.json
	// offset_from_body_top_left 23,379 at half scale); its meniscus is its own
	// top row, the body's aperture bottom is 1187-174=1013 → 506.5 on the body.
	flaskLiquid: { w: 381, h: 332, x: 11.5, y: 189.5 },
	flaskApertureBottom: 506.5,
	// the flame's flat neck (bottom centre) sits on the mouth: x 510-109=401 of
	// 824 → 0.4866 of the body's width, top edge y 0
	flaskMouthX: 0.4866,
	flame: { w: 360, h: 390 },
	// plaques 420x89: gem left, number field x 181..805 / y 31..144 of 835x177
	ladder: { w: 420, h: 89, fieldCx: 0.59, fieldW: 0.72, fieldH: 0.6 },
	orb: { w: 96, h: 99 },
	fireball: { w: 300, h: 174 },
	// fs counter 724x246: dark field x 253..1196 / y 87..396 of 1447x491
	fsCounter: { w: 724, h: 246, fieldW: 0.62, fieldH: 0.6, fieldCy: 0.49 },
	// card 1060x673: cream field 70..1337 / 74..821 of 1409x895
	panel: { w: 1060, h: 673, fieldW: 0.86, fieldH: 0.78 },
	// title plate 1078x361: cream field 388..1767 / 205..514 of 2156x722
	titlePlate: { w: 1078, h: 361, fieldW: 0.62, fieldH: 0.4 },
} as const;

/** Big-win FG pieces on the 1920x1080 scene (build_hud_assets.py output). */
export const WIN_SCENES = {
	big: { bg: 'waWinBigBg', l: 'waWinBigFgL', r: 'waWinBigFgR', fl: { x: 12, y: 65, w: 489, h: 928 }, fr: { x: 1418, y: 65, w: 489, h: 927 } },
	superwin: { bg: 'waWinSuperBg', l: 'waWinSuperFgL', r: 'waWinSuperFgR', fl: { x: 80, y: 45, w: 348, h: 959 }, fr: { x: 1491, y: 45, w: 349, h: 959 } },
	mega: { bg: 'waWinMegaBg', l: 'waWinMegaFgL', r: 'waWinMegaFgR', fl: { x: 35, y: 168, w: 525, h: 732 }, fr: { x: 1359, y: 167, w: 525, h: 733 } },
	epic: { bg: 'waWinEpicBg', l: 'waWinEpicFgL', r: 'waWinEpicFgR', fl: { x: 6, y: 130, w: 434, h: 782 }, fr: { x: 1481, y: 131, w: 431, h: 781 } },
} as const;
