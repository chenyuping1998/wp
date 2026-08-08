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
		src: new URL('../../assets/sprites/crusherYardFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardFx/fx_leaf.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed cast iron
	// matching the reel housing
	cyUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	cyUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	cyWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardWinBanners/big.png', import.meta.url).href,
	},
	cyWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardWinBanners/superwin.png', import.meta.url).href,
	},
	cyWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardWinBanners/mega.png', import.meta.url).href,
	},
	cyWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardWinBanners/epic.png', import.meta.url).href,
	},
	cyWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardWinBanners/max.png', import.meta.url).href,
	},
	// Supplied art: the plaque the free-game intro and outro boards are drawn on.
	// Replaced the generated iron sign. Text is still drawn by the frontend, so the
	// art stays language-neutral — see FreeSpinAnimation for the interior it sits in.
	cyFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardFrame/fs_sign.png', import.meta.url).href,
	},
	cyFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Symbol art. Supplied artwork is cut out and squared into this directory by
	// design/process_symbols.mjs; design/generate_symbol_placeholders.mjs fills it
	// with legible stand-ins until that artwork lands.
	cyH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	cyH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	cyH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	cyH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	cyL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	cyL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	cyL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	cyL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	// The Nitrogen Tank. There is no W in this game — see games/CrusherYard/readme.txt.
	cyM: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/m.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	cyIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	cyIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	cyIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	cyIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	cyIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	cyIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	cyIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	cyIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},

	cyS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/crusherYardSymbols/s.png', import.meta.url).href,
		preload: true,
	},
	// Painted forge scene WITH the reel frame built into it — the board shows
	// through the black opening. Supplied art, not generated, and now the ONLY
	// room art in the game: it replaced the generated bg_base/bg_feature pair and
	// the frame_bg/frame_edge housing, which design/generate_theme_yard.mjs can
	// still re-emit if this ever needs to be rolled back.
	cyScene: {
		type: 'sprite',
		src: new URL(
			'../../assets/sprites/crusherYardBackground/bg_background.png',
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
