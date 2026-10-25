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
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_leaf.png', import.meta.url).href,
		preload: true,
	},
	// matter, not light (meshWin/fx.ts): bubbles, spray, smoke, grit — copied
	// from GoBananasBoat's set
	fxBubble: { type: 'sprite', src: new URL('../../assets/sprites/goBananasFx/fx_bubble.png', import.meta.url).href, preload: true },
	fxDrop: { type: 'sprite', src: new URL('../../assets/sprites/goBananasFx/fx_drop.png', import.meta.url).href, preload: true },
	fxPuff: { type: 'sprite', src: new URL('../../assets/sprites/goBananasFx/fx_puff.png', import.meta.url).href, preload: true },
	fxScrap: { type: 'sprite', src: new URL('../../assets/sprites/goBananasFx/fx_scrap.png', import.meta.url).href, preload: true },
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
	gbUiBuyBonusLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_lit.png', import.meta.url).href,
		preload: true,
	},
	// The Buy Bonus is a throwing star that spins under the pointer, and its lit
	// edges for the additive hover layer (design/generate_buy_shuriken.mjs).
	// The bar's round controls: washi-paper discs, ON in brass, with Diner
	// Monkey's ink icon shapes re-inked navy (design/generate_bar_discs.py).
	gbUiButtonWashi: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/button_washi.png', import.meta.url).href,
		preload: true,
	},
	gbUiButtonWashiOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/button_washi_on.png', import.meta.url).href,
		preload: true,
	},
	gbIconInkMenu: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_menu.png', import.meta.url).href, preload: true },
	gbIconInkMenuExit: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_menuExit.png', import.meta.url).href, preload: true },
	gbIconInkSettings: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_settings.png', import.meta.url).href, preload: true },
	gbIconInkInfo: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_info.png', import.meta.url).href, preload: true },
	gbIconInkPayTable: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_payTable.png', import.meta.url).href, preload: true },
	gbIconInkSoundOn: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_soundOn.png', import.meta.url).href, preload: true },
	gbIconInkSoundOff: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_soundOff.png', import.meta.url).href, preload: true },
	gbIconInkAutoSpin: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_autoSpin.png', import.meta.url).href, preload: true },
	gbIconInkReplay: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_replay.png', import.meta.url).href, preload: true },
	gbIconInkIncrease: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_increase.png', import.meta.url).href, preload: true },
	gbIconInkDecrease: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaUiIconsInk/ink_decrease.png', import.meta.url).href, preload: true },
	gbUiBuyBonusShuriken: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_shuriken.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusShurikenLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_shuriken_lit.png', import.meta.url).href,
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
	// The reel's static tiles (H1-H4, S, L1-L5 and their split twins) are the
	// mesh acts' own plate + subject composited (design/build_static_from_layers.py),
	// so a cell swapping between its sprite and its landing/idle act shows the
	// same picture. Source paintings remain in goBananasSymbolsV3.
	gbH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/h1.png', import.meta.url).href,
		preload: true,
	},
	gbH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/h2.png', import.meta.url).href,
		preload: true,
	},
	// The grenade PROP — a transparent cut-out, deliberately not gbH2.
	//
	// The transition drop and the win-line runners both draw a grenade over the
	// live board, and both used gbH2. In gen-2 that symbol is an opaque riveted
	// plate, so what actually fell down the screen was a tile complete with bezel
	// and rivets. See design/generate_symbols_gen2.mjs for where this is cut.
	gbGrenade: {
		type: 'sprite',
		// the ninja's SMOKE BOMB (design/make_bomb_prop.py), not the inherited
		// pineapple grenade; the key keeps its old name so its users need no change
		src: new URL('../../assets/sprites/goBananinjaMesh/bomb_prop.png', import.meta.url).href,
		preload: true,
	},
	gbH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/h3.png', import.meta.url).href,
		preload: true,
	},
	gbH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/h4.png', import.meta.url).href,
		preload: true,
	},
	gbL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/l1.png', import.meta.url).href,
		preload: true,
	},
	gbL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/l2.png', import.meta.url).href,
		preload: true,
	},
	gbL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/l3.png', import.meta.url).href,
		preload: true,
	},
	gbL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/l4.png', import.meta.url).href,
		preload: true,
	},
	gbL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/l5.png', import.meta.url).href,
		preload: true,
	},
	gbW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/w.png', import.meta.url).href,
		preload: true,
	},
	// Each cut cell contains two complete motifs on one tile: upper-left and lower-right.
	gbH1Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/h1_split.png', import.meta.url).href, preload: true },
	gbH2Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/h2_split.png', import.meta.url).href, preload: true },
	gbH3Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/h3_split.png', import.meta.url).href, preload: true },
	gbH4Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/h4_split.png', import.meta.url).href, preload: true },
	gbL1Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/l1_split.png', import.meta.url).href, preload: true },
	gbL2Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/l2_split.png', import.meta.url).href, preload: true },
	gbL3Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/l3_split.png', import.meta.url).href, preload: true },
	gbL4Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/l4_split.png', import.meta.url).href, preload: true },
	gbL5Split: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaStatic/l5_split.png', import.meta.url).href, preload: true },
	gbWSplit: { type: 'sprite', src: new URL('../../assets/sprites/goBananasSymbolsV3/w_split.png', import.meta.url).href, preload: true },

	// THE MESH WINS' LAYERS (design/make_symbol_layers.py): each winning symbol
	// split into the slate with the subject lifted off it, the subject, its soft
	// shadow and a baked light sweep; the Wild (panel mode) only needs its glow
	// and sweep. Preloaded: a symbol's win, landing and idle all draw from them.
	gbH1Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1_plate.png', import.meta.url).href, preload: true },
	gbH1Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1_subject.png', import.meta.url).href, preload: true },
	gbH1Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1_shadow.png', import.meta.url).href, preload: true },
	gbH1Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1_sheen.png', import.meta.url).href, preload: true },
	gbH2Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2_plate.png', import.meta.url).href, preload: true },
	gbH2Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2_subject.png', import.meta.url).href, preload: true },
	gbH2Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2_shadow.png', import.meta.url).href, preload: true },
	gbH2Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2_sheen.png', import.meta.url).href, preload: true },
	gbH3Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3_plate.png', import.meta.url).href, preload: true },
	gbH3Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3_subject.png', import.meta.url).href, preload: true },
	gbH3Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3_shadow.png', import.meta.url).href, preload: true },
	gbH3Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3_sheen.png', import.meta.url).href, preload: true },
	gbH4Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4_plate.png', import.meta.url).href, preload: true },
	gbH4Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4_subject.png', import.meta.url).href, preload: true },
	gbH4Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4_shadow.png', import.meta.url).href, preload: true },
	gbH4Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4_sheen.png', import.meta.url).href, preload: true },
	gbSPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/s_plate.png', import.meta.url).href, preload: true },
	gbSSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/s_subject.png', import.meta.url).href, preload: true },
	gbSShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/s_shadow.png', import.meta.url).href, preload: true },
	gbSSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/s_sheen.png', import.meta.url).href, preload: true },
	gbL1Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1_plate.png', import.meta.url).href, preload: true },
	gbL1Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1_subject.png', import.meta.url).href, preload: true },
	gbL1Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1_shadow.png', import.meta.url).href, preload: true },
	gbL1Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1_sheen.png', import.meta.url).href, preload: true },
	gbL2Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2_plate.png', import.meta.url).href, preload: true },
	gbL2Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2_subject.png', import.meta.url).href, preload: true },
	gbL2Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2_shadow.png', import.meta.url).href, preload: true },
	gbL2Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2_sheen.png', import.meta.url).href, preload: true },
	gbL3Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3_plate.png', import.meta.url).href, preload: true },
	gbL3Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3_subject.png', import.meta.url).href, preload: true },
	gbL3Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3_shadow.png', import.meta.url).href, preload: true },
	gbL3Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3_sheen.png', import.meta.url).href, preload: true },
	gbL4Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4_plate.png', import.meta.url).href, preload: true },
	gbL4Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4_subject.png', import.meta.url).href, preload: true },
	gbL4Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4_shadow.png', import.meta.url).href, preload: true },
	gbL4Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4_sheen.png', import.meta.url).href, preload: true },
	gbL5Plate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5_plate.png', import.meta.url).href, preload: true },
	gbL5Subject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5_subject.png', import.meta.url).href, preload: true },
	gbL5Shadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5_shadow.png', import.meta.url).href, preload: true },
	gbL5Sheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5_sheen.png', import.meta.url).href, preload: true },
	gbWGlow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/w_glow.png', import.meta.url).href, preload: true },
	gbWSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/w_sheen.png', import.meta.url).href, preload: true },

	// the split tiles' layers (the katana's cut cell, splitRig.ts)
	gbH1SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1s_plate.png', import.meta.url).href, preload: true },
	gbH1SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1s_subject.png', import.meta.url).href, preload: true },
	gbH1SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1s_shadow.png', import.meta.url).href, preload: true },
	gbH1SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h1s_sheen.png', import.meta.url).href, preload: true },
	gbH2SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2s_plate.png', import.meta.url).href, preload: true },
	gbH2SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2s_subject.png', import.meta.url).href, preload: true },
	gbH2SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2s_shadow.png', import.meta.url).href, preload: true },
	gbH2SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h2s_sheen.png', import.meta.url).href, preload: true },
	gbH3SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3s_plate.png', import.meta.url).href, preload: true },
	gbH3SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3s_subject.png', import.meta.url).href, preload: true },
	gbH3SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3s_shadow.png', import.meta.url).href, preload: true },
	gbH3SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h3s_sheen.png', import.meta.url).href, preload: true },
	gbH4SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4s_plate.png', import.meta.url).href, preload: true },
	gbH4SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4s_subject.png', import.meta.url).href, preload: true },
	gbH4SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4s_shadow.png', import.meta.url).href, preload: true },
	gbH4SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/h4s_sheen.png', import.meta.url).href, preload: true },
	gbL1SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1s_plate.png', import.meta.url).href, preload: true },
	gbL1SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1s_subject.png', import.meta.url).href, preload: true },
	gbL1SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1s_shadow.png', import.meta.url).href, preload: true },
	gbL1SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l1s_sheen.png', import.meta.url).href, preload: true },
	gbL2SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2s_plate.png', import.meta.url).href, preload: true },
	gbL2SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2s_subject.png', import.meta.url).href, preload: true },
	gbL2SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2s_shadow.png', import.meta.url).href, preload: true },
	gbL2SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l2s_sheen.png', import.meta.url).href, preload: true },
	gbL3SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3s_plate.png', import.meta.url).href, preload: true },
	gbL3SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3s_subject.png', import.meta.url).href, preload: true },
	gbL3SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3s_shadow.png', import.meta.url).href, preload: true },
	gbL3SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l3s_sheen.png', import.meta.url).href, preload: true },
	gbL4SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4s_plate.png', import.meta.url).href, preload: true },
	gbL4SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4s_subject.png', import.meta.url).href, preload: true },
	gbL4SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4s_shadow.png', import.meta.url).href, preload: true },
	gbL4SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l4s_sheen.png', import.meta.url).href, preload: true },
	gbL5SPlate: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5s_plate.png', import.meta.url).href, preload: true },
	gbL5SSubject: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5s_subject.png', import.meta.url).href, preload: true },
	gbL5SShadow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5s_shadow.png', import.meta.url).href, preload: true },
	gbL5SSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/l5s_sheen.png', import.meta.url).href, preload: true },
	gbWSGlow: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/ws_glow.png', import.meta.url).href, preload: true },
	gbWSSheen: { type: 'sprite', src: new URL('../../assets/sprites/goBananinjaMesh/ws_sheen.png', import.meta.url).href, preload: true },

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

	// the PLATFORM bar's icons (GoBananasBoat / GoBananubis): flat white with a
	// thin dark contour, the same shapes as the brass set — so every button on
	// the bar, Auto Spin included, matches the rest of the family
	gbIconMonoMenu: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/menu.png', import.meta.url).href, preload: true },
	gbIconMonoMenuExit: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/menuExit.png', import.meta.url).href, preload: true },
	gbIconMonoSettings: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/settings.png', import.meta.url).href, preload: true },
	gbIconMonoInfo: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/info.png', import.meta.url).href, preload: true },
	gbIconMonoPayTable: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/payTable.png', import.meta.url).href, preload: true },
	gbIconMonoSoundOn: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/soundOn.png', import.meta.url).href, preload: true },
	gbIconMonoSoundOff: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/soundOff.png', import.meta.url).href, preload: true },
	gbIconMonoAutoSpin: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/autoSpin.png', import.meta.url).href, preload: true },
	gbIconMonoReplay: { type: 'sprite', src: new URL('../../assets/sprites/goBananasUiIconsMono/replay.png', import.meta.url).href, preload: true },

	gbS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananinjaStatic/s.png', import.meta.url).href,
		preload: true,
	},
	// The Machete. Delta-only — gen-1 and gen-2 had no such symbol.
	gbM: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/m.png', import.meta.url).href,
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
	// Shinobi outfit painted onto Boom's PSD cutouts and original 25-bone rig.
	gbNinjaPuppet: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananinjaMascot/ninja.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananinjaMascot/ninja.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Go Bananas jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	gbBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_base.jpg', import.meta.url).href,
		preload: true,
	},
	gbBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_feature.jpg', import.meta.url).href,
		preload: true,
	},
	gbBgSuperspin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_superspin.jpg', import.meta.url).href,
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
	// Black throwing stars (2026-10-23, design/pack_shuriken_particles.py): the
	// H2 symbol's star, blackened, in the banana sheet's format and cell size.
	// The bananas (goBananasWinBananas, design/pack_banana_particles.mjs) are
	// still on disk if they are ever wanted back: point this key at them.
	winShuriken: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/goBananinjaWinShuriken/shuriken.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
