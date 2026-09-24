export default {
	// jungle-military riveted reel frame (SVG-generated ??see design/generate_theme_jungle.mjs)
	hmFrameBg: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBoardFrame/frame_bg.png', import.meta.url).href,
		preload: true,
	},
	hmFrameEdge: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBoardFrame/frame_edge.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures (design/generate_fx_textures.mjs) — every particle
	// in the game is one of these, tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	// Side-profile car for the scene transition (design/build_transition_car.py).
	// The car SYMBOL is three-quarter front-on — the angle that reads in a reel
	// cell — and slid sideways it looks like a car pointing at you being dragged.
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
	hmUiTicker: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUi/ticker_plate.png', import.meta.url).href,
		preload: true,
	},
	hmUiBuyBonus: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUi/buybonus_plate.png', import.meta.url).href,
		preload: true,
	},
	capoUiButton: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUi/button_plate.png', import.meta.url).href,
		preload: true,
	},
	capoUiSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUi/spin_plate.png', import.meta.url).href,
		preload: true,
	},
	// brass win-tier plaques (design/generate_win_banners.mjs)
	hmWinBannerBig: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeWinBanners/big.png', import.meta.url).href,
	},
	hmWinBannerSuperwin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeWinBanners/superwin.png', import.meta.url).href,
	},
	hmWinBannerMega: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeWinBanners/mega.png', import.meta.url).href,
	},
	hmWinBannerEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeWinBanners/epic.png', import.meta.url).href,
	},
	hmWinBannerMax: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeWinBanners/max.png', import.meta.url).href,
	},
	// jungle-military plank sign for the free-spin intro/outro boards and the
	// counter plaque (text is drawn by the frontend — language-neutral art)
	hmFsSign: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBoardFrame/fs_sign.png', import.meta.url).href,
	},
	hmFsPanel: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBoardFrame/fs_counter_panel.png', import.meta.url).href,
	},
	// Hot Miami symbol art (SVG-generated PNGs ??see design/generate_art.mjs)
	hmH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/h1.png', import.meta.url).href,
		preload: true,
	},
	hmH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/h2.png', import.meta.url).href,
		preload: true,
	},
	hmH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/h3.png', import.meta.url).href,
		preload: true,
	},
	hmH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/h4.png', import.meta.url).href,
		preload: true,
	},
	// H4 rigged parts (design/source/parts/h4, keyed by
	// design/process_source_parts.py). The flat hmH4 is still the symbol's own
	// asset and still ships — the reel draws the stack only where a rig exists,
	// and the flat one is the fallback everywhere else.
	// Rigged parts for the other layered symbols (same pipeline as hmH4*).
