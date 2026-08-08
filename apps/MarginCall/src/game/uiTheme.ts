import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

// Trading-terminal bet bar: graphite buttons with the same phosphor trim
// as the reel frame and the free-spin plaques, plus the game's sans typeface.
// Applied once at module load (imported by Game.svelte) — the shared UI package
// otherwise keeps its plum/gold defaults for other games in the workspace.
setUiTheme({
	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x16211c,
	buttonFillLight: 0x4bd67f,
	buttonFillDisabled: 0x2c3733,
	// deep amber so an ON toggle (turbo / autoplay) reads as ON at a glance,
	// while still keeping enough contrast under the cream icon art
	buttonFillActive: 0x143f2a,
	buttonBorder: 0x4bd67f,
	buttonIconFill: 0xd6ffe4,
	buttonIconStroke: 0x06120c,

	betFill: 0x122019,
	betBorder: 0x3fd0d4,

	panelFill: 0x101a16,
	panelBorder: 0x4bd67f,
	labelFill: 0x8fe6b0,
	balanceLabelFill: 0xa8f0c4,
	// win reads in phosphor green, bet in a cooler teal so the three readouts
	// stay tellable apart without leaving the palette
	winAccent: { border: 0x4bd67f, label: 0xd6ffe4 },
	betAccent: { border: 0x3fd0d4, label: 0xb6f2f4 },
	valueFill: 0xeafff2,
	valueStroke: 0x06120c,
	valueShadow: 0x030806,

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

	// gold on the olive plate, matching every other caption in the game
	buyBonusLabelFill: 0xf7a83a,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

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
