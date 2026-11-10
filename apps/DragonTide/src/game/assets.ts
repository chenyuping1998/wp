// Approved-style imagegen art: symbols, background, character, UI and brand.
// Character poses are evaluated by the app-owned Spine 4.3 renderer.
// Paths stay literal: Vite only bundles new URL() with a static string.

export default {
	// Dragon Tide: r12 cast, H1-H4 v3, backdrops v2, and the gen-order-1109 delivery
	// (UI, panels, pearls, L1-L5, S, banners, cards, backdrop props) cut and registered by
	// design/art1109/build_final_art.py into dragonArt/ + dragonSymbols/.
	// r11 cast, packed by design/cast_dragon/build_runtime.py (one 2048 page each)
	dragonKingAtlas: { type:'sprite', src:new URL('../../assets/sprites/dragonCast/mg-atlas.png',import.meta.url).href, preload:true },
	dragonPrincessAtlas: { type:'sprite', src:new URL('../../assets/sprites/dragonCast/fg-atlas.png',import.meta.url).href, preload:true },
	mgLoader: { type:'sprite', src:new URL('../../assets/sprites/dragonArt/loader.png',import.meta.url).href, preload:true },
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

	// tumble splash: eight frames, 256 px each (GoldBurst)
	mgBurstSheet: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/burst_sheet.png', import.meta.url).href, preload: true },
	// backdrop props, moved by backgroundScene (never right of x 1500)
	bgMgWave1: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/mg_wave_1.png', import.meta.url).href, preload: true },
	bgMgWave2: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/mg_wave_2.png', import.meta.url).href, preload: true },
	bgMgWave3: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/mg_wave_3.png', import.meta.url).href, preload: true },
	bgMgLantern: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/mg_lantern.png', import.meta.url).href, preload: true },
	bgMgFish1: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/mg_fish_1.png', import.meta.url).href, preload: true },
	bgMgFish2: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/mg_fish_2.png', import.meta.url).href, preload: true },
	bgMgFish3: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/mg_fish_3.png', import.meta.url).href, preload: true },
	bgFgBubble1: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_1.png', import.meta.url).href, preload: true },
	bgFgBubble2: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_2.png', import.meta.url).href, preload: true },
	bgFgBubble3: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_3.png', import.meta.url).href, preload: true },
	bgFgBubble4: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_4.png', import.meta.url).href, preload: true },
	bgFgBubble5: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_5.png', import.meta.url).href, preload: true },
	bgFgBubble6: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_6.png', import.meta.url).href, preload: true },
	bgFgBubble7: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_7.png', import.meta.url).href, preload: true },
	bgFgBubble8: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_bubble_8.png', import.meta.url).href, preload: true },
	bgFgSeaweed1: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_seaweed_1.png', import.meta.url).href, preload: true },
	bgFgSeaweed2: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_seaweed_2.png', import.meta.url).href, preload: true },
	bgFgSeaweed3: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_seaweed_3.png', import.meta.url).href, preload: true },
	bgFgShaft: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/bg/fg_shaft.png', import.meta.url).href, preload: true },

	// scene
	mgBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonBackground/bg_base.jpg', import.meta.url).href,
		preload: true,
	},
	mgBgFree: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonBackground/bg_free.jpg', import.meta.url).href,
		preload: true,
	},

	// the three loading-screen feature cards (MEDUSA_美術需求單 §6)
	mgIntro1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/intro_1.jpg', import.meta.url).href,
		preload: true,
	},
	mgIntro2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/intro_2.jpg', import.meta.url).href,
		preload: true,
	},
	mgIntro3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/intro_3.jpg', import.meta.url).href,
		preload: true,
	},
	mgLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/logo.png', import.meta.url).href,
		preload: true,
	},

	// bet bar plates and the free-game panels
	mgUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/ticker.png', import.meta.url).href,
		preload: true,
	},
	mgUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/buybonus.png', import.meta.url).href,
		preload: true,
	},
	mgUiBuyBonusLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/buybonus_lit.png', import.meta.url).href,
		preload: true,
	},
	mgUiBarStrip: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/bar_strip.png', import.meta.url).href,
		preload: true,
	},
	mgUiButton: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/button.png', import.meta.url).href,
		preload: true,
	},
	mgUiButtonOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/button_lit.png', import.meta.url).href,
		preload: true,
	},
	mgTotalPlate1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/total_1.png', import.meta.url).href,
		preload: true,
	},
	mgTotalPlate2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/total_2.png', import.meta.url).href,
		preload: true,
	},
	mgTotalPlate3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/total_3.png', import.meta.url).href,
		preload: true,
	},
	mgTotalPlate4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/total_4.png', import.meta.url).href,
		preload: true,
	},
	// board frames, nine-sliced round the 6x5 board (boardFrameScene)
	mgFrameMg: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/frame_mg.png', import.meta.url).href, preload: true },
	mgFrameFg: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/frame_fg.png', import.meta.url).href, preload: true },
	// the whirlpool gates the transitions open (TransitionAnimation)
	mgPortalIn: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/portal_in.png', import.meta.url).href, preload: true },
	mgPortalOut: { type: 'sprite', src: new URL('../../assets/sprites/dragonArt/portal_out.png', import.meta.url).href },
	mgFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/fs_intro.png', import.meta.url).href,
	},
	mgFsSignOut: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/fs_outro.png', import.meta.url).href,
	},
	mgFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/fs_counter.png', import.meta.url).href,
	},

	// dragon pearls: internal keys kept from the template's orb FX
	mgOrbGreen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_t1.png', import.meta.url).href,
		preload: true,
	},
	mgOrbPurple: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_blank.png', import.meta.url).href,
		preload: true,
	},
	mgOrbGold: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_t5.png', import.meta.url).href,
		preload: true,
	},

	// Five pearl tiers, one colour per multiplier band: jade, blue, violet, crimson, prism.
	watchT1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_t1.png', import.meta.url).href,
		preload: true,
	},
	watchT2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_t2.png', import.meta.url).href,
		preload: true,
	},
	watchT3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_t3.png', import.meta.url).href,
		preload: true,
	},
	watchT4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_t4.png', import.meta.url).href,
		preload: true,
	},
	watchT5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/pearl_t5.png', import.meta.url).href,
		preload: true,
	},

	// win-tier plaques
	mgWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/banner_big.png', import.meta.url).href,
	},
	mgWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/banner_superwin.png', import.meta.url).href,
	},
	mgWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/banner_mega.png', import.meta.url).href,
	},
	mgWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/banner_epic.png', import.meta.url).href,
	},
	mgWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/banner_max.png', import.meta.url).href,
	},

	// symbols — no W: a wild in a pay-anywhere game joins every symbol's count at
	// once, so the maths ships none
	mgS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/s.png', import.meta.url).href,
		preload: true,
	},
	mgSOpen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/s_open.png', import.meta.url).href,
		preload: true,
	},
	mgH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	mgH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	mgH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	mgH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	mgL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	mgL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	mgL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	mgL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	mgL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonSymbols/l5.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons in place of the template's text/emoji glyphs
	mgIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/menu.png', import.meta.url).href,
		preload: true,
	},
	mgIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	mgIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/settings.png', import.meta.url).href,
		preload: true,
	},
	mgIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/info.png', import.meta.url).href,
		preload: true,
	},
	mgIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/payTable.png', import.meta.url).href,
		preload: true,
	},
	mgIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	mgIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	mgIconIncrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/increase.png', import.meta.url).href,
		preload: true,
	},
	mgIconDecrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/decrease.png', import.meta.url).href,
		preload: true,
	},
	mgIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/dragonArt/icons/autoSpin.png', import.meta.url).href,
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
