import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

// Night-shrine bet bar: dark jade plates with brass trim, lit warm from below,
// matching the altar the board is mounted on. Applied once at module load
// (imported by Game.svelte) — the shared UI package otherwise keeps its plum/gold
// defaults for other games in the workspace.
//
// This was a TRADING TERMINAL until now: graphite buttons with phosphor-green
// trim and a cooler teal on the bet panel, carried over from the game this one
// was scaffolded from. It was the last place that palette survived, and it was
// the most visible one — the bar is on screen every second of every session, so
// a green terminal strip under a candlelit shrine was the single loudest thing
// saying these were two different games.
//
// Colours are art-bible 2.1 by name. The one deliberate absence is spirit-cyan:
// section 2.2 reserves it for the spirits themselves so a player can pick one out
// of the corner of their eye, and a UI that borrows it spends that signal.
setUiTheme({
	fontFamily: GAME_FONT,
	// Cinzel carries a real 400-900 axis, so 700 is a true instance
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x16283a,
	buttonFillLight: 0xd9a85c,
	buttonFillDisabled: 0x2a3340,
	// lit wood so an ON toggle (turbo / autoplay) reads as ON at a glance, while
	// still keeping enough contrast under the cream icon art
	buttonFillActive: 0x6b4226,
	buttonBorder: 0xa8763e,
	buttonIconFill: 0xfff0c4,
	buttonIconStroke: 0x12202b,

	betFill: 0x122029,
	betBorder: 0xd9a85c,

	panelFill: 0x0f1a22,
	panelBorder: 0xa8763e,
	labelFill: 0xc9ae86,
	balanceLabelFill: 0xe0c9a0,
	// win reads in candle, bet in the darker brass, so the three readouts stay
	// tellable apart on one warm ramp rather than by changing hue
	winAccent: { border: 0xffcb6b, label: 0xfff0c4 },
	betAccent: { border: 0xa8763e, label: 0xe0c9a0 },
	valueFill: 0xfff3dc,
	valueStroke: 0x12202b,
	valueShadow: 0x080d14,

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

	// 30% down from the shared 2.4. Buying the feature is a deliberate, occasional
	// action - it needs to be findable, not to dominate the left of the screen.
	buyBonusRailScale: 1.68,

	// Wood-dark ink on the paper.
	//
	// Cinnabar was tried first, on the reasoning that cinnabar is what a talisman
	// is written in. On a gold ground it is legible - 4.6:1 measured - and it still
	// reads as an ALARM: red type on a control is the colour every interface in
	// the world uses for stop, and this is the button that opens the feature menu.
	// The wood-dark the frame is carved from says the same "written on paper"
	// thing without borrowing that meaning, and it measures better besides.
	buyBonusLabelFill: 0x2a1a10,

	// The plate is a talisman, not a panel: no black ground and no gold frame
	// behind it. Both are still on for every other game in the workspace.
	buyBonusPlateChrome: false,

	// The plate is drawn a third larger than the button box, so the PAPER - not the
	// box - is wide enough to carry the label.
	//
	// ── the numbers, none of them guessed ──
	//
	// buybonus_plate.png is 640x640 and its opaque pixels span x 155..460, so the
	// PAPER is 0.478 of the image's width - not the 0.70 written here before,
	// which was eyeballed and is 46% too wide. Everything downstream inherited
	// that error: the label was sized against a talisman half again as wide as the
	// real one, and the hover highlight boxed empty canvas on both sides.
	//
	// Drawn paper width  = 150 (UI_BASE_SIZE) x plateScale x 0.478
	// Usable for type    = 85% of that, leaving the painted border clear
	// Longest word       = "DISABLE", measured at 3.91 em in Cinzel 700
	//
	// At scale 1.55 the paper is 111px and the usable width 95px, so the label can
	// be 95 / 3.91 = 24.2px. 45 x 0.52 = 23.4px, which fits with a little to
	// spare; "BONUS" needs 80px and "BUY BONUS" needs 133px, so the wrap width of
	// 100 is what puts BUY and BONUS on separate lines while leaving DISABLE on
	// one. design/check_buybonus_label.mjs holds all of this.
	buyBonusPlateScale: 1.55,
	buyBonusLabelWrapWidth: 100,
	buyBonusLabelSizeRatio: 0.52,

	// What fraction of that drawn box the paper actually covers, MEASURED off
	// buybonus_plate.png's opaque bounding box. The hover highlight and the idle
	// glow are sized from this, so both hug the talisman instead of boxing the
	// empty square around it.
	buyBonusPlateInset: { width: 0.478, height: 0.853 },

	// Hug the talisman. The paper's edge is hard - measured, its alpha goes 0 to
	// 246 in one pixel, with no painted shadow to leave room for - so the
	// highlight has nothing to clear and can sit almost on it.
	buyBonusHighlightPad: 0.012,

	// Hovering lifts the plate with a translucent panel - the shared default.
	//
	// Two other ideas were tried and both were worse: lighting the incantation
	// additively, which washed out the middle of the paper AND the label sitting
	// on it, and a stroked outline, which was clean but read as a frame drawn
	// round the object rather than the object responding. The panel is quiet and
	// it is what the rest of the bar does.
	//
	// buyBonusPlateInset above is what sizes it, so it hugs the talisman rather
	// than boxing the empty square the button occupies.

	// No idle glow.
	//
	// This was added, then made visible - the first attempt drew it in the LABEL's
	// colour, which is wood-dark ink, so it was there and invisible - and then
	// turned off once it could be seen. Lit, the talisman sits in a soft rectangle
	// of light that reads as a rendering artefact against the painted board rather
	// than as a control being offered.
	//
	// The plate does not need it: it is a gold talisman on a night courtyard, which
	// is already the brightest object outside the reels.
	buyBonusIdleGlow: false,

	// Draw the resting plate at the same strength as the active one. The talisman
	// is a painted object; a dimmer copy of it reads as a rendering fault, not as
	// a state. The white border the active state adds is what distinguishes them.
	buyBonusIdleTint: 0xfff2c0,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

	// The two ACTIVE modes light the spin button for as long as they are on.
	//
	// They cost 5x and 10x of the stake on EVERY press, and nothing on the bar
	// said so - the button was identical at 1x and at 10x, and the only difference
	// was a number in a panel beside it. Charging the control the player is about
	// to press is where that belongs.
	//
	// The two are deliberately different effects and not one effect at two
	// strengths, because the player has to be able to tell WHICH is on without
	// reading anything:
	//
	//   SPIRIT TIDE   spirit-cyan, breathing a little faster, three motes circling
	//   SPIRIT FLOOD  the same light driven harder and faster, with six
	//
	// Spirit-cyan is the one place the art bible's rule bends, and on purpose:
	// 2.2 reserves it for the spirits so a player can find one by colour alone.
	// Here it IS the spirits - both modes sell a board thick with them, and the
	// button glowing in their light is the same statement the reels are making.
	spinButtonCharge: {
		ACTIVE5: { color: 0x4fd1c5, strength: 1.35, speed: 1.4, orbits: 3 },
		ACTIVE10: { color: 0x4fd1c5, strength: 1.9, speed: 2.1, orbits: 6 },
	},

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	sprites: {
		base_ticker: 'mcUiTicker',
		buyBonus: 'mcUiBuyBonus',
	},

	// drawn brass icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'mcIconMenu',
		menuExit: 'mcIconMenuExit',
		settings: 'mcIconSettings',
		info: 'mcIconInfo',
		payTable: 'mcIconPayTable',
		soundOn: 'mcIconSoundOn',
		soundOff: 'mcIconSoundOff',
		autoSpin: 'mcIconAutoSpin',
		replay: 'mcIconReplay',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});
