export default {
 // background motion parts (design/build_mummy_bg_motion.py, src/game/bgMotionParts.ts)
 mummyLivingLinen:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/living_linen.webp',import.meta.url).href,preload:true},
 mummyWheelCat:{type:'sprite',src:new URL('../../assets/spines/mummyCat/head_idle.png',import.meta.url).href,preload:true},
 mummyBaseLinen0:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/linen_0.webp',import.meta.url).href,preload:true},
 mummyBaseLinen1:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/linen_1.webp',import.meta.url).href,preload:true},
 mummyBaseLinen2:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/linen_2.webp',import.meta.url).href,preload:true},
 mummyBaseLinen3:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/linen_3.webp',import.meta.url).href,preload:true},
 mummyBaseLinen4:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/linen_4.webp',import.meta.url).href,preload:true},
 mummyBaseLinen5:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/linen_5.webp',import.meta.url).href,preload:true},
 mummyFlameBase0:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/flame_base_0.webp',import.meta.url).href,preload:true},
 mummyFlameBase1:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/flame_base_1.webp',import.meta.url).href,preload:true},
 mummyFlameFeature0:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/flame_feature_0.webp',import.meta.url).href,preload:true},
 mummyFlameFeature1:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/flame_feature_1.webp',import.meta.url).href,preload:true},
 mummyFlameHold0:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/flame_hold_0.webp',import.meta.url).href,preload:true},
 mummyFlameHold1:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/flame_hold_1.webp',import.meta.url).href,preload:true},
 mummyBuyIcon: {type:'sprite',src:new URL('../../assets/sprites/mummyUi/buy_icon.webp',import.meta.url).href,preload:true},
 gbH3Glow: {type:'sprite',src:new URL('../../assets/sprites/mummySymbols/h3_glow.webp',import.meta.url).href,preload:true},
 mummyHoldProps: {type:'sprite',src:new URL('../../assets/sprites/mummyBackground/bg_holdandspin_props.webp',import.meta.url).href,preload:true},
 mummyFeatureProps: {type:'sprite',src:new URL('../../assets/sprites/mummyBackground/bg_feature_props.webp',import.meta.url).href,preload:true},
 mummyBaseProps: {type:'sprite',src:new URL('../../assets/sprites/mummyBackground/bg_base_torches.webp',import.meta.url).href,preload:true},
 mummyRays: {type:'sprite',src:new URL('../../assets/sprites/mummyWheel/rays.webp',import.meta.url).href,preload:true},
 mummyLevelUp: {type:'sprite',src:new URL('../../assets/sprites/mummyWheel/levelup.webp',import.meta.url).href,preload:true},
 mummySunTitle: {type:'sprite',src:new URL('../../assets/sprites/mummyWheel/title.webp',import.meta.url).href,preload:true},
	mummySunDisc4: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/disc_lv4.webp', import.meta.url).href, preload: true },
	mummySunDisc3: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/disc_lv3.webp', import.meta.url).href, preload: true },
	mummySunDisc2: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/disc_lv2.webp', import.meta.url).href, preload: true },
	mummySunDisc1: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/disc_lv1.webp', import.meta.url).href, preload: true },
	mummyBandageEnd: { type: 'sprite', src: new URL('../../assets/sprites/mummyTransition/bandage_end.webp', import.meta.url).href, preload: true },
	mummyBandage: { type: 'sprite', src: new URL('../../assets/sprites/mummyTransition/bandage_strip.webp', import.meta.url).href, preload: true },
	mummySunHub: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/hub.webp', import.meta.url).href, preload: true },
	mummySunNeedle: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/needle.webp', import.meta.url).href, preload: true },
	mummySunRing: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/ring.webp', import.meta.url).href, preload: true },
	mummyTileTop: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/tile_top.webp', import.meta.url).href, preload: true },
	mummyTileHot: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/tile_hot.webp', import.meta.url).href, preload: true },
	mummyTile: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/tile_normal.webp', import.meta.url).href, preload: true },
	mummyPointer: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/pointer.webp', import.meta.url).href, preload: true },
	mummyButtonLit: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/button_lit.webp', import.meta.url).href, preload: true },
	mummyButton: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/button.webp', import.meta.url).href, preload: true },
	mummyPlate: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/plate.webp', import.meta.url).href, preload: true },
	mummyArch: { type: 'sprite', src: new URL('../../assets/sprites/mummyWheel/arch_base.webp', import.meta.url).href, preload: true },
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
		src: new URL('../../assets/sprites/mummyFrame/frame_bg.webp', import.meta.url).href,
		preload: true,
	},
	gbFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFrame/frame_edge.webp', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFx/fx_glow.webp', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFx/fx_star.webp', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFx/fx_streak.webp', import.meta.url).href,
		preload: true,
	},
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFx/fx_leaf.webp', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFx/fx_vignette.webp', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	gbUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyUi/ticker_plate.webp', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyUi/buybonus_plate.webp', import.meta.url).href,
		preload: true,
	},
	// The platform skin's Buy Bonus: a slab of the royals' stone, and the same
	// slab splitting for the hover layer. See design/generate_ui_plates.mjs.
	gbUiBuyBonusStone: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyUi/buybonus_stone.webp', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusStoneLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyUi/buybonus_stone_lit.webp', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	gbWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBanners/big.webp', import.meta.url).href,
	},
	gbWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBanners/superwin.webp', import.meta.url).href,
	},
	gbWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBanners/mega.webp', import.meta.url).href,
	},
	gbWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBanners/epic.webp', import.meta.url).href,
	},
	gbWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBanners/max.webp', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	gbFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFrame/fs_sign.webp', import.meta.url).href,
	},
	gbFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyFrame/fs_counter_panel.webp', import.meta.url).href,
	},
	// Go Bananas symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	// Mesh-win layers (design/make_symbol_layers.mjs, drawn by SymbolMeshWin).
	// CUT symbols carry plate / subject / shadow / sheen; PANEL symbols glow /
	// sheen over their own sprite.
	gbH3Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h3_plate.webp', import.meta.url).href,
		preload: true,
	},
	gbH3Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h3_subject.webp', import.meta.url).href,
		preload: true,
	},
	gbH3Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h3_shadow.webp', import.meta.url).href,
		preload: true,
	},
	// the letters as cut wins: the carved letter leaps out of its slot; the tile
	// (knot, slot and all) is the plate (design/cut_mummy_symbols.py)
	gbL1Plate: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l1.webp', import.meta.url).href, preload: true },
	gbL1Subject: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l1_letter.webp', import.meta.url).href, preload: true },
	gbL1Shadow: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l1_shadow.webp', import.meta.url).href, preload: true },
	gbL2Plate: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l2.webp', import.meta.url).href, preload: true },
	gbL2Subject: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l2_letter.webp', import.meta.url).href, preload: true },
	gbL2Shadow: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l2_shadow.webp', import.meta.url).href, preload: true },
	gbL3Plate: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l3.webp', import.meta.url).href, preload: true },
	gbL3Subject: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l3_letter.webp', import.meta.url).href, preload: true },
	gbL3Shadow: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l3_shadow.webp', import.meta.url).href, preload: true },
	gbL4Plate: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l4.webp', import.meta.url).href, preload: true },
	gbL4Subject: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l4_letter.webp', import.meta.url).href, preload: true },
	gbL4Shadow: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l4_shadow.webp', import.meta.url).href, preload: true },
	gbL5Plate: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l5.webp', import.meta.url).href, preload: true },
	gbL5Subject: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l5_letter.webp', import.meta.url).href, preload: true },
	gbL5Shadow: { type: 'sprite', src: new URL('../../assets/sprites/mummySymbols/l5_shadow.webp', import.meta.url).href, preload: true },
	// the high pays cut off their plates (design/cut_mummy_symbols.py)
	gbH1Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h1_plate.webp', import.meta.url).href,
		preload: true,
	},
	gbH1Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h1_subject.webp', import.meta.url).href,
		preload: true,
	},
	gbH1Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h1_shadow.webp', import.meta.url).href,
		preload: true,
	},
	gbH2Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h2_plate.webp', import.meta.url).href,
		preload: true,
	},
	gbH2Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h2_subject.webp', import.meta.url).href,
		preload: true,
	},
	gbH2Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h2_shadow.webp', import.meta.url).href,
		preload: true,
	},
	gbH4Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h4_plate.webp', import.meta.url).href,
		preload: true,
	},
	gbH4Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h4_subject.webp', import.meta.url).href,
		preload: true,
	},
	gbH4Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h4_shadow.webp', import.meta.url).href,
		preload: true,
	},
	gbH3Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h3_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbL1Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l1_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbL1Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l1_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbL2Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l2_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbL2Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l2_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbL3Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l3_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbL3Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l3_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbL4Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l4_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbL4Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l4_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbL5Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l5_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbL5Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l5_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbH1Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h1_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbH1Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h1_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbH2Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h2_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbH2Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h2_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbH4Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h4_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbH4Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h4_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbWGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/w_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbWSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/w_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbSGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/s_glow.webp', import.meta.url).href,
		preload: true,
	},
	gbSSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/s_sheen.webp', import.meta.url).href,
		preload: true,
	},
	gbH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h1.webp', import.meta.url).href,
		preload: true,
	},
	gbH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h2.webp', import.meta.url).href,
		preload: true,
	},
	gbH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h3.webp', import.meta.url).href,
		preload: true,
	},
	gbH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/h4.webp', import.meta.url).href,
		preload: true,
	},
	gbL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l1.webp', import.meta.url).href,
		preload: true,
	},
	gbL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l2.webp', import.meta.url).href,
		preload: true,
	},
	gbL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l3.webp', import.meta.url).href,
		preload: true,
	},
	gbL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l4.webp', import.meta.url).href,
		preload: true,
	},
	gbL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/l5.webp', import.meta.url).href,
		preload: true,
	},
	gbW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/w.webp', import.meta.url).href,
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

	gbS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/s.webp', import.meta.url).href,
		preload: true,
	},
	gbX: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/x.webp', import.meta.url).href,
		preload: true,
	},
	gbP: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummySymbols/p.webp', import.meta.url).href,
		preload: true,
	},
	// The sergeant standing beside the board. Built from the supplied character
	// PSD — see design/extract_monkey_psd.py and design/generate_monkey_spine.mjs.
	gbMonkey: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/mummyCat/mummyCat.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/mummyCat/mummyCat.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Go Bananas jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	gbBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBackground/bg_base_far.webp', import.meta.url).href,
		preload: true,
	},
	gbBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBackground/bg_feature_far.webp', import.meta.url).href,
		preload: true,
	},
	gbBgHoldAndSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mummyBackground/bg_holdandspin_far.webp', import.meta.url).href,
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
		src: new URL('../../assets/sprites/mummyCoins/coins.json', import.meta.url).href,
	},
} as const;
