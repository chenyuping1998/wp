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

	barStyle: 'flat',
	barFill: 0x0a1720,
	barAlpha: 1,
	buttonFill: 0x0b1922,
	buttonFillLight: 0xe8c478,
	buttonFillDisabled: 0x3a3030,
	buttonFillActive: 0x962e38,
	buttonBorder: 0x667e87,
	buttonBorderWidth: 2,
	buttonBorderWidthActive: 5,
	buttonIconFill: 0xf5e8cc,
	buttonIconStroke: 0x09141b,

	betFill: 0x962e38,
	betBorder: 0xe8c478,

	panelFill: 0x11232c,
	panelBorder: 0x667e87,
	labelFill: 0xb2c5c8,
	balanceLabelFill: 0xb2c5c8,
	// win reads in jungle green, bet in a cooler brass so the three readouts
	// stay tellable apart without leaving the palette
	winAccent: { border: 0xe8c478, label: 0xf5d994 },
	betAccent: { border: 0x435e69, label: 0xb2c5c8 },
	valueFill: 0xf5e8d1,
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

	// The hover highlight is sized and shaped to the PLATE ART, so it stays inside
	// the button instead of drawing a lighter square around it.
	//
	// Measured from design/generate_ui_plates.mjs: the plate body is drawn at
	// x=10 on a 640 canvas with a 7px stroke, so its outer edge sits at 98.1% of
	// the sprite, and its corners are rx=66 — 10.3% of the sprite width, which is
	// 10.7% of the highlight's own height at this inset.
	//
	// The defaults are a 1.0 inset plus a 3% outward pad, i.e. 6% WIDER than the
	// sprite and squarer than it: that is a highlight bigger than the thing it
	// highlights on all four sides and at every corner.
	buyBonusPlateInset: { width: 0.96, height: 0.96 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.107,


	// gold on the olive plate, matching every other caption in the game
	buyBonusLabelFill: 0xf5d994,
	buyBonusIdleTint: 0xffffff,
	buyBonusDisabledTint: 0xc5cbd0,
	buyBonusDisabledFill: 0x0b1922,
	buyBonusLabelSizeRatio: 0.58,
	buyBonusLabelWrapWidth: 96,
	buyBonusHoverSprite: 'buyBonusGlyph',
	buyBonusHoverSpriteTint: 0xffffff,
	buyBonusHoverSpriteBlend: 'add',
	buyBonusFill: 0x0b1922,
	buyBonusBorder: 0xe8c478,
	buyBonusBorderWidth: 4,
	buyBonusCornerRadius: 8,
	autoSpinsCounterFill: 0x0b1922,
	autoSpinsCounterBorder: 0xe8c478,
	autoSpinsCounterLabel: 0xf5e8d1,
	autoSpinsCounterLabelStroke: 0x09141b,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,
	pressFeedback: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

	// The readouts use Boat's clean flat casing. The rare feature-buy action
	// keeps its own ninja crest and a matching lit hover layer.
	sprites: {
		buyBonus: 'gbUiBuyBonus',
		buyBonusGlyph: 'gbUiBuyBonusLit',
	},

	// drawn brass icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'gbIconMenu',
		menuExit: 'gbIconMenuExit',
		settings: 'gbIconSettings',
		info: 'gbIconInfo',
		payTable: 'gbIconPayTable',
		soundOn: 'gbIconSoundOn',
		soundOff: 'gbIconSoundOff',
		autoSpin: 'gbIconAutoSpin',
		replay: 'gbIconReplay',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});

// A player who cannot afford the bet is TOLD SO, on every route into a bet —
// the Bet button, the spacebar and Autoplay. It used to be the uiTheme key
// betButtonMessageOnInsufficientBalance; it moved to state-shared because the
// Autoplay start button lives in a package that cannot see uiTheme. Paired with
// <ModalMessage /> in ui/Modals.svelte — without that the press would raise a
// modal this app does not render.
stateConfig.explainInsufficientBalance = true;
