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
		src: new URL('../../assets/sprites/soulSealFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	mcFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxTick: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealFx/fx_tick.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	mcUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	// Generated wordmark (design/generate_wordmark.mjs). The title is art, not
	// text: see that script for why it is not another webfont.
	mcWordmark: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUi/wordmark.png', import.meta.url).href,
		preload: true,
	},
	mcUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	mcWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealWinBanners/tier1.png', import.meta.url).href,
	},
	mcWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealWinBanners/tier2.png', import.meta.url).href,
	},
	mcWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealWinBanners/tier3.png', import.meta.url).href,
	},
	mcWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealWinBanners/tier4.png', import.meta.url).href,
	},
	mcWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealWinBanners/tier5.png', import.meta.url).href,
	},
	// The hanging plaque, used at two sizes: large for the free-spin intro, outro
	// and rail milestone cards, small for the counter beside the board. Text is
	// drawn by the frontend, so the art stays language-neutral.
	//
	// `mcFsSign` used to sit here, a second plate the theme generator drew for the
	// large cards. It is gone rather than merely unused - an entry in this map is
	// a file the player downloads before the game starts.
	mcFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealFrame/fs_counter_panel.png', import.meta.url).href,
	},
	mcH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	mcH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	mcH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	mcH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	mcL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	mcL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	mcL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	mcL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	mcL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/l5.png', import.meta.url).href,
		preload: true,
	},
	// The carrier. One symbol in the maths; the value written on its talisman
	// rides in `multiplier` and is drawn over this sprite rather than baked in.
	mcM: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/m.png', import.meta.url).href,
		preload: true,
	},
	mcW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/w.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	// The priestess, for the trigger tease. Written by design/import_cover.mjs
	// from the keyed cover art, downscaled to 560px tall - the full-size cover is
	// 1.5MB and belongs in the store card, not in a preload.
	//
	// NOT preloaded: it is drawn at most once a round, only on a spin that opens
	// the feature, and only on half of those. Preloading a 200KB sprite for that
	// would cost every player the wait for something most sessions never show.
	// The face-on talisman, as a plain sprite. Written by
	// design/generate_talisman_spin.mjs from the same source as the burst sheet,
	// so the slip the rail shows and the slip the burst throws are one object.
	mcTalisman: {
		type: 'sprite',
		src: new URL('../../assets/sprites/talisman/talisman_flat.png', import.meta.url).href,
		preload: true,
	},

	mcPriestess: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUi/priestess.png', import.meta.url).href,
	},

	mcIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	mcIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	mcIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	mcIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	mcIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	mcIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	mcIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	mcIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// only ever drawn in replay mode, but the bet bar's icons are all preloaded
	// together and one 256px sprite is not worth a separate loading path
	mcIconReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealUiIcons/replay.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	mcS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealSymbols/s.png', import.meta.url).href,
		preload: true,
	},
	// feature counter plate
	// Soul Seal backgrounds (SVG-generated - see design/generate_symbols.mjs)
	mcBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	mcBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/soulSealBackground/bg_feature.png', import.meta.url).href,
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
	// The burst particle. Spinning talismans, not coins.
	//
	// Generated by design/generate_talisman_spin.mjs from ONE flat front-facing
	// image: the twelve frames are a rotation about the vertical axis, not twelve
	// drawings, so they are computed rather than drawn. See that script.
	talismans: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/talisman/talisman.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
