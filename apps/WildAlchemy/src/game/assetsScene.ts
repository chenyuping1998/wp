/**
 * Scene art (2026-11-10 delivery, new-games/wild-alchemy/art/game-ready-1110):
 * the MG / FG backdrops delivered as one layer per moving object (SPEC §3.1),
 * the board and block frames, the logo and the MG↔FG transition.
 *
 * Merged into game/assets.ts. Placement of the backdrop layers lives in
 * game/sceneLayout.json, their motion in components/SceneLife.svelte.
 *
 * Picks between a/b candidates (manifest.json ab_recommendations):
 *   logo b, transition drop a, sigil a, rays a, panel b.
 */
// Each URL is a literal: Vite rewrites a templated `new URL()` into a glob
// over src/, which cannot see static/ and yields `undefined`.
const scene = (src: string) => ({ type: 'sprite' as const, src, preload: true });

export default {
	// ── MG: the alchemist's laboratory ──────────────────────────────────────
	waSceneMgBase: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/00_base.jpg', import.meta.url).href),
	waSceneMgMoon: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/01_moon_crescent.png', import.meta.url).href),
	waSceneMgTower: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/01_far_tower.png', import.meta.url).href),
	waSceneMgBookshelf: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/02_bookshelf.png', import.meta.url).href),
	waSceneMgCauldron: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/02_cauldron.png', import.meta.url).href),
	waSceneMgDistillation: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/02_distillation_table.png', import.meta.url).href),
	waSceneMgCandlestick1: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_candlestick_1.png', import.meta.url).href),
	waSceneMgCandlestick2: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_candlestick_2.png', import.meta.url).href),
	waSceneMgCandlestick3: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_candlestick_3.png', import.meta.url).href),
	waSceneMgFlame1: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_candle_flame_1.png', import.meta.url).href),
	waSceneMgFlame2: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_candle_flame_2.png', import.meta.url).href),
	waSceneMgFlame3: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_candle_flame_3.png', import.meta.url).href),
	waSceneMgFurnace: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_furnace_grate.png', import.meta.url).href),
	waSceneMgFurnaceFlame: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/03_furnace_flame.png', import.meta.url).href),
	waSceneMgSteam: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/04_steam_plume.png', import.meta.url).href),
	waSceneMgBubbleS: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/04_bubble_small.png', import.meta.url).href),
	waSceneMgBubbleM: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/04_bubble_medium.png', import.meta.url).href),
	waSceneMgBubbleL: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/04_bubble_large.png', import.meta.url).href),
	waSceneMgDustDot: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/05_dust_dot.png', import.meta.url).href),
	waSceneMgDustFleck: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/05_dust_fleck.png', import.meta.url).href),
	waSceneMgDustDiamond: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/05_dust_diamond.png', import.meta.url).href),
	waSceneMgDustSpeck: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/05_dust_speck.png', import.meta.url).href),
	waSceneMgHerbs: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/06_herb_bundle.png', import.meta.url).href),
	waSceneMgLantern: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/06_lantern.png', import.meta.url).href),
	waSceneMgPendulum: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/06_pendulum.png', import.meta.url).href),
	waSceneMgBooks: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/07_book_pile.png', import.meta.url).href),
	waSceneMgScroll: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/07_scroll.png', import.meta.url).href),
	waSceneMgLedge: scene(new URL('../../assets/sprites/wildAlchemyScene/mg/07_table_ledge.png', import.meta.url).href),

	// ── FG: the tower top ───────────────────────────────────────────────────
	waSceneFgBase: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/00_base.jpg', import.meta.url).href),
	waSceneFgMoon: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/01_moon_full.png', import.meta.url).href),
	waSceneFgMeteor: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/01_meteor.png', import.meta.url).href),
	waSceneFgStar: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/01_star.png', import.meta.url).href),
	waSceneFgAltar: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/02_altar.png', import.meta.url).href),
	waSceneFgBalustradeL: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/02_balustrade_left.png', import.meta.url).href),
	waSceneFgBalustradeR: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/02_balustrade_right.png', import.meta.url).href),
	waSceneFgBrazierL: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/03_brazier_left.png', import.meta.url).href),
	waSceneFgBrazierR: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/03_brazier_right.png', import.meta.url).href),
	waSceneFgBrazierFlameL: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/03_brazier_flame_left.png', import.meta.url).href),
	waSceneFgBrazierFlameR: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/03_brazier_flame_right.png', import.meta.url).href),
	waSceneFgAltarSmoke: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/04_altar_smoke.png', import.meta.url).href),
	waSceneFgStar4: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/05_star_4pt.png', import.meta.url).href),
	waSceneFgStar8: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/05_star_8pt.png', import.meta.url).href),
	waSceneFgStarDash: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/05_star_dash.png', import.meta.url).href),
	waSceneFgStarDot: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/05_star_dot.png', import.meta.url).href),
	waSceneFgPennant: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/06_pennant.png', import.meta.url).href),
	waSceneFgChime: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/06_wind_chime.png', import.meta.url).href),
	waSceneFgRaven: scene(new URL('../../assets/sprites/wildAlchemyScene/fg/07_raven_on_perch.png', import.meta.url).href),

	// ── frames ──────────────────────────────────────────────────────────────
	waBoardFrame: scene(new URL('../../assets/sprites/wildAlchemyScene/frames/board.png', import.meta.url).href),
	waBlockFrameMerge: scene(new URL('../../assets/sprites/wildAlchemyScene/frames/block_frame_merge_jade.png', import.meta.url).href),
	waBlockFrameStopped: scene(new URL('../../assets/sprites/wildAlchemyScene/frames/block_frame_stopped_silver.png', import.meta.url).href),

	// ── brand ───────────────────────────────────────────────────────────────
	waLogo: scene(new URL('../../assets/sprites/wildAlchemyScene/brand/logo.png', import.meta.url).href),

	// ── MG↔FG transition ────────────────────────────────────────────────────
	waTransDrop: scene(new URL('../../assets/sprites/wildAlchemyScene/transition/transition-drop-a.png', import.meta.url).href),
	waTransSigil: scene(new URL('../../assets/sprites/wildAlchemyScene/transition/transition-sigil-a.png', import.meta.url).href),
	waTransRays: scene(new URL('../../assets/sprites/wildAlchemyScene/transition/transition-rays-a.png', import.meta.url).href),
	// the CONGRATULATIONS panel's plate (FreeSpinIntro / FreeSpinOutro have not
	// been moved onto it yet)
	waTransPanel: scene(new URL('../../assets/sprites/wildAlchemyScene/transition/transition-panel-b.png', import.meta.url).href),
} as const;
