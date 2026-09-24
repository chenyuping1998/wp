export default {
 hmCastGuyFeature: { type: 'sprite', src: new URL('../../assets/sprites/turfCast/guy_feature.png', import.meta.url).href, preload: true },
 hmCastGuyKingpin: { type: 'sprite', src: new URL('../../assets/sprites/turfCast/guy_kingpin.png', import.meta.url).href, preload: true },

 turfFrameFull: { type: 'sprite', src: new URL('../../assets/sprites/turfFrames/frame_full.png', import.meta.url).href },
 turfFrameFullEdge: { type: 'sprite', src: new URL('../../assets/sprites/turfFrames/frame_full_edge.png', import.meta.url).href },
 turfWildLocked: { type: 'sprite', src: new URL('../../assets/sprites/turfFx/sw_locked.png', import.meta.url).href },

	// jungle-military riveted reel frame (SVG-generated ??see design/generate_theme_jungle.mjs)
	hmFrameBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBoardFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	hmFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBoardFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/capoFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/capoFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/capoFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/sw_debris.png', import.meta.url).href,
		preload: true,
	},
	// Side-profile car for the scene transition (design/build_transition_car.py).
	// The car SYMBOL is three-quarter front-on — the angle that reads in a reel
	// cell — and slid sideways it looks like a car pointing at you being dragged.
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/capoFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	hmUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	hmUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	hmUiBarStrip: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/bar_strip.png', import.meta.url).href,
		preload: true,
	},
	turfUiBarPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/bar_plate.png', import.meta.url).href,
		preload: true,
	},
	hmUiButtonPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/button_plate.png', import.meta.url).href,
		preload: true,
	},
	hmUiButtonPlateActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/button_plate_active.png', import.meta.url).href,
		preload: true,
	},
	turfUiSpinPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/spin_plate.png', import.meta.url).href,
		preload: true,
	},
	turfUiDrawerPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/drawer_plate.png', import.meta.url).href,
		preload: true,
	},
	// ART_BRIEF §8.7 #2/#3/#4 — turfUi/bar_strip.png, button_plate.png and
	// button_plate_active.png land here when the art arrives, and uiTheme's
	// `bar` / `button` / `buttonActive` slots point at these keys:
	//
	//   hmUiBarStrip:          turfUi/bar_strip.png            (3744x240, caps 128)
	//   hmUiButtonPlate:       turfUi/button_plate.png         (300x300)
	//   hmUiButtonPlateActive: turfUi/button_plate_active.png  (300x300)
	//
	// Final §8.7 art is registered above; the existence gate now verifies it.
	// brass win-tier plaques (design/generate_win_banners.mjs)
	hmWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfWinBanners/big.png', import.meta.url).href,
	},
	hmWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfWinBanners/superwin.png', import.meta.url).href,
	},
	hmWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfWinBanners/mega.png', import.meta.url).href,
	},
	hmWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfWinBanners/epic.png', import.meta.url).href,
	},
	hmWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfWinBanners/max.png', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	hmFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBoardFrame/fs_sign.png', import.meta.url).href,
	},
	hmFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBoardFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Hot Miami symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	hmH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	hmH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	hmH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	hmH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	// 切片符號的零件（`sprites/hotMiamiParts/`）在 2026-09-20 連圖帶條目一起刪掉。
	//
	// 那套 rig 早就停用了 —— 零件的圖畫的是 Hot Miami 的角色，不是這款的符號
	// （`SYMBOL_RIGS` 是空的 map）。先前的處理是把 `preload` 關掉，但那只擋住開機時
	// 的下載：Vite 對 `new URL(..., import.meta.url)` 是**無條件打包**的，所以 4.5MB
	// 另一款遊戲的美術照樣每次出貨都在包裡。動作定義留在
	// `symbol_part_rigs_hotmiami_20260920.ts.bak`（design 的 _legacy 資料夾）。
	// Expression swaps: a second drawing of the same part, shown for a beat.
	hmL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	hmL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	hmL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	hmL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	hmH5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/h5.png', import.meta.url).href,
		preload: true,
	},
	// The Bruiser expanding wild specified by the Turf War art brief.
	hmSw: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/sw.png', import.meta.url).href,
		preload: true,
	},
	hmFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_1x1.png', import.meta.url).href,
		preload: true,
	},
	hmFrame1x1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_1x1.png', import.meta.url).href,
		preload: true,
	},
	hmFrame2x2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_2x2.png', import.meta.url).href,
		preload: true,
	},
	hmFrame3x3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_3x3.png', import.meta.url).href,
		preload: true,
	},
	hmFrameEdge1x1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_edge_1x1.png', import.meta.url).href,
	},
	hmFrameEdge2x2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_edge_2x2.png', import.meta.url).href,
	},
	hmFrameEdge3x3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_edge_3x3.png', import.meta.url).href,
	},
	capoFrameStickySeal: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFrames/frame_sticky.png', import.meta.url).href,
	},
	capoSwMuzzle: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/sw_bat_swing.png', import.meta.url).href,
		preload: true,
	},
	capoSwBeam: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/sw_column_beam.png', import.meta.url).href,
		preload: true,
	},
	// Vault doors for the free-game transition. Two halves plus a dial that turns
	// on its own — see components/TransitionAnimation.svelte and ART_BRIEF §4.5.
	// The Buy Bonus card frame. Referenced from ModalBuyBonus's CSS through the
	// `src()` helper rather than drawn by Pixi, so it is an SVG: the card is
	// responsive and border-image scales a vector cleanly at any size.
	capoBuyCardFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUi/buy_card_frame.png', import.meta.url).href,
	},
	capoVaultDoorL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/shutter_l.png', import.meta.url).href,
		preload: true,
	},
	capoVaultDoorR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/shutter_r.png', import.meta.url).href,
		preload: true,
	},
	capoVaultDial: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/lock.png', import.meta.url).href,
		preload: true,
	},
	capoSwShell: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/sw_debris.png', import.meta.url).href,
	},
	capoSwBulletHoles: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfFx/sw_cracks.png', import.meta.url).href,
	},
	hmLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBrand/logo.png', import.meta.url).href,
		preload: true,
	},
	hmW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/w.png', import.meta.url).href,
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
	// check_sprite_keys.mjs nor check_assets_exist.mjs can see the reference.
	// check_feature_titles.mjs is the guard that does: keep these keys in step
	// with featureTiers.ts `titleKey`, they move together.
	turfTitleLookout: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSplash/title_lookout.png', import.meta.url).href,
	},
	turfTitleMuscle: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSplash/title_muscle.png', import.meta.url).href,
	},
	turfTitleKingpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSplash/title_kingpin.png', import.meta.url).href,
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
		src: new URL('../../assets/sprites/turfCast/guy.png', import.meta.url).href,
		preload: true,
	},
	hmCastGuyMesh: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfCast/guy.png', import.meta.url).href,
		preload: true,
	},
	hmCastGirlMesh: {
		type: 'sprite',
		src: new URL('../../assets/meshRigs/cast_girl/girl.png', import.meta.url).href,
		preload: false,
	},
	hmCastGirl: {
		type: 'sprite',
		src: new URL('../../assets/sprites/capoCast/girl_spine.png', import.meta.url).href,
		preload: false,
	},

	// `hmCastGuySpine` / `hmCastGirlSpine`（static 底下的 spines/ 整個資料夾，
	// 共 5.4MB）在 2026-09-20 連圖帶條目一起刪掉。註解說「Cast.svelte 預設用這兩個」
	// 早就不成立：Cast.svelte 掛的是 CastFigureMesh，唯一讀這兩個 key 的
	// CastFigureSpine.svelte 沒有任何人 import（也一併刪了）。它們帶 preload: true，
	// 每次開機都真的下載，玩家永遠看不到。

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	hmIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	hmIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	hmIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	hmIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	hmIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	hmIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	hmIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	hmIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// Bet steppers (2026-09-14). Turf War never registered stepper art, so these
	// two controls fell through to UiButton's '+'/'-' text glyphs in the bar font.
	// Drawn with the rest of the set by CapoNostra/design/generate_capo_ui_icons.py
	// in Turf's bone white.
	hmIconIncrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/increase.png', import.meta.url).href,
		preload: true,
	},
	hmIconDecrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfUiIcons/decrease.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	hmS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfSymbols/fs.png', import.meta.url).href,
		preload: true,
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Hot Miami jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	hmBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	// The near-camera band of each background (design/build_background_layers.py):
	// the right 36%, drawn back over the plate at a larger drift so the deck in
	// the foreground travels further than the city behind it.
	hmBgBaseNear: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBackground/bg_base_near.png', import.meta.url).href,
		preload: true,
	},
	hmBgFeatureNear: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBackground/bg_feature_near.png', import.meta.url).href,
		preload: true,
	},
	hmBgEpicNear: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBackground/bg_epic_near.png', import.meta.url).href,
		preload: true,
	},
	hmBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBackground/bg_feature.png', import.meta.url).href,
		preload: true,
	},
	hmBgEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/turfBackground/bg_epic.png', import.meta.url).href,
		preload: true,
	},
	// Drawn by design/build_coin_sheet.py. Replaces SD2_Coin.json/.png, a
	// TexturePacker sheet carried over from a template — 2.5MB of 684px frames
	// for a particle a few dozen pixels across, under a filename that names
	// someone else's game. Same twelve-frame spin, same frame names, 88KB.
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/turfCoin/coin.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
