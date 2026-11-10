import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';
import geometry from './artGeometry.json';

// Dragon Tide (art/gen-order-1109): a jade strip edged in gold with wave-scroll ends, jade
// discs with one gold rim, cream lettering inked in deep jade. Gold is the accent (WIN, hover);
// red stays reserved for the red pearl, the palace gate and the big wins.
const JADE = 0x4f938a, JADE_DEEP = 0x24524d, JADE_INK = 0x16302d, GOLD = 0xe8b84a, CREAM = 0xfff2d6;
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
	barFill: JADE_DEEP,
	barAlpha: 1,
	panelFill: JADE_DEEP,
	panelBorder: JADE_INK,

	buttonFill: JADE,
	buttonFillLight: 0x7cc0b4,
	buttonFillDisabled: 0x5d6e6b,
	buttonFillActive: 0x5fae9f,
	buttonBorder: GOLD,
	// All round controls share one jade face and a single gold edge.
	buttonBorderWidth: 6,
	buttonBorderWidthActive: 6,
	buttonIconFill: CREAM,
	buttonIconStroke: JADE_INK,
	// The cut around Turbo 2's front bolt matches the disc's jade face.
	turboKeylineColor: JADE,
	turboButtonScale: 1.16,
	turboIconScale: 0.58,
	railButtonScale: 1.10,
	spinScale: 0.88,

	// spin: the jade disc, its gold rim the only edge
	betFill: JADE,
	betBorder: GOLD,

	// readouts: Balance and Bet in cream on the jade, WIN alone in gold —
	// the number the eye goes looking for after every spin
	labelFill: CREAM,
	balanceLabelFill: CREAM,
	winAccent: { border: GOLD, label: 0xffd36a },
	betAccent: { border: JADE_INK, label: CREAM },
	valueFill: 0xfffaf0,
	valueStroke: JADE_INK,
	valueShadow: 0x0c1c1a,
	readoutScale: 0.82,
	readoutOffsetY: -4,
	// the status line between Win and the stepper (BarMessage.svelte sets the text)
	barMessageFill: CREAM,
	barMessageScale: 0.50,
	barMessageStroke: JADE_INK,
	// the Win figure swells and flashes when a win lands; Bet swells when it moves
	valuePop: 0.18,
	winFlashTint: 0xfff3c4,

	// one slim strip along the foot — the arrangement players arrive knowing
	betBarLayout: 'compactBottom',
	// the wave-scroll ends stay whole; measured on the strip by build_final_art.py
	barSpriteSlice: geometry.bar.slice,
	// the section rules end inside the jade well (it is the middle 44% of the strip)
	barRuleInset: Math.round((0.5 - geometry.bar.panel.h / 2) * (210 - 18)) + 6,

	// Turbo ON fills the bolt; autoplay brightens its jade face.
	// Two turbo tiers: off -> one bolt -> two bolts.
	activeByIconOnly: ['turbo'],
	turboTiers: 2,

	// − BET + in one row, the stepper as large as autospin/turbo
	stepButtonScale: 0.46,
	stepButtonGap: 28,
	stepperLayout: 'flank',
	// phone portrait: keep the menu disc and the gate inside both screen edges,
	// and the bet steppers big enough to hit
	portraitSideButtonX: 400,
	portraitStepButtonScale: 0.68,

	// Buy Bonus: the palace gate left of the board, not in the strip — buying the
	// feature is an occasional, deliberate action
	buyBonusOnRail: false,
	buyBonusButtonScale: 0.9,
	buyBonusPlateScale: 0.92,
	// keep the hover light inside the gate's outline
	buyBonusPlateInset: { width: 0.8, height: 0.86 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.12,
	// Hover and presses only on the gate itself, not its square canvas — a
	// transparent corner lighting the button is one of the "poor UI" findings.
	// Fractions of the plate art (buybonus.png, the palace gate): x 0–100%, y 11–89%.
	buyBonusHitArea: { x: 0.0, y: 0.11, width: 1.0, height: 0.78 },
	// caption on the gate's plain jade plaque
	buyBonusLabelFill: CREAM,
	buyBonusLabelSizeRatio: 0.42,
	buyBonusLabelWrapWidth: 90,
	buyBonusLabelOffsetY: 0.2,
	// hover swaps to the same gate drawn lit
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
	// and chevron light gold, the colour every hover in the game uses
	labelAffordance: true,
	labelHoverColor: 0xffd36a,
	labelChevronHoverColor: 0xffd36a,
	// hover never greys a control out: it lights in the game's own colour
	hoverHighlight: true,
	// Hover lights the same single-edge artwork, without adding an inner ring.
	hoverPlateLight: 0x9fe0d2,
	pressFeedback: true,
	// no breathing halo on Spin (a flaring halo was part of a "poor UI" review)
	spinButtonGlow: false,

	// the house behaviours: a short lock on Spin after the stake changes, shift-key shortcuts, and panels closing when a round starts.
	// NOT hold-to-repeat on −/+: Stake's review (2026-10-04) requires one press =
	// one step, so betRepeatMs is 0.
	platformUx: {
		betRepeatMs: 0,
		betToSpinCooldownMs: 500,
		idleReminderMs: 0,
		idlePulseMs: 2000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

	autoSpinsCounterFill: JADE_DEEP,
	autoSpinsCounterBorder: GOLD,
	autoSpinsCounterLabel: 0xfffaf0,
	autoSpinsCounterLabelStroke: JADE_INK,

	sprites: {
		// jade discs, one gold rim; the lit disc is the same plate brighter (ON / active)
		bar: 'mgUiBarStrip',
		// Transparent margin keeps adjacent mobile faces apart without shrinking hit areas.
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
	iconScales: { increase: 0.78, decrease: 0.78, autoSpin: 0.70 },
});

// A player who cannot afford the bet is told so, on every route into a bet (Bet
// button, spacebar, Autoplay). Paired with <ModalMessage /> in ui/Modals.svelte.
stateConfig.explainInsufficientBalance = true;
