import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

// Forge bet bar: cast-iron buttons with the same brass trim as the reel housing
// and the hanging plaques, plus the game's sans typeface.
//
// Note what this palette does NOT do: it never reaches for the hot oranges the
// free-game heat grid owns. The bar is iron and brass so that when a board
// position glows, the glow means something.
// Applied once at module load (imported by Game.svelte) — the shared UI package
// otherwise keeps its plum/gold defaults for other games in the workspace.
setUiTheme({
	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x232a32,
	buttonFillLight: 0xffd75e,
	buttonFillDisabled: 0x39383a,
	// deep amber so an ON toggle (turbo / autoplay) reads as ON at a glance,
	// while still keeping enough contrast under the cream icon art
	buttonFillActive: 0x6b4a10,
	buttonBorder: 0xd8a334,
	buttonIconFill: 0xfff3bd,
	buttonIconStroke: 0x0c1014,

	betFill: 0x333c46,
	betBorder: 0xffe282,

	panelFill: 0x1e242c,
	panelBorder: 0xd8a334,
	labelFill: 0xffd75e,
	balanceLabelFill: 0xffe98a,
	// Win reads in a cool steel-blue, bet in brass, balance in warm gold: three
	// readouts tellable apart at a glance without any of them borrowing the
	// heat-grid oranges.
	winAccent: { border: 0x6fa8c4, label: 0xbfe4f5 },
	betAccent: { border: 0xc08a20, label: 0xffd0a0 },
	valueFill: 0xfff7d6,
	valueStroke: 0x0c1014,
	valueShadow: 0x05080b,

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

	// Buy Bonus stays left of the board rather than joining the strip: buying the
	// feature is an occasional, expensive, deliberate action and does not belong
	// beside the control pressed every few seconds.
	buyBonusOnRail: false,

	// Smaller than the shared default (2.4). The left rail now also carries the
	// spin ledger, which is read every spin, and the two cannot both dominate —
	// the button was taking roughly a third of the rail on its own.
	buyBonusRailScale: 1.6,

	// gold on the iron plate, matching every other caption in the game
	buyBonusLabelFill: 0xffd75e,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// ...and held-down feedback, which matters more: hover does not exist on a
	// phone, so without this a tap had no acknowledgement whatsoever until the
	// spin actually started.
	pressFeedback: true,

	// breathing glow on the spin button
	spinButtonGlow: true,

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	sprites: {
		base_ticker: 'efUiTicker',
		buyBonus: 'efUiBuyBonus',
	},

	// drawn brass icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'efIconMenu',
		menuExit: 'efIconMenuExit',
		settings: 'efIconSettings',
		info: 'efIconInfo',
		payTable: 'efIconPayTable',
		soundOn: 'efIconSoundOn',
		soundOff: 'efIconSoundOff',
		autoSpin: 'efIconAutoSpin',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});
