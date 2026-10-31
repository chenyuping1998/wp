export default {
	gbPotionVapor: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyFx/potion_vapor.png', import.meta.url).href,
		preload: true,
	},
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
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_leaf.png', import.meta.url).href,
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
	// the Buy Bonus plate simmering: frames baked by design/make_bonus_bubbles.py,
	// cycled through uiTheme.sprites.buyBonus by game/buyBonusBubbles.ts
	gbUiBonusPlate00: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_00.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate01: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_01.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate02: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_02.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate03: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_03.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate04: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_04.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate05: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_05.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate06: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_06.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate07: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_07.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate08: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_08.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate09: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_09.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate10: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_10.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate11: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_11.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate12: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_12.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate13: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_13.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate14: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_14.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate15: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_15.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate16: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_16.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate17: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_17.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate18: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_18.png', import.meta.url).href,
		preload: true,
	},
	gbUiBonusPlate19: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/bonus_plate_19.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// The platform skin's Buy Bonus: a slab of the royals' stone, and the same
	// slab splitting for the hover layer. See design/generate_ui_plates.mjs.
	gbUiBuyBonusStone: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_stone.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusStoneLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_stone_lit.png', import.meta.url).href,
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
	gbFgPlaque: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyUi/fg_plaque.png', import.meta.url).href,
	},
	// the blast ladder's dynamite sticks on the counter (design/generate_ladder_sticks.mjs)
	gbLadderLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/ladder_stick_lit.png', import.meta.url).href,
	},
	gbLadderOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/ladder_stick_off.png', import.meta.url).href,
	},
	// Go Bananas symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	// Mesh-win layers (design/make_symbol_layers.mjs, drawn by SymbolMeshWin).
	// CUT symbols carry plate / subject / shadow / sheen; PANEL symbols glow /
	// sheen over their own sprite.
	// the cut layers the winning symbols leap from (design/make_alchemy_layers.py)
	// the Wild gorilla's painted lids, same canvas as w.png (design/w_blink.py)
	gbWLidHalf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/w_lid_half.png', import.meta.url).href,
		preload: true,
	},
	gbWLidClosed: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/w_lid_closed.png', import.meta.url).href,
		preload: true,
	},
	gbH1Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h1_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH1Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h1_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH1Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h1_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH2Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h2_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH2Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h2_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH2Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h2_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH3Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h3_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH3Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h3_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH3Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h3_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH4Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h4_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH4Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h4_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH4Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/h4_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbL1Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l1_plate.png', import.meta.url).href,
		preload: true,
	},
	gbL1Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l1_subject.png', import.meta.url).href,
		preload: true,
	},
	gbL1Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l1_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbL2Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l2_plate.png', import.meta.url).href,
		preload: true,
	},
	gbL2Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l2_subject.png', import.meta.url).href,
		preload: true,
	},
	gbL2Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l2_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbL3Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l3_plate.png', import.meta.url).href,
		preload: true,
	},
	gbL3Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l3_subject.png', import.meta.url).href,
		preload: true,
	},
	gbL3Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l3_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbL4Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l4_plate.png', import.meta.url).href,
		preload: true,
	},
	gbL4Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l4_subject.png', import.meta.url).href,
		preload: true,
	},
	gbL4Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l4_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbL5Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l5_plate.png', import.meta.url).href,
		preload: true,
	},
	gbL5Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l5_subject.png', import.meta.url).href,
		preload: true,
	},
	gbL5Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/l5_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbSPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/s_plate.png', import.meta.url).href,
		preload: true,
	},
	gbSSubject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/s_subject.png', import.meta.url).href,
		preload: true,
	},
	gbSShadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyMesh/s_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	gbH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	// The dynamite PROP — a transparent cut-out, deliberately not gbH2.
	//
	// The transition drop and the win-line runners both draw a dynamite over the
	// live board, and both used gbH2. In gen-2 that symbol is an opaque riveted
	// plate, so what actually fell down the screen was a tile complete with bezel
	// and rivets. See design/generate_symbols_gen2.mjs for where this is cut.
	gbDynamite: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/reagent_prop.png', import.meta.url).href,
		preload: true,
	},
	gbH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	gbH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	gbL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	gbL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	gbL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	gbL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	gbL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/l5.png', import.meta.url).href,
		preload: true,
	},
	gbW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/w.png', import.meta.url).href,
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
		src: new URL('../../assets/sprites/goBanalchemySymbols/s.png', import.meta.url).href,
		preload: true,
	},
	// The Dynamite: a bundle of sticks bound short with a lit fuse arcing out of
	// it. The arcing fuse is deliberate — it is the one shape in the set that has
	// a line leaving the silhouette, which is what keeps it from reading as the
	// golden-banana Scatter at 140px.
	gbB: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/b.png', import.meta.url).href,
		preload: true,
	},
	gbX: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/x.png', import.meta.url).href,
		preload: true,
	},
	gbP: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemySymbols/p.png', import.meta.url).href,
		preload: true,
	},
	// The sergeant standing beside the board. Built from the supplied character
	// PSD — see design/extract_monkey_psd.py and design/generate_monkey_spine.mjs.
	gbMonkey: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasMonkey/monkey.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasMonkey/monkey.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Go Bananas jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	gbBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyBackground/bg_base.jpg', import.meta.url).href,
		preload: true,
	},
	gbBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyBackground/bg_feature.jpg', import.meta.url).href,
		preload: true,
	},
	gbBgHoldAndSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyBackground/bg_holdandspin.jpg', import.meta.url).href,
		preload: true,
	},
	// The backgrounds' light, fog and glints (design/build_bg_light.py,
	// drawn by BgLight.svelte). Preloaded with the plates: a missing key
	// would throw inside an effect and freeze the game.
	bgFog0: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/fog_0.png', import.meta.url).href,
		preload: true,
	},
	bgFog1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/fog_1.png', import.meta.url).href,
		preload: true,
	},
	bgFog2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/fog_2.png', import.meta.url).href,
		preload: true,
	},
	bgGlint: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/glint.png', import.meta.url).href,
		preload: true,
	},
	light_base_bottleL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_base_bottleL.png', import.meta.url).href,
		preload: true,
	},
	light_base_candles: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_base_candles.png', import.meta.url).href,
		preload: true,
	},
	light_base_elixirL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_base_elixirL.png', import.meta.url).href,
		preload: true,
	},
	light_base_flaskR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_base_flaskR.png', import.meta.url).href,
		preload: true,
	},
	light_base_lanternL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_base_lanternL.png', import.meta.url).href,
		preload: true,
	},
	light_base_lanternR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_base_lanternR.png', import.meta.url).href,
		preload: true,
	},
	light_base_stillR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_base_stillR.png', import.meta.url).href,
		preload: true,
	},
	light_feature_bankL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_feature_bankL.png', import.meta.url).href,
		preload: true,
	},
	light_feature_bankR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_feature_bankR.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_bottleL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_bottleL.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_crystalBowl: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_crystalBowl.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_crystalJar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_crystalJar.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_crystalsR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_crystalsR.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_flaskL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_flaskL.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_furnace: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_furnace.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_jarR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_jarR.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_lamp: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_lamp.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_lanternL: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_lanternL.png', import.meta.url).href,
		preload: true,
	},
	light_holdandspin_lanternR: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBanalchemyLight/light_holdandspin_lanternR.png', import.meta.url).href,
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
	// particle one random frame out of it, so the ten frames are ten views of
	// the same object rather than an animation.
	//
	// Crystal clusters (2026-10-23, design/pack_crystal_particles.py): the H2
	// amethyst broken off its copper stand, some turned to the lantern's green
	// and the flasks' amber — what an alchemist's win throws out. The bananas
	// (goBananasWinBananas) are still on disk: point this key back at them to
	// undo.
	winCrystals: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/goBanalchemyWinCrystals/crystals.json', import.meta.url).href,
	},
	gbFeatureBar: { type: 'sprite', src: new URL('../../assets/sprites/featureUiV2/bar.png', import.meta.url).href, preload: true },
	gbFeatureButton: { type: 'sprite', src: new URL('../../assets/sprites/featureUiV2/button.png', import.meta.url).href, preload: true },
	gbFeatureButtonActive: { type: 'sprite', src: new URL('../../assets/sprites/featureUiV2/button_active.png', import.meta.url).href, preload: true },
	gbFeatureSpin: { type: 'sprite', src: new URL('../../assets/sprites/featureUiV2/spin.png', import.meta.url).href, preload: true },
	gbFeatureTicker: { type: 'sprite', src: new URL('../../assets/sprites/featureUiV2/ticker.png', import.meta.url).href, preload: true },
} as const;
