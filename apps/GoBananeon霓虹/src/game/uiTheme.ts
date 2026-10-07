import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';

// Jungle-commando bet bar: deep olive-canvas buttons with the same brass trim
// as the reel frame and the free-spin plaques, plus the game's sans typeface.
// Applied once at module load (imported by Game.svelte) — the shared UI package
// otherwise keeps its plum/gold defaults for other games in the workspace.
setUiTheme({
	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x101b35,
	buttonFillLight: 0x45e9ff,
	buttonFillDisabled: 0x30354d,
	// deep amber so an ON toggle (turbo / autoplay) reads as ON at a glance,
	// while still keeping enough contrast under the cream icon art
	buttonFillActive: 0x6436ac,
	buttonBorder: 0x39dfff,
	buttonIconFill: 0xf6eaff,
	buttonIconStroke: 0x11152b,

	betFill: 0x172443,
	betBorder: 0x46dcff,

	panelFill: 0x101831,
	panelBorder: 0x714de3,
	labelFill: 0x65e9ff,
	balanceLabelFill: 0xffd94c,
	// win reads in jungle green, bet in a cooler brass so the three readouts
	// stay tellable apart without leaving the palette
	winAccent: { border: 0xff3fc7, label: 0xff9fe9 },
	betAccent: { border: 0x46d9f4, label: 0xa3f1ff },
	valueFill: 0xfff6fd,
	valueStroke: 0x11152b,
	valueShadow: 0x050919,

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

	// Unlit rather than greyed. The olive plate went pale under the template's
	// grey tint and read as a placeholder panel dropped over the jungle, with the
	// gold caption still at full brightness on top of it.
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
	buyBonusLabelFill: 0x8eebff,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

	// PHONE PORTRAIT: the menu disc and the Buy Bonus plate sat at ±470 and ran
	// off both screen edges (the menu lost a third of its disc). ±440 keeps
	// both inside with ~30 units to spare and still clears turbo/autoplay.
	portraitSideButtonX: 440,
	// The bet -/+ were 27 CSS px on a 390-wide phone; 0.68 makes them ~37 and
	// leaves a visible gap to the spin button and to autoplay/turbo (0.72 all
	// but touched autoplay, checked in the sandbox 2026-09-27).
	portraitStepButtonScale: 0.68,
	// the same pair on the desktop strip: 28px -> 36px, the gap widened with it
	// so the two plates do not touch
	stepButtonScale: 0.36,
	stepButtonGap: 28,

	// the Win figure swells and flashes gold when a win lands; the Bet figure
	// swells when the stake moves
	valuePop: 0.18,
	winFlashTint: 0xff58cd,

	// Hacksaw's house behaviours (see the shared theme): hold -/+ to keep
	// stepping, a short lock on the spin button after the stake changes so a
	// press cannot bet an amount not yet seen, an idle nudge on the spin button,
	// shift-key shortcuts, and panels closing when a round starts.
	platformUx: {
		betRepeatMs: 150,
		betToSpinCooldownMs: 500,
		idleReminderMs: 30000,
		idlePulseMs: 2000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	sprites: {
		base_ticker: 'gbUiTicker',
		buyBonus: 'gbUiBuyBonus',
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

// The game bar and its DOM modals share the same neon skin.
export const uiSkin = 'neon';
if (typeof document !== 'undefined') document.documentElement.dataset.uiSkin = uiSkin;

setUiTheme({
  barStyle: 'flat',
  barFill: 0x0c132b,
  barAlpha: 0.96,
  panelFill: 0x111a35,
  panelBorder: 0x319bd1,
  buttonFill: 0x101b35,
  buttonFillLight: 0x4be5fa,
  buttonFillDisabled: 0x303954,
  buttonFillActive: 0x692fb2,
  buttonBorder: 0x42d9f2,
  buttonBorderWidth: 2,
  buttonBorderWidthActive: 4,
  buttonIconFill: 0xf8fcff,
  buttonIconStroke: 0x10152b,
  betFill: 0xf7a832,
  betBorder: 0xffd35f,
  labelFill: 0xb5eafa,
  balanceLabelFill: 0xb5eafa,
  winAccent: { border: 0xff4fd5, label: 0xffa5ec },
  betAccent: { border: 0x44cceb, label: 0x9bedff },
  valueFill: 0xfffaff,
  valueStroke: 0x0d1530,
  valueShadow: 0x050919,
  sprites: { base_ticker: 'gbUiTicker', buyBonus: 'gbUiBuyBonus', buyBonusGlyph: 'gbUiBuyBonusLit' },
  // HOVER: THE PLATE CHARGES UP (GoBoomana's mechanism: its stone slab split
  // with light leaking out). Under the cursor violet lightning forks out of
  // the banana emblem across the plate, the emblem blazes and the neon rim
  // flares, the same charge the reels take before a Pulse Bomb goes off
  // (design/generate_buybonus_lit.mjs). Additive: the plate is dark, so it
  // reads as the plate itself lighting up. A SLOT name, not an asset key:
  // UiSprite resolves it through `sprites`.
  buyBonusHoverSprite: 'buyBonusGlyph',
  buyBonusHoverSpriteTint: 0xffffff,
  buyBonusHoverSpriteBlend: 'add',
  buyBonusLabelFill: 0xffffff,
  buyBonusLabelSizeRatio: 0.68,
  buyBonusLabelWrapWidth: 110,
  buyBonusPlateScale: 1.0,
  buyBonusPlateInset: { width: 0.92, height: 0.92 },
  buyBonusHighlightPad: 0,
  buyBonusHighlightRadius: 0.11,
  buyBonusDisabledStyle: 'dim',
  buyBonusDisabledTint: 0x9db3d3,
  buyBonusIdleTint: 0xffffff,
  buyBonusFill: 0x0f1a3a,
  buyBonusBorder: 0xff4fd5,
  buyBonusBorderWidth: 4,
  buyBonusCornerRadius: 18,
  autoSpinsCounterFill: 0x152044,
  autoSpinsCounterBorder: 0x4bdaf2,
  autoSpinsCounterLabel: 0xffffff,
  autoSpinsCounterLabelStroke: 0x10152b,
  spinButtonGlow: true,
  hoverHighlight: true,
  pressFeedback: true,
  icons: {
    menu: 'gbIconMonoMenu', menuExit: 'gbIconMonoMenuExit',
    settings: 'gbIconMonoSettings', info: 'gbIconMonoInfo',
    payTable: 'gbIconMonoPayTable', soundOn: 'gbIconMonoSoundOn',
    soundOff: 'gbIconMonoSoundOff', autoSpin: 'gbIconMonoAutoSpin',
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