// hotMiamiParts/* are NOT preloaded.
//
// They belong to the part-based symbol rigs, which are disabled (see
// game/symbolParts.ts: the art depicts Hot Miami's cast, not this game's
// symbols). Nothing draws them, but `preload: true` still fetched all 5.4MB at
// boot — a download every player paid for and never saw. The entries stay so
// the rig definitions keep resolving; only the eager fetch is gone.
	// Expression swaps: a second drawing of the same part, shown for a beat.
	hmL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/l1.png', import.meta.url).href,
		preload: true,
	},
	hmL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/l2.png', import.meta.url).href,
		preload: true,
	},
	hmL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/l3.png', import.meta.url).href,
		preload: true,
	},
	hmL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/l4.png', import.meta.url).href,
		preload: true,
	},
	hmH5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/h5.png', import.meta.url).href,
		preload: true,
	},
	// The Tommy Gun expanding wild specified by the Capo Nostra art brief.
	hmSw: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/sw.png', import.meta.url).href,
		preload: true,
	},
	hmFrame1x1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeFx/lit_cell_frame.png', import.meta.url).href,
		preload: true,
	},
	hmFrameEdge1x1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeFx/lit_cell_frame.png', import.meta.url).href,
	},
	capoSwBeam: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeFx/searchlight_beam.png', import.meta.url).href,
		preload: true,
	},
	// Vault doors for the free-game transition. Two halves plus a dial that turns
	// on its own — see components/TransitionAnimation.svelte and ART_BRIEF §4.5.
	// The Buy Bonus card frame. Referenced from ModalBuyBonus's CSS through the
	// `src()` helper rather than drawn by Pixi, so it is an SVG: the card is
	// responsive and border-image scales a vector cleanly at any size.
	capoBuyCardFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUi/buy_card_frame.svg', import.meta.url).href,
	},
	hmLogo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBrand/logo.png', import.meta.url).href,
		preload: true,
	},
	hmW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/w.png', import.meta.url).href,
		preload: true,
	},

	// The three feature titles, drawn as wordmarks rather than typeset.
	//
	// These replace four stacked pixi Texts that imitated the same thing — black
	// outline, a lit rim in the tier's colour, a dark face. The imitation was as
	// close as Text gets and it was still typography: the drawn versions carry
	// letterforms that are not in either shipped face, a diagonal streak across
	// each face, and a glow that falls off properly instead of being a sprite
	// behind the word. Same reason the symbols are art and not shapes.
	//
	// 1024x360, ink centred in the canvas, so all three drop in at one size.
	// The three feature wordmarks. FreeSpinIntro reaches these through
	// `tier.titleKey` (featureTiers.ts), which is a VARIABLE — so neither
	// check_sprite_keys.mjs nor check_assets_exist.mjs can see the reference, and
	// the tiers were renamed to soldier/capo/don while these three entries still
	// carried the Hot Miami names. The art was on disk the whole time; the splash
	// simply had no key to resolve. If a tier is ever renamed again, this block
	// and featureTiers.ts have to move together, and nothing will warn you.
	hmTitleLockdown: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSplash/title_lockdown.png', import.meta.url).href,
	},
	hmTitleRiot: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSplash/title_riot.png', import.meta.url).href,
	},
	hmTitleBreakout: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSplash/title_breakout.png', import.meta.url).href,
	},

	// Pose sheets: three more DRAWINGS of a symbol, played as a timeline inside
	// the win hold (game/posePlan.ts). Only h1 and h2 have them — the other four
	// symbols' sheets arrived as shapes pasted onto the base art and were refused,
	// so those symbols keep the transform-only win motion they already had.
	//
	// Whole-symbol images, not parts: a pose changes the silhouette, which is the
	// one thing the rigged stack cannot do.

	// The cast standing beside the board. Split out of the store tile's two-figure
	// cut-out by design/build_cast_figures.py, using the same measured polygon the
	// intro card clips with. Not preloaded: they are decoration on a board that is
	// already playable without them.
	// Preloaded, unlike most decoration: the LOADING SCREEN draws them, so they
	// have to be there before the thing that reports them being there. Two small
	// PNGs (266x819 and 224x775) against a 32MB bundle.
	// The non-mesh fallback. Cast.svelte sets USE_MESH_CAST = true so this path
	// never renders today, but it pointed at Capo Nostra's suited boss — so the
	// one line that would matter if the mesh path were ever turned off was the
	// wrong man entirely.
	hmCastGuy: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeCast/prisoner.png', import.meta.url).href,
		preload: true,
	},
	hmCastGuyMesh: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeCast/prisoner.png', import.meta.url).href,
		preload: true,
	},

	// No Spine cast. The two Spine rigs that sat here (hmCastGuySpine /
	// hmCastGirlSpine, Hot Miami's man and woman) were registered with
	// `preload: true` and loaded on every boot, but nothing mounted
	// CastFigureSpine — Cast.svelte renders the mesh rig (USE_MESH_CAST). 5.4MB
	// fetched to draw nothing; removed 2026-09-15 along with the folders.

	// bet-bar button icons (design/generate_ui_icons.mjs) — brass drawn icons
	// replacing the template's text/emoji glyphs
	hmIconMenu: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/menu.png', import.meta.url).href,
		preload: true,
	},
	hmIconMenuExit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/menuExit.png', import.meta.url).href,
		preload: true,
	},
	hmIconSettings: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/settings.png', import.meta.url).href,
		preload: true,
	},
	hmIconInfo: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/info.png', import.meta.url).href,
		preload: true,
	},
	hmIconPayTable: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/payTable.png', import.meta.url).href,
		preload: true,
	},
	hmIconSoundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/soundOn.png', import.meta.url).href,
		preload: true,
	},
	hmIconSoundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/soundOff.png', import.meta.url).href,
		preload: true,
	},
	hmIconAutoSpin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/autoSpin.png', import.meta.url).href,
		preload: true,
	},
	// The stake steppers. capoUiIcons/increase.png and decrease.png have been on
	// disk in the game's own gold (#C9A227, sampled) since the icon set was drawn,
	// and were the only two of the twelve never registered — so those two controls
	// alone fell through to UiButton's '+' / '−' text glyphs, set in whatever the
	// bar's font happened to be. That was survivable while the bar was Titan One,
	// whose plus is a fat slab. It stopped being survivable when the bar moved to
	// Cinzel: a Roman inscriptional face draws a hairline plus, and at stepper size
	// on a dark disc it is close to invisible.
	hmIconIncrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/increase.png', import.meta.url).href,
		preload: true,
	},
	hmIconDecrease: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeUiIcons/decrease.png', import.meta.url).href,
		preload: true,
	},

	// The full-reel WILD banner as a plain sprite. Same file the wx spine uses,
	// so it costs no extra download — ExpandingWilds draws it behind a growing
	// mask to unroll the banner down the reel instead of hard-cutting to it.
	hmS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeSymbols/fs.png', import.meta.url).href,
		preload: true,
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	// Hot Miami jungle backgrounds (SVG-generated ??see design/generate_art.mjs)
	hmBgBase: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBackground/bg_base.jpg', import.meta.url).href,
		preload: true,
	},
	// The near-camera band of each background (design/build_background_layers.py):
	// the right 36%, drawn back over the plate at a larger drift so the deck in
	// the foreground travels further than the city behind it.
	hmBgFeature: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBackground/bg_lockdown.jpg', import.meta.url).href,
		preload: true,
	},
	hmBgRiot: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBackground/bg_riot.jpg', import.meta.url).href,
		preload: true,
	},
	hmBgEpic: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hardTimeBackground/bg_breakout.jpg', import.meta.url).href,
		preload: true,
	},
	// Drawn by design/build_coin_sheet.py. Replaces SD2_Coin.json/.png, a
	// TexturePacker sheet carried over from a template — 2.5MB of 684px frames
	// for a particle a few dozen pixels across, under a filename that names
	// someone else's game. Same twelve-frame spin, same frame names, 88KB.
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/coin.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
} as const;
