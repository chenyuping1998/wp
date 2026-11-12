import assetsHud from './assetsHud';
import assetsScene from './assetsScene';

// The asset registry. Every entry here is Wild Alchemy's own art; the
// inherited Hard Time keys (prison backdrops, plates, icons, win banners,
// splash titles, searchlight beam, the prisoner / warden cast and its Spine
// rigs) were removed on 2026-11-11 together with their files, after checking
// each key had no reader. HUD / bet-bar / big-win art lives in assetsHud.ts,
// backdrops, frames, logo and transition in assetsScene.ts.
//
// The `hm*` symbol keys keep their old names on purpose: the art behind them
// is this game's (sprites/wildAlchemy/symbols), and constants.ts, the pay
// table and the buy card all address the symbols by these keys.
export default {
	// A blank, non-paying card. Only reference-book replays use it: the reference
	// game's `B` symbol belonged to a card-flip bonus this game does not have.
	waBlank: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/blank.png', import.meta.url).href,
		preload: true,
	},
	// soft-falloff FX textures — every particle in the game is one of these,
	// tinted and drawn additively
	fxGlow: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemyFx/fx_glow.png', import.meta.url).href,
		preload: true,
	},
	fxStar: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemyFx/fx_star.png', import.meta.url).href,
		preload: true,
	},
	fxStreak: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemyFx/fx_streak.png', import.meta.url).href,
		preload: true,
	},
	fxVignette: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemyFx/fx_vignette.png', import.meta.url).href,
		preload: true,
	},
	// WILD conversion (art/game-ready-1110 keyed fx picks: mist a, seal b,
	// success ring a): the fog patch over each person, the failure seal, the
	// gold flame ring round a new WILD
	fxMist: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemyFx/fx_mist.png', import.meta.url).href,
		preload: true,
	},
	fxSeal: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemyFx/fx_seal.png', import.meta.url).href,
		preload: true,
	},
	fxSuccessRing: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemyFx/fx_success_ring.png', import.meta.url).href,
		preload: true,
	},
	// ── symbols (sprites/wildAlchemy/symbols) ───────────────────────────────
	hmH1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/h1.png', import.meta.url).href,
		preload: true,
	},
	hmH2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/h2.png', import.meta.url).href,
		preload: true,
	},
	hmH3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/h3.png', import.meta.url).href,
		preload: true,
	},
	hmH4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/h4.png', import.meta.url).href,
		preload: true,
	},
	hmL1: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/l1.png', import.meta.url).href,
		preload: true,
	},
	hmL2: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/l2.png', import.meta.url).href,
		preload: true,
	},
	hmL3: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/l3.png', import.meta.url).href,
		preload: true,
	},
	hmL4: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/l4.png', import.meta.url).href,
		preload: true,
	},
	hmW: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/w_h1.png', import.meta.url).href,
		preload: true,
	},
	// One WILD card per person: a WILD is always a converted person, and the card
	// is that person as a gilded statue (book cells carry `from`). `hmW` above is
	// the Master Adept's card and doubles as the generic WILD in the pay table.
	waWH1: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemy/symbols/w_h1.png', import.meta.url).href, preload: true },
	waWH2: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemy/symbols/w_h2.png', import.meta.url).href, preload: true },
	waWH3: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemy/symbols/w_h3.png', import.meta.url).href, preload: true },
	waWH4: { type: 'sprite', src: new URL('../../assets/sprites/wildAlchemy/symbols/w_h4.png', import.meta.url).href, preload: true },
	hmS: {
		type: 'sprite',
		src: new URL('../../assets/sprites/wildAlchemy/symbols/s.png', import.meta.url).href,
		preload: true,
	},

	// The cast as Spine 4.3 rigs (spine-motion-kit, 2026-11-10): design/build_game_cast.py
	// packs each figure's drawings into one sheet; frames are wa43mg_* / wa43fg_*.
	// The rigs themselves (castSpine43/<who>/cast.json) are fetched by game/castRig43.ts.
	waCast43Alchemist: {
		type: 'sprites',
		src: new URL('../../assets/castSpine43/alchemist/cast_atlas.json', import.meta.url).href,
		preload: true,
	},
	waCast43Homunculus: {
		type: 'sprites',
		src: new URL('../../assets/castSpine43/homunculus/cast_atlas.json', import.meta.url).href,
		preload: true,
	},

	// Drawn by design/build_coin_sheet.py: a twelve-frame coin spin for the
	// win-coin particles.
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/coin.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
	...assetsHud,
	...assetsScene,
} as const;
