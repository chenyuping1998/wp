export default {
	explosion: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols3/symbols3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols3/explosion.json', import.meta.url).href,
			scale: 2,
		},
	},
	// jungle-military riveted reel frame (SVG-generated ??see design/generate_theme_jungle.mjs)
	gbFrameBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	gbFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	gbUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// The platform skin's Buy Bonus: the same dark basalt plate every symbol
	// stands on, empty, with the sealed tablet's eye carved into it — and the
	// same eye lit, drawn for ADDITIVE blending, for the hover state. Both come
	// out of design/generate_ui_plates.mjs.
	gbUiBuyBonusStone: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_stone.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_stone_lit.png', import.meta.url).href,
		preload: true,
	},
	// The platform skin's Buy Bonus: Khepri, the scarab lifting the sun, and its
	// additive lit copy for hover (design/generate_ui_plates.mjs).
	gbUiBuyBonusScarab: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit.png', import.meta.url).href,
		preload: true,
	},
	// THE HOVER GLOW, ANIMATED: 16 frames of a light running round the rim,
	// cycled by game/buyBonusGlow.ts. Half size — they are blurred light.
	gbUiBuyBonusScarabLit00: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_00.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit01: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_01.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit02: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_02.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit03: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_03.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit04: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_04.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit05: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_05.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit06: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_06.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit07: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_07.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit08: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_08.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit09: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_09.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit10: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_10.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit11: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_11.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit12: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_12.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit13: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_13.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit14: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_14.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusScarabLit15: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_scarab_lit_15.png', import.meta.url).href,
		preload: true,
	},
	// The platform skin's Buy Bonus since the sun disc: a lapis palace ceiling in
	// an inlaid gold rim with the sun's rays round it, and its additive lit copy
	// for hover (design/generate_ui_plates.mjs).
	gbUiBuyBonusSun: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_sun.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusSunLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_sun_lit.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	gbWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/big.png', import.meta.url).href,
	},
	gbWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/superwin.png', import.meta.url).href,
	},
	gbWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/mega.png', import.meta.url).href,
	},
	gbWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/epic.png', import.meta.url).href,
	},
	gbWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/max.png', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	gbFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/fs_sign.png', import.meta.url).href,
	},
	gbFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Go Bananas symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	gbH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1.png', import.meta.url).href,
		preload: true,
	},
	gbH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2.png', import.meta.url).href,
		preload: true,
	},
	// (gbScarab, the scarab.png prop, is gone: the transition and the win-line
	// runners now draw H1's own beetle through its mesh — MeshWalker — which has
	// the hind legs that cut-out was missing.)
	// The high-pay mesh wins (SymbolMeshWin.svelte, game/meshWin/*): each H
	// symbol split into plate / subject / drop shadow / light-sweep atlas by
	// design/make_symbol_layers.mjs. Written out literally so check_assets.mjs
	// can see every path.
	gbH1Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH1Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH1Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH1Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH2Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH2Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH2Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH2Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH3Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH3Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH3Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH3Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH4Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH4Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH4Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH4Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_sheen.png', import.meta.url).href,
		preload: true,
	},
	// The panel-mode mesh wins (letters, Wild, Scatter): the flash's glow
	// texture and the light-sweep atlas (design/make_symbol_layers.mjs). The mesh
	// itself draws each symbol's own sprite.
	gbL1Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l1_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL1Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l1_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL2Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l2_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL2Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l2_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL3Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l3_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL3Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l3_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL4Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l4_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL4Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l4_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL5Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l5_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL5Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l5_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbWGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/w_glow.png', import.meta.url).href,
		preload: true,
	},
	gbWSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/w_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbMGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/m_glow.png', import.meta.url).href,
		preload: true,
	},
	gbMSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/m_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbPGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/p_glow.png', import.meta.url).href,
		preload: true,
	},
	gbPSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/p_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbSGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/s_glow.png', import.meta.url).href,
		preload: true,
	},
	gbSSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/s_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3.png', import.meta.url).href,
		preload: true,
	},
	gbH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4.png', import.meta.url).href,
		preload: true,
	},
	gbL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l1.png', import.meta.url).href,
		preload: true,
	},
	gbL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l2.png', import.meta.url).href,
		preload: true,
	},
	gbL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l3.png', import.meta.url).href,
		preload: true,
	},
	gbL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l4.png', import.meta.url).href,
		preload: true,
	},
	gbL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l5.png', import.meta.url).href,
		preload: true,
	},
	gbW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/w.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	gbIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	gbIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	gbIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	gbIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	gbIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	gbIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	gbIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	gbIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// only ever drawn in replay mode, but the bet bar's icons are all preloaded
	// together and one 256px sprite is not worth a separate loading path
	gbIconReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/replay.png', import.meta.url).href,
		preload: true,
	},

	// gbWxPanel and gbSpWx are GONE. They were the full-reel WILD banner and its
	// spine — the art for expanding wilds, a mechanic this game does not have.
	// Nothing had referenced either of them since that feature was removed, so
	// they were two textures being preloaded on every session for nothing.
	gbS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/s.png', import.meta.url).href,
		preload: true,
	},
	// ── the same icons in flat monochrome, for the platform UI skin ──────────
	//
	// A SECOND SET RATHER THAN A TINT, because UiButton draws uiTheme.icons as a
	// plain Sprite with no tint (components-ui-pixi/src/components/UiButton.svelte)
	// — uiTheme.buttonIconFill reaches only the vector-drawn turbo bolt, so on the
	// platform skin every one of the brass icons above stayed gold on a grey strip.
	//
	// Both sets are preloaded and both ship. That is the price of the skin being
	// switchable at run time from localStorage with no rebuild: whichever one
	// uiTheme.icons ends up pointing at has to already be in memory. Nine 256px
	// PNGs of flat white line art, ~4KB each.
	//
	// Generated from the SAME shapes as the brass set — see design/generate_ui_icons.mjs,
	// which renders both palettes in one pass so the two can never drift apart.
	gbIconMonoMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/menu.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/menuExit.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/settings.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/info.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/payTable.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/soundOn.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/soundOff.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/replay.png', import.meta.url).href,
		preload: true,
	},
	gbX: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/x.png', import.meta.url).href,
		preload: true,
	},
	gbP: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/p.png', import.meta.url).href,
		preload: true,
	},
	// The sealed tablet, and its two halves.
	//
	// The halves are CUT FROM m.png by design/generate_symbols_gen2.mjs rather
	// than drawn, so the crack shows the same stone the board was showing a frame
	// earlier — MysteryReveal renders the intact tablet as the two halves resting
	// in place and then lets them fall, and anything else would change the
	// tablet's appearance on the exact frame the player is watching it break.
	gbM: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/m.png', import.meta.url).href,
		preload: true,
	},
	gbMShardL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/m_shard_l.png', import.meta.url).href,
		preload: true,
	},
	gbMShardR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/m_shard_r.png', import.meta.url).href,
		preload: true,
	},
	// The jackal god standing beside the board. Built from the supplied character
	// PSD — see design/extract_character_psd.py and design/generate_anubis_spine.mjs.
	gbAnubis: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananubisAnubis/anubis.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananubisAnubis/anubis.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l1.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l2.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l3.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l4.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL5: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l5.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l5.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpW: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/w.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/w.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpS: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/s.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/s.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpX: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/x.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/x.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpP: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/p.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/p.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Go Bananas jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	gbBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	gbBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_feature.png', import.meta.url).href,
		preload: true,
	},
	gbBgSuperspin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_superspin.png', import.meta.url).href,
		preload: true,
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/anticipation/anticipation.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/anticipation/anticipation.json', import.meta.url).href,
			scale: 2,
		},
	},
	reelhouse: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/reelhouse/reelhouse_glow.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/reelhouse/reelhouse_glow.json', import.meta.url).href,
			scale: 2,
		},
	},
	// Win-spray particles. The emitter is handed this whole sheet and gives each
	// particle one random frame out of it, so the ten frames are ten viewing
	// angles of the same banana rather than an animation — see
	// design/pack_banana_particles.mjs.
	//
	// It replaces `coins`, which was SD2_Coin: a Japanese five-yen piece with a
	// Shiba Inu on it, left over from the template this game started from and
	// about as far from a jungle-commando theme as an asset can get.
	winBananas: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/goBananasWinBananas/bananas.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
