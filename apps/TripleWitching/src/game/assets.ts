export default {
	explosion: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols3/symbols3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols3/explosion.json', import.meta.url).href,
			scale: 2,
		},
	},
	// riveted reel housing (SVG-generated - see design/generate_theme.mjs)
	mcFrameBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	mcFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxTick: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFx/fx_tick.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	mcUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	// Generated wordmark (design/generate_wordmark.mjs). The title is art, not
	// text: see that script for why it is not another webfont.
	mcWordmark: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUi/wordmark.png', import.meta.url).href,
		preload: true,
	},
	mcUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	mcWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingWinBanners/tier1.png', import.meta.url).href,
	},
	mcWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingWinBanners/tier2.png', import.meta.url).href,
	},
	mcWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingWinBanners/tier3.png', import.meta.url).href,
	},
	mcWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingWinBanners/tier4.png', import.meta.url).href,
	},
	mcWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingWinBanners/tier5.png', import.meta.url).href,
	},
	// feature header plate for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	mcFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFrame/fs_sign.png', import.meta.url).href,
	},
	mcFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Triple Witching symbol art (SVG-generated PNGs - see design/generate_symbols.mjs)
	// Supplied bag art for the three feature modifiers, cut off its dark matte by
	// design/dekey_neon_art.mjs. The originals are in design/source/bags.
	twBagExpand: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingBags/expand.png', import.meta.url).href,
		preload: true,
	},
	twBagMult: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingBags/mult.png', import.meta.url).href,
		preload: true,
	},
	twBagWays: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingBags/ways.png', import.meta.url).href,
		preload: true,
	},
	mcH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	mcH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	mcH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	mcH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	mcH5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/h5.png', import.meta.url).href,
		preload: true,
	},
	mcL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	mcL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	mcL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	mcL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	mcW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/w.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	mcIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	mcIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	mcIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	mcIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	mcIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	mcIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	mcIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	mcIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// only ever drawn in replay mode, but the bet bar's icons are all preloaded
	// together and one 256px sprite is not worth a separate loading path
	mcIconReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingUiIcons/replay.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	mcS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingSymbols/s.png', import.meta.url).href,
		preload: true,
	},
	// feature counter plate
	// Triple Witching backgrounds (SVG-generated - see design/generate_symbols.mjs)
	mcBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	mcBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/tripleWitchingBackground/bg_feature.png', import.meta.url).href,
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
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/SD2_Coin.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
