export default {
	explosion: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols3/symbols3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols3/explosion.json', import.meta.url).href,
			scale: 2,
		},
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeFx/fx_leaf.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed cast iron
	// matching the reel housing
	efUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	efUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	efWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeWinBanners/big.png', import.meta.url).href,
	},
	efWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeWinBanners/superwin.png', import.meta.url).href,
	},
	efWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeWinBanners/mega.png', import.meta.url).href,
	},
	efWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeWinBanners/epic.png', import.meta.url).href,
	},
	efWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeWinBanners/max.png', import.meta.url).href,
	},
	// Supplied art: the plaque the free-game intro and outro boards are drawn on.
	// Replaced the generated iron sign. Text is still drawn by the frontend, so the
	// art stays language-neutral — see FreeSpinAnimation for the interior it sits in.
	efFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeFrame/fs_sign.png', import.meta.url).href,
	},
	efFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Ember Forge symbol art (design/generate_symbols_forge.mjs)
	efH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	efH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	efH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	efH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	efL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	efL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	efL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	efL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	efW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/w.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	efIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	efIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	efIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	efIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	efIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	efIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	efIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	efIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},

	efS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/emberForgeSymbols/s.png', import.meta.url).href,
		preload: true,
	},
	// Painted forge scene WITH the reel frame built into it — the board shows
	// through the black opening. Supplied art, not generated, and now the ONLY
	// room art in the game: it replaced the generated bg_base/bg_feature pair and
	// the frame_bg/frame_edge housing, which design/generate_theme_forge.mjs can
	// still re-emit if this ever needs to be rolled back.
	efScene: {
		type: 'sprite',
		src: new URL(
			'../../assets/sprites/emberForgeBackground/bg_background.png',
			import.meta.url,
		).href,
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
