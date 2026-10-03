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
	gbFrameBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	gbFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxLeaf: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_leaf.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — ice-framed slate matching
	// the board's own ground (see src/game/palette.ts)
	gbUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	// The Buy Bonus plate the game actually uses, plus the lit copy of its frost
	// crystal for the hover state. `buybonus_plate` above is the same plate with
	// nothing cut into it; it stays loaded so switching back is one line in
	// uiTheme and needs no rebuild.
	gbUiBuyBonusIce: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_ice.png', import.meta.url).href,
		preload: true,
	},
	gbUiBuyBonusLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUi/buybonus_ice_lit.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	gbWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/big.png', import.meta.url).href,
	},
	gbWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/superwin.png', import.meta.url).href,
	},
	gbWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/mega.png', import.meta.url).href,
	},
	gbWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/epic.png', import.meta.url).href,
	},
	gbWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasWinBanners/max.png', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	gbFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/fs_sign.png', import.meta.url).href,
	},
	gbFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Go Bananas symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	gbH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1.png', import.meta.url).href,
		preload: true,
	},

	// THE MESH-WIN LAYERS for the four high pays: the plate with the subject
	// lifted off it, the subject cut out, its drop shadow, and the baked
	// 24-frame light-sweep atlas. Written by design/make_symbol_layers.mjs and
	// drawn by components/SymbolMeshWin.svelte; see game/meshWin/.
	//
	// Preloaded with the symbols themselves: a win is the one moment these are
	// needed, and fetching four textures at that moment would show the swap.
	gbH1Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH1Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH1Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH1Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h1_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH2Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH2Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH2Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH2Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH3Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH3Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH3Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH3Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH4Plate: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_plate.png', import.meta.url).href,
		preload: true,
	},
	gbH4Subject: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_subject.png', import.meta.url).href,
		preload: true,
	},
	gbH4Shadow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_shadow.png', import.meta.url).href,
		preload: true,
	},
	gbH4Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h2.png', import.meta.url).href,
		preload: true,
	},
	// The grenade PROP — a transparent cut-out, deliberately not gbH2.
	//
	// The transition drop and the win-line runners both draw a grenade over the
	// live board, and both used gbH2. In gen-2 that symbol is an opaque riveted
	// plate, so what actually fell down the screen was a tile complete with bezel
	// and rivets. See design/generate_symbols_gen2.mjs for where this is cut.
	gbGrenade: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/grenade.png', import.meta.url).href,
		preload: true,
	},
	gbH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h3.png', import.meta.url).href,
		preload: true,
	},
	gbH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/h4.png', import.meta.url).href,
		preload: true,
	},
	gbL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l1.png', import.meta.url).href,
		preload: true,
	},
	gbL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l2.png', import.meta.url).href,
		preload: true,
	},
	gbL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l3.png', import.meta.url).href,
		preload: true,
	},
	gbL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l4.png', import.meta.url).href,
		preload: true,
	},
	gbL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l5.png', import.meta.url).href,
		preload: true,
	},
	gbW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/w.png', import.meta.url).href,
		preload: true,
	},
	// Panel-mesh win layers for low pays, Wild and Scatter.
	gbL1Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l1_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL1Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l1_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL2Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l2_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL2Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l2_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL3Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l3_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL3Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l3_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL4Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l4_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL4Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l4_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbL5Glow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l5_glow.png', import.meta.url).href,
		preload: true,
	},
	gbL5Sheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/l5_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbWGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/w_glow.png', import.meta.url).href,
		preload: true,
	},
	gbWSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/w_sheen.png', import.meta.url).href,
		preload: true,
	},
	gbSGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/s_glow.png', import.meta.url).href,
		preload: true,
	},
	gbSSheen: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/s_sheen.png', import.meta.url).href,
		preload: true,
	},

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	gbIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	gbIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	gbIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	gbIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	gbIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	gbIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	gbIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	gbIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// only ever drawn in replay mode, but the bet bar's icons are all preloaded
	// together and one 256px sprite is not worth a separate loading path
	gbIconReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIcons/replay.png', import.meta.url).href,
		preload: true,
	},
	// ── the same icons in flat monochrome, for the platform UI skin ──────────
	//
	// A SECOND SET RATHER THAN A TINT, because UiButton draws uiTheme.icons as a
	// plain Sprite with no tint (components-ui-pixi/src/components/UiButton.svelte)
	// — uiTheme.buttonIconFill reaches only the vector-drawn turbo bolt, so on the
	// platform skin every one of the brass icons above stayed gold on a grey strip.
	//
	// Both sets are preloaded and both ship. That is the price of the skin being
	// switchable at run time from localStorage with no rebuild: whichever one
	// uiTheme.icons ends up pointing at has to already be in memory. Nine 256px
	// PNGs of flat white line art, ~4KB each.
	//
	// Generated from the SAME shapes as the brass set — see design/generate_ui_icons.mjs,
	// which renders both palettes in one pass so the two can never drift apart.
	gbIconMonoMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/menu.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/menuExit.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/settings.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/info.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/payTable.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/soundOn.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/soundOff.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	gbIconMonoReplay: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasUiIconsMono/replay.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	gbWxPanel: {
		type: 'sprite',
		src: new URL('../../assets/spines/goBananasSymbolsV3/wx.png', import.meta.url).href,
		preload: true,
	},
	gbS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/s.png', import.meta.url).href,
		preload: true,
	},
	gbX: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/x.png', import.meta.url).href,
		preload: true,
	},
	gbP: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV3/p.png', import.meta.url).href,
		preload: true,
	},
	// The sergeant standing beside the board. Built from the Frostline cutout —
	// see design/slice_frostline_monkey.mjs and design/generate_monkey_spine.mjs.
	gbMonkey: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasMonkey/monkey.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasMonkey/monkey.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/h4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l1.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l2.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l3.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l4.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL5: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/l5.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/l5.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpW: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/w.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/w.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpS: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/s.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/s.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpX: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/x.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/x.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpP: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/p.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/p.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	gbSpWx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV3/wx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV3/wx.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Go Bananas jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	gbBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_base.png', import.meta.url).href,
		preload: true,
	},
	gbBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_feature.png', import.meta.url).href,
		preload: true,
	},
	gbBgSuperspin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasBackground/bg_superspin.png', import.meta.url).href,
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
	// Win-spray particles. The emitter is handed this whole sheet and gives each
	// particle one random frame out of it, so the ten frames are ten viewing
	// angles of the same banana rather than an animation — see
	// design/pack_banana_particles.mjs.
	//
	// It replaces `coins`, which was SD2_Coin: a Japanese five-yen piece with a
	// Shiba Inu on it, left over from the template this game started from and
	// about as far from a jungle-commando theme as an asset can get.
	winBananas: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/goBananasWinBananas/bananas.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
