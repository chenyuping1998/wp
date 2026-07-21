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
	// bet-bar plates (design/generate_ui_plates.mjs) — brass-framed olive canvas
	// matching the reel housing
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
		src: new URL('../../assets/sprites/goBananasSymbolsV2/h1.png', import.meta.url).href,
		preload: true,
	},
	gbH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/h2.png', import.meta.url).href,
		preload: true,
	},
	gbH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/h3.png', import.meta.url).href,
		preload: true,
	},
	gbH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/h4.png', import.meta.url).href,
		preload: true,
	},
	gbL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/l1.png', import.meta.url).href,
		preload: true,
	},
	gbL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/l2.png', import.meta.url).href,
		preload: true,
	},
	gbL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/l3.png', import.meta.url).href,
		preload: true,
	},
	gbL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/l4.png', import.meta.url).href,
		preload: true,
	},
	gbL5: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/l5.png', import.meta.url).href,
		preload: true,
	},
	gbW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/w.png', import.meta.url).href,
		preload: true,
	},
	gbS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/s.png', import.meta.url).href,
		preload: true,
	},
	gbX: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/x.png', import.meta.url).href,
		preload: true,
	},
	gbP: {
		type: 'sprite',
		src: new URL('../../assets/sprites/goBananasSymbolsV2/p.png', import.meta.url).href,
		preload: true,
	},
	gbSpH1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/h1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/h1.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/h2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/h2.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/h3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/h3.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpH4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/h4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/h4.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/l1.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/l1.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/l2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/l2.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/l3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/l3.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/l4.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/l4.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpL5: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/l5.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/l5.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpW: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/w.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/w.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpS: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/s.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/s.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpX: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/x.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/x.json', import.meta.url).href,
			scale: 1,
		},
	},
	gbSpP: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/p.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/p.json', import.meta.url).href,
			scale: 1,
		},
	},
	// Expanding wild: monkey eats a banana and grows to fill the reel
	gbSpWx: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/goBananasSymbolsV2/wx.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/goBananasSymbolsV2/wx.json', import.meta.url).href,
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
