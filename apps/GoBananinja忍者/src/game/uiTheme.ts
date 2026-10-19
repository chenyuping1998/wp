import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';

// Boat's flat, familiar control layout in ninja lacquer, crimson and brass.
setUiTheme({
	portraitSideButtonX: 440,
	platformUx: {
		betRepeatMs: 150,
		betToSpinCooldownMs: 500,
		idleReminderMs: 30000,
		idlePulseMs: 2000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},
	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	// THREE COLOURS (2026-10-17, user: 「uibar 改得更順眼一點，顏色可以不用太
	// 多種」). The bar had grown six: navy, crimson, gold, a steel-grey border,
	// teal-grey labels and cream values, with each readout given its own accent.
	// Now:
	//   lacquer navy  the strip, the ink of every icon and keyline
	//   brass         every label, every rule, the rims, an ON toggle
	//   crimson       the spin button only — the one thing on the bar to press
	// with the values in the washi paper's cream. Round controls are washi
	// discs (Diner Monkey's construction, design/generate_bar_discs.py).
	barStyle: 'flat',
	barFill: 0x0a1720,
	barAlpha: 1,
	// fallbacks for a disc that has not loaded; the art carries the real look
	buttonFill: 0xefe4ca,
	buttonFillLight: 0xd9b56b,
	buttonFillDisabled: 0x3a4248,
	buttonFillActive: 0xd9b56b,
	buttonBorder: 0x13222c,
	// the disc art has its own rim and ring; ON is the brass disc itself
	buttonBorderWidth: 0,
	buttonBorderWidthActive: 0,
	// navy ink: reaches the vector turbo bolt, the only icon not drawn as a sprite
	buttonIconFill: 0x13222c,
	buttonIconStroke: 0xefe4ca,
	// a warm lift of the disc under the pointer, not a white film
	hoverPlateLight: 0x5a4628,

	betFill: 0x962e38,
	betBorder: 0xd9b56b,

	panelFill: 0x11232c,
	panelBorder: 0x3b4a4f,
	labelFill: 0xd9b56b,
	balanceLabelFill: 0xd9b56b,
	// every readout the same: brass label over a cream value, one quiet rule
	winAccent: { border: 0x3b4a4f, label: 0xd9b56b },
	betAccent: { border: 0x3b4a4f, label: 0xd9b56b },
	valueFill: 0xf5ecd8,
	valueStroke: 0x09141b,
	valueShadow: 0x050a0e,
	valuePop: 0.18,
	winFlashTint: 0xf5d994,

	// One slim strip along the foot, the arrangement players arrive already
	// knowing. The side-rail version it replaces maximised board size — the rails
	// ate horizontal space the board was not using — but that is exactly why it
	// read as unfamiliar, which is what certification meant by "does not conform
	// to expected UX standards".
	//
	// To go back: 'sideRail'. LayoutSideRail is untouched and still wired up, so
	// this one word is the whole revert. It can also be overridden at run time
	// without rebuilding — see the localStorage note in UIDefault.svelte.
	betBarLayout: 'compactBottom',

	// Buy Bonus stays left of the board at its old size rather than joining the
	// strip: buying the feature is an occasional, expensive, deliberate action and
	// does not belong beside the control pressed every few seconds.
	buyBonusOnRail: false,

	// 20% smaller than the template default. The whole control, not just the
	// picture: box, hit area, plate and label together.
	buyBonusButtonScale: 0.8,

	// Keep the lacquer and red cord recognisable even while a spin disables it.
	buyBonusDisabledStyle: 'dim',

	// THE BUY BONUS IS A THROWING STAR (2026-10-16, to Boat's and Boomana's
	// standard: the button is an object from the game, the caption is painted on
	// it, the art is larger than the box, and the hover does the object's own
	// thing). design/generate_buy_shuriken.mjs draws it; its comment has the
	// caption clear-zone arithmetic these numbers belong to.
	//
	// Four swept blades, so it SPINS under the pointer — buyBonusHoverRotate
	// turns the plate and the lit layer on one clock while the words stay level.
	// 180 deg/s: the star repeats every 90 deg, so that is two visual turns a
	// second, quick enough to read as thrown and slow enough not to strobe.
	buyBonusHoverRotate: 180,
	// The 800 canvas holds the star with margin for its shadow and the hover
	// bloom; 1.25 draws it at 640/800 of the art per box, so the hub and words
	// are the size they were and the blades reach toward the box's corners.
	// The PICTURE grows, not the hit area.
	buyBonusPlateScale: 1.25,
	// only the unused 'outline' hover style reads these - set so they are right
	buyBonusPlateInset: { width: 0.94, height: 0.94 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.5,

	// brass-gold on the lacquer hub, matching every other caption in the game
	buyBonusLabelFill: 0xf5d994,
	buyBonusIdleTint: 0xffffff,
	// steel stays steel when off: light enough that it is still the same star,
	// with the caption's 55% fade carrying most of "not now"
	buyBonusDisabledTint: 0xaab3ba,
	buyBonusDisabledFill: 0x0b1922,
	// KEEP IN STEP with HUB_IN in design/generate_buy_shuriken.mjs
	buyBonusLabelSizeRatio: 0.58,
	buyBonusLabelWrapWidth: 94,
	// a SLOT name (resolved through sprites below), drawn additively
	buyBonusHoverSprite: 'buyBonusGlyph',
	buyBonusHoverSpriteTint: 0xffffff,
	buyBonusHoverSpriteBlend: 'add',
	buyBonusFill: 0x0b1922,
	buyBonusBorder: 0xe8c478,
	buyBonusBorderWidth: 4,
	buyBonusCornerRadius: 8,
	// the remaining-spins badge on the spin button: washi with a brass edge
	autoSpinsCounterFill: 0xefe4ca,
	autoSpinsCounterBorder: 0xd9b56b,
	autoSpinsCounterLabel: 0x13222c,
	autoSpinsCounterLabelStroke: 0xefe4ca,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,
	pressFeedback: true,

	// The platform bar's spin button has no halo (Boat, Bananubis): their
	// .CircleButton has :hover and :active states and a 125ms transition only.
	spinButtonGlow: false,

	// The readouts use Boat's clean flat casing. The rare feature-buy action
	// keeps its own ninja crest and a matching lit hover layer.
	sprites: {
		button: 'gbUiButtonWashi',
		buttonActive: 'gbUiButtonWashiOn',
		buyBonus: 'gbUiBuyBonusShuriken',
		buyBonusGlyph: 'gbUiBuyBonusShurikenLit',
	},

	// (2026-10-04 these were swapped to the family's white mono set to match
	// Anubis and Boat; 2026-10-17 they became ink on washi with the discs.)
	// UiButton draws these as untinted sprites, so they are SWAPPED, not tinted.
	// navy ink on the washi discs (Diner's print icon shapes, re-inked).
	// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
	// be hollow when off and fill in when active — a static sprite can't toggle
	icons: {
		menu: 'gbIconInkMenu',
		menuExit: 'gbIconInkMenuExit',
		settings: 'gbIconInkSettings',
		info: 'gbIconInkInfo',
		payTable: 'gbIconInkPayTable',
		soundOn: 'gbIconInkSoundOn',
		soundOff: 'gbIconInkSoundOff',
		autoSpin: 'gbIconInkAutoSpin',
		replay: 'gbIconInkReplay',
		increase: 'gbIconInkIncrease',
		decrease: 'gbIconInkDecrease',
	},
	// the − / + bars span 55% of their canvas: 0.78 makes them 43% of the disc
	iconScales: { increase: 0.78, decrease: 0.78 },

});

// A player who cannot afford the bet is TOLD SO, on every route into a bet —
// the Bet button, the spacebar and Autoplay. It used to be the uiTheme key
// betButtonMessageOnInsufficientBalance; it moved to state-shared because the
// Autoplay start button lives in a package that cannot see uiTheme. Paired with
// <ModalMessage /> in ui/Modals.svelte — without that the press would raise a
// modal this app does not render.
stateConfig.explainInsufficientBalance = true;
