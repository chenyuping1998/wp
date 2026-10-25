// Static assets are served from static/assets, beside the uploaded game shell.
import { asset } from './runtimeAsset';

﻿export default {
	// jungle-military riveted reel frame (SVG-generated ??see design/generate_theme_jungle.mjs)
	hmFrameBg: {
		type: 'sprite',
		src: asset('treasure/frame_bg.png'),
		preload: true,
	},
	hmFrameEdge: {
		type: 'sprite',
		src: asset('treasure/frame_edge.png'),
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: asset('sprites/capoFx/fx_glow.png'),
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: asset('sprites/capoFx/fx_star.png'),
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: asset('sprites/capoFx/fx_streak.png'),
		preload: true,
	},
	fxLeaf: {
		type: 'sprite',
		src: asset('sprites/capoFx/fx_leaf.png'),
		preload: true,
	},
	// Side-profile car for the scene transition (design/build_transition_car.py).
	// The car SYMBOL is three-quarter front-on — the angle that reads in a reel
	// cell — and slid sideways it looks like a car pointing at you being dragged.
	fxVignette: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	hmUiTicker: {
		type: 'sprite',
		src: asset('treasure/ticker.png'),
		preload: true,
	},
	hmUiBuyBonus: {
		type: 'sprite',
		src: asset('treasure/buybonus.png'),
		preload: true,
	},
	capoUiButton: {
		type: 'sprite',
		src: asset('treasure/button.png'),
		preload: true,
	},
	capoUiSpin: {
		type: 'sprite',
		src: asset('treasure/spin.png'),
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	hmWinBannerBig: {
		type: 'sprite',
		src: asset('treasure/win_big.png'),
	},
	hmWinBannerSuperwin: {
		type: 'sprite',
		src: asset('treasure/win_superwin.png'),
	},
	hmWinBannerMega: {
		type: 'sprite',
		src: asset('treasure/win_mega.png'),
	},
	hmWinBannerEpic: {
		type: 'sprite',
		src: asset('treasure/win_epic.png'),
	},
	hmWinBannerMax: {
		type: 'sprite',
		src: asset('treasure/win_max.png'),
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	hmFsSign: {
		type: 'sprite',
		src: asset('treasure/fs_sign.png'),
	},
	hmFsPanel: {
		type: 'sprite',
		src: asset('treasure/fs_panel.png'),
	},
	// Hot Miami symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	hmH1: {
		type: 'sprite',
		src: asset('treasure/h1.png'),
		preload: true,
	},
	hmH2: {
		type: 'sprite',
		src: asset('treasure/h2.png'),
		preload: true,
	},
	hmH3: {
		type: 'sprite',
		src: asset('treasure/h3.png'),
		preload: true,
	},
	hmH4: {
		type: 'sprite',
		src: asset('treasure/h4.png'),
		preload: true,
	},
	// 切片符號的零件（`sprites/hotMiamiParts/`）在 2026-09-20 連圖帶條目一起刪掉。
	//
	// 那套 rig 早就停用了——零件的圖畫的是 Hot Miami 的角色，不是 Hidden Cove 的符號
	// （`SYMBOL_RIGS` 是空的 map）。先前的處理是把 `preload` 關掉，但那只擋住開機時
	// 的下載：Vite 對 `new URL(..., import.meta.url)` 是**無條件打包**的，所以 4.5MB
	// 另一款遊戲的美術照樣每次出貨都在包裡，而且「hotMiami」這個字在出貨的
	// index.html 出現 35 次。動作定義留在
	// `symbol_part_rigs_hotmiami_20260920.ts.bak`（design 的 _legacy 資料夾）。
	hmL1: {
		type: 'sprite',
		src: asset('treasure/l1.png'),
		preload: true,
	},
	hmL2: {
		type: 'sprite',
		src: asset('treasure/l2.png'),
		preload: true,
	},
	hmL3: {
		type: 'sprite',
		src: asset('treasure/l3.png'),
		preload: true,
	},
	hmL4: {
		type: 'sprite',
		src: asset('treasure/l4.png'),
		preload: true,
	},
	hmH5: {
		type: 'sprite',
		src: asset('treasure/h5.png'),
		preload: true,
	},
	// The Detector Sweep expanding wild specified by the Treasure Monkey art brief.
	hmSw: {
		type: 'sprite',
		src: asset('treasure/sw.png'),
		preload: true,
	},
	hmFrame: {
		type: 'sprite',
		src: asset('treasure/dig_zone_1.png'),
		preload: true,
	},
	hmFrame1x1: {
		type: 'sprite',
		src: asset('treasure/dig_zone_1.png'),
		preload: true,
	},
	hmFrame2x2: {
		type: 'sprite',
		src: asset('treasure/dig_zone_2.png'),
		preload: true,
	},
	hmFrame3x3: {
		type: 'sprite',
		src: asset('treasure/dig_zone_3.png'),
		preload: true,
	},
	hmFrameEdge1x1: {
		type: 'sprite',
		src: asset('treasure/dig_zone_edge_1.png'),
	},
	hmFrameEdge2x2: {
		type: 'sprite',
		src: asset('treasure/dig_zone_edge_2.png'),
	},
	hmFrameEdge3x3: {
		type: 'sprite',
		src: asset('treasure/dig_zone_edge_3.png'),
	},
	capoFrameStickySeal: {
		type: 'sprite',
		src: asset('sprites/capoFrames/frame_sticky_seal.svg'),
	},
	capoSwMuzzle: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	capoSwBeam: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	// Vault doors for the free-game transition. Two halves plus a dial that turns
	// on its own — see components/TransitionAnimation.svelte and ART_BRIEF §4.5.
	// The Buy Bonus card frame. Referenced from ModalBuyBonus's CSS through the
	// `src()` helper rather than drawn by Pixi, so it is an SVG: the card is
	// responsive and border-image scales a vector cleanly at any size.
	capoBuyCardFrame: {
		type: 'sprite',
		src: asset('sprites/capoUi/buy_card_frame.svg'),
	},
	capoVaultDoorL: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	capoVaultDoorR: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	capoVaultDial: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	capoSwShell: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
	},
	capoSwBulletHoles: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
	},
	hmLogo: {
		type: 'sprite',
		src: asset('treasure/logo.png'),
		preload: true,
	},
	hmW: {
		type: 'sprite',
		src: asset('treasure/w.png'),
		preload: true,
	},

	// The three feature titles, drawn as wordmarks rather than typeset.
	//
	// These replace four stacked pixi Texts that imitated the same thing — black
	// outline, a lit rim in the tier's colour, a dark face. The imitation was as
	// close as Text gets and it was still typography: the drawn versions carry
	// letterforms that are not in either shipped face, a diagonal streak across
	// each face, and a glow that falls off properly instead of being a sprite
	// behind the word. Same reason the symbols are art and not shapes.
	//
	// 1024x360, ink centred in the canvas, so all three drop in at one size.
	// The three feature wordmarks. FreeSpinIntro reaches these through
	// `tier.titleKey` (featureTiers.ts), which is a VARIABLE — so neither
	// check_sprite_keys.mjs nor check_assets_exist.mjs can see the reference, and
	// the tiers were renamed to soldier/capo/don while these three entries still
	// carried the Hot Miami names. The art was on disk the whole time; the splash
	// simply had no key to resolve. If a tier is ever renamed again, this block
	// and featureTiers.ts have to move together, and nothing will warn you.
	hmTitleSoldier: {
		type: 'sprite',
		src: asset('treasure/title_soldier.png'),
	},
	hmTitleCapo: {
		type: 'sprite',
		src: asset('treasure/title_capo.png'),
	},
	hmTitleDon: {
		type: 'sprite',
		src: asset('treasure/title_don.png'),
	},

	// Pose sheets: three more DRAWINGS of a symbol, played as a timeline inside
	// the win hold (game/posePlan.ts). Only h1 and h2 have them — the other four
	// symbols' sheets arrived as shapes pasted onto the base art and were refused,
	// so those symbols keep the transform-only win motion they already had.
	//
	// Whole-symbol images, not parts: a pose changes the silhouette, which is the
	// one thing the rigged stack cannot do.

	// The cast standing beside the board. Split out of the store tile's two-figure
	// cut-out by design/build_cast_figures.py, using the same measured polygon the
	// intro card clips with. Not preloaded: they are decoration on a board that is
	// already playable without them.
	// Preloaded, unlike most decoration: the LOADING SCREEN draws them, so they
	// have to be there before the thing that reports them being there. Two small
	// PNGs (266x819 and 224x775) against a 32MB bundle.
	hmCastGuy: {
		type: 'sprite',
		src: asset('treasure/digger_full.png'),
		preload: true,
	},
	hmCastGuyMesh: {
		type: 'sprite',
		src: asset('treasure/digger_full.png'),
		preload: true,
	},
	// The same drawing, graded — design/build_cast_guy_states.py derives both
	// from guy.png and touches RGB only, so all three share ONE mesh rig and one
	// set of measured joint limits. See that script for why they are not drawn
	// separately.
	//
	// Preloaded, both of them, although neither is used until a feature opens.
	// They are swapped in at the exact moment the feature starts, which is the
	// loudest beat in the game; a texture that arrives a frame late there is a
	// pop on the one screen nobody will miss. ~250 KB each is a cheap price for
	// that not being possible.
	hmCastGuyMeshFeature: {
		type: 'sprite',
		src: asset('treasure/lifeguard_full.png'),
		preload: true,
	},
	hmCastGuyMeshDon: {
		type: 'sprite',
		src: asset('treasure/lifeguard_full.png'),
		preload: true,
	},
	hmCastGirlMesh: {
		type: 'sprite',
		src: asset('treasure/lifeguard_full.png'),
		preload: true,
	},
	hmCastGirl: {
		type: 'sprite',
		src: asset('treasure/lifeguard_full.png'),
		preload: true,
	},

	// `hmCastGuySpine` / `hmCastGirlSpine`（static 底下的 spines/ 整個資料夾，
	// 共 5.4MB）在 2026-09-20 連圖帶條目一起刪掉。註解說「Cast.svelte 預設用這兩個」
	// 早就不成立了：Cast.svelte 掛的是 CastFigureMesh，唯一讀這兩個 key 的
	// CastFigureSpine.svelte 沒有任何人 import（也一併刪了）。它們帶 preload: true，
	// 每次開機都真的下載，玩家永遠看不到。

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	hmIconMenu: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/menu.png'),
		preload: true,
	},
	hmIconMenuExit: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/menuExit.png'),
		preload: true,
	},
	hmIconSettings: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/settings.png'),
		preload: true,
	},
	hmIconInfo: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/info.png'),
		preload: true,
	},
	hmIconPayTable: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/payTable.png'),
		preload: true,
	},
	hmIconSoundOn: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/soundOn.png'),
		preload: true,
	},
	hmIconSoundOff: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/soundOff.png'),
		preload: true,
	},
	hmIconAutoSpin: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/autoSpin.png'),
		preload: true,
	},
	// The stake steppers. capoUiIcons/increase.png and decrease.png have been on
	// disk in the game's own gold (#f3d397, sampled) since the icon set was drawn,
	// and were the only two of the twelve never registered — so those two controls
	// alone fell through to UiButton's '+' / '−' text glyphs, set in whatever the
	// bar's font happened to be. That was survivable while the bar was Titan One,
	// whose plus is a fat slab. It stopped being survivable when the bar moved to
	// Cinzel: a Roman inscriptional face draws a hairline plus, and at stepper size
	// on a dark disc it is close to invisible.
	hmIconIncrease: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/increase.png'),
		preload: true,
	},
	hmIconDecrease: {
		type: 'sprite',
		src: asset('sprites/capoUiIcons/decrease.png'),
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	hmS: {
		type: 'sprite',
		src: asset('treasure/s.png'),
		preload: true,
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Hot Miami jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	hmBgBase: {
		type: 'sprite',
		src: asset('treasure/bg_base.jpg'),
		preload: true,
	},
	// The near-camera band of each background (design/build_background_layers.py):
	// the right 36%, drawn back over the plate at a larger drift so the deck in
	// the foreground travels further than the city behind it.
	hmBgBaseNear: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	hmBgFeatureNear: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	hmBgEpicNear: {
		type: 'sprite',
		src: asset('treasure/empty.png'),
		preload: true,
	},
	hmBgFeature: {
		type: 'sprite',
		src: asset('treasure/bg_base.jpg'),
		preload: true,
	},
	hmBgEpic: {
		type: 'sprite',
		src: asset('treasure/bg_base.jpg'),
		preload: true,
	},
	// Drawn by design/build_coin_sheet.py. Replaces SD2_Coin.json/.png, a
	// TexturePacker sheet carried over from a template — 2.5MB of 684px frames
	// for a particle a few dozen pixels across, under a filename that names
	// someone else's game. Same twelve-frame spin, same frame names, 88KB.
	coins: {
		type: 'spriteSheet',
		src: asset('sprites/coin/coin.json'),
	},
	sound: {
		type: 'audio',
		src: asset('audio/treasure/sounds.json'),
		preload: true,
	},
	treasure_digger_head: { type: 'sprite', src: asset('treasure/digger_head.png'), preload: true },
	treasureWaveSurf: { type: 'sprite', src: asset('treasure/wave_surf_v2.png'), preload: true },
	treasureWaveWater: { type: 'sprite', src: asset('treasure/wave_water_v2.png'), preload: true },
	treasure_digger_blink: { type: 'sprite', src: asset('treasure/digger_blink.png'), preload: true },
	treasure_lifeguard_blink: { type: 'sprite', src: asset('treasure/lifeguard_blink.png'), preload: true },
	treasureChestBody: { type: 'sprite', src: asset('treasure/chest_body.png'), preload: true },
	treasureLowBoards: { type: 'sprite', src: asset('treasure/attachments/low_boards_v3.png'), preload: true },
	treasureMonkeyBlinkClosed: { type: 'sprite', src: asset('treasure/attachments/monkey_blink_closed_v4.png'), preload: true },
	treasureMonkeyBlinkHalf: { type: 'sprite', src: asset('treasure/attachments/monkey_blink_half_v4.png'), preload: true },
	treasureScrollParts: { type: 'sprite', src: asset('treasure/attachments/scroll_parts_v3.png'), preload: true },
	treasureCoconutParts: { type: 'sprite', src: asset('treasure/attachments/coconut_parts_v3.png'), preload: true },
	treasureChestLid: { type: 'sprite', src: asset('treasure/chest_lid.png'), preload: true },
	treasureCastleBody: { type: 'sprite', src: asset('treasure/castle_body.png'), preload: true },
	treasureCastleFlag: { type: 'sprite', src: asset('treasure/castle_flag.png'), preload: true },
	treasure_digger_body: { type: 'sprite', src: asset('treasure/digger_body.png'), preload: true },
	treasure_digger_arm_l: { type: 'sprite', src: asset('treasure/digger_arm_l.png'), preload: true },
	treasure_digger_arm_r: { type: 'sprite', src: asset('treasure/digger_arm_r.png'), preload: true },
	treasure_digger_legs: { type: 'sprite', src: asset('treasure/digger_legs.png'), preload: true },
	treasure_digger_tail: { type: 'sprite', src: asset('treasure/digger_tail.png'), preload: true },
	treasure_digger_tool: { type: 'sprite', src: asset('treasure/digger_tool.png'), preload: true },
	treasure_digger_belt: { type: 'sprite', src: asset('treasure/digger_belt.png'), preload: true },
	treasure_lifeguard_head: { type: 'sprite', src: asset('treasure/lifeguard_head.png'), preload: true },
	treasure_lifeguard_body: { type: 'sprite', src: asset('treasure/lifeguard_body.png'), preload: true },
	treasure_lifeguard_arm_l: { type: 'sprite', src: asset('treasure/lifeguard_arm_l.png'), preload: true },
	treasure_lifeguard_arm_r: { type: 'sprite', src: asset('treasure/lifeguard_arm_r.png'), preload: true },
	treasure_lifeguard_legs: { type: 'sprite', src: asset('treasure/lifeguard_legs.png'), preload: true },
	treasure_lifeguard_tail: { type: 'sprite', src: asset('treasure/lifeguard_tail.png'), preload: true },
	treasure_lifeguard_tool: { type: 'sprite', src: asset('treasure/lifeguard_tool.png'), preload: true },
	treasure_lifeguard_belt: { type: 'sprite', src: asset('treasure/lifeguard_belt.png'), preload: true },
} as const;
