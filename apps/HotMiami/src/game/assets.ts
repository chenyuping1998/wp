export default {
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
	// Side-profile car for the scene transition (design/build_transition_car.py).
	// The car SYMBOL is three-quarter front-on — the angle that reads in a reel
	// cell — and slid sideways it looks like a car pointing at you being dragged.
	hmCarSide: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiFx/car_side.png', import.meta.url).href,
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
	// H4 rigged parts (design/source/parts/h4, keyed by
	// design/process_source_parts.py). The flat hmH4 is still the symbol's own
	// asset and still ships — the reel draws the stack only where a rig exists,
	// and the flat one is the fallback everywhere else.
	hmH4Body: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h4/body.png', import.meta.url).href,
		preload: true,
	},
	hmH4SpeakerTop: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h4/speaker_top.png', import.meta.url).href,
		preload: true,
	},
	hmH4SpeakerBottom: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h4/speaker_bottom.png', import.meta.url).href,
		preload: true,
	},
	hmH4Handle: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h4/handle.png', import.meta.url).href,
		preload: true,
	},
	// Rigged parts for the other layered symbols (same pipeline as hmH4*).
	hmH1Torso: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h1/torso.png', import.meta.url).href,
		preload: true,
	},
	hmH1Arm: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h1/arm.png', import.meta.url).href,
		preload: true,
	},
	hmH1Head: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h1/head.png', import.meta.url).href,
		preload: true,
	},
	hmH1Chain: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h1/chain.png', import.meta.url).href,
		preload: true,
	},
	hmH2HairBack: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h2/hair_back.png', import.meta.url).href,
		preload: true,
	},
	hmH2Torso: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h2/torso.png', import.meta.url).href,
		preload: true,
	},
	hmH2Head: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h2/head.png', import.meta.url).href,
		preload: true,
	},
	hmH2HairFront: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h2/hair_front.png', import.meta.url).href,
		preload: true,
	},
	hmH3Body: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h3/body.png', import.meta.url).href,
		preload: true,
	},
	hmH3HeadNeck: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h3/head_neck.png', import.meta.url).href,
		preload: true,
	},
	hmCRing: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/c/ring.png', import.meta.url).href,
		preload: true,
	},
	hmCCore: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/c/core.png', import.meta.url).href,
		preload: true,
	},
	hmH5Body: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h5/body.png', import.meta.url).href,
		preload: true,
	},
	hmH5WheelFront: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h5/wheel_front.png', import.meta.url).href,
		preload: true,
	},
	hmH5WheelRear: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h5/wheel_rear.png', import.meta.url).href,
		preload: true,
	},
	// Expression swaps: a second drawing of the same part, shown for a beat.
	hmH1HeadGrin: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h1/head_grin.png', import.meta.url).href,
		preload: true,
	},
	hmH1HeadShadesDown: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h1/head_shades_down.png', import.meta.url).href,
		preload: true,
	},
	hmH2HeadBlink: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h2/head_blink.png', import.meta.url).href,
		preload: true,
	},
	hmH2HeadSmile: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h2/head_smile.png', import.meta.url).href,
		preload: true,
	},
	hmH2HeadWink: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h2/head_wink.png', import.meta.url).href,
		preload: true,
	},
	hmCCoreActive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/c/core_active.png', import.meta.url).href,
		preload: true,
	},
	hmH3HeadNeckBlink: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h3/head_neck_blink.png', import.meta.url).href,
		preload: true,
	},
	hmH3HeadNeckSquawk: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h3/head_neck_squawk.png', import.meta.url).href,
		preload: true,
	},
	hmH4PanelLit: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h4/panel_lit.png', import.meta.url).href,
		preload: true,
	},
	hmH5LightsOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiParts/h5/lights_on.png', import.meta.url).href,
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

	// The cast standing beside the board. Split out of the store tile's two-figure
	// cut-out by design/build_cast_figures.py, using the same measured polygon the
	// intro card clips with. Not preloaded: they are decoration on a board that is
	// already playable without them.
	hmCastGuy: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiCast/guy.png', import.meta.url).href,
	},
	hmCastGirl: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiCast/girl.png', import.meta.url).href,
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
	// The near-camera band of each background (design/build_background_layers.py):
	// the right 36%, drawn back over the plate at a larger drift so the deck in
	// the foreground travels further than the city behind it.
	hmBgBaseNear: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiBackground/bg_base_near.png', import.meta.url).href,
		preload: true,
	},
	hmBgFeatureNear: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiBackground/bg_feature_near.png', import.meta.url).href,
		preload: true,
	},
	hmBgEpicNear: {
		type: 'sprite',
		src: new URL('../../assets/sprites/hotMiamiBackground/bg_epic_near.png', import.meta.url).href,
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
