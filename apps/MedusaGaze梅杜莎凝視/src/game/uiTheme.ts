import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';

// This app's painted marble/gold controls and teal bar retain the shared
// toolbar behaviour. Its shield and serpent spin glyph are app-owned views.
//
// Applied once at module load (imported by Game.svelte).
setUiTheme({
	fontFamily: GAME_FONT,
	// single-weight face; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	// the strip and the discs are art; these colours are what the shared parts
	// fall back to and what the vector turbo bolt is drawn in
	barStyle: 'framed',
	barHeight: 210,
	barFrameBottom: 18,
	barFill: 0x1e4950,
	barAlpha: 1,
	panelFill: 0x173a40,
	panelBorder: 0x2a1f24,

	buttonFill: 0x1e4950,
	buttonFillLight: 0xe8725e,
	buttonFillDisabled: 0x3b4648,
	buttonFillActive: 0xf2b632,
	buttonBorder: 0x2a1f24,
	// the disc art carries its own ring; ON is drawn by the lit disc
	buttonBorderWidth: 0,
	buttonIconFill: 0x071f2b,
	buttonIconStroke: 0x071f2b,
	// the gap cut round the front bolt of turbo 2, in the disc's own colour
	turboKeylineColor: 0xffe8a0,
	turboButtonScale: 1.16,
	turboIconScale: 0.58,
	railButtonScale: 1.10,
	spinScale: 0.88,

	// spin: the one solid coral thing on the strip, edged in ink
	betFill: 0xefe8d8,
	betBorder: 0xf2b632,

	// readouts: Balance and Bet in the strip's quiet marble, WIN alone in gold —
	// the number the eye goes looking for after every spin
	labelFill: 0xefe8d8,
	balanceLabelFill: 0xefe8d8,
	winAccent: { border: 0xf2b632, label: 0xffd36a },
	betAccent: { border: 0x2a1f24, label: 0xefe8d8 },
	valueFill: 0xfffaf0,
	valueStroke: 0x2a1f24,
	valueShadow: 0x120c0f,
	readoutScale: 0.82,
	readoutOffsetY: -4,
	// the status line between Win and the stepper (BarMessage.svelte sets the text)
	barMessageFill: 0xefe8d8,
	barMessageScale: 0.50,
	barMessageStroke: 0x2a1f24,
	// the Win figure swells and flashes when a win lands; Bet swells when it moves
	valuePop: 0.18,
	winFlashTint: 0xfff3c4,

	// one slim strip along the foot — the arrangement players arrive knowing
	betBarLayout: 'compactBottom',
	barSpriteSlice: 96,

	// Turbo ON = the same dark disc with the bolt filled solid, no lit plate;
	// Autoplay keeps its gold disc. Two tiers: off -> one bolt -> two bolts.
	activeByIconOnly: ['turbo'],
	turboTiers: 2,

	// − BET + in one row, the stepper as large as autospin/turbo
	stepButtonScale: 0.46,
	stepButtonGap: 28,
	stepperLayout: 'flank',
	// phone portrait: keep the menu disc and the Aegis inside both screen edges,
	// and the bet steppers big enough to hit
	portraitSideButtonX: 400,
	portraitStepButtonScale: 0.68,

	// Buy Bonus: the Aegis shield left of the board, not in the strip — buying the
	// feature is an occasional, deliberate action
	buyBonusOnRail: false,
	buyBonusButtonScale: 0.9,
	buyBonusPlateScale: 1.08,
	// the shield art fills its square; keep the hover light inside its outline
	buyBonusPlateInset: { width: 0.8, height: 0.86 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.12,
	// Hover and presses only on the shield itself, not its square canvas — a
	// transparent corner lighting the button is one of the "poor UI" findings.
	// Fractions of the plate art: the shield spans x 8–92%, y 5–95% of
	// buybonus_plate.png. Re-measure when the delivered shield replaces it.
	buyBonusHitArea: { x: 0.08, y: 0.05, width: 0.84, height: 0.9 },
	// caption on the shield's plain lower third
	buyBonusLabelFill: 0x2a1f24,
	buyBonusLabelSizeRatio: 0.42,
	buyBonusLabelWrapWidth: 90,
	buyBonusLabelOffsetY: 0.2,
	// hover swaps to the shield with Medusa's gaze lit round it
	buyBonusHoverSprite: 'buyBonusGlyph',
	buyBonusHoverSpriteTint: 0xffffff,
	buyBonusHoverSpriteBlend: 'normal',
	// unlit rather than greyed while a round runs, and back to full colour after
	// (a missing idle tint leaves the loading-time dim stuck on)
	buyBonusDisabledStyle: 'dim',
	buyBonusIdleTint: 0xffffff,
	// no offer to buy a feature beside a feature that is already running
	buyBonusHideInFreeSpins: true,

	// the Bet panel opens the stake menu when tapped; under the cursor its caption
	// and chevron light coral, the colour every hover in the game uses
	labelAffordance: true,
	labelHoverColor: 0xe8725e,
	labelChevronHoverColor: 0xe8725e,
	// hover never greys a control out: it lights in the game's own colour
	hoverHighlight: true,
	hoverPlateLight: 0xe8725e,
	pressFeedback: true,
	// no breathing halo on Spin (a flaring halo was part of a "poor UI" review)
	spinButtonGlow: false,

	// the house behaviours: a short lock on Spin after the stake changes, an idle
	// nudge on Spin, shift-key shortcuts, and panels closing when a round starts.
	// NOT hold-to-repeat on −/+: Stake's review (2026-10-04) requires one press =
	// one step, so betRepeatMs is 0.
	platformUx: {
		betRepeatMs: 0,
		betToSpinCooldownMs: 500,
		idleReminderMs: 30000,
		idlePulseMs: 2000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

	autoSpinsCounterFill: 0x1e4950,
	autoSpinsCounterBorder: 0xf2b632,
	autoSpinsCounterLabel: 0xfffaf0,
	autoSpinsCounterLabelStroke: 0x2a1f24,

	sprites: {
		bet: 'mgUiButton',
		bar: 'mgUiBarStrip',
		button: 'mgUiButton',
		buttonActive: 'mgUiButtonOn',
		base_ticker: 'mgUiTicker',
		buyBonus: 'mgUiBuyBonus',
		buyBonusGlyph: 'mgUiBuyBonusLit',
	},

	icons: {
		menu: 'mgIconMenu',
		menuExit: 'mgIconMenuExit',
		settings: 'mgIconSettings',
		info: 'mgIconInfo',
		payTable: 'mgIconPayTable',
		soundOn: 'mgIconSoundOn',
		soundOff: 'mgIconSoundOff',
		autoSpin: 'mgIconAutoSpin',
		increase: 'mgIconIncrease',
		decrease: 'mgIconDecrease',
		// turbo omitted: UiButton draws it as a vector bolt so it can be hollow
		// when off and filled (one or two bolts) when on
	},
	iconScales: { increase: 0.78, decrease: 0.78 },
});

// A player who cannot afford the bet is told so, on every route into a bet (Bet
// button, spacebar, Autoplay). Paired with <ModalMessage /> in ui/Modals.svelte.
stateConfig.explainInsufficientBalance = true;
