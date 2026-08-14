// Nothing in this game is Spine any more.
//
// Four skeletons shipped here from the Stake sample game — `explosion`,
// `anticipation`, `reelhouse` and the coin sheet — and between them they covered
// the most frequently seen animation in Ember Forge (a cluster clearing), the
// board's glow, and the big-win celebration. They were somebody else's art, in
// somebody else's palette, over a forge. All four are now drawn from this game's
// own FX textures; see SymbolShatter, BoardFrame and WinCoins.
export default {
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
	// The fire in the painted scene, as a twelve-frame loop
	// (design/generate_lava_flow.mjs). LavaFlow cross-fades through these
	// additively over bg_background.png; see that component for why the motion is
	// baked into frames rather than scrolled through a mask at runtime.
	//
	// Listed one by one rather than built in a loop: check_assets.mjs reads this
	// file statically and is blind to a computed key, and twelve silently missing
	// textures would be a scene that simply stops burning.
	//
	// Preloaded — they are on screen from the first frame, and popping them in a
	// beat late would be the room catching fire after the player arrives.
	efFlow00: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_00.png', import.meta.url).href }, // prettier-ignore
	efFlow01: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_01.png', import.meta.url).href }, // prettier-ignore
	efFlow02: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_02.png', import.meta.url).href }, // prettier-ignore
	efFlow03: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_03.png', import.meta.url).href }, // prettier-ignore
	efFlow04: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_04.png', import.meta.url).href }, // prettier-ignore
	efFlow05: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_05.png', import.meta.url).href }, // prettier-ignore
	efFlow06: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_06.png', import.meta.url).href }, // prettier-ignore
	efFlow07: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_07.png', import.meta.url).href }, // prettier-ignore
	efFlow08: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_08.png', import.meta.url).href }, // prettier-ignore
	efFlow09: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_09.png', import.meta.url).href }, // prettier-ignore
	efFlow10: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_10.png', import.meta.url).href }, // prettier-ignore
	efFlow11: { type: 'sprite', preload: true, src: new URL('../../assets/sprites/emberForgeFx/flow/heat_flow_11.png', import.meta.url).href }, // prettier-ignore
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
} as const;
