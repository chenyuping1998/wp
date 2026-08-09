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
		src: new URL('../../assets/sprites/marginCallFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	mcFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxTick: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFx/fx_tick.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	mcUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	mcUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	mcWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallWinBanners/tier1.png', import.meta.url).href,
	},
	mcWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallWinBanners/tier2.png', import.meta.url).href,
	},
	mcWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallWinBanners/tier3.png', import.meta.url).href,
	},
	mcWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallWinBanners/tier4.png', import.meta.url).href,
	},
	mcWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallWinBanners/tier5.png', import.meta.url).href,
	},
	// feature header plate for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	mcFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFrame/fs_sign.png', import.meta.url).href,
	},
	mcFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Margin Call symbol art (SVG-generated PNGs - see design/generate_symbols.mjs)
	mcH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	mcH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	mcH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	mcH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	mcH5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/h5.png', import.meta.url).href,
		preload: true,
	},
	mcL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	mcL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	mcL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	mcL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	mcW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/w.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	mcIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	mcIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	mcIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	mcIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	mcIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	mcIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	mcIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	mcIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// only ever drawn in replay mode, but the bet bar's icons are all preloaded
	// together and one 256px sprite is not worth a separate loading path
	mcIconReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallUiIcons/replay.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	mcS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallSymbols/s.png', import.meta.url).href,
		preload: true,
	},
	// feature counter plate
	// Margin Call backgrounds (SVG-generated - see design/generate_symbols.mjs)
	mcBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	mcBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/marginCallBackground/bg_feature.png', import.meta.url).href,
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
