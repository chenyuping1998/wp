import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme, uiTheme } from 'components-ui-pixi';
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
	// 多種」): lacquer navy for everything structural, brass for the labels and
	// rules, crimson for the spin button.
	//
	// BOAT'S CONSTRUCTION (2026-10-23, user: 「uibar 的按鈕顏色參照 boat 那款的
	// 構造來重新配色」). The round controls were washi-paper discs with navy ink
	// icons (Diner's print look); now they are built the way Go Bananas Boat's
	// platform bar builds them, in this game's three colours:
	//   - a disc DARKER than the strip, so it separates on its own
	//   - a thin cool ring round it (2 units, about a third of a CSS pixel)
	//   - white mono icons with a dark contour (the family's gbIconMono set)
	//   - an ON toggle (turbo / autoplay) takes the SPIN BUTTON'S colour and a
	//     thicker ring, so "this is on" and "this is the button" read as the
	//     same kind of thing; an idle toggle stays navy with the furniture
	//   - the spin button: the one colour on the bar, on a polished brass rim
	// Boat's numbers, Boat's reasons: palette.ts and uiTheme.ts there.
	barStyle: 'flat',
	barFill: 0x13222c,
	barAlpha: 1,
	buttonFill: 0x08121a,
	buttonFillLight: 0xd9b56b,
	// the spin button when it cannot be pressed: the same crimson, unlit
	buttonFillDisabled: 0x45181e,
	buttonFillActive: 0x962e38,
	buttonBorder: 0x4f6878,
	buttonBorderWidth: 2,
	buttonBorderWidthActive: 5,
	// white on the navy disc; reaches the vector turbo bolt and the − / + glyphs
	buttonIconFill: 0xffffff,
	buttonIconStroke: 0x05090d,

	betFill: 0x962e38,
	betBorder: 0xd9b56b,

	panelFill: 0x11232c,
	panelBorder: 0x4f6878,
	labelFill: 0xd9b56b,
	balanceLabelFill: 0xd9b56b,
	// every readout the same: brass label over a cream value, one quiet rule
	winAccent: { border: 0x4f6878, label: 0xd9b56b },
	betAccent: { border: 0x4f6878, label: 0xd9b56b },
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
	// the remaining-spins badge on the spin button: a navy disc on a brass ring (Boat's)
	autoSpinsCounterFill: 0x08121a,
	autoSpinsCounterBorder: 0xd9b56b,
	autoSpinsCounterLabel: 0xf5ecd8,
	autoSpinsCounterLabelStroke: 0x05090d,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,
	// ...and it greys under the cursor, the caption and its chevron both
	// (user, 2026-10-23), in the grey the steppers turn when disabled
	labelHoverColor: 0x67645c,
	labelChevronHoverColor: 0x67645c,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,
	pressFeedback: true,

	// The platform bar's spin button has no halo (Boat, Bananubis): their
	// .CircleButton has :hover and :active states and a 125ms transition only.
	spinButtonGlow: false,

	// The readouts use Boat's clean flat casing. The rare feature-buy action
	// keeps its own ninja crest and a matching lit hover layer.
	sprites: {
		buyBonus: 'gbUiBuyBonusShuriken',
		buyBonusGlyph: 'gbUiBuyBonusShurikenLit',
	},

	// The family's white mono set, as Boat and Anubis (2026-10-04 the first time;
	// 2026-10-17 to 10-23 it was navy ink on the washi discs). UiButton draws
	// these as untinted sprites, so they are SWAPPED, not tinted. − / + and
	// turbo are not in the set: they are drawn in buttonIconFill (turbo as a
	// vector bolt that fills in when ON, which a static sprite can't do).
	icons: {
		menu: 'gbIconMonoMenu',
		menuExit: 'gbIconMonoMenuExit',
		settings: 'gbIconMonoSettings',
		info: 'gbIconMonoInfo',
		payTable: 'gbIconMonoPayTable',
		soundOn: 'gbIconMonoSoundOn',
		soundOff: 'gbIconMonoSoundOff',
		autoSpin: 'gbIconMonoAutoSpin',
		replay: 'gbIconMonoReplay',
	},

});

// A player who cannot afford the bet is TOLD SO, on every route into a bet —
// the Bet button, the spacebar and Autoplay. It used to be the uiTheme key
// betButtonMessageOnInsufficientBalance; it moved to state-shared because the
// Autoplay start button lives in a package that cannot see uiTheme. Paired with
// <ModalMessage /> in ui/Modals.svelte — without that the press would raise a
// modal this app does not render.
stateConfig.explainInsufficientBalance = true;

// Original lacquer / copper-and-glass casing. Geometry and control behaviour
// remain in the familiar compact bar; sliced caps retain their proportions.
setUiTheme({
 barStyle: 'flat', barSpriteSlice: 72,
 labelFill: 0xd9bd86, balanceLabelFill: 0xd9bd86,
 panelBorder: 0xb4945e, valueFill: 0xfff3d7,
 buttonIconFill: 0xfff8e9, buttonIconStroke: 0x06161d,
 labelFontWeight: '600', valuePop: .12, hoverHighlight: true, pressFeedback: true,
 spinButtonGlow: false,
 sprites: { ...uiTheme.sprites, bar: 'gbFeatureBar', button: 'gbFeatureButton', buttonActive: 'gbFeatureButtonActive', bet: 'gbFeatureSpin', base_ticker: 'gbFeatureTicker' },
});
