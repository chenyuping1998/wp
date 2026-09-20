export default {
	// jungle-military riveted reel frame (SVG-generated ??see design/generate_theme_jungle.mjs)
	mooooFrameBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	mooooFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	mooooFxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	mooooFxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	mooooFxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	mooooFxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFx/fx_leaf.png', import.meta.url).href,
		preload: true,
	},
	// Side-on cow for the scene transition (design/build_placeholder_art.py). The
	// cow SYMBOL is three-quarters to camera — the angle at which an opening mouth
	// reads in a reel cell — and slid sideways that would look like a cow facing
	// you being dragged.
	mooooTransitionCow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFx/transition_cow.png', import.meta.url).href,
	},
	mooooFxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	mooooUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	mooooUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	mooooWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooWinBanners/big.png', import.meta.url).href,
	},
	mooooWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooWinBanners/superwin.png', import.meta.url).href,
	},
	mooooWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooWinBanners/mega.png', import.meta.url).href,
	},
	mooooWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooWinBanners/epic.png', import.meta.url).href,
	},
	mooooWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooWinBanners/max.png', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	mooooFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFrame/fs_sign.png', import.meta.url).href,
	},
	mooooFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Moooo symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	mooooH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	mooooH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	mooooH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	mooooH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	mooooL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	mooooL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	mooooL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	mooooL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	mooooH5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/h5.png', import.meta.url).href,
		preload: true,
	},
	mooooM: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/m.png', import.meta.url).href,
		preload: true,
	},
	mooooFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/frame.png', import.meta.url).href,
		preload: true,
	},
	mooooLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooBrand/logo.png', import.meta.url).href,
		preload: true,
	},
	// The cow ships bell-less, plus a separate white bell and an open-mouth
	// state. The bell is tinted per tier at run time (Pixi tint multiplies, so a
	// bell baked gold could never be brass or silver) and the open mouth is
	// swapped in when the reel expands — the mouth opening IS the mechanic's
	// tell, so it cannot be a static symbol.
	mooooWOpen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/w_open.png', import.meta.url).href,
		preload: true,
	},
	mooooBell: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/bell.png', import.meta.url).href,
		preload: true,
	},
	mooooW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/w.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	mooooIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	mooooIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	mooooIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	mooooIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	mooooIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	mooooIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	mooooIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	mooooIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	mooooS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooSymbols/fs.png', import.meta.url).href,
		preload: true,
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Moooo jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	mooooBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	mooooBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooBackground/bg_feature.png', import.meta.url).href,
		preload: true,
	},
	mooooBgSuper: {
		type: 'sprite',
		src: new URL('../../assets/sprites/mooooBackground/bg_super.png', import.meta.url).href,
		preload: true,
	},
	// Big-win rain (design/build_placeholder_art.py). Prize TOKENS, not coins —
	// a rosette is what you actually win at a county fair, and this sheet is
	// drawn here rather than inherited from a starter template. The sibling apps
	// still rain a coin sheet that came in with one; see
	// docs/handoff/moooo_STATE.md for why that matters and what it cost.
	mooooTokens: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/mooooToken/token.json', import.meta.url).href,
	},
	mooooSound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
