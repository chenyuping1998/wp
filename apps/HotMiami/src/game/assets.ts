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
	hmFrameBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	hmFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFx/fx_leaf.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	hmUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	hmUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	hmWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiWinBanners/big.png', import.meta.url).href,
	},
	hmWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiWinBanners/superwin.png', import.meta.url).href,
	},
	hmWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiWinBanners/mega.png', import.meta.url).href,
	},
	hmWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiWinBanners/epic.png', import.meta.url).href,
	},
	hmWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiWinBanners/max.png', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	hmFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFrame/fs_sign.png', import.meta.url).href,
	},
	hmFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Hot Miami symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	hmH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	hmH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	hmH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	hmH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	hmL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	hmL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	hmL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	hmL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	hmH5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/h5.png', import.meta.url).href,
		preload: true,
	},
	hmC: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/c.png', import.meta.url).href,
		preload: true,
	},
	hmFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/frame.png', import.meta.url).href,
		preload: true,
	},
	hmLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiBrand/logo.png', import.meta.url).href,
		preload: true,
	},
	hmW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/w.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	hmIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	hmIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	hmIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	hmIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	hmIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	hmIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	hmIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	hmIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	hmS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiSymbols/fs.png', import.meta.url).href,
		preload: true,
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Hot Miami jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	hmBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	hmBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiBackground/bg_feature.png', import.meta.url).href,
		preload: true,
	},
	hmBgEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiBackground/bg_epic.png', import.meta.url).href,
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
