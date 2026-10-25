// Approved-style imagegen art: symbols, background, character, UI and brand.
// Character poses are evaluated by the app-owned Spine 4.3 renderer.
// Paths stay literal: Vite only bundles new URL() with a static string.

export default {
	mgLoader: { type:'sprite', src:new URL('../../assets/sprites/medusaBrand/loader.png',import.meta.url).href, preload:true },
	mgCastAtlas: {
		type: 'sprite',
		src: new URL('../../assets/spines/medusa43/medusa.png', import.meta.url).href,
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

	// soft FX textures — every particle in the game is one of these, tinted and
	// usually drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	fxRubble: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_rubble.png', import.meta.url).href,
		preload: true,
	},
	fxCrack1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_crack_1.png', import.meta.url).href,
		preload: true,
	},
	fxCrack2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_crack_2.png', import.meta.url).href,
		preload: true,
	},
	fxCrack3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFx/fx_crack_3.png', import.meta.url).href,
		preload: true,
	},

	// scene
	mgBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaBackground/bg_base.jpg', import.meta.url).href,
		preload: true,
	},
	mgBgFree: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaBackground/bg_free.jpg', import.meta.url).href,
		preload: true,
	},
	mgBgCloud: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaBackground/cloud.png', import.meta.url).href,
		preload: true,
	},
	mgBgTourist: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaBackground/statue_tourist.png', import.meta.url).href,
		preload: true,
	},
	mgBgIcecream: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaBackground/statue_icecream.png', import.meta.url).href,
		preload: true,
	},
	mgBgFlame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaBackground/flame.png', import.meta.url).href,
		preload: true,
	},

	// the three loading-screen feature cards (MEDUSA_美術需求單 §6)
	mgIntro1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaIntro/intro_1.png', import.meta.url).href,
		preload: true,
	},
	mgIntro2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaIntro/intro_2.png', import.meta.url).href,
		preload: true,
	},
	mgIntro3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaIntro/intro_3.png', import.meta.url).href,
		preload: true,
	},
	mgLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaBrand/logo.png', import.meta.url).href,
		preload: true,
	},

	// bet bar plates and the free-game panels
	mgUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	mgUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	mgUiBuyBonusLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/buybonus_plate_lit.png', import.meta.url).href,
		preload: true,
	},
	mgUiBarStrip: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/bar_strip.png', import.meta.url).href,
		preload: true,
	},
	mgUiButton: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/button_disc.png', import.meta.url).href,
		preload: true,
	},
	mgUiButtonOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/button_disc_on.png', import.meta.url).href,
		preload: true,
	},
	mgTotalPlate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/total_plate.png', import.meta.url).href,
		preload: true,
	},
	mgTotalPlateMid: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/total_plate_mid.png', import.meta.url).href,
		preload: true,
	},
	mgTotalPlateHigh: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/total_plate_high.png', import.meta.url).href,
		preload: true,
	},
	mgFrameCapital: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFrame/capital.png', import.meta.url).href,
		preload: true,
	},
	mgFrameLintel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFrame/lintel.png', import.meta.url).href,
		preload: true,
	},
	mgFrameColumn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaFrame/column.png', import.meta.url).href,
		preload: true,
	},
	mgFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/fs_sign.png', import.meta.url).href,
	},
	mgFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUi/fs_counter_panel.png', import.meta.url).href,
	},

	// Medusa's thrown multiplier, coloured by value (MEDUSA_美術需求單 4-1)
	mgOrbGreen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaOrbs/orb_green.png', import.meta.url).href,
		preload: true,
	},
	mgOrbPurple: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaOrbs/orb_purple.png', import.meta.url).href,
		preload: true,
	},
	mgOrbGold: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaOrbs/orb_gold.png', import.meta.url).href,
		preload: true,
	},

	// win-tier plaques
	mgWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaWinBanners/big.png', import.meta.url).href,
	},
	mgWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaWinBanners/superwin.png', import.meta.url).href,
	},
	mgWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaWinBanners/mega.png', import.meta.url).href,
	},
	mgWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaWinBanners/epic.png', import.meta.url).href,
	},
	mgWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaWinBanners/max.png', import.meta.url).href,
	},

	// symbols — no W: a wild in a pay-anywhere game joins every symbol's count at
	// once, so the maths ships none
	mgS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/s.png', import.meta.url).href,
		preload: true,
	},
	mgH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	mgH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	mgH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	mgH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	mgH5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/h5.png', import.meta.url).href,
		preload: true,
	},
	mgL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	mgL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	mgL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	mgL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaSymbols/l4.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons in place of the template's text/emoji glyphs
	mgIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	mgIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	mgIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	mgIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	mgIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	mgIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	mgIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	mgIconIncrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/increase.png', import.meta.url).href,
		preload: true,
	},
	mgIconDecrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/decrease.png', import.meta.url).href,
		preload: true,
	},
	mgIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/medusaUiIcons/autoSpin.png', import.meta.url).href,
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
} as const;
