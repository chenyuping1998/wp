export default {
	// jungle-military riveted reel frame (SVG-generated ??see design/generate_theme_jungle.mjs)
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	gbUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	// the printed bet bar (design/build_print_bar.py) — the 'print' skin
	gbUiBarStrip: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftUi/bar_strip.png', import.meta.url).href,
		preload: true,
	},
	gbUiButtonPrint: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftUi/button_print.png', import.meta.url).href,
		preload: true,
	},
	gbUiButtonPrintOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftUi/button_print_on.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// The platform skin's Buy Bonus: a slab of the royals' stone, and the same
	// slab splitting for the hover layer. See design/generate_ui_plates.mjs.
	gbUiBuyBonusStone: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// hover: same slab, green ink re-inked red (design/build_buybonus_lit.py)
	gbUiBuyBonusStoneLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftUi/buybonus_plate_lit.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	gbWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftWinBanners/big.png', import.meta.url).href,
	},
	gbWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftWinBanners/superwin.png', import.meta.url).href,
	},
	gbWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftWinBanners/mega.png', import.meta.url).href,
	},
	gbWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftWinBanners/epic.png', import.meta.url).href,
	},
	gbWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftWinBanners/max.png', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	gbFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftScene/fs_plate.png', import.meta.url).href,
	},
	// the transition's roller shutter (TransitionAnimation.svelte)
	gbH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/h1.png', import.meta.url).href + '?v=45926da73d',
		preload: true,
	},
	gbH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/h2.png', import.meta.url).href + '?v=2a122f79c3',
		preload: true,
	},
	// The dynamite PROP — a transparent cut-out, deliberately not gbH2.
	//
	gbH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/h3.png', import.meta.url).href + '?v=15b2a393ed',
		preload: true,
	},
	gbH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/h4.png', import.meta.url).href + '?v=e512a4924f',
		preload: true,
	},
	gbL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/l1.png', import.meta.url).href + '?v=6d0a251579',
		preload: true,
	},
	gbL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/l2.png', import.meta.url).href + '?v=dbb77fe47e',
		preload: true,
	},
	gbL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/l3.png', import.meta.url).href + '?v=f8df681cd4',
		preload: true,
	},
	gbL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/l4.png', import.meta.url).href + '?v=135dff0364',
		preload: true,
	},
	gbL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/l5.png', import.meta.url).href + '?v=532a9ac5d2',
		preload: true,
	},
	gbW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/w.png', import.meta.url).href + '?v=27d0558470',
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	gbIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	gbIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	gbIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	gbIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/info.png', import.meta.url).href,
		preload: true,
	},
	gbIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	gbIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	gbIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	gbIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// only ever drawn in replay mode, but the bet bar's icons are all preloaded
	// together and one 256px sprite is not worth a separate loading path
	gbIconReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/replay.png', import.meta.url).href,
		preload: true,
	},

	// PNGs of flat white line art, ~4KB each.
	//
	// Generated from the SAME shapes as the brass set — see design/generate_ui_icons.mjs,
	// which renders both palettes in one pass so the two can never drift apart.
	gbIconMonoMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/info.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftIcons/replay.png', import.meta.url).href,
		preload: true,
	},

	gbS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/s.png', import.meta.url).href + '?v=a2f3ac528e',
		preload: true,
	},
	gbP: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftSymbolsInk/p.png', import.meta.url).href + '?v=ff7fd0cfeb',
		preload: true,
	},
	// The two cast figures as cut-out Spine rigs (2026-10-21), from the ink art in
	// sprites/staticShiftCastInk/ (still the source; no longer loaded itself): design/cut_cast_layers.py
	// cuts the ink art into 12 pieces, design/generate_cast_spine.mjs builds the
	// skeleton and the #7 motion set (idle, nod, cheer, chestbeat, alert, glance…).
	// They replace the single-mesh head slide the user called 「只是身體伸縮」.
	ssSpineDJ: { type: 'spine', src: { atlas: new URL('../../assets/spines/staticShiftDJ/cast.atlas', import.meta.url).href, skeleton: new URL('../../assets/spines/staticShiftDJ/cast.json', import.meta.url).href, scale: 1 } },
	ssSpineHost: { type: 'spine', src: { atlas: new URL('../../assets/spines/staticShiftHost/cast.atlas', import.meta.url).href, skeleton: new URL('../../assets/spines/staticShiftHost/cast.json', import.meta.url).href, scale: 1 } },
	ssPigeon: { type: 'sprite', src: new URL('../../assets/sprites/staticShiftCastInk/pigeon.png', import.meta.url).href + '?v=eb704e4f42', preload: true },
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Go Bananas jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	gbBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftBackgroundInk/bg_base.png', import.meta.url).href + '?v=1d95f604de',
		preload: true,
	},
	gbBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/staticShiftBackgroundInk/bg_feature.png', import.meta.url).href + '?v=1d95f604de',
		preload: true,
	},
	// Win-spray particles. The emitter is handed this whole sheet and gives each
	// particle one random frame out of it, so the ten frames are ten viewing
	// angles of the same banana rather than an animation — see
	// design/pack_banana_particles.mjs.
	//
	// It replaces `coins`, which was SD2_Coin: a Japanese five-yen piece with a
	// Shiba Inu on it, left over from the template this game started from and
	// about as far from a jungle-commando theme as an asset can get.
	ssConfetti: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/staticShiftConfetti/confetti.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
