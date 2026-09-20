import { setUiTheme } from 'components-ui-pixi';

import {
	CHROME_LIGHT,
	CYAN,
	GOLD_ACCENT,
	INK,
	LIME,
	MAGENTA,
	VIOLET_DEEP,
	VIOLET_MID,
	WHITE_HOT,
} from './palette';
import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';

// Wild Party's bet-bar theme.
//
// This file used to set layout only, on the reasoning that the shared package's
// plum/gold defaults "ARE this game's palette". They are — the defaults were
// written from Wild Party — but that meant the game had no colour identity of
// its own: it looked like the untouched template, and any future change to the
// shared defaults would silently restyle it.
//
// So the colours are now stated here explicitly, in the Neon Y2K Disco palette
// (design/REDESIGN_NEON_Y2K.md). Nothing in packages/ changes: every value below
// is an override on this game only, which is what keeps GoBananas, Hot Miami and
// the rest rendering exactly as before.
setUiTheme({
	// ---------------------------------------------------------------------
	// Typeface
	// ---------------------------------------------------------------------
	fontFamily: GAME_FONT,
	fontWeight: GAME_FONT_WEIGHT,

	// ---------------------------------------------------------------------
	// Layout.
	//
	// sideRail splits the controls into two vertical rails (menu + Buy Bonus on
	// the left, readouts + spin pod on the right) instead of one bar across the
	// foot of the screen, handing the whole middle of the canvas back to the
	// board — which matters because the reel housing carries a wide structural
	// margin around the playfield.
	//
	// railWidth and railPanelScale were measured against the OLD ornate housing:
	// the board is 720 wide against GoBananas' 590, so that frame left ~320px a
	// side rather than ~390, and at that rail width 0.50 is the largest scale
	// where the 603px readout plate still clears the frame AND stays on canvas.
	//
	// compactBottom, NOT sideRail.
	//
	// This game was still on sideRail, which is the exact layout Stake rejected on
	// the sibling Go Bananas: "The bet control bar is unclear, hard to use or
	// doesn't conform to expected UX standards". The rail is not badly built — it
	// hands the middle of the canvas to the board — but it is unfamiliar, and
	// unfamiliar is what that comment meant. GoBananas' own uiTheme.ts records the
	// finding and the fix. Shipping the same layout again would buy the same
	// review round.
	//
	// It also happens to settle a geometry problem: the layout box is 1422 wide
	// with the board centred at x=711, so the rail centre lines sat at 161 and
	// 1261, and at SYMBOL_SIZE 144 (raised from 120 long after railWidth was
	// tuned) the housing ran underneath both of them. That collision predates the
	// reskin and disappears with the rails.
	//
	// railWidth is still meaningful under compactBottom: it places the off-strip
	// Buy Bonus on the same centre line the rail layout used.
	betBarLayout: 'compactBottom',
	railWidth: 322,
	railPanelScale: 0.5,
	buyBonusRailScale: 1.68,

	// Buying the feature is an occasional, expensive, deliberate action; it does
	// not belong beside the control pressed every few seconds. Keep it left of the
	// board rather than in the strip.
	buyBonusOnRail: false,

	// The strip's own backing, in the palette's deepest ground so the controls
	// read as sitting on hardware rather than floating on the club art.
	barFill: INK,
	barAlpha: 0.72,

	// ---------------------------------------------------------------------
	// Buttons — violet surfaces with a chrome edge, replacing plum with gold.
	// ---------------------------------------------------------------------
	buttonFill: VIOLET_DEEP,
	buttonFillLight: CYAN,
	buttonFillDisabled: 0x3a3450,
	// An active toggle (turbo, autoplay) used to be signalled by border weight
	// alone, which is not readable as a state. Fill it cyan instead — the same
	// hue this palette uses everywhere for "the machine is telling you something".
	buttonFillActive: VIOLET_MID,
	buttonBorder: CHROME_LIGHT,
	buttonIconFill: WHITE_HOT,
	buttonIconStroke: INK,

	// ---------------------------------------------------------------------
	// The spin button. It stays the loudest thing in the UI, and it is the one
	// place magenta appears at full strength on a control — nothing else in the
	// chrome-and-violet bar competes with it.
	// ---------------------------------------------------------------------
	betFill: VIOLET_MID,
	betBorder: MAGENTA,
	spinButtonGlow: true,

	// ---------------------------------------------------------------------
	// Readouts. Chrome borders, white values.
	//
	// Win is the only metric allowed gold, matching the rule in palette.ts that
	// gold means money and appears nowhere else.
	// ---------------------------------------------------------------------
	panelFill: VIOLET_DEEP,
	panelBorder: CHROME_LIGHT,
	labelFill: 0xc9b6ff,
	balanceLabelFill: CHROME_LIGHT,
	winAccent: { border: GOLD_ACCENT, label: GOLD_ACCENT },
	betAccent: { border: 0x7b8fc7, label: 0xc9b6ff },
	valueFill: WHITE_HOT,
	valueStroke: INK,
	valueShadow: 0x1a0630,

	// Buy Bonus wears the free-game colour so the association is taught before
	// the player ever buys one: lime is the feature, on the CTA and in the round.
	buyBonusLabelFill: LIME,

	// Drawn chrome icons instead of the shared package's text/emoji glyphs
	// (`≡`, `⚙`, `🔊`). Certification named those on the sibling game: an emoji
	// renders in the viewer's own system font and ignores the canvas fill, so it
	// cannot be themed — two players on different platforms see two different
	// icon sets, neither of them this game's.
	//
	// turbo is deliberately absent: UiButton draws it as a vector bolt so it can
	// be hollow when off and filled when on, which a static sprite cannot do.
	icons: {
		menu: 'wpIconMenu',
		menuExit: 'wpIconMenuExit',
		settings: 'wpIconSettings',
		info: 'wpIconInfo',
		payTable: 'wpIconPayTable',
		soundOn: 'wpIconSoundOn',
		soundOff: 'wpIconSoundOff',
		autoSpin: 'wpIconAutoSpin',
		replay: 'wpIconReplay',
	},

	// ---------------------------------------------------------------------
	// Affordances. All three default off in the shared package for games that
	// never had them; this game opts in.
	// ---------------------------------------------------------------------
	labelAffordance: true,
	hoverHighlight: true,
	pressFeedback: true,
});
